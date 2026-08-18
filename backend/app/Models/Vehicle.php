<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
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
        'inspection_expiry_date',
        'next_maintenance_date',
        'current_mileage',
        'is_active',
        'note',
        'operational_status',
        'photo_path',
        'casco_expiry_date',
        'emission_expiry_date',
        'last_maintenance_mileage',
        'next_maintenance_mileage',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'passenger_capacity' => 'integer',
            'luggage_capacity' => 'integer',
            'current_mileage' => 'integer',
            'last_maintenance_mileage' => 'integer',
            'next_maintenance_mileage' => 'integer',
            'is_active' => 'boolean',

            'insurance_expiry_date' => 'date',
            'inspection_expiry_date' => 'date',
            'next_maintenance_date' => 'date',
            'casco_expiry_date' => 'date',
            'emission_expiry_date' => 'date',
        ];
    }

    /*
     * Aracın sahibi olan tedarikçi.
     *
     * supplier_id boşsa araç SKYFLEET'in
     * kendi filosuna aittir.
     */
    public function supplierCompany(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class,
            'supplier_id'
        );
    }

    /*
     * Araca sürekli olarak bağlı sürücü.
     */
    public function driver(): HasOne
    {
        return $this->hasOne(
            User::class,
            'vehicle_id'
        )->where(
            'role',
            'driver'
        );
    }

    /*
     * Bu araçla görevlendirilen transferler.
     */
    public function assignedTransfers(): HasMany
    {
        return $this->hasMany(
            Transfer::class,
            'assigned_vehicle_id'
        );
    }

    public function isSupplierVehicle(): bool
    {
        return $this->supplier_id !== null;
    }

    public function isSkyfleetVehicle(): bool
    {
        return $this->supplier_id === null;
    }

    public function isOperational(): bool
    {
        return $this->is_active
            && $this->operational_status === 'active';
    }
}