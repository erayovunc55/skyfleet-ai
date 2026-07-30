<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('country_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('native_name')
                ->nullable();

            $table->string('state_region')
                ->nullable();

            $table->string('timezone')
                ->nullable();

            $table->decimal('latitude', 10, 7)
                ->nullable();

            $table->decimal('longitude', 10, 7)
                ->nullable();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            $table->unsignedSmallInteger('sort_order')
                ->default(0);

            $table->json('metadata')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'country_id',
                'name',
                'state_region',
            ]);

            $table->index([
                'country_id',
                'is_active',
            ]);

            $table->index([
                'is_active',
                'sort_order',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};