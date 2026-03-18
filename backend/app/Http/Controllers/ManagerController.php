<?php

namespace App\Http\Controllers;

use App\Models\Manager;
use Illuminate\Http\Request;

class ManagerController extends Controller
{
    // GET /api/managers
    public function index(Request $request)
    {
        return response()->json([
            'data' => $request->user()->managers()->with([
                'histories' => function ($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'savedGames' 
            ])->get()
        ]);
    }

    // POST /api/managers
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $manager = $request->user()->managers()->create($validated);

        // Bind an empty collection directly instead of querying the DB for a new entity
        $manager->setRelation('histories', collect([]));

        return response()->json([
            'data' => $manager
        ], 201);
    }

    // DELETE /api/managers/{id}
    public function destroy(Request $request, $id)
    {
        // Scoped to the authenticated user to prevent IDOR
        $manager = $request->user()->managers()->findOrFail($id);
        $manager->delete();

        return response()->noContent();
    }

    // PUT /api/managers/{id}
    public function update(Request $request, $id)
    {
        // Scoped to the authenticated user to prevent IDOR
        $manager = $request->user()->managers()->findOrFail($id);
        
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
        // Scoped to the authenticated user to prevent IDOR
        $manager = $request->user()->managers()->findOrFail($id);

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