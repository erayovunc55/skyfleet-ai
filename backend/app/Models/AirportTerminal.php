<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AirportTerminal extends Model
{
    use HasFactory;

    protected $fillable = [
        'airport_id',
        'name',
        'code',
        'type',
        'is_active',
        'sort_order',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(Airport::class);
    }

    public function locationPoints(): HasMany
    {
        return $this->hasMany(
            LocationPoint::class,
            'airport_terminal_id'
        );
    }
}