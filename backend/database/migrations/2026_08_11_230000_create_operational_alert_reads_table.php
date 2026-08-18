<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'operational_alert_reads',
            function (Blueprint $table): void {
                $table->id();

                $table
                    ->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table
                    ->string('alert_key', 160);

                $table
                    ->timestamp('read_at');

                $table->timestamps();

                $table->unique([
                    'user_id',
                    'alert_key',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'operational_alert_reads'
        );
    }
};
