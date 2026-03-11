<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPost extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'company_id',
        'created_by_user_id',
        'title',
        'description',
        'location',
        'salary_min',
        'salary_max',
        'job_type',
        'min_age',
        'max_age',
        'min_experience_years',
        'requirements',
        'benefits',
        'is_featured',
        'approval_status',
        'approval_note',
        'reviewed_by_user_id',
        'reviewed_at',
        'expires_at',
    ];

    protected $casts = [
        'salary_min' => 'integer',
        'salary_max' => 'integer',
        'requirements' => 'array',
        'benefits' => 'array',
        'min_age' => 'integer',
        'max_age' => 'integer',
        'min_experience_years' => 'integer',
        'is_featured' => 'boolean',
        'reviewed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
