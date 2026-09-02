<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierCoverage extends Model
{
    protected $fillable = [
        'supplier_id','country_id','city_id','location_id','coverage_type','label',
        'service_radius_meters','pickup_enabled','dropoff_enabled','is_active','polygon','metadata',
    ];

    protected function casts(): array
    {
        return [
            'pickup_enabled'=>'boolean','dropoff_enabled'=>'boolean','is_active'=>'boolean',
            'polygon'=>'array','metadata'=>'array',
        ];
    }

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function country(): BelongsTo { return $this->belongsTo(Country::class); }
    public function city(): BelongsTo { return $this->belongsTo(City::class); }
    public function location(): BelongsTo { return $this->belongsTo(Location::class); }
}