<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('driver_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('booking_reference')->unique();
            $table->string('ota_source')->default('manual');
            $table->string('supplier');

            $table->string('passenger_name');
            $table->string('passenger_phone')->nullable();
            $table->string('passenger_email')->nullable();

            $table->string('flight_number')->nullable();
            $table->string('airline')->nullable();
            $table->string('terminal')->nullable();

            $table->string('pickup');
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();

            $table->string('dropoff');
            $table->decimal('dropoff_lat', 10, 7)->nullable();
            $table->decimal('dropoff_lng', 10, 7)->nullable();

            $table->dateTime('pickup_time');

            $table->string('meet_point')->nullable();
            $table->text('driver_note')->nullable();
            $table->text('passenger_note')->nullable();

            $table->unsignedInteger('adult')->default(1);
            $table->unsignedInteger('child')->default(0);
            $table->unsignedInteger('baby')->default(0);
            $table->unsignedInteger('luggage_count')->default(0);

            $table->string('vehicle_type')->nullable();

            $table->decimal('price', 10, 2)->default(0);
            $table->string('currency', 3)->default('EUR');

            $table->string('status')->default('pending');

            $table->timestamps();

            $table->index(['driver_id', 'pickup_time']);
            $table->index(['status', 'pickup_time']);
            $table->index('ota_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};