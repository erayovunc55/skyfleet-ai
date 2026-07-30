<?php

namespace Database\Seeders;

use App\Models\LocationType;
use Illuminate\Database\Seeder;

class LocationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'airport',
                'name' => 'Airport',
                'icon' => 'plane',
                'supports_terminals' => true,
                'supports_scheduled_arrivals' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'hotel',
                'name' => 'Hotel',
                'icon' => 'hotel',
                'sort_order' => 20,
            ],
            [
                'code' => 'port',
                'name' => 'Cruise Port',
                'icon' => 'ship',
                'supports_scheduled_arrivals' => true,
                'sort_order' => 30,
            ],
            [
                'code' => 'train_station',
                'name' => 'Train Station',
                'icon' => 'train',
                'supports_scheduled_arrivals' => true,
                'sort_order' => 40,
            ],
            [
                'code' => 'bus_terminal',
                'name' => 'Bus Terminal',
                'icon' => 'bus',
                'supports_scheduled_arrivals' => true,
                'sort_order' => 50,
            ],
            [
                'code' => 'office',
                'name' => 'Office',
                'icon' => 'building',
                'sort_order' => 60,
            ],
            [
                'code' => 'event_venue',
                'name' => 'Event Venue',
                'icon' => 'calendar',
                'sort_order' => 70,
            ],
            [
                'code' => 'hospital',
                'name' => 'Hospital',
                'icon' => 'hospital',
                'sort_order' => 80,
            ],
            [
                'code' => 'shopping_mall',
                'name' => 'Shopping Mall',
                'icon' => 'shopping-bag',
                'sort_order' => 90,
            ],
            [
                'code' => 'private_address',
                'name' => 'Private Address',
                'icon' => 'home',
                'is_public' => false,
                'sort_order' => 100,
            ],
            [
                'code' => 'custom',
                'name' => 'Custom Location',
                'icon' => 'map-pin',
                'is_public' => false,
                'sort_order' => 110,
            ],
        ];

        foreach ($types as $type) {
            LocationType::updateOrCreate(
                [
                    'code' => $type['code'],
                ],
                [
                    ...$type,
                    'supports_terminals' =>
                        $type['supports_terminals']
                        ?? false,

                    'supports_scheduled_arrivals' =>
                        $type[
                            'supports_scheduled_arrivals'
                        ] ?? false,

                    'is_public' =>
                        $type['is_public'] ?? true,

                    'is_active' => true,
                ]
            );
        }
    }
}
