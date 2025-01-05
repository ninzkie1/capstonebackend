<?php
namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use App\Events\MessageSent;
use App\Events\MessageSeen;
use Illuminate\Support\Facades\Auth;
use App\Models\Booking;
use App\Models\PerformerPortfolio;
use Illuminate\Support\Facades\Log;
use App\Models\BookingPerformer;
use App\Models\Applications;
use App\Models\Post;
use App\Models\GroupChat;



class ChatController extends Controller
{
    // Fetch chats between two users
    public function index(Request $request)
{
    $userId = $request->query('user_id');
    $contactId = $request->query('contact_id');
    $groupChatId = $request->query('group_chat_id');

    try {
        if ($groupChatId) {
            $chats = Chat::where('group_chat_id', $groupChatId)
                        ->orderBy('created_at', 'asc')
                        ->with([
                            'sender:id,name,image_profile',
                            'groupChat.users:id,name,image_profile'
                        ])
                        ->get();
        } else if ($contactId) {
            $chats = Chat::where(function ($query) use ($userId, $contactId) {
                            $query->where('sender_id', $userId)
                                  ->where('receiver_id', $contactId);
                        })
                        ->orWhere(function ($query) use ($userId, $contactId) {
                            $query->where('sender_id', $contactId)
                                  ->where('receiver_id', $userId);
                        })
                        ->orderBy('created_at', 'asc')
                        ->with([
                            'sender:id,name,image_profile',
                            'receiver:id,name,image_profile'
                        ])
                        ->get();
        }

        return response()->json($chats);
    } catch (\Exception $e) {
        Log::error("Error fetching messages: " . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch messages'], 500);
    }
}



    // Store a new chat message
    public function store(Request $request)
{
    $request->validate([
        'sender_id' => 'required|exists:users,id',
        'message' => 'required|string|max:255',
        'group_chat_id' => 'nullable|exists:group_chats,id',
        'receiver_id' => 'nullable|exists:users,id',
    ]);

    $chat = new Chat();
    $chat->sender_id = $request->sender_id;
    $chat->message = $request->message;

    if ($request->group_chat_id) {
        $chat->group_chat_id = $request->group_chat_id;
    } elseif ($request->receiver_id) {
        $chat->receiver_id = $request->receiver_id;
    }

    $chat->save();

    // Always broadcast the message
    broadcast(new MessageSent($chat))->toOthers();

    return response()->json(['status' => 'success', 'chat' => $chat], 201);
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
                    $query->where('status', 'ACCEPTED'); // Filter only 'PENDING' bookings
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
        $clientUserId = Auth::id();

        // Fetch bookings with performers
        $bookings = BookingPerformer::whereHas('booking', function ($query) use ($clientUserId) {
                $query->where('client_id', $clientUserId)
                      ->where('status', 'ACCEPTED');
            })
            ->with(['booking', 'performer.user'])
            ->get()
            ->groupBy('booking_id')
            ->map(function ($performers) {
                $booking = $performers->first()->booking;
                $performerNames = $performers->map(function ($bookingPerformer) {
                    return $bookingPerformer->performer->user->name;
                })->implode(', '); // Concatenate names of performers
                
                // Check if group chat already exists
                $groupChat = GroupChat::firstOrCreate([
                    'name' => 'Group Chat for ' . $performerNames,
                    'booking_id' => $booking->id  // Add booking_id to group chat
                ]);

                // Assign the performers to the group chat
                foreach ($performers as $performer) {
                    $groupChat->users()->syncWithoutDetaching([$performer->performer->user->id]);
                }

                return [
                    'booking_id' => $booking->id,
                    'image_url' => $booking->client->image_profile,
                    'event_name' => $booking->event_name,
                    'performers' => $performerNames,
                    'group_chat_id' => $groupChat->id, // Include group chat ID
                    'performer_ids' => $performers->pluck('performer_id')->toArray()
                ];
            })->values();

        return response()->json([
            'status' => 'success', 
            'data' => $bookings
        ], 200);

    } catch (\Exception $e) {
        Log::error("Error retrieving performers with bookings: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred. Please try again.'], 500);
    }
}
public function canChatClients()
{
    try {
        $userId = Auth::id();

        $bookings = BookingPerformer::whereHas('performer.user', function($q) use($userId) {
            $q->where('id', $userId);
        })
        ->whereHas('booking', function ($query) {
            $query->where('status', 'ACCEPTED');
        })
        ->with(['booking', 'booking.bookingPerformers.performer.user'])
        ->get()
        ->groupBy('booking_id')
        ->map(function ($performers) use ($userId) {
            $booking = $performers->first()->booking;
            $performerNames = $booking->bookingPerformers->map(function ($bp) {
                return $bp->performer->user->name;
            })->implode(', ');

            // Find existing group chat created by client
            $groupChat = GroupChat::where('booking_id', $booking->id)->first();


            if (!$groupChat) {
                return null; // Skip if no client group chat exists
            }

            // Add this performer to existing group chat
            $groupChat->users()->syncWithoutDetaching([$userId]);

            $user = \App\Models\User::find($userId);
            return [
                'booking_id' => $booking->id,
                'event_name' => $booking->event_name,
                'performers' => $performerNames,
                'group_chat_id' => $groupChat->id,
                'user_id' => $userId,
                'user_profile' => $user ? $user->image_profile : null
            ];
        })
        ->filter() // Remove null values
        ->values();

        return response()->json([
            'status' => 'success',
            'data' => $bookings
        ]);

    } catch (\Exception $e) {
        Log::error("Error fetching group chats: " . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch chats'], 500);
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
public function canChatPostClient()
{
    try {
        // Get the authenticated client user
        $clientId = Auth::id();

        // Retrieve all posts created by the authenticated client
        $clientPosts = Post::where('user_id', $clientId)->pluck('id');

        // Ensure the client has posts
        if ($clientPosts->isEmpty()) {
            return response()->json(['error' => 'No posts found for this client.'], 404);
        }

        // Retrieve all applications where the post belongs to the client and the message is 'ENABLED'
        $applications = Applications::whereIn('post_id', $clientPosts)
            ->where('message', 'ENABLED') // Check if the message is 'ENABLED'
            ->with(['performer.performerDetails']) // Load related performer details
            ->get();

        // Extract unique performer details from the applications
        $performers = $applications->pluck('performer.performerDetails')->unique('id')->values();

        return response()->json(['status' => 'success', 'data' => $performers], 200);
    } catch (\Exception $e) {
        Log::error("Error checking chat availability for post clients: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred. Please try again.'], 500);
    }
}

 public function fetchChatNotifications(Request $request)
    {
        try {
            // Get the authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User not authenticated.'], 401);
            }

            // Fetch recent chats where the user is either the sender or the receiver
            $recentChats = Chat::where('receiver_id', $user->id)
                ->orWhere('sender_id', $user->id)
                ->with(['sender', 'receiver']) // Include sender and receiver details
                ->latest() // Order by the most recent messages
                ->limit(50) // Adjust the limit as needed
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $recentChats,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch chat notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markAsSeen(Request $request)
    {
        try {
            $chat = Chat::findOrFail($request->message_id);
            $seenBy = json_decode($chat->seen_by ?? '[]', true);
            
            if (!in_array(auth()->id(), $seenBy)) {
                $seenBy[] = auth()->id();
                $chat->seen_by = json_encode($seenBy);
                $chat->save();
                
                broadcast(new MessageSeen($chat))->toOthers();
            }
            
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark message as seen'], 500);
        }
    }
}
