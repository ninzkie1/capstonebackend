<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;
    protected $table = 'posts';
    protected $fillable = [
        'client_name',
        'event_name',
        'theme_name',
        'start_time',
        'end_time',
        'description',
        'talents',
        'municipality_name',
        'barangay_name',
        'user_id',
        'date', 
        'audience',
        'performer_needed'
    ];    
    protected $casts = [
        'talents' => 'array', 
        
    ];
    public function comments()
{
    return $this->hasMany(Comment::class);
}
public function user()
{
    return $this->belongsTo(User::class);
}
public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function theme()
    {
        return $this->belongsTo(Theme::class, 'theme_id');
    }

    public function municipality()
    {
        return $this->belongsTo(Municipality::class, 'municipality_id');
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }
}