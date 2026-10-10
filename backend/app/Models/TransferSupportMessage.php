<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferSupportMessage extends Model
{
    protected $fillable = [
        'transfer_id',
        'sender_type',
        'sender_user_id',
        'message',
        'original_language',
        'translated_message',
        'translated_language',
        'category',
        'priority',
        'is_read',
        'read_at',
        'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(
            Transfer::class,
            'transfer_id'
        );
    }

    public function senderUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'sender_user_id'
        );
    }

    public function isPassengerMessage(): bool
    {
        return $this->sender_type === 'passenger';
    }

    public function isOperationMessage(): bool
    {
        return $this->sender_type === 'operation';
    }

    public function isUrgent(): bool
    {
        return in_array(
            $this->priority,
            [
                'urgent',
                'critical',
            ],
            true
        );
    }
}