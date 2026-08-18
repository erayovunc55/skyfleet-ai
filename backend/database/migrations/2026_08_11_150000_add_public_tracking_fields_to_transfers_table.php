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
                    ->string(
                        'public_tracking_token',
                        64
                    )
                    ->nullable()
                    ->unique();

                $table
                    ->timestamp(
                        'public_tracking_enabled_at'
                    )
                    ->nullable();

                $table
                    ->timestamp(
                        'public_tracking_expires_at'
                    )
                    ->nullable()
                    ->index();

                $table
                    ->timestamp(
                        'public_tracking_last_viewed_at'
                    )
                    ->nullable();
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'transfers',
            function (Blueprint $table): void {
                $table->dropUnique(
                    'transfers_public_tracking_token_unique'
                );

                $table->dropIndex(
                    'transfers_public_tracking_expires_at_index'
                );

                $table->dropColumn([
                    'public_tracking_token',
                    'public_tracking_enabled_at',
                    'public_tracking_expires_at',
                    'public_tracking_last_viewed_at',
                ]);
            }
        );
    }
};
