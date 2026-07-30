<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airports', function (Blueprint $table) {

            $table->id();

            $table->foreignId('country_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('city_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');

            $table->char('iata_code',3)->unique();

            $table->char('icao_code',4)
                ->nullable()
                ->unique();

            $table->string('timezone');

            $table->decimal('latitude',10,7)
                ->nullable();

            $table->decimal('longitude',10,7)
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedSmallInteger('sort_order')
                ->default(0);

            $table->json('metadata')
                ->nullable();

            $table->timestamps();

            $table->index([
                'country_id',
                'city_id'
            ]);

            $table->index([
                'is_active',
                'sort_order'
            ]);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airports');
    }
};