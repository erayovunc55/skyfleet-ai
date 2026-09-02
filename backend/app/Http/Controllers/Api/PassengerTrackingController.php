<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PassengerTrackingController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $transfer = Transfer::query()
            ->where(
                'public_tracking_token',
                $token
            )
            ->with([
                'driver:id,name,vehicle_id',
                'driver.vehicle:id,plate,brand,model,color,vehicle_type',
                'assignedVehicle:id,plate,brand,model,color,vehicle_type',
                'latestLocation',
            ])
            ->first();

        if (
            !$transfer
            || !$transfer
                ->publicTrackingIsAvailable()
        ) {
            return response()->json([
                'message' =>
                    'Takip bağlantısı geçersiz veya süresi dolmuş.',
            ], 404);
        }

        $transfer->forceFill([
            'public_tracking_last_viewed_at' =>
                now(),
        ])->saveQuietly();

        $vehicle =
            $transfer->assignedVehicle
            ?? $transfer->driver?->vehicle;

        $location = $transfer->latestLocation;

        return response()->json([
            'data' => [
                'booking_reference' =>
                    $transfer->booking_reference,

                'status' =>
                    $transfer->status,

                'pickup_time' =>
                    $transfer->pickup_time
                        ?->toISOString(),

                'pickup' => [
                    'address' =>
                        $transfer->pickup,
                    'latitude' =>
                        $transfer->pickup_lat,
                    'longitude' =>
                        $transfer->pickup_lng,
                    'meet_point' =>
                        $transfer->meet_point,
                ],

                'dropoff' => [
                    'address' =>
                        $transfer->dropoff,
                    'latitude' =>
                        $transfer->dropoff_lat,
                    'longitude' =>
                        $transfer->dropoff_lng,
                ],

                'flight_number' =>
                    $transfer->flight_number,

                'driver' => $transfer->driver
                    ? [
                        'name' =>
                            $transfer->driver->name,
                    ]
                    : null,

                'vehicle' => $vehicle
                    ? [
                        'plate' =>
                            $vehicle->plate,
                        'brand' =>
                            $vehicle->brand,
                        'model' =>
                            $vehicle->model,
                        'color' =>
                            $vehicle->color,
                        'vehicle_type' =>
                            $vehicle->vehicle_type,
                    ]
                    : null,

                'location' => $location
                    ? [
                        'latitude' =>
                            $location->latitude,
                        'longitude' =>
                            $location->longitude,
                        'accuracy' =>
                            $location->accuracy,
                        'speed' =>
                            $location->speed,
                        'heading' =>
                            $location->heading,
                        'recorded_at' =>
                            $location->recorded_at
                                ?->toISOString(),
                    ]
                    : null,

                'tracking' => [
                    'active' =>
                        !$transfer
                            ->isTerminalStatus(),
                    'refresh_after_seconds' => 5,
                    'expires_at' =>
                        $transfer
                            ->public_tracking_expires_at
                            ?->toISOString(),
                ],
            ],
        ]);
    }

    public function link(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $user = $request->user();

        $isPanelUser = in_array(
            $user?->role,
            [
                'dispatcher',
                'admin',
                'super_admin',
            ],
            true
        );

        $isAssignedDriver =
            $user?->role === 'driver'
            && (int) $transfer->driver_id
                === (int) $user->id;

        if (!$isPanelUser && !$isAssignedDriver) {
            return response()->json([
                'message' =>
                    'Bu transferin takip bağlantısını görüntüleme yetkiniz yok.',
            ], 403);
        }

        if (!$transfer->public_tracking_token) {
            return response()->json([
                'message' =>
                    'Takip bağlantısı sürücü yola çıktığında oluşturulacaktır.',
            ], 409);
        }

        if (!$transfer->publicTrackingIsAvailable()) {
            return response()->json([
                'message' =>
                    'Bu transferin takip bağlantısının süresi dolmuş.',
            ], 410);
        }

        return response()->json([
            'data' => [
                'tracking_url' =>
                    $transfer
                        ->publicTrackingUrl(),
                'expires_at' =>
                    $transfer
                        ->public_tracking_expires_at
                        ?->toISOString(),
            ],
        ]);
    }
}
