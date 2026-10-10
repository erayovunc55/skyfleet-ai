<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\PublicTransferRequestController;
use App\Models\TransferRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use ReflectionMethod;
use Tests\TestCase;

class StripeCheckoutSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_checkout_session_throws_cleanly_without_a_configured_key(): void
    {
        // Force the "not configured" scenario regardless of the local .env,
        // since this test asserts the defensive fallback behaviour.
        Config::set('services.stripe.secret', '');

        $transferRequest = $this->makeTransferRequest();
        $snapshot = ['public_price' => 45.50, 'currency' => 'EUR'];

        $controller = new PublicTransferRequestController();
        $method = new ReflectionMethod($controller, 'createCheckoutSession');
        $method->setAccessible(true);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('api_key cannot be the empty string');

        $method->invoke($controller, $transferRequest, $snapshot);
    }

    public function test_store_falls_back_gracefully_when_stripe_is_not_configured(): void
    {
        Config::set('services.stripe.secret', '');

        $response = $this->postJson('/public/transfer-requests', $this->priceQuotedPayload());

        $response->assertCreated()
            ->assertJsonPath('data.payment_required', true)
            ->assertJsonPath('data.checkout_url', null);

        $this->assertDatabaseHas('transfer_requests', [
            'request_reference' => $response->json('data.request_reference'),
            'payment_status' => 'pending',
        ]);
    }

    public function test_store_creates_a_real_stripe_checkout_session_when_configured(): void
    {
        if (!config('services.stripe.secret')) {
            $this->markTestSkipped('STRIPE_SECRET_KEY is not configured in this environment.');
        }

        $response = $this->postJson('/public/transfer-requests', $this->priceQuotedPayload());

        $response->assertCreated()
            ->assertJsonPath('data.payment_required', true);

        $checkoutUrl = $response->json('data.checkout_url');
        $this->assertStringStartsWith('https://checkout.stripe.com/', $checkoutUrl);

        $this->assertDatabaseHas('transfer_requests', [
            'request_reference' => $response->json('data.request_reference'),
            'payment_status' => 'pending',
        ]);

        $transferRequest = TransferRequest::query()
            ->where('request_reference', $response->json('data.request_reference'))
            ->firstOrFail();

        $this->assertNotNull($transferRequest->stripe_checkout_session_id);
        $this->assertStringStartsWith('cs_', $transferRequest->stripe_checkout_session_id);
    }

    private function makeTransferRequest(): TransferRequest
    {
        return TransferRequest::query()->create([
            'request_reference' => 'STR-TEST-STRIPE',
            'status' => 'new',
            'payment_status' => 'pending',
            'pickup' => 'Istanbul Airport',
            'dropoff' => 'Sultanahmet Hotel',
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'passengers' => 2,
            'luggage_count' => 1,
            'passenger_name' => 'Test',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'test@example.com',
            'locale' => 'en',
            'source' => 'public_website',
        ]);
    }

    private function priceQuotedPayload(): array
    {
        $quote = [
            'version' => 3,
            'direction' => 'pickup',
            'vehicle_type' => 'Sedan',
            'passengers' => '2',
            'luggage_count' => '1',
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'airport_latitude' => 41.275278,
            'airport_longitude' => 28.751944,
            'latitude' => 41.005415,
            'longitude' => 28.976813,
            'display_currency' => 'EUR',
            'currency' => 'EUR',
            'base_currency' => 'EUR',
            'public_price' => 45.50,
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
        ];

        $quoteToken = Crypt::encryptString(json_encode($quote));

        return [
            'quote_token' => $quoteToken,
            'pickup' => 'Istanbul Airport',
            'pickup_lat' => 41.275278,
            'pickup_lng' => 28.751944,
            'dropoff' => 'Sultanahmet Hotel',
            'dropoff_lat' => 41.005415,
            'dropoff_lng' => 28.976813,
            'pickup_date' => $quote['pickup_date'],
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'passengers' => 2,
            'luggage_count' => 1,
            'vehicle_type' => 'Sedan',
            'passenger_name' => 'Test Passenger',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'passenger@example.com',
            'locale' => 'en',
            'terms_accepted' => true,
        ];
    }
}
