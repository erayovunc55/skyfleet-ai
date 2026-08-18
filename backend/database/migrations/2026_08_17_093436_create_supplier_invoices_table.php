<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'supplier_invoices',
            function (
                Blueprint $table
            ): void {
                $table->id();

                $table
                    ->foreignId(
                        'supplier_id'
                    )
                    ->constrained(
                        'suppliers'
                    )
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();

                $table
                    ->string(
                        'invoice_number',
                        100
                    );

                $table
                    ->date(
                        'invoice_date'
                    );

                $table
                    ->date(
                        'due_date'
                    )
                    ->nullable();

                $table
                    ->decimal(
                        'amount',
                        14,
                        2
                    );

                $table
                    ->string(
                        'currency',
                        3
                    )
                    ->default('EUR');

                /*
                 * submitted:
                 * Tedarikçi faturayı gönderdi.
                 *
                 * approved:
                 * Yönetici faturayı onayladı.
                 *
                 * revision_requested:
                 * Tedarikçiden düzeltme istendi.
                 *
                 * rejected:
                 * Fatura reddedildi.
                 */
                $table
                    ->string(
                        'status',
                        30
                    )
                    ->default(
                        'submitted'
                    );

                /*
                 * Fatura dosyaları public
                 * disk yerine private/local
                 * diskte saklanacaktır.
                 */
                $table
                    ->string(
                        'file_disk',
                        50
                    )
                    ->default('local');

                $table
                    ->string(
                        'file_path',
                        500
                    );

                $table
                    ->string(
                        'original_name',
                        255
                    );

                $table
                    ->string(
                        'mime_type',
                        100
                    )
                    ->nullable();

                $table
                    ->unsignedBigInteger(
                        'file_size'
                    )
                    ->nullable();

                $table
                    ->foreignId(
                        'submitted_by'
                    )
                    ->nullable()
                    ->constrained(
                        'users'
                    )
                    ->nullOnDelete();

                $table
                    ->foreignId(
                        'reviewed_by'
                    )
                    ->nullable()
                    ->constrained(
                        'users'
                    )
                    ->nullOnDelete();

                $table
                    ->timestamp(
                        'reviewed_at'
                    )
                    ->nullable();

                $table
                    ->text(
                        'rejection_reason'
                    )
                    ->nullable();

                $table
                    ->text(
                        'note'
                    )
                    ->nullable();

                $table->timestamps();

                $table->unique(
                    [
                        'supplier_id',
                        'invoice_number',
                    ],
                    'supplier_invoice_number_unique'
                );

                $table->index(
                    [
                        'supplier_id',
                        'status',
                    ],
                    'supplier_invoice_status_index'
                );

                $table->index(
                    'invoice_date',
                    'supplier_invoice_date_index'
                );
            }
        );

        /*
         * Bir fatura birden fazla hakedişi,
         * bir hakediş de gerekli durumlarda
         * birden fazla belgeyi kapsayabilir.
         */
        Schema::create(
            'supplier_invoice_financial',
            function (
                Blueprint $table
            ): void {
                $table->id();

                $table
                    ->foreignId(
                        'supplier_invoice_id'
                    )
                    ->constrained(
                        'supplier_invoices'
                    )
                    ->cascadeOnDelete();

                $table
                    ->foreignId(
                        'transfer_financial_id'
                    )
                    ->constrained(
                        'transfer_financials'
                    )
                    ->cascadeOnDelete();

                $table->timestamps();

                $table->unique(
                    [
                        'supplier_invoice_id',
                        'transfer_financial_id',
                    ],
                    'supplier_invoice_financial_unique'
                );

                $table->index(
                    'transfer_financial_id',
                    'invoice_financial_lookup_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'supplier_invoice_financial'
        );

        Schema::dropIfExists(
            'supplier_invoices'
        );
    }
};