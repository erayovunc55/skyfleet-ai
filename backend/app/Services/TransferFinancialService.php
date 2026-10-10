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
    ): ?TransferFinancial {
        return DB::transaction(
            function () use ($transfer) {
                $financial =
                    TransferFinancial::query()
                        ->where(
                            'transfer_id',
                            $transfer->id
                        )
                        ->first();

                /*
                |--------------------------------------------------------------------------
                | Completed değilse yeni cari oluşturma
                |--------------------------------------------------------------------------
                */

                if (
                    $transfer->status !==
                    'completed'
                ) {
                    if (!$financial) {
                        return null;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Approved / Paid kayıtları otomatik bozma
                    |--------------------------------------------------------------------------
                    */

                    if (
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

                    /*
                    |--------------------------------------------------------------------------
                    | Önceden yanlışlıkla açılmış pending/disputed kayıt
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $financial->status !==
                        TransferFinancial::
                            STATUS_CANCELLED
                    ) {
                        $financial->update([
                            'status' =>
                                TransferFinancial::
                                    STATUS_CANCELLED,

                            'note' =>
                                $this->appendNote(
                                    $financial->note,
                                    'Transfer completed olmadığı için finans kaydı sistem tarafından iptal edildi.'
                                ),
                        ]);
                    }

                    return $financial->fresh([
                        'transfer',
                        'supplier',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Completed transfer için supplier çöz
                |--------------------------------------------------------------------------
                */

                $supplier =
                    $this->resolveSupplier(
                        $transfer
                    );

                /*
                |--------------------------------------------------------------------------
                | Supplier yoksa cari oluşturma
                |--------------------------------------------------------------------------
                */

                if (!$supplier) {
                    return null;
                }

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
                                    ->payout_percentage
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

                /*
                |--------------------------------------------------------------------------
                | Mevcut finans kaydı yoksa oluştur
                |--------------------------------------------------------------------------
                */

                if (!$financial) {
                    $financial =
                        new TransferFinancial([
                            'transfer_id' =>
                                $transfer->id,
                        ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Approved / Paid kayıtların mali tutarlarını bozma
                |--------------------------------------------------------------------------
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

                /*
                |--------------------------------------------------------------------------
                | Completed olduğunda cari pending açılır
                |--------------------------------------------------------------------------
                */

                $financial->fill([
                    'supplier_id' =>
                        $supplier->id,

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
                        TransferFinancial::
                            STATUS_PENDING,

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
        $createdOrUpdated = 0;
        $skipped = 0;
        $cancelled = 0;
        $failed = 0;
        $errors = [];

        Transfer::query()
            ->orderBy('id')
            ->chunkById(
                100,
                function ($transfers) use (
                    &$processed,
                    &$createdOrUpdated,
                    &$skipped,
                    &$cancelled,
                    &$failed,
                    &$errors
                ) {
                    foreach (
                        $transfers as $transfer
                    ) {
                        try {
                            $before =
                                TransferFinancial::query()
                                    ->where(
                                        'transfer_id',
                                        $transfer->id
                                    )
                                    ->first();

                            $beforeStatus =
                                $before?->status;

                            $financial =
                                $this->synchronize(
                                    $transfer
                                );

                            $processed++;

                            if (
                                $transfer->status ===
                                'completed'
                            ) {
                                if ($financial) {
                                    $createdOrUpdated++;
                                } else {
                                    $skipped++;
                                }

                                continue;
                            }

                            if (
                                $financial &&
                                $beforeStatus !==
                                    TransferFinancial::
                                        STATUS_CANCELLED &&
                                $financial->status ===
                                    TransferFinancial::
                                        STATUS_CANCELLED
                            ) {
                                $cancelled++;
                            } else {
                                $skipped++;
                            }
                        } catch (
                            \Throwable $exception
                        ) {
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
            'processed' =>
                $processed,

            'created_or_updated' =>
                $createdOrUpdated,

            'cancelled' =>
                $cancelled,

            'skipped' =>
                $skipped,

            'failed' =>
                $failed,

            'errors' =>
                $errors,
        ];
    }

    private function resolveSupplier(
        Transfer $transfer
    ): ?Supplier {
        if (
            !$transfer->supplier_id
        ) {
            return null;
        }

        return Supplier::query()
            ->find(
                $transfer->supplier_id
            );
    }

    private function appendNote(
        ?string $currentNote,
        string $message
    ): string {
        $currentNote =
            trim(
                (string) $currentNote
            );

        $message =
            trim($message);

        if ($currentNote === '') {
            return $message;
        }

        if (
            str_contains(
                $currentNote,
                $message
            )
        ) {
            return $currentNote;
        }

        return
            $currentNote
            . PHP_EOL
            . $message;
    }
}