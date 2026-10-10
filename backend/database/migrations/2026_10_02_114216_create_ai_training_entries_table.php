<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_training_entries', function (Blueprint $table) {
            $table->id();

            $table->text('question');
            $table->longText('answer');

            $table->string('category')->nullable();

            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('airport_code')->nullable();

            $table->string('language', 10)->default('en');

            $table->enum('priority', [
                'low',
                'normal',
                'high',
                'critical',
            ])->default('normal');

            $table->enum('status', [
                'draft',
                'active',
                'inactive',
            ])->default('active');

            $table->unsignedBigInteger('created_by')->nullable();

            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();

            $table->timestamps();

            $table->index('category');
            $table->index('country');
            $table->index('city');
            $table->index('airport_code');
            $table->index('language');
            $table->index('priority');
            $table->index('status');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_training_entries');
    }
};