<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request, Profile $profile): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAllowed($request, $profile)) {
            return $response;
        }

        return response()->json([
            'id' => $profile->id,
            'full_name' => $profile->full_name,
            'education' => $profile->education,
            'age' => $profile->age,
            'years_experience' => $profile->years_experience,
            'location' => $profile->location,
            'phone' => $profile->phone,
            'bio' => $profile->bio,
            'avatar_url' => $profile->avatar_url,
            'is_premium' => (bool) $profile->is_premium,
        ]);
    }

    public function stats(Request $request, Profile $profile): JsonResponse
    {
        if ($response = $this->forbiddenIfNotAllowed($request, $profile)) {
            return $response;
        }

        $applicationCount = $profile->applications()->count();
        $acceptedCount = $profile
            ->applications()
            ->where('status', 'accepted')
            ->count();

        return response()->json([
            'application_count' => $applicationCount,
            'accepted_count' => $acceptedCount,
            'profile_completion' => 85,
        ]);
    }

    private function forbiddenIfNotAllowed(Request $request, Profile $profile): ?JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->role === 'admin') {
            return null;
        }

        if ($user->profile_id !== $profile->id) {
            return response()->json([
                'message' => 'Akses profil tidak diizinkan',
            ], 403);
        }

        return null;
    }
}
