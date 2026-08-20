<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlightStatusSnapshot extends Model
{
    protected $fillable = [
        'transfer_id',
        'provider',
        'flight_number',
        'status',
        'airline_name',
        'departure_airport',
        'departure_iata',
        'arrival_airport',
        'arrival_iata',
        'arrival_terminal',
        'arrival_gate',
        'scheduled_arrival_at',
        'estimated_arrival_at',
        'actual_arrival_at',
        'delay_minutes',
        'raw_payload',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_arrival_at' => 'datetime',
            'estimated_arrival_at' => 'datetime',
            'actual_arrival_at' => 'datetime',
            'delay_minutes' => 'integer',
            'raw_payload' => 'array',
            'recorded_at' => 'datetime',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}
