<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Entity
            |--------------------------------------------------------------------------
            |
            | approvable_type:
            | App\Models\Supplier
            | App\Models\Vehicle
            | App\Models\User
            |
            | approvable_id:
            | İlgili kaydın ID değeri
            |
            */

            $table->string('approvable_type');
            $table->unsignedBigInteger('approvable_id');

            /*
            |--------------------------------------------------------------------------
            | Status transition
            |--------------------------------------------------------------------------
            */

            $table->string('old_status')->nullable();
            $table->string('new_status');

            /*
            |--------------------------------------------------------------------------
            | Decision
            |--------------------------------------------------------------------------
            */

            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('reason')->nullable();
            $table->text('note')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Request information
            |--------------------------------------------------------------------------
            */

            $table->string('action')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index([
                'approvable_type',
                'approvable_id',
            ]);

            $table->index([
                'new_status',
                'created_at',
            ]);

            $table->index([
                'changed_by',
                'created_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_logs');
    }
};