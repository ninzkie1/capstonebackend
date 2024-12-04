<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PerformerPortfolio;
use App\Models\Post;
use App\Models\Applications;
class ApplicationsController extends Controller
{
    public function apply(Request $request, $postId)
    {
        $user = $request->user();

        // Ensure the user is authenticated and has a performer portfolio
        $performerPortfolio = PerformerPortfolio::where('performer_id', $user->id)->first(); // Correct column is 'performer_id'
        if (!$performerPortfolio) {
            return response()->json(['message' => 'You are not authorized to apply.'], 403);
        }

        // Check if the post exists
        $post = Post::find($postId);
        if (!$post) {
            return response()->json(['message' => 'Post not found.'], 404);
        }

        // Check if the performer already applied
        $existingApplication = Applications::where('post_id', $postId)
            ->where('performer_id', $performerPortfolio->id)
            ->first();

        if ($existingApplication) {
            return response()->json(['message' => 'You have already applied to this post.'], 400);
        }

        // Create the application
        $application = Applications::create([
            'post_id' => $postId,
            'performer_id' => $performerPortfolio->id,
            'message' => 'ENABLED', // Default message
            'status' => 'PENDING', // Default status
        ]);

        return response()->json(['message' => 'Application submitted successfully.', 'application' => $application], 201);
    }
    public function getApplications(Request $request)
{
    $applications = Applications::with(['post', 'performer'])
        ->get()
        ->map(function ($application) {
            return [
                'performer_name' => $application->performer->user->name, // Assuming performer has a 'name' field
                'posts_event' => $application->post->event_name,
                'posts_theme' => $application->post->theme_name,
                'performer_talent' => $application->performer->talent_name,
                'requested_on' => $application->created_at, // Date the request was created
                'status' => $application->status,
                'id' => $application->id, // For actions like delete or update
            ];
        });

    return response()->json($applications);
}

}
