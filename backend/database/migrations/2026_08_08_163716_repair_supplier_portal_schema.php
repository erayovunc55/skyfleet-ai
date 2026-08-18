<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasColumn(
                'suppliers',
                'payout_percentage'
            )
        ) {
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
        }

        if (
            !Schema::hasColumn(
                'users',
                'supplier_id'
            )
        ) {
            Schema::table(
                'users',
                function (Blueprint $table): void {
                    $table
                        ->foreignId('supplier_id')
                        ->nullable()
                        ->after('vehicle_id')
                        ->constrained('suppliers')
                        ->nullOnDelete();
                }
            );
        }

        if (
            !Schema::hasColumn(
                'transfers',
                'supplier_id'
            )
        ) {
            Schema::table(
                'transfers',
                function (Blueprint $table): void {
                    $table
                        ->foreignId('supplier_id')
                        ->nullable()
                        ->after('driver_id')
                        ->constrained('suppliers')
                        ->nullOnDelete();
                }
            );
        }

        if (
            !Schema::hasColumn(
                'vehicles',
                'supplier_id'
            )
        ) {
            Schema::table(
                'vehicles',
                function (Blueprint $table): void {
                    $table
                        ->foreignId('supplier_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('suppliers')
                        ->nullOnDelete();
                }
            );
        }

        if (
            !Schema::hasColumn(
                'transfers',
                'assigned_vehicle_id'
            )
        ) {
            Schema::table(
                'transfers',
                function (Blueprint $table): void {
                    $table
                        ->foreignId(
                            'assigned_vehicle_id'
                        )
                        ->nullable()
                        ->after('driver_id')
                        ->constrained('vehicles')
                        ->nullOnDelete();
                }
            );
        }
    }

    public function down(): void
    {
        /*
         * Bu migration canlı şemayı onarmak için
         * hazırlanmıştır. Var olan üretim verilerini
         * ve sütunlarını yanlışlıkla silmemek amacıyla
         * geri alma işlemi bilinçli olarak boş bırakıldı.
         */
    }
};