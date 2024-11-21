<?php
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Auth\PasswordResetController;
// Main page route
Route::get('/', function () {
    return view('welcome');
});

// Authenticated routes with Sanctum and Jetstream session middleware
Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');
});

Route::get('password-reset/{token}', function ($token) {
    $email = request('email'); // Get the email from the query parameters
    if (!$email) {
        return response()->json(['message' => 'Missing email address'], 400);
    }
    return redirect("http://192.168.254.116:5173/password-reset?token={$token}&email={$email}");
})->name('password.reset');
