<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;

class TeamController extends Controller
{
    public function index()
    {
        // Replaced Team::all() with pagination to prevent memory bloat and latency spikes.
        // The paginator automatically structures the JSON with a root 'data' array.
        return response()->json(
            Team::paginate(50)
        );
    }
}