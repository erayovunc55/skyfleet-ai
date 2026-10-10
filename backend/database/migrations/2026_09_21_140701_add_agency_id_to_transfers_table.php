<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table): void {
            $table->foreignId('agency_id')
                ->nullable()
                ->after('supplier_id')
                ->constrained('agencies')
                ->nullOnDelete();

            $table->index([
                'agency_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table): void {
            $table->dropIndex([
                'agency_id',
                'status',
            ]);

            $table->dropConstrainedForeignId(
                'agency_id'
            );
        });
    }
};