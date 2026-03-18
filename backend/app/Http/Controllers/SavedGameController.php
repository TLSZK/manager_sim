<?php

namespace App\Http\Controllers;

use App\Models\SavedGame;
use Illuminate\Http\Request;

class SavedGameController extends Controller
{
    // GET /api/managers/{managerId}/save
    public function show(Request $request, $managerId)
    {
        // Prevent IDOR by ensuring the authenticated user owns this manager
        $manager = $request->user()->managers()->findOrFail($managerId);

        $save = SavedGame::where('manager_id', $manager->id)->first();

        if (!$save) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => $save]);
    }

    // POST /api/managers/{managerId}/save
    public function store(Request $request, $managerId)
    {
        // Prevent IDOR by ensuring the authenticated user owns this manager
        $manager = $request->user()->managers()->findOrFail($managerId);

        // We use 'updateOrCreate' so it overwrites the old save for this manager
        $save = SavedGame::updateOrCreate(
            ['manager_id' => $manager->id],
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