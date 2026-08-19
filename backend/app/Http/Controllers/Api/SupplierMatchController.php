<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\SupplierMatchingService;
use Illuminate\Http\JsonResponse;

class SupplierMatchController extends Controller
{
    public function __construct(
        private readonly SupplierMatchingService $matchingService
    ) {
    }

    public function index(Transfer $transfer): JsonResponse
    {
        $matches = $this->matchingService->forTransfer($transfer);

        return response()->json([
            'data' => $matches,
            'meta' => [
                'transfer_id' => $transfer->id,
                'pickup_location_id' => $transfer->pickup_location_id,
                'dropoff_location_id' => $transfer->dropoff_location_id,
                'candidate_count' => $matches->count(),
            ],
        ]);
    }
}