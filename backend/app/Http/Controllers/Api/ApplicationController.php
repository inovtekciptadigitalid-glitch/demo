<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (! in_array($user->role, ['admin', 'user', 'hrd'], true)) {
            return response()->json([
                'message' => 'Role ini tidak memiliki akses lamaran',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'user_id' => ['nullable', 'uuid', 'exists:profiles,id'],
        ]);

        $status = $validated['status'] ?? 'all';
        $profileIdFilter = $validated['user_id'] ?? null;

        $query = JobApplication::query()
            ->with([
                'jobPost.company:id,name,logo_url',
                'screening',
                'video',
            ])
            ->when($status !== 'all', function ($query) use ($status): void {
                $query->where('status', $status);
            })
            ->orderByDesc('applied_at');

        if ($user->role === 'admin') {
            $query->with('profile:id,full_name,location,phone');

            if ($profileIdFilter) {
                $query->where('user_id', $profileIdFilter);
            }
        } elseif ($user->role === 'hrd') {
            $query
                ->with('profile:id,full_name,location,phone')
                ->whereHas('jobPost', function ($jobQuery) use ($user): void {
                    $jobQuery->where('created_by_user_id', $user->id);
                });
        } else {
            if (! $user->profile_id) {
                return response()->json([
                    'message' => 'Akun user belum terhubung ke profil kandidat',
                ], 422);
            }

            $query->where('user_id', $user->profile_id);
        }

        $baseUrl = $request->getSchemeAndHttpHost();
        $applications = $query
            ->get()
            ->map(function (JobApplication $application) use ($user, $baseUrl): array {
                $screening = $application->screening;
                $introVideoUrl = $application->video?->video_path
                    ? $baseUrl . Storage::url($application->video->video_path)
                    : null;

                $payload = [
                    'id' => $application->id,
                    'status' => $application->status,
                    'screening_score' => $screening?->score,
                    'screening_result' => $screening?->result,
                    'screening_notes' => $screening?->notes,
                    'intro_video_url' => $introVideoUrl,
                    'applied_at' => $application->applied_at?->toIso8601String(),
                    'jobs' => [
                        'id' => $application->jobPost?->id,
                        'title' => $application->jobPost?->title ?? 'Pekerjaan tidak ditemukan',
                        'location' => $application->jobPost?->location ?? '-',
                        'companies' => [
                            'name' => $application->jobPost?->company?->name ?? 'Unknown',
                            'logo_url' => $application->jobPost?->company?->logo_url ?? '',
                        ],
                    ],
                ];

                if (in_array($user->role, ['admin', 'hrd'], true)) {
                    $payload['candidate'] = [
                        'id' => $application->profile?->id,
                        'full_name' => $application->profile?->full_name ?? 'Unknown',
                        'location' => $application->profile?->location ?? '-',
                        'phone' => $application->profile?->phone ?? '-',
                    ];
                }

                return $payload;
            });

        return response()->json($applications);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->role !== 'user') {
            return response()->json([
                'message' => 'Hanya user kandidat yang bisa melamar',
            ], 403);
        }

        if (! $user->profile_id) {
            return response()->json([
                'message' => 'Akun user belum terhubung ke profil kandidat',
            ], 422);
        }

        $validated = $request->validate([
            'job_id' => ['required', 'uuid', 'exists:job_posts,id'],
            'intro_video' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime,video/ogg', 'max:153600'],
        ]);

        $jobPost = JobPost::query()->find($validated['job_id']);

        if (! $jobPost || $jobPost->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Lowongan belum disetujui admin',
            ], 422);
        }

        if ($jobPost->expires_at && $jobPost->expires_at->isPast()) {
            return response()->json([
                'message' => 'Lowongan sudah ditutup',
            ], 422);
        }

        $alreadyApplied = JobApplication::query()
            ->where('user_id', $user->profile_id)
            ->where('job_post_id', $validated['job_id'])
            ->exists();

        if ($alreadyApplied) {
            return response()->json([
                'message' => 'Anda sudah melamar pekerjaan ini',
            ], 409);
        }

        $profile = $user->profile;

        if (! $profile) {
            return response()->json([
                'message' => 'Profil kandidat tidak ditemukan',
            ], 422);
        }

        $screening = $this->buildScreeningResult($profile, $jobPost);
        $videoPath = $request->file('intro_video')->store('intro_videos', 'public');

        try {
            DB::beginTransaction();

            $application = JobApplication::query()->create([
                'user_id' => $user->profile_id,
                'job_post_id' => $validated['job_id'],
                'status' => $screening['status'],
                'cover_letter' => '',
                'applied_at' => now(),
            ]);

            $application->screening()->create([
                'score' => $screening['score'],
                'result' => $screening['result'],
                'notes' => $screening['notes'],
                'breakdown' => $screening['breakdown'],
                'screened_at' => now(),
            ]);

            $application->video()->create([
                'video_path' => $videoPath,
            ]);

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            Storage::disk('public')->delete($videoPath);
            throw $exception;
        }

        return response()->json([
            'message' => 'Lamaran berhasil dikirim',
            'id' => $application->id,
        ], 201);
    }

    private function buildScreeningResult(Profile $profile, JobPost $jobPost): array
    {
        $notes = [];

        $jobLocation = $this->normalizeLocation((string) $jobPost->location);
        $candidateLocation = $this->normalizeLocation((string) $profile->location);
        $isRemote = $this->isRemoteLocation($jobLocation);

        if ($jobLocation === '') {
            $locationMatch = true;
            $notes[] = 'Lokasi lowongan tidak ditentukan';
        } elseif ($isRemote) {
            $locationMatch = true;
            $notes[] = 'Lokasi remote/hybrid';
        } elseif ($candidateLocation === '') {
            $locationMatch = false;
            $notes[] = 'Lokasi kandidat belum diisi';
        } else {
            $locationMatch = str_contains($jobLocation, $candidateLocation)
                || str_contains($candidateLocation, $jobLocation);
            $notes[] = $locationMatch ? 'Lokasi cocok' : 'Lokasi berbeda';
        }

        $requiredExperience = $jobPost->min_experience_years;
        $candidateExperience = $profile->years_experience;
        if ($requiredExperience === null) {
            $experienceMatch = true;
            $notes[] = 'Pengalaman tidak dipersyaratkan';
        } elseif ($candidateExperience === null) {
            $experienceMatch = false;
            $notes[] = 'Pengalaman kandidat belum diisi';
        } else {
            $experienceMatch = $candidateExperience >= $requiredExperience;
            $notes[] = $experienceMatch
                ? 'Pengalaman memenuhi'
                : 'Pengalaman kurang dari syarat';
        }

        $minAge = $jobPost->min_age;
        $maxAge = $jobPost->max_age;
        $candidateAge = $profile->age;
        if ($minAge === null && $maxAge === null) {
            $ageMatch = true;
            $notes[] = 'Rentang usia tidak ditentukan';
        } elseif ($candidateAge === null) {
            $ageMatch = false;
            $notes[] = 'Usia kandidat belum diisi';
        } else {
            $ageMatch = true;
            if ($minAge !== null && $candidateAge < $minAge) {
                $ageMatch = false;
            }
            if ($maxAge !== null && $candidateAge > $maxAge) {
                $ageMatch = false;
            }
            $notes[] = $ageMatch ? 'Usia sesuai' : 'Usia di luar rentang';
        }

        $matches = [
            'location' => $locationMatch,
            'experience' => $experienceMatch,
            'age' => $ageMatch,
        ];
        $matchedCount = count(array_filter($matches));
        $score = (int) round(($matchedCount / 3) * 100);
        $passed = $matchedCount >= 2;

        return [
            'status' => $passed ? 'reviewing' : 'rejected',
            'result' => $passed ? 'pass' : 'fail',
            'score' => $score,
            'notes' => implode(' | ', $notes),
            'breakdown' => [
                'location' => [
                    'job' => $jobPost->location,
                    'candidate' => $profile->location,
                    'match' => $locationMatch,
                ],
                'experience' => [
                    'min_years' => $requiredExperience,
                    'candidate_years' => $candidateExperience,
                    'match' => $experienceMatch,
                ],
                'age' => [
                    'min' => $minAge,
                    'max' => $maxAge,
                    'candidate' => $candidateAge,
                    'match' => $ageMatch,
                ],
                'score' => $score,
                'passed' => $passed,
            ],
        ];
    }

    private function normalizeLocation(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9\\s]/', ' ', $value) ?? '';
        $value = preg_replace('/\\s+/', ' ', $value) ?? '';

        return trim($value);
    }

    private function isRemoteLocation(string $value): bool
    {
        if ($value === '') {
            return false;
        }

        return str_contains($value, 'remote')
            || str_contains($value, 'wfh')
            || str_contains($value, 'work from home')
            || str_contains($value, 'hybrid');
    }
}
