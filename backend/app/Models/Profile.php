<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'full_name',
        'education',
        'age',
        'years_experience',
        'location',
        'phone',
        'bio',
        'avatar_url',
        'is_premium',
    ];

    protected $casts = [
        'age' => 'integer',
        'years_experience' => 'integer',
        'is_premium' => 'boolean',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'user_id');
    }
}
