<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'location_type_id',
        'country_id',
        'city_id',
        'airport_id',

        'name',
        'native_name',
        'slug',
        'code',
        'description',

        'state_region',
        'district',
        'postal_code',
        'address',

        'latitude',
        'longitude',
        'geofence_radius_meters',
        'timezone',

        'google_place_id',
        'external_reference',

        'is_public',
        'is_active',
        'sort_order',

        'settings',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',

            'geofence_radius_meters' => 'integer',

            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',

            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(
            LocationType::class,
            'location_type_id'
        );
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(
            Country::class
        );
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(
            City::class
        );
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(
            Airport::class
        );
    }

    public function points(): HasMany
    {
        return $this->hasMany(
            LocationPoint::class
        );
    }

    public function isAirport(): bool
    {
        return $this->type?->code ===
            LocationType::AIRPORT;
    }

    public function hasCoordinates(): bool
    {
        return $this->latitude !== null &&
            $this->longitude !== null;
    }
}