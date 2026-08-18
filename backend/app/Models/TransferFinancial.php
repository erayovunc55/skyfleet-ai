<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferFinancial extends Model
{
    use HasFactory;

    public const STATUS_PENDING =
        'pending';

    public const STATUS_APPROVED =
        'approved';

    public const STATUS_PAID =
        'paid';

    public const STATUS_DISPUTED =
        'disputed';

    public const STATUS_CANCELLED =
        'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_PAID,
        self::STATUS_DISPUTED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'transfer_id',
        'supplier_id',
        'gross_amount',
        'supplier_percentage',
        'supplier_payable',
        'platform_margin',
        'currency',
        'status',
        'calculation_source',
        'due_at',
        'approved_at',
        'approved_by',
        'paid_at',
        'paid_by',
        'payment_reference',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' =>
                'decimal:2',

            'supplier_percentage' =>
                'decimal:2',

            'supplier_payable' =>
                'decimal:2',

            'platform_margin' =>
                'decimal:2',

            'due_at' =>
                'datetime',

            'approved_at' =>
                'datetime',

            'paid_at' =>
                'datetime',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(
            Transfer::class
        );
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'approved_by'
        );
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'paid_by'
        );
    }

    public function isPending(): bool
    {
        return $this->status ===
            self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status ===
            self::STATUS_APPROVED;
    }

    public function isPaid(): bool
    {
        return $this->status ===
            self::STATUS_PAID;
    }

    public function isDisputed(): bool
    {
        return $this->status ===
            self::STATUS_DISPUTED;
    }

    public function isCancelled(): bool
    {
        return $this->status ===
            self::STATUS_CANCELLED;
    }
}