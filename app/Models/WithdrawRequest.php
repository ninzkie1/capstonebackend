<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WithdrawRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_name',
        'account_number',
        'amount',
        'qr_code_path',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
