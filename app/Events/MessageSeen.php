<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSeen implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chat;

    public function __construct(Chat $chat)
    {
        $this->chat = $chat;
    }

    public function broadcastOn()
    {
        return new Channel('chat-channel');
    }

    public function broadcastAs()
    {
        return 'message.seen';
    }

    public function broadcastWith()
    {
        return [
            'chat' => [
                'id' => $this->chat->id,
                'seen_by' => $this->chat->seen_by,
                'sender_id' => $this->chat->sender_id,
                'receiver_id' => $this->chat->receiver_id,
                'group_chat_id' => $this->chat->group_chat_id
            ]
        ];
    }
}