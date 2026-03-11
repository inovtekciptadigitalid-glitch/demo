<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/companies', [CompanyController::class, 'index']);
    Route::get('/jobs', [JobController::class, 'index']);
    Route::post('/jobs', [JobController::class, 'store']);
    Route::patch('/jobs/{jobPost}', [JobController::class, 'update']);
    Route::delete('/jobs/{jobPost}', [JobController::class, 'destroy']);
    Route::get('/jobs/{jobPost}', [JobController::class, 'show']);

    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);

    Route::get('/profiles/{profile}', [ProfileController::class, 'show']);
    Route::get('/profiles/{profile}/stats', [ProfileController::class, 'stats']);

    Route::get('/admin/overview', [AdminController::class, 'overview']);
    Route::patch('/admin/jobs/{jobPost}/approval', [AdminController::class, 'reviewJob']);
});
