<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DispatcherTransferManagementController extends Controller
{
    public function __construct(
        private readonly GeocodingService $geocoding
    ) {
    }

    public function update(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
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
                    'Operasyonu başlamış veya kapanmış transfer düzenlenemez.',
            ], 409);
        }

        $data = $request->validate([
            /*
             * Transferi gerçekleştirecek
             * gerçek tedarikçi şirketi.
             */
            'supplier_id' => [
                'sometimes',
                'nullable',
                'integer',

                Rule::exists(
                    'suppliers',
                    'id'
                )->where(
                    function ($query): void {
                        $query
                            ->where(
                                'status',
                                'approved'
                            )
                            ->where(
                                'is_active',
                                true
                            )
                            ->whereNull(
                                'deleted_at'
                            );
                    }
                ),
            ],

            /*
             * HeyTrip gibi rezervasyon
             * kaynağından gelen eski
             * metin alanı.
             */
            'supplier' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'passenger_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'passenger_phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'passenger_email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],

            'flight_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'airline' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'terminal' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'pickup' => [
                'sometimes',
                'required',
                'string',
                'max:1000',
            ],

            'pickup_lat' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'pickup_lng' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'dropoff' => [
                'sometimes',
                'required',
                'string',
                'max:1000',
            ],

            'dropoff_lat' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'dropoff_lng' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'pickup_time' => [
                'sometimes',
                'required',
                'date',
            ],

            'meet_point' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],

            'driver_note' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            'passenger_note' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            'adult' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
                'max:100',
            ],

            'child' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
                'max:100',
            ],

            'baby' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
                'max:100',
            ],

            'luggage_count' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
                'max:100',
            ],

            'vehicle_type' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'currency' => [
                'sometimes',
                'required',
                'string',

                Rule::in([
                    'EUR',
                    'USD',
                    'GBP',
                    'TRY',
                ]),
            ],
        ]);

        $previousValues = $transfer->only(
            array_keys($data)
        );

        $pickupChanged =
            array_key_exists(
                'pickup',
                $data
            )
            && $data['pickup']
                !== $transfer->pickup;

        $dropoffChanged =
            array_key_exists(
                'dropoff',
                $data
            )
            && $data['dropoff']
                !== $transfer->dropoff;

        if ($pickupChanged) {
            if (
                !array_key_exists(
                    'pickup_lat',
                    $data
                )
                || !array_key_exists(
                    'pickup_lng',
                    $data
                )
                || $data['pickup_lat'] === null
                || $data['pickup_lng'] === null
            ) {
                $coordinates =
                    $this->geocoding
                        ->geocode(
                            $data['pickup']
                        );

                $data['pickup_lat'] =
                    $coordinates['latitude']
                    ?? null;

                $data['pickup_lng'] =
                    $coordinates['longitude']
                    ?? null;
            }
        }

        if ($dropoffChanged) {
            if (
                !array_key_exists(
                    'dropoff_lat',
                    $data
                )
                || !array_key_exists(
                    'dropoff_lng',
                    $data
                )
                || $data['dropoff_lat'] === null
                || $data['dropoff_lng'] === null
            ) {
                $coordinates =
                    $this->geocoding
                        ->geocode(
                            $data['dropoff']
                        );

                $data['dropoff_lat'] =
                    $coordinates['latitude']
                    ?? null;

                $data['dropoff_lng'] =
                    $coordinates['longitude']
                    ?? null;
            }
        }

        if (
            array_key_exists(
                'currency',
                $data
            )
        ) {
            $data['currency'] =
                strtoupper(
                    $data['currency']
                );
        }

        $updatedTransfer =
            DB::transaction(
                function () use (
                    $transfer,
                    $data,
                    $previousValues,
                    $request
                ): Transfer {
                    $previousSupplierId =
                        $transfer->supplier_id;

                    $transfer->update(
                        $data
                    );

                    $supplierChanged =
                        array_key_exists(
                            'supplier_id',
                            $data
                        )
                        &&
                        (
                            (int) $previousSupplierId
                            !==
                            (int) (
                                $data['supplier_id']
                                ?? 0
                            )
                        );

                    $eventType =
                        $supplierChanged
                            ? (
                                $data['supplier_id']
                                    ? 'supplier_assigned'
                                    : 'supplier_unassigned'
                            )
                            : 'transfer_updated';

                    $eventNote =
                        $supplierChanged
                            ? (
                                $data['supplier_id']
                                    ? 'Transfer tedarikçiye atandı.'
                                    : 'Transferin tedarikçi ataması kaldırıldı.'
                            )
                            : 'Transfer bilgileri dispatcher tarafından güncellendi.';

                    $transfer
                        ->events()
                        ->create([
                            'driver_id' =>
                                $transfer->driver_id,

                            'event_type' =>
                                $eventType,

                            'status' =>
                                $transfer->status,

                            'occurred_at' =>
                                now(),

                            'timezone' =>
                                config(
                                    'app.timezone',
                                    'UTC'
                                ),

                            'note' =>
                                $eventNote,

                            'metadata' => [
                                'previous_values' =>
                                    $previousValues,

                                'new_values' =>
                                    $data,

                                'previous_supplier_id' =>
                                    $previousSupplierId,

                                'new_supplier_id' =>
                                    $transfer->supplier_id,

                                'changed_by_user_id' =>
                                    $request
                                        ->user()
                                        ?->id,
                            ],
                        ]);

                    return $this
                        ->loadTransfer(
                            $transfer
                        );
                }
            );

        return response()->json([
            'message' =>
                array_key_exists(
                    'supplier_id',
                    $data
                )
                    ? (
                        $data['supplier_id']
                            ? 'Transfer tedarikçiye atandı.'
                            : 'Transferin tedarikçi ataması kaldırıldı.'
                    )
                    : 'Transfer bilgileri güncellendi.',

            'data' =>
                $updatedTransfer,
        ]);
    }

    public function cancel(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $validated =
            $request->validate([
                'reason' => [
                    'required',
                    'string',
                    'min:10',
                    'max:2000',
                ],
            ]);

        if (
            in_array(
                $transfer->status,
                [
                    'completed',
                    'no_show',
                    'cancelled',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Tamamlanmış, no-show veya daha önce iptal edilmiş transfer iptal edilemez.',
            ], 409);
        }

        $cancelledTransfer =
            DB::transaction(
                function () use (
                    $transfer,
                    $validated,
                    $request
                ): Transfer {
                    $previousStatus =
                        $transfer->status;

                    $previousDriverId =
                        $transfer->driver_id;

                    $previousSupplierId =
                        $transfer->supplier_id;

                    $transfer->update([
                        'status' =>
                            'cancelled',

                        'driver_id' =>
                            null,

                        /*
                         * İptal kaydı tedarikçi
                         * panelinde görünmeye
                         * devam etsin diye
                         * supplier_id silinmez.
                         */
                        'cancellation_reason' =>
                            $validated[
                                'reason'
                            ],

                        'cancelled_at' =>
                            now(),

                        'cancelled_by' =>
                            $request
                                ->user()
                                ?->id,
                    ]);

                    $transfer
                        ->events()
                        ->create([
                            'driver_id' =>
                                $previousDriverId,

                            'event_type' =>
                                'transfer_cancelled',

                            'status' =>
                                'cancelled',

                            'occurred_at' =>
                                now(),

                            'timezone' =>
                                config(
                                    'app.timezone',
                                    'UTC'
                                ),

                            'note' =>
                                $validated[
                                    'reason'
                                ],

                            'metadata' => [
                                'previous_status' =>
                                    $previousStatus,

                                'previous_driver_id' =>
                                    $previousDriverId,

                                'supplier_id' =>
                                    $previousSupplierId,

                                'cancelled_by_user_id' =>
                                    $request
                                        ->user()
                                        ?->id,
                            ],
                        ]);

                    return $this
                        ->loadTransfer(
                            $transfer
                        );
                }
            );

        return response()->json([
            'message' =>
                'Transfer iptal edildi.',

            'data' =>
                $cancelledTransfer,
        ]);
    }

    private function loadTransfer(
        Transfer $transfer
    ): Transfer {
        return $transfer
            ->fresh()
            ->load([
                'driver.vehicle',
                'supplierCompany',
                'cancelledBy',

                'pickupLocation.type',
                'pickupPoint.airportTerminal',

                'dropoffLocation.type',
                'dropoffPoint.airportTerminal',

                'events.driver',
                'latestEvent',
                'latestLocation',
            ])
            ->makeVisible([
                'ota_booking_reference',
                'price',
                'currency',
            ]);
    }
}