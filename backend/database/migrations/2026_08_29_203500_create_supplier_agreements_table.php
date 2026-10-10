<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_agreements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->cascadeOnDelete();

            $table->foreignId('supplier_document_id')
                ->nullable()
                ->constrained('supplier_documents')
                ->nullOnDelete();

            $table->string('status', 50)
                ->default('pending');

            $table->string('version', 50)
                ->default('1.0');

            $table->string('public_token', 100)
                ->unique();

            $table->timestamp('sent_at')
                ->nullable();

            $table->timestamp('viewed_at')
                ->nullable();

            $table->timestamp('accepted_at')
                ->nullable();

            $table->timestamp('signed_at')
                ->nullable();

            $table->timestamp('rejected_at')
                ->nullable();

            $table->timestamp('expires_at')
                ->nullable();

            $table->string('signer_name')
                ->nullable();

            $table->string('signer_email')
                ->nullable();

            $table->string('accepted_ip', 45)
                ->nullable();

            $table->text('accepted_user_agent')
                ->nullable();

            $table->string('acceptance_hash', 64)
                ->nullable();

            $table->text('rejection_reason')
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index([
                'supplier_id',
                'status',
            ]);

            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_agreements');
    }
};
