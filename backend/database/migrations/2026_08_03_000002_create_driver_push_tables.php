<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_push_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('token');
            $table->string('token_hash', 64)->unique();
            $table->string('platform', 30)->default('web');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'platform']);
        });

        Schema::create('driver_push_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 60);
            $table->timestamp('sent_at');
            $table->unsignedInteger('successful_tokens')->default(0);
            $table->timestamps();
            $table->unique(['transfer_id', 'driver_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_push_logs');
        Schema::dropIfExists('driver_push_tokens');
    }
};
