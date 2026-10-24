<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('receipts', function(Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->constrained()
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->foreignUuid('account_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type');
            $table->string('file_hash', 64);
            $table->string('status')->default('processing');
            $table->string('merchant')->nullable();
            $table->date('receipt_date')->nullable();
            $table->string('currency')->default('KES');
            $table->integer('total')->nullable();
            $table->integer('tax')->nullable();
            $table->integer('discount')->nullable();
            $table->json('extraction')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'file_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
