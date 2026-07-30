<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'supplier_branches',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('supplier_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->string('name');
                $table->string('code')->nullable();
                $table->string('slug');

                $table->char('country_code', 2);
                $table->string('country_name')->nullable();

                $table->string('city');
                $table->string('state_region')->nullable();
                $table->string('postal_code')->nullable();
                $table->text('address')->nullable();

                $table->string('contact_name')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('whatsapp')->nullable();

                $table->string('timezone')
                    ->default('UTC');

                $table->char('default_currency', 3)
                    ->default('EUR');

                $table->string('locale')
                    ->default('en');

                $table->string('status')
                    ->default('pending')
                    ->index();

                $table->boolean('is_head_office')
                    ->default(false);

                $table->boolean('is_active')
                    ->default(false)
                    ->index();

                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamp('suspended_at')->nullable();

                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->text('rejection_reason')->nullable();
                $table->text('suspension_reason')->nullable();
                $table->text('admin_note')->nullable();

                $table->json('settings')->nullable();
                $table->json('metadata')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->unique([
                    'supplier_id',
                    'slug',
                ]);

                $table->index([
                    'supplier_id',
                    'status',
                ]);

                $table->index([
                    'country_code',
                    'city',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_branches');
    }
};