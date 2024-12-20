<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function getNotificationsForPerformer()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated.',
                ], 401);
            }

            if ($user->role !== 'performer') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User is not authorized to view these notifications.',
                ], 403);
            }

            $notifications = Notification::where('user_id', $user->id)
                ->where('type', 'booking')
                ->latest()
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $notifications,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
}