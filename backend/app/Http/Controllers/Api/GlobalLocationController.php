<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalLocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'location_type_id' => ['nullable', 'integer', 'exists:location_types,id'],
            'type' => ['nullable', 'string', 'exists:location_types,code'],
            'search' => ['nullable', 'string', 'max:100'],
            'pickup_only' => ['nullable', 'boolean'],
            'dropoff_only' => ['nullable', 'boolean'],
        ]);

        $query = Location::query()
            ->with([
                'type',
                'airport',
                'country:id,name,iso2,iso3',
                'city:id,country_id,name',
            ])
            ->where('is_active', true)
            ->where('is_public', true);

        if (!empty($validated['country_id'])) {
            $query->where('country_id', $validated['country_id']);
        }

        if (!empty($validated['city_id'])) {
            $query->where('city_id', $validated['city_id']);
        }

        if (!empty($validated['location_type_id'])) {
            $query->where('location_type_id', $validated['location_type_id']);
        }

        if (!empty($validated['type'])) {
            $query->whereHas('type', fn ($q) => $q->where('code', $validated['type']));
        }

        if (!empty($validated['search'])) {
            $search = trim($validated['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('native_name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhereHas('country', fn ($country) => $country->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('city', fn ($city) => $city->where('name', 'like', "%{$search}%"));
            });
        }

        if (filter_var($validated['pickup_only'] ?? false, FILTER_VALIDATE_BOOL)) {
            $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_pickup_allowed', true));
        }

        if (filter_var($validated['dropoff_only'] ?? false, FILTER_VALIDATE_BOOL)) {
            $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_dropoff_allowed', true));
        }

        return response()->json([
            'data' => $query
                ->orderBy('country_id')
                ->orderBy('city_id')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
