<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\SavedGameController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Support\Facades\Http;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Add the logout route and ensure it relies on Sanctum auth
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json(['data' => $request->user()]);
    });
    
    Route::put('/user', function (Request $request) {
        $request->validate(['name' => 'required|string|max:255']);
        $request->user()->update(['name' => $request->name]);
        return response()->json(['data' => $request->user()]);
    });

    Route::get('/teams', [TeamController::class, 'index']);

    Route::get('/managers', [ManagerController::class, 'index']);
    Route::post('/managers', [ManagerController::class, 'store']);
    Route::put('/managers/{id}', [ManagerController::class, 'update']);
    Route::delete('/managers/{id}', [ManagerController::class, 'destroy']);
    Route::post('/managers/{id}/history', [ManagerController::class, 'addHistory']);

    Route::get('/managers/{id}/save', [SavedGameController::class, 'show']);
    Route::post('/managers/{id}/save', [SavedGameController::class, 'store']);

    Route::post('/ask-gemini', function (Request $request) {
        $request->validate([
            'prompt' => 'required|string'
        ]);

        $apiKey = env('GEMINI_API_KEY');
        
        if (!$apiKey) {
            return response()->json(['error' => 'API key not configured on server'], 500);
        }

        // Make the request to Google from the backend
        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $request->prompt]
                    ]
                ]
            ]
        ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Failed to communicate with AI service'], 502);
        }

        return response()->json(['data' => $response->json()]);
    });
});