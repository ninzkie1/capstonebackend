<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnavailableDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'performer_id',
        'unavailable_date',
    ];

    // Relationship to User
    public function performer()
    {
        return $this->belongsTo(User::class, 'performer_id');
    }
}
