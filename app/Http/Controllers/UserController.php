<?php


namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;


class UserController extends Controller
{
  

    public function index()
    {
        $users = User::where('role', '!=', 'admin')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|max:255',
            'image_profile' => 'required|image|mimes:jpg,jpeg,png|max:6048',
        ]);

        $user = new User();
        $user->first_name = $request->first_name;
        $user->last_name = $request->last_name;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);
        $user->role = $request->role;

        // Handle image upload
        if ($request->hasFile('image_profile')) {
            $imagePath = $request->file('image_profile')->store('profile_images', 'public');
            $user->image_profile = $imagePath;
        }

        $user->save();

        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    // New method to update the profile image
    public function update(Request $request, $id)
{
    // Find the user by ID (Only proceed if the authenticated user is updating their own profile)
    $user = User::find($id);
    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    // Check if the authenticated user is updating their own profile
    if (auth()->id() !== $user->id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Validate the input fields
    $request->validate([
        'name' => 'string|max:255',
        'lastname' => 'string|max:255',
        'image_profile' => 'nullable|image|mimes:jpg,jpeg,png|max:2048', // Adjust size if needed
    ]);

    // Update the name and lastname
    if ($request->has('name')) {
        $user->name = $request->input('name');
    }
    if ($request->has('lastname')) {
        $user->lastname = $request->input('lastname');
    }

    // Handle profile image upload if present
    if ($request->hasFile('image_profile')) {
        // Remove old image if it exists
        if ($user->image_profile) {
            Storage::disk('public')->delete($user->image_profile);
        }

        // Store new image and update the user's image_profile field
        $imagePath = $request->file('image_profile')->store('profile_images', 'public');
        $user->image_profile = $imagePath;
    }

    // Save the updated user data
    $user->save();

    // Return the updated user profile
    return response()->json([
        'message' => 'Profile updated successfully',
        'user' => $user,
        'image_url' => asset('storage/' . $user->image_profile), // Return the full URL to the uploaded image
    ]);
}
public function getUser($id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'lastname' => $user->lastname,
       'image_url' => asset('storage/' . $user->image_profile),
        'email' => $user->email,
        'role' => $user->role,
    ]);
}
public function getAdmin()
{
    $users = User::where('role', 'admin')->get();
    return response()->json($users);
}
 // Fetch profile image of a specific user
 public function fetchUserProfileImage($id)
 {
     // Find the user by ID
     $user = User::find($id);

     if (!$user) {
         return response()->json(['message' => 'User not found'], 404);
     }

     // Check if the user has a profile image
     $imageUrl = $user->image_profile 
         ? asset('storage/' . $user->image_profile) 
         : null;

     return response()->json([
         'id' => $user->id,
         'name' => $user->name,
         'image_url' => $imageUrl,
         'message' => $imageUrl ? 'Profile image retrieved successfully' : 'No profile image available',
     ]);
 }

 // Fetch profile images for all users
 public function fetchAllUserProfileImages()
 {
     // Retrieve all users
     $users = User::select('id', 'name', 'image_profile')->get();

     // Map user data with profile image URL
     $usersWithImages = $users->map(function ($user) {
         return [
             'id' => $user->id,
             'name' => $user->name,
             'image_url' => $user->image_profile 
                 ? asset('storage/' . $user->image_profile) 
                 : null,
         ];
     });

     return response()->json([
         'users' => $usersWithImages,
         'message' => 'User profile images retrieved successfully',
     ]);
 }
 public function fetchAuthenticatedUserProfile()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        // Return the user's profile data, including the profile image URL
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'image_url' => $user->image_profile 
                ? asset('storage/' . $user->image_profile)
                : null,
            'message' => 'Authenticated user profile fetched successfully',
        ]);
    }


}