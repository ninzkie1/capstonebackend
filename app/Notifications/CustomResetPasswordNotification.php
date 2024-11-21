<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPasswordNotification extends BaseResetPassword
{
    public function toMail($notifiable)
{
    // Construct the URL including the plaintext token and email
    $url = url(route('password.reset', [
        'token' => $this->token,
        'email' => $notifiable->email,
    ], false));

    return (new MailMessage)
        ->subject('Reset Your Password')
        ->greeting("Hello, {$notifiable->name}!")
        ->line('You are receiving this email because we received a password reset request for your account.')
        ->action('Reset Password', $url)
        ->line('This password reset link will expire in 60 minutes.')
        ->line('If you did not request a password reset, no further action is required.')
        ->salutation('Best Regards, Talento Team');
}
}
