<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flight_status_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transfer_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 40)->default('aviationstack');
            $table->string('flight_number', 24);
            $table->string('status', 40)->nullable();
            $table->string('airline_name')->nullable();
            $table->string('departure_airport')->nullable();
            $table->string('departure_iata', 8)->nullable();
            $table->string('arrival_airport')->nullable();
            $table->string('arrival_iata', 8)->nullable();
            $table->string('arrival_terminal', 40)->nullable();
            $table->string('arrival_gate', 40)->nullable();
            $table->timestamp('scheduled_arrival_at')->nullable();
            $table->timestamp('estimated_arrival_at')->nullable();
            $table->timestamp('actual_arrival_at')->nullable();
            $table->integer('delay_minutes')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['transfer_id', 'recorded_at']);
            $table->index(['flight_number', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_status_snapshots');
    }
};
