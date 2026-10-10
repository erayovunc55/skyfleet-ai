<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AirportTaxiPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicRegionalPricingController extends Controller
{
    public function __construct(
        private readonly AirportTaxiPricingService $pricing
    ) {
    }

    public function __invoke(
        Request $request
    ): JsonResponse {
        if ($request->filled('display_currency')) {
            $request->merge([
                'display_currency' => strtoupper(
                    trim(
                        (string) $request->input(
                            'display_currency'
                        )
                    )
                ),
            ]);
        }

        $data = $request->validate([

            /*
            |--------------------------------------------------------------------------
            | Pickup date & time
            |--------------------------------------------------------------------------
            */

            'pickup_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],

            'pickup_time' => [
                'required',
                'date_format:H:i',
            ],

            /*
            |--------------------------------------------------------------------------
            | Passenger information
            |--------------------------------------------------------------------------
            */

            'passengers' => [
                'required',
                'integer',
                'between:1,100',
            ],

            'luggage_count' => [
                'required',
                'integer',
                'between:0,100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Non-airport address coordinates
            |--------------------------------------------------------------------------
            */

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            /*
            |--------------------------------------------------------------------------
            | Direction
            |--------------------------------------------------------------------------
            |
            | pickup:
            | Airport -> Address
            |
            | dropoff:
            | Address -> Airport
            |
            */

            'direction' => [
                'required',
                Rule::in([
                    'pickup',
                    'dropoff',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Skyfleet Vehicle Class
            |--------------------------------------------------------------------------
            */

            'vehicle_type' => [
                'required',
                'string',
                Rule::in([
                    'standard_car',
                    'executive_car',
                    'luxury_car',
                    'people_carrier',
                    'executive_people_carrier',
                    'large_people_carrier',
                    'minibus',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Airport Location
            |--------------------------------------------------------------------------
            */

            'airport_location_id' => [
                'required',
                'integer',
                'exists:locations,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Display Currency
            |--------------------------------------------------------------------------
            |
            | Internal pricing remains in the market/base currency.
            | The final quote can be displayed/paid in one supported currency.
            |
            */

            'display_currency' => [
                'nullable',
                'string',
                Rule::in(
                    config(
                        'currency.supported_currencies',
                        [
                            'TRY',
                            'EUR',
                            'USD',
                            'GBP',
                        ]
                    )
                ),
            ],

        ]);

        /*
        |--------------------------------------------------------------------------
        | Security
        |--------------------------------------------------------------------------
        |
        | Public clients are intentionally NOT allowed to send:
        |
        | supplier_cost
        | high_demand
        | low_supplier_availability
        | taxi_reference
        | payment fee
        | minimum margin
        | markup
        |
        | These values can only come from trusted backend services.
        |
        */

        $quote =
            $this->pricing->quote([
                'pickup_date' =>
                    $data[
                        'pickup_date'
                    ],

                'pickup_time' =>
                    $data[
                        'pickup_time'
                    ],

                'passengers' =>
                    $data[
                        'passengers'
                    ],

                'luggage_count' =>
                    $data[
                        'luggage_count'
                    ],

                'latitude' =>
                    $data[
                        'latitude'
                    ],

                'longitude' =>
                    $data[
                        'longitude'
                    ],

                'direction' =>
                    $data[
                        'direction'
                    ],

                'vehicle_type' =>
                    $data[
                        'vehicle_type'
                    ],

                'airport_location_id' =>
                    $data[
                        'airport_location_id'
                    ],

                'display_currency' =>
                    $data[
                        'display_currency'
                    ]
                    ?? null,
            ]);

        return response()->json(
            $quote
        );
    }
}
