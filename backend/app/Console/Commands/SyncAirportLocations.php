<?php

namespace App\Console\Commands;

use App\Models\Airport;
use App\Models\Location;
use App\Models\LocationType;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncAirportLocations extends Command
{
    protected $signature = 'airport-master:sync-locations {--radius=15000 : Default service/geofence radius in meters}';

    protected $description = 'Create or update public airport location records from the global airport master.';

    public function handle(): int
    {
        $airportType = LocationType::query()
            ->where('code', LocationType::AIRPORT)
            ->first();

        if (!$airportType) {
            $this->error('Airport location type was not found. Run the location type seed/migration first.');
            return self::FAILURE;
        }

        $radius = max(0, min(500000, (int) $this->option('radius')));
        $created = 0;
        $updated = 0;
        $skipped = 0;

        Airport::query()
            ->where('is_active', true)
            ->whereNotNull('country_id')
            ->whereNotNull('city_id')
            ->orderBy('id')
            ->chunkById(250, function ($airports) use ($airportType, $radius, &$created, &$updated, &$skipped): void {
                foreach ($airports as $airport) {
                    $code = strtoupper(trim((string) ($airport->iata_code ?: $airport->icao_code)));
                    $name = trim((string) $airport->name);

                    if ($name === '' || $code === '') {
                        $skipped++;
                        continue;
                    }

                    $location = Location::withTrashed()
                        ->where('airport_id', $airport->id)
                        ->first();

                    if (!$location && $airport->iata_code) {
                        $location = Location::withTrashed()
                            ->where('code', strtoupper($airport->iata_code))
                            ->where('city_id', $airport->city_id)
                            ->first();
                    }

                    $payload = [
                        'location_type_id' => $airportType->id,
                        'country_id' => $airport->country_id,
                        'city_id' => $airport->city_id,
                        'airport_id' => $airport->id,
                        'name' => $name,
                        'native_name' => $location?->native_name,
                        'code' => $code,
                        'address' => $location?->address,
                        'latitude' => $airport->latitude,
                        'longitude' => $airport->longitude,
                        'geofence_radius_meters' => $location?->geofence_radius_meters ?: $radius,
                        'timezone' => $airport->timezone,
                        'is_public' => true,
                        'is_active' => true,
                        'sort_order' => $location?->sort_order ?? 0,
                        'metadata' => array_merge($location?->metadata ?? [], [
                            'source' => 'airport_master',
                            'airport_master_synced' => true,
                        ]),
                    ];

                    if ($location) {
                        if ($location->trashed()) {
                            $location->restore();
                        }
                        $location->update($payload);
                        $updated++;
                        continue;
                    }

                    $baseSlug = Str::slug($airport->iata_code ?: $airport->icao_code ?: $name);
                    if ($baseSlug === '') {
                        $baseSlug = 'airport-' . $airport->id;
                    }

                    $slug = $baseSlug;
                    $suffix = 2;
                    while (Location::withTrashed()->where('slug', $slug)->exists()) {
                        $slug = $baseSlug . '-' . $suffix;
                        $suffix++;
                    }

                    Location::create(array_merge($payload, [
                        'slug' => $slug,
                    ]));
                    $created++;
                }
            });

        $this->newLine();
        $this->info('Airport locations synchronized.');
        $this->table(
            ['Created', 'Updated', 'Skipped', 'Locations'],
            [[
                $created,
                $updated,
                $skipped,
                Location::query()->where('location_type_id', $airportType->id)->count(),
            ]]
        );

        return self::SUCCESS;
    }
}
