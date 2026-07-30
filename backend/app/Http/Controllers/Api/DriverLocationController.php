<?php

namespace App\Http\Controllers\Api;

use App\Events\DriverLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\DriverLocation;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverLocationController extends Controller
{
    public function store(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $driver = $request->user();

        if ($transfer->driver_id !== $driver->id) {
            return response()->json([
                'message' => 'Bu transfer için konum gönderme yetkiniz yok.',
            ], 403);
        }

        if (
            !in_array(
                $transfer->status,
                [
                    'on_the_way',
                    'arrived',
                    'passenger_called',
                    'passenger_on_board',
                    'trip_started',
                ],
                true
            )
        ) {
            return response()->json([
                'message' => 'Bu transfer şu anda canlı konum takibine uygun durumda değil.',
            ], 422);
        }

        $validated = $request->validate([
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
            'accuracy' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'speed' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'heading' => [
                'nullable',
                'numeric',
                'between:0,360',
            ],
        ]);

        $location = DriverLocation::create([
            'transfer_id' => $transfer->id,
            'driver_id' => $driver->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'accuracy' => $validated['accuracy'] ?? null,
            'speed' => $validated['speed'] ?? null,
            'heading' => $validated['heading'] ?? null,
            'recorded_at' => now(),
        ]);

        DriverLocationUpdated::dispatch($location);

        return response()->json([
            'message' => 'Sürücü konumu kaydedildi.',
            'data' => $location,
        ], 201);
    }
}