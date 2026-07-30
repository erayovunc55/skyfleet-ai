<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LocationPoint extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const TYPE_MEETING_POINT = 'meeting_point';
    public const TYPE_PICKUP_POINT = 'pickup_point';
    public const TYPE_DROPOFF_POINT = 'dropoff_point';
    public const TYPE_ENTRANCE = 'entrance';
    public const TYPE_EXIT = 'exit';
    public const TYPE_GATE = 'gate';
    public const TYPE_LOBBY = 'lobby';
    public const TYPE_RECEPTION = 'reception';
    public const TYPE_PARKING = 'parking';
    public const TYPE_PLATFORM = 'platform';
    public const TYPE_DOCK = 'dock';
    public const TYPE_CUSTOM = 'custom';

    public const TYPES = [
        self::TYPE_MEETING_POINT,
        self::TYPE_PICKUP_POINT,
        self::TYPE_DROPOFF_POINT,
        self::TYPE_ENTRANCE,
        self::TYPE_EXIT,
        self::TYPE_GATE,
        self::TYPE_LOBBY,
        self::TYPE_RECEPTION,
        self::TYPE_PARKING,
        self::TYPE_PLATFORM,
        self::TYPE_DOCK,
        self::TYPE_CUSTOM,
    ];

    protected $fillable = [
        'location_id',
        'airport_terminal_id',

        'name',
        'code',
        'point_type',

        'description',
        'instructions',

        'latitude',
        'longitude',
        'geofence_radius_meters',

        'is_pickup_allowed',
        'is_dropoff_allowed',
        'requires_meet_and_greet',

        'is_public',
        'is_active',
        'sort_order',

        'external_reference',

        'settings',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',

            'geofence_radius_meters' => 'integer',

            'is_pickup_allowed' => 'boolean',
            'is_dropoff_allowed' => 'boolean',
            'requires_meet_and_greet' => 'boolean',

            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',

            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function airportTerminal(): BelongsTo
    {
        return $this->belongsTo(
            AirportTerminal::class
        );
    }

    public function hasCoordinates(): bool
    {
        return $this->latitude !== null &&
            $this->longitude !== null;
    }

    public function canBeUsedForPickup(): bool
    {
        return $this->is_active &&
            $this->is_pickup_allowed;
    }

    public function canBeUsedForDropoff(): bool
    {
        return $this->is_active &&
            $this->is_dropoff_allowed;
    }
}