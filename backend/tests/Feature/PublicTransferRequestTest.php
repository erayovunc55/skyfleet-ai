<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicTransferRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_transfer_request_is_stored_separately(): void
    {
        $response = $this->postJson('/api/public/transfer-requests', [
            'pickup' => 'Istanbul Airport',
            'pickup_place_id' => 'geoapify-pickup-id',
            'pickup_lat' => 41.275278,
            'pickup_lng' => 28.751944,
            'dropoff' => 'Sultanahmet Hotel',
            'dropoff_place_id' => 'geoapify-dropoff-id',
            'dropoff_lat' => 41.005415,
            'dropoff_lng' => 28.976813,
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'flight_number' => 'TK 123',
            'passengers' => 2,
            'luggage_count' => 2,
            'vehicle_type' => 'Sedan',
            'passenger_name' => 'Test Passenger',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'passenger@example.com',
            'note' => 'Child seat requested.',
            'locale' => 'en',
            'terms_accepted' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'new')
            ->assertJsonStructure([
                'message',
                'data' => ['request_reference', 'status'],
            ]);

        $reference = $response->json('data.request_reference');
        $this->assertMatchesRegularExpression(
            '/^STR-\d{8}-[A-Z0-9]{6}$/',
            $reference
        );

        $this->assertDatabaseHas('transfer_requests', [
            'request_reference' => $reference,
            'status' => 'new',
            'source' => 'public_website',
            'passenger_email' => 'passenger@example.com',
            'pickup_place_id' => 'geoapify-pickup-id',
            'pickup_lat' => 41.275278,
            'pickup_lng' => 28.751944,
            'dropoff_place_id' => 'geoapify-dropoff-id',
            'dropoff_lat' => 41.005415,
            'dropoff_lng' => 28.976813,
        ]);

        $this->assertDatabaseCount('transfers', 0);
    }

    public function test_address_coordinates_must_be_submitted_as_pairs(): void
    {
        $response = $this->postJson('/api/public/transfer-requests', [
            'pickup' => 'Istanbul Airport',
            'pickup_lat' => 41.275278,
            'dropoff' => 'Sultanahmet Hotel',
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'passengers' => 2,
            'passenger_name' => 'Test Passenger',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'passenger@example.com',
            'terms_accepted' => true,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('pickup_lng');

        $this->assertDatabaseCount('transfer_requests', 0);
    }
}
