<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable; // Correct import for Authenticatable
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use App\Notifications\CustomResetPasswordNotification;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasProfilePhoto, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'lastname',
        'email',
        'image_profile',
        'password',
        'role',
        'talento_coin_balance',
        'location',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'talento_coin_balance' => 'decimal:2',
    ];


    /**
     * Relationships
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }
    // Relationship with PerformerPortfolio
    public function performerPortfolio()
    {
        return $this->hasOne(PerformerPortfolio::class, 'performer_id');
    }

    // Relationship with Bookings as Performer
    public function bookingsAsPerformer()
    {
        return $this->hasMany(Booking::class, 'performer_id');
    }

    // Relationship with Bookings as Client
    public function bookingsAsClient()
    {
        return $this->hasMany(Booking::class, 'client_id');
    }

    // Relationship with Posts
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    // Relationship with Feedbacks as Performer
    public function feedbacksAsPerformer()
    {
        return $this->hasMany(Feedback::class, 'performer_id');
    }

    // Relationship with Ratings
    public function feedback()
    {
        return $this->hasMany(Feedback::class, 'performer_id');
    }

    // Relationship with Availabilities
    public function availabilities()
    {
        return $this->hasMany(Availability::class, 'performer_id');
    }

    // Relationship with Deposit Requests
    public function depositRequests()
    {
        return $this->hasMany(DepositRequest::class);
    }

    // Relationship with Request History
    public function requestHistory()
    {
        return $this->hasMany(RequestHistory::class);
    }

    // Relationship with Admin Wallet
    public function adminWallet()
    {
        return $this->hasMany(AdminWallet::class);
    }

    // Relationship with Notifications
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

}
