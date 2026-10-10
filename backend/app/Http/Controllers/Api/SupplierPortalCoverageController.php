<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Airport;
use App\Models\Location;
use App\Models\LocationType;
use App\Models\Supplier;
use App\Models\SupplierCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupplierPortalCoverageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $supplier = $this->resolveSupplier($request);

        $coverages = $supplier
            ->coverages()
            ->with([
                'country:id,name,iso2',
                'city:id,name,country_id',
                'location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters',
            ])
            ->latest()
            ->get();

        return response()->json([
            'data' => $coverages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $supplier = $this->resolveSupplier($request);

        $data = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
                'exists:locations,id',
                'required_without:airport_id',
            ],

            'airport_id' => [
                'nullable',
                'integer',
                'exists:airports,id',
                'required_without:location_id',
            ],

            'coverage_type' => [
                'nullable',
                Rule::in([
                    'airport',
                    'city',
                    'service_area',
                    'polygon',
                ]),
            ],

            'label' => [
                'nullable',
                'string',
                'max:150',
                'required_if:coverage_type,polygon',
            ],

            'base_price' => [
                'nullable',
                'numeric',
                'min:0',
                'required_if:coverage_type,polygon',
            ],

            'service_radius_meters' => [
                'nullable',
                'integer',
                'min:0',
                'max:500000',
            ],

            'pickup_enabled' => [
                'nullable',
                'boolean',
            ],

            'dropoff_enabled' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'polygon' => [
                'nullable',
                'array',
                'min:3',
            ],

            'polygon.*' => [
                'array',
                'size:2',
            ],

            'polygon.*.0' => [
                'numeric',
                'between:-90,90',
            ],

            'polygon.*.1' => [
                'numeric',
                'between:-180,180',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
            ],

            'vehicle_prices' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.pickup' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.dropoff' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.pickup.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'vehicle_prices.dropoff.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        $location = !empty($data['location_id'])
            ? Location::with([
                'country',
                'city',
            ])->findOrFail(
                $data['location_id']
            )
            : $this->resolveAirportLocation(
                (int) $data['airport_id']
            );

        $coverageData = [
            'supplier_id' =>
                $supplier->id,

            'country_id' =>
                $location->country_id,

            'city_id' =>
                $location->city_id,

            'location_id' =>
                $location->id,

            'coverage_type' =>
                $data['coverage_type'] ??
                'airport',

            'label' =>
                $data['label'] ??
                $location->name,

            'service_radius_meters' =>
                $data['service_radius_meters'] ??
                $location->geofence_radius_meters,

            'pickup_enabled' =>
                $data['pickup_enabled'] ??
                true,

            'dropoff_enabled' =>
                $data['dropoff_enabled'] ??
                true,

            'is_active' =>
                $data['is_active'] ??
                true,

            'polygon' =>
                $data['polygon'] ??
                null,

            'base_price' =>
                $data['base_price'] ??
                null,

            'currency' =>
                strtoupper(
                    $data['currency'] ??
                    'EUR'
                ),

            'vehicle_prices' =>
                $data['vehicle_prices'] ??
                null,
        ];

        if (
            ($data['coverage_type'] ?? 'airport') ===
            'polygon'
        ) {
            $coverage = SupplierCoverage::create(
                $coverageData
            );
        } else {
            $coverage = SupplierCoverage::updateOrCreate(
                [
                    'supplier_id' =>
                        $supplier->id,

                    'location_id' =>
                        $location->id,

                    'coverage_type' =>
                        'airport',
                ],
                $coverageData
            );
        }

        return response()->json([
            'data' => $coverage->load([
                'country:id,name,iso2',
                'city:id,name,country_id',
                'location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters',
            ]),
        ], 201);
    }

    public function update(
        Request $request,
        SupplierCoverage $coverage
    ): JsonResponse {
        $supplier = $this->resolveSupplier($request);

        $this->ensureOwnership(
            $supplier,
            $coverage
        );

        $data = $request->validate([
            'coverage_type' => [
                'nullable',
                Rule::in([
                    'airport',
                    'city',
                    'service_area',
                    'polygon',
                ]),
            ],

            'service_radius_meters' => [
                'nullable',
                'integer',
                'min:0',
                'max:500000',
            ],

            'pickup_enabled' => [
                'nullable',
                'boolean',
            ],

            'dropoff_enabled' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'label' => [
                'nullable',
                'string',
                'max:150',
            ],

            'polygon' => [
                'nullable',
                'array',
                'min:3',
            ],

            'polygon.*' => [
                'array',
                'size:2',
            ],

            'polygon.*.0' => [
                'numeric',
                'between:-90,90',
            ],

            'polygon.*.1' => [
                'numeric',
                'between:-180,180',
            ],

            'base_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
            ],

            'vehicle_prices' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.pickup' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.dropoff' => [
                'nullable',
                'array',
            ],

            'vehicle_prices.pickup.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'vehicle_prices.dropoff.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        if (
            array_key_exists(
                'currency',
                $data
            )
        ) {
            $data['currency'] = strtoupper(
                $data['currency']
            );
        }

        $coverage->update($data);

        return response()->json([
            'data' => $coverage
                ->fresh()
                ->load([
                    'country:id,name,iso2',
                    'city:id,name,country_id',
                    'location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters',
                ]),
        ]);
    }

    public function destroy(
        Request $request,
        SupplierCoverage $coverage
    ): JsonResponse {
        $supplier = $this->resolveSupplier($request);

        $this->ensureOwnership(
            $supplier,
            $coverage
        );

        $coverage->delete();

        return response()->json([
            'message' =>
                'Coverage removed.',
        ]);
    }

    private function resolveSupplier(
        Request $request
    ): Supplier {
        $user = $request->user();

        abort_unless(
            $user &&
            $user->role === 'supplier' &&
            $user->supplier_id,
            403,
            'Supplier portal access required.'
        );

        $supplier = Supplier::findOrFail(
            $user->supplier_id
        );

        abort_unless(
            $supplier->canOperate(),
            403,
            'Supplier account is not operational.'
        );

        return $supplier;
    }

    private function resolveAirportLocation(
        int $airportId
    ): Location {
        $airport = Airport::with([
            'country',
            'city',
        ])->findOrFail($airportId);

        $existing = Location::query()
            ->where(
                'airport_id',
                $airport->id
            )
            ->first();

        if ($existing) {
            return $existing->load([
                'country',
                'city',
            ]);
        }

        $locationTypeId = LocationType::query()
            ->where(
                'code',
                LocationType::AIRPORT
            )
            ->value('id');

        abort_unless(
            $locationTypeId,
            422,
            'Airport location type is not configured.'
        );

        $baseSlug = Str::slug(
            $airport->iata_code
            ?: $airport->name
        );

        if ($baseSlug === '') {
            $baseSlug =
                'airport-' . $airport->id;
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            Location::query()
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug =
                $baseSlug . '-' . $suffix;

            $suffix++;
        }

        return Location::create([
            'location_type_id' =>
                $locationTypeId,

            'country_id' =>
                $airport->country_id,

            'city_id' =>
                $airport->city_id,

            'airport_id' =>
                $airport->id,

            'name' =>
                $airport->name,

            'slug' =>
                $slug,

            'code' =>
                $airport->iata_code,

            'latitude' =>
                $airport->latitude,

            'longitude' =>
                $airport->longitude,

            'geofence_radius_meters' =>
                1500,

            'timezone' =>
                $airport->timezone,

            'is_public' =>
                true,

            'is_active' =>
                true,

            'sort_order' =>
                0,
        ]);
    }

    private function ensureOwnership(
        Supplier $supplier,
        SupplierCoverage $coverage
    ): void {
        abort_unless(
            (int) $coverage->supplier_id ===
            (int) $supplier->id,
            404
        );
    }
}