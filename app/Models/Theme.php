<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Theme extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'event_id'];

    // Relationship with event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
