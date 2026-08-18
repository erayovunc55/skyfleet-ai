<?php

namespace App\Console\Commands;

use App\Models\DriverPushLog;
use App\Models\Transfer;
use App\Services\FirebaseCloudMessagingService;
use Illuminate\Console\Command;

class SendPickupReminderNotifications extends Command
{
    protected $signature = 'skyfleet:send-pickup-reminders';
    protected $description = 'Alış saatine 60 dakika kalan transferleri sürücülere bildirir.';

    public function handle(FirebaseCloudMessagingService $firebase): int
    {
        $transfers = Transfer::query()
            ->with(['driver.pushTokens'])
            ->whereIn('status', ['pending', 'assigned', 'accepted'])
            ->whereNotNull('driver_id')
            ->where('pickup_time', '>', now())
            ->where('pickup_time', '<=', now()->addMinutes(60))
            ->get();

        foreach ($transfers as $transfer) {
            if (!$transfer->driver || $transfer->driver->pushTokens->isEmpty()) continue;

            $alreadySent = DriverPushLog::query()
                ->where('transfer_id', $transfer->id)
                ->where('driver_id', $transfer->driver_id)
                ->where('type', 'pickup_60_minutes')
                ->exists();
            if ($alreadySent) continue;

            $successful = 0;
            foreach ($transfer->driver->pushTokens as $pushToken) {
                try {
                    if ($firebase->send(
                        $pushToken->token,
                        'Alış saatine 60 dakika kaldı',
                        ($transfer->booking_reference ?: "Transfer #{$transfer->id}").' · '.($transfer->pickup ?: 'Alış noktası'),
                        ['transfer_id' => $transfer->id, 'type' => 'pickup_60_minutes']
                    )) $successful++;
                } catch (\Throwable $error) {
                    report($error);
                }
            }

            if ($successful > 0) {
                DriverPushLog::create([
                    'transfer_id' => $transfer->id,
                    'driver_id' => $transfer->driver_id,
                    'type' => 'pickup_60_minutes',
                    'sent_at' => now(),
                    'successful_tokens' => $successful,
                ]);
            }
        }

        $this->info('60 dakika hatırlatmaları kontrol edildi.');
        return self::SUCCESS;
    }
}
