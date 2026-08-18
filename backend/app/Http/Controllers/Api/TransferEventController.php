<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransferEventController extends Controller
{
    private const CONTACT_EVENTS = ['passenger_call_attempted','passenger_whatsapp_opened'];

    public function store(Request $request, Transfer $transfer): JsonResponse
    {
        $driver = $request->user();
        if (!$driver || $driver->role !== 'driver' || (int) $transfer->driver_id !== (int) $driver->id) {
            return response()->json(['message' => 'Bu transfer için işlem yapma yetkiniz yok.'], 403);
        }

        $validated = $request->validate([
            'event_type' => ['required','string',Rule::in(self::CONTACT_EVENTS)],
            'latitude' => ['nullable','numeric','between:-90,90'],
            'longitude' => ['nullable','numeric','between:-180,180'],
            'accuracy' => ['nullable','numeric','min:0'],
            'note' => ['nullable','string','max:2000'],
        ]);

        $duplicate = $transfer->events()
            ->where('driver_id', $driver->id)
            ->where('event_type', $validated['event_type'])
            ->where('occurred_at', '>=', now()->subSeconds(3))
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'Bu iletişim işlemi az önce kaydedildi.'], 409);
        }

        $event = TransferEvent::create([
                'transfer_id' => $transfer->id,
                'driver_id' => $driver->id,
                'event_type' => $validated['event_type'],
                'status' => $transfer->status,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'accuracy' => $validated['accuracy'] ?? null,
                'occurred_at' => now(),
                'timezone' => config('app.timezone', 'UTC'),
                'note' => $validated['note'] ?? null,
                'metadata' => ['contact_channel' => $validated['event_type'] === 'passenger_call_attempted' ? 'phone' : 'whatsapp'],
            ]);

        $safeTransfer = $transfer->fresh();
        $safeTransfer->makeHidden([
            'ota_source', 'supplier', 'supplier_id',
            'supplier_company', 'price', 'currency',
            'ota_booking_reference',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'İletişim işlemi kaydedildi.',
            'data' => ['transfer' => $safeTransfer, 'event' => $event->load('driver')],
        ], 201);
    }
}
