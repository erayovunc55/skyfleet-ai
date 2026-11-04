<?php

namespace App\Services;

use App\Models\Transfer;
use App\Models\TransferEvent;
use Illuminate\Support\Facades\DB;

class HeytripEmailImportService
{
    public function __construct(private readonly HeytripEmailParser $parser)
    {
    }

    public function import(string $subject, string $body): Transfer
    {
        $payload = $this->parser->parse($subject, $body);
        $type = $payload['type'];
        unset($payload['type']);

        return DB::transaction(function () use ($payload, $type): Transfer {
            $transfer = Transfer::query()
                ->where('ota_booking_reference', $payload['ota_booking_reference'])
                ->lockForUpdate()
                ->first();

            if (! $transfer) {
                $payload['supplier'] = 'HeyTrip';
                $payload['status'] = $type === 'cancelled' ? 'cancelled' : 'pending';

                if ($type === 'cancelled') {
                    $payload['cancelled_at'] = now();
                    $payload['cancellation_reason'] = 'Cancelled by HeyTrip';
                }

                $transfer = Transfer::create($payload);
                $this->event($transfer, $type === 'cancelled' ? 'ota_cancelled' : 'ota_created', 'HeyTrip e-posta ile alındı.');

                return $transfer->fresh();
            }

            if ($type === 'cancelled') {
                if (! $transfer->isTerminalStatus()) {
                    $transfer->forceFill([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                        'cancellation_reason' => 'Cancelled by HeyTrip',
                    ])->save();
                    $this->event($transfer, 'ota_cancelled', 'HeyTrip rezervasyonu iptal etti.');
                }

                return $transfer->fresh();
            }

            if ($transfer->isTerminalStatus()) {
                return $transfer->fresh();
            }

            $changes = collect($payload)
                ->except(['ota_source', 'booking_reference', 'ota_booking_reference'])
                ->filter(fn ($value) => $value !== null && $value !== '')
                ->all();

            $transfer->fill($changes);

            if ($type === 'update' && $transfer->isDirty()) {
                $changed = implode(', ', array_keys($transfer->getDirty()));
                $transfer->save();
                $this->event($transfer, 'ota_updated', 'HeyTrip rezervasyonu güncelledi: '.$changed);
            } else {
                $transfer->save();
            }

            return $transfer->fresh();
        });
    }

    private function event(Transfer $transfer, string $type, string $note): void
    {
        TransferEvent::create([
            'transfer_id' => $transfer->id,
            'event_type' => $type,
            'status' => $transfer->status,
            'occurred_at' => now(),
            'note' => $note,
        ]);
    }
}