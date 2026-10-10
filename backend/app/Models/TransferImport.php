<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferImport extends Model
{
    public const STATUS_QUEUED = 'queued';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'source',
        'original_filename',
        'file_path',
        'status',
        'total',
        'processed',
        'imported',
        'skipped',
        'failed',
        'errors',
        'failure_message',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'integer',
            'processed' => 'integer',
            'imported' => 'integer',
            'skipped' => 'integer',
            'failed' => 'integer',

            'errors' => 'array',

            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class
        );
    }

    public function isFinished(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_COMPLETED,
                self::STATUS_FAILED,
            ],
            true
        );
    }

    public function progressPercentage(): int
    {
        if ($this->total <= 0) {
            return 0;
        }

        return (int) min(
            100,
            round(
                (
                    $this->processed /
                    $this->total
                ) * 100
            )
        );
    }
}