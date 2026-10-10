<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_packages', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('region', 120);
            $table->string('title', 180);
            $table->text('description');
            $table->string('image_url', 1000)->nullable();
            $table->string('tag', 80)->nullable();
            $table->string('duration', 80)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_packages');
    }
};
