<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\LocationPoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationPointController extends Controller
{
    public function update(Request $request, Location $location, LocationPoint $point): JsonResponse
    {
        abort_unless($point->location_id === $location->id, 404);

        $data = $this->validatePoint($request, $location);
        $point->update($data);

        return response()->json([
            'message' => 'Location point updated.',
            'data' => $point->fresh()->load('airportTerminal'),
        ]);
    }

    public function destroy(Location $location, LocationPoint $point): JsonResponse
    {
        abort_unless($point->location_id === $location->id, 404);

        $point->delete();

        return response()->json([
            'message' => 'Location point deleted.',
        ]);
    }

    private function validatePoint(Request $request, Location $location): array
    {
        $data = $request->validate([
            'airport_terminal_id' => ['nullable', 'integer', 'exists:airport_terminals,id'],
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'point_type' => ['required', Rule::in(LocationPoint::TYPES)],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'geofence_radius_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_pickup_allowed' => ['boolean'],
            'is_dropoff_allowed' => ['boolean'],
            'requires_meet_and_greet' => ['boolean'],
        ]);

        if (!empty($data['airport_terminal_id'])) {
            $terminalBelongs = $location->airport
                && $location->airport->terminals()->whereKey($data['airport_terminal_id'])->exists();

            abort_unless(
                $terminalBelongs,
                422,
                'Selected terminal does not belong to this location airport.'
            );
        }

        return $data;
    }
}
