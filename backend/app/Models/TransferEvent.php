<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferEvent extends Model
{
    protected $fillable = [
        'transfer_id',
        'driver_id',
        'event_type',
        'status',
        'latitude',
        'longitude',
        'accuracy',
        'photo_path',
        'call_log_reference',
        'timezone',
        'occurred_at',
        'note',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'accuracy' => 'decimal:2',
            'occurred_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
