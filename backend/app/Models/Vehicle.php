<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'plate',
        'brand',
        'model',
        'year',
        'vehicle_type',
        'color',

        'passenger_capacity',
        'luggage_capacity',

        'vin',
        'registration_number',

        'insurance_expiry_date',

        'current_mileage',

        'operational_status',
        'photo_path',

        'is_active',
        'note',
    ];

    protected $appends = [
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',

            'passenger_capacity' => 'integer',
            'luggage_capacity' => 'integer',

            'current_mileage' => 'integer',

            'insurance_expiry_date' => 'date',

            'is_active' => 'boolean',
        ];
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(
            User::class,
            'vehicle_id'
        );
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo_path) {
            return null;
        }

        return asset(
            'storage/' . $this->photo_path
        );
    }
}