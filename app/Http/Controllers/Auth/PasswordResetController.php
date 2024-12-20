<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CustomResetPasswordNotification;

class PasswordResetController extends Controller
{
    // Send the password reset link email
    public function sendResetLinkEmail(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $token = Str::random(64);

    // Store the plaintext token in the password_reset_tokens table
    DB::table('password_reset_tokens')->updateOrInsert(
        ['email' => $request->email],
        ['token' => $token, 'created_at' => now()]
    );

    $user = User::where('email', $request->email)->first();

    if ($user) {
        // Send the reset link notification
        Notification::send($user, new CustomResetPasswordNotification($token));

        Log::info('Password reset link generated and email sent', [
            'email' => $user->email,
            'url' => url(route('password.reset', [
                'token' => $token,
                'email' => $user->email,
            ], false))
        ]);

        return response()->json(['message' => 'Password reset link sent.']);
    }

    return response()->json(['message' => 'Failed to send password reset link.'], 400);
}

    // Reset the user's password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $tokenEntry = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if ($tokenEntry && $tokenEntry->token === $request->token) {
            $user = User::where('email', $request->email)->first();
            if ($user) {
                $user->forceFill(['password' => Hash::make($request->password)])->save();

                // Delete the token after successfully resetting the password
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();

                return response()->json(['message' => 'Your password has been successfully reset.']);
            }
        }

        return response()->json(['message' => 'Invalid or expired token. Please request a new reset link.'], 400);
    }
    public function resetEmail(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'new_email' => 'required|email|unique:users,email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Verify the user's password
        if (!password_verify($request->password, $user->password)) {
            return response()->json(['error' => 'Incorrect password.'], 401);
        }

        try {
            // Update the email address
            $user->email = $request->new_email;
            $user->save();

            return response()->json(['message' => 'Email updated successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update email.'], 500);
        }
    }
}
