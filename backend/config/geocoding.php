<?php

return [
    'provider' => env(
        'GEOCODING_PROVIDER',
        'geoapify'
    ),

    'geoapify' => [
        'key' => env('GEOAPIFY_API_KEY'),

        'endpoint' => env(
            'GEOAPIFY_ENDPOINT',
            'https://api.geoapify.com/v1/geocode/search'
        ),

        'language' => env(
            'GEOAPIFY_LANGUAGE',
            'tr'
        ),
    ],

    'cache_ttl_days' => (int) env(
        'GEOCODING_CACHE_TTL_DAYS',
        30
    ),

    'routing' => [
        'endpoint' => env(
            'GEOAPIFY_ROUTING_ENDPOINT',
            'https://api.geoapify.com/v1/routing'
        ),

        'cache_ttl_seconds' => (int) env(
            'ROUTING_CACHE_TTL_SECONDS',
            30
        ),
    ],
];
