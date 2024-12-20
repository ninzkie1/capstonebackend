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
            'message' => 'DISABLED', // Default message
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
            'performer_id' => $application->performer->id, // Adding performer_id
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
public function approve(Request $request, $applicationId)
{
    // Fetch the authenticated user
    $user = $request->user();

    // Fetch the application
    $application = Applications::with('post')->find($applicationId);

    // Check if the application exists
    if (!$application) {
        return response()->json(['message' => 'Application not found.'], 404);
    }

    // Check if the authenticated user owns the post
    if ($application->post->user_id !== $user->id) {
        return response()->json(['message' => 'You are not authorized to approve this application.'], 403);
    }

    // Update the application's status and message
    $application->update([
        'message' => 'ENABLED',
        'status' => 'APPROVED',
    ]);

    return response()->json(['message' => 'Application approved successfully.', 'application' => $application]);
}
public function decline(Request $request, $applicationId)
{
    // Fetch the authenticated user
    $user = $request->user();

    // Fetch the application along with the associated post
    $application = Applications::with('post')->find($applicationId);

    // Check if the application exists
    if (!$application) {
        return response()->json(['message' => 'Application not found.'], 404);
    }

    // Check if the post exists and belongs to the authenticated user
    $post = $application->post;
    if (!$post) {
        return response()->json(['message' => 'Post not found.'], 404);
    }

    // Check if the authenticated user owns the post
    if ($post->user_id !== $user->id) {
        return response()->json(['message' => 'You are not authorized to decline this application.'], 403);
    }

    // Update the application's status and message
    try {
        $application->update([
            'message' => 'DISABLED',
            'status' => 'DECLINED',
        ]);

        return response()->json(['message' => 'Application declined successfully.', 'application' => $application], 200);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Failed to decline application. Please try again.', 'error' => $e->getMessage()], 500);
    }
}


}
