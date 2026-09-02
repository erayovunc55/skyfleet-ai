<?php

namespace App\Services;

use App\Models\FlightStatusSnapshot;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FlightOperationalAlertService
{
    public function alerts(Carbon $now): Collection
    {
        $contactMinutes = max(
            1,
            (int) config('services.flight_tracking.landed_contact_minutes', 50)
        );

        return FlightStatusSnapshot::query()
            ->with('transfer')
            ->where('recorded_at', '>=', $now->copy()->subHours(24))
            ->orderByDesc('recorded_at')
            ->get()
            ->unique('transfer_id')
            ->filter(fn (FlightStatusSnapshot $snapshot): bool => (bool) $snapshot->transfer)
            ->flatMap(function (FlightStatusSnapshot $snapshot) use ($now, $contactMinutes): array {
                $transfer = $snapshot->transfer;

                if ($transfer->isTerminalStatus()) {
                    return [];
                }

                $alerts = [];
                $status = strtolower((string) $snapshot->status);
                $delay = $snapshot->delay_minutes;

                if ($status === 'cancelled') {
                    $alerts[] = $this->makeAlert(
                        key: 'flight-cancelled:' . $transfer->id . ':' . $snapshot->id,
                        level: 'critical',
                        title: 'Uçuş iptal edildi',
                        message: sprintf(
                            '%s / %s uçuşu iptal görünüyor. Transfer operasyonu kontrol edilmeli.',
                            $transfer->booking_reference,
                            $snapshot->flight_number
                        ),
                        transfer: $transfer,
                        snapshot: $snapshot,
                        icon: 'flight'
                    );
                }

                if ($delay !== null && $delay >= 30 && $status !== 'cancelled') {
                    $alerts[] = $this->makeAlert(
                        key: 'flight-delay:' . $transfer->id . ':' . $snapshot->id,
                        level: $delay >= 60 ? 'critical' : 'warning',
                        title: $delay >= 60
                            ? 'Ciddi uçuş gecikmesi'
                            : 'Uçuş gecikmesi',
                        message: sprintf(
                            '%s / %s yaklaşık %d dakika gecikmeli. Pickup planı kontrol edilmeli.',
                            $transfer->booking_reference,
                            $snapshot->flight_number,
                            $delay
                        ),
                        transfer: $transfer,
                        snapshot: $snapshot,
                        icon: 'flight'
                    );
                }

                if ($status === 'landed' && $snapshot->actual_arrival_at) {
                    $landedAt = $snapshot->actual_arrival_at->copy();
                    $contactDueAt = $landedAt->copy()->addMinutes($contactMinutes);

                    if ($landedAt->lte($now) && $landedAt->gte($now->copy()->subHours(6))) {
                        $alerts[] = $this->makeAlert(
                            key: 'flight-landed:' . $transfer->id . ':' . $snapshot->id,
                            level: 'info',
                            title: 'Uçuş indi',
                            message: sprintf(
                                '%s / %s iniş yaptı. Gerçek varış: %s.',
                                $transfer->booking_reference,
                                $snapshot->flight_number,
                                $landedAt->timezone('Europe/Istanbul')->format('H:i')
                            ),
                            transfer: $transfer,
                            snapshot: $snapshot,
                            icon: 'flight'
                        );
                    }

                    if (
                        $contactDueAt->lte($now)
                        && !in_array($transfer->status, [
                            'passenger_on_board',
                            'trip_started',
                            'completed',
                            'no_show',
                            'cancelled',
                        ], true)
                    ) {
                        $alerts[] = $this->makeAlert(
                            key: 'flight-contact-due:' . $transfer->id . ':' . $snapshot->id,
                            level: 'critical',
                            title: 'Yolcu karşılama kontrolü gerekli',
                            message: sprintf(
                                '%s / %s inişinden %d dakika geçti; yolcu henüz araçta görünmüyor.',
                                $transfer->booking_reference,
                                $snapshot->flight_number,
                                $contactMinutes
                            ),
                            transfer: $transfer,
                            snapshot: $snapshot,
                            icon: 'flight'
                        );
                    }
                }

                return $alerts;
            })
            ->values();
    }

    private function makeAlert(
        string $key,
        string $level,
        string $title,
        string $message,
        Transfer $transfer,
        FlightStatusSnapshot $snapshot,
        string $icon
    ): array {
        return [
            'key' => $key,
            'level' => $level,
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'occurred_at' => $snapshot->recorded_at?->toISOString() ?? now()->toISOString(),
            'transfer_id' => $transfer->id,
            'booking_reference' => $transfer->booking_reference,
            'pickup_time' => $transfer->pickup_time?->toISOString(),
            'status' => $transfer->status,
            'target' => 'transfers',
        ];
    }
}
