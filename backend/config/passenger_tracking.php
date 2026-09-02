<?php

return [
    'web_url' => env(
        'PASSENGER_TRACKING_URL',
        rtrim(env('APP_URL'), '/') . '/track'
    ),
];
