<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoPlay extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'video_id',
        'play_count',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function video()
    {
        return $this->belongsTo(Highlight::class, 'video_id');
    }
}