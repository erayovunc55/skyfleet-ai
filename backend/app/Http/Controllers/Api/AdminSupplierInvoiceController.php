<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierInvoice;
use App\Models\TransferFinancial;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminSupplierInvoiceController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'nullable',
                'string',
                Rule::in(
                    SupplierInvoice::STATUSES
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

        $query = SupplierInvoice::query()
            ->with([
                'supplier:id,company_name,email,phone,city',
                'submittedBy:id,name,email',
                'reviewedBy:id,name,email',

                'financials' => function (
                    $financialQuery
                ): void {
                    $financialQuery
                        ->select([
                            'transfer_financials.id',
                            'transfer_id',
                            'supplier_id',
                            'supplier_payable',
                            'currency',
                            'status',
                            'due_at',
                            'paid_at',
                            'payment_reference',
                        ])
                        ->with([
                            'transfer:id,booking_reference,passenger_name,pickup_time,status',
                        ]);
                },
            ])
            ->withCount(
                'financials'
            );

        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        if (!empty($validated['supplier_id'])) {
            $query->where(
                'supplier_id',
                $validated['supplier_id']
            );
        }

        if (!empty($validated['currency'])) {
            $query->where(
                'currency',
                strtoupper(
                    $validated['currency']
                )
            );
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate(
                'invoice_date',
                '>=',
                $validated['date_from']
            );
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate(
                'invoice_date',
                '<=',
                $validated['date_to']
            );
        }

        if (!empty($validated['search'])) {
            $search = trim(
                $validated['search']
            );

            $query->where(
                function (
                    Builder $searchQuery
                ) use ($search): void {
                    $searchQuery
                        ->where(
                            'invoice_number',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'original_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'note',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'supplier',
                            function (
                                Builder $supplierQuery
                            ) use ($search): void {
                                $supplierQuery
                                    ->where(
                                        'company_name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'email',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        )
                        ->orWhereHas(
                            'financials.transfer',
                            function (
                                Builder $transferQuery
                            ) use ($search): void {
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
                        );
                }
            );
        }

        $invoices = $query
            ->orderByRaw(
                "
                CASE status
                    WHEN 'submitted' THEN 1
                    WHEN 'revision_requested' THEN 2
                    WHEN 'approved' THEN 3
                    WHEN 'rejected' THEN 4
                    ELSE 5
                END
                "
            )
            ->orderByDesc(
                'invoice_date'
            )
            ->orderByDesc('id')
            ->paginate(
                $validated['per_page']
                ?? 25
            );

        $invoices->through(
            fn (
                SupplierInvoice $invoice
            ): array =>
                $this->formatInvoice(
                    $invoice
                )
        );

        return response()->json([
            'summary' =>
                $this->buildSummary(),

            'data' =>
                $invoices->items(),

            'meta' => [
                'current_page' =>
                    $invoices->currentPage(),

                'last_page' =>
                    $invoices->lastPage(),

                'per_page' =>
                    $invoices->perPage(),

                'total' =>
                    $invoices->total(),

                'from' =>
                    $invoices->firstItem(),

                'to' =>
                    $invoices->lastItem(),
            ],

            'links' => [
                'first' =>
                    $invoices->url(1),

                'last' =>
                    $invoices->url(
                        $invoices->lastPage()
                    ),

                'prev' =>
                    $invoices
                        ->previousPageUrl(),

                'next' =>
                    $invoices
                        ->nextPageUrl(),
            ],
        ]);
    }

    public function show(
        SupplierInvoice $invoice
    ): JsonResponse {
        $invoice->load([
            'supplier:id,company_name,email,phone,city,country_name',
            'submittedBy:id,name,email',
            'reviewedBy:id,name,email',

            'financials' => function (
                $financialQuery
            ): void {
                $financialQuery
                    ->with([
                        'transfer:id,booking_reference,passenger_name,pickup,dropoff,pickup_time,status',
                    ]);
            },
        ]);

        return response()->json([
            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ]);
    }

    public function download(
        SupplierInvoice $invoice
    ): StreamedResponse {
        if (
            !Storage::disk(
                $invoice->file_disk
            )->exists(
                $invoice->file_path
            )
        ) {
            abort(
                404,
                'Fatura dosyası bulunamadı.'
            );
        }

        return Storage::disk(
            $invoice->file_disk
        )->download(
            $invoice->file_path,
            $invoice->original_name,
            [
                'Content-Type' =>
                    $invoice->mime_type
                    ?: 'application/octet-stream',
            ]
        );
    }

    public function approve(
        Request $request,
        SupplierInvoice $invoice
    ): JsonResponse {
        if (!$invoice->canBeReviewed()) {
            return response()->json([
                'message' =>
                    'Bu fatura mevcut durumunda onaylanamaz.',
            ], 422);
        }

        $invoice->update([
            'status' =>
                SupplierInvoice::
                    STATUS_APPROVED,

            'reviewed_by' =>
                $request->user()->id,

            'reviewed_at' =>
                now(),

            'rejection_reason' =>
                null,
        ]);

        $invoice->load([
            'supplier',
            'financials.transfer',
            'reviewedBy',
        ]);

        return response()->json([
            'message' =>
                'Fatura onaylandı.',

            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ]);
    }

    public function requestRevision(
        Request $request,
        SupplierInvoice $invoice
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'min:10',
                'max:2000',
            ],
        ]);

        if (
            !in_array(
                $invoice->status,
                [
                    SupplierInvoice::
                        STATUS_SUBMITTED,

                    SupplierInvoice::
                        STATUS_REVISION_REQUESTED,
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Bu fatura için düzeltme istenemez.',
            ], 422);
        }

        $invoice->update([
            'status' =>
                SupplierInvoice::
                    STATUS_REVISION_REQUESTED,

            'reviewed_by' =>
                $request->user()->id,

            'reviewed_at' =>
                now(),

            'rejection_reason' =>
                trim(
                    $validated['reason']
                ),
        ]);

        $invoice->load([
            'supplier',
            'financials.transfer',
            'reviewedBy',
        ]);

        return response()->json([
            'message' =>
                'Tedarikçiden fatura düzeltmesi istendi.',

            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ]);
    }

    public function reject(
        Request $request,
        SupplierInvoice $invoice
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'min:10',
                'max:2000',
            ],
        ]);

        if (
            $invoice->isApproved()
            || $invoice->isRejected()
        ) {
            return response()->json([
                'message' =>
                    'Bu fatura mevcut durumunda reddedilemez.',
            ], 422);
        }

        $invoice->update([
            'status' =>
                SupplierInvoice::
                    STATUS_REJECTED,

            'reviewed_by' =>
                $request->user()->id,

            'reviewed_at' =>
                now(),

            'rejection_reason' =>
                trim(
                    $validated['reason']
                ),
        ]);

        $invoice->load([
            'supplier',
            'financials.transfer',
            'reviewedBy',
        ]);

        return response()->json([
            'message' =>
                'Fatura reddedildi.',

            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ]);
    }

    private function buildSummary(): array
    {
        $statusCounts =
            SupplierInvoice::query()
                ->selectRaw(
                    'status, COUNT(*) as total'
                )
                ->groupBy('status')
                ->pluck(
                    'total',
                    'status'
                );

        $currencyTotals =
            SupplierInvoice::query()
                ->whereNot(
                    'status',
                    SupplierInvoice::
                        STATUS_REJECTED
                )
                ->selectRaw(
                    '
                    currency,
                    COUNT(*) as invoice_count,
                    SUM(amount) as invoice_amount
                    '
                )
                ->groupBy('currency')
                ->orderBy('currency')
                ->get()
                ->map(
                    fn ($row): array => [
                        'currency' =>
                            $row->currency
                            ?: 'EUR',

                        'invoice_count' =>
                            (int)
                            $row->invoice_count,

                        'invoice_amount' =>
                            number_format(
                                (float)
                                $row->invoice_amount,
                                2,
                                '.',
                                ''
                            ),
                    ]
                )
                ->values()
                ->all();

        return [
            'total' =>
                (int)
                $statusCounts->sum(),

            'submitted' =>
                (int) (
                    $statusCounts[
                        SupplierInvoice::
                            STATUS_SUBMITTED
                    ] ?? 0
                ),

            'approved' =>
                (int) (
                    $statusCounts[
                        SupplierInvoice::
                            STATUS_APPROVED
                    ] ?? 0
                ),

            'revision_requested' =>
                (int) (
                    $statusCounts[
                        SupplierInvoice::
                            STATUS_REVISION_REQUESTED
                    ] ?? 0
                ),

            'rejected' =>
                (int) (
                    $statusCounts[
                        SupplierInvoice::
                            STATUS_REJECTED
                    ] ?? 0
                ),

            'currencies' =>
                $currencyTotals,
        ];
    }

    private function formatInvoice(
        SupplierInvoice $invoice
    ): array {
        return [
            'id' =>
                $invoice->id,

            'supplier' =>
                $invoice->supplier
                    ? [
                        'id' =>
                            $invoice
                                ->supplier
                                ->id,

                        'company_name' =>
                            $invoice
                                ->supplier
                                ->company_name,

                        'email' =>
                            $invoice
                                ->supplier
                                ->email,

                        'phone' =>
                            $invoice
                                ->supplier
                                ->phone,

                        'city' =>
                            $invoice
                                ->supplier
                                ->city,
                    ]
                    : null,

            'invoice_number' =>
                $invoice->invoice_number,

            'invoice_date' =>
                $invoice->invoice_date
                    ?->format('Y-m-d'),

            'due_date' =>
                $invoice->due_date
                    ?->format('Y-m-d'),

            'amount' =>
                number_format(
                    (float) $invoice->amount,
                    2,
                    '.',
                    ''
                ),

            'currency' =>
                $invoice->currency,

            'status' =>
                $invoice->status,

            'original_name' =>
                $invoice->original_name,

            'mime_type' =>
                $invoice->mime_type,

            'file_size' =>
                $invoice->file_size,

            'financial_count' =>
                $invoice->financials_count
                ?? $invoice
                    ->financials
                    ->count(),

            'financials' =>
                $invoice->relationLoaded(
                    'financials'
                )
                    ? $invoice
                        ->financials
                        ->map(
                            function (
                                TransferFinancial $financial
                            ): array {
                                return [
                                    'id' =>
                                        $financial->id,

                                    'booking_reference' =>
                                        $financial
                                            ->transfer
                                            ?->booking_reference,

                                    'passenger_name' =>
                                        $financial
                                            ->transfer
                                            ?->passenger_name,

                                    'pickup_time' =>
                                        $financial
                                            ->transfer
                                            ?->pickup_time
                                            ?->toISOString(),

                                    'supplier_amount' =>
                                        number_format(
                                            (float)
                                            $financial
                                                ->supplier_payable,
                                            2,
                                            '.',
                                            ''
                                        ),

                                    'currency' =>
                                        $financial
                                            ->currency,

                                    'financial_status' =>
                                        $financial
                                            ->status,

                                    'payment_reference' =>
                                        $financial
                                            ->payment_reference,

                                    'paid_at' =>
                                        $financial
                                            ->paid_at
                                            ?->toISOString(),
                                ];
                            }
                        )
                        ->values()
                        ->all()
                    : [],

            'submitted_by' =>
                $invoice->submittedBy
                    ? [
                        'id' =>
                            $invoice
                                ->submittedBy
                                ->id,

                        'name' =>
                            $invoice
                                ->submittedBy
                                ->name,

                        'email' =>
                            $invoice
                                ->submittedBy
                                ->email,
                    ]
                    : null,

            'reviewed_by' =>
                $invoice->reviewedBy
                    ? [
                        'id' =>
                            $invoice
                                ->reviewedBy
                                ->id,

                        'name' =>
                            $invoice
                                ->reviewedBy
                                ->name,

                        'email' =>
                            $invoice
                                ->reviewedBy
                                ->email,
                    ]
                    : null,

            'reviewed_at' =>
                $invoice->reviewed_at
                    ?->toISOString(),

            'rejection_reason' =>
                $invoice->rejection_reason,

            'note' =>
                $invoice->note,

            'created_at' =>
                $invoice->created_at
                    ?->toISOString(),

            'updated_at' =>
                $invoice->updated_at
                    ?->toISOString(),
        ];
    }
}