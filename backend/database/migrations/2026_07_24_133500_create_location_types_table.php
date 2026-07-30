<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'location_types',
            function (Blueprint $table) {
                $table->id();

                $table->string('code')
                    ->unique();

                $table->string('name');

                $table->string('icon')
                    ->nullable();

                $table->text('description')
                    ->nullable();

                $table->boolean(
                    'supports_terminals'
                )->default(false);

                $table->boolean(
                    'supports_scheduled_arrivals'
                )->default(false);

                $table->boolean(
                    'is_public'
                )->default(true);

                $table->boolean('is_active')
                    ->default(true)
                    ->index();

                $table->unsignedSmallInteger(
                    'sort_order'
                )->default(0);

                $table->json('settings')
                    ->nullable();

                $table->json('metadata')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'is_active',
                    'sort_order',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'location_types'
        );
    }
};