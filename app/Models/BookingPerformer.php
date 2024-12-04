<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingPerformer extends Model
{
    use HasFactory;

    protected $table = 'booking_performer'; // Specify the pivot table name

    protected $fillable = [
        'booking_id',          // ID of the booking
        'performer_id',        // ID of the performer
    ];

    // Define relationships if needed (optional, as this is a pivot table)
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function performer()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }
}
