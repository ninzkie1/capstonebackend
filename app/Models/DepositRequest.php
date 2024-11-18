<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepositRequest extends Model
{
    use HasFactory;

    // Ensure the table name matches the migration
    protected $table = 'deposit_requests';

    // The attributes that are mass assignable
    protected $fillable = [
        'user_id',
        'amount',
        'reference_number',
        'receipt_path',
        'status',
        'name'
    ];

    /**
     * Define a relationship to the User model.
     * A DepositRequest belongs to a User.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Attribute casting for convenience.
     */
    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
