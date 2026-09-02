<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->foreignId('transfer_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('converted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->dropForeign(['transfer_id']);
            $table->dropForeign(['converted_by_user_id']);
            $table->dropColumn(['transfer_id', 'converted_by_user_id', 'converted_at']);
        });
    }
};
