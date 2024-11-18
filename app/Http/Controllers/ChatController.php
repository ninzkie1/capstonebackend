<?php
namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use App\Events\MessageSent;

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
}
