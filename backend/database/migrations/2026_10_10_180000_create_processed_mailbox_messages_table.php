<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_mailbox_messages', function (Blueprint $table): void {
            $table->id();
            $table->char('message_key', 64)->unique();
            $table->string('mailbox');
            $table->string('message_id', 512);
            $table->unsignedBigInteger('transfer_id')->nullable()->index();
            $table->timestamp('processed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_mailbox_messages');
    }
};
