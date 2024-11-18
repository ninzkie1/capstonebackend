<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformerApplication extends Model
{
    use HasFactory;

    protected $table = 'performer_applications';

    protected $fillable = [
        'user_id',
        'name',
        'lastname',
        'email',
        'password',
        'talent_name',
        'location',
        'description',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    // Relationship: A performer application belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
