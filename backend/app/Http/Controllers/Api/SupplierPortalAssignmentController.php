<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierPortalAssignmentController extends Controller
{
    public function assign(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureTransferOwnership(
            $transfer,
            $supplierUser
        );

        if (
            !in_array(
                $transfer->status,
                [
                    'pending',
                    'accepted',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Operasyonu başlamış veya kapanmış transfer yeniden atanamaz.',
            ], 422);
        }

        $validated =
            $request->validate([
                'driver_id' => [
                    'required',
                    'integer',
                ],

                'vehicle_id' => [
                    'required',
                    'integer',
                ],
            ]);

        $driver = $this->resolveDriver(
            $validated['driver_id'],
            $supplierUser
        );

        $vehicle = $this->resolveVehicle(
            $validated['vehicle_id'],
            $supplierUser
        );

        $updatedTransfer =
            DB::transaction(
                function () use (
                    $transfer,
                    $driver,
                    $vehicle,
                    $supplierUser
                ): Transfer {
                    User::query()
                        ->where(
                            'role',
                            'driver'
                        )
                        ->where(
                            'supplier_id',
                            $supplierUser
                                ->supplier_id
                        )
                        ->where(
                            'vehicle_id',
                            $vehicle->id
                        )
                        ->where(
                            'id',
                            '!=',
                            $driver->id
                        )
                        ->update([
                            'vehicle_id' =>
                                null,
                        ]);

                    $driver->update([
                        'vehicle_id' =>
                            $vehicle->id,
                    ]);

                    $transfer->update([
                        'driver_id' =>
                            $driver->id,

                        'assigned_vehicle_id' =>
                            $vehicle->id,
                    ]);

                    return $transfer
                        ->fresh()
                        ->load([
                            'driver.vehicle',
                            'assignedVehicle',
                            'supplierCompany',
                            'pickupLocation',
                            'pickupPoint',
                            'dropoffLocation',
                            'dropoffPoint',
                            'latestEvent',
                            'latestLocation',
                        ]);
                }
            );

        return response()->json([
            'message' =>
                'Transfer sürücü ve araca atandı. Sürücü kabulü bekleniyor.',

            'data' =>
                $this->formatTransfer(
                    $updatedTransfer
                ),
        ]);
    }

    public function unassign(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureTransferOwnership(
            $transfer,
            $supplierUser
        );

        if (
            !in_array(
                $transfer->status,
                [
                    'pending',
                    'accepted',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Operasyonu başlamış veya kapanmış transferin ataması kaldırılamaz.',
            ], 422);
        }

        $payload = [
            'driver_id' =>
                null,

            'assigned_vehicle_id' =>
                null,
        ];

        if ($transfer->status === 'accepted') {
            $payload['status'] = 'pending';
        }

        $transfer->update($payload);

        $updatedTransfer =
            $transfer
                ->fresh()
                ->load([
                    'driver.vehicle',
                    'assignedVehicle',
                    'supplierCompany',
                    'pickupLocation',
                    'pickupPoint',
                    'dropoffLocation',
                    'dropoffPoint',
                    'latestEvent',
                    'latestLocation',
                ]);

        return response()->json([
            'message' =>
                'Transferin sürücü ve araç ataması kaldırıldı.',

            'data' =>
                $this->formatTransfer(
                    $updatedTransfer
                ),
        ]);
    }

    private function supplierUser(
        Request $request
    ): User {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'supplier' ||
            !$user->is_active ||
            !$user->supplier_id
        ) {
            abort(
                403,
                'Bu işlem yalnızca aktif tedarikçi kullanıcıları tarafından yapılabilir.'
            );
        }

        $supplier =
            $user->supplierCompany;

        if (
            !$supplier ||
            !$supplier->is_active ||
            $supplier->status !==
                'approved'
        ) {
            abort(
                403,
                'Tedarikçi hesabı aktif veya onaylı değil.'
            );
        }

        return $user;
    }

    private function ensureTransferOwnership(
        Transfer $transfer,
        User $supplierUser
    ): void {
        if (
            (int) $transfer->supplier_id !==
            (int) $supplierUser
                ->supplier_id
        ) {
            abort(
                404,
                'Transfer bulunamadı.'
            );
        }
    }

    private function resolveDriver(
        int $driverId,
        User $supplierUser
    ): User {
        $driver = User::query()
            ->whereKey($driverId)
            ->where(
                'role',
                'driver'
            )
            ->where(
                'supplier_id',
                $supplierUser
                    ->supplier_id
            )
            ->first();

        if (!$driver) {
            abort(
                422,
                'Seçilen sürücü bu tedarikçiye ait değil.'
            );
        }

        if (!$driver->is_active) {
            abort(
                422,
                'Pasif sürücüye transfer atanamaz.'
            );
        }

        return $driver;
    }

    private function resolveVehicle(
        int $vehicleId,
        User $supplierUser
    ): Vehicle {
        $vehicle = Vehicle::query()
            ->whereKey($vehicleId)
            ->where(
                'supplier_id',
                $supplierUser
                    ->supplier_id
            )
            ->first();

        if (!$vehicle) {
            abort(
                422,
                'Seçilen araç bu tedarikçiye ait değil.'
            );
        }

        if (
            !$vehicle->is_active ||
            $vehicle
                ->operational_status !==
                'active'
        ) {
            abort(
                422,
                'Yalnızca aktif araç transferde kullanılabilir.'
            );
        }

        return $vehicle;
    }

    private function formatTransfer(
        Transfer $transfer
    ): array {
        $supplier =
            $transfer->supplierCompany;

        $mainPrice =
            $transfer->getRawOriginal(
                'price'
            );

        $currency =
            $transfer->getRawOriginal(
                'currency'
            );

        return [
            'id' =>
                $transfer->id,

            'booking_reference' =>
                $transfer
                    ->booking_reference,

            'passenger_name' =>
                $transfer
                    ->passenger_name,

            'passenger_phone' =>
                $transfer
                    ->passenger_phone,

            'flight_number' =>
                $transfer
                    ->flight_number,

            'pickup' =>
                $transfer->pickup,

            'dropoff' =>
                $transfer->dropoff,

            'pickup_time' =>
                $transfer
                    ->pickup_time
                    ?->toISOString(),

            'vehicle_type' =>
                $transfer
                    ->vehicle_type,

            'adult' =>
                $transfer->adult,

            'child' =>
                $transfer->child,

            'baby' =>
                $transfer->baby,

            'luggage_count' =>
                $transfer
                    ->luggage_count,

            'status' =>
                $transfer->status,

            'supplier_amount' =>
                $supplier
                    ? $supplier
                        ->calculatePayableAmount(
                            $mainPrice
                        )
                    : null,

            'currency' =>
                $currency,

            'driver_id' =>
                $transfer->driver_id,

            'assigned_vehicle_id' =>
                $transfer
                    ->assigned_vehicle_id,

            'driver' =>
                $transfer->driver,

            'assigned_vehicle' =>
                $transfer
                    ->assignedVehicle,

            'pickup_location' =>
                $transfer
                    ->pickupLocation,

            'pickup_point' =>
                $transfer
                    ->pickupPoint,

            'dropoff_location' =>
                $transfer
                    ->dropoffLocation,

            'dropoff_point' =>
                $transfer
                    ->dropoffPoint,
        ];
    }
}
