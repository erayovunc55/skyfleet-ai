<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->string('payment_status')->default('not_required')->after('pricing_snapshot');
            $table->string('stripe_checkout_session_id')->nullable()->after('payment_status');
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_checkout_session_id');
            $table->decimal('paid_amount', 10, 2)->nullable()->after('stripe_payment_intent_id');
            $table->string('paid_currency', 10)->nullable()->after('paid_amount');
            $table->timestamp('paid_at')->nullable()->after('paid_currency');

            $table->index('stripe_checkout_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->dropIndex(['stripe_checkout_session_id']);
            $table->dropColumn([
                'payment_status',
                'stripe_checkout_session_id',
                'stripe_payment_intent_id',
                'paid_amount',
                'paid_currency',
                'paid_at',
            ]);
        });
    }
};
