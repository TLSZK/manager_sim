<?php

namespace App\Http\Controllers;

use App\Models\Manager;
use Illuminate\Http\Request;

class ManagerController extends Controller
{
    // GET /api/managers
    public function index(Request $request)
    {
        // Only return managers belonging to the logged-in account
        return response()->json([
            'data' => $request->user()->managers
        ]);
    }

    // POST /api/managers
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Attach the new manager directly to the authenticated user
        $manager = $request->user()->managers()->create($validated);

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

        return response()->json([
            'data' => $manager
        ]);
    }

    // POST /api/managers/{id}/history
    // --- THIS IS THE FIX ---
    public function addHistory(Request $request, $id)
    {
        $manager = Manager::findOrFail($id);

        $validated = $request->validate([
            'seasonYear' => 'required|string',
            'teamId' => 'required|string',
            'teamName' => 'required|string',
            'position' => 'required|integer',
            'points' => 'required|integer',
            'wonTrophy' => 'required|boolean',
        ]);

        // FIX: Changed from history() to histories()
        $history = $manager->histories()->create($validated);

        return response()->json([
            'data' => $history
        ], 201);
    }
}
