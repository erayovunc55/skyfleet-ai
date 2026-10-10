<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported Display Currencies
    |--------------------------------------------------------------------------
    */

    'supported_currencies' => [
        'TRY',
        'EUR',
        'USD',
        'GBP',
    ],

    /*
    |--------------------------------------------------------------------------
    | FX Provider
    |--------------------------------------------------------------------------
    |
    | Frankfurter provides ECB-derived reference rates and requires no API key.
    | These are quote/display rates, not card-settlement rates.
    |
    */

    'provider' => 'frankfurter',

    'endpoint' => env(
        'FX_ENDPOINT',
        'https://api.frankfurter.app/latest'
    ),

    'cache_ttl_seconds' => (int) env(
        'FX_CACHE_TTL_SECONDS',
        21600
    ),

    'connect_timeout_seconds' => (int) env(
        'FX_CONNECT_TIMEOUT_SECONDS',
        3
    ),

    'timeout_seconds' => (int) env(
        'FX_TIMEOUT_SECONDS',
        8
    ),

    'allow_stale_fallback' => true,

    /*
    |--------------------------------------------------------------------------
    | Display Rounding
    |--------------------------------------------------------------------------
    */

    'decimal_places' => 2,

];
