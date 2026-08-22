<?php

namespace App\Console\Commands;

use App\Models\Airport;
use App\Models\City;
use App\Models\Country;
use App\Models\Location;
use Illuminate\Console\Command;

class ApplyAirportMetroOverrides extends Command
{
    protected $signature = 'airport-master:metro-overrides';

    protected $description = 'Apply operational metro-city overrides to airports and linked locations.';

    public function handle(): int
    {
        $overrides = [
            'SAW' => [
                'country' => 'TR',
                'city' => 'İstanbul',
            ],
        ];

        $updated = 0;
        $skipped = 0;

        foreach ($overrides as $iata => $target) {
            $country = Country::query()
                ->where('iso2', $target['country'])
                ->first();

            if (!$country) {
                $this->warn("{$iata}: country {$target['country']} not found.");
                $skipped++;
                continue;
            }

            $city = City::query()
                ->where('country_id', $country->id)
                ->where(function ($query) use ($target) {
                    $query->where('name', $target['city'])
                        ->orWhere('native_name', $target['city']);
                })
                ->orderBy('id')
                ->first();

            if (!$city) {
                $this->warn("{$iata}: target city {$target['city']} not found.");
                $skipped++;
                continue;
            }

            $airport = Airport::query()
                ->where('iata_code', $iata)
                ->first();

            if (!$airport) {
                $this->warn("{$iata}: airport not found.");
                $skipped++;
                continue;
            }

            $airport->update([
                'country_id' => $country->id,
                'city_id' => $city->id,
            ]);

            $locationCount = Location::query()
                ->where('airport_id', $airport->id)
                ->update([
                    'country_id' => $country->id,
                    'city_id' => $city->id,
                ]);

            $this->info("{$iata} -> {$target['city']} applied ({$locationCount} linked location updated).");
            $updated++;
        }

        $this->newLine();
        $this->table(
            ['Updated', 'Skipped'],
            [[$updated, $skipped]]
        );

        return self::SUCCESS;
    }
}
