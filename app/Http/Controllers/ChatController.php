<?php
namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Auth;
use App\Models\Booking;
use App\Models\PerformerPortfolio;
use Illuminate\Support\Facades\Log;
use App\Models\BookingPerformer;
use App\Models\Applications;

class ChatController extends Controller
{
    // Fetch chats between two users
    public function index(Request $request)
    {
        $userId = $request->query('user_id');         // Logged-in user
        $contactId = $request->query('contact_id');   // Selected contact user

        // Fetch chats where the logged-in user is either the sender or receiver
        $chats = Chat::where(function ($query) use ($userId, $contactId) {
                        $query->where('sender_id', $userId)
                              ->where('receiver_id', $contactId);
                    })
                    ->orWhere(function ($query) use ($userId, $contactId) {
                        $query->where('sender_id', $contactId)
                              ->where('receiver_id', $userId);
                    })
                    ->orderBy('created_at', 'asc') // Order by sent time
                    ->get();

        return response()->json($chats);
    }


    // Store a new chat message
    public function store(Request $request)
    {
        $request->validate([
            'sender_id' => 'required|exists:users,id',
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:255',
        ]);

        $chat = new Chat();
        $chat->sender_id = $request->sender_id;
        $chat->receiver_id = $request->receiver_id;
        $chat->message = $request->message;
        $chat->save();

        // Fire the event to broadcast the message
        broadcast(new MessageSent($chat))->toOthers();

        return response()->json($chat, 201);
    }

    public function canChat($clientId)
    {
        // Get authenticated user
        $userId = Auth::id();  // This is the performer ID from users table
    
        // Find the corresponding performer portfolio
        $performerPortfolio = PerformerPortfolio::where('performer_id', $userId)->first();
    
        // Ensure the performer portfolio exists
        if (!$performerPortfolio) {
            return response()->json(['can_leave_chat' => false, 'error' => 'Performer portfolio not found.'], 404);
        }
    
        $performerPortfolioId = $performerPortfolio->id; // Get the portfolio id
    
        // Check if there's an accepted booking between this performer and the client
        $chatBooking = Booking::where('client_id', $clientId)
            ->where('performer_id', $performerPortfolioId) // Use the portfolio ID
            ->where('status', 'ACCEPTED') // Only accepted bookings
            ->exists();
    
        return response()->json(['can_leave_chat' => $chatBooking]);
    }
    public function getClientsWithAcceptedBookings()
    {
        try {
            $performerUserId = Auth::id(); // Authenticated performer ID
    
            // Find the performer's portfolio
            $performerPortfolio = PerformerPortfolio::where('performer_id', $performerUserId)->first();
    
            if (!$performerPortfolio) {
                return response()->json(['error' => 'Performer portfolio not found.'], 404);
            }
    
            // Fetch all clients with pending bookings linked to this performer
            $clients = BookingPerformer::where('performer_id', $performerPortfolio->id)
                ->whereHas('booking', function ($query) {
                    $query->where('status', 'PENDING'); // Filter only 'PENDING' bookings
                })
                ->with(['booking.client']) // Load client details via booking
                ->get()
                ->pluck('booking.client') // Extract the client relationship
                ->unique('id') // Ensure clients are unique
                ->values(); // Re-index collection
    
            return response()->json(['status' => 'success', 'data' => $clients], 200);
        } catch (\Exception $e) {
            Log::error("Error retrieving clients with pending bookings: " . $e->getMessage());
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
}

public function canChatPerformer()
{
    try {
        $clientUserId = Auth::id(); // Authenticated client ID

        // Fetch all performers with pending bookings linked to this client
        $performers = BookingPerformer::whereHas('booking', function ($query) use ($clientUserId) {
                $query->where('client_id', $clientUserId)
                      ->where('status', 'PENDING'); // Filter only 'PENDING' bookings
            })
            ->with(['performer.user']) // Load performer user details
            ->get()
            ->pluck('performer.user') // Extract the performer user relationship
            ->unique('id') // Ensure performers are unique
            ->values(); // Re-index collection

        return response()->json(['status' => 'success', 'data' => $performers], 200);
    } catch (\Exception $e) {
        Log::error("Error retrieving performers with pending bookings: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred. Please try again.'], 500);
    }

}
public function canChatApplicants()
{
    try {
        // Get the authenticated user
        $userId = Auth::id();

        // Find the performer's portfolio using the authenticated user's ID
        $performerPortfolio = PerformerPortfolio::where('performer_id', $userId)->first();

        // Ensure the performer portfolio exists
        if (!$performerPortfolio) {
            return response()->json(['error' => 'Performer portfolio not found.'], 404);
        }

        // Retrieve all applications where the performer is associated and the message is 'ENABLED'
        $applications = Applications::where('performer_id', $performerPortfolio->id)
            ->where('message', 'ENABLED') // Check if the message is 'ENABLED'
            ->with(['post.client']) // Load the related post and client details
            ->get();

        // Extract unique client details from the applications
        $clients = $applications->pluck('post.client')->unique('id')->values();

        return response()->json(['status' => 'success', 'data' => $clients], 200);
    } catch (\Exception $e) {
        Log::error("Error checking chat availability for applicants: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred. Please try again.'], 500);
    }
}

}
