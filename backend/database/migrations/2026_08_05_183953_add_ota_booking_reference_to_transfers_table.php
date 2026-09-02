<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table
                    ->string('ota_booking_reference')
                    ->nullable()
                    ->unique()
                    ->after('booking_reference');
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table->dropUnique([
                    'ota_booking_reference',
                ]);

                $table->dropColumn(
                    'ota_booking_reference'
                );
            }
        );
    }
};