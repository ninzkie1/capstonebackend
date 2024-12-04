<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Applications extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'performer_id',
        'message',
        'status',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    public function performer()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'performer_id');
    }
    public function client()
{
    return $this->hasOneThrough(User::class, Post::class, 'id', 'id', 'post_id', 'user_id');
}
}
