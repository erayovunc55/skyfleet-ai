<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransferEventController extends Controller
{
    public function store(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $driver = $request->user();

        if ($transfer->driver_id !== $driver->id) {
            return response()->json([
                'message' => 'Bu transfer için işlem yapma yetkiniz yok.',
            ], 403);
        }

        $validated = $request->validate([
            'event_type' => [
                'required',
                'string',
                Rule::in([
                    'accepted',
                    'on_the_way',
                    'arrived',
                    'passenger_called',
                    'passenger_on_board',
                    'trip_started',
                    'completed',
                    'no_show',
                ]),
            ],
            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],
            'accuracy' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $event = DB::transaction(function () use (
            $validated,
            $transfer,
            $driver
        ) {
            $transfer->update([
                'status' => $validated['event_type'],
            ]);

            return TransferEvent::create([
                'transfer_id' => $transfer->id,
                'driver_id' => $driver->id,
                'event_type' => $validated['event_type'],
                'status' => $validated['event_type'],
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'accuracy' => $validated['accuracy'] ?? null,
                'occurred_at' => now(),
                'timezone' => config('app.timezone', 'UTC'),
                'note' => $validated['note'] ?? null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Transfer olayı kaydedildi.',
            'data' => [
                'transfer' => $transfer->fresh(),
                'event' => $event,
            ],
        ], 201);
    }
}