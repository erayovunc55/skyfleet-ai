<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();

            $table->string('plate')->unique();
            $table->string('brand');
            $table->string('model');
            $table->unsignedSmallInteger('year')->nullable();

            $table->string('vehicle_type');
            $table->string('color')->nullable();

            $table->unsignedTinyInteger('passenger_capacity')
                ->default(1);

            $table->unsignedTinyInteger('luggage_capacity')
                ->default(0);

            $table->string('vin')->nullable()->unique();
            $table->string('registration_number')->nullable();

            $table->date('insurance_expiry_date')->nullable();
            $table->date('inspection_expiry_date')->nullable();
            $table->date('next_maintenance_date')->nullable();

            $table->unsignedInteger('current_mileage')
                ->default(0);

            $table->boolean('is_active')->default(true);

            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};