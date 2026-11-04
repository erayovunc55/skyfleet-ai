<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_support_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('transfer_id')
                ->constrained('transfers')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Sender
            |--------------------------------------------------------------------------
            |
            | passenger  = Passenger using the public tracking link
            | operation  = Dispatcher / operations team
            | system     = Automated system message
            | ai         = Future AI-generated/support message
            |
            */

            $table->string('sender_type', 30);

            $table->foreignId('sender_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Message
            |--------------------------------------------------------------------------
            */

            $table->text('message');

            /*
            |--------------------------------------------------------------------------
            | Language / Translation
            |--------------------------------------------------------------------------
            |
            | These fields allow the passenger to write in their own language.
            | Translation can be added later without changing the database schema.
            |
            */

            $table->string('original_language', 10)
                ->nullable();

            $table->text('translated_message')
                ->nullable();

            $table->string('translated_language', 10)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Classification
            |--------------------------------------------------------------------------
            |
            | Example categories:
            |
            | general
            | driver_not_found
            | vehicle_not_arrived
            | help
            | emergency
            |
            | Priority:
            |
            | normal
            | high
            | urgent
            | critical
            |
            */

            $table->string('category', 50)
                ->default('general');

            $table->string('priority', 20)
                ->default('normal');

            /*
            |--------------------------------------------------------------------------
            | Read Status
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_read')
                ->default(false);

            $table->timestamp('read_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Additional Metadata
            |--------------------------------------------------------------------------
            |
            | Reserved for future information such as:
            |
            | AI confidence
            | passenger browser
            | translation provider
            | location
            | risk score
            | classification details
            |
            */

            $table->json('metadata')
                ->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'transfer_id',
                'created_at',
            ]);

            $table->index([
                'transfer_id',
                'is_read',
            ]);

            $table->index([
                'priority',
                'created_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'transfer_support_messages'
        );
    }
};
