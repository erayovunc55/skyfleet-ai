<?php

return [

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'flight_tracking' => [
        'provider' => env('FLIGHT_TRACKING_PROVIDER', 'aviationstack'),
        'key' => env('FLIGHT_TRACKING_API_KEY'),
        'auto_enabled' => env('FLIGHT_TRACKING_AUTO_ENABLED', false),
        'stale_minutes' => env('FLIGHT_TRACKING_STALE_MINUTES', 30),
        'lookback_hours' => env('FLIGHT_TRACKING_LOOKBACK_HOURS', 3),
        'lookahead_hours' => env('FLIGHT_TRACKING_LOOKAHEAD_HOURS', 6),
        'landed_contact_minutes' => env('FLIGHT_TRACKING_LANDED_CONTACT_MINUTES', 50),
    ],

];
