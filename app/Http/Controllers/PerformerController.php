<?php

namespace App\Http\Controllers;

use App\Models\PerformerPortfolio;
use App\Models\Highlight;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Event;
use App\Models\Theme;
use App\Models\Talent;
class PerformerController extends Controller
{
    // Show performer portfolio details
    public function show($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Use firstOrCreate to fetch or create the portfolio
        $portfolio = PerformerPortfolio::firstOrCreate(
            ['performer_id' => $userId],
            [
                'event_name' => '',
                'theme_name' => '',
                'talent_name' => '',
                'location' => '',
                'description' => '',
                'rate' => 0,
                'image_profile' => null,
                'phone' => '',
                'experience' => 0,
                'genres' => '',
                'performer_type' => '', 
                'availability_status' => 'available'
            ]
        );

        // Fetch highlight videos
        $highlights = Highlight::where('portfolio_id', $portfolio->id)->get();

        return response()->json([
            'user' => $user,
            'portfolio' => $portfolio,
            'highlights' => $highlights,
            'image_profile_url' => $user->image_profile
                ? asset('storage/' . $user->image_profile)
                : null,
        ]);
    }

    // Upload performer highlight videos
    public function uploadHighlightVideos(Request $request, $userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $portfolio = PerformerPortfolio::where('performer_id', $userId)->first();
        if (!$portfolio) {
            return response()->json(['message' => 'Portfolio not found'], 404);
        }

        if ($request->hasFile('highlight_videos')) {
            foreach ($request->file('highlight_videos') as $file) {
                $videoPath = $file->store('videos', 'public'); // Save video to storage

                // Store each highlight video in the database
                Highlight::create([
                    'portfolio_id' => $portfolio->id,
                    'highlight_video' => $videoPath,
                ]);
            }
        }

        return response()->json(['message' => 'Videos uploaded successfully']);
    }

    // Delete a performer highlight video
    public function deleteHighlightVideo($highlightId)
    {
        // Find the highlight video by ID
        $highlight = Highlight::find($highlightId);

        if (!$highlight) {
            return response()->json(['message' => 'Highlight video not found'], 404);
        }

        // Delete the video from storage
        Storage::disk('public')->delete($highlight->highlight_video);

        // Remove the highlight entry from the database
        $highlight->delete();

        return response()->json(['message' => 'Highlight video deleted successfully']);
    }

    // Update the performer portfolio
   public function update(Request $request, $userId)
{
    try {
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $portfolio = PerformerPortfolio::where('performer_id', $userId)->first();
        if (!$portfolio) {
            return response()->json(['message' => 'Portfolio not found'], 404);
        }

        $validatedData = $request->validate([
            'event_name' => 'nullable|string',
            'theme_name' => 'nullable|string',
            'talent_name' => 'required|array', // Changed to array
            'talent_name.*' => 'string', // Validate each array item
            'location' => 'nullable|string',
            'description' => 'nullable|string',
            'rate' => 'nullable|numeric',
            'phone' => 'nullable|string|max:20',
            'experience' => 'nullable|numeric',
            'genres' => 'nullable|string',
            'performer_type' => 'nullable|string',
        ]);

        $portfolio->update($validatedData);

        // Handle talents array
        if (!empty($validatedData['talent_name'])) {
            // Delete existing talents
            Talent::where('performer_id', $portfolio->id)->delete();
            
            // Create new talents from array
            foreach ($validatedData['talent_name'] as $talentName) {
                Talent::create([
                    'performer_id' => $portfolio->id,
                    'talent_name' => $talentName,
                ]);
            }
            
            // Update portfolio talent_name field with comma-separated string
            $portfolio->talent_name = implode(',', $validatedData['talent_name']);
            $portfolio->save();
        }

        return response()->json([
            'message' => 'Portfolio updated successfully',
            'portfolio' => $portfolio->fresh(['talents'])
        ]);

    } catch (\Exception $e) {
        Log::error("Portfolio Update Error: " . $e->getMessage());
        return response()->json([
            'message' => 'Error updating portfolio',
            'error' => $e->getMessage()
        ], 500);
    }
}
    
    

    // Update performer profile image
    // public function storePortfolioImage(Request $request, $userId)
    // {
    //     // Validate the request to ensure an image file is uploaded
    //     $validatedData = $request->validate([
    //         'image_profile' => 'required|image|mimes:jpg,jpeg,png|max:2048',
    //     ]);

