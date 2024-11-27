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
        // Step 1: Validate the email and password
        $credentials = $request->validated();

        // Step 2: Check if a user with the given email exists
        $user = User::where('email', $credentials['email'])->first();
        
        if (!$user) {
            // Return a specific message if no user is found with that email
            return response()->json(['message' => 'No account found with this email.'], 404);
        }

        // Step 3: Attempt to authenticate the user with email and password
        if (!Auth::attempt($credentials)) {
            // If the credentials are incorrect, return an "Invalid credentials" message
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Step 4: Successfully authenticated user
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
                    'password' => $validatedData['password'],
                    'talent_name' => $validatedData['talent_name'] ?? '', 
                    'location' => $validatedData['location'] ?? '',
                    'description' => $validatedData['description'] ?? '',
                    'status' => 'PENDING',
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
