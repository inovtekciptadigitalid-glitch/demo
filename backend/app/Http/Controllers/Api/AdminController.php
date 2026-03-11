<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAdmin($request)) {
            return $response;
        }

        $statusSummary = JobApplication::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $jobApprovalSummary = JobPost::query()
            ->selectRaw('approval_status, COUNT(*) as total')
            ->groupBy('approval_status')
            ->pluck('total', 'approval_status');

        $roleSummary = User::query()
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        $baseUrl = $request->getSchemeAndHttpHost();
        $recentApplications = JobApplication::query()
            ->with([
                'jobPost.company:id,name',
                'profile:id,full_name,location',
                'video',
            ])
            ->orderByDesc('applied_at')
            ->limit(10)
            ->get()
            ->map(fn (JobApplication $application): array => [
                'id' => $application->id,
                'status' => $application->status,
                'applied_at' => $application->applied_at?->toIso8601String(),
                'intro_video_url' => $application->video?->video_path
                    ? $baseUrl . Storage::url($application->video->video_path)
                    : null,
                'candidate' => [
                    'id' => $application->profile?->id,
                    'full_name' => $application->profile?->full_name ?? 'Unknown',
                    'location' => $application->profile?->location ?? '-',
                ],
                'job' => [
                    'id' => $application->jobPost?->id,
                    'title' => $application->jobPost?->title ?? 'Pekerjaan tidak ditemukan',
                    'company' => $application->jobPost?->company?->name ?? 'Unknown',
                ],
            ]);

        $pendingJobs = JobPost::query()
            ->with([
                'company:id,name',
                'createdBy:id,name,email',
            ])
            ->where('approval_status', 'pending')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (JobPost $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location,
                'job_type' => $job->job_type,
                'salary_min' => $job->salary_min,
                'salary_max' => $job->salary_max,
                'created_at' => $job->created_at?->toIso8601String(),
                'company' => [
                    'id' => $job->company?->id,
                    'name' => $job->company?->name ?? 'Unknown',
                ],
                'created_by' => [
                    'id' => $job->createdBy?->id,
                    'name' => $job->createdBy?->name ?? 'Unknown',
                    'email' => $job->createdBy?->email ?? '-',
                ],
            ]);

        $accounts = User::query()
            ->orderByDesc('created_at')
            ->limit(30)
            ->get(['id', 'name', 'email', 'role', 'profile_id', 'created_at'])
            ->map(fn (User $account): array => [
                'id' => $account->id,
                'name' => $account->name,
                'email' => $account->email,
                'role' => $account->role,
                'profile_id' => $account->profile_id,
                'created_at' => $account->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'metrics' => [
                'users_total' => User::query()->count(),
                'applicants_total' => Profile::query()->count(),
                'admins_total' => (int) ($roleSummary['admin'] ?? 0),
                'hrd_total' => (int) ($roleSummary['hrd'] ?? 0),
                'users_candidate_total' => (int) ($roleSummary['user'] ?? 0),
                'companies_total' => Company::query()->count(),
                'jobs_total' => JobPost::query()->count(),
                'jobs_pending_approval' => (int) ($jobApprovalSummary['pending'] ?? 0),
                'jobs_approved' => (int) ($jobApprovalSummary['approved'] ?? 0),
                'jobs_rejected' => (int) ($jobApprovalSummary['rejected'] ?? 0),
                'applications_total' => JobApplication::query()->count(),
                'applications_pending' => (int) ($statusSummary['pending'] ?? 0),
                'applications_reviewing' => (int) ($statusSummary['reviewing'] ?? 0),
                'applications_accepted' => (int) ($statusSummary['accepted'] ?? 0),
                'applications_rejected' => (int) ($statusSummary['rejected'] ?? 0),
            ],
            'recent_applications' => $recentApplications,
            'pending_jobs' => $pendingJobs,
            'accounts' => $accounts,
        ]);
    }

    public function reviewJob(Request $request, JobPost $jobPost): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $jobPost->approval_status = $validated['status'];
        $jobPost->approval_note = $validated['note'] ?? null;
        $jobPost->reviewed_by_user_id = $request->user()->id;
        $jobPost->reviewed_at = now();
        $jobPost->save();

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Lowongan berhasil disetujui'
                : 'Lowongan ditolak',
            'job' => [
                'id' => $jobPost->id,
                'approval_status' => $jobPost->approval_status,
                'approval_note' => $jobPost->approval_note,
                'reviewed_at' => $jobPost->reviewed_at?->toIso8601String(),
            ],
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
