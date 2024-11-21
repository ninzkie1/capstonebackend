<?php
namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Auth;
use App\Models\Booking;
use App\Models\PerformerPortfolio;

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
        $userId = Auth::id();  // The authenticated performer user ID
    
        // Find the corresponding performer portfolio
        $performerPortfolio = PerformerPortfolio::where('performer_id', $userId)->first();
    
        // Ensure the performer portfolio exists
        if (!$performerPortfolio) {
            return response()->json(['error' => 'Performer portfolio not found.'], 404);
        }
    
        $performerPortfolioId = $performerPortfolio->id; // Get the portfolio id (the one used in the booking table)
    
        // Fetch clients that have bookings with the authenticated performer and a status of "ACCEPTED"
        $clients = Booking::where('performer_id', $performerPortfolioId) // Use performer portfolio ID instead of user ID
            ->where('status', 'ACCEPTED')
            ->with('client')  // Assuming there is a relation named 'client' in Booking model
            ->get()
            ->map(function ($booking) {
                return $booking->client;  // Returning the associated client
            })
            ->unique('id')  // Ensure clients are unique
            ->values();  // Re-index the collection
    
        return response()->json($clients);
    }
}
