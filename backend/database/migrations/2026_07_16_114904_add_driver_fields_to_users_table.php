<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->after('name');
            $table->string('role')->default('driver')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->string('vehicle_plate')->nullable()->after('is_active');
            $table->string('supplier')->nullable()->after('vehicle_plate');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'role',
                'is_active',
                'vehicle_plate',
                'supplier',
            ]);
        });
    }
};