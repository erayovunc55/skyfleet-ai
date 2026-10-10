<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passenger_notification_deliveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('transfer_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('notification_type', 50);
            $table->string('channel', 20);
            $table->string('status', 20)->default('pending');
            $table->string('mode', 20)->default('dry_run');

            $table->string('recipient')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_message_id')->nullable();

            $table->unsignedSmallInteger('attempt_count')->default(0);

            $table->json('payload')->nullable();
            $table->json('metadata')->nullable();
            $table->text('error_message')->nullable();

            $table->timestamp('attempted_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['transfer_id', 'notification_type', 'channel'],
                'passenger_notification_delivery_unique'
            );

            $table->index(
                ['notification_type', 'status'],
                'passenger_notification_type_status_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger_notification_deliveries');
    }
};