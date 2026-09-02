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

    public function search(
        ?string $query,
        int $limit = 6
    ): array {
        $normalizedQuery = $this->normalizeQuery($query);

        if (mb_strlen($normalizedQuery) < 2) {
            return [];
        }

        if (config('geocoding.provider') !== 'geoapify') {
            return [];
        }

        $apiKey = config('geocoding.geoapify.key');

        if (!$apiKey) {
            return [];
        }

        $limit = max(1, min($limit, 10));

        $cacheKey = sprintf(
            'geocoding:geoapify:search:%s:%d',
            hash('sha256', $normalizedQuery),
            $limit
        );

        return Cache::remember(
            $cacheKey,
            now()->addHours(12),
            fn () => $this->requestGeoapifySearch(
                $normalizedQuery,
                $apiKey,
                $limit
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

    private function requestGeoapifySearch(
        string $query,
        string $apiKey,
        int $limit
    ): array {
        try {
            $response = Http::acceptJson()
                ->connectTimeout(3)
                ->timeout(8)
                ->retry(2, 250, throw: false)
                ->get(
                    config('geocoding.geoapify.endpoint'),
                    [
                        'text' => $query,
                        'limit' => $limit,
                        'lang' => config(
                            'geocoding.geoapify.language',
                            'tr'
                        ),
                        'apiKey' => $apiKey,
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);

            return [];
        }

        if (!$response->successful()) {
            report(
                new \RuntimeException(
                    sprintf(
                        'Geoapify search failed with HTTP %s.',
                        $response->status()
                    )
                )
            );

            return [];
        }

        $features = $response->json('features');

        if (!is_array($features)) {
            return [];
        }

        return collect($features)
            ->map(function ($feature) {
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
                ) {
                    return null;
                }

                $formattedAddress = data_get(
                    $feature,
                    'properties.formatted'
                );

                $name = data_get(
                    $feature,
                    'properties.name'
                );

                return [
                    'label' => $formattedAddress ?: $name,
                    'name' => $name,
                    'formatted_address' => $formattedAddress,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'place_id' => data_get(
                        $feature,
                        'properties.place_id'
                    ),
                    'country' => data_get(
                        $feature,
                        'properties.country'
                    ),
                    'city' => data_get(
                        $feature,
                        'properties.city'
                    )
                        ?: data_get(
                            $feature,
                            'properties.county'
                        ),
                    'postcode' => data_get(
                        $feature,
                        'properties.postcode'
                    ),
                    'provider' => 'geoapify',
                ];
            })
            ->filter(fn ($item) => is_array($item) && !empty($item['label']))
            ->values()
            ->all();
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