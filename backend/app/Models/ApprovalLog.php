<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalLog extends Model
{
    protected $fillable = [
        'approvable_type',
        'approvable_id',

        'old_status',
        'new_status',

        'changed_by',

        'action',
        'reason',
        'note',

        'ip_address',
        'user_agent',

        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'changed_by'
        );
    }
}