<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;
use App\Models\Chat;
use Illuminate\Support\Facades\Log;

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
  
    public function deleteNotifications($id)
    {
        try {
            // Get the authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated.'
                ], 401);
            }

            // Find the notification by ID
            $notification = Chat::find($id);

            if (!$notification) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Notification not found.'
                ], 404);
            }

            // Ensure the authenticated user is either the sender or the receiver
            if ($notification->sender_id !== $user->id && $notification->receiver_id !== $user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You are not authorized to delete this notification.'
                ], 403);
            }

            // Delete the notification
            $notification->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Notification deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error deleting notification: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete notification.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
}