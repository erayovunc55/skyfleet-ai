<?php

namespace App\Console\Commands;

use App\Models\FlightStatusSnapshot;
use App\Models\Transfer;
use App\Models\TransferEvent;
use App\Services\MetaWhatsAppService;
use Illuminate\Console\Command;
use Throwable;

class ProcessFlightPassengerContact extends Command
{
    protected $signature = 'skyfleet:process-flight-passenger-contact
        {--limit=20 : Maximum transfers to process}
        {--force : Ignore the normal six-hour landed window}';

    protected $description = 'Create or send auditable passenger-contact actions after a flight has landed.';

    public function handle(MetaWhatsAppService $whatsApp): int
    {
        $minutes = max(1, (int) config('services.flight_tracking.landed_contact_minutes', 50));
        $limit = max(1, min(100, (int) $this->option('limit')));
        $force = (bool) $this->option('force');
        $mode = strtolower((string) config('services.passenger_contact.mode', 'dry_run'));

        if (!in_array($mode, ['dry_run', 'live'], true)) {
            $this->error('PASSENGER_CONTACT_MODE yalnızca dry_run veya live olabilir.');
            return self::FAILURE;
        }

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
        $sent = 0;
        $failed = 0;

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

            $passengerName = trim((string) $transfer->passenger_name) ?: 'Passenger';
            $message = sprintf(
                'Hello %s, your flight %s has landed. Your transfer team is monitoring your pickup. If you need assistance finding the meeting point, please reply to this message.',
                $passengerName,
                $snapshot->flight_number
            );

            $providerResult = null;
            $externalSent = false;
            $sendError = null;

            if ($mode === 'live') {
                try {
                    $providerResult = $whatsApp->sendPassengerPickupTemplate(
                        (string) $transfer->passenger_phone,
                        $passengerName,
                        (string) $snapshot->flight_number
                    );
                    $externalSent = true;
                    $sent++;
                } catch (Throwable $exception) {
                    $sendError = $exception->getMessage();
                    $failed++;
                }
            }

            TransferEvent::create([
                'transfer_id' => $transfer->id,
                'driver_id' => $transfer->driver_id,
                'event_type' => 'passenger_contact_due',
                'status' => $transfer->status,
                'call_log_reference' => $dedupeKey,
                'timezone' => 'Europe/Istanbul',
                'occurred_at' => now(),
                'note' => match (true) {
                    $mode === 'dry_run' => 'Passenger contact prepared in dry-run mode; no external message was sent.',
                    $externalSent => 'Passenger contact sent through Meta WhatsApp Cloud API.',
                    default => 'Passenger contact live send failed; see metadata for provider error.',
                },
                'metadata' => [
                    'mode' => $mode,
                    'channel' => config('services.passenger_contact.channel', 'whatsapp'),
                    'phone' => $transfer->passenger_phone,
                    'message_preview' => $message,
                    'flight_snapshot_id' => $snapshot->id,
                    'flight_number' => $snapshot->flight_number,
                    'landed_at' => $snapshot->actual_arrival_at?->toISOString(),
                    'contact_due_minutes' => $minutes,
                    'external_sent' => $externalSent,
                    'provider' => $providerResult['provider'] ?? null,
                    'provider_message_id' => $providerResult['message_id'] ?? null,
                    'provider_error' => $sendError,
                ],
            ]);

            $created++;
            $this->line(sprintf(
                '#%d %s | %s | contact %s | mode=%s',
                $transfer->id,
                $transfer->booking_reference,
                $snapshot->flight_number,
                $externalSent ? 'sent' : ($sendError ? 'failed' : 'prepared'),
                $mode
            ));

            if ($sendError) {
                $this->warn('  ' . $sendError);
            }
        }

        $this->info(sprintf(
            'Passenger contact processing finished. Created: %d. External messages sent: %d. Failed: %d.',
            $created,
            $sent,
            $failed
        ));

        return $failed > 0 && $sent === 0 && $mode === 'live'
            ? self::FAILURE
            : self::SUCCESS;
    }
}
