<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    // List all users
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    // Retrieve a specific user
    public function show($id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'password' => $user->password,
        'role' => $user->role,
    ]);
}


    // edit a user
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,performer,client',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => $request->role,
        ]);

        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    // Update a user
    public function update(Request $request, $id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    // Custom error messages
    $messages = [
        'name.string' => 'The name field must be a string.',
        'name.max' => 'The name field may not be greater than 255 characters.',
        'lastname.string' => 'The lastname field must be a filled.',
        'lastname.max' => 'The lastname field may not be greater than 255 characters.',
        'email.email' => 'The email field must be a valid email address.',
        'email.unique' => 'The email address has already been taken.',
        'password.string' => 'The password field must be a string.',
        'password.min' => 'The password field must be at least 8 characters.',
        'role.in' => 'The role field must be one of the following: admin, performer, customer.',
    ];

    $validator = Validator::make($request->all(), [
        'name' => 'string|max:255',
        'lastname' => 'string|max:255',
        'email' => 'email|unique:users,email,' . $id,
        'password' => 'string|min:8',
        'role' => 'in:admin,performer,client',
    ], $messages);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    if ($request->has('name')) {
        $user->name = $request->name;
    }
    if ($request->has('lastname')) {
        $user->lastname = $request->lastname;
    }

    if ($request->has('email')) {
        $user->email = $request->email;
    }

    if ($request->has('password')) {
        // Ensure the password is hashed before saving
        $user->password = bcrypt($request->password);
    }

    if ($request->has('role')) {
        $user->role = $request->role;
    }

    $user->save();

    return response()->json(['message' => 'User updated successfully', 'user' => $user]);
}


    // Delete a user
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function getSummaryReport()
    {
        try {
            // Get today's date
            $today = now();
    
            // Initialize arrays for daily data for each metric for the last 30 days
            $totalUsers = [];
            $usersCreatedToday = [];
            $totalBookings = [];
            $bookingsToday = [];
            $cancelledBookings = [];
            $approvedBookings = [];
            $sales = 0; // Initialize sales variable
    
            // Calculate the total sales from the admin's `talento_coin_balance`
            $admin = User::where('role', 'admin')->first(); // Assuming the admin has the 'admin' role
            if ($admin && isset($admin->talento_coin_balance)) {
                $sales = $admin->talento_coin_balance;
            }
    
            // Loop through each of the last 30 days
            for ($i = 0; $i < 30; $i++) {
                $date = $today->copy()->subDays($i);
    
                // Daily metrics calculations
                $totalUsers[] = User::whereDate('created_at', '<=', $date->toDateString())->count();
                $usersCreatedToday[] = User::whereDate('created_at', $date->toDateString())->count();
                $totalBookings[] = Booking::whereDate('created_at', '<=', $date->toDateString())->count();
                $bookingsToday[] = Booking::whereDate('created_at', $date->toDateString())->count();
                $cancelledBookings[] = Booking::where('status', 'Cancelled')->whereDate('created_at', $date->toDateString())->count();
                $approvedBookings[] = Booking::where('status', 'APPROVED')->whereDate('created_at', $date->toDateString())->count();
            }
    
            // Reverse the arrays to start with the oldest date first
            $totalUsers = array_reverse($totalUsers);
            $usersCreatedToday = array_reverse($usersCreatedToday);
            $totalBookings = array_reverse($totalBookings);
            $bookingsToday = array_reverse($bookingsToday);
            $cancelledBookings = array_reverse($cancelledBookings);
            $approvedBookings = array_reverse($approvedBookings);
    
            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_users' => $totalUsers,
                    'users_created_today' => $usersCreatedToday,
                    'total_bookings' => $totalBookings,
                    'bookings_today' => $bookingsToday,
                    'cancelled_bookings' => $cancelledBookings,
                    'approved_bookings' => $approvedBookings,
                    'sales' => $sales, // Include sales in the response
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error("Summary Report Error: " . $e->getMessage());
            return response()->json(['error' => 'There was an error generating the report. Please try again.'], 500);
        }
    }
    
    // Determine the admin balance
    public function getAdminBalance()
    {
        try {
            // Assuming there's a 'talento_coin_balance' field in the 'users' table for admins
            $adminBalance = User::where('role', 'admin')->sum('talento_coin_balance');

            return response()->json([
                'status' => 'success',
                'balance' => $adminBalance
            ], 200);
        } catch (\Exception $e) {
            Log::error("Admin Balance Error: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving the admin balance. Please try again.'], 500);
        }
    }
}
