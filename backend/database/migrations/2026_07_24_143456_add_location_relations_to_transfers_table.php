<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->foreignId('pickup_location_id')
                ->nullable()
                ->after('pickup')
                ->constrained('locations')
                ->nullOnDelete();

            $table->foreignId('pickup_point_id')
                ->nullable()
                ->after('pickup_location_id')
                ->constrained('location_points')
                ->nullOnDelete();

            $table->foreignId('dropoff_location_id')
                ->nullable()
                ->after('dropoff')
                ->constrained('locations')
                ->nullOnDelete();

            $table->foreignId('dropoff_point_id')
                ->nullable()
                ->after('dropoff_location_id')
                ->constrained('location_points')
                ->nullOnDelete();

            $table->index([
                'pickup_location_id',
                'pickup_point_id',
            ]);

            $table->index([
                'dropoff_location_id',
                'dropoff_point_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropForeign([
                'pickup_location_id',
            ]);

            $table->dropForeign([
                'pickup_point_id',
            ]);

            $table->dropForeign([
                'dropoff_location_id',
            ]);

            $table->dropForeign([
                'dropoff_point_id',
            ]);

            $table->dropIndex([
                'pickup_location_id',
                'pickup_point_id',
            ]);

            $table->dropIndex([
                'dropoff_location_id',
                'dropoff_point_id',
            ]);

            $table->dropColumn([
                'pickup_location_id',
                'pickup_point_id',
                'dropoff_location_id',
                'dropoff_point_id',
            ]);
        });
    }
};