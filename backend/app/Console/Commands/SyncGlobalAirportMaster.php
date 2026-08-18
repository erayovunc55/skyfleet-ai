<?php

namespace App\Console\Commands;

use App\Models\Airport;
use App\Models\City;
use App\Models\Country;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SyncGlobalAirportMaster extends Command
{
    protected $signature = 'airport-master:sync {--all : Include airports without an IATA code}';

    protected $description = 'Synchronize the global airport master from the public-domain OurAirports dataset.';

    private const COUNTRIES_URL = 'https://davidmegginson.github.io/ourairports-data/countries.csv';
    private const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

    public function handle(): int
    {
        $this->info('Downloading global country master...');
        $countryCsv = $this->download(self::COUNTRIES_URL);
        $countryMap = $this->syncCountries($countryCsv);

        $this->info('Downloading global airport master...');
        $airportCsv = $this->download(self::AIRPORTS_URL);
        [$created, $updated, $skipped] = $this->syncAirports($airportCsv, $countryMap, (bool) $this->option('all'));

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
        $rows = $this->csvRows($csv);
        $map = [];

        foreach ($rows as $row) {
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
            $cityKey = $country->id . '|' . mb_strtolower($cityName);

            if (!isset($cityCache[$cityKey])) {
                $cityCache[$cityKey] = City::firstOrCreate(
                    ['country_id' => $country->id, 'name' => $cityName],
                    [
                        'is_active' => true,
                        'sort_order' => 0,
                        'metadata' => ['source' => 'ourairports'],
                    ]
                );
            }

            $city = $cityCache[$cityKey];

            $airport = null;
            if ($iata !== '') {
                $airport = Airport::query()->where('iata_code', $iata)->first();
            }
            if (!$airport && $icao !== '') {
                $airport = Airport::query()->where('icao_code', $icao)->first();
            }

            $payload = [
                'country_id' => $country->id,
                'city_id' => $city->id,
                'name' => $name,
                'iata_code' => $iata !== '' ? $iata : null,
                'icao_code' => $icao !== '' ? $icao : null,
                'latitude' => $this->numberOrNull($row['latitude_deg'] ?? null),
                'longitude' => $this->numberOrNull($row['longitude_deg'] ?? null),
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
                $payload['timezone'] = $airport->timezone;
                $airport->update($payload);
                $updated++;
            } else {
                Airport::create($payload);
                $created++;
            }
        }

        return [$created, $updated, $skipped];
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
