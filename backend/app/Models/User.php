<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
// REMOVED HasUuids import

class User extends Authenticatable
{
    // REMOVED HasUuids from the use statement
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name', // Added name
        'email',
        'password'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
        ];
    }

    public function managers()
    {
        return $this->hasMany(Manager::class);
    }
}
