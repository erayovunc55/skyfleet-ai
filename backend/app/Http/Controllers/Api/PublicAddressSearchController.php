<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\AirportTaxiPricingService;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PublicAddressSearchController extends Controller
{
    public function __invoke(
        Request $request,
        GeocodingService $geocodingService
    ): JsonResponse {
        $validated = $request->validate([
            'q' => [
                'nullable',
                'required_without:place_id',
                'string',
                'min:2',
                'max:150',
            ],
            'place_id' => [
                'nullable',
                'required_without:q',
                'string',
                'max:255',
            ],
            'fallback_query' => [
                'nullable',
                'string',
                'min:2',
                'max:150',
            ],
            'field' => [
                'nullable',
                'string',
                'in:pickup,dropoff',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Google Place Details
        |--------------------------------------------------------------------------
        |
        | Autocomplete intentionally returns no coordinates. Resolve the selected
        | Google prediction only after the customer chooses it.
        |
        */
        if (!empty($validated['place_id'])) {
            $place = $geocodingService->placeDetails(
                (string) $validated['place_id'],
                $validated['fallback_query'] ?? null
            );

            if ($place === null) {
                return response()->json([
                    'message' => 'Location details could not be resolved.',
                    'data' => null,
                ], 502);
            }

            return response()->json([
                'data' => [
                    ...$place,
                    'is_airport' => false,
                    'location_id' => null,
                    'airport_id' => null,
                    'iata' => null,
                    'icao' => null,
                    'code' => null,
                ],
            ]);
        }

        $query = trim((string) ($validated['q'] ?? ''));
        $field = (string) ($validated['field'] ?? '');
        $upperQuery = strtoupper($query);

        $normalizedQuery = Str::of($query)
            ->lower()
            ->ascii()
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();

        /*
        |--------------------------------------------------------------------------
        | Airport aliases / airport intent
        |--------------------------------------------------------------------------
        |
        | Do not pollute ordinary address searches (for example Taksim Istanbul)
        | with airports merely because the city name matches. Airport DB results
        | are only added when the customer's text looks airport-related.
        |
        */
        $airportAliases = [
            'IST' => [
                'ist',
                'istanbul airport',
                'istanbul havalimani',
                'istanbul havaliman',
                'istanbul havaalani',
                'istanbul hava alani',
                'new istanbul airport',
            ],
            'SAW' => [
                'saw',
                'sabiha',
                'sabiha gokcen',
                'sabiha gokcen airport',
                'sabiha gokcen havalimani',
                'sabiha airport',
            ],
        ];

        $aliasAirportCodes = [];

        foreach ($airportAliases as $iata => $aliases) {
            foreach ($aliases as $alias) {
                if (
                    $normalizedQuery === $alias
                    || preg_match(
                        '/(?<![a-z0-9])' . preg_quote($alias, '/') . '(?![a-z0-9])/',
                        $normalizedQuery
                    ) === 1
                ) {
                    $aliasAirportCodes[] = $iata;
                    break;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Partial Istanbul airport aliases
        |--------------------------------------------------------------------------
        |
        | Production autocomplete fires while the passenger is still typing.
        | Queries such as "istanbul hava" must already resolve to the canonical
        | Skyfleet IST airport, otherwise Geoapify address-like airport results
        | can be selected and instant pricing loses airport_location_id.
        |
        */
        if (
            str_contains($normalizedQuery, 'istanbul hava')
            || str_contains($normalizedQuery, 'istanbul airp')
            || $normalizedQuery === 'ist'
            || str_starts_with($normalizedQuery, 'ist ')
        ) {
            $aliasAirportCodes[] = 'IST';
        }

        if (
            str_contains($normalizedQuery, 'sabiha')
            || $normalizedQuery === 'saw'
            || str_starts_with($normalizedQuery, 'saw ')
        ) {
            $aliasAirportCodes[] = 'SAW';
        }

        $aliasAirportCodes = array_values(array_unique($aliasAirportCodes));

        $airportTerms = [
            'airport',
            'havalimani',
            'havaliman',
            'havaalani',
            'hava alani',
            'hava',
            'aeroport',
            'aeropuerto',
            'aeroporto',
            'flughafen',
        ];

        $airportIntent = !empty($aliasAirportCodes)
            || preg_match('/^[A-Z]{3,4}$/', $upperQuery) === 1
            || collect($airportTerms)->contains(
                fn (string $term): bool => str_contains($normalizedQuery, $term)
            );

        $exactAirportLocations = collect();
        $fuzzyAirportLocations = collect();

        $includeAirportLocations = $airportIntent;

        if ($includeAirportLocations) {
            $exactAirportLocations = $this->exactAirportMatches(
                $upperQuery,
                $aliasAirportCodes
            );

            $fuzzyAirportLocations = $this->fuzzyAirportMatches(
                $query,
                $normalizedQuery,
                $aliasAirportCodes
            );
        }

        $airportLocations = $exactAirportLocations
            ->concat($fuzzyAirportLocations)
            ->unique('id')
            ->take(6)
            ->map(fn (Location $location): array => $this->formatAirport($location))
            ->values()
            ->all();

        if ($field === 'dropoff' && !$airportIntent) {
            $airportLocations = [];
        }

        /*
        |--------------------------------------------------------------------------
        | Google Places first, Geoapify fallback inside GeocodingService
        |--------------------------------------------------------------------------
        */
        try {
            $geoResults = $geocodingService->search($query, 6);
        } catch (\Throwable $exception) {
            report($exception);
            $geoResults = [];
        }

        $geoResults = collect($geoResults)
            ->map(function (array $item): array {
                return [
                    ...$item,
                    'is_airport' => false,
                    'location_id' => null,
                    'airport_id' => null,
                    'iata' => null,
                    'icao' => null,
                    'code' => null,
                ];
            })
            ->all();

        $results = collect([
            ...$airportLocations,
            ...$geoResults,
        ])
            ->unique(function (array $item): string {
                if (!empty($item['location_id'])) {
                    return 'location-' . $item['location_id'];
                }

                if (!empty($item['place_id'])) {
                    return 'place-' . $item['place_id'];
                }

                return sprintf(
                    '%s-%s',
                    $item['latitude'] ?? '',
                    $item['longitude'] ?? ''
                );
            })
            ->take(8)
            ->values()
            ->all();

        return response()->json([
            'data' => $results,
        ]);
    }

    private function exactAirportMatches(
        string $upperQuery,
        array $aliasAirportCodes
    ): Collection {
        return Location::query()
            ->where('is_public', true)
            ->whereHas(
                'airport',
                fn ($q) => app(AirportTaxiPricingService::class)
                    ->scopeMarkets($q)
            )
            ->with([
                'city:id,name,country_id',
                'country:id,name,iso2',
                'airport:id,name,iata_code,icao_code',
            ])
            ->whereNotNull('airport_id')
            ->where('is_active', true)
            ->where(function ($builder) use (
                $upperQuery,
                $aliasAirportCodes
            ): void {
                $builder
                    ->where('code', $upperQuery)
                    ->orWhereHas(
                        'airport',
                        function ($airportQuery) use (
                            $upperQuery,
                            $aliasAirportCodes
                        ): void {
                            $airportQuery
                                ->where('iata_code', $upperQuery)
                                ->orWhere('icao_code', $upperQuery);

                            if (!empty($aliasAirportCodes)) {
                                $airportQuery->orWhereIn(
                                    'iata_code',
                                    $aliasAirportCodes
                                );
                            }
                        }
                    );
            })
            ->limit(6)
            ->get();
    }

    private function fuzzyAirportMatches(
        string $query,
        string $normalizedQuery,
        array $aliasAirportCodes
    ): Collection {
        $queryWords = collect(
            preg_split('/\s+/', $normalizedQuery)
        )
            ->filter(
                fn ($word) => strlen($word) >= 3
                    && !in_array(
                        $word,
                        [
                            'airport',
                            'havalimani',
                            'havaliman',
                            'havaalani',
                            'hava',
                            'alani',
                            'aeroport',
                            'aeropuerto',
                            'aeroporto',
                            'flughafen',
                            'the',
                            'hotel',
                            'resort',
                            'hostel',
                            'suite',
                            'suites',
                            'station',
                            'plaza',
                        ],
                        true
                    )
            )
            ->values();

        return Location::query()
            ->where('is_public', true)
            ->whereHas(
                'airport',
                fn ($q) => app(AirportTaxiPricingService::class)
                    ->scopeMarkets($q)
            )
            ->with([
                'city:id,name,country_id',
                'country:id,name,iso2',
                'airport:id,name,iata_code,icao_code',
            ])
            ->whereNotNull('airport_id')
            ->where('is_active', true)
            ->where(function ($builder) use (
                $query,
                $queryWords,
                $aliasAirportCodes
            ): void {
                $builder
                    ->where('name', 'like', "%{$query}%")
                    ->orWhereHas(
                        'city',
                        fn ($q) => $q->where('name', 'like', "%{$query}%")
                    )
                    ->orWhereHas(
                        'country',
                        fn ($q) => $q->where('name', 'like', "%{$query}%")
                    )
                    ->orWhere('code', 'like', "%{$query}%")
                    ->orWhereHas(
                        'airport',
                        function ($airportQuery) use (
                            $query,
                            $queryWords,
                            $aliasAirportCodes
                        ): void {
                            $airportQuery
                                ->where('name', 'like', "%{$query}%")
                                ->orWhere('iata_code', 'like', "%{$query}%")
                                ->orWhere('icao_code', 'like', "%{$query}%");

                            if (!empty($aliasAirportCodes)) {
                                $airportQuery->orWhereIn(
                                    'iata_code',
                                    $aliasAirportCodes
                                );
                            }

                            foreach ($queryWords as $word) {
                                $airportQuery->orWhere(
                                    'name',
                                    'like',
                                    "%{$word}%"
                                );
                            }
                        }
                    );
            })
            ->orderBy('sort_order')
            ->limit(8)
            ->get();
    }

    private function formatAirport(Location $location): array
    {
        $airport = $location->airport;
        $code = $location->code
            ?: $airport?->iata_code
            ?: $airport?->icao_code;

        $labelParts = array_filter([
            $airport?->name ?: $location->name,
            $location->city?->name,
            $location->country?->name,
        ]);

        return [
            'label' => implode(', ', $labelParts),
            'name' => $airport?->name ?: $location->name,
            'formatted_address' => implode(', ', $labelParts),
            'latitude' => $location->latitude !== null
                ? (float) $location->latitude
                : null,
            'longitude' => $location->longitude !== null
                ? (float) $location->longitude
                : null,
            'place_id' => 'skyfleet-location-' . $location->id,
            'country' => $location->country?->name,
            'timezone' => $location->timezone,
            'city' => $location->city?->name,
            'postcode' => $location->postal_code,
            'provider' => 'skyfleet',
            'is_airport' => true,
            'location_id' => $location->id,
            'airport_id' => $location->airport_id,
            'iata' => $airport?->iata_code ?: $location->code,
            'icao' => $airport?->icao_code,
            'code' => $code,
        ];
    }
}
