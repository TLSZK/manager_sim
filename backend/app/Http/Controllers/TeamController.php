<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;

class TeamController extends Controller
{
    public function index()
    {
        // Team::all() automatically loads the players because of protected $with = ['roster']; in the Team model
        return response()->json(['data' => Team::all()]);
    }
}
