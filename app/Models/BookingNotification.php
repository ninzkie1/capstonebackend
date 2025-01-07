<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id', 
        'type',
        'message',
        'is_read'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}