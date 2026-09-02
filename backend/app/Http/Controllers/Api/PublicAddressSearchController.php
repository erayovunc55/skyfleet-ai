<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicAddressSearchController extends Controller
{
    public function __invoke(
        Request $request,
        GeocodingService $geocodingService
    ): JsonResponse {
        $validated = $request->validate([
            'q' => [
                'required',
                'string',
                'min:2',
                'max:150',
            ],
        ]);

        $results = $geocodingService->search(
            $validated['q'],
            6
        );

        return response()->json([
            'data' => $results,
        ]);
    }
}