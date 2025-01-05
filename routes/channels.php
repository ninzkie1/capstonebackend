<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
Broadcast::channel('admin-notifications', function ($user) {
    return $user->role === 'admin';
});

Broadcast::channel('performer.{performerId}', function ($user, $performerId) {
    // Example where only the performer or authorized users can listen
    return (int) $user->id === (int) $performerId; // Authentication logic for private channels
});
Broadcast::channel('bookings', function ($user) {
    return true; // Allowing everyone for simplicity
});


