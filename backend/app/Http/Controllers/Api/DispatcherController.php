<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;

class DispatcherController extends Controller
{
    public function transfers(): JsonResponse
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $transfers = Transfer::query()
            ->with([
                'driver.vehicle',

                'pickupLocation.type',
                'pickupPoint.airportTerminal',

                'dropoffLocation.type',
                'dropoffPoint.airportTerminal',

                'events.driver',

                'latestEvent',
                'latestLocation',
            ])
            ->orderBy('pickup_time')
            ->get();

        $data = $transfers->map(function (
            Transfer $transfer
        ) use (
            $todayStart,
            $todayEnd
        ): array {
            $driver = $transfer->driver;
            $vehicle = $driver?->vehicle;

            $todayTransferCount = 0;
            $todayCompletedCount = 0;

            if ($driver) {
                $todayTransferCount = Transfer::query()
                    ->where('driver_id', $driver->id)
                    ->whereBetween('pickup_time', [
                        $todayStart,
                        $todayEnd,
                    ])
                    ->count();

                $todayCompletedCount = Transfer::query()
                    ->where('driver_id', $driver->id)
                    ->where('status', 'completed')
                    ->whereBetween('pickup_time', [
                        $todayStart,
                        $todayEnd,
                    ])
                    ->count();
            }

            return [
                ...$transfer->toArray(),

                'operation_summary' => [
                    'driver_status' =>
                        $this->getDriverStatus(
                            $transfer->status
                        ),

                    'vehicle_status' =>
                        $vehicle?->operational_status
                        ?? 'unassigned',

                    'last_gps_at' =>
                        $transfer->latestLocation
                            ?->recorded_at
                            ?->toISOString(),

                    'today_transfer_count' =>
                        $todayTransferCount,

                    'today_completed_count' =>
                        $todayCompletedCount,
                ],
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    private function getDriverStatus(
        string $transferStatus
    ): string {
        return match ($transferStatus) {
            'accepted',
            'on_the_way',
            'arrived',
            'passenger_called',
            'passenger_on_board',
            'trip_started' => 'on_duty',

            'completed',
            'no_show' => 'available',

            default => 'waiting',
        };
    }
}