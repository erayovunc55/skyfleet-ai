<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Models\TransferFinancial;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SupplierPortalInvoiceController extends Controller
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
                    SupplierInvoice::STATUSES
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

        $query = SupplierInvoice::query()
            ->where(
                'supplier_id',
                $supplier->id
            )
            ->withCount('financials')
            ->with([
                'financials' => function (
                    $financialQuery
                ): void {
                    $financialQuery
                        ->select([
                            'transfer_financials.id',
                            'transfer_id',
                            'supplier_payable',
                            'currency',
                            'status',
                        ])
                        ->with([
                            'transfer:id,booking_reference,pickup_time',
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
                        );
                }
            );
        }

        $invoices = $query
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->paginate(
                $validated['per_page'] ?? 25
            );

        $invoices->through(
            fn (
                SupplierInvoice $invoice
            ): array =>
                $this->formatInvoice(
                    $invoice
                )
        );

        return response()->json(
            $invoices
        );
    }

    public function store(
        Request $request
    ): JsonResponse {
        $supplier = $this->resolveSupplier(
            $request
        );

        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'invoice_number' => [
                'required',
                'string',
                'max:100',

                Rule::unique(
                    'supplier_invoices',
                    'invoice_number'
                )->where(
                    fn ($query) =>
                        $query->where(
                            'supplier_id',
                            $supplier->id
                        )
                ),
            ],

            'invoice_date' => [
                'required',
                'date_format:Y-m-d',
            ],

            'due_date' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:invoice_date',
            ],

            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:999999999999.99',
            ],

            'currency' => [
                'required',
                'string',
                'size:3',
            ],

            'financial_ids' => [
                'required',
                'array',
                'min:1',
                'max:200',
            ],

            'financial_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:transfer_financials,id',
            ],

            'file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],

            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $currency = strtoupper(
            trim(
                $validated['currency']
            )
        );

        $financialIds = array_map(
            'intval',
            $validated['financial_ids']
        );

        $financials =
            TransferFinancial::query()
                ->whereIn(
                    'id',
                    $financialIds
                )
                ->get();

        if (
            $financials->count()
            !==
            count($financialIds)
        ) {
            return response()->json([
                'message' =>
                    'Seçilen hakediş kayıtlarından biri bulunamadı.',
            ], 422);
        }

        $foreignFinancialExists =
            $financials->contains(
                fn (
                    TransferFinancial $financial
                ): bool =>
                    (int) $financial->supplier_id
                    !==
                    (int) $supplier->id
            );

        if ($foreignFinancialExists) {
            return response()->json([
                'message' =>
                    'Başka bir tedarikçiye ait hakediş faturaya eklenemez.',
            ], 403);
        }

        $invalidStatusExists =
            $financials->contains(
                fn (
                    TransferFinancial $financial
                ): bool =>
                    !$financial->isApproved()
            );

        if ($invalidStatusExists) {
            return response()->json([
                'message' =>
                    'Faturaya yalnızca onaylanmış hakedişler eklenebilir.',
            ], 422);
        }

        $differentCurrencyExists =
            $financials->contains(
                fn (
                    TransferFinancial $financial
                ): bool =>
                    strtoupper(
                        $financial->currency
                        ?: 'EUR'
                    )
                    !==
                    $currency
            );

        if ($differentCurrencyExists) {
            return response()->json([
                'message' =>
                    'Aynı faturadaki bütün hakedişlerin para birimi aynı olmalıdır.',
            ], 422);
        }

        $alreadyInvoiced =
            SupplierInvoice::query()
                ->where(
                    'supplier_id',
                    $supplier->id
                )
                ->whereNot(
                    'status',
                    SupplierInvoice::STATUS_REJECTED
                )
                ->whereHas(
                    'financials',
                    function (
                        Builder $query
                    ) use ($financialIds): void {
                        $query->whereIn(
                            'transfer_financials.id',
                            $financialIds
                        );
                    }
                )
                ->exists();

        if ($alreadyInvoiced) {
            return response()->json([
                'message' =>
                    'Seçilen hakedişlerden biri daha önce başka bir faturaya eklenmiş.',
            ], 422);
        }

        $financialTotal = round(
            (float) $financials->sum(
                'supplier_payable'
            ),
            2
        );

        $invoiceAmount = round(
            (float) $validated['amount'],
            2
        );

        if (
            abs(
                $financialTotal -
                $invoiceAmount
            ) > 0.01
        ) {
            return response()->json([
                'message' =>
                    'Fatura tutarı seçilen hakedişlerin toplamıyla eşleşmiyor.',

                'expected_amount' =>
                    number_format(
                        $financialTotal,
                        2,
                        '.',
                        ''
                    ),

                'submitted_amount' =>
                    number_format(
                        $invoiceAmount,
                        2,
                        '.',
                        ''
                    ),

                'currency' =>
                    $currency,
            ], 422);
        }

        $uploadedFile =
            $request->file('file');

        $extension = strtolower(
            $uploadedFile
                ->getClientOriginalExtension()
        );

        $storedName = sprintf(
            '%s-%s.%s',
            now()->format(
                'YmdHis'
            ),
            Str::uuid(),
            $extension
        );

        $directory = sprintf(
            'supplier-invoices/%d/%s',
            $supplier->id,
            now()->format('Y/m')
        );

        $fileDisk = 'local';

        $filePath = Storage::disk(
            $fileDisk
        )->putFileAs(
            $directory,
            $uploadedFile,
            $storedName
        );

        if (!$filePath) {
            return response()->json([
                'message' =>
                    'Fatura dosyası kaydedilemedi.',
            ], 500);
        }

        try {
            $invoice = DB::transaction(
                function () use (
                    $supplier,
                    $user,
                    $validated,
                    $currency,
                    $invoiceAmount,
                    $financialIds,
                    $uploadedFile,
                    $fileDisk,
                    $filePath
                ): SupplierInvoice {
                    $invoice =
                        SupplierInvoice::query()
                            ->create([
                                'supplier_id' =>
                                    $supplier->id,

                                'invoice_number' =>
                                    trim(
                                        $validated[
                                            'invoice_number'
                                        ]
                                    ),

                                'invoice_date' =>
                                    $validated[
                                        'invoice_date'
                                    ],

                                'due_date' =>
                                    $validated[
                                        'due_date'
                                    ] ?? null,

                                'amount' =>
                                    $invoiceAmount,

                                'currency' =>
                                    $currency,

                                'status' =>
                                    SupplierInvoice::
                                        STATUS_SUBMITTED,

                                'file_disk' =>
                                    $fileDisk,

                                'file_path' =>
                                    $filePath,

                                'original_name' =>
                                    $uploadedFile
                                        ->getClientOriginalName(),

                                'mime_type' =>
                                    $uploadedFile
                                        ->getMimeType(),

                                'file_size' =>
                                    $uploadedFile
                                        ->getSize(),

                                'submitted_by' =>
                                    $user->id,

                                'note' =>
                                    isset(
                                        $validated['note']
                                    )
                                        ? trim(
                                            $validated[
                                                'note'
                                            ]
                                        )
                                        : null,
                            ]);

                    $invoice
                        ->financials()
                        ->attach(
                            $financialIds
                        );

                    return $invoice;
                }
            );
        } catch (Throwable $exception) {
            Storage::disk(
                $fileDisk
            )->delete(
                $filePath
            );

            throw $exception;
        }

        $invoice->load([
            'financials.transfer',
        ]);

        return response()->json([
            'message' =>
                'Fatura başarıyla gönderildi.',

            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ], 201);
    }

    public function show(
        Request $request,
        SupplierInvoice $invoice
    ): JsonResponse {
        $supplier = $this->resolveSupplier(
            $request
        );

        $this->ensureOwnership(
            $invoice,
            $supplier
        );

        $invoice->load([
            'financials.transfer',
        ]);

        return response()->json([
            'data' =>
                $this->formatInvoice(
                    $invoice
                ),
        ]);
    }

    public function download(
        Request $request,
        SupplierInvoice $invoice
    ): StreamedResponse {
        $supplier = $this->resolveSupplier(
            $request
        );

        $this->ensureOwnership(
            $invoice,
            $supplier
        );

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
                'Tedarikçi hesabı belge yüklemeye açık değil.'
            );
        }

        return $supplier;
    }

    private function ensureOwnership(
        SupplierInvoice $invoice,
        Supplier $supplier
    ): void {
        if (
            (int) $invoice->supplier_id
            !==
            (int) $supplier->id
        ) {
            abort(
                404,
                'Fatura bulunamadı.'
            );
        }
    }

    private function formatInvoice(
        SupplierInvoice $invoice
    ): array {
        return [
            'id' =>
                $invoice->id,

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
                                        $financial->currency,

                                    'status' =>
                                        $financial->status,
                                ];
                            }
                        )
                        ->values()
                        ->all()
                    : [],

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