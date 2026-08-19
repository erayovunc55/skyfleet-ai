<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_coverages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coverage_type', 30)->default('airport');
            $table->string('label')->nullable();
            $table->unsignedInteger('service_radius_meters')->nullable();
            $table->boolean('pickup_enabled')->default(true);
            $table->boolean('dropoff_enabled')->default(true);
            $table->boolean('is_active')->default(true);
            $table->json('polygon')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['supplier_id', 'is_active']);
            $table->index(['country_id', 'city_id']);
            $table->unique(['supplier_id', 'location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_coverages');
    }
};