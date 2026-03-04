<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SavedGame extends Model
{
    use HasUuids;
    protected $guarded = [];

    // Auto-convert the big JSON blobs to Arrays for Laravel
    protected $casts = [
        'schedule' => 'array',
        'teams_snapshot' => 'array',
    ];
}
