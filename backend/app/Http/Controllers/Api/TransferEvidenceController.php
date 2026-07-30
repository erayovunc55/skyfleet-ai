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
    public function storeNoShow(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $driver = $request->user();

        if (!$driver || $driver->role !== 'driver') {
            return response()->json([
                'message' =>
                    'Bu işlem yalnızca sürücüler tarafından yapılabilir.',
            ], 403);
        }

        if ($transfer->driver_id !== $driver->id) {
            return response()->json([
                'message' =>
                    'Bu transfer için kanıt yükleme yetkiniz yok.',
            ], 403);
        }

        if (
            !in_array(
                $transfer->status,
                [
                    'arrived',
                    'passenger_called',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'No Show kanıtı yalnızca alış noktasında veya yolcu arandı aşamasında yüklenebilir.',
            ], 422);
        }

        $validated = $request->validate([
            'photo' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'required',
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

        $path = $request
            ->file('photo')
            ->store(
                "transfer-evidences/{$transfer->id}",
                'public'
            );

        $evidence = DB::transaction(
            function () use (
                $transfer,
                $driver,
                $validated,
                $path
            ) {
                $evidence =
                    TransferEvidence::create([
                        'transfer_id' =>
                            $transfer->id,
                        'driver_id' =>
                            $driver->id,
                        'type' =>
                            'no_show_photo',
                        'file_path' =>
                            $path,
                        'latitude' =>
                            $validated['latitude'],
                        'longitude' =>
                            $validated['longitude'],
                        'accuracy' =>
                            $validated['accuracy'] ?? null,
                        'note' =>
                            $validated['note'] ?? null,
                        'recorded_at' =>
                            now(),
                    ]);

                $transfer->events()->create([
                    'driver_id' =>
                        $driver->id,
                    'event_type' =>
                        'no_show_evidence_uploaded',
                    'status' =>
                        $transfer->status,
                    'occurred_at' =>
                        now(),
                    'timezone' =>
                        config(
                            'app.timezone',
                            'UTC'
                        ),
                    'note' =>
                        'Sürücü No Show fotoğraf kanıtı yükledi.',
                    'latitude' =>
                        $validated['latitude'],
                    'longitude' =>
                        $validated['longitude'],
                    'metadata' => [
                        'evidence_id' =>
                            $evidence->id,
                        'file_path' =>
                            $path,
                        'accuracy' =>
                            $validated['accuracy'] ?? null,
                    ],
                ]);

                return $evidence;
            }
        );

        return response()->json([
            'message' =>
                'No Show kanıtı başarıyla kaydedildi.',
            'data' => [
                'id' =>
                    $evidence->id,
                'type' =>
                    $evidence->type,
                'file_url' =>
                    Storage::disk('public')
                        ->url(
                            $evidence->file_path
                        ),
                'latitude' =>
                    $evidence->latitude,
                'longitude' =>
                    $evidence->longitude,
                'accuracy' =>
                    $evidence->accuracy,
                'note' =>
                    $evidence->note,
                'recorded_at' =>
                    $evidence
                        ->recorded_at
                        ?->toISOString(),
            ],
        ], 201);
    }
}
