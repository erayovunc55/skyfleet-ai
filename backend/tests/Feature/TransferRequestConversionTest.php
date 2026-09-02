<?php

namespace Tests\Feature;

use App\Models\TransferRequest;
use App\Models\User;
use App\Services\GeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class TransferRequestConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirmed_request_is_converted_only_once(): void
    {
        $dispatcher = User::factory()->create([
            'role' => 'dispatcher', 'is_active' => true, 'phone' => '+10000000081',
        ]);
        Sanctum::actingAs($dispatcher);

        $geocoding = Mockery::mock(GeocodingService::class);
        $geocoding->shouldReceive('geocode')->twice()->andReturn(null);
        $this->app->instance(GeocodingService::class, $geocoding);

        $transferRequest = TransferRequest::query()->create([
            'request_reference' => 'STR-20260826-CONV01',
            'status' => 'confirmed',
            'pickup' => 'Istanbul Airport', 'dropoff' => 'City Hotel',
            'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul', 'passengers' => 2, 'luggage_count' => 2,
            'passenger_name' => 'Conversion Test', 'passenger_phone' => '+905551112233',
            'passenger_email' => 'conversion@example.com', 'locale' => 'en',
            'source' => 'public_website',
        ]);

        $payload = ['supplier' => 'Skytrip Transfer', 'price' => 45, 'currency' => 'EUR', 'vehicle_type' => 'Minivan'];

        $this->postJson("/api/admin/transfer-requests/{$transferRequest->id}/convert", $payload)
            ->assertCreated()
            ->assertJsonPath('data.booking_reference', 'STR-20260826-CONV01')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('transfers', [
            'booking_reference' => 'STR-20260826-CONV01',
            'ota_source' => 'public_website',
            'status' => 'pending',
        ]);

        $this->postJson("/api/admin/transfer-requests/{$transferRequest->id}/convert", $payload)
            ->assertConflict();

        $this->assertDatabaseCount('transfers', 1);
    }

    public function test_saved_address_coordinates_are_used_without_geocoding(): void
    {
        $dispatcher = User::factory()->create([
            'role' => 'dispatcher',
            'is_active' => true,
            'phone' => '+10000000082',
        ]);
        Sanctum::actingAs($dispatcher);

        $geocoding = Mockery::mock(GeocodingService::class);
        $geocoding->shouldNotReceive('geocode');
        $this->app->instance(GeocodingService::class, $geocoding);

        $transferRequest = TransferRequest::query()->create([
            'request_reference' => 'STR-20260902-COORD1',
            'status' => 'confirmed',
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
            'passengers' => 2,
            'luggage_count' => 2,
            'passenger_name' => 'Coordinate Test',
            'passenger_phone' => '+905551112244',
            'passenger_email' => 'coordinates@example.com',
            'locale' => 'en',
            'source' => 'public_website',
        ]);

        $payload = [
            'supplier' => 'Skytrip Transfer',
            'price' => 45,
            'currency' => 'EUR',
            'vehicle_type' => 'Minivan',
        ];

        $this->postJson(
            "/api/admin/transfer-requests/{$transferRequest->id}/convert",
            $payload
        )->assertCreated()
            ->assertJsonPath('warnings', []);

        $this->assertDatabaseHas('transfers', [
            'booking_reference' => 'STR-20260902-COORD1',
            'pickup_lat' => 41.275278,
            'pickup_lng' => 28.751944,
            'dropoff_lat' => 41.005415,
            'dropoff_lng' => 28.976813,
        ]);
    }
}
