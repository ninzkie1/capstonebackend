<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestHistoryUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $requestHistory;

    public function __construct($requestHistory)
    {
        $this->requestHistory = $requestHistory->load('user');
    }


    public function broadcastOn()
    {
        return new Channel('admin-notifications');
    }

    public function broadcastAs()
    {
        return 'request-history-updated';
    }
}
