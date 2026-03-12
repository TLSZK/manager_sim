<?php

namespace App\Http\Controllers;

use App\Models\Manager;
use Illuminate\Http\Request;

class ManagerController extends Controller
{
    // GET /api/managers
    public function index(Request $request)
    {
        // FIX: Eager load the 'histories' relationship so achievements are saved and sent to the frontend
        return response()->json([
            'data' => $request->user()->managers()->with(['histories' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])->get()
        ]);
    }

    // POST /api/managers
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $manager = $request->user()->managers()->create($validated);

        // Load empty histories for immediate consistency
        $manager->load('histories');

        return response()->json([
            'data' => $manager
        ], 201);
    }

    // DELETE /api/managers/{id}
    public function destroy($id)
    {
        $manager = Manager::findOrFail($id);
        $manager->delete();

        return response()->noContent();
    }

    // PUT /api/managers/{id}
    public function update(Request $request, $id)
    {
        $manager = Manager::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $manager->update($validated);
        $manager->load('histories');

        return response()->json([
            'data' => $manager
        ]);
    }

    // POST /api/managers/{id}/history
    public function addHistory(Request $request, $id)
    {
        $manager = Manager::findOrFail($id);

        $validated = $request->validate([
            'seasonYear' => 'required|string',
            'teamId' => 'required|string',
            'teamName' => 'required|string',
            'position' => 'required|integer',
            'points' => 'required|integer',
            'wonLiga' => 'required|boolean',
            'wonUcl' => 'required|boolean',
            'wins' => 'required|integer',
            'draws' => 'required|integer',
            'losses' => 'required|integer',
            'biggestWin' => 'required|string',
            'biggestLoss' => 'required|string',
        ]);

        $history = $manager->histories()->create($validated);

        return response()->json([
            'data' => $history
        ], 201);
    }
}
