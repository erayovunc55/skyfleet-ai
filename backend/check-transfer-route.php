<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(
    Illuminate\Contracts\Console\Kernel::class
)->bootstrap();

$transfer = App\Models\Transfer::query()
    ->where('booking_reference', 'SF-2026-98257')
    ->first();

dump([
    'id' => $transfer?->id,
    'booking_reference' => $transfer?->booking_reference,

    'pickup' => [
        'name' => $transfer?->pickup,
        'latitude' => $transfer?->pickup_lat,
        'longitude' => $transfer?->pickup_lng,
    ],

    'dropoff' => [
        'name' => $transfer?->dropoff,
        'latitude' => $transfer?->dropoff_lat,
        'longitude' => $transfer?->dropoff_lng,
    ],
]);