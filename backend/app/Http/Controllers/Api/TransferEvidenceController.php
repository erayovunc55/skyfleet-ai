<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferEvidence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TransferEvidenceController extends Controller
{
    public function index(Request $request, Transfer $transfer): JsonResponse
    {
        $user = $request->user();
        $isDispatcher = $user && in_array($user->role, ['dispatcher', 'admin', 'super_admin'], true);
        $isAssignedDriver = $user
            && $user->role === 'driver'
            && (int) $transfer->driver_id === (int) $user->id;

        if (!$isDispatcher && !$isAssignedDriver) {
            return response()->json([
                'message' => 'Bu transferin kanıtlarını görüntüleme yetkiniz yok.',
            ], 403);
        }

        $items = $transfer->evidences()
            ->with('driver:id,name')
            ->latest('recorded_at')
            ->get()
            ->map(fn (TransferEvidence $evidence) => [
                'id' => $evidence->id,
                'type' => $evidence->type,
                'file_url' => url(Storage::disk('public')->url($evidence->file_path)),
                'latitude' => $evidence->latitude,
                'longitude' => $evidence->longitude,
                'accuracy' => $evidence->accuracy,
                'wait_minutes' => $evidence->wait_minutes,
                'call_attempts' => $evidence->call_attempts,
                'passenger_called' => $evidence->passenger_called,
                'whatsapp_attempted' => $evidence->whatsapp_attempted,
                'contact_result' => $evidence->contact_result,
                'note' => $evidence->note,
                'recorded_at' => $evidence->recorded_at?->toISOString(),
                'driver' => $evidence->driver
                    ? ['id' => $evidence->driver->id, 'name' => $evidence->driver->name]
                    : null,
            ]);

        return response()->json(['data' => $items]);
    }

    public function storeNoShow(Request $request, Transfer $transfer): JsonResponse
    {
        $driver = $request->user();

        if (!$driver || $driver->role !== 'driver') {
            return response()->json(['message' => 'Bu işlem yalnızca sürücüler tarafından yapılabilir.'], 403);
        }

        if ((int) $transfer->driver_id !== (int) $driver->id) {
            return response()->json(['message' => 'Bu transfer için kanıt yükleme yetkiniz yok.'], 403);
        }

        if (!in_array($transfer->status, ['arrived', 'passenger_called'], true)) {
            return response()->json([
                'message' => 'No Show kanıtı yalnızca alış noktasında veya yolcu arandı aşamasında yüklenebilir.',
            ], 422);
        }

        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'wait_minutes' => ['required', 'integer', 'min:1', 'max:180'],
            'call_attempts' => ['nullable', 'integer', 'min:0', 'max:20'],
            'passenger_called' => ['nullable', 'boolean'],
            'whatsapp_attempted' => ['nullable', 'boolean'],
            'contact_result' => [
                'required',
                'string',
                'in:unreachable,phone_off,wrong_number,answered_needs_time,other',
            ],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $callAttempts = $transfer->events()
            ->where('event_type', 'passenger_call_attempted')
            ->count();

        $whatsappAttempted = $transfer->events()
            ->where('event_type', 'passenger_whatsapp_opened')
            ->exists();

        if ($callAttempts < 1) {
            return response()->json([
                'message' => 'No Show kaydı için sistemde en az bir yolcu arama denemesi bulunmalıdır.',
            ], 422);
        }

        $path = $request->file('photo')->store(
            "transfer-evidences/{$transfer->id}",
            'public'
        );

        try {
            $evidence = DB::transaction(function () use ($transfer, $driver, $validated, $path, $callAttempts, $whatsappAttempted) {
                $evidence = TransferEvidence::create([
                    'transfer_id' => $transfer->id,
                    'driver_id' => $driver->id,
                    'type' => 'no_show_photo',
                    'file_path' => $path,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'accuracy' => $validated['accuracy'] ?? null,
                    'wait_minutes' => $validated['wait_minutes'],
                    'call_attempts' => $callAttempts,
                    'passenger_called' => true,
                    'whatsapp_attempted' => $whatsappAttempted,
                    'contact_result' => $validated['contact_result'],
                    'note' => $validated['note'] ?? null,
                    'recorded_at' => now(),
                ]);

                $transfer->events()->create([
                    'driver_id' => $driver->id,
                    'event_type' => 'no_show_evidence_uploaded',
                    'status' => $transfer->status,
                    'occurred_at' => now(),
                    'timezone' => config('app.timezone', 'UTC'),
                    'note' => 'Sürücü No Show kanıtı yükledi.',
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'metadata' => [
                        'evidence_id' => $evidence->id,
                        'file_path' => $path,
                        'accuracy' => $validated['accuracy'] ?? null,
                        'wait_minutes' => $validated['wait_minutes'],
                        'call_attempts' => $callAttempts,
                        'passenger_called' => true,
                        'whatsapp_attempted' => $whatsappAttempted,
                        'contact_result' => $validated['contact_result'],
                    ],
                ]);

                return $evidence;
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }

        return response()->json([
            'message' => 'No Show kanıtı başarıyla kaydedildi.',
            'data' => [
                'id' => $evidence->id,
                'type' => $evidence->type,
                'file_url' => url(Storage::disk('public')->url($evidence->file_path)),
                'latitude' => $evidence->latitude,
                'longitude' => $evidence->longitude,
                'accuracy' => $evidence->accuracy,
                'wait_minutes' => $evidence->wait_minutes,
                'call_attempts' => $evidence->call_attempts,
                'passenger_called' => $evidence->passenger_called,
                'whatsapp_attempted' => $evidence->whatsapp_attempted,
                'contact_result' => $evidence->contact_result,
                'note' => $evidence->note,
                'recorded_at' => $evidence->recorded_at?->toISOString(),
            ],
        ], 201);
    }
}
