<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'transfer_evidences',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->foreignId('transfer_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table
                    ->foreignId('driver_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table
                    ->string('type', 50);

                $table->string('file_path');

                $table
                    ->decimal('latitude', 10, 7)
                    ->nullable();

                $table
                    ->decimal('longitude', 10, 7)
                    ->nullable();

                $table
                    ->decimal('accuracy', 8, 2)
                    ->nullable();

                $table
                    ->text('note')
                    ->nullable();

                $table
                    ->timestamp('recorded_at');

                $table->timestamps();

                $table->index([
                    'transfer_id',
                    'type',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'transfer_evidences'
        );
    }
};