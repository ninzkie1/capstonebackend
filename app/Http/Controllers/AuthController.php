<?php
namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\PerformerApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('main')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function register(RegisterRequest $request)
    {
        try {
            $validatedData = $request->validated();
    
            // Create user account
            $user = User::create([
                'name' => $validatedData['name'],
                'lastname' => $validatedData['lastname'],
                'email' => $validatedData['email'],
                'password' => bcrypt($validatedData['password']),
                'role' => $validatedData['role'], 
            ]);
    
            // If the role is 'performer', create a pending application instead of the portfolio
            if ($user->role === 'performer') {
                PerformerApplication::create([
                    'user_id' => $user->id,
                    'name' => $validatedData['name'],
                    'lastname' => $validatedData['lastname'],
                    'email' => $validatedData['email'],
                    'password' => bcrypt($validatedData['password']),
                    'talent_name' => $validatedData['talent_name'] ?? '', // Set as empty if not provided
                    'location' => $validatedData['location'] ?? '',
                    'description' => $validatedData['description'] ?? '',
                    'status' => 'PENDING', // Set application as pending
                ]);
            }
    
            // Generate an authentication token
            $token = $user->createToken('main')->plainTextToken;
    
            return response()->json([
                'user' => $user,
                'token' => $token
            ], 201); // HTTP 201 Created
    
        } catch (\Exception $e) {
            // Log error for debugging
            Log::error('Registration error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500); // HTTP 500 Internal Server Error
        }
    }
    

    public function logout(Request $request)
    {
        $user = $request->user();

        $user->currentAccessToken()->delete();

        return response()->json([], 204); // HTTP 204 No Content
    }
}
