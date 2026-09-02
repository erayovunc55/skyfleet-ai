<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\RoutingService;
use Illuminate\Http\JsonResponse;

class TransferRouteController extends Controller
{
    public function __construct(
        private readonly RoutingService $routing
    ) {
    }

    public function show(
        Transfer $transfer
    ): JsonResponse {
        $transfer->loadMissing(
            'latestLocation'
        );

        if (
            in_array(
                $transfer->status,
                [
                    'completed',
                    'cancelled',
                    'no_show',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Kapalı transferler için canlı rota hesaplanmaz.',
            ], 422);
        }

        $currentLocation =
            $transfer->latestLocation;

        if (!$currentLocation) {
            return response()->json([
                'message' =>
                    'Sürücünün güncel GPS konumu bulunamadı.',
            ], 422);
        }

        [$target, $targetLatitude, $targetLongitude] =
            $this->resolveTarget($transfer);

        if (
            $targetLatitude === null
            || $targetLongitude === null
        ) {
            return response()->json([
                'message' =>
                    'Rota hedefinin koordinatları bulunamadı.',

                'target' => $target,
            ], 422);
        }

        $route = $this->routing->route(
            (float) $currentLocation->latitude,
            (float) $currentLocation->longitude,
            $targetLatitude,
            $targetLongitude
        );

        if (!$route) {
            return response()->json([
                'message' =>
                    'Rota servisi şu anda sonuç döndüremedi.',
            ], 503);
        }

        $distanceMeters =
            $route['distance_meters'];

        $durationSeconds =
            $route['duration_seconds'];

        return response()->json([
            'data' => [
                'transfer_id' => $transfer->id,

                'booking_reference' =>
                    $transfer->booking_reference,

                'status' => $transfer->status,

                'target' => $target,

                'from' => [
                    'latitude' =>
                        (float) $currentLocation->latitude,

                    'longitude' =>
                        (float) $currentLocation->longitude,

                    'recorded_at' =>
                        $currentLocation
                            ->recorded_at
                            ?->toISOString(),
                ],

                'to' => [
                    'latitude' =>
                        $targetLatitude,

                    'longitude' =>
                        $targetLongitude,
                ],

                'distance_meters' =>
                    $distanceMeters,

                'distance_kilometers' =>
                    round(
                        $distanceMeters / 1000,
                        1
                    ),

                'distance_text' => sprintf(
                    '%.1f km',
                    $distanceMeters / 1000
                ),

                'duration_seconds' =>
                    $durationSeconds,

                'eta_minutes' => max(
                    1,
                    (int) ceil(
                        $durationSeconds / 60
                    )
                ),

                'geometry' =>
                    $route['geometry'],

                'provider' =>
                    $route['provider'],
            ],
        ]);
    }

    private function resolveTarget(
        Transfer $transfer
    ): array {
        if (
            in_array(
                $transfer->status,
                [
                    'passenger_on_board',
                    'trip_started',
                ],
                true
            )
        ) {
            return [
                'dropoff',
                $this->coordinate(
                    $transfer->dropoff_lat
                ),
                $this->coordinate(
                    $transfer->dropoff_lng
                ),
            ];
        }

        return [
            'pickup',
            $this->coordinate(
                $transfer->pickup_lat
            ),
            $this->coordinate(
                $transfer->pickup_lng
            ),
        ];
    }

    private function coordinate(
        mixed $value
    ): ?float {
        return is_numeric($value)
            ? (float) $value
            : null;
    }
}
