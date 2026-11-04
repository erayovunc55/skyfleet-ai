<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use App\Services\AirportTaxiPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Stripe\Checkout\Session as StripeCheckoutSession;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class PublicTransferRequestController extends Controller
{
    public function store(Request $request, AirportTaxiPricingService $pricing): JsonResponse
    {
        $validated = $request->validate([
            'quote_token' => ['nullable', 'string', 'max:12000'],
            'pickup' => ['required', 'string', 'max:1000'],
            'pickup_place_id' => ['nullable', 'string', 'max:255'],
            'pickup_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_with:pickup_lng',
            ],
            'pickup_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_with:pickup_lat',
            ],
            'dropoff' => ['required', 'string', 'max:1000'],
            'dropoff_place_id' => ['nullable', 'string', 'max:255'],
            'dropoff_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_with:dropoff_lng',
            ],
            'dropoff_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_with:dropoff_lat',
            ],
            'pickup_date' => ['required', 'date', 'after_or_equal:today'],
            'pickup_time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'timezone'],
            'flight_number' => ['nullable', 'string', 'max:50'],
            'passengers' => ['required', 'integer', 'min:1', 'max:100'],
            'luggage_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'passenger_name' => ['required', 'string', 'max:255'],
            'passenger_phone' => ['required', 'string', 'max:50'],
            'passenger_email' => ['required', 'email:rfc', 'max:255'],
            'note' => ['nullable', 'string', 'max:3000'],
            'locale' => ['nullable', 'string', Rule::in(['en', 'tr'])],
            'terms_accepted' => ['accepted'],
        ]);

        $snapshot = !empty($validated['quote_token'])
            ? $pricing->validateQuote($validated['quote_token'], $validated)
            : null;

        $requiresPayment = $snapshot && is_numeric($snapshot['public_price'] ?? null) && (float) $snapshot['public_price'] > 0;

        $transferRequest = TransferRequest::query()->create([
            ...collect($validated)->except(['terms_accepted', 'quote_token'])->all(),
            'pricing_snapshot' => $snapshot,
            'request_reference' => $this->newReference(),
            'status' => TransferRequest::STATUS_NEW,
            'payment_status' => $requiresPayment
                ? TransferRequest::PAYMENT_STATUS_PENDING
                : TransferRequest::PAYMENT_STATUS_NOT_REQUIRED,
            'luggage_count' => $validated['luggage_count'] ?? 0,
            'locale' => $validated['locale'] ?? 'en',
            'source' => 'public_website',
        ]);

        if (!$requiresPayment) {
            return response()->json([
                'message' => 'Transfer request received.',
                'data' => [
                    'request_reference' => $transferRequest->request_reference,
                    'status' => $transferRequest->status,
                    'payment_required' => false,
                ],
            ], 201);
        }

        try {
            $checkoutUrl = $this->createCheckoutSession($transferRequest, $snapshot);
        } catch (ApiErrorException|\InvalidArgumentException $exception) {
            Log::error('Stripe checkout session could not be created.', [
                'request_reference' => $transferRequest->request_reference,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Transfer request received, but the payment link could not be created. Our team will contact you.',
                'data' => [
                    'request_reference' => $transferRequest->request_reference,
                    'status' => $transferRequest->status,
                    'payment_required' => true,
                    'checkout_url' => null,
                ],
            ], 201);
        }

        return response()->json([
            'message' => 'Transfer request received. Complete payment to confirm your booking.',
            'data' => [
                'request_reference' => $transferRequest->request_reference,
                'status' => $transferRequest->status,
                'payment_required' => true,
                'checkout_url' => $checkoutUrl,
            ],
        ], 201);
    }

    /**
     * Create a Stripe Checkout session for the priced transfer request and
     * persist the session id so the webhook/confirmation step can locate it.
     */
    private function createCheckoutSession(TransferRequest $transferRequest, array $snapshot): string
    {
        $stripe = new StripeClient(config('services.stripe.secret'));
        $frontendUrl = rtrim((string) config('services.frontend.url'), '/');
        $currency = strtolower((string) ($snapshot['currency'] ?? 'eur'));
        $amount = (int) round(((float) $snapshot['public_price']) * 100);

        /** @var StripeCheckoutSession $session */
        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'customer_email' => $transferRequest->passenger_email,
            'client_reference_id' => $transferRequest->request_reference,
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'unit_amount' => $amount,
                    'product_data' => [
                        'name' => sprintf('Airport Transfer: %s → %s', $transferRequest->pickup, $transferRequest->dropoff),
                        'description' => sprintf(
                            '%s %s · %s passenger(s)',
                            $transferRequest->pickup_date,
                            $transferRequest->pickup_time,
                            $transferRequest->passengers,
                        ),
                    ],
                ],
            ]],
            'metadata' => [
                'transfer_request_id' => (string) $transferRequest->id,
                'request_reference' => $transferRequest->request_reference,
            ],
            'success_url' => $frontendUrl.'/booking-success?type=transfer&reference='
                .urlencode($transferRequest->request_reference).'&session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $frontendUrl.'/transfer?payment=cancelled&reference='
                .urlencode($transferRequest->request_reference),
        ]);

        $transferRequest->update([
            'stripe_checkout_session_id' => $session->id,
        ]);

        return $session->url;
    }

    private function newReference(): string
    {
        do {
            $reference = 'STR-'.now()->format('Ymd').'-'
                .Str::upper(Str::random(6));
        } while (
            TransferRequest::query()
                ->where('request_reference', $reference)
                ->exists()
        );

        return $reference;
    }
}
