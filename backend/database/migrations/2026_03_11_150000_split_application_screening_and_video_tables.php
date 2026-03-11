<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_application_screenings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_application_id')
                ->constrained('job_applications')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->default(0);
            $table->string('result')->nullable();
            $table->text('notes')->nullable();
            $table->json('breakdown')->nullable();
            $table->timestamp('screened_at')->nullable();
            $table->timestamps();

            $table->unique('job_application_id');
        });

        Schema::create('job_application_videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_application_id')
                ->constrained('job_applications')
                ->cascadeOnDelete();
            $table->string('video_path');
            $table->timestamps();

            $table->unique('job_application_id');
        });

        if (Schema::hasColumn('job_applications', 'screening_score')) {
            $rows = DB::table('job_applications')
                ->select([
                    'id',
                    'screening_score',
                    'screening_result',
                    'screening_notes',
                    'screening_breakdown',
                    'screened_at',
                    'created_at',
                    'updated_at',
                ])
                ->get();

            foreach ($rows as $row) {
                if (
                    $row->screening_score !== null ||
                    $row->screening_result !== null ||
                    $row->screening_notes !== null ||
                    $row->screening_breakdown !== null ||
                    $row->screened_at !== null
                ) {
                    DB::table('job_application_screenings')->insert([
                        'id' => (string) Str::uuid(),
                        'job_application_id' => $row->id,
                        'score' => $row->screening_score ?? 0,
                        'result' => $row->screening_result,
                        'notes' => $row->screening_notes,
                        'breakdown' => $row->screening_breakdown,
                        'screened_at' => $row->screened_at,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }
        }

        if (Schema::hasColumn('job_applications', 'intro_video_path')) {
            $rows = DB::table('job_applications')
                ->select(['id', 'intro_video_path', 'created_at', 'updated_at'])
                ->whereNotNull('intro_video_path')
                ->get();

            foreach ($rows as $row) {
                DB::table('job_application_videos')->insert([
                    'id' => (string) Str::uuid(),
                    'job_application_id' => $row->id,
                    'video_path' => $row->intro_video_path,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ]);
            }
        }

        $columnsToDrop = [];
        foreach ([
            'screening_score',
            'screening_result',
            'screening_notes',
            'screening_breakdown',
            'screened_at',
            'intro_video_path',
        ] as $column) {
            if (Schema::hasColumn('job_applications', $column)) {
                $columnsToDrop[] = $column;
            }
        }

        if ($columnsToDrop) {
            Schema::table('job_applications', function (Blueprint $table) use ($columnsToDrop): void {
                $table->dropColumn($columnsToDrop);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->unsignedTinyInteger('screening_score')->default(0)->after('status');
            $table->string('screening_result')->nullable()->after('screening_score');
            $table->text('screening_notes')->nullable()->after('screening_result');
            $table->json('screening_breakdown')->nullable()->after('screening_notes');
            $table->timestamp('screened_at')->nullable()->after('screening_breakdown');
            $table->string('intro_video_path')->nullable()->after('screened_at');
        });

        Schema::dropIfExists('job_application_videos');
        Schema::dropIfExists('job_application_screenings');
    }
};
