<?php

namespace Database\Seeders;

use App\Models\Transfer;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $driver = User::updateOrCreate(
            ['phone' => '5339179669'],
            [
                'name' => 'Eray Ovunc',
                'email' => 'eray@skyfleet.test',
                'password' => '123456',
                'role' => 'driver',
                'is_active' => true,
                'vehicle_plate' => '34 NS 8526',
                'supplier' => 'SkyTrip Transfer',
            ],
        );

        Transfer::updateOrCreate(
            ['booking_reference' => 'SF-23935'],
            [
                'driver_id' => $driver->id,
                'ota_source' => 'manual',
                'supplier' => 'SkyTrip Transfer',
                'passenger_name' => 'John Smith',
                'passenger_phone' => '+447700900123',
                'passenger_email' => 'john@example.com',
                'flight_number' => 'TK1987',
                'airline' => 'Turkish Airlines',
                'terminal' => 'International Arrivals',
                'pickup' => 'Istanbul Airport',
                'pickup_lat' => 41.2753,
                'pickup_lng' => 28.7519,
                'dropoff' => 'Taksim, Istanbul',
                'dropoff_lat' => 41.0369,
                'dropoff_lng' => 28.9850,
                'pickup_time' => '2026-07-18 07:30:00',
                'meet_point' => 'Gate 14, arrival hall',
                'driver_note' => 'Passenger has a welcome sign.',
                'passenger_note' => 'VIP passenger',
                'adult' => 3,
                'child' => 0,
                'baby' => 0,
                'luggage_count' => 3,
                'vehicle_type' => 'Mercedes Vito',
                'price' => 58.03,
                'currency' => 'EUR',
                'status' => 'pending',
            ],
        );
    }
}
