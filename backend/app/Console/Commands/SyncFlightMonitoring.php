<?php

namespace App\Console\Commands;

use App\Models\Transfer;
use App\Services\FlightTrackingService;
use Illuminate\Console\Command;
use Throwable;

class SyncFlightMonitoring extends Command
{
    protected $signature = 'skyfleet:sync-flights
        {--limit=5 : Maximum number of provider calls in one run}
        {--force : Ignore snapshot freshness and landed/cancelled stop rules}';

    protected $description = 'Synchronize live flight status for near-term airport pickup transfers.';

    public function handle(FlightTrackingService $service): int
    {
        $limit = max(1, min(50, (int) $this->option('limit')));
        $force = (bool) $this->option('force');
        $staleMinutes = max(5, (int) config('services.flight_tracking.stale_minutes', 30));
        $lookBackHours = max(1, (int) config('services.flight_tracking.lookback_hours', 3));
        $lookAheadHours = max(1, (int) config('services.flight_tracking.lookahead_hours', 6));

        $candidates = Transfer::query()
            ->with('latestFlightStatus')
            ->whereNotNull('flight_number')
            ->whereBetween('pickup_time', [
                now()->subHours($lookBackHours),
                now()->addHours($lookAheadHours),
            ])
            ->whereNotIn('status', ['completed', 'no_show', 'cancelled'])
            ->orderBy('pickup_time')
            ->get()
            ->filter(function (Transfer $transfer) use ($force, $staleMinutes): bool {
                if ($force) {
                    return true;
                }

                $latest = $transfer->latestFlightStatus;

                if (!$latest) {
                    return true;
                }

                if (in_array(strtolower((string) $latest->status), ['landed', 'cancelled'], true)) {
                    return false;
                }

                return !$latest->recorded_at
                    || $latest->recorded_at->lte(now()->subMinutes($staleMinutes));
            })
            ->take($limit)
            ->values();

        if ($candidates->isEmpty()) {
            $this->info('No flight monitoring candidates require synchronization.');
            return self::SUCCESS;
        }

        $successful = 0;
        $failed = 0;

        foreach ($candidates as $transfer) {
            try {
                $snapshot = $service->sync($transfer);
                $successful++;

                $this->line(sprintf(
                    '#%d %s | %s | %s | delay=%s',
                    $transfer->id,
                    $transfer->booking_reference,
                    $snapshot->flight_number,
                    $snapshot->status ?: '-',
                    $snapshot->delay_minutes === null ? '-' : $snapshot->delay_minutes . 'm'
                ));
            } catch (Throwable $exception) {
                $failed++;
                $this->warn(sprintf(
                    '#%d %s | FAILED | %s',
                    $transfer->id,
                    $transfer->booking_reference,
                    $exception->getMessage()
                ));
            }
        }

        $this->newLine();
        $this->info(sprintf(
            'Flight monitoring finished. Provider calls: %d. Successful: %d. Failed: %d.',
            $candidates->count(),
            $successful,
            $failed
        ));

        return $failed > 0 && $successful === 0 ? self::FAILURE : self::SUCCESS;
    }
}
