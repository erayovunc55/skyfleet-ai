<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agencies', function (Blueprint $table): void {
            $table->id();

            $table->string('company_name');
            $table->string('legal_name')->nullable();

            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();

            $table->string('country_code', 2)->nullable();
            $table->string('country_name')->nullable();
            $table->string('city')->nullable();

            $table->string('tax_number')->nullable();
            $table->string('registration_number')->nullable();

            $table->string('default_currency', 3)
                ->default('EUR');

            $table->decimal(
                'discount_percent',
                5,
                2
            )->default(10.00);

            $table->boolean('is_active')
                ->default(true);

            $table->string('status')
                ->default('active');

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->index('company_name');
            $table->index('email');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agencies');
    }
};