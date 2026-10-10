<?php

namespace App\Console\Commands;

use App\Models\Airport;
use App\Models\Location;
use App\Models\LocationType;
use App\Services\AirportTaxiPricingService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncPublicAirportLocations extends Command
{
    protected $signature = 'skyfleet:sync-public-airport-locations';

    protected $description =
        'Create or update public airport locations for enabled Skyfleet airport markets.';

    public function handle(
        AirportTaxiPricingService $pricing
    ): int {
        $airportTypeId =
            LocationType::query()
                ->where(
                    'code',
                    'airport'
                )
                ->value('id');

        if (!$airportTypeId) {
            $this->error(
                'Airport location type not found.'
            );

            return self::FAILURE;
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;

        $airports =
            $pricing
                ->scopeMarkets(
                    Airport::query()
                )
                ->with([
                    'country',
                    'city',
                ])
                ->orderBy('id')
                ->get();

        foreach (
            $airports
            as $airport
        ) {
            try {
                if (
                    !$airport->country_id
                    ||
                    !$airport->city_id
                ) {
                    $skipped++;

                    continue;
                }

                if (
                    $airport->latitude === null
                    ||
                    $airport->longitude === null
                ) {
                    $skipped++;

                    continue;
                }

                $location =
                    Location::query()
                        ->where(
                            'airport_id',
                            $airport->id
                        )
                        ->first();

                $slugBase =
                    Str::slug(
                        $airport->iata_code
                        . '-'
                        . $airport->name
                    );

                $payload = [
                    'location_type_id' =>
                        $airportTypeId,

                    'country_id' =>
                        $airport->country_id,

                    'city_id' =>
                        $airport->city_id,

                    'airport_id' =>
                        $airport->id,

                    'name' =>
                        $airport->name,

                    'native_name' =>
                        $airport->name,

                    'slug' =>
                        $slugBase,

                    'code' =>
                        $airport->iata_code,

                    'address' =>
                        $airport->name,

                    'latitude' =>
                        $airport->latitude,

                    'longitude' =>
                        $airport->longitude,

                    'timezone' =>
                        $airport->timezone
                        ?: $airport
                            ->city
                            ?->timezone
                        ?: $airport
                            ->country
                            ?->default_timezone
                        ?: 'UTC',

                    'is_active' =>
                        true,

                    'is_public' =>
                        true,

                    'sort_order' =>
                        $airport->sort_order
                        ?? 0,

                    'metadata' => [
                        'source' =>
                            'airport_master',

                        'iata_code' =>
                            $airport->iata_code,

                        'icao_code' =>
                            $airport->icao_code,

                        'airport_type' =>
                            $airport
                                ->metadata[
                                    'airport_type'
                                ]
                            ?? null,

                        'scheduled_service' =>
                            $airport
                                ->metadata[
                                    'scheduled_service'
                                ]
                            ?? null,
                    ],
                ];

                if ($location) {
                    $location->update(
                        $payload
                    );

                    $updated++;
                } else {
                    Location::query()
                        ->create(
                            $payload
                        );

                    $created++;
                }
            } catch (
                \Throwable $exception
            ) {
                report(
                    $exception
                );

                $failed++;

                $this->warn(
                    sprintf(
                        '%s (%s) failed: %s',
                        $airport->name,
                        $airport->iata_code,
                        $exception->getMessage()
                    )
                );
            }
        }

        $this->info(
            sprintf(
                'Public airport locations synced. Created: %d, Updated: %d, Skipped: %d, Failed: %d',
                $created,
                $updated,
                $skipped,
                $failed
            )
        );

        return
            $failed > 0
                ? self::FAILURE
                : self::SUCCESS;
    }
}