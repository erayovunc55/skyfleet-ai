<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'iso2',
        'iso3',
        'name',
        'native_name',
        'phone_code',
        'default_currency',
        'default_timezone',
        'default_locale',
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

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    public function airports(): HasMany
    {
        return $this->hasMany(Airport::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }
}