<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverPushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverPushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role !== 'driver') {
            return response()->json(['message' => 'Bu işlem yalnızca sürücüler içindir.'], 403);
        }

        $validated = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
            'platform' => ['nullable', 'string', 'in:web,android,ios'],
        ]);

        $token = DriverPushToken::updateOrCreate(
            ['token_hash' => hash('sha256', $validated['token'])],
            [
                'user_id' => $user->id,
                'token' => $validated['token'],
                'platform' => $validated['platform'] ?? 'web',
                'last_seen_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Bildirim cihazı kaydedildi.',
            'data' => ['id' => $token->id, 'platform' => $token->platform],
        ]);
    }
}
