<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('transfer_evidences')) {
            return;
        }

        Schema::table('transfer_evidences', function (Blueprint $table) {
            if (!Schema::hasColumn('transfer_evidences', 'accuracy')) {
                $table->decimal('accuracy', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('transfer_evidences', 'wait_minutes')) {
                $table->unsignedSmallInteger('wait_minutes')->nullable();
            }
            if (!Schema::hasColumn('transfer_evidences', 'call_attempts')) {
                $table->unsignedSmallInteger('call_attempts')->default(0);
            }
            if (!Schema::hasColumn('transfer_evidences', 'passenger_called')) {
                $table->boolean('passenger_called')->default(false);
            }
            if (!Schema::hasColumn('transfer_evidences', 'whatsapp_attempted')) {
                $table->boolean('whatsapp_attempted')->default(false);
            }
            if (!Schema::hasColumn('transfer_evidences', 'contact_result')) {
                $table->string('contact_result', 64)->nullable();
            }
        });
    }

    public function down(): void
    {
        // Güvenli dağıtım için geri alma sırasında mevcut üretim alanları silinmez.
    }
};
