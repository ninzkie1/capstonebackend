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

            // Initialize image paths
            $idPicturePath = null;
            $holdingIdPicturePath = null;

            // Store ID picture if uploaded
            if ($request->hasFile('id_picture')) {
                $idPicturePath = $request->file('id_picture')->store('performer_id_pictures', 'public');
            }

            // Store holding ID picture if uploaded
            if ($request->hasFile('holding_id_picture')) {
                $holdingIdPicturePath = $request->file('holding_id_picture')->store('performer_holding_id_pictures', 'public');
            }

            // Performers: Create an application
            if ($validatedData['role'] === 'performer') {
                PerformerApplication::create([
                    'name' => $validatedData['name'],
                    'lastname' => $validatedData['lastname'],
                    'email' => $validatedData['email'],
                    'talent_name' => $validatedData['talent_name'] ?? '', // Optional fields
                    'location' => $validatedData['location'] ?? '',
                    'description' => $validatedData['description'] ?? '',
                    'status' => 'PENDING', // Initial status
                    'id_picture' => $idPicturePath,
                    'holding_id_picture' => $holdingIdPicturePath,
                ]);

                return response()->json(['message' => 'Performer application submitted successfully.'], 201);
            }

            // Clients: Create a normal user account
            $user = User::create([
                'name' => $validatedData['name'],
                'lastname' => $validatedData['lastname'],
                'email' => $validatedData['email'],
                'password' => bcrypt($validatedData['password']),
                'role' => $validatedData['role'],
            ]);

            // Generate authentication token
            $token = $user->createToken('main')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $user->currentAccessToken()->delete();

        return response()->json([], 204); // HTTP 204 No Content
    }
}
