<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestHistory extends Model
{
    use HasFactory;
    protected $table = 'request_history';

    protected $fillable = [
        'user_id',
        'amount',
        'reference_number',
        'receipt_path',
        'status',
        'balance_before',
        'balance_after'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}