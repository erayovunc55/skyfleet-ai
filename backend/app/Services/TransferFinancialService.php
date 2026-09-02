<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\TransferFinancial;
use Illuminate\Support\Facades\DB;

class TransferFinancialService
{
    public function synchronize(
        Transfer $transfer
    ): TransferFinancial {
        return DB::transaction(
            function () use ($transfer) {
                $supplier = $this
                    ->resolveSupplier(
                        $transfer
                    );

                $grossAmount = round(
                    max(
                        0,
                        (float) (
                            $transfer
                                ->getRawOriginal(
                                    'price'
                                )
                            ?? 0
                        )
                    ),
                    2
                );

                $percentage = round(
                    max(
                        0,
                        min(
                            100,
                            (float) (
                                $supplier
                                    ?->payout_percentage
                                ?? 0
                            )
                        )
                    ),
                    2
                );

                $supplierPayable = round(
                    $grossAmount *
                    ($percentage / 100),
                    2
                );

                $platformMargin = round(
                    $grossAmount -
                    $supplierPayable,
                    2
                );

                $financial =
                    TransferFinancial::query()
                        ->firstOrNew([
                            'transfer_id' =>
                                $transfer->id,
                        ]);

                /*
                 * Onaylanmış veya ödenmiş kayıtların
                 * mali tutarları sonradan değiştirilmez.
                 */
                if (
                    $financial->exists &&
                    in_array(
                        $financial->status,
                        [
                            TransferFinancial::
                                STATUS_APPROVED,

                            TransferFinancial::
                                STATUS_PAID,
                        ],
                        true
                    )
                ) {
                    return $financial->fresh([
                        'transfer',
                        'supplier',
                    ]);
                }

                $status =
                    $transfer->status ===
                    'cancelled'
                        ? TransferFinancial::
                            STATUS_CANCELLED
                        : TransferFinancial::
                            STATUS_PENDING;

                $financial->fill([
                    'supplier_id' =>
                        $supplier?->id,

                    'gross_amount' =>
                        $grossAmount,

                    'supplier_percentage' =>
                        $percentage,

                    'supplier_payable' =>
                        $supplierPayable,

                    'platform_margin' =>
                        $platformMargin,

                    'currency' =>
                        strtoupper(
                            (string) (
                                $transfer
                                    ->getRawOriginal(
                                        'currency'
                                    )
                                ?: 'EUR'
                            )
                        ),

                    'status' =>
                        $status,

                    'calculation_source' =>
                        'system',

                    'due_at' =>
                        $transfer->pickup_time
                            ? $transfer
                                ->pickup_time
                                ->copy()
                                ->addDays(7)
                            : now()
                                ->addDays(7),
                ]);

                $financial->save();

                return $financial->fresh([
                    'transfer',
                    'supplier',
                ]);
            }
        );
    }

    public function synchronizeAll(): array
    {
        $processed = 0;
        $failed = 0;
        $errors = [];

        Transfer::query()
            ->orderBy('id')
            ->chunkById(
                100,
                function ($transfers) use (
                    &$processed,
                    &$failed,
                    &$errors
                ) {
                    foreach (
                        $transfers as $transfer
                    ) {
                        try {
                            $this->synchronize(
                                $transfer
                            );

                            $processed++;
                        } catch (\Throwable $exception) {
                            $failed++;

                            $errors[] = [
                                'transfer_id' =>
                                    $transfer->id,

                                'message' =>
                                    $exception
                                        ->getMessage(),
                            ];
                        }
                    }
                }
            );

        return [
            'processed' => $processed,
            'failed' => $failed,
            'errors' => $errors,
        ];
    }

    private function resolveSupplier(
        Transfer $transfer
    ): ?Supplier {
        if (!$transfer->supplier_id) {
            return null;
        }

        return Supplier::query()->find(
            $transfer->supplier_id
        );
    }
}