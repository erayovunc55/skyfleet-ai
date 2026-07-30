<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Company identity
            |--------------------------------------------------------------------------
            */

            $table->string('company_name');
            $table->string('legal_name')->nullable();

            $table->string('slug')->unique();

            $table->string('tax_number')->nullable();
            $table->string('registration_number')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Contact
            |--------------------------------------------------------------------------
            */

            $table->string('contact_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('website')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            $table->char('country_code', 2);
            $table->string('country_name')->nullable();

            $table->string('city')->nullable();
            $table->string('state_region')->nullable();

            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Platform status
            |--------------------------------------------------------------------------
            */

            $table->string('status')
                ->default('pending')
                ->index();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('suspended_at')->nullable();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Review information
            |--------------------------------------------------------------------------
            */

            $table->text('rejection_reason')->nullable();
            $table->text('suspension_reason')->nullable();
            $table->text('admin_note')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Supplier settings
            |--------------------------------------------------------------------------
            */

            $table->string('timezone')
                ->default('UTC');

            $table->char('default_currency', 3)
                ->default('EUR');

            $table->string('locale')
                ->default('en');

            $table->boolean('is_active')
                ->default(false)
                ->index();

            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'country_code',
                'city',
            ]);

            $table->index([
                'status',
                'is_active',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};