<?php
namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Feedback;
use App\Models\PerformerPortfolio;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    // Store a new rating for a performer
    public function store(Request $request, $performerId)
{
    // Validate the request input
    $request->validate([
        'rating' => 'required|numeric|min:1|max:5',
        'review' => 'nullable|string',
    ]);

    // Find the performer portfolio by performerId
    $performer = PerformerPortfolio::find($performerId);

    if (!$performer) {
        return response()->json(['message' => 'Performer not found'], 404);
    }

    // Check if the user has a completed booking with the performer
    $userId = Auth::id();
    $completedBooking = Booking::where('client_id', $userId)
        ->where('performer_id', $performerId)
        ->where('status', 'Approved')
        ->exists();

    if (!$completedBooking) {
        return response()->json(['message' => 'You cannot leave a review without a completed booking.'], 403);
    }

    // Create a new rating
    $feedback = new Feedback();
    $feedback->performer_id = $performerId;
    $feedback->user_id = $userId;
    $feedback->rating = $request->input('rating');
    $feedback->review = $request->input('review');
    $feedback->save();

    // Calculate and save the new average rating for the performer
    $averageRating = Feedback::where('performer_id', $performerId)->avg('rating');
    $performer->average_rating = $averageRating;
    $performer->save();

    // Load user details to send back with the response
    $feedback->load('user');

    // Return response with the rating information
    return response()->json(['message' => 'Rating submitted successfully', 'rating' => $feedback], 201);
}

    // Get ratings for a specific performer
    public function getRatings($performerId)
    {
        $performer = PerformerPortfolio::find($performerId);
     
        if (!$performer) {
            return response()->json(['message' => 'Performer not found'], 404);
        }
     
        $performer = PerformerPortfolio::with('feedback.user')->findOrFail($performerId);
        $averageRating = $performer->feedback->avg('rating');

        return response()->json([
            'performer' => $performer,
            'average_rating' => $averageRating,
            'feedback' => $performer->feedback,
        ]);
    }
    public function canLeaveReview($performerId)
    {
        $userId = Auth::id();
        $completedBooking = Booking::where('client_id', $userId)
            ->where('performer_id', $performerId)
            ->where('status', 'Approved') // Assuming 'APPROVED' is the status for a finished booking
            ->exists();

        return response()->json(['can_leave_review' => $completedBooking]);
    }

}
