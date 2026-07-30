<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {

            $table->string('operational_status')
                ->default('active')
                ->after('is_active');

            $table->string('photo_path')
                ->nullable()
                ->after('operational_status');

            $table->date('casco_expiry_date')
                ->nullable()
                ->after('insurance_expiry_date');

            $table->date('emission_expiry_date')
                ->nullable()
                ->after('inspection_expiry_date');

            $table->unsignedInteger('last_maintenance_mileage')
                ->nullable()
                ->after('current_mileage');

            $table->unsignedInteger('next_maintenance_mileage')
                ->nullable()
                ->after('last_maintenance_mileage');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {

            $table->dropColumn([
                'operational_status',
                'photo_path',
                'casco_expiry_date',
                'emission_expiry_date',
                'last_maintenance_mileage',
                'next_maintenance_mileage',
            ]);

        });
    }
};