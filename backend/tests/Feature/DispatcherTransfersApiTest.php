<?php

namespace Tests\Feature;

use App\Models\Transfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DispatcherTransfersApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatcher_transfers_endpoint_returns_ordered_transfers(): void
    {
        $user = User::factory()->create([
            'phone' => '+10000000000',
        ]);
        Sanctum::actingAs($user);

        $driver = User::factory()->create([
            'name' => 'Driver One',
            'phone' => '+1234567895',
        ]);
        $earlierTransfer = Transfer::create([
            'driver_id' => $driver->id,
            'booking_reference' => 'SF-2026-100',
            'ota_source' => 'manual',
            'supplier' => 'Test Supplier',
            'passenger_name' => 'Test Passenger',
            'passenger_phone' => '+1234567890',
            'passenger_email' => 'passenger@example.com',
            'flight_number' => 'TK 123',
            'airline' => 'Turkish Airlines',
            'terminal' => 'I',
            'pickup' => 'IST Airport',
            'pickup_lat' => 41.2753,
            'pickup_lng' => 28.7519,
            'dropoff' => 'City Hotel',
            'dropoff_lat' => 41.0115,
            'dropoff_lng' => 28.9824,
            'pickup_time' => now()->addHour(),
            'meet_point' => 'Gate 3',
            'driver_note' => null,
            'passenger_note' => null,
            'adult' => 1,
            'child' => 0,
            'baby' => 0,
            'luggage_count' => 1,
            'vehicle_type' => 'Sedan',
            'price' => 120.00,
            'currency' => 'EUR',
            'status' => 'pending',
        ]);

        $laterTransfer = Transfer::create([
            'driver_id' => $driver->id,
            'booking_reference' => 'SF-2026-101',
            'ota_source' => 'manual',
            'supplier' => 'Test Supplier',
            'passenger_name' => 'Another Passenger',
            'passenger_phone' => '+1234567891',
            'passenger_email' => 'another@example.com',
            'flight_number' => 'BA 456',
            'airline' => 'British Airways',
            'terminal' => 'B',
            'pickup' => 'City Hotel',
            'pickup_lat' => 41.0115,
            'pickup_lng' => 28.9824,
            'dropoff' => 'IST Airport',
            'dropoff_lat' => 41.2753,
            'dropoff_lng' => 28.7519,
            'pickup_time' => now()->addHours(2),
            'meet_point' => 'Lobby',
            'driver_note' => null,
            'passenger_note' => null,
            'adult' => 2,
            'child' => 0,
            'baby' => 0,
            'luggage_count' => 2,
            'vehicle_type' => 'SUV',
            'price' => 200.00,
            'currency' => 'EUR',
            'status' => 'assigned',
        ]);

        $response = $this->getJson('/api/dispatcher/transfers');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'voucher',
                    'booking_reference',
                    'passenger_name',
                    'passenger_phone',
                    'flight_number',
                    'pickup_location',
                    'dropoff_location',
                    'pickup_time',
                    'driver_id',
                    'driver_name',
                    'supplier',
                    'supplier_id',
                    'status',
                    'created_at',
                    'pickup_location_id',
                    'dropoff_location_id',
                    'driver',
                    'operation_summary' => [
                        'driver_status',
                        'vehicle_status',
                        'last_gps_at',
                        'today_transfer_count',
                        'today_completed_count',
                    ],
                ],
            ],
        ]);

        $response->assertJsonPath('data.0.id', $earlierTransfer->id);
        $response->assertJsonPath('data.1.id', $laterTransfer->id);
        $response->assertJsonPath('data.0.driver_name', 'Driver One');
    }
}
