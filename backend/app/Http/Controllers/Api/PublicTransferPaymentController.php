<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class PublicTransferPaymentController extends Controller
{
    /**
     * Confirm a Stripe Checkout session right after the customer is redirected
     * back from the hosted payment page. Acts as a fast, user-facing
     * confirmation; the webhook remains the source of truth for reliability.
     */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'string', 'max:255'],
        ]);

        $transferRequest = TransferRequest::query()
            ->where('stripe_checkout_session_id', $validated['session_id'])
            ->first();

        if (!$transferRequest) {
            return response()->json([
                'message' => 'We could not find a transfer request for this payment session.',
            ], 404);
        }

        if ($transferRequest->payment_status !== TransferRequest::PAYMENT_STATUS_PAID) {
            try {
                $stripe = new StripeClient(config('services.stripe.secret'));
                $session = $stripe->checkout->sessions->retrieve($validated['session_id']);

                if ($session->payment_status === 'paid') {
                    $transferRequest->update([
                        'payment_status' => TransferRequest::PAYMENT_STATUS_PAID,
                        'stripe_payment_intent_id' => is_string($session->payment_intent)
                            ? $session->payment_intent
                            : ($session->payment_intent->id ?? null),
                        'paid_amount' => $session->amount_total !== null
                            ? $session->amount_total / 100
                            : null,
                        'paid_currency' => $session->currency
                            ? strtoupper($session->currency)
                            : null,
                        'paid_at' => now(),
                    ]);
                }
            } catch (ApiErrorException|\InvalidArgumentException $exception) {
                Log::error('Stripe checkout session could not be verified.', [
                    'session_id' => $validated['session_id'],
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $transferRequest->refresh();

        return response()->json([
            'data' => [
                'request_reference' => $transferRequest->request_reference,
                'payment_status' => $transferRequest->payment_status,
                'paid_amount' => $transferRequest->paid_amount,
                'paid_currency' => $transferRequest->paid_currency,
                'pickup' => $transferRequest->pickup,
                'dropoff' => $transferRequest->dropoff,
                'pickup_date' => $transferRequest->pickup_date?->toDateString(),
                'pickup_time' => $transferRequest->pickup_time,
                'vehicle_type' => $transferRequest->vehicle_type,
            ],
        ]);
    }
}
