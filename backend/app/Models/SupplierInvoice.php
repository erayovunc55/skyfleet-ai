<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SupplierInvoice extends Model
{
    use HasFactory;

    public const STATUS_SUBMITTED =
        'submitted';

    public const STATUS_APPROVED =
        'approved';

    public const STATUS_REVISION_REQUESTED =
        'revision_requested';

    public const STATUS_REJECTED =
        'rejected';

    public const STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_REVISION_REQUESTED,
        self::STATUS_REJECTED,
    ];

    protected $fillable = [
        'supplier_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'amount',
        'currency',
        'status',
        'file_disk',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'submitted_by',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'note',
    ];

    /*
     * Fiziksel dosya yolu API cevaplarında
     * hiçbir zaman doğrudan gösterilmez.
     */
    protected $hidden = [
        'file_disk',
        'file_path',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' =>
                'date',

            'due_date' =>
                'date',

            'amount' =>
                'decimal:2',

            'file_size' =>
                'integer',

            'reviewed_at' =>
                'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'submitted_by'
        );
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reviewed_by'
        );
    }

    public function financials(): BelongsToMany
    {
        return $this->belongsToMany(
            TransferFinancial::class,
            'supplier_invoice_financial',
            'supplier_invoice_id',
            'transfer_financial_id'
        )->withTimestamps();
    }

    public function isSubmitted(): bool
    {
        return $this->status ===
            self::STATUS_SUBMITTED;
    }

    public function isApproved(): bool
    {
        return $this->status ===
            self::STATUS_APPROVED;
    }

    public function isRevisionRequested(): bool
    {
        return $this->status ===
            self::STATUS_REVISION_REQUESTED;
    }

    public function isRejected(): bool
    {
        return $this->status ===
            self::STATUS_REJECTED;
    }

    public function canBeReviewed(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_SUBMITTED,
                self::STATUS_REVISION_REQUESTED,
            ],
            true
        );
    }

    public function canBeReplaced(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_REVISION_REQUESTED,
                self::STATUS_REJECTED,
            ],
            true
        );
    }
}