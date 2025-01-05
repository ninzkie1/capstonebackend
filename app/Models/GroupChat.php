<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupChat extends Model
{
    protected $fillable = ['name','booking_id'];

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'group_chat_user');
    }
}
