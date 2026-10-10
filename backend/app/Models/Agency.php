<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agency extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'legal_name',
        'email',
        'phone',
        'website',
        'country_code',
        'country_name',
        'city',
        'tax_number',
        'registration_number',
        'default_currency',
        'discount_percent',
        'is_active',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'discount_percent' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(
            User::class,
            'agency_id'
        );
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(
            Transfer::class,
            'agency_id'
        );
    }

    public function isActive(): bool
    {
        return $this->is_active
            && $this->status === 'active';
    }
}
