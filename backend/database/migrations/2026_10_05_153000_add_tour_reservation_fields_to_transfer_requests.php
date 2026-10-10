<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table): void {
            $table->string('request_type', 20)->default('transfer')->index();
            $table->string('tour_code', 10)->nullable();
            $table->string('tour_title', 180)->nullable();
            $table->unsignedSmallInteger('tour_adults')->nullable();
            $table->unsignedSmallInteger('tour_children')->nullable();
            $table->unsignedSmallInteger('tour_infants')->nullable();
            $table->decimal('tour_price_total', 10, 2)->nullable();
            $table->string('tour_currency', 3)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table): void {
            $table->dropIndex(['request_type']);
            $table->dropColumn([
                'request_type',
                'tour_code',
                'tour_title',
                'tour_adults',
                'tour_children',
                'tour_infants',
                'tour_price_total',
                'tour_currency',
            ]);
        });
    }
};
