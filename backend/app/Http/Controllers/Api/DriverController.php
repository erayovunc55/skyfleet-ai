<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function index(): JsonResponse
    {
        $drivers = User::query()
            ->where('role', 'driver')
            ->with('vehicle')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $drivers,
        ]);
    }

    public function assignVehicle(
        Request $request,
        User $driver
    ): JsonResponse {
        $validated = $request->validate([
            'vehicle_id' => [
                'nullable',
                'integer',
                'exists:vehicles,id',
            ],
        ]);

        if ($driver->role !== 'driver') {
            return response()->json([
                'message' => 'Bu kullanıcı sürücü değil.',
            ], 422);
        }

        $vehicleId = $validated['vehicle_id'] ?? null;

        if ($vehicleId !== null) {
            $vehicle = Vehicle::findOrFail($vehicleId);

            if (
                $vehicle->operational_status !== 'active' ||
                !$vehicle->is_active
            ) {
                return response()->json([
                    'message' => 'Yalnızca aktif araçlar sürücüye atanabilir.',
                ], 422);
            }
        }

        DB::transaction(function () use (
            $driver,
            $vehicleId
        ): void {
            if ($vehicleId !== null) {
                User::query()
                    ->where('role', 'driver')
                    ->where('vehicle_id', $vehicleId)
                    ->whereKeyNot($driver->id)
                    ->update([
                        'vehicle_id' => null,
                    ]);
            }

            $driver->update([
                'vehicle_id' => $vehicleId,
            ]);
        });

        $updatedDriver = $driver
            ->fresh()
            ->load('vehicle');

        return response()->json([
            'message' => $vehicleId
                ? 'Araç sürücüye atandı.'
                : 'Sürücünün araç ataması kaldırıldı.',
            'data' => $updatedDriver,
        ]);
    }
        public function dashboard(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        if (!$user || $user->role !== 'driver') {
            return response()->json([
                'message' =>
                    'Bu alan yalnızca sürücüler tarafından kullanılabilir.',
            ], 403);
        }

        $assigned = Transfer::query()
            ->where('driver_id', $user->id)
            ->count();

        $ongoing = Transfer::query()
            ->where('driver_id', $user->id)
            ->whereIn('status', [
                'on_the_way',
                'arrived',
                'passenger_called',
                'passenger_on_board',
                'trip_started',
            ])
            ->count();

        $waiting = Transfer::query()
            ->where('driver_id', $user->id)
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'data' => [
                'assigned' => $assigned,
                'ongoing' => $ongoing,
                'waiting' => $waiting,
                'completedToday' => Transfer::query()
    ->where('driver_id', $user->id)
    ->where('status', 'completed')
    ->whereDate('pickup_time', today())
    ->count(),
            ],
        ]);
    }
    public function myTransfers(
    Request $request
): JsonResponse {
    $user = $request->user();

    if (!$user || $user->role !== 'driver') {
        return response()->json([
            'message' =>
                'Bu alan yalnızca sürücüler tarafından kullanılabilir.',
        ], 403);
    }

    $transfers = Transfer::query()
        ->where('driver_id', $user->id)
        ->with([
            'driver.vehicle',
            'pickupLocation.type',
            'pickupPoint.airportTerminal',
            'dropoffLocation.type',
            'dropoffPoint.airportTerminal',
            'events' => function ($query) {
                $query->orderByDesc('occurred_at');
            },
            'latestEvent',
            'latestLocation',
        ])
        ->orderByRaw(
            "CASE
                WHEN status IN (
                    'accepted',
                    'on_the_way',
                    'arrived',
                    'passenger_called',
                    'passenger_on_board',
                    'trip_started'
                ) THEN 1
                WHEN status = 'pending' THEN 2
                ELSE 3
            END"
        )
        ->orderBy('pickup_time')
        ->get();

    return response()->json([
        'data' => $transfers,
    ]);
}
}