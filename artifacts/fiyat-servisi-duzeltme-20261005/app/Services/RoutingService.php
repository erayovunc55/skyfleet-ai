<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class RoutingService
{
    public function route(
        float $fromLatitude,
        float $fromLongitude,
        float $toLatitude,
        float $toLongitude
    ): ?array {
        $apiKey = config('geocoding.geoapify.key');

        if (!$apiKey) {
            return null;
        }

        $cacheKey = sprintf(
            'routing:geoapify:%s',
            hash(
                'sha256',
                implode('|', [
                    round($fromLatitude, 5),
                    round($fromLongitude, 5),
                    round($toLatitude, 5),
                    round($toLongitude, 5),
                    'drive',
                ])
            )
        );

        return Cache::remember(
            $cacheKey,
            now()->addSeconds(
                config(
                    'geocoding.routing.cache_ttl_seconds',
                    30
                )
            ),
            fn () => $this->requestGeoapify(
                $fromLatitude,
                $fromLongitude,
                $toLatitude,
                $toLongitude,
                $apiKey
            )
        );
    }

    private function requestGeoapify(
        float $fromLatitude,
        float $fromLongitude,
        float $toLatitude,
        float $toLongitude,
        string $apiKey
    ): ?array {
        try {
            $response = Http::acceptJson()
                ->connectTimeout(3)
                ->timeout(12)
                ->retry(2, 300, throw: false)
                ->get(
                    config(
                        'geocoding.routing.endpoint'
                    ),
                    [
                        'waypoints' => sprintf(
                            '%F,%F|%F,%F',
                            $fromLatitude,
                            $fromLongitude,
                            $toLatitude,
                            $toLongitude
                        ),
                        'mode' => 'drive',
                        'type' => 'balanced',
                        'traffic' => 'approximated',
                        'format' => 'geojson',
                        'apiKey' => $apiKey,
                    ]
                );
        } catch (
            ConnectionException|Throwable $exception
        ) {
            report($exception);

            return null;
        }

        if (!$response->successful()) {
            report(
                new \RuntimeException(
                    sprintf(
                        'Geoapify routing failed with HTTP %s.',
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

        $distanceMeters = data_get(
            $feature,
            'properties.distance'
        );

        $durationSeconds = data_get(
            $feature,
            'properties.time'
        );

        $geometry = data_get(
            $feature,
            'geometry'
        );

        if (
            !is_numeric($distanceMeters)
            || !is_numeric($durationSeconds)
            || !is_array($geometry)
        ) {
            return null;
        }

        return [
            'distance_meters' =>
                (int) round($distanceMeters),

            'duration_seconds' =>
                (int) round($durationSeconds),

            'geometry' => $geometry,

            'provider' => 'geoapify',
        ];
    }
}
