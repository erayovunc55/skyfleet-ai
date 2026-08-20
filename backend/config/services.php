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

    'passenger_contact' => [
        // Keep dry_run until Meta credentials and an approved WhatsApp template
        // are configured. Live mode performs a real external send.
        'mode' => env('PASSENGER_CONTACT_MODE', 'dry_run'),
        'channel' => env('PASSENGER_CONTACT_CHANNEL', 'whatsapp'),
        'auto_enabled' => env('PASSENGER_CONTACT_AUTO_ENABLED', false),
    ],

    'meta_whatsapp' => [
        'access_token' => env('META_WHATSAPP_ACCESS_TOKEN'),
        'phone_number_id' => env('META_WHATSAPP_PHONE_NUMBER_ID'),
        'graph_version' => env('META_WHATSAPP_GRAPH_VERSION'),
        'template_name' => env('META_WHATSAPP_TEMPLATE_NAME'),
        'template_language' => env('META_WHATSAPP_TEMPLATE_LANGUAGE', 'en_US'),
    ],

];
