<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Airport;
use App\Models\AirportTerminal;
use App\Models\City;
use App\Models\Country;
use App\Models\Location;
use App\Models\LocationPoint;
use App\Models\LocationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function locationTypes(): JsonResponse
    {
        return response()->json(['data' => LocationType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function countries(): JsonResponse
    {
        return response()->json(['data' => Country::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function cities(Country $country): JsonResponse
    {
        return response()->json(['data' => $country->cities()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function airports(City $city): JsonResponse
    {
        $airports = $city->airports()->with(['terminals' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')->orderBy('name')])->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();
        return response()->json(['data' => $airports]);
    }

    public function locations(Request $request, City $city): JsonResponse
    {
        $validated = $request->validate([
            'location_type_id' => ['nullable', 'integer', 'exists:location_types,id'],
            'type' => ['nullable', 'string', 'exists:location_types,code'],
            'search' => ['nullable', 'string', 'max:100'],
            'pickup_only' => ['nullable', 'boolean'],
            'dropoff_only' => ['nullable', 'boolean'],
        ]);

        $query = $city->locations()->with(['type', 'airport'])->where('is_active', true)->where('is_public', true);
        if (!empty($validated['location_type_id'])) $query->where('location_type_id', $validated['location_type_id']);
        if (!empty($validated['type'])) $query->whereHas('type', fn ($q) => $q->where('code', $validated['type']));
        if (!empty($validated['search'])) {
            $search = trim($validated['search']);
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('native_name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('address', 'like', "%{$search}%"));
        }
        if (filter_var($validated['pickup_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_pickup_allowed', true));
        if (filter_var($validated['dropoff_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_dropoff_allowed', true));

        return response()->json(['data' => $query->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function show(Location $location): JsonResponse
    {
        $location->load(['type', 'country', 'city', 'airport.terminals', 'points' => fn ($q) => $q->where('is_active', true)->where('is_public', true)->orderBy('sort_order')->orderBy('name'), 'points.airportTerminal']);
        return response()->json(['data' => $location]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateLocation($request);
        $location = DB::transaction(function () use ($data) {
            $airport = null;
            if (($data['type_code'] ?? null) === LocationType::AIRPORT) {
                $airport = Airport::create([
                    'country_id' => $data['country_id'], 'city_id' => $data['city_id'], 'name' => $data['name'],
                    'iata_code' => $data['iata_code'] ?? null, 'icao_code' => $data['icao_code'] ?? null,
                    'timezone' => $data['timezone'] ?? null, 'latitude' => $data['latitude'] ?? null, 'longitude' => $data['longitude'] ?? null,
                    'is_active' => $data['is_active'] ?? true, 'sort_order' => 0,
                ]);
            }
            $location = Location::create($this->locationPayload($data, $airport?->id));
            foreach (($data['terminals'] ?? []) as $terminal) {
                if ($airport && !empty($terminal['name'])) AirportTerminal::create(['airport_id' => $airport->id, 'name' => $terminal['name'], 'code' => $terminal['code'] ?? null, 'type' => $terminal['type'] ?? null, 'is_active' => true, 'sort_order' => 0]);
            }
            return $location;
        });
        return response()->json(['message' => 'Location created.', 'data' => $location->load(['type', 'airport.terminals'])], 201);
    }

    public function update(Request $request, Location $location): JsonResponse
    {
        $data = $this->validateLocation($request, $location);
        DB::transaction(function () use ($data, $location) {
            $location->update($this->locationPayload($data, $location->airport_id));
            if ($location->airport) $location->airport->update(['name' => $data['name'], 'country_id' => $data['country_id'], 'city_id' => $data['city_id'], 'iata_code' => $data['iata_code'] ?? null, 'icao_code' => $data['icao_code'] ?? null, 'timezone' => $data['timezone'] ?? null, 'latitude' => $data['latitude'] ?? null, 'longitude' => $data['longitude'] ?? null, 'is_active' => $data['is_active'] ?? true]);
        });
        return response()->json(['message' => 'Location updated.', 'data' => $location->fresh()->load(['type', 'airport.terminals'])]);
    }

    public function storePoint(Request $request, Location $location): JsonResponse
    {
        $data = $request->validate([
            'airport_terminal_id' => ['nullable', 'integer', 'exists:airport_terminals,id'], 'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'], 'point_type' => ['required', Rule::in(LocationPoint::TYPES)], 'instructions' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'], 'longitude' => ['nullable', 'numeric', 'between:-180,180'], 'geofence_radius_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_pickup_allowed' => ['boolean'], 'is_dropoff_allowed' => ['boolean'], 'requires_meet_and_greet' => ['boolean'],
        ]);
        if (!empty($data['airport_terminal_id'])) {
            $terminalBelongs = $location->airport && $location->airport->terminals()->whereKey($data['airport_terminal_id'])->exists();
            abort_unless($terminalBelongs, 422, 'Selected terminal does not belong to this location airport.');
        }
        $point = $location->points()->create(array_merge($data, ['is_public' => true, 'is_active' => true, 'sort_order' => 0]));
        return response()->json(['message' => 'Location point created.', 'data' => $point->load('airportTerminal')], 201);
    }

    public function points(Request $request, Location $location): JsonResponse
    {
        $validated = $request->validate(['point_type' => ['nullable', 'string', 'max:50'], 'pickup_only' => ['nullable', 'boolean'], 'dropoff_only' => ['nullable', 'boolean']]);
        $query = $location->points()->with('airportTerminal')->where('is_active', true)->where('is_public', true);
        if (!empty($validated['point_type'])) $query->where('point_type', $validated['point_type']);
        if (filter_var($validated['pickup_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->where('is_pickup_allowed', true);
        if (filter_var($validated['dropoff_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->where('is_dropoff_allowed', true);
        return response()->json(['data' => $query->orderBy('sort_order')->orderBy('name')->get()]);
    }

    private function validateLocation(Request $request, ?Location $location = null): array
    {
        $data = $request->validate([
            'country_id' => ['required', 'integer', 'exists:countries,id'], 'city_id' => ['required', 'integer', 'exists:cities,id'],
            'location_type_id' => ['required', 'integer', 'exists:location_types,id'], 'name' => ['required', 'string', 'max:180'], 'native_name' => ['nullable', 'string', 'max:180'],
            'code' => ['nullable', 'string', 'max:50'], 'address' => ['nullable', 'string', 'max:1000'], 'timezone' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'], 'longitude' => ['nullable', 'numeric', 'between:-180,180'], 'geofence_radius_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_public' => ['boolean'], 'is_active' => ['boolean'], 'iata_code' => ['nullable', 'string', 'max:3'], 'icao_code' => ['nullable', 'string', 'max:4'],
            'terminals' => ['nullable', 'array', 'max:20'], 'terminals.*.name' => ['required_with:terminals', 'string', 'max:100'], 'terminals.*.code' => ['nullable', 'string', 'max:30'], 'terminals.*.type' => ['nullable', 'string', 'max:50'],
        ]);
        $cityMatches = City::query()->whereKey($data['city_id'])->where('country_id', $data['country_id'])->exists();
        abort_unless($cityMatches, 422, 'Selected city does not belong to selected country.');
        $data['type_code'] = LocationType::find($data['location_type_id'])?->code;
        return $data;
    }

    private function locationPayload(array $data, ?int $airportId): array
    {
        return [
            'location_type_id' => $data['location_type_id'], 'country_id' => $data['country_id'], 'city_id' => $data['city_id'], 'airport_id' => $airportId,
            'name' => $data['name'], 'native_name' => $data['native_name'] ?? null, 'code' => $data['code'] ?? ($data['iata_code'] ?? null), 'address' => $data['address'] ?? null,
            'latitude' => $data['latitude'] ?? null, 'longitude' => $data['longitude'] ?? null, 'geofence_radius_meters' => $data['geofence_radius_meters'] ?? null,
            'timezone' => $data['timezone'] ?? null, 'is_public' => $data['is_public'] ?? true, 'is_active' => $data['is_active'] ?? true, 'sort_order' => 0,
        ];
    }
}
