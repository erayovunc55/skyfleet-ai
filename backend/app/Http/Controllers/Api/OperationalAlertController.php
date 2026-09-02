<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperationalAlertRead;
use App\Models\Transfer;
use App\Models\TransferEvidence;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class OperationalAlertController extends Controller
{
    private const ACTIVE_STATUSES = [
        'accepted',
        'assigned',
        'on_the_way',
        'arrived',
        'passenger_called',
        'passenger_on_board',
        'trip_started',
    ];

    public function index(Request $request): JsonResponse
    {
        $now = now();

        $alerts = collect()
            ->concat($this->upcomingUnassigned($now))
            ->concat($this->supplierAssignmentDelay($now))
            ->concat($this->pickupReadiness($now))
            ->concat($this->overdueTransfers($now))
            ->concat($this->gpsAttention($now))
            ->concat($this->recentNoShowEvidence($now))
            ->concat($this->recentCancellations($now))
            ->sort(
                fn (array $left, array $right): int =>
                    [
                        $this->severityRank($right['level']),
                        $right['occurred_at'],
                    ]
                    <=>
                    [
                        $this->severityRank($left['level']),
                        $left['occurred_at'],
                    ]
            )
            ->take(40)
            ->values();

        $readKeys = OperationalAlertRead::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('alert_key', $alerts->pluck('key'))
            ->pluck('alert_key')
            ->flip();

        $items = $alerts->map(function (array $alert) use ($readKeys): array {
            $alert['is_read'] = $readKeys->has($alert['key']);
            return $alert;
        });

        return response()->json([
            'data' => [
                'generated_at' => $now->toISOString(),
                'unread_count' => $items->where('is_read', false)->count(),
                'counts' => [
                    'critical' => $items->where('level', 'critical')->count(),
                    'warning' => $items->where('level', 'warning')->count(),
                    'info' => $items->where('level', 'info')->count(),
                ],
                'items' => $items->all(),
            ],
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alert_keys' => ['required', 'array', 'min:1', 'max:100'],
            'alert_keys.*' => ['required', 'string', 'max:160'],
        ]);

        $now = now();

        foreach (array_unique($validated['alert_keys']) as $alertKey) {
            OperationalAlertRead::query()->updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'alert_key' => $alertKey,
                ],
                ['read_at' => $now]
            );
        }

        return response()->json([
            'message' => 'Bildirimler okundu olarak işaretlendi.',
        ]);
    }

    private function upcomingUnassigned(Carbon $now): Collection
    {
        return Transfer::query()
            ->whereBetween('pickup_time', [$now, $now->copy()->addHours(24)])
            ->whereNull('supplier_id')
            ->whereNull('driver_id')
            ->whereNotIn('status', ['completed', 'cancelled', 'no_show'])
            ->orderBy('pickup_time')
            ->limit(12)
            ->get()
            ->map(
                fn (Transfer $transfer): array => $this->makeAlert(
                    key: 'unassigned:' . $transfer->id,
                    level: 'critical',
                    title: 'Yaklaşan tedarikçisiz transfer',
                    message: sprintf(
                        '%s rezervasyonu henüz bir tedarikçi tarafından alınmadı.',
                        $transfer->booking_reference
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->pickup_time,
                    icon: 'supplier'
                )
            );
    }

    private function supplierAssignmentDelay(Carbon $now): Collection
    {
        return Transfer::query()
            ->with('supplierCompany:id,company_name')
            ->whereBetween('pickup_time', [$now, $now->copy()->addHours(12)])
            ->whereNotNull('supplier_id')
            ->where(function ($query): void {
                $query
                    ->whereNull('driver_id')
                    ->orWhereNull('assigned_vehicle_id');
            })
            ->whereNotIn('status', [
                'completed',
                'cancelled',
                'no_show',
                'on_the_way',
                'arrived',
                'passenger_called',
                'passenger_on_board',
                'trip_started',
            ])
            ->orderBy('pickup_time')
            ->limit(16)
            ->get()
            ->map(function (Transfer $transfer) use ($now): array {
                $minutesToPickup = max(
                    0,
                    (int) $now->diffInMinutes($transfer->pickup_time, false)
                );

                $level = $minutesToPickup <= 180 ? 'critical' : 'warning';
                $supplierName = $transfer->supplierCompany?->company_name ?? 'Tedarikçi';

                $missing = [];
                if (!$transfer->driver_id) {
                    $missing[] = 'sürücü';
                }
                if (!$transfer->assigned_vehicle_id) {
                    $missing[] = 'araç';
                }

                return $this->makeAlert(
                    key: 'supplier-assignment:' . $transfer->id . ':' . $level,
                    level: $level,
                    title: $level === 'critical'
                        ? 'Acil: tedarikçi ataması tamamlanmadı'
                        : 'Tedarikçi operasyon ataması bekleniyor',
                    message: sprintf(
                        '%s işi %s tarafından alındı; %s ataması eksik. Alışa yaklaşık %s kaldı.',
                        $transfer->booking_reference,
                        $supplierName,
                        implode(' ve ', $missing),
                        $this->formatRemainingTime($minutesToPickup)
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->updated_at,
                    icon: 'assignment'
                );
            });
    }

    /**
     * Resources are assigned, but the driver has not started moving while pickup
     * is approaching. This catches the operational gap after assignment.
     */
    private function pickupReadiness(Carbon $now): Collection
    {
        return Transfer::query()
            ->whereBetween('pickup_time', [$now, $now->copy()->addHours(2)])
            ->whereNotNull('supplier_id')
            ->whereNotNull('driver_id')
            ->whereNotNull('assigned_vehicle_id')
            ->whereIn('status', ['pending', 'accepted', 'assigned'])
            ->orderBy('pickup_time')
            ->limit(16)
            ->get()
            ->map(function (Transfer $transfer) use ($now): array {
                $minutesToPickup = max(
                    0,
                    (int) $now->diffInMinutes($transfer->pickup_time, false)
                );

                $level = $minutesToPickup <= 45 ? 'critical' : 'warning';

                return $this->makeAlert(
                    key: 'pickup-readiness:' . $transfer->id . ':' . $level,
                    level: $level,
                    title: $level === 'critical'
                        ? 'Acil: sürücü henüz yola çıkmadı'
                        : 'Pickup yaklaşıyor: sürücü hareket bekleniyor',
                    message: sprintf(
                        '%s için sürücü ve araç atanmış durumda fakat sürücü henüz yola çıkmadı. Alışa yaklaşık %s kaldı.',
                        $transfer->booking_reference,
                        $this->formatRemainingTime($minutesToPickup)
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->updated_at,
                    icon: 'departure'
                );
            });
    }

    private function overdueTransfers(Carbon $now): Collection
    {
        return Transfer::query()
            ->whereBetween('pickup_time', [$now->copy()->subDays(7), $now])
            ->whereIn('status', ['pending', 'accepted'])
            ->orderByDesc('pickup_time')
            ->limit(12)
            ->get()
            ->map(
                fn (Transfer $transfer): array => $this->makeAlert(
                    key: 'overdue:' . $transfer->id,
                    level: 'warning',
                    title: 'Alış zamanı geçmiş transfer',
                    message: sprintf(
                        '%s hâlâ %s durumunda.',
                        $transfer->booking_reference,
                        $transfer->status
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->pickup_time,
                    icon: 'clock'
                )
            );
    }

    private function gpsAttention(Carbon $now): Collection
    {
        return Transfer::query()
            ->with('latestLocation')
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->whereBetween(
                'pickup_time',
                [$now->copy()->subHours(48), $now->copy()->addHours(24)]
            )
            ->whereNotNull('driver_id')
            ->orderByDesc('pickup_time')
            ->limit(30)
            ->get()
            ->filter(
                fn (Transfer $transfer): bool =>
                    !$transfer->latestLocation
                    || $transfer->latestLocation->recorded_at?->lt(
                        $now->copy()->subMinutes(10)
                    )
            )
            ->take(10)
            ->map(
                fn (Transfer $transfer): array => $this->makeAlert(
                    key: 'gps:' . $transfer->id,
                    level: 'warning',
                    title: 'GPS bağlantısı kontrol edilmeli',
                    message: sprintf(
                        '%s için 10 dakikadır güncel konum yok.',
                        $transfer->booking_reference
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->latestLocation?->recorded_at ?? $transfer->updated_at,
                    icon: 'gps'
                )
            );
    }

    private function recentNoShowEvidence(Carbon $now): Collection
    {
        return TransferEvidence::query()
            ->with([
                'transfer:id,booking_reference,status,pickup_time',
                'driver:id,name',
            ])
            ->where('recorded_at', '>=', $now->copy()->subDays(7))
            ->where('type', 'no_show_photo')
            ->orderByDesc('recorded_at')
            ->limit(8)
            ->get()
            ->filter(fn (TransferEvidence $evidence): bool => (bool) $evidence->transfer)
            ->map(
                fn (TransferEvidence $evidence): array => $this->makeAlert(
                    key: 'evidence:' . $evidence->id,
                    level: 'info',
                    title: 'Yeni No Show kanıtı',
                    message: sprintf(
                        '%s için %s kanıt yükledi.',
                        $evidence->transfer->booking_reference,
                        $evidence->driver?->name ?? 'Sürücü'
                    ),
                    transfer: $evidence->transfer,
                    occurredAt: $evidence->recorded_at,
                    icon: 'evidence'
                )
            );
    }

    private function recentCancellations(Carbon $now): Collection
    {
        return Transfer::query()
            ->where('status', 'cancelled')
            ->where('updated_at', '>=', $now->copy()->subDays(7))
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get()
            ->map(
                fn (Transfer $transfer): array => $this->makeAlert(
                    key: 'cancelled:' . $transfer->id . ':' . $transfer->updated_at?->timestamp,
                    level: 'info',
                    title: 'Transfer iptal edildi',
                    message: sprintf(
                        '%s rezervasyonu iptal edildi.',
                        $transfer->booking_reference
                    ),
                    transfer: $transfer,
                    occurredAt: $transfer->updated_at,
                    icon: 'cancelled'
                )
            );
    }

    private function makeAlert(
        string $key,
        string $level,
        string $title,
        string $message,
        Transfer $transfer,
        ?Carbon $occurredAt,
        string $icon
    ): array {
        return [
            'key' => $key,
            'level' => $level,
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'occurred_at' => $occurredAt?->toISOString() ?? now()->toISOString(),
            'transfer_id' => $transfer->id,
            'booking_reference' => $transfer->booking_reference,
            'pickup_time' => $transfer->pickup_time?->toISOString(),
            'status' => $transfer->status,
            'target' => 'transfers',
        ];
    }

    private function formatRemainingTime(int $minutes): string
    {
        if ($minutes < 60) {
            return $minutes . ' dakika';
        }

        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        return $remainingMinutes > 0
            ? sprintf('%d saat %d dakika', $hours, $remainingMinutes)
            : sprintf('%d saat', $hours);
    }

    private function severityRank(string $level): int
    {
        return match ($level) {
            'critical' => 3,
            'warning' => 2,
            default => 1,
        };
    }
}
