<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DriverMonthlyCompletedCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_completed_count_rolls_over_by_supplier_local_month_without_deleting_history(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-15 12:00:00', 'UTC'));
        $supplier = Supplier::create([
            'company_name' => 'Synthetic Monthly Count',
            'slug' => 'monthly-count-'.Str::random(8),
            'country_code' => 'TR',
            'timezone' => 'Europe/Istanbul',
            'status' => 'approved',
            'is_active' => true,
        ]);
        $driver = User::factory()->create([
            'role' => 'driver',
            'supplier_id' => $supplier->id,
            'is_active' => true,
        ]);

        foreach ([
            '2026-10-31 20:59:59',
            '2026-10-31 21:00:00',
            '2026-11-30 20:59:59',
            '2026-11-30 21:00:00',
        ] as $time) {
            Transfer::create([
                'supplier_id' => $supplier->id,
                'driver_id' => $driver->id,
                'booking_reference' => 'SF-MONTH-'.Str::random(10),
                'supplier' => 'Synthetic',
                'passenger_name' => 'Synthetic Passenger',
                'pickup' => 'Hotel',
                'dropoff' => 'Airport',
                'pickup_time' => $time,
                'status' => 'completed',
            ]);
        }

        Sanctum::actingAs($driver);

        $this->getJson('/driver/dashboard')
            ->assertOk()
            ->assertJsonPath('data.completedThisMonth', 2);

        $this->travelTo(CarbonImmutable::parse('2026-11-30 21:00:00', 'UTC'));

        $this->getJson('/driver/dashboard')
            ->assertOk()
            ->assertJsonPath('data.completedThisMonth', 1);
        $this->getJson('/driver/transfers')
            ->assertOk()
            ->assertJsonCount(4, 'data');
        $this->assertDatabaseCount('transfers', 4);
    }
}
