<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

class DynamicPricingService
{
    public function calculate(
        array $input
    ): array {
        $vehicleType =
            (string) (
                $input['vehicle_type']
                ?? ''
            );

        if ($vehicleType === '') {
            throw new InvalidArgumentException(
                'Vehicle type is required.'
            );
        }

        $currency =
            strtoupper(
                (string) (
                    $input['currency']
                    ?? 'EUR'
                )
            );

        $taxiReference =
            $this->nullableAmount(
                $input['taxi_reference']
                ?? null
            );

        $supplierCost =
            $this->nullableAmount(
                $input['supplier_cost']
                ?? null
            );


        $distanceFallback =
            $this->nullableAmount(
                $input['distance_fallback']
                ?? null
            );

        /*
        |--------------------------------------------------------------------------
        | Source prices
        |--------------------------------------------------------------------------
        */

        $taxiBasedPrice =
            $this->calculateTaxiBasedPrice(
                $vehicleType,
                $taxiReference
            );

        $supplierBasedPrice =
            $this->calculateSupplierBasedPrice(
                $vehicleType,
                $supplierCost
            );

        $costFloor =
            $this->calculateCostFloor(
                $vehicleType,
                $supplierCost
            );

        /*
        |--------------------------------------------------------------------------
        | Base price
        |--------------------------------------------------------------------------
        */

        $pricingSource = null;

        if ($taxiBasedPrice !== null) {
            $basePrice =
                max(
                    $taxiBasedPrice,
                    $costFloor ?? 0
                );

            $pricingSource =
                'taxi_reference';
        } elseif (
            $supplierBasedPrice !== null
        ) {
            $basePrice =
                max(
                    $supplierBasedPrice,
                    $costFloor ?? 0
                );

            $pricingSource =
                'supplier_polygon';
        } elseif (
            $distanceFallback !== null
            &&
            $distanceFallback > 0
        ) {
            $basePrice =
                $distanceFallback;

            $pricingSource =
                'global_distance_fallback';
        } else {
            return [
                'available' => false,

                'manual_quote_required' =>
                    true,

                'reason' =>
                    'pricing_source_unavailable',

                'currency' =>
                    $currency,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Dynamic surcharge
        |--------------------------------------------------------------------------
        */

        $dynamic =
            $this->calculateDynamicSurcharge(
                $input
            );

        $publicPrice =
            $basePrice
            *
            (
                1
                +
                (
                    $dynamic[
                        'total_percent'
                    ]
                    / 100
                )
            );

        $publicPrice =
            $this->roundPrice(
                $publicPrice
            );

        /*
        |--------------------------------------------------------------------------
        | Agency price
        |--------------------------------------------------------------------------
        */

        $agencyPrice =
            $this->calculateAgencyPrice(
                $vehicleType,
                $publicPrice,
                $supplierCost,
                isset($input['agency_discount_percent'])
                    ? (float) $input['agency_discount_percent']
                    : null
            );

        return [

            'available' =>
                true,

            'manual_quote_required' =>
                false,

            'currency' =>
                $currency,

            'vehicle_type' =>
                $vehicleType,

            'pricing_source' =>
                $pricingSource,

            /*
             * Internal values.
             *
             * Do not expose these fields directly to public website API.
             */

            'taxi_reference' =>
                $taxiReference,

            'supplier_cost' =>
                $supplierCost,

            'taxi_based_price' =>
                $taxiBasedPrice,

            'supplier_based_price' =>
                $supplierBasedPrice,

            'distance_fallback_price' =>
                $distanceFallback,

            'cost_floor' =>
                $costFloor,

            'base_price' =>
                $this->roundPrice(
                    $basePrice
                ),

            'dynamic_surcharge_percent' =>
                $dynamic[
                    'total_percent'
                ],

            'dynamic_components' =>
                $dynamic[
                    'components'
                ],

            /*
             * Public selling price.
             */

            'public_price' =>
                $publicPrice,

            /*
             * Agency net price.
             */

            'agency_price' =>
                $agencyPrice,

        ];
    }

    private function calculateTaxiBasedPrice(
        string $vehicleType,
        ?float $taxiReference
    ): ?float {
        if (
            $taxiReference === null
            ||
            $taxiReference <= 0
        ) {
            return null;
        }

        $multiplier =
            config(
                'pricing_engine.vehicle_multipliers.'
                . $vehicleType
            );

        if (
            !is_numeric(
                $multiplier
            )
        ) {
            return null;
        }

        return
            $taxiReference
            *
            (float) $multiplier;
    }

    private function calculateSupplierBasedPrice(
        string $vehicleType,
        ?float $supplierCost
    ): ?float {
        if (
            $supplierCost === null
            ||
            $supplierCost <= 0
        ) {
            return null;
        }

        $markup =
            config(
                'pricing_engine.supplier_markups.'
                . $vehicleType
            );

        if (
            !is_numeric(
                $markup
            )
        ) {
            return null;
        }

        return
            $supplierCost
            *
            (float) $markup;
    }

    private function calculateCostFloor(
        string $vehicleType,
        ?float $supplierCost
    ): ?float {
        if (
            $supplierCost === null
            ||
            $supplierCost <= 0
        ) {
            return null;
        }

        $paymentFeePercent =
            (float) config(
                'pricing_engine.payment_fee_percent',
                0
            );

        $operationalCost =
            (float) config(
                'pricing_engine.operational_cost',
                0
            );

        $minimumMargin =
            (float) config(
                'pricing_engine.minimum_margins.'
                . $vehicleType,
                0
            );

        $paymentFee =
            $supplierCost
            *
            (
                $paymentFeePercent
                / 100
            );

        return
            $supplierCost
            +
            $paymentFee
            +
            $operationalCost
            +
            $minimumMargin;
    }

    private function calculateDynamicSurcharge(
        array $input
    ): array {
        if (
            !config(
                'pricing_engine.dynamic.enabled',
                true
            )
        ) {
            return [
                'total_percent' => 0.0,
                'components' => [],
            ];
        }

        $components = [];

        $pickupAt =
            $this->resolvePickupAt(
                $input
            );

        /*
        |--------------------------------------------------------------------------
        | Airport peak surcharge
        |--------------------------------------------------------------------------
        */

        $airportCode =
            strtoupper(
                trim(
                    (string) (
                        $input['airport_code']
                        ?? ''
                    )
                )
            );

        $airportPeakAirports =
            array_map(
                static fn ($code) =>
                    strtoupper(
                        trim(
                            (string) $code
                        )
                    ),
                config(
                    'pricing_engine.dynamic.airport_peak.airports',
                    []
                )
            );

        $isAirportPeakMarket =
            (bool) config(
                'pricing_engine.dynamic.airport_peak.enabled',
                false
            )
            &&
            in_array(
                $airportCode,
                $airportPeakAirports,
                true
            );

        $isAirportPeakTime = false;

        if (
            $pickupAt
            &&
            $isAirportPeakMarket
        ) {
            $peakStart =
                (string) config(
                    'pricing_engine.dynamic.airport_peak.start',
                    '14:00'
                );

            $peakEnd =
                (string) config(
                    'pricing_engine.dynamic.airport_peak.end',
                    '23:00'
                );

            $currentTime =
                $pickupAt->format(
                    'H:i'
                );

            if ($peakStart <= $peakEnd) {
                $isAirportPeakTime =
                    $currentTime >= $peakStart
                    &&
                    $currentTime < $peakEnd;
            } else {
                $isAirportPeakTime =
                    $currentTime >= $peakStart
                    ||
                    $currentTime < $peakEnd;
            }

            if ($isAirportPeakTime) {
                $components[
                    'airport_peak'
                ] =
                    (float) config(
                        'pricing_engine.dynamic.airport_peak.percent',
                        10
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Night surcharge
        |--------------------------------------------------------------------------
        */

        if (
            $pickupAt
            &&
            config(
                'pricing_engine.dynamic.night.enabled',
                true
            )
            &&
            !(
                $isAirportPeakMarket
                &&
                (bool) config(
                    'pricing_engine.dynamic.airport_peak.replace_night_surcharge',
                    false
                )
            )
            &&
            $this->isNightTime(
                $pickupAt
            )
        ) {
            $components[
                'night'
            ] =
                (float) config(
                    'pricing_engine.dynamic.night.percent',
                    0
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Weekend surcharge
        |--------------------------------------------------------------------------
        */

        if (
            $pickupAt
            &&
            config(
                'pricing_engine.dynamic.weekend.enabled',
                true
            )
            &&
            $pickupAt->isWeekend()
        ) {
            $components[
                'weekend'
            ] =
                (float) config(
                    'pricing_engine.dynamic.weekend.percent',
                    0
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Lead time
        |--------------------------------------------------------------------------
        */

        if ($pickupAt) {
            $now =
                CarbonImmutable::now(
                    $pickupAt->timezone
                );

            $hoursUntilPickup =
                $now->diffInMinutes(
                    $pickupAt,
                    false
                )
                / 60;

            if (
                $hoursUntilPickup >= 0
                &&
                $hoursUntilPickup < 2
            ) {
                $components[
                    'short_lead_time'
                ] =
                    (float) config(
                        'pricing_engine.dynamic.lead_time.under_2_hours_percent',
                        0
                    );
            } elseif (
                $hoursUntilPickup >= 0
                &&
                $hoursUntilPickup < 6
            ) {
                $components[
                    'short_lead_time'
                ] =
                    (float) config(
                        'pricing_engine.dynamic.lead_time.under_6_hours_percent',
                        0
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Supply pressure
        |--------------------------------------------------------------------------
        */

        if (
            (bool) (
                $input[
                    'low_supplier_availability'
                ]
                ?? false
            )
        ) {
            $components[
                'low_supplier_availability'
            ] =
                (float) config(
                    'pricing_engine.dynamic.low_supplier_availability_percent',
                    0
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Demand pressure
        |--------------------------------------------------------------------------
        */

        if (
            (bool) (
                $input[
                    'high_demand'
                ]
                ?? false
            )
        ) {
            $components[
                'high_demand'
            ] =
                (float) config(
                    'pricing_engine.dynamic.high_demand_percent',
                    0
                );
        }

        $total =
            array_sum(
                $components
            );

        $maximum =
            max(
                0,
                (float) config(
                    'pricing_engine.dynamic.max_surcharge_percent',
                    25
                )
            );

        $total =
            min(
                $maximum,
                $total
            );

        return [
            'total_percent' =>
                $total,

            'components' =>
                $components,
        ];
    }

    private function calculateAgencyPrice(
        string $vehicleType,
        float $publicPrice,
        ?float $supplierCost,
        ?float $agencyDiscountPercent = null
    ): float {
        $discountPercent =
            max(
                0,
                min(
                    100,
                    $agencyDiscountPercent
                    ?? (float) config(
                        'pricing_engine.agency.discount_from_public_percent',
                        10
                    )
                )
            );

        $discountedPublic =
            $publicPrice
            *
            (
                1
                -
                (
                    $discountPercent
                    / 100
                )
            );

        if (
            $supplierCost === null
            ||
            $supplierCost <= 0
        ) {
            return $this->roundPrice(
                $discountedPublic
            );
        }

        $minimumAgencyMargin =
            (float) config(
                'pricing_engine.agency.minimum_margins.'
                . $vehicleType,
                0
            );

        $agencyFloor =
            $supplierCost
            +
            $minimumAgencyMargin;

        return $this->roundPrice(
            max(
                $discountedPublic,
                $agencyFloor
            )
        );
    }

    private function resolvePickupAt(
        array $input
    ): ?CarbonImmutable {
        $date =
            trim(
                (string) (
                    $input[
                        'pickup_date'
                    ]
                    ?? ''
                )
            );

        $time =
            trim(
                (string) (
                    $input[
                        'pickup_time'
                    ]
                    ?? ''
                )
            );

        if (
            $date === ''
            ||
            $time === ''
        ) {
            return null;
        }

        $timezone =
            trim(
                (string) (
                    $input[
                        'timezone'
                    ]
                    ?? 'UTC'
                )
            );

        try {
            return CarbonImmutable::parse(
                $date
                . ' '
                . $time,
                $timezone
            );
        } catch (
            \Throwable
        ) {
            return null;
        }
    }

    private function isNightTime(
        CarbonImmutable $pickupAt
    ): bool {
        $start =
            config(
                'pricing_engine.dynamic.night.start',
                '22:00'
            );

        $end =
            config(
                'pricing_engine.dynamic.night.end',
                '06:00'
            );

        $time =
            $pickupAt->format(
                'H:i'
            );

        /*
         * Range crosses midnight.
         */

        if ($start > $end) {
            return
                $time >= $start
                ||
                $time < $end;
        }

        return
            $time >= $start
            &&
            $time < $end;
    }

    private function nullableAmount(
        mixed $value
    ): ?float {
        if (
            $value === null
            ||
            $value === ''
            ||
            !is_numeric(
                $value
            )
        ) {
            return null;
        }

        $amount =
            (float) $value;

        return
            $amount >= 0
                ? $amount
                : null;
    }

    private function roundPrice(
        float $price
    ): float {
        $nearest =
            (float) config(
                'pricing_engine.rounding.nearest',
                0.01
            );

        if ($nearest <= 0) {
            $nearest = 0.01;
        }

        return round(
            round(
                $price
                / $nearest
            )
            *
            $nearest,
            2
        );
    }
}

