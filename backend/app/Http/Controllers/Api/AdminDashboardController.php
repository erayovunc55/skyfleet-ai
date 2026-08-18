<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
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

    public function __invoke(): JsonResponse
    {
        $now = now();

        $todayStart = $now
            ->copy()
            ->startOfDay();

        $todayEnd = $now
            ->copy()
            ->endOfDay();

        $todayTransfers = Transfer::query()
            ->whereBetween(
                'pickup_time',
                [
                    $todayStart,
                    $todayEnd,
                ]
            );

        $todayTotal = (
            clone $todayTransfers
        )->count();

        $todayPending = (
            clone $todayTransfers
        )
            ->where('status', 'pending')
            ->count();

        $todayActive = (
            clone $todayTransfers
        )
            ->whereIn(
                'status',
                self::ACTIVE_STATUSES
            )
            ->count();

        $todayCompleted = (
            clone $todayTransfers
        )
            ->where('status', 'completed')
            ->count();

        $todayCancelled = (
            clone $todayTransfers
        )
            ->where('status', 'cancelled')
            ->count();

        $todayUnassigned = (
            clone $todayTransfers
        )
            ->whereNull('driver_id')
            ->whereNotIn(
                'status',
                [
                    'completed',
                    'cancelled',
                    'no_show',
                ]
            )
            ->count();

        $grossRevenue =
            $this->getGrossRevenue(
                $todayStart,
                $todayEnd
            );

        $supplierPayable =
            $this->getSupplierPayable(
                $todayStart,
                $todayEnd
            );

        $platformMargin =
            $this->calculatePlatformMargin(
                $grossRevenue,
                $supplierPayable
            );

        return response()->json([
            'data' => [
                'generated_at' =>
                    $now->toISOString(),

                'overview' => [
                    'today_total' =>
                        $todayTotal,

                    'pending' =>
                        $todayPending,

                    'active' =>
                        $todayActive,

                    'completed' =>
                        $todayCompleted,

                    'cancelled' =>
                        $todayCancelled,

                    'unassigned' =>
                        $todayUnassigned,

                    'completion_rate' =>
                        $todayTotal > 0
                            ? round(
                                (
                                    $todayCompleted /
                                    $todayTotal
                                ) * 100,
                                1
                            )
                            : 0,
                ],

                'network' => [
                    'active_drivers' =>
                        User::query()
                            ->where(
                                'role',
                                'driver'
                            )
                            ->where(
                                'is_active',
                                true
                            )
                            ->count(),

                    'active_vehicles' =>
                        Vehicle::query()
                            ->where(
                                'is_active',
                                true
                            )
                            ->where(
                                'operational_status',
                                'active'
                            )
                            ->count(),

                    'approved_suppliers' =>
                        Supplier::query()
                            ->where(
                                'status',
                                'approved'
                            )
                            ->where(
                                'is_active',
                                true
                            )
                            ->count(),
                ],

                'finance' => [
                    'gross_revenue' =>
                        $grossRevenue,

                    'supplier_payable' =>
                        $supplierPayable,

                    'platform_margin' =>
                        $platformMargin,
                ],

                'alerts' =>
                    $this->getAlerts($now),

                'upcoming_transfers' =>
                    $this->getUpcomingTransfers(
                        $now
                    ),

                'weekly_activity' =>
                    $this->getWeeklyActivity(
                        $now
                    ),

                'status_distribution' =>
                    $this
                        ->getStatusDistribution(),
            ],
        ]);
    }

    private function getGrossRevenue(
        Carbon $start,
        Carbon $end
    ): array {
        return Transfer::query()
            ->whereBetween(
                'pickup_time',
                [
                    $start,
                    $end,
                ]
            )
            ->whereNotIn(
                'status',
                [
                    'cancelled',
                    'no_show',
                ]
            )
            ->whereNotNull('price')
            ->selectRaw(
                "
                COALESCE(currency, 'EUR')
                    as currency,
                ROUND(SUM(price), 2)
                    as amount
                "
            )
            ->groupBy('currency')
            ->orderBy('currency')
            ->get()
            ->map(
                fn (Transfer $item): array => [
                    'currency' =>
                        $item->currency
                        ?: 'EUR',

                    'amount' =>
                        round(
                            (float) $item
                                ->getRawOriginal(
                                    'amount'
                                ),
                            2
                        ),
                ]
            )
            ->values()
            ->all();
    }

    private function getSupplierPayable(
        Carbon $start,
        Carbon $end
    ): array {
        return DB::table('transfers')
            ->leftJoin(
                'suppliers',
                'suppliers.id',
                '=',
                'transfers.supplier_id'
            )
            ->whereBetween(
                'transfers.pickup_time',
                [
                    $start,
                    $end,
                ]
            )
            ->whereNotNull(
                'transfers.supplier_id'
            )
            ->whereNotNull(
                'transfers.price'
            )
            ->whereNotIn(
                'transfers.status',
                [
                    'cancelled',
                    'no_show',
                ]
            )
            ->selectRaw(
                "
                COALESCE(
                    transfers.currency,
                    'EUR'
                ) as currency,

                ROUND(
                    SUM(
                        transfers.price *
                        COALESCE(
                            suppliers
                                .payout_percentage,
                            90
                        ) / 100
                    ),
                    2
                ) as amount
                "
            )
            ->groupBy(
                'transfers.currency'
            )
            ->orderBy(
                'transfers.currency'
            )
            ->get()
            ->map(
                fn (object $item): array => [
                    'currency' =>
                        $item->currency
                        ?: 'EUR',

                    'amount' =>
                        round(
                            (float) $item->amount,
                            2
                        ),
                ]
            )
            ->values()
            ->all();
    }

    private function calculatePlatformMargin(
        array $grossRevenue,
        array $supplierPayable
    ): array {
        $payableByCurrency =
            collect($supplierPayable)
                ->keyBy('currency');

        return collect($grossRevenue)
            ->map(
                function (
                    array $gross
                ) use (
                    $payableByCurrency
                ): array {
                    $payable =
                        (float) data_get(
                            $payableByCurrency
                                ->get(
                                    $gross[
                                        'currency'
                                    ]
                                ),
                            'amount',
                            0
                        );

                    return [
                        'currency' =>
                            $gross['currency'],

                        'amount' =>
                            round(
                                max(
                                    0,
                                    (float) $gross[
                                        'amount'
                                    ] -
                                    $payable
                                ),
                                2
                            ),
                    ];
                }
            )
            ->values()
            ->all();
    }

    private function getAlerts(
        Carbon $now
    ): array {
        $nextSixHours = $now
            ->copy()
            ->addHours(6);

        $unassignedUpcoming =
            Transfer::query()
                ->whereBetween(
                    'pickup_time',
                    [
                        $now,
                        $nextSixHours,
                    ]
                )
                ->whereNull('driver_id')
                ->whereNotIn(
                    'status',
                    [
                        'completed',
                        'cancelled',
                        'no_show',
                    ]
                )
                ->count();

        $overduePending =
            Transfer::query()
                ->where(
                    'pickup_time',
                    '<',
                    $now
                )
                ->whereIn(
                    'status',
                    [
                        'pending',
                        'accepted',
                    ]
                )
                ->count();

        $activeWithoutRecentGps =
            Transfer::query()
                ->whereIn(
                    'status',
                    self::ACTIVE_STATUSES
                )
                ->where(
                    function ($query) use (
                        $now
                    ): void {
                        $query
                            ->whereDoesntHave(
                                'latestLocation'
                            )
                            ->orWhereHas(
                                'latestLocation',
                                function (
                                    $locationQuery
                                ) use ($now): void {
                                    $locationQuery
                                        ->where(
                                            'recorded_at',
                                            '<',
                                            $now
                                                ->copy()
                                                ->subMinutes(
                                                    10
                                                )
                                        );
                                }
                            );
                    }
                )
                ->count();

        return [
            [
                'key' =>
                    'unassigned_upcoming',

                'level' =>
                    $unassignedUpcoming > 0
                        ? 'critical'
                        : 'success',

                'title' =>
                    'Yaklaşan sürücüsüz transfer',

                'value' =>
                    $unassignedUpcoming,
            ],
            [
                'key' =>
                    'overdue_pending',

                'level' =>
                    $overduePending > 0
                        ? 'warning'
                        : 'success',

                'title' =>
                    'Zamanı geçmiş bekleyen iş',

                'value' =>
                    $overduePending,
            ],
            [
                'key' =>
                    'gps_attention',

                'level' =>
                    $activeWithoutRecentGps > 0
                        ? 'warning'
                        : 'success',

                'title' =>
                    'GPS kontrolü gereken operasyon',

                'value' =>
                    $activeWithoutRecentGps,
            ],
        ];
    }

    private function getUpcomingTransfers(
        Carbon $now
    ): array {
        return Transfer::query()
            ->with([
                'driver.vehicle',
                'supplierCompany',
                'assignedVehicle',
            ])
            ->where(
                'pickup_time',
                '>=',
                $now
            )
            ->whereNotIn(
                'status',
                [
                    'completed',
                    'cancelled',
                    'no_show',
                ]
            )
            ->orderBy('pickup_time')
            ->limit(8)
            ->get()
            ->map(
                function (
                    Transfer $transfer
                ): array {
                    return [
                        'id' =>
                            $transfer->id,

                        'booking_reference' =>
                            $transfer
                                ->booking_reference,

                        'pickup_time' =>
                            $transfer
                                ->pickup_time
                                ?->toISOString(),

                        'passenger_name' =>
                            $transfer
                                ->passenger_name,

                        'pickup' =>
                            $transfer->pickup,

                        'dropoff' =>
                            $transfer->dropoff,

                        'status' =>
                            $transfer->status,

                        'driver_name' =>
                            $transfer
                                ->driver
                                ?->name,

                        'vehicle_plate' =>
                            $transfer
                                ->assignedVehicle
                                ?->plate
                            ?? $transfer
                                ->driver
                                ?->vehicle
                                ?->plate,

                        'supplier_name' =>
                            $transfer
                                ->supplierCompany
                                ?->company_name,
                    ];
                }
            )
            ->values()
            ->all();
    }

    private function getWeeklyActivity(
        Carbon $now
    ): array {
        $start = $now
            ->copy()
            ->subDays(6)
            ->startOfDay();

        $rows = Transfer::query()
            ->where(
                'pickup_time',
                '>=',
                $start
            )
            ->selectRaw(
                "
                DATE(pickup_time) as day,
                COUNT(*) as total,
                SUM(
                    CASE
                        WHEN status = 'completed'
                        THEN 1
                        ELSE 0
                    END
                ) as completed
                "
            )
            ->groupByRaw(
                'DATE(pickup_time)'
            )
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        return collect(
            range(0, 6)
        )
            ->map(
                function (
                    int $offset
                ) use (
                    $start,
                    $rows
                ): array {
                    $date = $start
                        ->copy()
                        ->addDays($offset);

                    $key = $date
                        ->toDateString();

                    $row = $rows->get($key);

                    return [
                        'date' => $key,

                        'label' =>
                            $date->locale('tr')
                                ->isoFormat('dd'),

                        'total' =>
                            (int) (
                                $row?->total ?? 0
                            ),

                        'completed' =>
                            (int) (
                                $row?->completed ?? 0
                            ),
                    ];
                }
            )
            ->values()
            ->all();
    }

    private function getStatusDistribution(): array
    {
        return Transfer::query()
            ->selectRaw(
                'status, COUNT(*) as total'
            )
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(
                fn (Transfer $item): array => [
                    'status' =>
                        $item->status,

                    'total' =>
                        (int) $item
                            ->getRawOriginal(
                                'total'
                            ),
                ]
            )
            ->values()
            ->all();
    }
}