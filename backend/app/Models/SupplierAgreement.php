<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierAgreement extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_VIEWED = 'viewed';
    public const STATUS_SIGNED = 'signed';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_EXPIRED = 'expired';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_SENT,
        self::STATUS_VIEWED,
        self::STATUS_SIGNED,
        self::STATUS_REJECTED,
        self::STATUS_EXPIRED,
    ];

    protected $fillable = [
        'supplier_id',
        'supplier_document_id',
        'status',
        'version',
        'public_token',
        'sent_at',
        'viewed_at',
        'accepted_at',
        'signed_at',
        'rejected_at',
        'expires_at',
        'signer_name',
        'signer_email',
        'accepted_ip',
        'accepted_user_agent',
        'acceptance_hash',
        'rejection_reason',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'viewed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'signed_at' => 'datetime',
            'rejected_at' => 'datetime',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(
            SupplierDocument::class,
            'supplier_document_id'
        );
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    public function isSigned(): bool
    {
        return $this->status === self::STATUS_SIGNED
            && $this->signed_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null
            && $this->expires_at->isPast()
            && !$this->isSigned();
    }
}
