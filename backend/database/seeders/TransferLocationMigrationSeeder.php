<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\LocationPoint;
use App\Models\Transfer;
use Illuminate\Database\Seeder;

class TransferLocationMigrationSeeder extends Seeder
{
    public function run(): void
    {
        $istanbulAirport = Location::query()
            ->where('code', 'IST')
            ->firstOrFail();

        $internationalArrivals = LocationPoint::query()
            ->where('location_id', $istanbulAirport->id)
            ->where('code', 'INT-ARRIVALS')
            ->firstOrFail();

        $transfer = Transfer::query()
            ->where('booking_reference', 'SF-23935')
            ->firstOrFail();

        $transfer->update([
            'pickup_location_id' =>
                $istanbulAirport->id,

            'pickup_point_id' =>
                $internationalArrivals->id,

            // Taksim henüz Location Engine içinde
            // oluşturulmadığı için bu alanlar boş kalıyor.
            'dropoff_location_id' => null,
            'dropoff_point_id' => null,
        ]);
    }
}