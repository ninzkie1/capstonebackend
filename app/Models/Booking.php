<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',  
        'event_name',
        'theme_name',
        'start_date',
        'start_time',
        'end_time',
        'municipality_name',
        'barangay_name',
        'notes',
        'status',
    ];
   

    // Relationship to PerformerPortfolio (since performer_id references PerformerPortfolio)
    public function performer()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
    public function performerPortfolio()
{
    return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
}
    public function transactions()
{
    return $this->hasMany(Transaction::class, 'booking_id');
}
public function performers()
{
    return $this->belongsToMany(PerformerPortfolio::class, 'booking_performer', 'booking_id', 'performer_id')
        ->withPivot('status')
        ->withTimestamps();
}
//bookingController for performer
public function bookingPerformers()
{
    return $this->hasMany(BookingPerformer::class, 'booking_id');
}
public function event_details()
{
    return $this->hasOne(Event::class);
}


    
}
