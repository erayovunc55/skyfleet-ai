<?php

namespace App\Console\Commands;

use App\Models\FlightStatusSnapshot;
use App\Models\Transfer;
use App\Models\TransferEvent;
use Illuminate\Console\Command;

class ProcessFlightPassengerContact extends Command
{
    protected $signature = 'skyfleet:process-flight-passenger-contact
        {--limit=20 : Maximum transfers to process}
        {--force : Ignore the normal six-hour landed window}';

    protected $description = 'Create auditable passenger-contact actions after a flight has landed.';

    public function handle(): int
    {
        $minutes = max(1, (int) config('services.flight_tracking.landed_contact_minutes', 50));
        $limit = max(1, min(100, (int) $this->option('limit')));
        $force = (bool) $this->option('force');
        $mode = strtolower((string) config('services.passenger_contact.mode', 'dry_run'));

        $snapshots = FlightStatusSnapshot::query()
            ->with('transfer')
            ->where('status', 'landed')
            ->whereNotNull('actual_arrival_at')
            ->where('actual_arrival_at', '<=', now()->subMinutes($minutes))
            ->when(!$force, fn ($query) => $query->where('actual_arrival_at', '>=', now()->subHours(6)))
            ->orderByDesc('actual_arrival_at')
            ->get()
            ->unique('transfer_id')
            ->filter(function (FlightStatusSnapshot $snapshot): bool {
                $transfer = $snapshot->transfer;

                return $transfer
                    && !$transfer->isTerminalStatus()
                    && !in_array($transfer->status, ['passenger_on_board', 'trip_started'], true);
            })
            ->take($limit);

        $created = 0;

        foreach ($snapshots as $snapshot) {
            /** @var Transfer $transfer */
            $transfer = $snapshot->transfer;
            $dedupeKey = 'flight-contact-due:' . $transfer->id . ':' . $snapshot->id;

            $exists = TransferEvent::query()
                ->where('transfer_id', $transfer->id)
                ->where('event_type', 'passenger_contact_due')
                ->where('call_log_reference', $dedupeKey)
                ->exists();

            if ($exists) {
                continue;
            }

            $message = sprintf(
                'Hello %s, your flight %s has landed. Your transfer team is monitoring your pickup. If you need assistance finding the meeting point, please reply to this message.',
                trim((string) $transfer->passenger_name) ?: 'Passenger',
                $snapshot->flight_number
            );

            // Safety first: dry_run only records the intended communication.
            // A real WhatsApp/SMS provider will be plugged in after credentials,
            // approved templates and recipient rules are configured.
            TransferEvent::create([
                'transfer_id' => $transfer->id,
                'driver_id' => $transfer->driver_id,
                'event_type' => 'passenger_contact_due',
                'status' => $transfer->status,
                'call_log_reference' => $dedupeKey,
                'timezone' => 'Europe/Istanbul',
                'occurred_at' => now(),
                'note' => $mode === 'dry_run'
                    ? 'Passenger contact prepared in dry-run mode; no external message was sent.'
                    : 'Passenger contact queued for configured provider.',
                'metadata' => [
                    'mode' => $mode,
                    'channel' => config('services.passenger_contact.channel', 'whatsapp'),
                    'phone' => $transfer->passenger_phone,
                    'message_preview' => $message,
                    'flight_snapshot_id' => $snapshot->id,
                    'flight_number' => $snapshot->flight_number,
                    'landed_at' => $snapshot->actual_arrival_at?->toISOString(),
                    'contact_due_minutes' => $minutes,
                    'external_sent' => false,
                ],
            ]);

            $created++;
            $this->line(sprintf(
                '#%d %s | %s | contact prepared | mode=%s',
                $transfer->id,
                $transfer->booking_reference,
                $snapshot->flight_number,
                $mode
            ));
        }

        $this->info(sprintf('Passenger contact processing finished. Created: %d. External messages sent: 0.', $created));

        return self::SUCCESS;
    }
}
