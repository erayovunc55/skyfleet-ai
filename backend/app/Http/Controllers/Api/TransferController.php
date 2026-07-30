<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class TransferController extends Controller
{
    public function index(): JsonResponse
    {
        $transfers = Transfer::query()
            ->with([
                'driver.vehicle',
                'pickupLocation.type',
                'pickupPoint.airportTerminal',
                'dropoffLocation.type',
                'dropoffPoint.airportTerminal',
                'latestEvent',
                'latestLocation',
            ])
            ->orderBy('pickup_time')
            ->get();

        return response()->json([
            'data' => $transfers,
        ]);
    }

    public function show(
        Transfer $transfer
    ): JsonResponse {
        $transfer->load([
            'driver.vehicle',
            'pickupLocation.type',
            'pickupPoint.airportTerminal',
            'dropoffLocation.type',
            'dropoffPoint.airportTerminal',
            'events.driver',
            'latestEvent',
            'latestLocation',
        ]);

        return response()->json([
            'data' => $transfer,
        ]);
    }

    public function updateAssignment(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $validated = $request->validate([
            'driver_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $driverId =
            $validated['driver_id'] ?? null;

        $driver = null;

        if ($driverId !== null) {
            $driver = User::query()
                ->whereKey($driverId)
                ->where('role', 'driver')
                ->where('is_active', true)
                ->with('vehicle')
                ->first();

            if (!$driver) {
                return response()->json([
                    'message' =>
                        'Seçilen kullanıcı aktif bir sürücü değil.',
                ], 422);
            }

            if (!$driver->vehicle) {
                return response()->json([
                    'message' =>
                        'Seçilen sürücüye araç atanmamış.',
                ], 422);
            }

            if (
                $driver->vehicle
                    ->operational_status !== 'active'
            ) {
                return response()->json([
                    'message' =>
                        'Sürücüye bağlı araç operasyon için aktif değil.',
                ], 422);
            }
        }

        $updatedTransfer = DB::transaction(
            function () use (
                $transfer,
                $driver,
                $request
            ) {
                $previousDriverId =
                    $transfer->driver_id;

                $transfer->update([
                    'driver_id' => $driver?->id,
                ]);

                $transfer->events()->create([
                    'driver_id' => $driver?->id,

                    'event_type' => $driver
                        ? 'driver_assigned'
                        : 'driver_unassigned',

                    'status' => $transfer->status,

                    'occurred_at' => now(),

                    'timezone' =>
                        config(
                            'app.timezone',
                            'UTC'
                        ),

                    'note' => $driver
                        ? "{$driver->name} sürücü olarak atandı."
                        : 'Transferdeki sürücü ataması kaldırıldı.',

                    'metadata' => [
                        'previous_driver_id' =>
                            $previousDriverId,

                        'new_driver_id' =>
                            $driver?->id,

                        'changed_by_user_id' =>
                            $request->user()?->id,
                    ],
                ]);

                return $transfer
                    ->fresh()
                    ->load([
                        'driver.vehicle',
                        'pickupLocation.type',
                        'pickupPoint.airportTerminal',
                        'dropoffLocation.type',
                        'dropoffPoint.airportTerminal',
                        'events.driver',
                        'latestEvent',
                        'latestLocation',
                    ]);
            }
        );

        return response()->json([
            'message' => $driver
                ? 'Sürücü ve bağlı araç başarıyla atandı.'
                : 'Sürücü ataması kaldırıldı.',

            'data' => $updatedTransfer,
        ]);
    }
    public function updateStatus(
    Request $request,
    Transfer $transfer
): JsonResponse {
    $allowedStatuses = [
        'pending',
        'accepted',
        'on_the_way',
        'arrived',
        'passenger_called',
        'passenger_on_board',
        'trip_started',
        'completed',
        'no_show',
        'cancelled',
    ];

    $validated = $request->validate([
        'status' => [
            'required',
            'string',
            Rule::in($allowedStatuses),
        ],

        'note' => [
            'nullable',
            'string',
            'max:5000',
        ],
    ]);

    $previousStatus = $transfer->status;

    $updatedTransfer = DB::transaction(
        function () use (
            $transfer,
            $validated,
            $previousStatus,
            $request
        ) {
            $transfer->update([
                'status' => $validated['status'],
            ]);

            $transfer->events()->create([
                'driver_id' => $transfer->driver_id,

                'event_type' =>
                    $validated['status'],

                'status' =>
                    $validated['status'],

                'occurred_at' => now(),

                'timezone' =>
                    config(
                        'app.timezone',
                        'UTC'
                    ),

                'note' =>
                    $validated['note'] ?? null,

                'metadata' => [
                    'previous_status' =>
                        $previousStatus,

                    'new_status' =>
                        $validated['status'],

                    'changed_by_user_id' =>
                        $request->user()?->id,
                ],
            ]);

            return $transfer
                ->fresh()
                ->load([
                    'driver.vehicle',
                    'pickupLocation.type',
                    'pickupPoint.airportTerminal',
                    'dropoffLocation.type',
                    'dropoffPoint.airportTerminal',
                    'events.driver',
                    'latestEvent',
                    'latestLocation',
                ]);
        }
    );

    return response()->json([
        'message' =>
            'Transfer durumu güncellendi.',

        'data' => $updatedTransfer,
    ]);
}
}