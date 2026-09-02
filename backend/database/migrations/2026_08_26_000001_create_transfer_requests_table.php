<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_reference', 32)->unique();
            $table->string('status', 20)->default('new')->index();
            $table->string('pickup', 1000);
            $table->string('dropoff', 1000);
            $table->date('pickup_date');
            $table->time('pickup_time');
            $table->string('timezone', 100)->default('UTC');
            $table->string('flight_number', 50)->nullable();
            $table->unsignedSmallInteger('passengers');
            $table->unsignedSmallInteger('luggage_count')->default(0);
            $table->string('vehicle_type', 100)->nullable();
            $table->string('passenger_name');
            $table->string('passenger_phone', 50);
            $table->string('passenger_email');
            $table->text('note')->nullable();
            $table->string('locale', 5)->default('en');
            $table->string('source', 50)->default('public_website');
            $table->timestamps();

            $table->index(['pickup_date', 'status']);
            $table->index(['passenger_email', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_requests');
    }
};
