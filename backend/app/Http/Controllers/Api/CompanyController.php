<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        $companies = Company::query()
            ->orderBy('name')
            ->get(['id', 'name', 'location'])
            ->map(fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'location' => $company->location,
            ]);

        return response()->json($companies);
    }
}
