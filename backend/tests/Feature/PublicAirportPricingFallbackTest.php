<?php

namespace Tests\Feature;

use App\Services\RegionalPricingService;
use App\Services\RoutingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Mockery\MockInterface;
use Tests\TestCase;

class PublicAirportPricingFallbackTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Schema::create('countries', function (Blueprint $table): void {
            $table->id();
            $table->string('iso2');
            $table->boolean('is_active');
        });
        Schema::create('airports', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('country_id');
            $table->string('iata_code');
            $table->string('timezone');
            $table->boolean('is_active');
            $table->json('metadata');
            $table->double('latitude');
            $table->double('longitude');
        });
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('airport_id');
            $table->string('timezone');
            $table->boolean('is_active');
            $table->boolean('is_public');
            $table->double('latitude');
            $table->double('longitude');
            $table->softDeletes();
        });
        DB::table('countries')->insert(['id' => 1, 'iso2' => 'TR', 'is_active' => true]);
        DB::table('airports')->insert([
            'id' => 4745, 'country_id' => 1, 'iata_code' => 'IST',
            'timezone' => 'Europe/Istanbul', 'is_active' => true,
            'metadata' => json_encode(['scheduled_service' => 'yes']),
            'latitude' => 41.2626742, 'longitude' => 28.743779,
        ]);
        DB::table('locations')->insert([
            'id' => 4745, 'airport_id' => 4745, 'timezone' => 'Europe/Istanbul',
            'is_active' => true, 'is_public' => true,
            'latitude' => 41.2626742, 'longitude' => 28.743779,
        ]);
        config(['taxi_pricing.tariffs' => []]);
        $this->mock(RegionalPricingService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('calculate')->andReturn(['available' => false, 'suppliers' => []]);
        });
    }

    private function input(): array
    {
        return [
            'latitude' => 41.0364373, 'longitude' => 28.9863444,
            'direction' => 'pickup', 'vehicle_type' => 'executive_people_carrier',
            'airport_location_id' => 4745, 'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '16:00', 'passengers' => 2, 'luggage_count' => 0,
            'display_currency' => 'EUR',
        ];
    }

    public function test_missing_taxi_tariff_requires_manual_quote_without_distance_estimate(): void
    {
        $this->mock(RoutingService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('route');
        });
        $this->postJson('/public/regional-pricing', $this->input())
            ->assertOk()->assertJsonPath('available', false)
            ->assertJsonPath('reason', 'verified_tariff_unavailable')
            ->assertJsonPath('manual_quote_available', true)->assertJsonMissingPath('public_price');
    }

    public function test_missing_route_does_not_invent_a_price(): void
    {
        config(['taxi_pricing.tariffs' => [[
            'id' => 'test-metered', 'enabled' => true, 'type' => 'metered',
            'airports' => ['IST'], 'directions' => ['pickup'], 'currency' => 'EUR',
            'verified_at' => now()->toDateString(), 'base' => 10, 'per_km' => 2,
            'source_url' => 'https://example.test/taxi-tariff',
            'zone' => ['latitude' => 41.0364373, 'longitude' => 28.9863444, 'radius_km' => 10],
        ]]]);
        $this->mock(RoutingService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('route')->once()->andReturn(null);
        });
        $this->postJson('/public/regional-pricing', $this->input())
            ->assertOk()->assertJsonPath('available', false)
            ->assertJsonPath('manual_quote_available', true)->assertJsonMissingPath('public_price');
    }

    public function test_local_taxi_reference_uses_the_configured_vehicle_multiplier(): void
    {
        config([
            'taxi_pricing.tariffs' => [[
                'id' => 'test-fixed', 'enabled' => true, 'type' => 'fixed',
                'airports' => ['IST'], 'directions' => ['pickup'], 'currency' => 'EUR',
                'verified_at' => now()->toDateString(), 'amount' => 100,
                'source_url' => 'https://example.test/taxi-tariff',
                'zone' => ['latitude' => 41.0364373, 'longitude' => 28.9863444, 'radius_km' => 10],
            ]],
            'pricing_engine.dynamic.enabled' => false,
            'pricing_engine.vehicle_multipliers.executive_people_carrier' => 1.65,
        ]);
        $this->mock(RoutingService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('route');
        });
        $this->postJson('/public/regional-pricing', $this->input())
            ->assertOk()->assertJsonPath('available', true)
            ->assertJsonPath('pricing_source', 'taxi_reference')
            ->assertJsonPath('public_price', 165)
            ->assertJsonPath('currency', 'EUR');
    }
}
