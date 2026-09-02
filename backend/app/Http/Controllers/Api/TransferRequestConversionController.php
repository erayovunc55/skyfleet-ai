<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferRequest;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TransferRequestConversionController extends Controller
{
    public function __construct(
        private readonly GeocodingService $geocoding
    ) {}

    public function store(
        Request $request,
        TransferRequest $transferRequest
    ): JsonResponse {
        $validated = $request->validate([
            'supplier' => ['required', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
        ]);

        if ($transferRequest->status !== 'confirmed') {
            return response()->json([
                'message' => 'Yalnızca onaylanmış talepler transfere dönüştürülebilir.',
            ], 409);
        }

        if ($transferRequest->converted_at || $transferRequest->transfer_id) {
            return response()->json([
                'message' => 'Bu talep daha önce transfere dönüştürülmüş.',
                'transfer_id' => $transferRequest->transfer_id,
            ], 409);
        }

        $coordinates = $this->coordinates($transferRequest);

        $result = DB::transaction(function () use (
            $request,
            $transferRequest,
            $validated,
            $coordinates
        ): array {
            $locked = TransferRequest::query()
                ->whereKey($transferRequest->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->converted_at || $locked->transfer_id) {
                return ['conflict' => true, 'transfer_id' => $locked->transfer_id];
            }

            if ($locked->status !== 'confirmed') {
                return ['invalid_status' => true];
            }

            $pickupTime = Carbon::createFromFormat(
                'Y-m-d H:i',
                $locked->pickup_date->toDateString().' '.substr($locked->pickup_time, 0, 5),
                $locked->timezone ?: 'UTC'
            )->utc();

            $transfer = Transfer::query()->create([
                'booking_reference' => $locked->request_reference,
                'ota_source' => 'public_website',
                'supplier' => trim($validated['supplier']),
                'passenger_name' => $locked->passenger_name,
                'passenger_phone' => $locked->passenger_phone,
                'passenger_email' => $locked->passenger_email,
                'flight_number' => $locked->flight_number,
                'pickup' => $locked->pickup,
                'pickup_lat' => $coordinates['pickup_lat'],
                'pickup_lng' => $coordinates['pickup_lng'],
                'dropoff' => $locked->dropoff,
                'dropoff_lat' => $coordinates['dropoff_lat'],
                'dropoff_lng' => $coordinates['dropoff_lng'],
                'pickup_time' => $pickupTime,
                'vehicle_type' => $validated['vehicle_type'] ?? $locked->vehicle_type,
                'adult' => max(1, (int) $locked->passengers),
                'child' => 0,
                'baby' => 0,
                'luggage_count' => (int) $locked->luggage_count,
                'price' => $validated['price'] ?? null,
                'currency' => strtoupper($validated['currency']),
                'passenger_note' => $locked->note,
                'status' => 'pending',
            ]);

            $locked->update([
                'transfer_id' => $transfer->id,
                'converted_by_user_id' => $request->user()->id,
                'converted_at' => now(),
            ]);

            return ['transfer' => $transfer];
        });

        if ($result['conflict'] ?? false) {
            return response()->json([
                'message' => 'Bu talep daha önce transfere dönüştürülmüş.',
                'transfer_id' => $result['transfer_id'],
            ], 409);
        }

        if ($result['invalid_status'] ?? false) {
            return response()->json(['message' => 'Talep artık onaylı durumda değil.'], 409);
        }

        $transfer = $result['transfer'];

        return response()->json([
            'message' => 'Transfer talebi operasyona aktarıldı.',
            'warnings' => $coordinates['warnings'],
            'data' => [
                'id' => $transfer->id,
                'booking_reference' => $transfer->booking_reference,
                'status' => $transfer->status,
            ],
        ], 201);
    }

    private function coordinates(TransferRequest $request): array
    {
        $result = ['pickup_lat' => null, 'pickup_lng' => null, 'dropoff_lat' => null, 'dropoff_lng' => null, 'warnings' => []];

        if ($this->hasCoordinatePair($request->pickup_lat, $request->pickup_lng)) {
            $result['pickup_lat'] = (float) $request->pickup_lat;
            $result['pickup_lng'] = (float) $request->pickup_lng;
        } else {
            try {
                $pickup = $this->geocoding->geocode($request->pickup);
                if ($pickup) {
                    $result['pickup_lat'] = $pickup['latitude'];
                    $result['pickup_lng'] = $pickup['longitude'];
                } else {
                    $result['warnings'][] = 'Pickup koordinatları otomatik bulunamadı.';
                }
            } catch (\Throwable) {
                $result['warnings'][] = 'Pickup koordinat servisine ulaşılamadı.';
            }
        }

        if ($this->hasCoordinatePair($request->dropoff_lat, $request->dropoff_lng)) {
            $result['dropoff_lat'] = (float) $request->dropoff_lat;
            $result['dropoff_lng'] = (float) $request->dropoff_lng;
        } else {
            try {
                $dropoff = $this->geocoding->geocode($request->dropoff);
                if ($dropoff) {
                    $result['dropoff_lat'] = $dropoff['latitude'];
                    $result['dropoff_lng'] = $dropoff['longitude'];
                } else {
                    $result['warnings'][] = 'Dropoff koordinatları otomatik bulunamadı.';
                }
            } catch (\Throwable) {
                $result['warnings'][] = 'Dropoff koordinat servisine ulaşılamadı.';
            }
        }

        return $result;
    }

    private function hasCoordinatePair(
        int|float|string|null $latitude,
        int|float|string|null $longitude
    ): bool {
        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            return false;
        }

        return (float) $latitude >= -90
            && (float) $latitude <= 90
            && (float) $longitude >= -180
            && (float) $longitude <= 180;
    }
}
