<?php

use App\Models\HeytripOrder;
use App\Models\Transfer;
use App\Services\HeytripService;
use App\Services\HeytripEmailImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


/*
|--------------------------------------------------------------------------
| AUTO COMPLETE TRANSFERS
|--------------------------------------------------------------------------
|
| Pickup saatinden 6 saat geçmiş ve terminal durumda olmayan transferleri
| otomatik olarak completed durumuna geçirir.
|
*/

Artisan::command('skyfleet:auto-complete-transfers', function () {

    $cutoff = now()->subHours(6);

    $count = Transfer::query()
        ->whereNotNull('pickup_time')
        ->where('pickup_time', '<=', $cutoff)
        ->whereNotIn('status', [
            'completed',
            'no_show',
            'cancelled',
        ])
        ->update([
            'status' => 'completed',
        ]);

    Log::info(
        'Skyfleet automatic transfer completion finished.',
        [
            'completed_count' => $count,
            'cutoff' => $cutoff->toDateTimeString(),
        ]
    );

    $this->info(
        "{$count} transfer otomatik olarak completed yapıldı."
    );

})->purpose(
    'Pickup saatinden 6 saat sonra transferleri otomatik tamamlar.'
);

Artisan::command('heytrip:sync-orders {--limit=50}', function (HeytripService $heytrip): void {
    $synced = 0;
    $failed = 0;

    HeytripOrder::query()
        ->whereNotNull('heytrip_order_number')
        ->whereNotIn('status', ['Completed', 'Canceled', 'cancelled'])
        ->limit((int) $this->option('limit'))
        ->get()
        ->each(function (HeytripOrder $order) use ($heytrip, &$synced, &$failed): void {
            try {
                $detail = $heytrip->getOrderDetails($order->partner_order_number);
                $remoteStatus = (string) ($detail['orderStatus'] ?? '');
                $order->update([
                    'status' => $remoteStatus ?: $order->status,
                    'last_detail_payload' => $detail,
                    'last_synced_at' => now(),
                ]);

                $mappedStatus = [
                    'Paid' => 'pending',
                    'Accept' => 'accepted',
                    'Dispatched' => 'accepted',
                    'AssignedCars' => 'accepted',
                    'Completed' => 'completed',
                    'Canceled' => 'cancelled',
                ][$remoteStatus] ?? null;

                if ($mappedStatus && $order->transfer && $order->transfer->status !== $mappedStatus) {
                    $order->transfer->update(['status' => $mappedStatus]);
                }

                $synced++;
            } catch (\Throwable $exception) {
                $failed++;
                report($exception);
            }
        });

    $this->info("HeyTrip sync completed: {$synced} synced, {$failed} failed.");
})->purpose('Synchronize known HeyTrip orders and statuses into Skyfleet.');

Artisan::command('heytrip:import-email {file} {--subject=}', function (string $file, HeytripEmailImportService $importer): void {
    if (! is_file($file)) {
        $this->error("Email file not found: {$file}");
        return;
    }

    $transfer = $importer->import(
        (string) $this->option('subject'),
        (string) file_get_contents($file),
    );

    $this->info("HeyTrip reservation imported: {$transfer->ota_booking_reference}");
})->purpose('Import a HeyTrip reservation email text file into Skyfleet.');


/*
|--------------------------------------------------------------------------
| SCHEDULES
|--------------------------------------------------------------------------
*/



Schedule::command('skyfleet:send-pickup-reminders')
    ->everyMinute()
    ->withoutOverlapping();


Schedule::command('skyfleet:sync-flights --limit=3')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->when(
        fn (): bool =>
            (bool) config(
                'services.flight_tracking.auto_enabled',
                false
            )
    );


Schedule::command('skyfleet:process-flight-passenger-contact')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->when(
        fn (): bool =>
            (bool) config(
                'services.passenger_contact.auto_enabled',
                false
            )
    );

Schedule::command('heytrip:sync-orders')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('services.heytrip.enabled', false));