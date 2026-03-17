<?php

namespace App\Http\Controllers;

use App\Models\SavedGame;
use Illuminate\Http\Request;

class SavedGameController extends Controller
{
    // GET /api/managers/{managerId}/save
    public function show($managerId)
    {
        $save = SavedGame::where('manager_id', $managerId)->first();

        if (!$save) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => $save]);
    }

    // POST /api/managers/{managerId}/save
    public function store(Request $request, $managerId)
    {
        // We use 'updateOrCreate' so it overwrites the old save for this manager
        $save = SavedGame::updateOrCreate(
            ['manager_id' => $managerId],
            [
                'currentWeek' => $request->input('currentWeek'),
                'userTeamId' => $request->input('userTeamId'),
                'schedule' => $request->input('schedule'),       // Stored as JSON automatically via cast
                'teams_snapshot' => $request->input('teams'),    // Stored as JSON automatically via cast
            ]
        );

        return response()->json(['data' => $save]);
    }
}