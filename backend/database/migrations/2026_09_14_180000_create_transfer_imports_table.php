<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_imports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('source', 50)
                ->default('heytrip_excel');

            $table->string('original_filename');

            $table->string('file_path');

            $table->string('status', 30)
                ->default('queued')
                ->index();

            $table->unsignedInteger('total')
                ->default(0);

            $table->unsignedInteger('processed')
                ->default(0);

            $table->unsignedInteger('imported')
                ->default(0);

            $table->unsignedInteger('skipped')
                ->default(0);

            $table->unsignedInteger('failed')
                ->default(0);

            $table->json('errors')
                ->nullable();

            $table->text('failure_message')
                ->nullable();

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamp('failed_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_imports');
    }
};