<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_REVISION_REQUESTED = 'revision_requested';
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
        'company_name','legal_name','slug','tax_number','registration_number','contact_name','email','phone','whatsapp','website','country_code','country_name','city','state_region','address','postal_code','status','submitted_at','approved_at','rejected_at','suspended_at','approved_by','rejection_reason','suspension_reason','admin_note','timezone','default_currency','payout_percentage','locale','is_active','metadata',
    ];

    protected $hidden = ['payout_percentage','admin_note'];

    protected function casts(): array
    {
        return [
            'submitted_at'=>'datetime','approved_at'=>'datetime','rejected_at'=>'datetime','suspended_at'=>'datetime','payout_percentage'=>'decimal:2','is_active'=>'boolean','metadata'=>'array',
        ];
    }

    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function users(): HasMany { return $this->hasMany(User::class, 'supplier_id'); }
    public function vehicles(): HasMany { return $this->hasMany(Vehicle::class, 'supplier_id'); }
    public function transfers(): HasMany { return $this->hasMany(Transfer::class, 'supplier_id'); }
    public function branches(): HasMany { return $this->hasMany(SupplierBranch::class); }
    public function documents(): HasMany { return $this->hasMany(SupplierDocument::class); }
    public function coverages(): HasMany { return $this->hasMany(SupplierCoverage::class); }
    public function approvalLogs(): MorphMany { return $this->morphMany(ApprovalLog::class, 'approvable')->latest(); }

    public function isApproved(): bool { return $this->status === self::STATUS_APPROVED; }

    public function isPendingApproval(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING,self::STATUS_UNDER_REVIEW,self::STATUS_REVISION_REQUESTED], true);
    }

    public function canOperate(): bool { return $this->isApproved() && $this->is_active; }

    public function calculatePayableAmount(int|float|string|null $price): float
    {
        $amount = is_numeric($price) ? (float) $price : 0.0;
        $percentage = is_numeric($this->payout_percentage) ? (float) $this->payout_percentage : 90.0;
        return round($amount * $percentage / 100, 2);
    }
}