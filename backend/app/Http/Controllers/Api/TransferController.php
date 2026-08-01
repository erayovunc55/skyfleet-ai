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

        $driverId = $validated['driver_id'] ?? null;
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
                $driver->vehicle->operational_status
                !== 'active'
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

                    'timezone' => config(
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
            'accepted',
            'on_the_way',
            'arrived',
            'passenger_called',
            'passenger_on_board',
            'trip_started',
            'completed',
            'no_show',
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

        $user = $request->user();

        if (
            !$user
            || $user->role !== 'driver'
            || !$user->is_active
        ) {
            return response()->json([
                'message' =>
                    'Bu işlemi yalnızca aktif bir sürücü yapabilir.',
            ], 403);
        }

        $result = DB::transaction(
            function () use (
                $transfer,
                $validated,
                $user
            ): array {
                /*
                 * Aynı transfere aynı anda iki istek gelmesini
                 * engellemek için kayıt kilitlenir.
                 */
                $lockedTransfer = Transfer::query()
                    ->whereKey($transfer->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                if (
                    (int) $lockedTransfer->driver_id
                    !== (int) $user->id
                ) {
                    return [
                        'success' => false,
                        'status_code' => 403,
                        'message' =>
                            'Bu transfer size atanmadığı için durumunu güncelleyemezsiniz.',
                    ];
                }

                if ($lockedTransfer->isTerminalStatus()) {
                    return [
                        'success' => false,
                        'status_code' => 409,
                        'message' =>
                            'Tamamlanmış veya no-show olarak kapatılmış transfer güncellenemez.',
                    ];
                }

                $nextStatus = $validated['status'];
                $previousStatus = $lockedTransfer->status;

                if ($previousStatus === $nextStatus) {
                    return [
                        'success' => false,
                        'status_code' => 409,
                        'message' =>
                            'Transfer zaten bu durumda.',
                    ];
                }

                if (
                    !$lockedTransfer
                        ->canTransitionTo($nextStatus)
                ) {
                    return [
                        'success' => false,
                        'status_code' => 409,
                        'message' =>
                            'Geçersiz durum geçişi. İşlem adımları sırayla tamamlanmalıdır.',

                        'current_status' =>
                            $previousStatus,

                        'allowed_next_statuses' =>
                            $lockedTransfer
                                ->allowedNextStatuses(),
                    ];
                }

                $duplicateEventExists =
                    $lockedTransfer
                        ->events()
                        ->where('status', $nextStatus)
                        ->exists();

                if ($duplicateEventExists) {
                    return [
                        'success' => false,
                        'status_code' => 409,
                        'message' =>
                            'Bu operasyon adımı daha önce kaydedilmiş.',
                    ];
                }

                $lockedTransfer->update([
                    'status' => $nextStatus,
                ]);

                $lockedTransfer
                    ->events()
                    ->create([
                        'driver_id' => $user->id,

                        'event_type' => $nextStatus,

                        'status' => $nextStatus,

                        'occurred_at' => now(),

                        'timezone' => config(
                            'app.timezone',
                            'UTC'
                        ),

                        'note' =>
                            $validated['note']
                            ?? null,

                        'metadata' => [
                            'previous_status' =>
                                $previousStatus,

                            'new_status' =>
                                $nextStatus,

                            'changed_by_user_id' =>
                                $user->id,
                        ],
                    ]);

                $updatedTransfer = $lockedTransfer
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

                return [
                    'success' => true,
                    'transfer' => $updatedTransfer,
                ];
            }
        );

        if (!$result['success']) {
            $response = [
                'message' => $result['message'],
            ];

            if (
                isset($result['current_status'])
            ) {
                $response['current_status'] =
                    $result['current_status'];
            }

            if (
                isset(
                    $result[
                        'allowed_next_statuses'
                    ]
                )
            ) {
                $response[
                    'allowed_next_statuses'
                ] = $result[
                    'allowed_next_statuses'
                ];
            }

            return response()->json(
                $response,
                $result['status_code']
            );
        }

        return response()->json([
            'message' =>
                'Transfer durumu güncellendi.',

            'data' => $result['transfer'],
        ]);
    }
}