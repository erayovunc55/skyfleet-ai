<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferFinancial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FinanceBulkController extends Controller
{
    public function approve(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
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

            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $result = DB::transaction(
            function () use (
                $validated,
                $request
            ): array {
                $financials =
                    $this->getFinancials(
                        $validated[
                            'financial_ids'
                        ]
                    );

                $approved = [];
                $skipped = [];

                foreach (
                    $financials as $financial
                ) {
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
                        $skipped[] =
                            $financial->id;

                        continue;
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

                    $approved[] =
                        $financial->id;
                }

                return [
                    'approved_ids' =>
                        $approved,

                    'skipped_ids' =>
                        $skipped,
                ];
            }
        );

        return response()->json([
            'message' => sprintf(
                '%d hakediş onaylandı, %d kayıt atlandı.',
                count(
                    $result['approved_ids']
                ),
                count(
                    $result['skipped_ids']
                )
            ),

            'data' => [
                'approved_count' =>
                    count(
                        $result[
                            'approved_ids'
                        ]
                    ),

                'skipped_count' =>
                    count(
                        $result[
                            'skipped_ids'
                        ]
                    ),

                ...$result,
            ],
        ]);
    }

    public function markPaid(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
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

        $result = DB::transaction(
            function () use (
                $validated,
                $request
            ): array {
                $financials =
                    $this->getFinancials(
                        $validated[
                            'financial_ids'
                        ]
                    );

                $payableFinancials =
                    $financials->filter(
                        fn (
                            TransferFinancial
                                $financial
                        ): bool =>
                            $financial->status ===
                            TransferFinancial::
                                STATUS_APPROVED
                    );

                $this->ensureSameSupplierAndCurrency(
                    $payableFinancials
                );

                $paid = [];
                $skipped = [];

                foreach (
                    $financials as $financial
                ) {
                    if (
                        $financial->status !==
                        TransferFinancial::
                            STATUS_APPROVED
                    ) {
                        $skipped[] =
                            $financial->id;

                        continue;
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

                    $paid[] =
                        $financial->id;
                }

                return [
                    'paid_ids' =>
                        $paid,

                    'skipped_ids' =>
                        $skipped,
                ];
            }
        );

        return response()->json([
            'message' => sprintf(
                '%d hakediş ödendi, %d kayıt atlandı.',
                count(
                    $result['paid_ids']
                ),
                count(
                    $result['skipped_ids']
                )
            ),

            'data' => [
                'paid_count' =>
                    count(
                        $result['paid_ids']
                    ),

                'skipped_count' =>
                    count(
                        $result[
                            'skipped_ids'
                        ]
                    ),

                ...$result,
            ],
        ]);
    }

    private function getFinancials(
        array $financialIds
    ): Collection {
        return TransferFinancial::query()
            ->whereIn(
                'id',
                $financialIds
            )
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    private function ensureSameSupplierAndCurrency(
        Collection $financials
    ): void {
        if ($financials->isEmpty()) {
            return;
        }

        $supplierCount =
            $financials
                ->pluck('supplier_id')
                ->unique()
                ->count();

        if ($supplierCount > 1) {
            abort(
                422,
                'Toplu ödeme kayıtları aynı tedarikçiye ait olmalıdır.'
            );
        }

        if (
            $financials
                ->contains(
                    fn (
                        TransferFinancial
                            $financial
                    ): bool =>
                        empty(
                            $financial
                                ->supplier_id
                        )
                )
        ) {
            abort(
                422,
                'Tedarikçi atanmamış kayıt için toplu ödeme yapılamaz.'
            );
        }

        $currencyCount =
            $financials
                ->pluck('currency')
                ->unique()
                ->count();

        if ($currencyCount > 1) {
            abort(
                422,
                'Toplu ödeme kayıtları aynı para biriminde olmalıdır.'
            );
        }
    }
}