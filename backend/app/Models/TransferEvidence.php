<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferEvidence extends Model
{
    protected $table = 'transfer_evidences';

    protected $fillable = [
        'transfer_id',
        'driver_id',
        'type',
        'file_path',
        'latitude',
        'longitude',
        'accuracy',
        'wait_minutes',
        'call_attempts',
        'passenger_called',
        'whatsapp_attempted',
        'contact_result',
        'note',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'wait_minutes' => 'integer',
            'call_attempts' => 'integer',
            'passenger_called' => 'boolean',
            'whatsapp_attempted' => 'boolean',
            'recorded_at' => 'datetime',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(
            Transfer::class,
            'transfer_id'
        );
    }
}
