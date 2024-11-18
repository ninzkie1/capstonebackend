<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Availability extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'availabilities';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'performer_id',
        'date',
        'start_time',
        'end_time',
        'availability_type',
    ];

    /**
     * The performer that owns the availability.
     */
    public function performer()
    {
        return $this->belongsTo(User::class, 'performer_id');
    }
}
