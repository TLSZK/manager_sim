<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    public $incrementing = false; // Important for string IDs ('bar', 'rma')
    protected $keyType = 'string';
    protected $guarded = [];

    protected $casts = [
        'isUCL' => 'boolean',
        'stats' => 'array',
        'uclStats' => 'array',
    ];

    // Load roster automatically
    protected $with = ['roster'];

    public function roster()
    {
        return $this->hasMany(Player::class);
    }
}
