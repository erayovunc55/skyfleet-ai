<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Country;
use App\Models\Location;
use App\Models\LocationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function locationTypes(): JsonResponse
    {
        $locationTypes = LocationType::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $locationTypes,
        ]);
    }

    public function countries(): JsonResponse
    {
        $countries = Country::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $countries,
        ]);
    }

    public function cities(
        Country $country
    ): JsonResponse {
        $cities = $country
            ->cities()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $cities,
        ]);
    }

    public function locations(
        Request $request,
        City $city
    ): JsonResponse {
        $validated = $request->validate([
            'location_type_id' => [
                'nullable',
                'integer',
                'exists:location_types,id',
            ],

            'type' => [
                'nullable',
                'string',
                'exists:location_types,code',
            ],

            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'pickup_only' => [
                'nullable',
                'boolean',
            ],

            'dropoff_only' => [
                'nullable',
                'boolean',
            ],
        ]);

        $query = $city
            ->locations()
            ->with([
                'type',
                'airport',
            ])
            ->where('is_active', true)
            ->where('is_public', true);

        if (
            !empty(
                $validated['location_type_id']
            )
        ) {
            $query->where(
                'location_type_id',
                $validated['location_type_id']
            );
        }

        if (!empty($validated['type'])) {
            $query->whereHas(
                'type',
                function ($typeQuery) use (
                    $validated
                ) {
                    $typeQuery->where(
                        'code',
                        $validated['type']
                    );
                }
            );
        }

        if (!empty($validated['search'])) {
            $search = trim(
                $validated['search']
            );

            $query->where(
                function ($locationQuery) use (
                    $search
                ) {
                    $locationQuery
                        ->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'native_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'address',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        if (
            filter_var(
                $validated['pickup_only'] ?? false,
                FILTER_VALIDATE_BOOL
            )
        ) {
            $query->whereHas(
                'points',
                function ($pointQuery) {
                    $pointQuery
                        ->where('is_active', true)
                        ->where(
                            'is_pickup_allowed',
                            true
                        );
                }
            );
        }

        if (
            filter_var(
                $validated['dropoff_only'] ?? false,
                FILTER_VALIDATE_BOOL
            )
        ) {
            $query->whereHas(
                'points',
                function ($pointQuery) {
                    $pointQuery
                        ->where('is_active', true)
                        ->where(
                            'is_dropoff_allowed',
                            true
                        );
                }
            );
        }

        $locations = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $locations,
        ]);
    }

    public function show(
        Location $location
    ): JsonResponse {
        $location->load([
            'type',
            'country',
            'city',
            'airport',
            'points' => function ($query) {
                $query
                    ->where('is_active', true)
                    ->where('is_public', true)
                    ->orderBy('sort_order')
                    ->orderBy('name');
            },
            'points.airportTerminal',
        ]);

        return response()->json([
            'data' => $location,
        ]);
    }

    public function points(
        Request $request,
        Location $location
    ): JsonResponse {
        $validated = $request->validate([
            'point_type' => [
                'nullable',
                'string',
                'max:50',
            ],

            'pickup_only' => [
                'nullable',
                'boolean',
            ],

            'dropoff_only' => [
                'nullable',
                'boolean',
            ],
        ]);

        $query = $location
            ->points()
            ->with('airportTerminal')
            ->where('is_active', true)
            ->where('is_public', true);

        if (!empty($validated['point_type'])) {
            $query->where(
                'point_type',
                $validated['point_type']
            );
        }

        if (
            filter_var(
                $validated['pickup_only'] ?? false,
                FILTER_VALIDATE_BOOL
            )
        ) {
            $query->where(
                'is_pickup_allowed',
                true
            );
        }

        if (
            filter_var(
                $validated['dropoff_only'] ?? false,
                FILTER_VALIDATE_BOOL
            )
        ) {
            $query->where(
                'is_dropoff_allowed',
                true
            );
        }

        $points = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $points,
        ]);
    }
}