    //     // Find the user by ID
    //     $user = User::find($userId);
    //     if (!$user) {
    //         return response()->json(['message' => 'User not found'], 404);
    //     }

    //     // Find or create the portfolio for the performer
    //     $portfolio = PerformerPortfolio::firstOrCreate(['performer_id' => $userId]);

    //     // Store the new image
    //     if ($request->hasFile('image_profile')) {
    //         $imagePath = $request->file('image_profile')->store('profile_images', 'public');
    //         $portfolio->image_profile = $imagePath;
    //         $portfolio->save();

    //         return response()->json([
    //             'message' => 'Profile image stored successfully',
    //             'image_profile' => asset('storage/' . $portfolio->image_profile),
    //         ], 201);
    //     }

    //     return response()->json(['message' => 'No file uploaded'], 400);
    // }

    // Update performer profile image
    public function updatePortfolioImage(Request $request, $userId)
    {
        Log::info("Updating profile image for user ID: $userId");

        // Validate the request to ensure an image file is uploaded
        // $validatedData = $request->validate([
        //     'image_profile' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        // ]);

        // Find the user by ID
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Check if the file was successfully uploaded
        if ($request->hasFile('image_profile')) {
            Log::info("File found: " . $request->file('image_profile')->getClientOriginalName());

            // Remove the old image if it exists in the users table
            if ($user->image_profile) {
                Storage::disk('public')->delete($user->image_profile);
                Log::info("Old image in users deleted: " . $user->image_profile);
            }

            // Store the new image in users table
            $imagePath = $request->file('image_profile')->store('profile_images', 'public');
            $user->image_profile = $imagePath;
            $user->save();

            Log::info("New image saved in users: " . $imagePath);

            // If the user is a performer, update the portfolio image
            if ($user->role === 'performer') {
                $portfolio = PerformerPortfolio::where('performer_id', $user->id)->first();

                if ($portfolio) {
                    // Remove the old image if it exists in the portfolio
                    if ($portfolio->image_profile) {
                        Storage::disk('public')->delete($portfolio->image_profile);
                        Log::info("Old image in portfolio deleted: " . $portfolio->image_profile);
                    }

                    // Update portfolio with the new image
                    $portfolio->image_profile = $imagePath;
                    $portfolio->save();
                    Log::info("New image saved in portfolio: " . $imagePath);
                }
            }

            // Return a success response with the updated image path
            return response()->json([
                'message' => 'Profile image updated successfully',
                'image_profile' => asset('storage/' . $imagePath),
            ], 200);
        }

        // If no file was uploaded, log and return an error message
        Log::error("No file uploaded for user ID: $userId");
        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function getPerformers()
    {
        $performers = User::where('role', 'performer')
            ->with(['performerPortfolio', 'feedback'])  
            ->get();

        return response()->json($performers);
    }

    public function getHighlights()
    {
        // Fetch all performers and their highlights
        $performers = User::where('role', 'performer')
            ->with(['performerPortfolio.highlights']) // Eager load portfolio and highlights
            ->get();

        return response()->json($performers);
    }
    public function getVideo()
{
    try {
        // Fetch all performers and their portfolios including highlights
        $performers = User::where('role', 'performer')
            ->with(['performerPortfolio.highlights']) // Eager load portfolio and highlights
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $performers,
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch performers and highlights.',
            'error' => $e->getMessage()
        ], 500);
    }
}

public function filterPerformersByEventAndTheme(Request $request)
{
    // Get the event and theme IDs from the request
    $eventId = $request->input('event_id');
    $themeId = $request->input('theme_id');

    // Fetch event and theme names by their IDs
    $event = Event::find($eventId);
    $theme = Theme::find($themeId);

    // Make sure the event and theme exist
    if (!$event || !$theme) {
        return response()->json([], 404); // Return empty if either not found
    }

    $eventName = $event->name;
    $themeName = $theme->name;

    // Fetch performers whose portfolio matches the event and theme name
    $performers = User::where('role', 'performer')
        ->whereHas('performerPortfolio', function ($query) use ($eventName, $themeName) {
            $query->where('event_name', $eventName)
                  ->where('theme_name', $themeName);
        })
        ->with(['performerPortfolio', 'feedback'])
        ->get();

    return response()->json($performers);
}


}
