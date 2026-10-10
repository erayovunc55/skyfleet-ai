<?php

return [
    'enabled' => env('GOOGLE_PLACES_ENABLED', true),
    'key' => env('GOOGLE_MAPS_API_KEY'),
    'language' => env('GOOGLE_PLACES_LANGUAGE', 'tr'),
    'region_code' => env('GOOGLE_PLACES_REGION', ''),
    'autocomplete_endpoint' => env(
        'GOOGLE_PLACES_AUTOCOMPLETE_ENDPOINT',
        'https://places.googleapis.com/v1/places:autocomplete'
    ),
    'details_endpoint' => env(
        'GOOGLE_PLACES_DETAILS_ENDPOINT',
        'https://places.googleapis.com/v1/places'
    ),
];
