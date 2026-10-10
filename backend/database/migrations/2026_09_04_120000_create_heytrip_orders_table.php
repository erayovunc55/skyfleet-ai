<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('heytrip_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transfer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('partner_order_number')->unique();
            $table->string('heytrip_order_number')->nullable()->index();
            $table->string('status')->default('quote');
            $table->string('currency', 3)->default('EUR');
            $table->decimal('provider_total', 12, 2)->nullable();
            $table->decimal('markup_percent', 6, 2)->default(15);
            $table->decimal('customer_total', 12, 2)->nullable();
            $table->decimal('cancel_loss_fee', 12, 2)->nullable();
            $table->json('quote_payload')->nullable();
            $table->json('booking_payload')->nullable();
            $table->json('last_detail_payload')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_synced_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('heytrip_orders');
    }
};
