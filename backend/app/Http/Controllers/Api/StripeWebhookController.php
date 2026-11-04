<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook as StripeWebhook;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe webhook events for transfer request payments. This is
     * the authoritative path for marking a request as paid, independent of
     * whether the customer's browser makes it back to the success page.
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = (string) $request->header('Stripe-Signature');
        $webhookSecret = (string) config('services.stripe.webhook_secret');

        if ($webhookSecret === '') {
            Log::warning('Stripe webhook secret is not configured; accepting payload without signature verification.');
        }

        try {
            $event = $webhookSecret !== ''
                ? StripeWebhook::constructEvent($payload, $signature, $webhookSecret)
                : json_decode($payload, false, 512, JSON_THROW_ON_ERROR);
        } catch (SignatureVerificationException|\Throwable $exception) {
            Log::warning('Stripe webhook signature verification failed.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        if (($event->type ?? null) === 'checkout.session.completed') {
            $this->markSessionAsPaid($event->data->object);
        }

        return response()->json(['received' => true]);
    }

    private function markSessionAsPaid(object $session): void
    {
        $transferRequest = TransferRequest::query()
            ->where('stripe_checkout_session_id', $session->id)
            ->first();

        if (!$transferRequest || $transferRequest->payment_status === TransferRequest::PAYMENT_STATUS_PAID) {
            return;
        }

        if (($session->payment_status ?? null) !== 'paid') {
            return;
        }

        $transferRequest->update([
            'payment_status' => TransferRequest::PAYMENT_STATUS_PAID,
            'stripe_payment_intent_id' => is_string($session->payment_intent ?? null)
                ? $session->payment_intent
                : ($session->payment_intent->id ?? null),
            'paid_amount' => isset($session->amount_total) ? $session->amount_total / 100 : null,
            'paid_currency' => isset($session->currency) ? strtoupper($session->currency) : null,
            'paid_at' => now(),
        ]);
    }
}
