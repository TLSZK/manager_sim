<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'])
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Define an HttpOnly cookie to store the token securely. 
        $cookie = cookie('auth_token', $token, 60 * 24 * 30, '/', null, false, true, false, 'Lax');

        return response()->json([
            'message' => 'Account created successfully.'
        ], 201)->withCookie($cookie);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $cookie = cookie('auth_token', $token, 60 * 24 * 30, '/', null, false, true, false, 'Lax');

        return response()->json([
            'message' => 'Success'
        ])->withCookie($cookie);
    }

    public function logout(Request $request): JsonResponse
    {
        // Delete the token on the database side
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }
        
        // Delete the HttpOnly cookie on the browser side
        $cookie = Cookie::forget('auth_token');

        return response()->json([
            'message' => 'Logged out successfully.'
        ])->withCookie($cookie);
    }
}