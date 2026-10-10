<?php

namespace App\Jobs;

use App\Models\Transfer;
use App\Services\PassengerTrackingSmsFallbackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPassengerTrackingSmsFallback implements ShouldQueue
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
        PassengerTrackingSmsFallbackService $service
    ): void {
        $transfer = Transfer::query()
            ->find($this->transferId);

        if (
            !$transfer
            || $transfer->isTerminalStatus()
            || !$transfer->public_tracking_token
            || !$transfer->publicTrackingIsAvailable()
        ) {
            return;
        }

        $service->send($transfer);
    }
}