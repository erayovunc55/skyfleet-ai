<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                    'driver_status' => $this->getDriverStatus(
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

    public function store(
        Request $request
    ): JsonResponse {
        $data = $request->validate([
            'supplier' => [
                'required',
                'string',
            ],
            'passenger_name' => [
                'required',
                'string',
            ],
            'passenger_phone' => [
                'nullable',
                'string',
            ],
            'passenger_email' => [
                'nullable',
                'email',
            ],
            'flight_number' => [
                'nullable',
                'string',
            ],
            'pickup' => [
                'required',
                'string',
            ],
            'dropoff' => [
                'required',
                'string',
            ],
            'pickup_time' => [
                'required',
                'date',
            ],
            'vehicle_type' => [
                'nullable',
                'string',
            ],
            'driver_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'adult' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'child' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'baby' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'luggage_count' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'price' => [
                'nullable',
                'numeric',
            ],
            'currency' => [
                'nullable',
                'string',
            ],
            'passenger_note' => [
                'nullable',
                'string',
            ],
            'booking_reference' => [
                'nullable',
                'string',
            ],
        ]);

        if (
            !empty($data['driver_id'])
        ) {
            $driver = User::findOrFail(
                $data['driver_id']
            );

            if (
                $driver->role !== 'driver'
                || !$driver->is_active
            ) {
                return response()->json([
                    'message' =>
                        'Yalnızca aktif sürücüler atanabilir.',
                ], 422);
            }
        }

        $data['booking_reference'] =
            $data['booking_reference']
            ?? $this->generateBookingReference();

        $data['status'] = empty($data['driver_id'])
            ? 'pending'
            : 'accepted';

        $transfer = Transfer::create($data);

        return response()->json([
            'data' => $transfer
                ->fresh()
                ->load('driver'),
        ], 201);
    }

    public function assign(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $data = $request->validate([
            'driver_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
        ]);

        $driver = User::findOrFail(
            $data['driver_id']
        );

        if ($driver->role !== 'driver') {
            return response()->json([
                'message' =>
                    'Seçilen kullanıcı bir sürücü değil.',
            ], 422);
        }

        if (!$driver->is_active) {
            return response()->json([
                'message' =>
                    'Pasif sürücü transferlere atanamaz.',
            ], 422);
        }

        $transfer->update([
            'driver_id' => $driver->id,
            'status' => 'accepted',
        ]);

        return response()->json([
            'message' =>
                'Sürücü başarıyla atandı.',
            'data' => $transfer
                ->fresh()
                ->load([
                    'driver.vehicle',
                    'pickupLocation.type',
                    'pickupPoint.airportTerminal',
                    'dropoffLocation.type',
                    'dropoffPoint.airportTerminal',
                    'latestEvent',
                    'latestLocation',
                ]),
        ]);
    }

    private function generateBookingReference(): string
    {
        do {
            $reference = sprintf(
                'SF-%s-%05d',
                now()->format('Y'),
                random_int(1, 99999)
            );
        } while (
            Transfer::query()
                ->where(
                    'booking_reference',
                    $reference
                )
                ->exists()
        );

        return $reference;
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