<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'suppliers',
            function (Blueprint $table): void {
                $table
                    ->decimal(
                        'payout_percentage',
                        5,
                        2
                    )
                    ->default(90)
                    ->after('default_currency');
            }
        );

        Schema::table(
            'users',
            function (Blueprint $table): void {
                $table
                    ->foreignId('supplier_id')
                    ->nullable()
                    ->after('vehicle_id')
                    ->constrained('suppliers')
                    ->nullOnDelete();

                $table->index([
                    'supplier_id',
                    'role',
                ]);
            }
        );

        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                /*
                 * İşi gerçekleştirecek gerçek
                 * tedarikçi şirketi.
                 *
                 * Mevcut "supplier" metin alanı
                 * rezervasyon kaynağını korur.
                 */
                $table
                    ->foreignId('supplier_id')
                    ->nullable()
                    ->after('driver_id')
                    ->constrained('suppliers')
                    ->nullOnDelete();

                $table->index([
                    'supplier_id',
                    'pickup_time',
                ]);

                $table->index([
                    'supplier_id',
                    'status',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table->dropIndex([
                    'supplier_id',
                    'status',
                ]);

                $table->dropIndex([
                    'supplier_id',
                    'pickup_time',
                ]);

                $table->dropConstrainedForeignId(
                    'supplier_id'
                );
            }
        );

        Schema::table(
            'users',
            function (Blueprint $table): void {
                $table->dropIndex([
                    'supplier_id',
                    'role',
                ]);

                $table->dropConstrainedForeignId(
                    'supplier_id'
                );
            }
        );

        Schema::table(
            'suppliers',
            function (Blueprint $table): void {
                $table->dropColumn(
                    'payout_percentage'
                );
            }
        );
    }
};