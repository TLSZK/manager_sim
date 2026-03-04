<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Manager extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', // Was account_id
        'name',
    ];

    public function user() // Was account()
    {
        return $this->belongsTo(User::class);
    }

    public function histories()
    {
        return $this->hasMany(ManagerHistory::class);
    }

    public function savedGames()
    {
        return $this->hasMany(SavedGame::class);
    }
}
