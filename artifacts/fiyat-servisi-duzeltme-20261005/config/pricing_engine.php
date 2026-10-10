<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Pricing Engine
    |--------------------------------------------------------------------------
    */

    'enabled' => true,

    /*
    |--------------------------------------------------------------------------
    | Vehicle Multipliers
    |--------------------------------------------------------------------------
    |
    | Used when a verified local taxi reference exists.
    |
    */

    'vehicle_multipliers' => [

        'standard_car' => 1.40,

        'executive_car' => 7.00,

        'luxury_car' => 10.00,

        'people_carrier' => 1.50,

        'executive_people_carrier' => 1.65,

        'large_people_carrier' => 1.50,

        'minibus' => 2.00,

    ],

    /*
    |--------------------------------------------------------------------------
    | Supplier Fallback Markups
    |--------------------------------------------------------------------------
    |
    | Used only when a verified taxi reference is unavailable.
    |
    */

    'supplier_markups' => [

        'standard_car' => 1.25,

        'executive_car' => 1.35,

        'luxury_car' => 1.45,

        'people_carrier' => 1.25,

        'executive_people_carrier' => 1.30,

        'large_people_carrier' => 1.25,

        'minibus' => 1.25,

    ],

    /*
    |--------------------------------------------------------------------------
    | Minimum Margin Per Vehicle
    |--------------------------------------------------------------------------
    |
    | Values are expressed in the quote currency.
    | V1 assumes the supplier and selling currenciesare identical.
    |
    */

    'minimum_margins' => [

        'standard_car' => 8.00,

        'executive_car' => 25.00,

        'luxury_car' => 40.00,

        'people_carrier' => 10.00,

        'executive_people_carrier' => 15.00,

        'large_people_carrier' => 15.00,

        'minibus' => 20.00,

    ],

    /*
    |--------------------------------------------------------------------------
    | Cost Protection
    |--------------------------------------------------------------------------
    */

    'payment_fee_percent' => 3.00,

    'operational_cost' => 2.00,

    /*
    |--------------------------------------------------------------------------
    | Dynamic Pricing
    |--------------------------------------------------------------------------
    */

    'dynamic' => [

        'enabled' => true,

        /*
         * Maximum total dynamic surcharge.
         */

        'max_surcharge_percent' => 25.00,

        /*
         * Airport-specific peak traffic window.
         *
         * IST and SAW:
         * 14:00 inclusive -> 23:00 exclusive = +10%
         * Other hours use normal tariff.
         * Weekend surcharge remains active.
         * Generic night surcharge is replaced for these airports.
         */

        'airport_peak' => [

            'enabled' => true,

            'airports' => [
                'IST',
                'SAW',
            ],

            'start' => '14:00',

            'end' => '23:00',

            'percent' => 10.00,

            'replace_night_surcharge' => true,

        ],

        /*
         * Local pickup time.
         */

        'night' => [

            'enabled' => true,

            'start' => '22:00',

            'end' => '06:00',

            'percent' => 5.00,

        ],

        'weekend' => [

            'enabled' => true,

            'percent' => 5.00,

        ],

        /*
         * Booking lead time.
         */

        'lead_time' => [

            'under_6_hours_percent' => 10.00,

            'under_2_hours_percent' => 20.00,

        ],

        /*
         * These flags will later be supplied by supplier availability
         * and demand monitoring services.
         */

        'low_supplier_availability_percent' => 10.00,

        'high_demand_percent' => 10.00,

    ],

    /*
    |--------------------------------------------------------------------------
    | Global Distance Fallback
    |--------------------------------------------------------------------------
    |
    | Used only when there is no usable verified taxi tariff and no supplier
    | polygon price. It guarantees a routable airport transfer can still return
    | an estimated price. Values are intentionally isolated from taxi multipliers.
    |
    */

    'global_distance_fallback' => [

        'enabled' => true,

        'currency' => 'EUR',

        'base_fare' => 10.00,

        'per_km' => 1.20,

        'minimum_fare' => 25.00,

        'vehicle_multipliers' => [

            'standard_car' => 1.00,

            'executive_car' => 1.25,

            'luxury_car' => 1.50,

            'people_carrier' => 1.20,

            'executive_people_carrier' => 1.40,

            'large_people_carrier' => 1.55,

            'minibus' => 1.80,

        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Agency Pricing
    |--------------------------------------------------------------------------
    */

    'agency' => [

        'discount_from_public_percent' => 10.00,

        'minimum_margins' => [

            'standard_car' => 6.00,

            'executive_car' => 15.00,

            'luxury_car' => 25.00,

            'people_carrier' => 6.00,

            'executive_people_carrier' => 10.00,

            'large_people_carrier' => 10.00,

            'minibus' => 12.00,

        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Quote Lifetime
    |--------------------------------------------------------------------------
    */

    'quote_lifetime_minutes' => 30,

    /*
    |--------------------------------------------------------------------------
    | Price Rounding
    |--------------------------------------------------------------------------
    */

    'rounding' => [

        /*
         * nearest:
         * 0.01 => cents
         * 0.50 => nearest half-unit
         * 1.00 => nearest whole unit
         */

        'nearest' => 0.01,

    ],

];


