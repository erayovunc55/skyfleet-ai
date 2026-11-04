<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\AirportTaxiPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AgencyRegionalPricingController extends Controller
{
    public function __construct(
        private readonly AirportTaxiPricingService $pricing
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()?->load('agencyCompany');

        if (
            !$user
            || !$user->isAgencyUser()
            || !$user->agencyCompany
            || !$user->agencyCompany->isActive()
        ) {
            return response()->json([
                'message' => 'Acenta hesabı aktif değil.',
            ], 403);
        }

        if ($request->filled('display_currency')) {
            $request->merge([
                'display_currency' => strtoupper(
                    trim((string) $request->input('display_currency'))
                ),
            ]);
        }

        $data = $request->validate([
            'pickup_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'pickup_time' => ['required', 'date_format:H:i'],
            'passengers' => ['required', 'integer', 'between:1,100'],
            'luggage_count' => ['required', 'integer', 'between:0,100'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'direction' => ['required', Rule::in(['pickup', 'dropoff'])],
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
            'airport_location_id' => ['required', 'integer', 'exists:locations,id'],
            'display_currency' => [
                'nullable',
                'string',
                Rule::in(config('currency.supported_currencies', ['TRY', 'EUR', 'USD', 'GBP'])),
            ],
        ]);

        $discountPercent = max(
            0,
            min(100, (float) $user->agencyCompany->discount_percent)
        );

        $displayCurrency = $data['display_currency']
            ?? $user->agencyCompany->default_currency
            ?? 'EUR';

        $quoteInput = [
            'pickup_date' => $data['pickup_date'],
            'pickup_time' => $data['pickup_time'],
            'passengers' => $data['passengers'],
            'luggage_count' => $data['luggage_count'],
            'latitude' => (float) $data['latitude'],
            'longitude' => (float) $data['longitude'],
            'direction' => $data['direction'],
            'vehicle_type' => $data['vehicle_type'],
            'airport_location_id' => (int) $data['airport_location_id'],
            'display_currency' => $displayCurrency,
            'agency_discount_percent' => $discountPercent,
        ];

        $quote = $this->pricing->quote($quoteInput);

        if (!($quote['available'] ?? false)) {
            return response()->json($quote);
        }

        $airportLocation = Location::query()
            ->whereKey($data['airport_location_id'])
            ->whereNotNull('airport_id')
            ->firstOrFail();

        $validationRequest = [
            'vehicle_type' => $data['vehicle_type'],
            'passengers' => $data['passengers'],
            'luggage_count' => $data['luggage_count'],
            'pickup_date' => $data['pickup_date'],
            'pickup_time' => $data['pickup_time'],
            'timezone' => $quote['timezone'],
            'display_currency' => $displayCurrency,
        ];

        if ($data['direction'] === 'pickup') {
            $validationRequest['pickup_lat'] = (float) $airportLocation->latitude;
            $validationRequest['pickup_lng'] = (float) $airportLocation->longitude;
            $validationRequest['dropoff_lat'] = (float) $data['latitude'];
            $validationRequest['dropoff_lng'] = (float) $data['longitude'];
        } else {
            $validationRequest['pickup_lat'] = (float) $data['latitude'];
            $validationRequest['pickup_lng'] = (float) $data['longitude'];
            $validationRequest['dropoff_lat'] = (float) $airportLocation->latitude;
            $validationRequest['dropoff_lng'] = (float) $airportLocation->longitude;
        }

        $snapshot = $this->pricing->validateQuote(
            $quote['quote_token'],
            $validationRequest
        );

        $agencyPrice = (float) $snapshot['agency_price'];
        $publicPrice = (float) $snapshot['public_price'];

        return response()->json([
            ...$quote,
            'public_price' => $publicPrice,
            'agency_price' => $agencyPrice,
            'agency_discount_percent' => (float) $snapshot['agency_discount_percent'],
            'agency_savings' => round(max(0, $publicPrice - $agencyPrice), 2),
        ]);
    }
}
