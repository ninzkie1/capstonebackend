<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewWithdrawRequest implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $withdrawRequest;

    public function __construct($withdrawRequest)
    {
        $this->withdrawRequest = $withdrawRequest->load('user');
    }

    public function broadcastOn()
    {
        return new Channel('admin-notifications');
    }

    public function broadcastAs()
    {
        return 'new-withdraw-request';
    }
}