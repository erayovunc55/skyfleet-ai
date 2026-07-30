<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Airport extends Model
{
    use HasFactory;

    protected $fillable = [

        'country_id',
        'city_id',

        'name',

        'iata_code',
        'icao_code',

        'timezone',

        'latitude',
        'longitude',

        'is_active',
        'sort_order',

        'metadata'

    ];

    protected function casts(): array
    {
        return [

            'latitude'=>'decimal:7',
            'longitude'=>'decimal:7',

            'is_active'=>'boolean',

            'metadata'=>'array'

        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
    public function location(): HasOne
{
    return $this->hasOne(Location::class);
}

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function terminals(): HasMany
    {
        return $this->hasMany
        (AirportTerminal::class
        );
    }

    public function meetingPoints(): HasMany
    {
        return $this->hasMany(MeetingPoint::class);
    }

}
