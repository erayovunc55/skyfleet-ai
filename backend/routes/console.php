<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('skyfleet:send-pickup-reminders')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('skyfleet:sync-flights --limit=3')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('services.flight_tracking.auto_enabled', false));

Schedule::command('skyfleet:process-flight-passenger-contact')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('services.passenger_contact.auto_enabled', false));
