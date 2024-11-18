<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;
use App\Models\DepositRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Events\NewDepositRequest;
use App\Models\RequestHistory;
use App\Models\WithdrawRequest;
use App\Events\BalanceUpdated;
use App\Events\NewWithdrawRequest;
use App\Events\RequestHistoryUpdated;
use App\Models\Notification;

class WalletController extends Controller
{
    public function store(Request $request)
    {
        // Validation
        $validatedData = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reference_number' => 'required|string|max:255',
            'receipt' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle receipt upload
        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
        }

        // Check if user is authenticated
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        // Create new deposit request
        try {
            $depositRequest = DepositRequest::create([
                'user_id' => $userId,
                'amount' => $validatedData['amount'],
                'reference_number' => $validatedData['reference_number'],
                'receipt_path' => $receiptPath,
                'status' => 'PENDING',
            ]);

            
                Notification::create([
                'user_id' => $userId,
                'type' => 'deposit',
                'message' => Auth::user()->name . ' requested a deposit of ' . $validatedData['amount'] . ' TalentoCoins.',
            ]);
            // event(new NewDepositRequest($depositRequest));


            return response()->json([
                'message' => 'Deposit request submitted successfully.',
                'data' => $depositRequest,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving deposit request.', 'error' => $e->getMessage()], 500);
        }
    }
    public function getDepositRequests()
    {
        try {
            $user = Auth::user();
            if ($user->role === 'admin') {
                $depositRequests = DepositRequest::with('user')->get();
            } else {
                $depositRequests = DepositRequest::where('user_id', $user->id)->get();
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $depositRequests,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch deposit requests.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approveRequest(Request $request, $id)
{
    $validatedData = $request->validate([
        'amount' => 'required|numeric|min:0.01',
    ]);

    try {
        // Find the deposit request by its ID
        $depositRequest = DepositRequest::findOrFail($id);

        if ($depositRequest->status !== 'PENDING') {
            return response()->json([
                'message' => 'This request has already been processed.'
            ], 400);
        }

        // Get the current balance of the user before the approval
        $user = $depositRequest->user;
        $balanceBefore = $user->talento_coin_balance;

        // Use the specified amount from the request to update the user's balance
        $amountToAdd = $validatedData['amount'];
        $user->talento_coin_balance += $amountToAdd;
        $user->save();

        // Record balance_after as the new balance
        $balanceAfter = $user->talento_coin_balance;

        // Transfer the approved request to request_history table with balance info
        RequestHistory::create([
            'user_id' => $depositRequest->user_id,
            'amount' => $amountToAdd,
            'reference_number' => $depositRequest->reference_number,
            'receipt_path' => $depositRequest->receipt_path,
            'status' => 'APPROVED',
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
        ]);

        // Delete the record from deposit_requests
        $depositRequest->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Request approved successfully, specified TalentoCoin amount added to the user, and moved to request history.',
        ], 200);
    } catch (\Exception $e) {
        Log::error('Failed to approve request: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to approve request.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    
    
    public function declineRequest($id)
    {
        try {
            // Find the deposit request by its ID
            $depositRequest = DepositRequest::findOrFail($id);
    
            if ($depositRequest->status !== 'PENDING') {
                return response()->json([
                    'message' => 'This request has already been processed.'
                ], 400);
            }
    
            // Get the current balance of the user
            $user = $depositRequest->user;
            $currentBalance = $user->talento_coin_balance;
    
            // Transfer the declined request to request_history table with the current balance
            RequestHistory::create([
                'user_id' => $depositRequest->user_id,
                'amount' => $depositRequest->amount,
                'reference_number' => $depositRequest->reference_number,
                'receipt_path' => $depositRequest->receipt_path,
                'status' => 'REJECTED',
                'balance_before' => $currentBalance,
                'balance_after' => $currentBalance,  // No change in balance for declined request
            ]);
    
            // Delete the record from deposit_requests
            $depositRequest->delete();
    
            return response()->json([
                'status' => 'success',
                'message' => 'Request declined successfully and transferred to request history.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to decline request: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to decline request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function approveWithdrawRequest(Request $request, $id)
    {
        $validatedData = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);
    
        try {
            // Find the withdraw request by its ID
            $withdrawRequest = WithdrawRequest::findOrFail($id);
    
            if ($withdrawRequest->status !== 'PENDING') {
                return response()->json(['message' => 'This request has already been processed.'], 400);
            }
    
            // Get the current balance of the user before the withdrawal approval
            $user = $withdrawRequest->user;
            $balanceBefore = $user->talento_coin_balance;
    
            // Check if the user has enough balance for withdrawal
            $amountToDeduct = $validatedData['amount'];
            if ($balanceBefore < $amountToDeduct) {
                return response()->json([
                    'message' => 'Insufficient balance for withdrawal.'
                ], 400);
            }
    
            // Deduct the specified amount from the user's balance
            $user->talento_coin_balance -= $amountToDeduct;
            $user->save();
    
            // Record balance_after as the new balance
            $balanceAfter = $user->talento_coin_balance;
    
            // Transfer the approved request to request_history table with balance info
            RequestHistory::create([
                'user_id' => $withdrawRequest->user_id,
                'amount' => $amountToDeduct,
                'reference_number' => 'WDR-' . strtoupper(uniqid()), // Generate reference number for withdrawal
                'receipt_path' => $withdrawRequest->qr_code_path,
                'status' => 'APPROVED',
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);
    
            // Delete the record from withdraw_requests after approval
            $withdrawRequest->delete();
    
            // Dispatch the BalanceUpdated event
            // event(new BalanceUpdated($user->id, $user->talento_coin_balance));
    
            return response()->json([
                'status' => 'success',
                'message' => 'Withdraw request approved successfully, specified TalentoCoin amount deducted from the user, and moved to request history.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to approve withdraw request: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve withdraw request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    public function declineWithdrawRequest($id)
{
    try {
        // Find the withdraw request by its ID
        $withdrawRequest = WithdrawRequest::findOrFail($id);

        if ($withdrawRequest->status !== 'PENDING') {
            return response()->json(['message' => 'This request has already been processed.'], 400);
        }

        // Get the current balance of the user
        $user = $withdrawRequest->user;
        $currentBalance = $user->talento_coin_balance;

        // Generate a reference number for declined withdrawal requests if it doesn't exist
        $referenceNumber = 'WD-' . strtoupper(uniqid());

        // Transfer the declined request to request_history table with the current balance and QR code path
        RequestHistory::create([
            'user_id' => $withdrawRequest->user_id,
            'amount' => $withdrawRequest->amount,
            'reference_number' => $referenceNumber, // Adding the reference number
            'receipt_path' => $withdrawRequest->qr_code_path, // Including the QR code path to preserve it in history
            'status' => 'REJECTED',
            'balance_before' => $currentBalance,
            'balance_after' => $currentBalance, // No change in balance for declined request
        ]);

        // Delete the record from withdraw_requests after decline
        $withdrawRequest->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Withdraw request declined successfully and transferred to request history.',
        ], 200);
    } catch (\Exception $e) {
        Log::error('Failed to decline withdraw request: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to decline withdraw request.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function withdraw(Request $request)
{
    // Log request data for debugging
    Log::info('Withdraw request received.', ['data' => $request->all()]);

    // Validation
    $validatedData = $request->validate([
        'account_name' => 'required|string|max:255',
        'account_number' => 'required|string|max:20',
        'amount' => 'required|numeric|min:0.01',
        'qr_code' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    // Handle QR code upload
    $qrCodePath = null;
    if ($request->hasFile('qr_code')) {
        try {
            $qrCodePath = $request->file('qr_code')->store('withdraw_qr_codes', 'public');
            Log::info("QR code stored at path: " . $qrCodePath);
        } catch (\Exception $e) {
            Log::error("Error storing QR code: " . $e->getMessage());
            return response()->json(['message' => 'Error storing QR code.'], 500);
        }
    } else {
        Log::error("QR code file not uploaded.");
        return response()->json(['message' => 'QR code file not uploaded'], 400);
    }

    // Check if user is authenticated
    $userId = Auth::id();
    if (!$userId) {
        Log::error("User not authenticated.");
        return response()->json(['message' => 'User not authenticated'], 401);
    }

    // Create new withdraw request
    try {
        $withdrawRequest = WithdrawRequest::create([
            'user_id' => $userId,
            'account_name' => $validatedData['account_name'],
            'account_number' => $validatedData['account_number'],
            'amount' => $validatedData['amount'],
            'qr_code_path' => $qrCodePath,
            'status' => 'PENDING',
        ]);

        Notification::create([
            'user_id' => $userId,
            'type' => 'withdraw',
            'message' => Auth::user()->name . ' requested a withdrawal of ' . $validatedData['amount'] . ' TalentoCoins.',
        ]);

        // Broadcast the new withdrawal request event
        // event(new NewWithdrawRequest($withdrawRequest));

        return response()->json([
            'message' => 'Withdraw request submitted successfully.',
            'data' => $withdrawRequest,
        ], 201);
    } catch (\Exception $e) {
        Log::error("Error saving withdraw request: " . $e->getMessage());
        return response()->json([
            'message' => 'Error saving withdraw request.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function getWithdrawRequests()
{
    try {
        // Check if the user is an admin or a normal user
        $user = Auth::user();

        if ($user->role === 'admin') {
            // Admins can view all withdraw requests with user balance information
            $withdrawRequests = WithdrawRequest::with('user:id,name,talento_coin_balance')->get();
        } else {
            // Regular users can only view their own requests with balance information
            $withdrawRequests = WithdrawRequest::with('user:id,name,talento_coin_balance')
                ->where('user_id', $user->id)
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $withdrawRequests,
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch withdraw requests.',
            'error' => $e->getMessage()
        ], 500);
    }
}

    
    public function getRequestHistory()
{
    try {
        $requestHistory = RequestHistory::with(['user' => function ($query) {
            $query->select('id', 'name'); // Only fetch necessary fields
        }])->get();

        return response()->json([
            'status' => 'success',
            'data' => $requestHistory,
        ], 200);
    } catch (\Exception $e) {
        Log::error('Failed to fetch request history: ' . $e->getMessage());

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch request history.',
            'error' => $e->getMessage(),
        ], 500);
    }
}



//SHOW BALANCE OF ALL LOGIN USERS
public function showBalance()
{
    try {
        // Get the currently authenticated user
        $user = Auth::user();

        // If the user is not authenticated, return an error response
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Return the talento_coin_balance of the authenticated user
        return response()->json([
            'status' => 'success',
            'balance' => $user->talento_coin_balance,
        ], 200);

    } catch (\Exception $e) {
        // Log error message if needed
        Log::error("Failed to fetch talento_coin_balance: " . $e->getMessage());

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch talento_coin_balance.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

//SHOW ALL TRANSACTION HISTORY OF USERS
public function getUserRequestHistory()
    {
        try {
            // Get the authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated.',
                ], 401);
            }

            // Fetch only the requests belonging to the authenticated user
            $userRequestHistory = RequestHistory::with(['user' => function ($query) {
                $query->select('id', 'name'); // Fetch only necessary fields for the user
            }])->where('user_id', $user->id)->get();

            return response()->json([
                'status' => 'success',
                'data' => $userRequestHistory,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user request history: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user request history.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function getNotifications()
    {
        try {
            // Use eager loading to load the 'user' relationship with each notification
            $notifications = Notification::with('user')->latest()->get();
    
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
        // Method to delete a notification
        public function deleteNotification($id)
        {
            try {
                // Find the notification by ID
                $notification = Notification::find($id);
        
                if (!$notification) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Notification not found.'
                    ], 404);
                }
        
                // Delete the notification
                $notification->delete();
        
                return response()->json([
                    'status' => 'success',
                    'message' => 'Notification deleted successfully.'
                ], 200);
            } catch (\Exception $e) {
                Log::error('Failed to delete notification: ' . $e->getMessage());
        
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete notification.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
        
}
