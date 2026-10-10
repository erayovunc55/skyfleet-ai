<?php

namespace App\Jobs;

use App\Models\Transfer;
use App\Services\PassengerTrackingNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPassengerTrackingNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [
        60,
        300,
        900,
    ];

    public function __construct(
        public int $transferId
    ) {
    }

    public function handle(
        PassengerTrackingNotificationService $service
    ): void {
        $transfer = Transfer::query()
            ->find($this->transferId);

        if (
            !$transfer
            || $transfer->isTerminalStatus()
            || !$transfer->public_tracking_token
        ) {
            return;
        }

        $service->prepare($transfer);
    }
}