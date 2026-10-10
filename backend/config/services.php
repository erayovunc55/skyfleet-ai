<?php

return [

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],
'openai' => [
    'api_key' => env('OPENAI_API_KEY'),
    'model' => env('OPENAI_MODEL', 'gpt-5.6'),
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
        'tracking_template_name' => env(
            'META_WHATSAPP_TRACKING_TEMPLATE_NAME',
            'passenger_tracking_on_the_way'
        ),
        'tracking_template_language' => env(
            'META_WHATSAPP_TRACKING_TEMPLATE_LANGUAGE',
            'en_US'
        ),
        'verify_token' => env('META_WHATSAPP_VERIFY_TOKEN'),
        'app_secret' => env('META_WHATSAPP_APP_SECRET'),
    ],

    'passenger_tracking_notifications' => [
        // Keep dry_run until WhatsApp, SMS and email delivery are verified.
        'mode' => env('PASSENGER_TRACKING_NOTIFICATION_MODE', 'dry_run'),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'from_number' => env('TWILIO_FROM_NUMBER'),
        'messaging_service_sid' => env(
            'TWILIO_MESSAGING_SERVICE_SID'
        ),
        'status_callback_url' => env(
            'TWILIO_STATUS_CALLBACK_URL'
        ),
    ],

    'agency_portal' => [
        'url' => env('AGENCY_PORTAL_URL', 'https://skytriptransfer.com/agency'),
    ],

    'supplier_portal' => [
        'url' => env('SUPPLIER_PORTAL_URL', 'https://skytriptransfer.com/supplier'),
    ],

    'heytrip' => [
        'base_url' => env('HEYTRIP_BASE_URL', 'https://vbk.heytripgocar.com'),
        'authorization_url' => env('HEYTRIP_AUTHORIZATION_URL'),
        'username' => env('HEYTRIP_USERNAME'),
        'password' => env('HEYTRIP_PASSWORD'),
        'currency' => env('HEYTRIP_CURRENCY', 'EUR'),
        'language' => env('HEYTRIP_LANGUAGE', 'en-US'),
        'markup_percent' => (float) env('HEYTRIP_MARKUP_PERCENT', 15),
        'timeout' => (int) env('HEYTRIP_TIMEOUT', 20),
        'enabled' => (bool) env('HEYTRIP_ENABLED', false),
    ],

    'regional_pricing' => [
        'commission_percent' => (float) env('REGIONAL_PRICING_COMMISSION_PERCENT', 23),
    ],

    'reservation_mail' => [
        'enabled' => (bool) env('RESERVATION_MAIL_ENABLED', false),
        'host' => env('RESERVATION_MAIL_HOST', 'imap.gmail.com'),
        'port' => (int) env('RESERVATION_MAIL_PORT', 993),
        'encryption' => env('RESERVATION_MAIL_ENCRYPTION', 'ssl'),
        'username' => env('RESERVATION_MAIL_USERNAME'),
        'password' => env('RESERVATION_MAIL_PASSWORD'),
        'folder' => env('RESERVATION_MAIL_FOLDER', 'INBOX'),
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET_KEY'),
        'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'frontend' => [
        'url' => env('FRONTEND_URL', 'http://localhost:5177'),
    ],

];
