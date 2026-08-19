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
use Illuminate\Support\Str;
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
        $airports = $city->airports()->with(['country:id,name,iso2,iso3','city:id,country_id,name','terminals' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')->orderBy('name')])->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();
        return response()->json(['data' => $airports]);
    }

    public function airportSearch(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => ['required', 'string', 'min:2', 'max:100'],'limit' => ['nullable', 'integer', 'min:1', 'max:25']]);
        $q = trim($validated['q']);
        $limit = (int) ($validated['limit'] ?? 12);
        $airports = Airport::query()->with(['country:id,name,iso2,iso3,default_timezone','city:id,country_id,name,timezone','terminals' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')->orderBy('name')])->where('is_active', true)->where(function ($query) use ($q) {
            $query->where('name', 'like', "%{$q}%")->orWhere('iata_code', 'like', "%{$q}%")->orWhere('icao_code', 'like', "%{$q}%")->orWhereHas('country', function ($countryQuery) use ($q) {$countryQuery->where('name', 'like', "%{$q}%")->orWhere('native_name', 'like', "%{$q}%")->orWhere('iso2', 'like', "%{$q}%")->orWhere('iso3', 'like', "%{$q}%");})->orWhereHas('city', fn ($cityQuery) => $cityQuery->where('name', 'like', "%{$q}%")->orWhere('native_name', 'like', "%{$q}%"));
        })->orderByRaw('CASE WHEN iata_code = ? THEN 0 WHEN icao_code = ? THEN 1 WHEN name LIKE ? THEN 2 ELSE 3 END',[strtoupper($q), strtoupper($q), $q . '%'])->orderBy('name')->limit($limit)->get();
        return response()->json(['data' => $airports]);
    }

    public function locations(Request $request, City $city): JsonResponse
    {
        $validated = $request->validate(['location_type_id' => ['nullable', 'integer', 'exists:location_types,id'],'type' => ['nullable', 'string', 'exists:location_types,code'],'search' => ['nullable', 'string', 'max:100'],'pickup_only' => ['nullable', 'boolean'],'dropoff_only' => ['nullable', 'boolean']]);
        $query = $city->locations()->with(['type', 'airport'])->where('is_active', true)->where('is_public', true);
        if (!empty($validated['location_type_id'])) $query->where('location_type_id', $validated['location_type_id']);
        if (!empty($validated['type'])) $query->whereHas('type', fn ($q) => $q->where('code', $validated['type']));
        if (!empty($validated['search'])) {$search = trim($validated['search']);$query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('native_name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('address', 'like', "%{$search}%"));}
        if (filter_var($validated['pickup_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_pickup_allowed', true));
        if (filter_var($validated['dropoff_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->whereHas('points', fn ($q) => $q->where('is_active', true)->where('is_dropoff_allowed', true));
        return response()->json(['data' => $query->orderBy('sort_order')->orderBy('name')->get()]);
    }

    public function show(Location $location): JsonResponse
    {
        $location->load(['type','country','city','airport.terminals','points' => fn ($q) => $q->where('is_active', true)->where('is_public', true)->orderBy('sort_order')->orderBy('name'),'points.airportTerminal']);
        return response()->json(['data' => $location]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateLocation($request);
        $location = DB::transaction(function () use ($data) {
            $airport = null;
            if (($data['type_code'] ?? null) === LocationType::AIRPORT) {$airport = $this->resolveAirport($data);$this->syncTerminals($airport, $data['terminals'] ?? []);}
            return Location::create($this->locationPayload($data, $airport?->id));
        });
        return response()->json(['message' => 'Location created.','data' => $location->load(['type', 'airport.terminals'])], 201);
    }

    public function update(Request $request, Location $location): JsonResponse
    {
        $data = $this->validateLocation($request, $location);
        DB::transaction(function () use ($data, $location) {
            $airport = $location->airport;
            if (($data['type_code'] ?? null) === LocationType::AIRPORT) {$airport = $airport ?: $this->resolveAirport($data);$airport->update($this->airportPayload($data, $airport));$this->syncTerminals($airport, $data['terminals'] ?? []);}
            $location->update($this->locationPayload($data, $airport?->id, $location));
        });
        return response()->json(['message' => 'Location updated.','data' => $location->fresh()->load(['type', 'airport.terminals'])]);
    }

    public function storePoint(Request $request, Location $location): JsonResponse
    {
        $data = $request->validate(['airport_terminal_id' => ['nullable', 'integer', 'exists:airport_terminals,id'],'name' => ['required', 'string', 'max:150'],'code' => ['nullable', 'string', 'max:50'],'point_type' => ['required', Rule::in(LocationPoint::TYPES)],'instructions' => ['nullable', 'string', 'max:2000'],'latitude' => ['nullable', 'numeric', 'between:-90,90'],'longitude' => ['nullable', 'numeric', 'between:-180,180'],'geofence_radius_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],'is_pickup_allowed' => ['boolean'],'is_dropoff_allowed' => ['boolean'],'requires_meet_and_greet' => ['boolean']]);
        if (!empty($data['airport_terminal_id'])) {$terminalBelongs = $location->airport && $location->airport->terminals()->whereKey($data['airport_terminal_id'])->exists();abort_unless($terminalBelongs, 422, 'Selected terminal does not belong to this location airport.');}
        $point = $location->points()->create(array_merge($data, ['is_public' => true,'is_active' => true,'sort_order' => 0]));
        return response()->json(['message' => 'Location point created.','data' => $point->load('airportTerminal')], 201);
    }

    public function points(Request $request, Location $location): JsonResponse
    {
        $validated = $request->validate(['point_type' => ['nullable', 'string', 'max:50'],'pickup_only' => ['nullable', 'boolean'],'dropoff_only' => ['nullable', 'boolean']]);
        $query = $location->points()->with('airportTerminal')->where('is_active', true)->where('is_public', true);
        if (!empty($validated['point_type'])) $query->where('point_type', $validated['point_type']);
        if (filter_var($validated['pickup_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->where('is_pickup_allowed', true);
        if (filter_var($validated['dropoff_only'] ?? false, FILTER_VALIDATE_BOOL)) $query->where('is_dropoff_allowed', true);
        return response()->json(['data' => $query->orderBy('sort_order')->orderBy('name')->get()]);
    }

    private function validateLocation(Request $request, ?Location $location = null): array
    {
        $data = $request->validate(['country_id' => ['required', 'integer', 'exists:countries,id'],'city_id' => ['required', 'integer', 'exists:cities,id'],'location_type_id' => ['required', 'integer', 'exists:location_types,id'],'name' => ['required', 'string', 'max:180'],'native_name' => ['nullable', 'string', 'max:180'],'code' => ['nullable', 'string', 'max:50'],'address' => ['nullable', 'string', 'max:1000'],'timezone' => ['nullable', 'string', 'max:100'],'latitude' => ['nullable', 'numeric', 'between:-90,90'],'longitude' => ['nullable', 'numeric', 'between:-180,180'],'geofence_radius_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],'is_public' => ['boolean'],'is_active' => ['boolean'],'iata_code' => ['nullable', 'string', 'max:3'],'icao_code' => ['nullable', 'string', 'max:4'],'terminals' => ['nullable', 'array', 'max:20'],'terminals.*.name' => ['required_with:terminals', 'string', 'max:100'],'terminals.*.code' => ['nullable', 'string', 'max:30'],'terminals.*.type' => ['nullable', 'string', 'max:50']]);
        $cityMatches = City::query()->whereKey($data['city_id'])->where('country_id', $data['country_id'])->exists();
        abort_unless($cityMatches, 422, 'Selected city does not belong to selected country.');
        $data['iata_code'] = !empty($data['iata_code']) ? strtoupper($data['iata_code']) : null;
        $data['icao_code'] = !empty($data['icao_code']) ? strtoupper($data['icao_code']) : null;
        $data['type_code'] = LocationType::find($data['location_type_id'])?->code;
        return $data;
    }

    private function resolveAirport(array $data): Airport
    {
        $airport = null;
        if (!empty($data['iata_code'])) $airport = Airport::query()->where('iata_code', $data['iata_code'])->first();
        if (!$airport && !empty($data['icao_code'])) $airport = Airport::query()->where('icao_code', $data['icao_code'])->first();
        if ($airport) {$airport->update($this->airportPayload($data, $airport));return $airport;}
        return Airport::create($this->airportPayload($data));
    }

    private function airportPayload(array $data, ?Airport $existing = null): array
    {
        return ['country_id' => $data['country_id'],'city_id' => $data['city_id'],'name' => $data['name'],'iata_code' => $data['iata_code'] ?? null,'icao_code' => $data['icao_code'] ?? null,'timezone' => $data['timezone'] ?? $existing?->timezone,'latitude' => $data['latitude'] ?? $existing?->latitude,'longitude' => $data['longitude'] ?? $existing?->longitude,'is_active' => $data['is_active'] ?? true,'sort_order' => $existing?->sort_order ?? 0,'metadata' => $existing?->metadata];
    }

    private function syncTerminals(Airport $airport, array $terminals): void
    {
        foreach ($terminals as $terminal) {
            $name = trim((string) ($terminal['name'] ?? ''));if ($name === '') continue;
            $code = trim((string) ($terminal['code'] ?? '')) ?: null;
            $query = $airport->terminals();
            $existing = $code ? $query->where('code', $code)->first() : $query->where('name', $name)->first();
            $payload = ['name' => $name,'code' => $code,'type' => $terminal['type'] ?? null,'is_active' => true,'sort_order' => $existing?->sort_order ?? 0];
            if ($existing) $existing->update($payload); else $airport->terminals()->create($payload);
        }
    }

    private function locationPayload(array $data, ?int $airportId, ?Location $existing = null): array
    {
        $baseSlug = Str::slug($data['code'] ?: ($data['iata_code'] ?: $data['name']));
        if ($baseSlug === '') $baseSlug = 'location';
        $slug = $baseSlug;
        $suffix = 2;
        while (Location::query()->where('slug', $slug)->when($existing, fn ($query) => $query->whereKeyNot($existing->getKey()))->exists()) {$slug = $baseSlug . '-' . $suffix;$suffix++;}
        return ['location_type_id' => $data['location_type_id'],'country_id' => $data['country_id'],'city_id' => $data['city_id'],'airport_id' => $airportId,'name' => $data['name'],'native_name' => $data['native_name'] ?? null,'slug' => $slug,'code' => $data['code'] ?? ($data['iata_code'] ?? null),'address' => $data['address'] ?? null,'latitude' => $data['latitude'] ?? null,'longitude' => $data['longitude'] ?? null,'geofence_radius_meters' => $data['geofence_radius_meters'] ?? null,'timezone' => $data['timezone'] ?? null,'is_public' => $data['is_public'] ?? true,'is_active' => $data['is_active'] ?? true,'sort_order' => 0];
    }
}
