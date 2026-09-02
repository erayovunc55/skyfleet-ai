<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\User;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DispatcherController extends Controller
{
    public function __construct(
        private readonly GeocodingService $geocoding
    ) {
    }

    public function transfers(): JsonResponse
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $transfers = Transfer::query()
            ->with([
                'driver.vehicle',
                'supplierCompany',
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

            $todayTransferCount = 0;
            $todayCompletedCount = 0;

            if ($driver) {
                $todayTransferCount = Transfer::query()
                    ->where('driver_id', $driver->id)
                    ->whereBetween(
                        'pickup_time',
                        [$todayStart, $todayEnd]
                    )
                    ->count();

                $todayCompletedCount = Transfer::query()
                    ->where('driver_id', $driver->id)
                    ->where('status', 'completed')
                    ->whereBetween(
                        'pickup_time',
                        [$todayStart, $todayEnd]
                    )
                    ->count();
            }

            return $this->formatTransfer(
                $transfer,
                $todayTransferCount,
                $todayCompletedCount
            );
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
            'pickup_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'pickup_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],
            'dropoff' => [
                'required',
                'string',
            ],
            'dropoff_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'dropoff_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
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

        if (!empty($data['driver_id'])) {
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

        $warnings = [];

        if (
            !isset($data['pickup_lat'])
            || !isset($data['pickup_lng'])
        ) {
            $pickupResult = $this->geocoding
                ->geocode($data['pickup']);

            if ($pickupResult) {
                $data['pickup_lat'] =
                    $pickupResult['latitude'];

                $data['pickup_lng'] =
                    $pickupResult['longitude'];
            } else {
                $warnings[] =
                    'Pickup koordinatları otomatik bulunamadı.';
            }
        }

        if (
            !isset($data['dropoff_lat'])
            || !isset($data['dropoff_lng'])
        ) {
            $dropoffResult = $this->geocoding
                ->geocode($data['dropoff']);

            if ($dropoffResult) {
                $data['dropoff_lat'] =
                    $dropoffResult['latitude'];

                $data['dropoff_lng'] =
                    $dropoffResult['longitude'];
            } else {
                $warnings[] =
                    'Dropoff koordinatları otomatik bulunamadı.';
            }
        }

        $data['booking_reference'] =
            $data['booking_reference']
            ?? $this->generateBookingReference();

        $data['status'] =
            empty($data['driver_id'])
                ? 'pending'
                : 'accepted';

        $transfer = Transfer::create($data);

        $createdTransfer = $transfer
            ->fresh()
            ->load([
                'driver.vehicle',
                'supplierCompany',
                'pickupLocation.type',
                'pickupPoint.airportTerminal',
                'dropoffLocation.type',
                'dropoffPoint.airportTerminal',
                'events.driver',
                'latestEvent',
                'latestLocation',
            ]);

        return response()->json([
            'message' => empty($warnings)
                ? 'Transfer oluşturuldu ve koordinatlar hazırlandı.'
                : 'Transfer oluşturuldu; bazı koordinatlar bulunamadı.',

            'warnings' => $warnings,

            'data' => $this->formatTransfer(
                $createdTransfer
            ),
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

        $updatedTransfer = $transfer
            ->fresh()
            ->load([
                'driver.vehicle',
                'supplierCompany',
                'pickupLocation.type',
                'pickupPoint.airportTerminal',
                'dropoffLocation.type',
                'dropoffPoint.airportTerminal',
                'events.driver',
                'latestEvent',
                'latestLocation',
            ]);

        return response()->json([
            'message' =>
                'Sürücü başarıyla atandı.',

            'data' => $this->formatTransfer(
                $updatedTransfer
            ),
        ]);
    }
public function bulkAssignSupplier(
    Request $request
): JsonResponse {
    $data = $request->validate([
        'transfer_ids' => [
            'required',
            'array',
            'min:1',
        ],
        'transfer_ids.*' => [
            'integer',
            'exists:transfers,id',
        ],
        'supplier_id' => [
            'required',
            'integer',
            'exists:suppliers,id',
        ],
    ]);

    $transferIds = array_values(
        array_unique($data['transfer_ids'])
    );

    $supplierId = (int) $data['supplier_id'];

    $updatedCount = 0;
    $skippedCount = 0;

    DB::transaction(function () use (
        $transferIds,
        $supplierId,
        &$updatedCount,
        &$skippedCount
    ) {
        $transfers = Transfer::query()
            ->whereIn('id', $transferIds)
            ->lockForUpdate()
            ->get();

        foreach ($transfers as $transfer) {
            if ($transfer->supplier_id !== null) {
                $skippedCount++;
                continue;
            }

            $transfer->update([
                'supplier_id' => $supplierId,
            ]);

            $updatedCount++;
        }
    });

    return response()->json([
        'message' => 'Toplu tedarikçi ataması tamamlandı.',
        'updated_count' => $updatedCount,
        'skipped_count' => $skippedCount,
        'supplier_id' => $supplierId,
    ]);
}
    private function formatTransfer(
        Transfer $transfer,
        int $todayTransferCount = 0,
        int $todayCompletedCount = 0
    ): array {
        $driver = $transfer->driver;
        $vehicle = $driver?->vehicle;

        return [
    ...$transfer->toArray(),

    'voucher' =>
        $transfer->booking_reference,

    /*
 * Yalnızca dispatcher/admin paneli için
 * dış platform rezervasyon numarası.
 */
'ota_booking_reference' =>
    $transfer->ota_booking_reference,

/*
 * Ticari bilgiler genel ve sürücü API
 * cevaplarında gizlidir. Burada yalnızca
 * yetkili dispatcher/admin paneline açılır.
 */
'price' =>
    $transfer->price,

'currency' =>
    $transfer->currency,

'driver_name' =>
    $driver?->name,

            'supplier_id' =>
                $transfer->supplier_id,

            'supplier_company' =>
                $transfer->supplierCompany,

            'pickup_location' =>
                $transfer->pickupLocation,

            'dropoff_location' =>
                $transfer->dropoffLocation,

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
            'assigned',
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