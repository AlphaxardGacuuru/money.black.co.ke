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
        Schema::table('receipts', function(Blueprint $table) {
            $table->string('processing_step')->nullable()->after('status');
            $table->unsignedTinyInteger('processing_attempt')->nullable()->after('processing_step');
            $table->timestamp('processing_step_at')->nullable()->after('processing_attempt');
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function(Blueprint $table) {
            $table->dropColumn(['processing_step', 'processing_attempt', 'processing_step_at']);
        });
    }
};
