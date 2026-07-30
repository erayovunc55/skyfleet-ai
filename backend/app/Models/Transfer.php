<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'pickup_location_id',
        'pickup_point_id',
        'dropoff_location_id',
        'dropoff_point_id',
        'driver_id',
        'booking_reference',
        'ota_source',
        'supplier',
        'passenger_name',
        'passenger_phone',
        'passenger_email',
        'flight_number',
        'airline',
        'terminal',
        'pickup',
        'pickup_lat',
        'pickup_lng',
        'dropoff',
        'dropoff_lat',
        'dropoff_lng',
        'pickup_time',
        'meet_point',
        'driver_note',
        'passenger_note',
        'adult',
        'child',
        'baby',
        'luggage_count',
        'vehicle_type',
        'price',
        'currency',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'pickup_time' => 'datetime',
            'pickup_lat' => 'decimal:7',
            'pickup_lng' => 'decimal:7',
            'dropoff_lat' => 'decimal:7',
            'dropoff_lng' => 'decimal:7',
            'price' => 'decimal:2',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'driver_id'
        );
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(
            Location::class,
            'pickup_location_id'
        );
    }

    public function pickupPoint(): BelongsTo
    {
        return $this->belongsTo(
            LocationPoint::class,
            'pickup_point_id'
        );
    }

    public function dropoffLocation(): BelongsTo
    {
        return $this->belongsTo(
            Location::class,
            'dropoff_location_id'
        );
    }

    public function dropoffPoint(): BelongsTo
    {
        return $this->belongsTo(
            LocationPoint::class,
            'dropoff_point_id'
        );
    }

    public function events(): HasMany
    {
        return $this->hasMany(
            TransferEvent::class
        )->orderBy('occurred_at');
    }

    public function latestEvent(): HasOne
    {
        return $this->hasOne(
            TransferEvent::class
        )->latestOfMany('occurred_at');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(
            DriverLocation::class
        )->orderBy('recorded_at');
    }

    public function latestLocation(): HasOne
    {
        return $this->hasOne(
            DriverLocation::class
        )->latestOfMany('recorded_at');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(
            TransferEvidence::class
        );
    }
}