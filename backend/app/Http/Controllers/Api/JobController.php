<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (! in_array($user->role, ['admin', 'hrd', 'user'], true)) {
            return response()->json([
                'message' => 'Role tidak dikenali',
            ], 403);
        }

        $validated = $request->validate([
            'q' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['all', 'pending', 'approved', 'rejected'])],
        ]);

        $limit = max(1, min((int) $request->integer('limit', 10), 50));
        $search = trim((string) ($validated['q'] ?? ''));
        $statusFilter = (string) ($validated['status'] ?? 'all');

        $query = JobPost::query()
            ->with([
                'company:id,name,logo_url',
                'createdBy:id,name,email',
                'reviewedBy:id,name,email',
            ])
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhereHas('company', function ($companyQuery) use ($search): void {
                            $companyQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($user->role === 'user', function ($query): void {
                $query->where('approval_status', 'approved');
            })
            ->when($user->role === 'hrd', function ($query) use ($user, $statusFilter): void {
                $query->where('created_by_user_id', $user->id);

                if ($statusFilter !== 'all') {
                    $query->where('approval_status', $statusFilter);
                }
            })
            ->when($user->role === 'admin' && $statusFilter !== 'all', function ($query) use ($statusFilter): void {
                $query->where('approval_status', $statusFilter);
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->limit($limit);

        $jobs = $query
            ->get()
            ->map(fn (JobPost $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location,
                'salary_min' => $job->salary_min,
                'salary_max' => $job->salary_max,
                'job_type' => $job->job_type,
                'min_age' => $job->min_age,
                'max_age' => $job->max_age,
                'min_experience_years' => $job->min_experience_years,
                'is_featured' => (bool) $job->is_featured,
                'approval_status' => $job->approval_status,
                'approval_note' => $job->approval_note,
                'company_id' => $job->company_id,
                'created_by' => $job->createdBy ? [
                    'id' => $job->createdBy->id,
                    'name' => $job->createdBy->name,
                    'email' => $job->createdBy->email,
                ] : null,
                'reviewed_by' => $job->reviewedBy ? [
                    'id' => $job->reviewedBy->id,
                    'name' => $job->reviewedBy->name,
                    'email' => $job->reviewedBy->email,
                ] : null,
                'reviewed_at' => $job->reviewed_at?->toIso8601String(),
                'companies' => [
                    'name' => $job->company?->name ?? 'Unknown',
                    'logo_url' => $job->company?->logo_url ?? '',
                ],
            ]);

        return response()->json($jobs);
    }

    public function show(Request $request, JobPost $jobPost): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->role === 'user' && $jobPost->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Lowongan tidak tersedia',
            ], 404);
        }

        if ($user->role === 'hrd' && $jobPost->created_by_user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak dapat mengakses lowongan HRD lain',
            ], 403);
        }

        $jobPost->load([
            'company:id,name,logo_url,description,location',
            'createdBy:id,name,email',
            'reviewedBy:id,name,email',
        ]);

        return response()->json([
            'id' => $jobPost->id,
            'title' => $jobPost->title,
            'description' => $jobPost->description,
            'location' => $jobPost->location,
            'salary_min' => $jobPost->salary_min,
            'salary_max' => $jobPost->salary_max,
            'job_type' => $jobPost->job_type,
            'min_age' => $jobPost->min_age,
            'max_age' => $jobPost->max_age,
            'min_experience_years' => $jobPost->min_experience_years,
            'approval_status' => $jobPost->approval_status,
            'approval_note' => $jobPost->approval_note,
            'created_by' => $jobPost->createdBy ? [
                'id' => $jobPost->createdBy->id,
                'name' => $jobPost->createdBy->name,
                'email' => $jobPost->createdBy->email,
            ] : null,
            'reviewed_by' => $jobPost->reviewedBy ? [
                'id' => $jobPost->reviewedBy->id,
                'name' => $jobPost->reviewedBy->name,
                'email' => $jobPost->reviewedBy->email,
            ] : null,
            'reviewed_at' => $jobPost->reviewed_at?->toIso8601String(),
            'requirements' => $jobPost->requirements ?? [],
            'benefits' => $jobPost->benefits ?? [],
            'companies' => [
                'name' => $jobPost->company?->name ?? 'Unknown',
                'logo_url' => $jobPost->company?->logo_url ?? '',
                'description' => $jobPost->company?->description ?? '',
                'location' => $jobPost->company?->location ?? '',
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->role !== 'hrd') {
            return response()->json([
                'message' => 'Hanya HRD yang dapat menambahkan lowongan',
            ], 403);
        }

        $validated = $request->validate([
            'company_id' => ['required', 'uuid', 'exists:companies,id'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'location' => ['required', 'string', 'max:120'],
            'salary_min' => ['required', 'integer', 'min:0'],
            'salary_max' => ['required', 'integer', 'gte:salary_min'],
            'job_type' => ['required', 'string', 'max:60'],
            'min_age' => ['nullable', 'integer', 'min:16', 'max:80'],
            'max_age' => ['nullable', 'integer', 'gte:min_age', 'max:80'],
            'min_experience_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:255'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $jobPost = JobPost::query()->create([
            'company_id' => $validated['company_id'],
            'created_by_user_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'location' => $validated['location'],
            'salary_min' => $validated['salary_min'],
            'salary_max' => $validated['salary_max'],
            'job_type' => $validated['job_type'],
            'min_age' => $validated['min_age'] ?? null,
            'max_age' => $validated['max_age'] ?? null,
            'min_experience_years' => $validated['min_experience_years'] ?? null,
            'requirements' => $validated['requirements'] ?? [],
            'benefits' => $validated['benefits'] ?? [],
            'is_featured' => false,
            'approval_status' => 'pending',
            'approval_note' => null,
            'reviewed_by_user_id' => null,
            'reviewed_at' => null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return response()->json([
            'message' => 'Lowongan berhasil dibuat dan menunggu persetujuan admin',
            'job' => [
                'id' => $jobPost->id,
                'title' => $jobPost->title,
                'approval_status' => $jobPost->approval_status,
            ],
        ], 201);
    }

    public function update(Request $request, JobPost $jobPost): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'company_id' => ['required', 'uuid', 'exists:companies,id'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'location' => ['required', 'string', 'max:120'],
            'salary_min' => ['required', 'integer', 'min:0'],
            'salary_max' => ['required', 'integer', 'gte:salary_min'],
            'job_type' => ['required', 'string', 'max:60'],
            'min_age' => ['nullable', 'integer', 'min:16', 'max:80'],
            'max_age' => ['nullable', 'integer', 'gte:min_age', 'max:80'],
            'min_experience_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:255'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $jobPost->update([
            'company_id' => $validated['company_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'location' => $validated['location'],
            'salary_min' => $validated['salary_min'],
            'salary_max' => $validated['salary_max'],
            'job_type' => $validated['job_type'],
            'min_age' => $validated['min_age'] ?? null,
            'max_age' => $validated['max_age'] ?? null,
            'min_experience_years' => $validated['min_experience_years'] ?? null,
            'requirements' => $validated['requirements'] ?? [],
            'benefits' => $validated['benefits'] ?? [],
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return response()->json([
            'message' => 'Lowongan berhasil diperbarui',
            'job' => [
                'id' => $jobPost->id,
                'title' => $jobPost->title,
                'approval_status' => $jobPost->approval_status,
            ],
        ]);
    }

    public function destroy(Request $request, JobPost $jobPost): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAdmin($request)) {
            return $response;
        }

        $jobPost->delete();

        return response()->json([
            'message' => 'Lowongan berhasil dihapus',
        ]);
    }

    private function forbiddenIfNotAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Akses khusus admin',
            ], 403);
        }

        return null;
    }
}
