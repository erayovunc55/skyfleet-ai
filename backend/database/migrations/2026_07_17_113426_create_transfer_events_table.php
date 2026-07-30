<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_events', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('transfer_id')
                ->constrained('transfers')
                ->cascadeOnDelete();

            $table
                ->foreignId('driver_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('event_type');
            $table->string('status');

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy', 8, 2)->nullable();

            $table->string('photo_path')->nullable();
            $table->string('call_log_reference')->nullable();

            $table->string('timezone')->default('UTC');
            $table->dateTimeTz('occurred_at');

            $table->text('note')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['transfer_id', 'occurred_at']);
            $table->index(['driver_id', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_events');
    }
};