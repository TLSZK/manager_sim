<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\SavedGameController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\ScheduleController;

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
});