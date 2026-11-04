<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferRequest extends Model
{
    public const STATUS_NEW = 'new';

    public const PAYMENT_STATUS_NOT_REQUIRED = 'not_required';

    public const PAYMENT_STATUS_PENDING = 'pending';

    public const PAYMENT_STATUS_PAID = 'paid';

    public const PAYMENT_STATUS_FAILED = 'failed';

    protected $fillable = [
        'request_reference',
        'request_type',
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
        'pricing_snapshot',
        'payment_status',
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'paid_amount',
        'paid_currency',
        'paid_at',
        'tour_code',
        'tour_title',
        'tour_adults',
        'tour_children',
        'tour_infants',
        'tour_price_total',
        'tour_currency',
    ];

    protected function casts(): array
    {
        return [
            'pricing_snapshot' => 'array',
            'pickup_date' => 'date',
            'handled_at' => 'datetime',
            'converted_at' => 'datetime',
            'passengers' => 'integer',
            'luggage_count' => 'integer',
            'tour_adults' => 'integer',
            'tour_children' => 'integer',
            'tour_infants' => 'integer',
            'tour_price_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'paid_at' => 'datetime',
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
