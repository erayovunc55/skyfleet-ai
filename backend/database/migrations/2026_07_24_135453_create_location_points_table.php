<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_points', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Parent location
            |--------------------------------------------------------------------------
            */

            $table->foreignId('location_id')
                ->constrained('locations')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Optional airport terminal relation
            |--------------------------------------------------------------------------
            */

            $table->foreignId('airport_terminal_id')
                ->nullable()
                ->constrained('airport_terminals')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Identity
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->string('code')
                ->nullable();

            $table->string('point_type')
                ->default('meeting_point')
                ->index();

            $table->text('description')
                ->nullable();

            $table->text('instructions')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Geographic data
            |--------------------------------------------------------------------------
            */

            $table->decimal('latitude', 10, 7)
                ->nullable();

            $table->decimal('longitude', 10, 7)
                ->nullable();

            $table->unsignedInteger('geofence_radius_meters')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Operational settings
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_pickup_allowed')
                ->default(true);

            $table->boolean('is_dropoff_allowed')
                ->default(true);

            $table->boolean('requires_meet_and_greet')
                ->default(false);

            $table->boolean('is_public')
                ->default(true);

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->unsignedSmallInteger('sort_order')
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | Integrations and metadata
            |--------------------------------------------------------------------------
            */

            $table->string('external_reference')
                ->nullable();

            $table->json('settings')
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique([
                'location_id',
                'code',
            ]);

            $table->index([
                'location_id',
                'is_active',
            ]);

            $table->index([
                'airport_terminal_id',
                'is_active',
            ]);

            $table->index([
                'latitude',
                'longitude',
            ]);

            $table->index([
                'is_active',
                'sort_order',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_points');
    }
};
