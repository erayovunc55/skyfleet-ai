<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->json('pricing_snapshot')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transfer_requests', fn (Blueprint $table) => $table->dropColumn('pricing_snapshot'));
    }
};
