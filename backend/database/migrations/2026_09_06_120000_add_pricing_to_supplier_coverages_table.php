<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_coverages', function (Blueprint $table): void {
            $table->decimal('base_price', 12, 2)->nullable()->after('metadata');
            $table->string('currency', 3)->default('EUR')->after('base_price');
            $table->json('vehicle_prices')->nullable()->after('currency');
            $table->index(['is_active', 'coverage_type', 'currency']);
        });
    }

    public function down(): void
    {
        Schema::table('supplier_coverages', function (Blueprint $table): void {
            $table->dropIndex(['is_active', 'coverage_type', 'currency']);
            $table->dropColumn(['base_price', 'currency', 'vehicle_prices']);
        });
    }
};
