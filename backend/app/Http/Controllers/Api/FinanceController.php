<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferFinancial;
use App\Services\TransferFinancialService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FinanceController extends Controller
{
    public function __construct(
        private readonly
        TransferFinancialService $financialService
    ) {
    }

    public function index(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:150',
            ],

            'status' => [
                'nullable',
                Rule::in(
                    TransferFinancial::STATUSES
                ),
            ],

            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
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
                'min:10',
                'max:100',
            ],
        ]);

        $query = TransferFinancial::query()
            ->with([
                'supplier',
                'transfer.driver.vehicle',
            ]);

        $this->applyFilters(
            $query,
            $validated
        );

        $summaryQuery =
            TransferFinancial::query();

        $this->applyFilters(
            $summaryQuery,
            $validated
        );

        $summary = $summaryQuery
            ->selectRaw(
                'currency'
            )
            ->selectRaw(
                'COUNT(*) as transfer_count'
            )
            ->selectRaw(
                'SUM(gross_amount) as gross_amount'
            )
            ->selectRaw(
                'SUM(supplier_payable) as supplier_payable'
            )
            ->selectRaw(
                'SUM(platform_margin) as platform_margin'
            )
            ->groupBy('currency')
            ->orderBy('currency')
            ->get()
            ->map(
                fn (
                    TransferFinancial $item
                ): array => [
                    'currency' =>
                        $item->currency,

                    'transfer_count' =>
                        (int) $item
                            ->transfer_count,

                    'gross_amount' =>
                        number_format(
                            (float) $item
                                ->gross_amount,
                            2,
                            '.',
                            ''
                        ),

                    'supplier_payable' =>
                        number_format(
                            (float) $item
                                ->supplier_payable,
                            2,
                            '.',
                            ''
                        ),

                    'platform_margin' =>
                        number_format(
                            (float) $item
                                ->platform_margin,
                            2,
                            '.',
                            ''
                        ),
                ]
            )
            ->values();

        $statusCountsQuery =
            TransferFinancial::query();

        $this->applyFilters(
            $statusCountsQuery,
            $validated,
            false
        );

        $statusCounts =
            $statusCountsQuery
                ->selectRaw(
                    'status, COUNT(*) as total'
                )
                ->groupBy('status')
                ->pluck(
                    'total',
                    'status'
                );

        $financials = $query
            ->latest('id')
            ->paginate(
                (int) (
                    $validated['per_page']
                    ?? 25
                )
            );

        $financials->getCollection()
            ->transform(
                fn (
                    TransferFinancial $financial
                ): array =>
                    $this->formatFinancial(
                        $financial
                    )
            );

        return response()->json([
            'data' =>
                $financials->items(),

            'summary' =>
                $summary,

            'status_counts' => [
                'pending' =>
                    (int) (
                        $statusCounts[
                            TransferFinancial::
                                STATUS_PENDING
                        ] ?? 0
                    ),

                'approved' =>
                    (int) (
                        $statusCounts[
                            TransferFinancial::
                                STATUS_APPROVED
                        ] ?? 0
                    ),

                'paid' =>
                    (int) (
                        $statusCounts[
                            TransferFinancial::
                                STATUS_PAID
                        ] ?? 0
                    ),

                'disputed' =>
                    (int) (
                        $statusCounts[
                            TransferFinancial::
                                STATUS_DISPUTED
                        ] ?? 0
                    ),

                'cancelled' =>
                    (int) (
                        $statusCounts[
                            TransferFinancial::
                                STATUS_CANCELLED
                        ] ?? 0
                    ),
            ],

            'meta' => [
                'current_page' =>
                    $financials->currentPage(),

                'last_page' =>
                    $financials->lastPage(),

                'per_page' =>
                    $financials->perPage(),

                'total' =>
                    $financials->total(),
            ],
        ]);
    }

    public function show(
        TransferFinancial $financial
    ): JsonResponse {
        $financial->load([
            'supplier',
            'transfer.driver.vehicle',
            'approvedBy',
            'paidBy',
        ]);

        return response()->json([
            'data' =>
                $this->formatFinancial(
                    $financial
                ),
        ]);
    }

    public function synchronize(): JsonResponse
    {
        $result =
            $this->financialService
                ->synchronizeAll();

        return response()->json([
            'message' =>
                'Transfer finans kayıtları eşitlendi.',

            'data' =>
                $result,
        ]);
    }

    public function approve(
        Request $request,
        TransferFinancial $financial
    ): JsonResponse {
        $validated = $request->validate([
            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if (
            !in_array(
                $financial->status,
                [
                    TransferFinancial::
                        STATUS_PENDING,

                    TransferFinancial::
                        STATUS_DISPUTED,
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Bu finans kaydı onaylanamaz.',
            ], 422);
        }

        $financial->update([
            'status' =>
                TransferFinancial::
                    STATUS_APPROVED,

            'approved_at' =>
                now(),

            'approved_by' =>
                $request->user()->id,

            'note' =>
                $validated['note']
                ?? $financial->note,
        ]);

        return response()->json([
            'message' =>
                'Tedarikçi hakedişi onaylandı.',

            'data' =>
                $this->freshFinancial(
                    $financial
                ),
        ]);
    }

    public function markPaid(
        Request $request,
        TransferFinancial $financial
    ): JsonResponse {
        $validated = $request->validate([
            'payment_reference' => [
                'required',
                'string',
                'max:150',
            ],

            'paid_at' => [
                'nullable',
                'date',
            ],

            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if (
            $financial->status !==
            TransferFinancial::
                STATUS_APPROVED
        ) {
            return response()->json([
                'message' =>
                    'Yalnızca onaylanmış hakediş ödenmiş olarak işaretlenebilir.',
            ], 422);
        }

        $financial->update([
            'status' =>
                TransferFinancial::
                    STATUS_PAID,

            'paid_at' =>
                $validated['paid_at']
                ?? now(),

            'paid_by' =>
                $request->user()->id,

            'payment_reference' =>
                $validated[
                    'payment_reference'
                ],

            'note' =>
                $validated['note']
                ?? $financial->note,
        ]);

        return response()->json([
            'message' =>
                'Hakediş ödenmiş olarak işaretlendi.',

            'data' =>
                $this->freshFinancial(
                    $financial
                ),
        ]);
    }

    public function dispute(
        Request $request,
        TransferFinancial $financial
    ): JsonResponse {
        $validated = $request->validate([
            'note' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],
        ]);

        if (
            $financial->status ===
            TransferFinancial::STATUS_PAID
        ) {
            return response()->json([
                'message' =>
                    'Ödenmiş kayıt itirazlı duruma alınamaz.',
            ], 422);
        }

        $financial->update([
            'status' =>
                TransferFinancial::
                    STATUS_DISPUTED,

            'note' =>
                $validated['note'],
        ]);

        return response()->json([
            'message' =>
                'Finans kaydı itirazlı duruma alındı.',

            'data' =>
                $this->freshFinancial(
                    $financial
                ),
        ]);
    }

    private function applyFilters(
        Builder $query,
        array $filters,
        bool $includeStatus = true
    ): void {
        if (
            $includeStatus &&
            !empty($filters['status'])
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (
            !empty($filters['supplier_id'])
        ) {
            $query->where(
                'supplier_id',
                $filters['supplier_id']
            );
        }

        if (
            !empty($filters['currency'])
        ) {
            $query->where(
                'currency',
                strtoupper(
                    $filters['currency']
                )
            );
        }

        if (
            !empty($filters['date_from'])
        ) {
            $query->whereHas(
                'transfer',
                fn (Builder $transferQuery) =>
                    $transferQuery
                        ->whereDate(
                            'pickup_time',
                            '>=',
                            $filters[
                                'date_from'
                            ]
                        )
            );
        }

        if (
            !empty($filters['date_to'])
        ) {
            $query->whereHas(
                'transfer',
                fn (Builder $transferQuery) =>
                    $transferQuery
                        ->whereDate(
                            'pickup_time',
                            '<=',
                            $filters[
                                'date_to'
                            ]
                        )
            );
        }

        if (
            !empty($filters['search'])
        ) {
            $search = trim(
                $filters['search']
            );

            $query->where(
                function (
                    Builder $searchQuery
                ) use ($search) {
                    $searchQuery
                        ->where(
                            'payment_reference',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'transfer',
                            function (
                                Builder $transferQuery
                            ) use ($search) {
                                $transferQuery
                                    ->where(
                                        'booking_reference',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'passenger_name',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        )
                        ->orWhereHas(
                            'supplier',
                            fn (
                                Builder $supplierQuery
                            ) =>
                                $supplierQuery
                                    ->where(
                                        'company_name',
                                        'like',
                                        "%{$search}%"
                                    )
                        );
                }
            );
        }
    }

    private function freshFinancial(
        TransferFinancial $financial
    ): array {
        $financial->refresh();

        $financial->load([
            'supplier',
            'transfer.driver.vehicle',
            'approvedBy',
            'paidBy',
        ]);

        return $this->formatFinancial(
            $financial
        );
    }

    private function formatFinancial(
        TransferFinancial $financial
    ): array {
        $transfer = $financial->transfer;
        $supplier = $financial->supplier;

        return [
            'id' =>
                $financial->id,

            'transfer_id' =>
                $financial->transfer_id,

            'booking_reference' =>
                $transfer
                    ?->booking_reference,

            'pickup_time' =>
                $transfer
                    ?->pickup_time
                    ?->toISOString(),

            'passenger_name' =>
                $transfer
                    ?->passenger_name,

            'transfer_status' =>
                $transfer?->status,

            'supplier_id' =>
                $financial->supplier_id,

            'supplier_name' =>
                $supplier
                    ?->company_name,

            'gross_amount' =>
                $financial->gross_amount,

            'supplier_percentage' =>
                $financial
                    ->supplier_percentage,

            'supplier_payable' =>
                $financial
                    ->supplier_payable,

            'platform_margin' =>
                $financial
                    ->platform_margin,

            'currency' =>
                $financial->currency,

            'status' =>
                $financial->status,

            'due_at' =>
                $financial
                    ->due_at
                    ?->toISOString(),

            'approved_at' =>
                $financial
                    ->approved_at
                    ?->toISOString(),

            'approved_by' =>
                $financial
                    ->approvedBy
                    ?->name,

            'paid_at' =>
                $financial
                    ->paid_at
                    ?->toISOString(),

            'paid_by' =>
                $financial
                    ->paidBy
                    ?->name,

            'payment_reference' =>
                $financial
                    ->payment_reference,

            'note' =>
                $financial->note,
        ];
    }
}