<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_coverages', function (Blueprint $table): void {
            $table->dropUnique([
                'supplier_id',
                'location_id',
            ]);

            $table->index([
                'supplier_id',
                'location_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('supplier_coverages', function (Blueprint $table): void {
            $table->dropIndex([
                'supplier_id',
                'location_id',
            ]);

            $table->unique([
                'supplier_id',
                'location_id',
            ]);
        });
    }
};