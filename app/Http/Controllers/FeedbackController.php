<?php
namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Feedback;
use App\Models\PerformerPortfolio;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\BookingPerformer;

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
    
        try {
            // Find the performer portfolio by performerId
            $performer = PerformerPortfolio::find($performerId);
    
            if (!$performer) {
                return response()->json(['message' => 'Performer not found'], 404);
            }
    
            // Get the authenticated client ID
            $clientUserId = Auth::id();
    
            // Check if the client has a completed booking with the performer
            $completedBooking = BookingPerformer::where('performer_id', $performerId)
                ->whereHas('booking', function ($query) use ($clientUserId) {
                    $query->where('client_id', $clientUserId)
                          ->where('status', 'COMPLETED'); // Only allow completed bookings
                })
                ->exists();
    
            if (!$completedBooking) {
                return response()->json(['message' => 'You cannot leave a review without a completed booking.'], 403);
            }
    
            // Create a new feedback record
            $feedback = new Feedback();
            $feedback->performer_id = $performerId;
            $feedback->user_id = $clientUserId;
            $feedback->rating = $request->input('rating');
            $feedback->review = $request->input('review');
            $feedback->save();
    
            // Calculate the new average rating for the performer
            $averageRating = Feedback::where('performer_id', $performerId)->avg('rating');
            $performer->average_rating = $averageRating;
            $performer->save();
    
            // Load the user relationship for the feedback
            $feedback->load('user');
    
            // Return a successful response with the feedback data
            return response()->json([
                'message' => 'Feedback submitted successfully',
                'feedback' => $feedback,
            ], 201);
        } catch (\Exception $e) {
            Log::error("Error submitting feedback: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while submitting feedback. Please try again.'], 500);
        }
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
        try {
            $clientUserId = Auth::id(); // Authenticated client ID
    
            // Check if there's a completed booking with the performer
            $completedBooking = BookingPerformer::where('performer_id', $performerId)
                ->whereHas('booking', function ($query) use ($clientUserId) {
                    $query->where('client_id', $clientUserId)
                          ->where('status', 'COMPLETED'); // Only check completed bookings
                })
                ->exists();
    
            return response()->json(['can_leave_review' => $completedBooking], 200);
        } catch (\Exception $e) {
            Log::error("Error checking if user can leave a review: " . $e->getMessage());
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
    

}
