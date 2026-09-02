<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'transfer_financials',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->foreignId('transfer_id')
                    ->unique()
                    ->constrained('transfers')
                    ->cascadeOnDelete();

                $table
                    ->foreignId('supplier_id')
                    ->nullable()
                    ->constrained('suppliers')
                    ->nullOnDelete();

                /*
                 * Rezervasyonun müşteriye veya
                 * ana platforma satış fiyatı.
                 */
                $table
                    ->decimal(
                        'gross_amount',
                        12,
                        2
                    )
                    ->default(0);

                /*
                 * Finans kaydı oluşturulduğu
                 * andaki tedarikçi ödeme yüzdesi.
                 * Sonradan tedarikçinin yüzdesi
                 * değişse bile geçmiş kayıt değişmez.
                 */
                $table
                    ->decimal(
                        'supplier_percentage',
                        5,
                        2
                    )
                    ->default(0);

                /*
                 * Tedarikçiye ödenecek tutar.
                 */
                $table
                    ->decimal(
                        'supplier_payable',
                        12,
                        2
                    )
                    ->default(0);

                /*
                 * Skyfleet brüt platform marjı.
                 */
                $table
                    ->decimal(
                        'platform_margin',
                        12,
                        2
                    )
                    ->default(0);

                $table
                    ->string(
                        'currency',
                        3
                    )
                    ->default('EUR');

                /*
                 * pending   : Hakediş bekliyor
                 * approved  : Hakediş onaylandı
                 * paid      : Ödeme tamamlandı
                 * disputed  : İtirazlı işlem
                 * cancelled : Finans kaydı iptal
                 */
                $table
                    ->string(
                        'status',
                        20
                    )
                    ->default('pending')
                    ->index();

                /*
                 * Hesaplamanın hangi yöntemle
                 * oluşturulduğunu belirtir.
                 */
                $table
                    ->string(
                        'calculation_source',
                        30
                    )
                    ->default('system');

                $table
                    ->timestamp('due_at')
                    ->nullable()
                    ->index();

                $table
                    ->timestamp('approved_at')
                    ->nullable();

                $table
                    ->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table
                    ->timestamp('paid_at')
                    ->nullable()
                    ->index();

                $table
                    ->foreignId('paid_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table
                    ->string(
                        'payment_reference',
                        150
                    )
                    ->nullable();

                $table
                    ->text('note')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'supplier_id',
                    'status',
                ]);

                $table->index([
                    'currency',
                    'status',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'transfer_financials'
        );
    }
};