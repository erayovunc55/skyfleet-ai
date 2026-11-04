<?php

namespace Tests\Feature;

use App\Services\AirportTaxiPricingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery\MockInterface;
use Tests\TestCase;

class PublicRegionalPricingControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
        });
        DB::table('locations')->insert(['id' => 4745]);
    }

    private function input(): array
    {
        return [
            'latitude' => 41.0364373,
            'longitude' => 28.9863444,
            'direction' => 'pickup',
            'vehicle_type' => 'executive_people_carrier',
            'airport_location_id' => 4745,
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '16:00',
            'passengers' => 2,
            'luggage_count' => 0,
            'display_currency' => 'eur',
        ];
    }

    public function test_public_pricing_uses_airport_quote_service_and_returns_website_price(): void
    {
        $expected = [...$this->input(), 'display_currency' => 'EUR'];
        $this->mock(AirportTaxiPricingService::class, function (MockInterface $mock) use ($expected): void {
            $mock->shouldReceive('quote')->once()->with($expected)->andReturn([
                'available' => true,
                'public_price' => 100.00,
                'currency' => 'EUR',
                'quote_token' => 'test-quote',
            ]);
        });

        $this->postJson('/public/regional-pricing', [
            ...$this->input(),
            'supplier_cost' => 1,
            'taxi_reference' => 1,
        ])->assertOk()
            ->assertJsonPath('available', true)
            ->assertJsonPath('public_price', 100)
            ->assertJsonPath('currency', 'EUR')
            ->assertJsonPath('quote_token', 'test-quote');
    }

    public function test_unmapped_airport_is_rejected_before_quoting(): void
    {
        $this->mock(AirportTaxiPricingService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('quote');
        });
        $this->postJson('/public/regional-pricing', [
            ...$this->input(), 'airport_location_id' => 99999,
        ])->assertUnprocessable()->assertJsonValidationErrors('airport_location_id');
    }

    public function test_manual_quote_response_is_preserved(): void
    {
        $this->mock(AirportTaxiPricingService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('quote')->once()->andReturn([
                'available' => false,
                'manual_quote_available' => true,
                'manual_quote_required' => true,
                'reason' => 'pricing_unavailable',
            ]);
        });
        $this->postJson('/public/regional-pricing', $this->input())
            ->assertOk()->assertJsonPath('available', false)
            ->assertJsonPath('manual_quote_available', true);
    }
}
