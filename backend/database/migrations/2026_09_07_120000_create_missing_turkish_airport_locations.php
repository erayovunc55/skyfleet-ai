<?php

use App\Models\Airport;
use App\Models\City;
use App\Models\Location;
use App\Models\LocationType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $airportTypeId = LocationType::query()->where('code', 'airport')->value('id');
        $istanbul = City::query()->where('name', 'İstanbul')->where('country_id', 1)->first();

        if (! $airportTypeId || ! $istanbul) {
            return;
        }

        $airport = Airport::query()->where('iata_code', 'SAW')->first();
        if (! $airport || Location::query()->where('airport_id', $airport->id)->exists()) {
            return;
        }

        Location::query()->create([
            'location_type_id' => $airportTypeId,
            'country_id' => $istanbul->country_id,
            'city_id' => $istanbul->id,
            'airport_id' => $airport->id,
            'name' => $airport->name,
            'native_name' => $airport->name,
            'slug' => 'sabiha-gokcen-airport',
            'code' => $airport->iata_code,
            'address' => $airport->name,
            'latitude' => $airport->latitude,
            'longitude' => $airport->longitude,
            'timezone' => $airport->timezone ?: 'Europe/Istanbul',
            'is_public' => true,
            'is_active' => true,
            'sort_order' => 20,
        ]);
    }

    public function down(): void
    {
        Location::query()->where('slug', 'sabiha-gokcen-airport')->delete();
    }
};
