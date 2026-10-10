<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'supplier_id',
        'agency_id',
        'vehicle_id',
        'name',
        'phone',
        'email',
        'password',
        'role',
        'is_active',
        'permissions',
        'vehicle_plate',
        'supplier',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'permissions' => 'array',
        ];
    }

    public function supplierCompany(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class,
            'supplier_id'
        );
    }

    public function agencyCompany(): BelongsTo
    {
        return $this->belongsTo(
            Agency::class,
            'agency_id'
        );
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(
            Vehicle::class,
            'vehicle_id'
        );
    }

    public function assignedTransfers(): HasMany
    {
        return $this->hasMany(
            Transfer::class,
            'driver_id'
        );
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(
            DriverPushToken::class
        );
    }

    public function isSupplierUser(): bool
    {
        return $this->role === 'supplier'
            && $this->supplier_id !== null;
    }

    public function isSupplierDriver(): bool
    {
        return $this->role === 'driver'
            && $this->supplier_id !== null;
    }

    public function isSkyfleetDriver(): bool
    {
        return $this->role === 'driver'
            && $this->supplier_id === null;
    }

    public function isAgencyUser(): bool
    {
        return $this->role === 'agency'
            && $this->agency_id !== null;
    }

    public function isPanelUser(): bool
    {
        return in_array(
            $this->role,
            [
                'dispatcher',
                'admin',
                'super_admin',
            ],
            true
        );
    }

    public function canManageSupplierOperations(): bool
    {
        return $this->isSupplierUser()
            || $this->isPanelUser();
    }

    public function canManageAgencyOperations(): bool
    {
        return $this->isAgencyUser()
            || $this->isPanelUser();
    }
}