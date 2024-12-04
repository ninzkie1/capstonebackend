<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'performer_id',
        'transaction_type',
        'amount',
        'balance_before',
        'balance_after',
        'reference_number',
        'receipt_path',
        'status',
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
    
    
    public function performer()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }
}
