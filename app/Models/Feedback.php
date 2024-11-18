<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = [
        'performer_id',
        'user_id',
        'rating',
        'review',
    ];

    public function performer()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
