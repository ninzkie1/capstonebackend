<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformerPortfolio extends Model
{
    protected $fillable = [
        'performer_id',
        'event_name',
        'theme_name',
        'talent_name',
        'location',
        'description',
        'image_profile',
        'rate',
        'average_rating',
        'review',
        'phone',
        'experience',
        'genres',
        'performer_type',
        'availability_status',
    ];
    public function user() {
        return $this->belongsTo(User::class, 'performer_id'); 
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class, 'performer_id');
    }

    public function calculateAverageRating()
    {
        return round($this->feedback()->avg('rating'), 2); 
    }
    public function highlights()
    {
        return $this->hasMany(Highlight::class, 'portfolio_id');
    }
    
}
