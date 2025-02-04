<?php
namespace App\Http\Controllers;

use App\Models\Barangay;
use App\Models\Event;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
Use App\Models\PerformerPortfolio;
Use App\Models\User;
Use App\Models\Highlight;
Use Illuminate\Support\Facades\Storage;
use App\Models\Municipality;
use App\Models\Theme;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use App\Models\Comment;


class CustomerController extends Controller
{
    public function index()
{
    // Fetch all posts with related user and comments (including comment users)
    $posts = Post::with(['user', 'comments.user'])->get()->map(function ($post) {
        // Ensure talents is decoded to an array before returning to the frontend
        $post->talents = json_decode($post->talents, true);

        // Add the user details (including image_profile) for the post owner
        $post->user = [
            'id' => $post->user->id,
            'name' => $post->user->name,
            'image_profile' => $post->user->image_profile, // Include profile image
        ];

        // Map through comments and include user details (including image_profile)
        $post->comments = $post->comments->map(function ($comment) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'image_profile' => $comment->user->image_profile, // Include profile image
                ],
            ];
        });

        return $post;
    });

    return response()->json($posts);
}


    public function store(Request $request)
{
    $validatedData = $request->validate([
        'client_name' => 'required|string|max:255',
        'event_id' => 'required|exists:events,id',
        'theme_id' => 'required|exists:themes,id',
        'municipality_id' => 'required|exists:municipalities,id',
        'barangay_id' => 'required|exists:barangays,id',
        'date' => 'required|date_format:m/d/Y',
        'start_time' => 'required|string', // Allow flexibility in input format
        'end_time' => 'required|string',   // Allow flexibility in input format
        'performer_needed' => 'required|integer|min:1',
        'audience' => 'required|integer|min:1',
        'description' => 'required|string',
        'talents' => 'required|array',
    ]);

    // Convert date from MM/DD/YYYY to YYYY-MM-DD before saving
    $validatedData['date'] = Carbon::createFromFormat('m/d/Y', $validatedData['date'])->format('Y-m-d');

    // Time formats to be tried
    $timeFormats = ['h:i A', 'H:i'];

    // Parse start_time
    foreach ($timeFormats as $format) {
        try {
            $validatedData['start_time'] = Carbon::createFromFormat($format, $validatedData['start_time'])->format('H:i:s');
            break;
        } catch (\Exception $e) {
            // Continue to try the next format
        }
    }

    // Parse end_time
    foreach ($timeFormats as $format) {
        try {
            $validatedData['end_time'] = Carbon::createFromFormat($format, $validatedData['end_time'])->format('H:i:s');
            break;
        } catch (\Exception $e) {
            // Continue to try the next format
        }
    }

    // Get names from related models
    $event = Event::find($validatedData['event_id']);
    $theme = Theme::find($validatedData['theme_id']);
    $municipality = Municipality::find($validatedData['municipality_id']);
    $barangay = Barangay::find($validatedData['barangay_id']);
    $userId = Auth::id();

    // Save the post to the database with names instead of IDs
    $post = Post::create([
        'client_name' => $validatedData['client_name'],
        'event_name' => $event->name,
        'theme_name' => $theme->name,
        'municipality_name' => $municipality->name,
        'barangay_name' => $barangay->name,
        'date' => $validatedData['date'], // Date saved in YYYY-MM-DD format
        'start_time' => $validatedData['start_time'], // Time saved in HH:MM:SS format
        'end_time' => $validatedData['end_time'],     // Time saved in HH:MM:SS format
        'audience' => $validatedData['audience'],
        'performer_needed' => $validatedData['performer_needed'],
        'description' => $validatedData['description'],
        'talents' => json_encode($validatedData['talents']),
        'user_id' => $userId,
    ]);

    return response()->json($post, 201);
}

    
    // Update an existing post
    public function update(Request $request, $id)
    {
        // Validate the incoming request
        $validatedData = $request->validate([
            'client_name' => 'required|string|max:255',
            'event_id' => 'required|exists:events,id',
            'theme_id' => 'required|exists:themes,id',
            'municipality_id' => 'required|exists:municipalities,id',
            'barangay_id' => 'required|exists:barangays,id',
            'date' => 'required|date_format:m/d/Y', // Expect MM/DD/YYYY format from user
            'start_time' => 'required|date_format:g:i A', // Expect h:i A format
            'end_time' => 'required|date_format:g:i A',   // Expect h:i A format
            'audience' => 'required|integer|min:1',
            'performer_needed' => 'required|integer|min:1',
            'description' => 'required|string',
            'talents' => 'required|array',
        ]);
    
        // Convert date from MM/DD/YYYY to YYYY-MM-DD before updating
        $validatedData['date'] = Carbon::createFromFormat('m/d/Y', $validatedData['date'])->format('Y-m-d');
    
        // Convert time from h:i A to 24-hour format (HH:MM:SS)
        $validatedData['start_time'] = Carbon::createFromFormat('g:i A', $validatedData['start_time'])->format('H:i:s');
        $validatedData['end_time'] = Carbon::createFromFormat('g:i A', $validatedData['end_time'])->format('H:i:s');
    
        // Retrieve names based on the given IDs
        $event = Event::find($validatedData['event_id']);
        $theme = Theme::find($validatedData['theme_id']);
        $municipality = Municipality::find($validatedData['municipality_id']);
        $barangay = Barangay::find($validatedData['barangay_id']);
    
        // Find and update the post with names instead of IDs
        $post = Post::findOrFail($id);
        $post->update([
            'client_name' => $validatedData['client_name'],
            'event_name' => $event->name,
            'theme_name' => $theme->name,
            'municipality_name' => $municipality->name,
            'barangay_name' => $barangay->name,
            'date' => $validatedData['date'],
            'start_time' => $validatedData['start_time'],
            'end_time' => $validatedData['end_time'],
            'audience' => $validatedData['audience'],
            'performer_needed' => $validatedData['performer_needed'],
            'description' => $validatedData['description'],
            'talents' => json_encode($validatedData['talents']),
            'user_id' => Auth::id(),
        ]);
    
        return response()->json([
            'message' => 'Post updated successfully',
            'data' => $post,
        ], 200);
    }
    

    public function destroy($id)
    {
        // Find and delete the post
        $post = Post::findOrFail($id);
        $post->delete();

        return response()->json(null, 204); // Return 204 No Content after deletion
    }

    public function getPortfolio($portfolio_id)
    {
        Log::info("Fetching portfolio for portfolio ID: " . $portfolio_id);
    
        try {
            // Fetch the portfolio and eager load the user, feedback (ratings), and highlights using the portfolio_id (primary key)
            $portfolio = PerformerPortfolio::with(['user', 'feedback.user', 'highlights'])
                            ->where('id', $portfolio_id)  // Use portfolio's primary key `id` instead of `performer_id`
                            ->first();
    
            if (!$portfolio || !$portfolio->user) {
                Log::warning("Portfolio or User with portfolio ID " . $portfolio_id . " not found.");
                return response()->json(['error' => 'Portfolio or User not found'], 404);
            }
    
            // Prepare response data
            $response = [
                'portfolio' => [
                    'portfolio_id' => $portfolio->id, // Return the portfolio's primary key as `portfolio_id`
                    'performer_id' => $portfolio->performer_id, // Include the `performer_id` for reference
                    'description' => $portfolio->description,
                    'experience' => $portfolio->experience,
                    'genres' => $portfolio->genres,
                    'talent_name' => $portfolio->talent_name,
                    'location' => $portfolio->location,
                    'performer_type' => $portfolio->performer_type,
                    'phone' => $portfolio->phone,
                ],
                'user' => [
                    'id' => $portfolio->user->id,
                    'name' => $portfolio->user->name,
                    'email' => $portfolio->user->email,
                    'image_profile' => $portfolio->user->image_profile,
                ],
                'highlights' => $portfolio->highlights->map(function ($highlight) {
                    return [
                        'id' => $highlight->id,
                        'highlight_video' => $highlight->highlight_video,
                    ];
                }),
                'average_rating' => $portfolio->calculateAverageRating(),
                'feedback' => $portfolio->feedback->map(function ($feedback) {
                    return [
                        'id' => $feedback->id,
                        'user' => [
                            'name' => $feedback->user->name ?? 'Anonymous',
                            'image_profile' => $feedback->user->image_profile ?? null,
                        ],
                        'rating' => $feedback->rating,
                        'review' => $feedback->review,
                    ];
                }),
            ];
    
            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error("Error fetching portfolio for portfolio ID: " . $portfolio_id . ". Error: " . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred'], 500);
        }
    }
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image_profile' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:6048',
        ]);
    
        $user = Auth::user();
    
        $user->name = $request->input('name');
        $user->lastname = $request->input('lastname');
        $user->location = $request->input('location');
    
        if ($request->hasFile('image_profile')) {
            // Delete old image if it exists
            if ($user->image_profile) {
                Storage::disk('public')->delete($user->image_profile);
            }
    
            // Store new image in the 'profiles' directory on the 'public' disk
            $path = $request->file('image_profile')->store('profiles', 'public');
            $user->image_profile = $path;
        }
    
        $user->save();
    
        // Return the updated user profile including the full URL of the image
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'lastname' => $user->lastname,
                'location' => $user->location,
                'image_profile' => $user->image_profile ? asset('storage/' . $user->image_profile) : null,
            ],
        ]);
    }
    
    public function getLoggedInClient()
    {
        try {
            // Get the authenticated user
            $user = Auth::user();

            // Check if the user is authenticated
            if (!$user) {
                return response()->json(['error' => 'User not authenticated.'], 401);
            }

            // Ensure the logged-in user is a client
            if ($user->role !== 'client') {
                return response()->json(['error' => 'Only clients can access this information.'], 403);
            }

            // Format the response to include image URL
            $user->image_profile_url = $user->image_profile
                ? url("storage/" . $user->image_profile)
                : url("storage/logotalentos.png");

            // Return the user's data
            return response()->json(['user' => $user], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching client information: " . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred'], 500);
        }
    }
    public function getUserPosts()
{
    try {
        // Get the authenticated user
        $user = Auth::user();

        // Ensure the user is authenticated
        if (!$user) {
            return response()->json(['error' => 'User not authenticated.'], 401);
        }

        // Fetch posts owned by the authenticated user
        $posts = Post::where('user_id', $user->id)
            ->with(['user','comments.user']) // Eager load comments and their associated users
            ->get()
            ->map(function ($post) {
                // Format the post data
                $post->talents = json_decode($post->talents, true); // Decode talents JSON to array

                // Format comments
                $post->comments = $post->comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'created_at' => $comment->created_at,
                        'user' => [
                            'id' => $comment->user->id,
                            'name' => $comment->user->name,
                            'image_profile' => $comment->user->image_profile ? asset('storage/' . $comment->user->image_profile) : null,
                        ],
                    ];
                });

                return $post;
            });

        return response()->json(['posts' => $posts], 200);
    } catch (\Exception $e) {
        Log::error("Error fetching user posts: " . $e->getMessage());
        return response()->json(['error' => 'An unexpected error occurred'], 500);
    }
}
public function trackVideoPlay(Request $request)
{
    $request->validate([
        'video_id' => 'required|exists:highlights,id',
    ]);

    $user = Auth::user();
    $videoPlay = VideoPlay::firstOrCreate(
        ['user_id' => $user->id, 'video_id' => $request->video_id],
        ['play_count' => 0]
    );

    $videoPlay->increment('play_count');

    return response()->json(['status' => 'success', 'message' => 'Video play tracked successfully']);
}



   
}
    
    
    
    
    
    
    
    
