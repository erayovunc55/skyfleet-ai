<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferRequest extends Model
{
    public const STATUS_NEW = 'new';

    protected $fillable = [
        'request_reference',
        'status',
        'handled_by_user_id',
        'handled_at',
        'transfer_id',
        'converted_by_user_id',
        'converted_at',
        'pickup',
        'pickup_place_id',
        'pickup_lat',
        'pickup_lng',
        'dropoff',
        'dropoff_place_id',
        'dropoff_lat',
        'dropoff_lng',
        'pickup_date',
        'pickup_time',
        'timezone',
        'flight_number',
        'passengers',
        'luggage_count',
        'vehicle_type',
        'passenger_name',
        'passenger_phone',
        'passenger_email',
        'note',
        'locale',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'handled_at' => 'datetime',
            'converted_at' => 'datetime',
            'passengers' => 'integer',
            'luggage_count' => 'integer',
            'pickup_lat' => 'decimal:7',
            'pickup_lng' => 'decimal:7',
            'dropoff_lat' => 'decimal:7',
            'dropoff_lng' => 'decimal:7',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }
}
