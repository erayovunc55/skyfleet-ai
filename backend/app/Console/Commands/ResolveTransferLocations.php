<?php

namespace App\Console\Commands;

use App\Models\Transfer;
use App\Services\TransferLocationResolver;
use Illuminate\Console\Command;

class ResolveTransferLocations extends Command
{
    protected $signature = 'transfer-locations:resolve {--limit=0 : Maximum number of transfers to process}';

    protected $description = 'Resolve missing pickup and dropoff location IDs for existing transfers.';

    public function handle(TransferLocationResolver $resolver): int
    {
        $query = Transfer::query()
            ->where(function ($query): void {
                $query
                    ->whereNull('pickup_location_id')
                    ->orWhereNull('dropoff_location_id');
            })
            ->orderBy('id');

        $limit = max(0, (int) $this->option('limit'));

        if ($limit > 0) {
            $query->limit($limit);
        }

        $transfers = $query->get();
        $updated = 0;
        $pickupResolved = 0;
        $dropoffResolved = 0;

        foreach ($transfers as $transfer) {
            $beforePickup = $transfer->pickup_location_id;
            $beforeDropoff = $transfer->dropoff_location_id;

            $resolver->apply($transfer);

            $pickupChanged = !$beforePickup && $transfer->pickup_location_id;
            $dropoffChanged = !$beforeDropoff && $transfer->dropoff_location_id;

            if (!$pickupChanged && !$dropoffChanged) {
                continue;
            }

            $transfer->saveQuietly();
            $updated++;
            $pickupResolved += $pickupChanged ? 1 : 0;
            $dropoffResolved += $dropoffChanged ? 1 : 0;

            $this->line(sprintf(
                '#%d %s | pickup=%s | dropoff=%s',
                $transfer->id,
                $transfer->booking_reference ?: '-',
                $transfer->pickup_location_id ?: '-',
                $transfer->dropoff_location_id ?: '-',
            ));
        }

        $this->newLine();
        $this->info(sprintf(
            'Processed %d transfer(s). Updated: %d. Pickup resolved: %d. Dropoff resolved: %d.',
            $transfers->count(),
            $updated,
            $pickupResolved,
            $dropoffResolved,
        ));

        return self::SUCCESS;
    }
}
