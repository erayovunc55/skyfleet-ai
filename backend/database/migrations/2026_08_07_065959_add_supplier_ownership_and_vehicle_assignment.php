<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'vehicles',
            function (Blueprint $table): void {
                $table
                    ->foreignId('supplier_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('suppliers')
                    ->nullOnDelete();

                $table->index([
                    'supplier_id',
                    'is_active',
                    'operational_status',
                ]);
            }
        );

        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table
                    ->foreignId(
                        'assigned_vehicle_id'
                    )
                    ->nullable()
                    ->after('driver_id')
                    ->constrained(
                        'vehicles'
                    )
                    ->nullOnDelete();

                $table->index([
                    'supplier_id',
                    'driver_id',
                    'assigned_vehicle_id',
                    'status',
                ], 'transfers_supplier_assignment_index');
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table->dropIndex(
                    'transfers_supplier_assignment_index'
                );

                $table->dropConstrainedForeignId(
                    'assigned_vehicle_id'
                );
            }
        );

        Schema::table(
            'vehicles',
            function (Blueprint $table): void {
                $table->dropIndex([
                    'supplier_id',
                    'is_active',
                    'operational_status',
                ]);

                $table->dropConstrainedForeignId(
                    'supplier_id'
                );
            }
        );
    }
};