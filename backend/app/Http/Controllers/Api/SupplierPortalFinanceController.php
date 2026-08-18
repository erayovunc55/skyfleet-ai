<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\TransferFinancial;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierPortalFinanceController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $supplier = $this->resolveSupplier(
            $request
        );

        $validated = $request->validate([
            'status' => [
                'nullable',
                'string',
                Rule::in(
                    TransferFinancial::STATUSES
                ),
            ],

            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'date_from' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:date_from',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = TransferFinancial::query()
            ->where(
                'supplier_id',
                $supplier->id
            )
            ->with([
                'transfer' => function (
                    $transferQuery
                ): void {
                    $transferQuery->select([
                        'id',
                        'booking_reference',
                        'passenger_name',
                        'pickup',
                        'dropoff',
                        'pickup_time',
                        'status',
                        'supplier_id',
                    ]);
                },
            ]);

        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        if (!empty($validated['date_from'])) {
            $query->whereHas(
                'transfer',
                function (
                    Builder $transferQuery
                ) use ($validated): void {
                    $transferQuery->whereDate(
                        'pickup_time',
                        '>=',
                        $validated['date_from']
                    );
                }
            );
        }

        if (!empty($validated['date_to'])) {
            $query->whereHas(
                'transfer',
                function (
                    Builder $transferQuery
                ) use ($validated): void {
                    $transferQuery->whereDate(
                        'pickup_time',
                        '<=',
                        $validated['date_to']
                    );
                }
            );
        }

        if (!empty($validated['search'])) {
            $search = trim(
                $validated['search']
            );

            $query->whereHas(
                'transfer',
                function (
                    Builder $transferQuery
                ) use ($search): void {
                    $transferQuery->where(
                        function (
                            Builder $searchQuery
                        ) use ($search): void {
                            $searchQuery
                                ->where(
                                    'booking_reference',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'passenger_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'pickup',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'dropoff',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            );
        }

        $financials = $query
            ->orderByDesc('due_at')
            ->orderByDesc('id')
            ->paginate(
                $validated['per_page'] ?? 25
            );

        $financials->through(
            fn (
                TransferFinancial $financial
            ): array =>
                $this->formatFinancial(
                    $financial
                )
        );

        return response()->json([
            'summary' =>
                $this->buildSummary(
                    $supplier
                ),

            'data' =>
                $financials->items(),

            'meta' => [
                'current_page' =>
                    $financials->currentPage(),

                'last_page' =>
                    $financials->lastPage(),

                'per_page' =>
                    $financials->perPage(),

                'total' =>
                    $financials->total(),

                'from' =>
                    $financials->firstItem(),

                'to' =>
                    $financials->lastItem(),
            ],

            'links' => [
                'first' =>
                    $financials->url(1),

                'last' =>
                    $financials->url(
                        $financials->lastPage()
                    ),

                'prev' =>
                    $financials->previousPageUrl(),

                'next' =>
                    $financials->nextPageUrl(),
            ],
        ]);
    }

    public function show(
        Request $request,
        TransferFinancial $financial
    ): JsonResponse {
        $supplier = $this->resolveSupplier(
            $request
        );

        if (
            (int) $financial->supplier_id
            !==
            (int) $supplier->id
        ) {
            abort(
                404,
                'Hakediş kaydı bulunamadı.'
            );
        }

        $financial->load([
            'transfer' => function (
                $transferQuery
            ): void {
                $transferQuery->select([
                    'id',
                    'booking_reference',
                    'passenger_name',
                    'pickup',
                    'dropoff',
                    'pickup_time',
                    'status',
                    'supplier_id',
                ]);
            },
        ]);

        return response()->json([
            'data' =>
                $this->formatFinancial(
                    $financial
                ),
        ]);
    }

    private function resolveSupplier(
        Request $request
    ): Supplier {
        /** @var User|null $user */
        $user = $request->user();

        if (
            !$user
            || $user->role !== 'supplier'
            || !$user->is_active
        ) {
            abort(
                403,
                'Bu alan yalnızca aktif tedarikçi kullanıcıları içindir.'
            );
        }

        if (!$user->supplier_id) {
            abort(
                403,
                'Kullanıcı hesabı bir tedarikçi şirketine bağlı değil.'
            );
        }

        $supplier = Supplier::query()
            ->find(
                $user->supplier_id
            );

        if (!$supplier) {
            abort(
                403,
                'Tedarikçi şirketi bulunamadı.'
            );
        }

        if (!$supplier->canOperate()) {
            abort(
                403,
                'Tedarikçi hesabı finans kullanımına açık değil.'
            );
        }

        return $supplier;
    }

    private function buildSummary(
        Supplier $supplier
    ): array {
        $rows = TransferFinancial::query()
            ->where(
                'supplier_id',
                $supplier->id
            )
            ->selectRaw(
                '
                currency,
                COUNT(*) as record_count,
                SUM(
                    CASE
                        WHEN status != ?
                        THEN supplier_payable
                        ELSE 0
                    END
                ) as total_amount,
                SUM(
                    CASE
                        WHEN status = ?
                        THEN supplier_payable
                        ELSE 0
                    END
                ) as pending_amount,
                SUM(
                    CASE
                        WHEN status = ?
                        THEN supplier_payable
                        ELSE 0
                    END
                ) as approved_amount,
                SUM(
                    CASE
                        WHEN status = ?
                        THEN supplier_payable
                        ELSE 0
                    END
                ) as paid_amount,
                SUM(
                    CASE
                        WHEN status = ?
                        THEN supplier_payable
                        ELSE 0
                    END
                ) as disputed_amount
                ',
                [
                    TransferFinancial::STATUS_CANCELLED,
                    TransferFinancial::STATUS_PENDING,
                    TransferFinancial::STATUS_APPROVED,
                    TransferFinancial::STATUS_PAID,
                    TransferFinancial::STATUS_DISPUTED,
                ]
            )
            ->groupBy('currency')
            ->orderBy('currency')
            ->get();

        return $rows
            ->map(
                fn ($row): array => [
                    'currency' =>
                        $row->currency ?: 'EUR',

                    'record_count' =>
                        (int) $row->record_count,

                    'total_amount' =>
                        $this->formatAmount(
                            $row->total_amount
                        ),

                    'pending_amount' =>
                        $this->formatAmount(
                            $row->pending_amount
                        ),

                    'approved_amount' =>
                        $this->formatAmount(
                            $row->approved_amount
                        ),

                    'paid_amount' =>
                        $this->formatAmount(
                            $row->paid_amount
                        ),

                    'disputed_amount' =>
                        $this->formatAmount(
                            $row->disputed_amount
                        ),
                ]
            )
            ->values()
            ->all();
    }

    private function formatFinancial(
        TransferFinancial $financial
    ): array {
        $transfer = $financial->transfer;

        return [
            'id' =>
                $financial->id,

            'transfer_id' =>
                $financial->transfer_id,

            'booking_reference' =>
                $transfer?->booking_reference,

            'passenger_name' =>
                $transfer?->passenger_name,

            'pickup' =>
                $transfer?->pickup,

            'dropoff' =>
                $transfer?->dropoff,

            'pickup_time' =>
                $transfer?->pickup_time
                    ?->toISOString(),

            'transfer_status' =>
                $transfer?->status,

            /*
             * Tedarikçiye yalnızca kendi
             * net hakedişi gösterilir.
             */
            'supplier_amount' =>
                $this->formatAmount(
                    $financial->supplier_payable
                ),

            'currency' =>
                $financial->currency
                ?: 'EUR',

            'status' =>
                $financial->status,

            'due_at' =>
                $financial->due_at
                    ?->toISOString(),

            'approved_at' =>
                $financial->approved_at
                    ?->toISOString(),

            'paid_at' =>
                $financial->paid_at
                    ?->toISOString(),

            'payment_reference' =>
                $financial->payment_reference,

            'note' =>
                $financial->note,
        ];
    }

    private function formatAmount(
        mixed $amount
    ): string {
        return number_format(
            (float) ($amount ?? 0),
            2,
            '.',
            ''
        );
    }
}