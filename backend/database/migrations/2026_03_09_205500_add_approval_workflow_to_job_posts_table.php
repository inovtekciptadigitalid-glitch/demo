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
        Schema::table('job_posts', function (Blueprint $table) {
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->after('company_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('approval_status')
                ->default('pending')
                ->after('is_featured');
            $table->text('approval_note')
                ->nullable()
                ->after('approval_status');
            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->after('approval_note')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')
                ->nullable()
                ->after('reviewed_by_user_id');

            $table->index(['approval_status', 'created_at']);
            $table->index('created_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropIndex(['approval_status', 'created_at']);
            $table->dropIndex(['created_by_user_id']);
            $table->dropForeign(['created_by_user_id']);
            $table->dropForeign(['reviewed_by_user_id']);
            $table->dropColumn([
                'created_by_user_id',
                'approval_status',
                'approval_note',
                'reviewed_by_user_id',
                'reviewed_at',
            ]);
        });
    }
};
