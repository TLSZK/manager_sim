<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\SavedGameController;
use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Require authentication for all game data
Route::middleware('auth:sanctum')->group(function () {
    // Updated User routes
    Route::get('/user', function (Request $request) {
        return response()->json(['data' => $request->user()]);
    });

    Route::put('/user', function (Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $request->user()->update($validated);

        return response()->json(['data' => $request->user()]);
    });

    Route::get('/teams', [TeamController::class, 'index']);

    Route::prefix('managers')->group(function () {
        Route::get('/', [ManagerController::class, 'index']);
        Route::post('/', [ManagerController::class, 'store']);
        Route::put('/{id}', [ManagerController::class, 'update']);
        Route::delete('/{id}', [ManagerController::class, 'destroy']);
        Route::post('/{id}/history', [ManagerController::class, 'addHistory']);
        Route::get('/{id}/save', [SavedGameController::class, 'show']);
        Route::post('/{id}/save', [SavedGameController::class, 'store']);
    });
});
