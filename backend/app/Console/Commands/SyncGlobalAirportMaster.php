<?php

namespace App\Console\Commands;

use App\Models\Airport;
use App\Models\City;
use App\Models\Country;
use DateTimeZone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SyncGlobalAirportMaster extends Command
{
    protected $signature = 'airport-master:sync {--all : Include airports without an IATA code}';

    protected $description = 'Synchronize the global airport master from the public-domain OurAirports dataset.';

    private const COUNTRIES_URL = 'https://davidmegginson.github.io/ourairports-data/countries.csv';
    private const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

    private array $timezoneCache = [];
    private array $cityIndex = [];

    public function handle(): int
    {
        $this->info('Downloading global country master...');
        $countryCsv = $this->download(self::COUNTRIES_URL);
        $countryMap = $this->syncCountries($countryCsv);

        $mergedCities = $this->repairDuplicateCityAliases();
        if ($mergedCities > 0) {
            $this->info("Merged {$mergedCities} duplicate city alias record(s).");
        }

        $this->info('Downloading global airport master...');
        $airportCsv = $this->download(self::AIRPORTS_URL);
        [$created, $updated, $skipped] = $this->syncAirports(
            $airportCsv,
            $countryMap,
            (bool) $this->option('all')
        );

        $this->newLine();
        $this->info('Global airport master synchronized.');
        $this->table(
            ['Created', 'Updated', 'Skipped', 'Countries', 'Cities', 'Airports'],
            [[
                $created,
                $updated,
                $skipped,
                Country::count(),
                City::count(),
                Airport::count(),
            ]]
        );

        return self::SUCCESS;
    }

    private function download(string $url): string
    {
        $response = Http::connectTimeout(20)
            ->timeout(180)
            ->retry(3, 1500)
            ->get($url);

        if (!$response->successful()) {
            throw new RuntimeException("Unable to download airport master data from {$url}.");
        }

        return $response->body();
    }

    private function syncCountries(string $csv): array
    {
        $map = [];

        foreach ($this->csvRows($csv) as $row) {
            $code = strtoupper(trim((string) ($row['code'] ?? '')));
            $name = trim((string) ($row['name'] ?? ''));

            if ($code === '' || $name === '') {
                continue;
            }

            $country = Country::query()->where('iso2', $code)->first();

            if (!$country) {
                $country = Country::create([
                    'iso2' => $code,
                    'name' => $name,
                    'is_active' => true,
                    'sort_order' => 0,
                    'metadata' => [
                        'source' => 'ourairports',
                        'continent' => $row['continent'] ?? null,
                    ],
                ]);
            } elseif (!$country->is_active) {
                $country->update(['is_active' => true]);
            }

            $map[$code] = $country;
        }

        return $map;
    }

    private function syncAirports(string $csv, array $countryMap, bool $includeAll): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $cityCache = [];

        foreach ($this->csvRows($csv) as $row) {
            $iata = strtoupper(trim((string) ($row['iata_code'] ?? '')));
            $icao = strtoupper(trim((string) ($row['gps_code'] ?? $row['ident'] ?? '')));
            $countryCode = strtoupper(trim((string) ($row['iso_country'] ?? '')));
            $name = trim((string) ($row['name'] ?? ''));
            $municipality = trim((string) ($row['municipality'] ?? ''));

            if (!$includeAll && $iata === '') {
                $skipped++;
                continue;
            }

            if ($name === '' || $countryCode === '' || !isset($countryMap[$countryCode])) {
                $skipped++;
                continue;
            }

            $country = $countryMap[$countryCode];
            $cityName = $municipality !== '' ? $municipality : $name;
            $cityKey = $country->id . '|' . $this->normalizeCityName($cityName);

            if (!isset($cityCache[$cityKey])) {
                $cityCache[$cityKey] = $this->findOrCreateCanonicalCity($country, $cityName);
            }

            $city = $cityCache[$cityKey];

            $airport = null;
            if ($iata !== '') {
                $airport = Airport::query()->where('iata_code', $iata)->first();
            }
            if (!$airport && $icao !== '') {
                $airport = Airport::query()->where('icao_code', $icao)->first();
            }

            $latitude = $this->numberOrNull($row['latitude_deg'] ?? null);
            $longitude = $this->numberOrNull($row['longitude_deg'] ?? null);

            $timezone = $this->resolveTimezone(
                $countryCode,
                $latitude,
                $longitude,
                $airport?->timezone,
                $city->timezone,
                $country->default_timezone,
            );

            if ((!$city->timezone || $city->timezone === 'UTC') && $timezone !== 'UTC') {
                $city->update(['timezone' => $timezone]);
            }

            $payload = [
                'country_id' => $country->id,
                'city_id' => $city->id,
                'name' => $name,
                'iata_code' => $iata !== '' ? $iata : null,
                'icao_code' => $icao !== '' ? $icao : null,
                'timezone' => $timezone,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'is_active' => true,
                'sort_order' => 0,
                'metadata' => [
                    'source' => 'ourairports',
                    'source_id' => $row['id'] ?? null,
                    'ident' => $row['ident'] ?? null,
                    'airport_type' => $row['type'] ?? null,
                    'scheduled_service' => $row['scheduled_service'] ?? null,
                    'iso_region' => $row['iso_region'] ?? null,
                    'home_link' => $row['home_link'] ?? null,
                    'wikipedia_link' => $row['wikipedia_link'] ?? null,
                ],
            ];

            if ($airport) {
                $airport->update($payload);
                $updated++;
            } else {
                Airport::create($payload);
                $created++;
            }
        }

        return [$created, $updated, $skipped];
    }

    private function findOrCreateCanonicalCity(Country $country, string $cityName): City
    {
        $countryId = $country->id;
        $normalized = $this->normalizeCityName($cityName);

        if (!isset($this->cityIndex[$countryId])) {
            $this->cityIndex[$countryId] = [];
            foreach (City::query()->where('country_id', $countryId)->orderBy('id')->get() as $city) {
                $this->cityIndex[$countryId][$this->normalizeCityName($city->name)] ??= $city;
                if ($city->native_name) {
                    $this->cityIndex[$countryId][$this->normalizeCityName($city->native_name)] ??= $city;
                }
            }
        }

        if (isset($this->cityIndex[$countryId][$normalized])) {
            $city = $this->cityIndex[$countryId][$normalized];
            if (!$city->is_active) {
                $city->update(['is_active' => true]);
            }
            return $city;
        }

        $city = City::create([
            'country_id' => $countryId,
            'name' => $cityName,
            'is_active' => true,
            'sort_order' => 0,
            'metadata' => ['source' => 'ourairports'],
        ]);

        $this->cityIndex[$countryId][$normalized] = $city;
        return $city;
    }

    private function repairDuplicateCityAliases(): int
    {
        $merged = 0;

        Country::query()->select('id')->orderBy('id')->chunkById(100, function ($countries) use (&$merged) {
            foreach ($countries as $country) {
                $groups = City::query()
                    ->where('country_id', $country->id)
                    ->withCount(['locations', 'airports'])
                    ->orderBy('id')
                    ->get()
                    ->groupBy(fn (City $city) => $this->normalizeCityName($city->name));

                foreach ($groups as $cities) {
                    if ($cities->count() < 2) {
                        continue;
                    }

                    $canonical = $cities
                        ->sortByDesc(fn (City $city) => ($city->locations_count * 1000000) + ($city->airports_count * 1000) - $city->id)
                        ->first();

                    foreach ($cities as $duplicate) {
                        if ($duplicate->id === $canonical->id) {
                            continue;
                        }

                        $duplicate->airports()->update(['city_id' => $canonical->id]);
                        $duplicate->locations()->update(['city_id' => $canonical->id]);
                        $duplicate->operatingZones()->update(['city_id' => $canonical->id]);

                        if ((!$canonical->timezone || $canonical->timezone === 'UTC') && $duplicate->timezone && $duplicate->timezone !== 'UTC') {
                            $canonical->update(['timezone' => $duplicate->timezone]);
                        }

                        if (!$canonical->native_name && $duplicate->name !== $canonical->name) {
                            $canonical->update(['native_name' => $duplicate->name]);
                        }

                        $duplicate->delete();
                        $merged++;
                    }
                }
            }
        });

        $this->cityIndex = [];
        return $merged;
    }

    private function normalizeCityName(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        $ascii = Str::ascii($value);
        $ascii = mb_strtolower($ascii);
        return preg_replace('/[^a-z0-9]+/u', '', $ascii) ?: $ascii;
    }

    private function resolveTimezone(
        string $countryCode,
        ?float $latitude,
        ?float $longitude,
        ?string $airportTimezone,
        ?string $cityTimezone,
        ?string $countryTimezone,
    ): string {
        foreach ([$airportTimezone, $cityTimezone, $countryTimezone] as $timezone) {
            if ($timezone && $timezone !== 'UTC') {
                return $timezone;
            }
        }

        if ($latitude === null || $longitude === null || strlen($countryCode) !== 2) {
            return 'UTC';
        }

        $cacheKey = $countryCode . '|' . round($latitude, 2) . '|' . round($longitude, 2);
        if (isset($this->timezoneCache[$cacheKey])) {
            return $this->timezoneCache[$cacheKey];
        }

        try {
            $identifiers = DateTimeZone::listIdentifiers(DateTimeZone::PER_COUNTRY, strtoupper($countryCode));
        } catch (\Throwable) {
            return 'UTC';
        }

        if (!$identifiers) {
            return 'UTC';
        }

        if (count($identifiers) === 1) {
            return $this->timezoneCache[$cacheKey] = $identifiers[0];
        }

        $bestTimezone = null;
        $bestDistance = INF;

        foreach ($identifiers as $identifier) {
            try {
                $location = (new DateTimeZone($identifier))->getLocation();
            } catch (\Throwable) {
                continue;
            }

            if (!$location || !isset($location['latitude'], $location['longitude'])) {
                continue;
            }

            $distance = $this->haversineKm($latitude, $longitude, (float) $location['latitude'], (float) $location['longitude']);

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestTimezone = $identifier;
            }
        }

        return $this->timezoneCache[$cacheKey] = ($bestTimezone ?: 'UTC');
    }

    private function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371.0088;
        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);
        $a = sin($latDelta / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lonDelta / 2) ** 2;
        return 2 * $earthRadius * asin(min(1, sqrt($a)));
    }

    private function csvRows(string $csv): iterable
    {
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $csv);
        rewind($stream);

        $headers = fgetcsv($stream);
        if (!$headers) {
            fclose($stream);
            return;
        }

        while (($values = fgetcsv($stream)) !== false) {
            if (count($values) !== count($headers)) {
                continue;
            }
            yield array_combine($headers, $values);
        }

        fclose($stream);
    }

    private function numberOrNull(mixed $value): ?float
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
