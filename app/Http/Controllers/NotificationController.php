<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;
use App\Models\Chat;
use Illuminate\Support\Facades\Log;
use App\Models\BookingNotification;

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
    public function getBookingNotifications()
{
    try {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $notifications = BookingNotification::where('user_id', $user->id)
            ->with(['booking'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch notifications',
            'error' => $e->getMessage()
        ], 500);
    }
}
public function deleteBookingNotification($id)
{
    try {
        $notification = BookingNotification::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification deleted successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to delete notification'
        ], 500);
    }
}
  public function markAsRead($id = null)
    {
        try {
            $user = Auth::user();
            
            if ($id) {
                // Mark specific notification as read
                $notification = BookingNotification::where('user_id', $user->id)
                    ->where('id', $id)
                    ->first();
                    
                if ($notification) {
                    $notification->update(['is_read' => true]);
                }
            } else {
                // Mark all notifications as read
                BookingNotification::where('user_id', $user->id)
                    ->update(['is_read' => true]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Notifications marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark notifications as read'
            ], 500);
        }
    }
    
}