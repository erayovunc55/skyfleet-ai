<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class GeocodingService
{
    public function geocode(?string $query): ?array
    {
        $normalizedQuery = $this->normalizeQuery($query);

        if ($normalizedQuery === '') {
            return null;
        }

        if (config('geocoding.provider') !== 'geoapify') {
            return null;
        }

        $apiKey = config('geocoding.geoapify.key');

        if (!$apiKey) {
            return null;
        }

        $cacheKey = sprintf(
            'geocoding:geoapify:%s',
            hash('sha256', $normalizedQuery)
        );

        return Cache::remember(
            $cacheKey,
            now()->addDays(
                config('geocoding.cache_ttl_days', 30)
            ),
            fn () => $this->requestGeoapify(
                $normalizedQuery,
                $apiKey
            )
        );
    }

    private function requestGeoapify(
        string $query,
        string $apiKey
    ): ?array {
        try {
            $response = Http::acceptJson()
                ->connectTimeout(3)
                ->timeout(8)
                ->retry(2, 250, throw: false)
                ->get(
                    config('geocoding.geoapify.endpoint'),
                    [
                        'text' => $query,
                        'limit' => 1,
                        'lang' => config(
                            'geocoding.geoapify.language',
                            'tr'
                        ),
                        'apiKey' => $apiKey,
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);

            return null;
        }

        if (!$response->successful()) {
            report(
                new \RuntimeException(
                    sprintf(
                        'Geoapify request failed with HTTP %s.',
                        $response->status()
                    )
                )
            );

            return null;
        }

        $feature = $response->json('features.0');

        if (!is_array($feature)) {
            return null;
        }

        $latitude = data_get(
            $feature,
            'properties.lat'
        );

        $longitude = data_get(
            $feature,
            'properties.lon'
        );

        if ($latitude === null || $longitude === null) {
            $coordinates = data_get(
                $feature,
                'geometry.coordinates'
            );

            if (
                is_array($coordinates)
                && count($coordinates) >= 2
            ) {
                $longitude = $coordinates[0];
                $latitude = $coordinates[1];
            }
        }

        $latitude = is_numeric($latitude)
            ? (float) $latitude
            : null;

        $longitude = is_numeric($longitude)
            ? (float) $longitude
            : null;

        if (
            $latitude === null
            || $longitude === null
            || $latitude < -90
            || $latitude > 90
            || $longitude < -180
            || $longitude > 180
        ) {
            return null;
        }

        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'formatted_address' => data_get(
                $feature,
                'properties.formatted'
            ),
            'place_id' => data_get(
                $feature,
                'properties.place_id'
            ),
            'provider' => 'geoapify',
        ];
    }

    private function normalizeQuery(
        ?string $query
    ): string {
        $value = trim((string) $query);

        if ($value === '') {
            return '';
        }

        if (
            preg_match(
                '/^[a-zA-Z]{3}$/',
                $value
            ) === 1
        ) {
            $value = strtoupper($value)
                . ' Airport';
        }

        return Str::of($value)
            ->squish()
            ->toString();
    }
}
