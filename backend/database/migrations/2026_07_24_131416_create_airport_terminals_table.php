<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airport_terminals', function (Blueprint $table) {

            $table->id();

            $table->foreignId('airport_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('code')
                ->nullable();

            $table->enum('type',[
                'domestic',
                'international',
                'mixed'
            ])->default('mixed');

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedSmallInteger('sort_order')
                ->default(0);

            $table->json('metadata')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'airport_id',
                'name'
            ]);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airport_terminals');
    }
};