<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Transfer extends Model
{
    use HasFactory;

    private const STATUS_TRANSITIONS = [
        'pending' => ['accepted'],
        'accepted' => ['on_the_way'],
        'on_the_way' => ['arrived'],
        'arrived' => ['passenger_called', 'no_show'],
        'passenger_called' => ['passenger_on_board', 'no_show'],
        'passenger_on_board' => ['trip_started'],
        'trip_started' => ['completed'],
        'completed' => [],
        'no_show' => [],
        'cancelled' => [],
    ];

    private const TERMINAL_STATUSES = ['completed', 'no_show', 'cancelled'];

    protected $fillable = [
        'pickup_location_id', 'pickup_point_id', 'dropoff_location_id', 'dropoff_point_id',
        'supplier_id', 'driver_id', 'assigned_vehicle_id',
        'booking_reference', 'ota_booking_reference', 'ota_source', 'supplier',
        'passenger_name', 'passenger_phone', 'passenger_email',
        'flight_number', 'airline', 'terminal',
        'pickup', 'pickup_lat', 'pickup_lng',
        'dropoff', 'dropoff_lat', 'dropoff_lng',
        'pickup_time', 'meet_point',
        'driver_note', 'passenger_note',
        'adult', 'child', 'baby', 'luggage_count',
        'vehicle_type', 'price', 'currency', 'status',
        'cancellation_reason', 'cancelled_at', 'cancelled_by',
        'public_tracking_token', 'public_tracking_enabled_at',
        'public_tracking_expires_at', 'public_tracking_last_viewed_at',
    ];

    protected $hidden = [
        'ota_booking_reference', 'price', 'currency',
        'public_tracking_token', 'public_tracking_enabled_at',
        'public_tracking_expires_at', 'public_tracking_last_viewed_at',
    ];

    protected function casts(): array
    {
        return [
            'pickup_time' => 'datetime',
            'cancelled_at' => 'datetime',
            'public_tracking_enabled_at' => 'datetime',
            'public_tracking_expires_at' => 'datetime',
            'public_tracking_last_viewed_at' => 'datetime',
            'pickup_lat' => 'decimal:7',
            'pickup_lng' => 'decimal:7',
            'dropoff_lat' => 'decimal:7',
            'dropoff_lng' => 'decimal:7',
            'price' => 'decimal:2',
            'adult' => 'integer',
            'child' => 'integer',
            'baby' => 'integer',
            'luggage_count' => 'integer',
        ];
    }

    public function allowedNextStatuses(): array
    {
        return self::STATUS_TRANSITIONS[$this->status] ?? [];
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        return in_array($nextStatus, $this->allowedNextStatuses(), true);
    }

    public function isTerminalStatus(): bool
    {
        return in_array($this->status, self::TERMINAL_STATUSES, true);
    }

    public function enablePublicTracking(): string
    {
        if (!$this->public_tracking_token) {
            do {
                $token = Str::random(64);
            } while (self::query()->where('public_tracking_token', $token)->exists());

            $this->public_tracking_token = $token;
        }

        $this->public_tracking_enabled_at ??= now();
        $this->public_tracking_expires_at = null;
        $this->save();

        return $this->public_tracking_token;
    }

    public function schedulePublicTrackingExpiry(): void
    {
        if (!$this->public_tracking_token) {
            return;
        }

        $this->forceFill([
            'public_tracking_expires_at' => now()->addHours(24),
        ])->save();
    }

    public function publicTrackingIsAvailable(): bool
    {
        if (!$this->public_tracking_token || !$this->public_tracking_enabled_at) {
            return false;
        }

        if ($this->isTerminalStatus() && !$this->public_tracking_expires_at) {
            return $this->updated_at?->copy()->addHours(24)->isFuture() ?? false;
        }

        return !$this->public_tracking_expires_at || $this->public_tracking_expires_at->isFuture();
    }

    public function publicTrackingUrl(): ?string
    {
        if (!$this->public_tracking_token) {
            return null;
        }

        return rtrim(config('passenger_tracking.web_url'), '/') . '/' . $this->public_tracking_token;
    }

    public function supplierCompany(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function assignedVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'assigned_vehicle_id');
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'pickup_location_id');
    }

    public function pickupPoint(): BelongsTo
    {
        return $this->belongsTo(LocationPoint::class, 'pickup_point_id');
    }

    public function dropoffLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'dropoff_location_id');
    }

    public function dropoffPoint(): BelongsTo
    {
        return $this->belongsTo(LocationPoint::class, 'dropoff_point_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(TransferEvent::class)->orderBy('occurred_at');
    }

    public function latestEvent(): HasOne
    {
        return $this->hasOne(TransferEvent::class)->latestOfMany('occurred_at');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(DriverLocation::class)->orderBy('recorded_at');
    }

    public function latestLocation(): HasOne
    {
        return $this->hasOne(DriverLocation::class)->latestOfMany('recorded_at');
    }

    public function flightStatusSnapshots(): HasMany
    {
        return $this->hasMany(FlightStatusSnapshot::class)->orderBy('recorded_at');
    }

    public function latestFlightStatus(): HasOne
    {
        return $this->hasOne(FlightStatusSnapshot::class)->latestOfMany('recorded_at');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(TransferEvidence::class);
    }
}
