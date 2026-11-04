<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeytripOrder extends Model
{
    protected $fillable = [
        'transfer_id', 'partner_order_number', 'heytrip_order_number', 'status',
        'currency', 'provider_total', 'markup_percent', 'customer_total',
        'cancel_loss_fee', 'quote_payload', 'booking_payload',
        'last_detail_payload', 'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'provider_total' => 'decimal:2',
            'markup_percent' => 'decimal:2',
            'customer_total' => 'decimal:2',
            'cancel_loss_fee' => 'decimal:2',
            'quote_payload' => 'array',
            'booking_payload' => 'array',
            'last_detail_payload' => 'array',
            'last_synced_at' => 'datetime',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}
