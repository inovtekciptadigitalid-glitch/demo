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
        Schema::table('profiles', function (Blueprint $table) {
            $table->unsignedTinyInteger('years_experience')
                ->nullable()
                ->after('age');
        });

        Schema::table('job_posts', function (Blueprint $table) {
            $table->unsignedTinyInteger('min_age')
                ->nullable()
                ->after('job_type');
            $table->unsignedTinyInteger('max_age')
                ->nullable()
                ->after('min_age');
            $table->unsignedTinyInteger('min_experience_years')
                ->nullable()
                ->after('max_age');
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->unsignedTinyInteger('screening_score')
                ->default(0)
                ->after('status');
            $table->string('screening_result')
                ->nullable()
                ->after('screening_score');
            $table->text('screening_notes')
                ->nullable()
                ->after('screening_result');
            $table->json('screening_breakdown')
                ->nullable()
                ->after('screening_notes');
            $table->timestamp('screened_at')
                ->nullable()
                ->after('screening_breakdown');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn([
                'screening_score',
                'screening_result',
                'screening_notes',
                'screening_breakdown',
                'screened_at',
            ]);
        });

        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn([
                'min_age',
                'max_age',
                'min_experience_years',
            ]);
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('years_experience');
        });
    }
};
