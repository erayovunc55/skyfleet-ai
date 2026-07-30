<?php

namespace Database\Seeders;

use App\Models\Airport;
use App\Models\AirportTerminal;
use App\Models\City;
use App\Models\Country;
use App\Models\Location;
use App\Models\LocationPoint;
use App\Models\LocationType;
use Illuminate\Database\Seeder;

class LocationCoreSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::updateOrCreate(
            [
                'iso2' => 'TR',
            ],
            [
                'iso3' => 'TUR',
                'name' => 'Türkiye',
                'native_name' => 'Türkiye',
                'phone_code' => '+90',
                'default_currency' => 'TRY',
                'default_timezone' => 'Europe/Istanbul',
                'default_locale' => 'tr',
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $city = City::updateOrCreate(
            [
                'country_id' => $country->id,
                'name' => 'İstanbul',
                'state_region' => null,
            ],
            [
                'native_name' => 'İstanbul',
                'timezone' => 'Europe/Istanbul',
                'latitude' => 41.0082376,
                'longitude' => 28.9783589,
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $airport = Airport::updateOrCreate(
            [
                'iata_code' => 'IST',
            ],
            [
                'country_id' => $country->id,
                'city_id' => $city->id,
                'name' => 'İstanbul Airport',
                'icao_code' => 'LTFM',
                'timezone' => 'Europe/Istanbul',
                'latitude' => 41.2752780,
                'longitude' => 28.7519440,
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $terminal = AirportTerminal::updateOrCreate(
            [
                'airport_id' => $airport->id,
                'name' => 'International Arrivals',
            ],
            [
                'code' => 'INT-ARR',
                'type' => 'international',
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $airportType = LocationType::query()
            ->where('code', LocationType::AIRPORT)
            ->firstOrFail();

        $location = Location::updateOrCreate(
            [
                'city_id' => $city->id,
                'slug' => 'istanbul-airport',
            ],
            [
                'location_type_id' => $airportType->id,
                'country_id' => $country->id,
                'airport_id' => $airport->id,
                'name' => 'İstanbul Airport',
                'native_name' => 'İstanbul Havalimanı',
                'code' => 'IST',
                'description' =>
                    'İstanbul Airport master location record.',
                'latitude' => 41.2752780,
                'longitude' => 28.7519440,
                'geofence_radius_meters' => 1500,
                'timezone' => 'Europe/Istanbul',
                'is_public' => true,
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        LocationPoint::updateOrCreate(
            [
                'location_id' => $location->id,
                'code' => 'INT-ARRIVALS',
            ],
            [
                'airport_terminal_id' => $terminal->id,
                'name' => 'International Arrivals',
                'point_type' =>
                    LocationPoint::TYPE_MEETING_POINT,
                'description' =>
                    'International arrivals meeting area.',
                'instructions' =>
                    'Wait inside the international arrivals hall.',
                'latitude' => 41.2753000,
                'longitude' => 28.7519000,
                'geofence_radius_meters' => 250,
                'is_pickup_allowed' => true,
                'is_dropoff_allowed' => false,
                'requires_meet_and_greet' => true,
                'is_public' => true,
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        LocationPoint::updateOrCreate(
            [
                'location_id' => $location->id,
                'code' => 'GATE-14',
            ],
            [
                'airport_terminal_id' => $terminal->id,
                'name' => 'Gate 14',
                'point_type' =>
                    LocationPoint::TYPE_GATE,
                'description' =>
                    'Gate 14 passenger meeting point.',
                'instructions' =>
                    'Meet the passenger near Gate 14 with a name sign.',
                'latitude' => 41.2753100,
                'longitude' => 28.7519200,
                'geofence_radius_meters' => 100,
                'is_pickup_allowed' => true,
                'is_dropoff_allowed' => false,
                'requires_meet_and_greet' => true,
                'is_public' => true,
                'is_active' => true,
                'sort_order' => 20,
            ]
        );
    }
}