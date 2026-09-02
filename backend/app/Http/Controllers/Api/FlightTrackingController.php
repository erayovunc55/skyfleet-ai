<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FlightStatusSnapshot;
use App\Models\Transfer;
use App\Services\FlightTrackingService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class FlightTrackingController extends Controller
{
    public function show(Transfer $transfer): JsonResponse
    {
        $latest = FlightStatusSnapshot::query()
            ->where('transfer_id', $transfer->id)
            ->latest('recorded_at')
            ->first();

        return response()->json([
            'data' => [
                'transfer_id' => $transfer->id,
                'booking_reference' => $transfer->booking_reference,
                'flight_number' => $transfer->flight_number,
                'configured' => (bool) config('services.flight_tracking.key'),
                'latest' => $latest,
            ],
        ]);
    }

    public function sync(
        Transfer $transfer,
        FlightTrackingService $service
    ): JsonResponse {
        try {
            $snapshot = $service->sync($transfer);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Uçuş durumu güncellendi.',
            'data' => $snapshot,
        ]);
    }
}
