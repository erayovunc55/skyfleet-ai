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

        // Keep existing server-side geocoding on Geoapify so routing/conversion
        // behaviour elsewhere in Skyfleet is not changed by the website upgrade.
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
            now()->addDays(config('geocoding.cache_ttl_days', 30)),
            fn () => $this->requestGeoapify($normalizedQuery, $apiKey)
        );
    }

    /**
     * Website autocomplete.
     * Google Places (New) is the primary provider; Geoapify remains a fallback.
     */
    public function search(?string $query, int $limit = 6): array
    {
        $normalizedQuery = $this->normalizeQuery($query);

        if (mb_strlen($normalizedQuery) < 2) {
            return [];
        }

        $limit = max(1, min($limit, 10));

        $googleKey = trim((string) config('google_places.key', ''));

        if ((bool) config('google_places.enabled', true) && $googleKey !== '') {
            $googleResults = $this->requestGoogleAutocomplete(
                $normalizedQuery,
                $googleKey,
                $limit
            );

            if ($googleResults !== []) {
                return $googleResults;
            }
        }

        // Graceful fallback: do not break the booking form if Google is unavailable.
        if (config('geocoding.provider') !== 'geoapify') {
            return [];
        }

        $geoapifyKey = config('geocoding.geoapify.key');

        if (!$geoapifyKey) {
            return [];
        }

        return $this->requestGeoapifySearch(
            $normalizedQuery,
            (string) $geoapifyKey,
            $limit
        );
    }

    /**
     * Resolve a Google place prediction only after the user selects it.
     */
    public function placeDetails(
        ?string $placeId,
        ?string $fallbackQuery = null
    ): ?array
    {
        $placeId = trim((string) $placeId);
        $fallbackQuery = trim((string) $fallbackQuery);

        if ($placeId === '') {
            return null;
        }

        $apiKey = trim((string) config('google_places.key', ''));

        if (!(bool) config('google_places.enabled', true) || $apiKey === '') {
            return $this->geocode($fallbackQuery);
        }

        try {
            $endpoint = rtrim(
                (string) config(
                    'google_places.details_endpoint',
                    'https://places.googleapis.com/v1/places'
                ),
                '/'
            );

            $response = Http::acceptJson()
                ->withHeaders([
                    'X-Goog-Api-Key' => $apiKey,
                    'X-Goog-FieldMask' => implode(',', [
                        'id',
                        'formattedAddress',
                        'location',
                        'addressComponents',
                    ]),
                ])
                ->connectTimeout(4)
                ->timeout(10)
                ->retry(1, 250, throw: false)
                ->get(
                    $endpoint . '/' . rawurlencode($placeId),
                    [
                        'languageCode' => config('google_places.language', 'tr'),
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);
            return $this->geocode($fallbackQuery);
        }

        if (!$response->successful()) {
            report(new \RuntimeException(sprintf(
                'Google Place Details failed with HTTP %s.',
                $response->status()
            )));
            return $this->geocode($fallbackQuery);
        }

        $data = $response->json();

        if (!is_array($data)) {
            return $this->geocode($fallbackQuery);
        }

        $latitude = data_get($data, 'location.latitude');
        $longitude = data_get($data, 'location.longitude');

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            return $this->geocode($fallbackQuery);
        }

        $components = is_array($data['addressComponents'] ?? null)
            ? $data['addressComponents']
            : [];

        return [
            'label' => data_get($data, 'formattedAddress'),
            'name' => data_get($data, 'formattedAddress'),
            'formatted_address' => data_get($data, 'formattedAddress'),
            'latitude' => (float) $latitude,
            'longitude' => (float) $longitude,
            'place_id' => (string) ($data['id'] ?? $placeId),
            'country' => $this->addressComponent($components, 'country'),
            'city' => $this->addressComponent($components, 'locality')
                ?: $this->addressComponent($components, 'administrative_area_level_2')
                ?: $this->addressComponent($components, 'administrative_area_level_1'),
            'postcode' => $this->addressComponent($components, 'postal_code'),
            'provider' => 'google_maps',
        ];
    }

    private function requestGoogleAutocomplete(
        string $query,
        string $apiKey,
        int $limit
    ): array {
        try {
            $body = [
                'input' => $query,
                'languageCode' => config('google_places.language', 'tr'),
                'includeQueryPredictions' => false,
            ];

            $regionCode = trim((string) config('google_places.region_code', ''));
            if ($regionCode !== '') {
                $body['regionCode'] = strtolower($regionCode);
            }

            $response = Http::acceptJson()
                ->asJson()
                ->withHeaders([
                    'X-Goog-Api-Key' => $apiKey,
                    'X-Goog-FieldMask' => implode(',', [
                        'suggestions.placePrediction.placeId',
                        'suggestions.placePrediction.text.text',
                        'suggestions.placePrediction.structuredFormat.mainText.text',
                        'suggestions.placePrediction.structuredFormat.secondaryText.text',
                    ]),
                ])
                ->connectTimeout(4)
                ->timeout(10)
                ->retry(1, 250, throw: false)
                ->post(
                    (string) config(
                        'google_places.autocomplete_endpoint',
                        'https://places.googleapis.com/v1/places:autocomplete'
                    ),
                    $body
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);
            return [];
        }

        if (!$response->successful()) {
            report(new \RuntimeException(sprintf(
                'Google Places Autocomplete failed with HTTP %s.',
                $response->status()
            )));
            return [];
        }

        $suggestions = $response->json('suggestions');

        if (!is_array($suggestions)) {
            return [];
        }

        return collect($suggestions)
            ->map(function ($suggestion) {
                $prediction = is_array($suggestion)
                    ? ($suggestion['placePrediction'] ?? null)
                    : null;

                if (!is_array($prediction)) {
                    return null;
                }

                $placeId = trim((string) ($prediction['placeId'] ?? ''));
                $fullText = trim((string) data_get($prediction, 'text.text', ''));
                $mainText = trim((string) data_get(
                    $prediction,
                    'structuredFormat.mainText.text',
                    ''
                ));
                $secondaryText = trim((string) data_get(
                    $prediction,
                    'structuredFormat.secondaryText.text',
                    ''
                ));

                if ($placeId === '' || $fullText === '') {
                    return null;
                }

                return [
                    'label' => $fullText,
                    'name' => $mainText !== '' ? $mainText : $fullText,
                    'formatted_address' => $secondaryText !== ''
                        ? sprintf('%s, %s', $mainText ?: $fullText, $secondaryText)
                        : $fullText,
                    'latitude' => null,
                    'longitude' => null,
                    'place_id' => $placeId,
                    'country' => null,
                    'city' => null,
                    'postcode' => null,
                    'provider' => 'google_maps',
                ];
            })
            ->filter()
            ->take($limit)
            ->values()
            ->all();
    }

    private function addressComponent(array $components, string $type): ?string
    {
        foreach ($components as $component) {
            if (!is_array($component)) {
                continue;
            }

            $types = is_array($component['types'] ?? null)
                ? $component['types']
                : [];

            if (in_array($type, $types, true)) {
                $value = trim((string) ($component['longText'] ?? ''));
                return $value !== '' ? $value : null;
            }
        }

        return null;
    }

    private function requestGeoapify(string $query, string $apiKey): ?array
    {
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
                        'lang' => config('geocoding.geoapify.language', 'tr'),
                        'apiKey' => $apiKey,
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);
            return null;
        }

        if (!$response->successful()) {
            report(new \RuntimeException(sprintf(
                'Geoapify request failed with HTTP %s.',
                $response->status()
            )));
            return null;
        }

        $feature = $response->json('features.0');
        if (!is_array($feature)) {
            return null;
        }

        $coordinates = $this->extractGeoapifyCoordinates($feature);
        if ($coordinates === null) {
            return null;
        }

        return [
            'latitude' => $coordinates['latitude'],
            'longitude' => $coordinates['longitude'],
            'formatted_address' => data_get($feature, 'properties.formatted'),
            'place_id' => data_get($feature, 'properties.place_id'),
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
                ->connectTimeout(4)
                ->timeout(10)
                ->retry(1, 300, throw: false)
                ->get(
                    config('geocoding.geoapify.endpoint'),
                    [
                        'text' => $query,
                        'limit' => $limit,
                        'lang' => config('geocoding.geoapify.language', 'tr'),
                        'apiKey' => $apiKey,
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);
            return [];
        }

        if (!$response->successful()) {
            return [];
        }

        $features = $response->json('features');
        if (!is_array($features)) {
            return [];
        }

        return collect($features)
            ->map(function ($feature) {
                if (!is_array($feature)) {
                    return null;
                }

                $coordinates = $this->extractGeoapifyCoordinates($feature);
                if ($coordinates === null) {
                    return null;
                }

                $formattedAddress = data_get($feature, 'properties.formatted');
                $name = data_get($feature, 'properties.name');

                return [
                    'label' => $formattedAddress ?: $name,
                    'name' => $name,
                    'formatted_address' => $formattedAddress,
                    'latitude' => $coordinates['latitude'],
                    'longitude' => $coordinates['longitude'],
                    'place_id' => data_get($feature, 'properties.place_id'),
                    'country' => data_get($feature, 'properties.country'),
                    'city' => data_get($feature, 'properties.city')
                        ?: data_get($feature, 'properties.county'),
                    'postcode' => data_get($feature, 'properties.postcode'),
                    'provider' => 'geoapify',
                ];
            })
            ->filter(fn ($item) => is_array($item) && !empty($item['label']))
            ->values()
            ->all();
    }

    private function extractGeoapifyCoordinates(array $feature): ?array
    {
        $latitude = data_get($feature, 'properties.lat');
        $longitude = data_get($feature, 'properties.lon');

        if ($latitude === null || $longitude === null) {
            $coordinates = data_get($feature, 'geometry.coordinates');
            if (is_array($coordinates) && count($coordinates) >= 2) {
                $longitude = $coordinates[0];
                $latitude = $coordinates[1];
            }
        }

        $latitude = is_numeric($latitude) ? (float) $latitude : null;
        $longitude = is_numeric($longitude) ? (float) $longitude : null;

        if (
            $latitude === null || $longitude === null
            || $latitude < -90 || $latitude > 90
            || $longitude < -180 || $longitude > 180
        ) {
            return null;
        }

        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];
    }

    private function normalizeQuery(?string $query): string
    {
        $value = trim((string) $query);

        if ($value === '') {
            return '';
        }

        if (preg_match('/^[a-zA-Z]{3}$/', $value) === 1) {
            $value = strtoupper($value) . ' Airport';
        }

        return Str::of($value)->squish()->toString();
    }
}
