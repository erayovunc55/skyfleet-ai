<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Master relations
            |--------------------------------------------------------------------------
            */

            $table->foreignId('location_type_id')
                ->constrained('location_types')
                ->restrictOnDelete();

            $table->foreignId('country_id')
                ->constrained('countries')
                ->restrictOnDelete();

            $table->foreignId('city_id')
                ->constrained('cities')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Optional airport relation
            |--------------------------------------------------------------------------
            |
            | Bir location kaydı havalimanıysa mevcut airports tablosundaki
            | kayıtla ilişkilendirilebilir.
            |
            */

            $table->foreignId('airport_id')
                ->nullable()
                ->unique()
                ->constrained('airports')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Identity
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->string('native_name')
                ->nullable();

            $table->string('slug');

            $table->string('code')
                ->nullable()
                ->unique();

            $table->text('description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */

            $table->string('state_region')
                ->nullable();

            $table->string('district')
                ->nullable();

            $table->string('postal_code')
                ->nullable();

            $table->text('address')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Geographic information
            |--------------------------------------------------------------------------
            */

            $table->decimal('latitude', 10, 7)
                ->nullable();

            $table->decimal('longitude', 10, 7)
                ->nullable();

            $table->unsignedInteger('geofence_radius_meters')
                ->nullable();

            $table->string('timezone')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | External integrations
            |--------------------------------------------------------------------------
            */

            $table->string('google_place_id')
                ->nullable()
                ->unique();

            $table->string('external_reference')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Platform settings
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_public')
                ->default(true);

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->unsignedSmallInteger('sort_order')
                ->default(0);

            $table->json('settings')
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique([
                'city_id',
                'slug',
            ]);

            $table->index([
                'location_type_id',
                'is_active',
            ]);

            $table->index([
                'country_id',
                'city_id',
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
        Schema::dropIfExists('locations');
    }
};