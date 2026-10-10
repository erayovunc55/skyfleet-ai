<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PassengerNotificationDelivery extends Model
{
    protected $fillable = [
        'transfer_id',
        'notification_type',
        'channel',
        'status',
        'mode',
        'recipient',
        'provider',
        'provider_message_id',
        'attempt_count',
        'payload',
        'metadata',
        'error_message',
        'attempted_at',
        'sent_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_count' => 'integer',
            'payload' => 'array',
            'metadata' => 'array',
            'attempted_at' => 'datetime',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}