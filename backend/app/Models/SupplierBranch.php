<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierBranch extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';

    public const STATUS_UNDER_REVIEW =
        'under_review';

    public const STATUS_REVISION_REQUESTED =
        'revision_requested';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_UNDER_REVIEW,
        self::STATUS_REVISION_REQUESTED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_SUSPENDED,
    ];

    protected $fillable = [
        'supplier_id',

        'name',
        'code',
        'slug',

        'country_code',
        'country_name',
        'city',
        'state_region',
        'postal_code',
        'address',

        'contact_name',
        'email',
        'phone',
        'whatsapp',

        'timezone',
        'default_currency',
        'locale',

        'status',
        'is_head_office',
        'is_active',

        'submitted_at',
        'approved_at',
        'rejected_at',
        'suspended_at',
        'approved_by',

        'rejection_reason',
        'suspension_reason',
        'admin_note',

        'settings',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_head_office' => 'boolean',
            'is_active' => 'boolean',

            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'suspended_at' => 'datetime',

            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'approved_by'
        );
    }

    public function approvalLogs(): MorphMany
    {
        return $this->morphMany(
            ApprovalLog::class,
            'approvable'
        )->latest();
    }

    public function isApproved(): bool
    {
        return $this->status ===
            self::STATUS_APPROVED;
    }

    public function canOperate(): bool
    {
        return $this->isApproved() &&
            $this->is_active &&
            $this->supplier?->canOperate();
    }
}