<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminWallet extends Model
{
    use HasFactory;

    // Define the table name explicitly (optional if following Laravel naming conventions)
    protected $table = 'admin_wallets';

    // Specify the fields that are mass assignable
    protected $fillable = [
        'account_name',
        'account_number',
        'qr_code_path',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
