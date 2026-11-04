<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SkyfleetAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SkyfleetAiController extends Controller
{
    public function chat(
        Request $request,
        SkyfleetAiService $ai
    ): JsonResponse {
        $validated = $request->validate([
            'question' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        try {
            $result = $ai->ask(
                $validated['question']
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Skyfleet AI could not answer the request.',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }
}
