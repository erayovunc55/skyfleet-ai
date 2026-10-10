<?php

namespace App\Services;

use App\Models\Airport;
use App\Models\Location;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;

class AirportTaxiPricingService
{
    public function __construct(
        private readonly RoutingService $routing,
        private readonly DynamicPricingService $dynamicPricing,
        private readonly RegionalPricingService $regionalPricing,
        private readonly CurrencyService $currencyService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Public Airport Markets
    |--------------------------------------------------------------------------
    */

    public function scopeMarkets(
        Builder $query
    ): Builder {
        $markets = config(
            'taxi_pricing.markets',
            []
        );

        $internationalAirports = config(
            'taxi_pricing.international_airports',
            []
        );

        $isoCodes = array_keys(
            $markets
        );

        $iataCodes = collect(
            $internationalAirports
        )
            ->flatten()
            ->filter()
            ->map(
                fn ($code) =>
                    strtoupper(
                        trim(
                            (string) $code
                        )
                    )
            )
            ->unique()
            ->values()
            ->all();

        if (
            $isoCodes === []
            ||
            $iataCodes === []
        ) {
            return $query
                ->whereRaw(
                    '1 = 0'
                );
        }

        return $query
            ->where(
                'is_active',
                true
            )
            ->whereNotNull(
                'iata_code'
            )
            ->whereIn(
                'iata_code',
                $iataCodes
            )
            ->whereHas(
                'country',
                function (
                    Builder $country
                ) use (
                    $isoCodes
                ): void {
                    $country
                        ->whereIn(
                            'iso2',
                            $isoCodes
                        )
                        ->where(
                            'is_active',
                            true
                        );
                }
            )
            ->where(
                'metadata->scheduled_service',
                'yes'
            );
    }

    public function marketEnabled(
        Airport $airport
    ): bool {
        $countryIso =
            strtoupper(
                trim(
                    (string) (
                        $airport
                            ->country
                            ?->iso2
                        ?? ''
                    )
                )
            );

        if (
            $countryIso === ''
        ) {
            return false;
        }

        $markets = config(
            'taxi_pricing.markets',
            []
        );

        if (
            !array_key_exists(
                $countryIso,
                $markets
            )
        ) {
            return false;
        }

        if (
            !$airport->is_active
            ||
            !$airport
                ->country
                ?->is_active
            ||
            !$airport->iata_code
        ) {
            return false;
        }

        $metadata =
            $airport->metadata
            ?? [];

        if (
            (
                $metadata[
                    'scheduled_service'
                ]
                ?? null
            ) !== 'yes'
        ) {
            return false;
        }

        $allowedAirports =
            config(
                'taxi_pricing.international_airports.'
                . $countryIso,
                []
            );

        $iata =
            strtoupper(
                trim(
                    (string) $airport
                        ->iata_code
                )
            );

        return in_array(
            $iata,
            $allowedAirports,
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Public Quote
    |--------------------------------------------------------------------------
    */

    public function quote(
        array $input
    ): array {
        $location =
            Location::with(
                'airport.country'
            )
                ->where(
                    'is_active',
                    true
                )
                ->where(
                    'is_public',
                    true
                )
                ->whereNotNull(
                    'airport_id'
                )
                ->find(
                    $input[
                        'airport_location_id'
                    ]
                );

        if (
            !$location
            ||
            !$location->airport
            ||
            !$this->marketEnabled(
                $location->airport
            )
        ) {
            return $this->unavailable(
                'market_unavailable',
                false
            );
        }

        $airport =
            $location->airport;

        $timezone =
            $airport->timezone
            ?: $location->timezone
            ?: 'UTC';

        try {
            $pickupAt =
                CarbonImmutable::parse(
                    $input[
                        'pickup_date'
                    ]
                    . ' '
                    . $input[
                        'pickup_time'
                    ],
                    $timezone
                );
        } catch (\Throwable) {
            return $this->unavailable(
                'invalid_pickup_time',
                false
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Taxi Market Reference
        |--------------------------------------------------------------------------
        |
        | Taxi tariff is used as a market reference.
        |
        | It is intentionally NOT filtered by selected Skyfleet vehicle class.
        |
        | Example:
        |
        | Local taxi reference = €50
        | Standard Car = €50 x 1.40
        | Luxury Car   = €50 x 10.00
        |
        */

        $matchedTariff =
            $this->findMatchingTariff(
                $airport,
                $input,
                $pickupAt
            );

        $taxiReference = null;
        $taxiDistanceKm = null;

        if (!$matchedTariff) {
            return $this->unavailable('verified_tariff_unavailable', true);
        }

        if ($matchedTariff) {
            $taxiResult =
                $this->calculateTaxiReference(
                    $airport,
                    $input,
                    $matchedTariff
                );

            if (
                $taxiResult[
                    'available'
                ]
                ?? false
            ) {
                $taxiReference =
                    (float) $taxiResult[
                        'price'
                    ];

                $taxiDistanceKm =
                    $taxiResult[
                        'distance_km'
                    ]
                    ?? null;
            }
        }

        // Public prices must start from an applicable local taxi tariff.
        // Supplier prices and generic distance estimates cannot replace it.
        if ($taxiReference === null || $taxiReference <= 0) {
            return $this->unavailable($taxiResult['reason'] ?? 'taxi_reference_unavailable', true);
        }

       /*
|--------------------------------------------------------------------------
| Supplier Cost
|--------------------------------------------------------------------------
|
| Public istemciden supplier_cost kabul etmiyoruz.
| Supplier maliyeti yalnızca backend içindeki RegionalPricingService
| tarafından belirlenir.
|
*/

$regionalPricing =
    $this->regionalPricing
        ->calculate(
            (float) $input[
                'latitude'
            ],
            (float) $input[
                'longitude'
            ],
            $input[
                'direction'
            ],
            $input[
                'vehicle_type'
            ],
            $location->id
        );

$supplierCost = null;
$supplierCurrency = null;

if (
    (
        $regionalPricing[
            'available'
        ]
        ?? false
    )
    &&
    isset(
        $regionalPricing[
            'supplier_average_price'
        ]
    )
    &&
    is_numeric(
        $regionalPricing[
            'supplier_average_price'
        ]
    )
) {
    $supplierCost =
        max(
            0,
            (float) $regionalPricing[
                'supplier_average_price'
            ]
        );

    $supplierCurrency =
        strtoupper(
            (string) (
                $regionalPricing[
                    'currency'
                ]
                ?? ''
            )
        );
}

        $distanceFallback = null;
        $distanceFallbackResult = null;

        if ($taxiReference !== null) {
            $currency =
                strtoupper(
                    (string) (
                        $matchedTariff[
                            'currency'
                        ]
                        ?? 'EUR'
                    )
                );
        } elseif (
            $supplierCost !== null
            &&
            $supplierCost > 0
        ) {
            $currency =
                $supplierCurrency
                ?: 'EUR';
        } else {
            $currency =
                strtoupper(
                    (string) (
                        $distanceFallbackResult[
                            'currency'
                        ]
                        ?? config(
                            'pricing_engine.global_distance_fallback.currency',
                            'EUR'
                        )
                    )
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Dynamic Pricing Engine
        |--------------------------------------------------------------------------
        */

        $pricing =
            $this->dynamicPricing
                ->calculate([
                    'airport_code' =>
                        strtoupper(
                            (string) $airport->iata_code
                        ),

                    'vehicle_type' =>
                        $input[
                            'vehicle_type'
                        ],

                    'taxi_reference' =>
                        $taxiReference,

                    'supplier_cost' =>
                        $supplierCost,

                    'distance_fallback' =>
                        $distanceFallback,

                    'currency' =>
                        $currency,

                    'pickup_date' =>
                        $input[
                            'pickup_date'
                        ],

                    'pickup_time' =>
                        $input[
                            'pickup_time'
                        ],

                    'timezone' =>
                        $timezone,

                    'low_supplier_availability' =>
                        (bool) (
                            $input[
                                'low_supplier_availability'
                            ]
                            ?? false
                        ),

                    'high_demand' =>
                        (bool) (
                            $input[
                                'high_demand'
                            ]
                            ?? false
                        ),

                    'agency_discount_percent' =>
                        isset(
                            $input[
                                'agency_discount_percent'
                            ]
                        )
                            ? (float) $input[
                                'agency_discount_percent'
                            ]
                            : null,
                ]);

        if (
            !(
                $pricing[
                    'available'
                ]
                ?? false
            )
        ) {
            return [
                'available' =>
                    false,

                'manual_quote_available' =>
                    true,

                'manual_quote_required' =>
                    true,

                'reason' =>
                    $pricing[
                        'reason'
                    ]
                    ?? (
                        $matchedTariff
                            ? 'pricing_unavailable'
                            : 'verified_tariff_unavailable'
                    ),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Display Currency
        |--------------------------------------------------------------------------
        |
        | Internal pricing stays in the market/base currency. Only the final sale
        | prices are converted for display/payment. The FX rate is locked inside
        | the encrypted quote token so later rate moves do not alter the booking.
        |
        */

        $baseCurrency =
            strtoupper(
                (string) $pricing[
                    'currency'
                ]
            );

        $displayCurrency =
            strtoupper(
                trim(
                    (string) (
                        $input[
                            'display_currency'
                        ]
                        ?? $baseCurrency
                    )
                )
            );

        if (
            !$this->currencyService
                ->isSupported(
                    $displayCurrency
                )
        ) {
            return [
                'available' => false,
                'manual_quote_available' => false,
                'manual_quote_required' => false,
                'reason' => 'unsupported_display_currency',
            ];
        }

        try {
            $publicConversion =
                $this->currencyService
                    ->convert(
                        (float) $pricing[
                            'public_price'
                        ],
                        $baseCurrency,
                        $displayCurrency
                    );

            $agencyConversion =
                $this->currencyService
                    ->convert(
                        (float) $pricing[
                            'agency_price'
                        ],
                        $baseCurrency,
                        $displayCurrency
                    );
        } catch (\Throwable $exception) {
            report($exception);

            return [
                'available' => false,
                'manual_quote_available' => true,
                'manual_quote_required' => true,
                'reason' => 'currency_conversion_unavailable',
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Quote Lifetime
        |--------------------------------------------------------------------------
        */

        $quoteLifetimeMinutes =
            max(
                1,
                (int) config(
                    'pricing_engine.quote_lifetime_minutes',
                    30
                )
            );

        $expiresAt =
            now()
                ->addMinutes(
                    $quoteLifetimeMinutes
                );

        /*
        |--------------------------------------------------------------------------
        | Encrypted Internal Snapshot
        |--------------------------------------------------------------------------
        |
        | Taxi reference, supplier cost, margin and calculation details stay
        | inside the encrypted token.
        |
        | They are NOT returned openly by the public API.
        |
        */

        $snapshot = [
            'version' =>
                3,

            'airport_location_id' =>
                $location->id,

            'airport_id' =>
                $airport->id,

            'airport_code' =>
                $airport->iata_code,

            'country_iso' =>
                $airport
                    ->country
                    ?->iso2,

            'direction' =>
                $input[
                    'direction'
                ],

            'vehicle_type' =>
                $input[
                    'vehicle_type'
                ],

            'passengers' =>
                (int) $input[
                    'passengers'
                ],

            'luggage_count' =>
                (int) (
                    $input[
                        'luggage_count'
                    ]
                    ?? 0
                ),

            'pickup_date' =>
                $input[
                    'pickup_date'
                ],

            'pickup_time' =>
                $input[
                    'pickup_time'
                ],

            'timezone' =>
                $timezone,

            /*
             * Route coordinates.
             */

            'airport_latitude' =>
                (float) (
                    $location->latitude
                    ??
                    $airport->latitude
                ),

            'airport_longitude' =>
                (float) (
                    $location->longitude
                    ??
                    $airport->longitude
                ),

            'latitude' =>
                (float) $input[
                    'latitude'
                ],

            'longitude' =>
                (float) $input[
                    'longitude'
                ],

            /*
             * Taxi reference.
             */

            'taxi_tariff_id' =>
                $matchedTariff[
                    'id'
                ]
                ?? null,

            'taxi_source_url' =>
                $matchedTariff[
                    'source_url'
                ]
                ?? null,

            'taxi_verified_at' =>
                $matchedTariff[
                    'verified_at'
                ]
                ?? null,

            'taxi_reference' =>
                $taxiReference,

            'taxi_distance_km' =>
                $taxiDistanceKm,

            /*
             * Supplier data.
             */

            'supplier_cost' =>
                $supplierCost,

            'distance_fallback_price' =>
                $pricing[
                    'distance_fallback_price'
                ]
                ?? null,

            'distance_fallback_km' =>
                $distanceFallbackResult[
                    'distance_km'
                ]
                ?? null,

            /*
             * Pricing engine result.
             */

            'pricing_source' =>
                $pricing[
                    'pricing_source'
                ],

            'taxi_based_price' =>
                $pricing[
                    'taxi_based_price'
                ],

            'supplier_based_price' =>
                $pricing[
                    'supplier_based_price'
                ],

            'cost_floor' =>
                $pricing[
                    'cost_floor'
                ],

            'base_price' =>
                $pricing[
                    'base_price'
                ],

            'dynamic_surcharge_percent' =>
                $pricing[
                    'dynamic_surcharge_percent'
                ],

            'dynamic_components' =>
                $pricing[
                    'dynamic_components'
                ],

            /*
             * Final sales prices.
             */

            'base_public_price' =>
                $pricing[
                    'public_price'
                ],

            'base_agency_price' =>
                $pricing[
                    'agency_price'
                ],

            'agency_discount_percent' =>
                isset(
                    $input[
                        'agency_discount_percent'
                    ]
                )
                    ? (float) $input[
                        'agency_discount_percent'
                    ]
                    : (float) config(
                        'pricing_engine.agency.discount_from_public_percent',
                        10
                    ),

            'base_currency' =>
                $baseCurrency,

            'public_price' =>
                $publicConversion[
                    'amount'
                ],

            'agency_price' =>
                $agencyConversion[
                    'amount'
                ],

            'currency' =>
                $displayCurrency,

            'display_currency' =>
                $displayCurrency,

            'exchange_rate' =>
                $publicConversion[
                    'rate'
                ],

            'exchange_rate_source' =>
                $publicConversion[
                    'source'
                ],

            'exchange_rate_reference_date' =>
                $publicConversion[
                    'reference_date'
                ],

            'exchange_rate_at' =>
                $publicConversion[
                    'fetched_at'
                ],

            'exchange_rate_stale' =>
                $publicConversion[
                    'stale'
                ],

            'expires_at' =>
                $expiresAt
                    ->toIso8601String(),
        ];

        $quoteToken =
            Crypt::encryptString(
                json_encode(
                    $snapshot,
                    JSON_THROW_ON_ERROR
                )
            );

        /*
        |--------------------------------------------------------------------------
        | Public Response
        |--------------------------------------------------------------------------
        |
        | Only sale information is public.
        |
        | No:
        | - taxi reference
        | - supplier cost
        | - cost floor
        | - margin
        |
        */

        return [
            'available' =>
                true,

            'manual_quote_required' =>
                false,

            'vehicle_type' =>
                $input[
                    'vehicle_type'
                ],

            'public_price' =>
                $publicConversion[
                    'amount'
                ],

            'currency' =>
                $displayCurrency,

            'base_currency' =>
                $baseCurrency,

            'exchange_rate_locked' =>
                true,

            'pricing_source' =>
                $pricing[
                    'pricing_source'
                ],

            'is_estimate' =>
                true,

            'timezone' =>
                $timezone,

            'expires_at' =>
                $expiresAt
                    ->toIso8601String(),

            'quote_token' =>
                $quoteToken,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Quote At Booking Time
    |--------------------------------------------------------------------------
    */

    public function validateQuote(
        string $token,
        array $request
    ): array {
        try {
            $quote =
                json_decode(
                    Crypt::decryptString(
                        $token
                    ),
                    true,
                    512,
                    JSON_THROW_ON_ERROR
                );
        } catch (
            DecryptException
            |
            \JsonException
            $exception
        ) {
            throw ValidationException::
                withMessages([
                    'quote_token' =>
                        'Fiyat doğrulanamadı. Lütfen yeniden hesaplayın.',
                ]);
        }

        if (
            !in_array(
                $quote[
                    'version'
                ]
                ?? null,
                [
                    1,
                    2,
                    3,
                ],
                true
            )
        ) {
            throw ValidationException::
                withMessages([
                    'quote_token' =>
                        'Fiyat doğrulanamadı. Lütfen yeniden hesaplayın.',
                ]);
        }

        if (
            empty(
                $quote[
                    'expires_at'
                ]
            )
            ||
            CarbonImmutable::parse(
                $quote[
                    'expires_at'
                ]
            )->isPast()
        ) {
            throw ValidationException::
                withMessages([
                    'quote_token' =>
                        'Fiyatın süresi doldu. Lütfen yeniden hesaplayın.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Booking Details Must Match Quote
        |--------------------------------------------------------------------------
        */

        foreach (
            [
                'vehicle_type',
                'passengers',
                'luggage_count',
                'pickup_date',
                'pickup_time',
                'timezone',
            ]
            as $field
        ) {
            if (
                (string) (
                    $request[
                        $field
                    ]
                    ?? ''
                )
                !==
                (string) (
                    $quote[
                        $field
                    ]
                    ?? ''
                )
            ) {
                throw ValidationException::
                    withMessages([
                        'quote_token' =>
                            'Yolculuk bilgileri değişti. Lütfen fiyatı yeniden hesaplayın.',
                    ]);
            }
        }

        $requestDisplayCurrency =
            strtoupper(
                trim(
                    (string) (
                        $request[
                            'display_currency'
                        ]
                        ?? $request[
                            'currency'
                        ]
                        ?? ''
                    )
                )
            );

        if (
            $requestDisplayCurrency !== ''
            &&
            $requestDisplayCurrency !==
                strtoupper(
                    (string) (
                        $quote[
                            'display_currency'
                        ]
                        ?? $quote[
                            'currency'
                        ]
                        ?? ''
                    )
                )
        ) {
            throw ValidationException::
                withMessages([
                    'quote_token' =>
                        'Para birimi değişti. Lütfen fiyatı yeniden hesaplayın.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Route Coordinates Must Match Quote
        |--------------------------------------------------------------------------
        */

        $airportEnd =
            $quote[
                'direction'
            ] === 'pickup'
                ? 'pickup'
                : 'dropoff';

        $addressEnd =
            $airportEnd ===
            'pickup'
                ? 'dropoff'
                : 'pickup';

        $coordinateMap = [
            $airportEnd => [
                'airport_latitude',
                'airport_longitude',
            ],

            $addressEnd => [
                'latitude',
                'longitude',
            ],
        ];

        foreach (
            $coordinateMap
            as $end => $fields
        ) {
            foreach (
                [
                    'lat',
                    'lng',
                ]
                as $index => $axis
            ) {
                $requestKey =
                    $end
                    . '_'
                    . $axis;

                $quoteKey =
                    $fields[
                        $index
                    ];

                if (
                    !isset(
                        $request[
                            $requestKey
                        ]
                    )
                    ||
                    !isset(
                        $quote[
                            $quoteKey
                        ]
                    )
                    ||
                    abs(
                        (float) $request[
                            $requestKey
                        ]
                        -
                        (float) $quote[
                            $quoteKey
                        ]
                    )
                    >
                    0.00001
                ) {
                    throw ValidationException::
                        withMessages([
                            'quote_token' =>
                                'Güzergâh değişti. Lütfen fiyatı yeniden hesaplayın.',
                        ]);
                }
            }
        }

        return $quote;
    }

    /*
    |--------------------------------------------------------------------------
    | Find Verified Taxi Tariff
    |--------------------------------------------------------------------------
    */

    private function findMatchingTariff(
        Airport $airport,
        array $input,
        CarbonImmutable $pickupAt
    ): ?array {
        foreach (
            config(
                'taxi_pricing.tariffs',
                []
            )
            as $tariff
        ) {
            if (
                !(
                    $tariff[
                        'enabled'
                    ]
                    ?? false
                )
            ) {
                continue;
            }

            $airportCodes =
                array_map(
                    fn ($code) =>
                        strtoupper(
                            trim(
                                (string) $code
                            )
                        ),
                    $tariff[
                        'airports'
                    ]
                    ?? []
                );

            if (
                !in_array(
                    strtoupper(
                        (string) $airport
                            ->iata_code
                    ),
                    $airportCodes,
                    true
                )
            ) {
                continue;
            }

            if (
                !in_array(
                    $input[
                        'direction'
                    ],
                    $tariff[
                        'directions'
                    ]
                    ?? [],
                    true
                )
            ) {
                continue;
            }

            /*
             * vehicle_type intentionally NOT checked here.
             *
             * Taxi fare is the market reference.
             * DynamicPricingService applies the Skyfleet vehicle multiplier.
             */

            if (
                empty(
                    $tariff[
                        'source_url'
                    ]
                )
                ||
                empty(
                    $tariff[
                        'verified_at'
                    ]
                )
            ) {
                continue;
            }

            $reviewDays =
                max(
                    1,
                    (int) config(
                        'taxi_pricing.review_interval_days',
                        90
                    )
                );

            try {
                $verifiedUntil =
                    CarbonImmutable::parse(
                        $tariff[
                            'verified_at'
                        ]
                    )
                        ->addDays(
                            $reviewDays
                        )
                        ->endOfDay();
            } catch (\Throwable) {
                continue;
            }

            if (
                $verifiedUntil
                    ->isPast()
            ) {
                continue;
            }

            if (
                !empty(
                    $tariff[
                        'valid_from'
                    ]
                )
                &&
                $pickupAt
                    ->toDateString()
                <
                $tariff[
                    'valid_from'
                ]
            ) {
                continue;
            }

            if (
                !empty(
                    $tariff[
                        'valid_until'
                    ]
                )
                &&
                $pickupAt
                    ->toDateString()
                >
                $tariff[
                    'valid_until'
                ]
            ) {
                continue;
            }

            if (
                empty(
                    $tariff[
                        'zone'
                    ]
                )
            ) {
                continue;
            }

            if (
                !$this->insideZone(
                    $tariff[
                        'zone'
                    ],
                    (float) $input[
                        'latitude'
                    ],
                    (float) $input[
                        'longitude'
                    ]
                )
            ) {
                continue;
            }

            return $tariff;
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate Taxi Reference
    |--------------------------------------------------------------------------
    */

    private function calculateTaxiReference(
        Airport $airport,
        array $input,
        array $tariff
    ): array {
        $type =
            $tariff[
                'type'
            ]
            ?? null;

        if (
            $type === 'fixed'
        ) {
            $amount =
                (float) (
                    $tariff[
                        'amount'
                    ]
                    ?? 0
                );

            if ($amount <= 0) {
                return [
                    'available' =>
                        false,

                    'reason' =>
                        'invalid_tariff',
                ];
            }

            return [
                'available' =>
                    true,

                'price' =>
                    $amount,

                'distance_km' =>
                    null,
            ];
        }

        if (
            $type === 'metered'
        ) {
            return $this
                ->calculateMeteredReference(
                    $airport,
                    $input,
                    $tariff
                );
        }

        return [
            'available' =>
                false,

            'reason' =>
                'unsupported_tariff_type',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Metered Taxi Reference
    |--------------------------------------------------------------------------
    */

    private function calculateMeteredReference(
        Airport $airport,
        array $input,
        array $tariff
    ): array {
        if (
            $airport->latitude === null
            ||
            $airport->longitude === null
        ) {
            return [
                'available' =>
                    false,

                'reason' =>
                    'route_unavailable',
            ];
        }

        $airportPoint = match (
    strtoupper((string) $airport->iata_code)
) {
    'IST' => [
        41.2600,
        28.7400,
    ],

    default => [
        (float) $airport->latitude,
        (float) $airport->longitude,
    ],
};

        $addressPoint = [
            (float) $input[
                'latitude'
            ],
            (float) $input[
                'longitude'
            ],
        ];

        if (
            $input[
                'direction'
            ] === 'pickup'
        ) {
            $from =
                $airportPoint;

            $to =
                $addressPoint;
        } else {
            $from =
                $addressPoint;

            $to =
                $airportPoint;
        }

        $route =
            $this->routing->route(
                $from[0],
                $from[1],
                $to[0],
                $to[1]
            );

        if (
            !$route
            ||
            empty(
                $route[
                    'distance_meters'
                ]
            )
            ||
            $route[
                'distance_meters'
            ] <= 0
        ) {
            return [
                'available' =>
                    false,

                'reason' =>
                    'route_unavailable',
            ];
        }

        $distanceKm =
            $route[
                'distance_meters'
            ]
            / 1000;

        $maxDistanceKm =
            (float) (
                $tariff[
                    'max_distance_km'
                ]
                ?? 0
            );

        if (
            $maxDistanceKm > 0
            &&
            $distanceKm >
            $maxDistanceKm
        ) {
            return [
                'available' =>
                    false,

                'reason' =>
                    'route_unavailable',
            ];
        }

        $base =
            (float) (
                $tariff[
                    'base'
                ]
                ?? 0
            );

        $perKm =
            (float) (
                $tariff[
                    'per_km'
                ]
                ?? 0
            );

        $minimum =
            (float) (
                $tariff[
                    'minimum'
                ]
                ?? 0
            );

        $price =
            max(
                $minimum,
                $base
                +
                (
                    $perKm
                    *
                    $distanceKm
                )
            );

        if ($price <= 0) {
            return [
                'available' =>
                    false,

                'reason' =>
                    'invalid_tariff',
            ];
        }

        return [
            'available' =>
                true,

            'price' =>
                $price,

            'distance_km' =>
                round(
                    $distanceKm,
                    2
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Global Distance Fallback
    |--------------------------------------------------------------------------
    |
    | Final safety net when neither a verified taxi reference nor a supplier
    | polygon price is available. Uses the existing routing service, so it works
    | for any enabled airport market with routable coordinates.
    |
    */

    private function calculateGlobalDistanceFallback(
        Airport $airport,
        Location $location,
        array $input
    ): ?array {
        if (
            !config(
                'pricing_engine.global_distance_fallback.enabled',
                true
            )
        ) {
            return null;
        }

        $airportLatitude =
            $location->latitude
            ?? $airport->latitude;

        $airportLongitude =
            $location->longitude
            ?? $airport->longitude;

        if (
            $airportLatitude === null
            ||
            $airportLongitude === null
        ) {
            return null;
        }

        $airportPoint = [
            (float) $airportLatitude,
            (float) $airportLongitude,
        ];

        $addressPoint = [
            (float) $input['latitude'],
            (float) $input['longitude'],
        ];

        if (
            $input['direction'] === 'pickup'
        ) {
            $from = $airportPoint;
            $to = $addressPoint;
        } else {
            $from = $addressPoint;
            $to = $airportPoint;
        }

        $route =
            $this->routing->route(
                $from[0],
                $from[1],
                $to[0],
                $to[1]
            );

        if (
            !$route
            ||
            empty(
                $route['distance_meters']
            )
            ||
            (float) $route['distance_meters'] <= 0
        ) {
            return null;
        }

        $distanceKm =
            (float) $route['distance_meters']
            / 1000;

        $baseFare =
            (float) config(
                'pricing_engine.global_distance_fallback.base_fare',
                10.00
            );

        $perKm =
            (float) config(
                'pricing_engine.global_distance_fallback.per_km',
                1.20
            );

        $minimumFare =
            (float) config(
                'pricing_engine.global_distance_fallback.minimum_fare',
                25.00
            );

        $vehicleMultiplier =
            (float) config(
                'pricing_engine.global_distance_fallback.vehicle_multipliers.'
                . $input['vehicle_type'],
                1.00
            );

        $referencePrice =
            max(
                $minimumFare,
                $baseFare
                +
                (
                    $distanceKm
                    *
                    $perKm
                )
            );

        $price =
            $referencePrice
            *
            max(
                0.01,
                $vehicleMultiplier
            );

        if ($price <= 0) {
            return null;
        }

        return [
            'price' => round($price, 2),
            'distance_km' => round($distanceKm, 2),
            'currency' => strtoupper(
                (string) config(
                    'pricing_engine.global_distance_fallback.currency',
                    'EUR'
                )
            ),
            'base_fare' => $baseFare,
            'per_km' => $perKm,
            'vehicle_multiplier' => $vehicleMultiplier,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Zone Check
    |--------------------------------------------------------------------------
    */

    private function insideZone(
        array $zone,
        float $latitude,
        float $longitude
    ): bool {
        if (
            !isset(
                $zone[
                    'latitude'
                ],
                $zone[
                    'longitude'
                ],
                $zone[
                    'radius_km'
                ]
            )
        ) {
            return false;
        }

        $zoneLatitude =
            (float) $zone[
                'latitude'
            ];

        $zoneLongitude =
            (float) $zone[
                'longitude'
            ];

        $radiusKm =
            (float) $zone[
                'radius_km'
            ];

        if (
            $radiusKm <= 0
        ) {
            return false;
        }

        $a =
            sin(
                deg2rad(
                    $latitude
                    -
                    $zoneLatitude
                )
                / 2
            ) ** 2
            +
            cos(
                deg2rad(
                    $latitude
                )
            )
            *
            cos(
                deg2rad(
                    $zoneLatitude
                )
            )
            *
            sin(
                deg2rad(
                    $longitude
                    -
                    $zoneLongitude
                )
                / 2
            ) ** 2;

        $distanceKm =
            6371
            *
            2
            *
            asin(
                sqrt(
                    min(
                        1,
                        $a
                    )
                )
            );

        return
            $distanceKm
            <=
            $radiusKm;
    }

    /*
    |--------------------------------------------------------------------------
    | Unavailable Response
    |--------------------------------------------------------------------------
    */

    private function unavailable(
        string $reason,
        bool $manual = true
    ): array {
        return [
            'available' =>
                false,

            'manual_quote_available' =>
                $manual,

            'manual_quote_required' =>
                $manual,

            'reason' =>
                $reason,
        ];
    }
}
