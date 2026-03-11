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
        Schema::create('job_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->default('');
            $table->unsignedInteger('salary_min')->default(0);
            $table->unsignedInteger('salary_max')->default(0);
            $table->string('job_type')->default('Full-time');
            $table->json('requirements')->nullable();
            $table->json('benefits')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['is_featured', 'created_at']);
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_posts');
    }
};
