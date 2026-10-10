<?php

namespace App\Services;

use App\Models\Transfer;
use Illuminate\Support\Facades\DB;

class HeytripEmailImportService
{
    public function __construct(private readonly HeytripEmailParser $parser)
    {
    }

    public function import(string $subject, string $body): Transfer
    {
        $payload = $this->parser->parse($subject, $body);

        return DB::transaction(function () use ($payload): Transfer {
            $transfer = Transfer::query()->firstOrNew([
                'ota_booking_reference' => $payload['ota_booking_reference'],
            ]);

            if (! $transfer->exists) {
                $payload['supplier'] = 'HeyTrip';
                $transfer->fill($payload);
                $transfer->save();
                return $transfer->fresh();
            }

            $transfer->fill($payload);
            $transfer->save();
            return $transfer->fresh();
        });
    }
}
