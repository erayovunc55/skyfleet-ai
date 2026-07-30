<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LocationType extends Model
{
    use HasFactory;

    public const AIRPORT = 'airport';
    public const HOTEL = 'hotel';
    public const PORT = 'port';
    public const TRAIN_STATION = 'train_station';
    public const BUS_TERMINAL = 'bus_terminal';
    public const OFFICE = 'office';
    public const EVENT_VENUE = 'event_venue';
    public const HOSPITAL = 'hospital';
    public const SHOPPING_MALL = 'shopping_mall';
    public const PRIVATE_ADDRESS = 'private_address';
    public const CUSTOM = 'custom';

    public const CODES = [
        self::AIRPORT,
        self::HOTEL,
        self::PORT,
        self::TRAIN_STATION,
        self::BUS_TERMINAL,
        self::OFFICE,
        self::EVENT_VENUE,
        self::HOSPITAL,
        self::SHOPPING_MALL,
        self::PRIVATE_ADDRESS,
        self::CUSTOM,
    ];

    protected $fillable = [
        'code',
        'name',
        'icon',
        'description',

        'supports_terminals',
        'supports_scheduled_arrivals',

        'is_public',
        'is_active',
        'sort_order',

        'settings',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'supports_terminals' => 'boolean',

            'supports_scheduled_arrivals' =>
                'boolean',

            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',

            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    public function locations(): HasMany
    {
        return $this->hasMany(
            Location::class
        );
    }
}
