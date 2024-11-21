<?php
namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Booking;

class TransactionController extends Controller
{
    // Store a new transaction
    public function store(Request $request)
    {
        // Validate the incoming request
        $validatedData = $request->validate([
            'client_id' => 'required|integer',
            'amount' => 'required|numeric',
            'client_name' => 'required|string|max:255',
            'performer_name' => 'nullable|string|max:255',
            'transaction_status' => 'required|string|max:255',
        ]);

        // Create a new transaction record in the database
        $transaction = Transaction::create([
            'client_id' => $validatedData['client_id'],
            'amount' => $validatedData['amount'],
            'client_name' => $validatedData['client_name'],
            'performer_name' => $validatedData['performer_name'] ?? null,
            'transaction_status' => $validatedData['transaction_status'],
            'transaction_date' => now(),
        ]);

        // Return a success response
        return response()->json($transaction, 201);
    }


    // Get all transactions
    public function index()
    {
        $user = Auth::user();

        // Ensure that the user is authenticated
        if (!$user) {
            return response()->json(['error' => 'User not authenticated.'], 401);
        }

        // Fetch transactions related to bookings where the client is the authenticated user
        $transactions = Transaction::with(['booking.performer.user'])
            ->whereHas('booking', function ($query) use ($user) {
                $query->where('client_id', $user->id);
            })
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'performer_name' => $transaction->booking->performer->user->name ?? 'Unknown Performer',
                    'transaction_type' => $transaction->transaction_type,
                    'amount' => $transaction->amount,
                    'start_date' => $transaction->booking->start_date,
                    'status' => $transaction->status,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $transactions], 200);
    }
    

    // Show a specific transaction
    public function show($id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }
        return response()->json($transaction);
    }
    public function approveTransaction($transactionId)
    {
        // Retrieve the transaction by its ID
        $transaction = Transaction::find($transactionId);
        if (!$transaction) {
            return response()->json(['error' => 'Transaction not found.'], 404);
        }
    
        // Ensure that the transaction is for Booking Received and is currently pending
        if ($transaction->transaction_type !== 'Booking Received' || $transaction->status !== 'PENDING') {
            return response()->json(['error' => 'Transaction cannot be approved.'], 400);
        }
    
        // Find the performer associated with the transaction (assuming it's tied to `user_id`)
        $performer = User::find($transaction->user_id);
        if (!$performer) {
            return response()->json(['error' => 'Performer not found.'], 404);
        }
    
        // Retrieve the related booking
        $booking = $transaction->booking;
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }
    
        DB::beginTransaction();
    
        try {
            // Update the performer's balance
            $balanceBeforePerformer = $performer->talento_coin_balance;
            $performer->talento_coin_balance += $transaction->amount;
            $performer->save();
    
            // Update the performer's transaction
            $transaction->balance_before = $balanceBeforePerformer;
            $transaction->balance_after = $performer->talento_coin_balance;
            $transaction->status = 'APPROVED';
            $transaction->save();
    
            // Update the booking status to 'COMPLETED'
            $booking->status = 'APPROVED';
            $booking->save();
    
            // Find the client's corresponding `Booking Payment` transaction
            $clientTransaction = Transaction::where('booking_id', $booking->id)
                ->where('transaction_type', 'Booking Payment')
                ->where('user_id', $booking->client_id)
                ->first();
    
            // Update the client's transaction status to 'COMPLETED'
            if ($clientTransaction) {
                $clientTransaction->status = 'APPROVED';
                $clientTransaction->save();
            }
    
            DB::commit();
    
            return response()->json(['message' => 'Transaction approved successfully and balances updated.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Transaction Approval Error: " . $e->getMessage());
            return response()->json(['error' => 'Error approving transaction.'], 500);
        }
    }
    

public function declineTransaction($transactionId)
{
    // Retrieve the transaction by its ID
    $transaction = Transaction::find($transactionId);
    if (!$transaction) {
        return response()->json(['error' => 'Transaction not found.'], 404);
    }

    // Ensure that the transaction is for Booking Received and is currently pending
    if ($transaction->transaction_type !== 'Booking Received' || $transaction->status !== 'PENDING') {
        return response()->json(['error' => 'Transaction cannot be declined.'], 400);
    }

    // Get the authenticated user as the client
    $client = Auth::user();
    if (!$client) {
        return response()->json(['error' => 'User not authenticated.'], 401);
    }

    // Find the related booking for this transaction
    $booking = Booking::find($transaction->booking_id);
    if (!$booking) {
        return response()->json(['error' => 'Booking not found.'], 404);
    }

    DB::beginTransaction();

    try {
        // Refund the transaction amount to the client's balance
        $balanceBeforeClient = $client->talento_coin_balance;
        $client->talento_coin_balance += $transaction->amount;
        $client->save();

        // Update the transaction details to mark it as refunded
        $transaction->balance_before = $balanceBeforeClient;
        $transaction->balance_after = $client->talento_coin_balance;
        $transaction->transaction_type = 'Cancelled Booking';
        $transaction->status = 'CANCELLED';
        $transaction->save();

        // Update the booking status to 'DECLINED'
        $booking->status = 'CANCELLED';
        $booking->save();

         // Find the client's corresponding `Booking Payment` transaction
         $clientTransaction = Transaction::where('booking_id', $booking->id)
         ->where('transaction_type', 'Booking Payment')
         ->where('user_id', $booking->client_id)
         ->first();

     // Update the client's transaction status to 'COMPLETED'
     if ($clientTransaction) {
         $clientTransaction->status = 'CANCELLED';
         $clientTransaction->save();
     }

        DB::commit();

        return response()->json(['message' => 'Transaction declined successfully and amount refunded to client.'], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Transaction Decline Error: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred while declining the transaction. Please try again.'], 500);
    }
}
public function getPerformerTransactions()
{
    try {
        // Get the authenticated user
        $user = Auth::user();
        
        // Ensure that the user is authenticated
        if (!$user) {
            return response()->json(['error' => 'User not authenticated.'], 401);
        }
        
        // Make sure the user is a performer
        if ($user->role !== 'performer') {
            return response()->json(['error' => 'Unauthorized access.'], 403);
        }
        
        // Fetch transactions for the authenticated performer
        $transactions = Transaction::where('user_id', $user->id) // This assumes the user_id represents the performer
            ->with('booking') // Ensure booking relation is loaded
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'performer_name' => $transaction->booking->performer->user->name ?? 'Unknown Performer',
                    'transaction_type' => $transaction->transaction_type,
                    'amount' => $transaction->amount,
                    'start_date' => $transaction->booking->start_date,
                    'status' => $transaction->status,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $transactions], 200);
    } catch (\Exception $e) {
        Log::error("Error fetching performer transactions: " . $e->getMessage());
        return response()->json(['error' => 'An unexpected error occurred'], 500);
    }
}
// public function getClientsWithPendingTransactions()
// {
//     try {
//         $userId = Auth::id(); // Get the authenticated user ID (assumed to be the performer)

//         // Ensure that the authenticated user exists
//         if (!$userId) {
//             return response()->json(['error' => 'User not authenticated.'], 401);
//         }

//         // Find all transactions where the booking's performer matches the logged-in user (performer), and the status is pending
//         $transactions = Transaction::where('status', 'PENDING')
//             ->whereHas('booking', function ($query) use ($userId) {
//                 $query->where('performer_id', $userId);
//             })
//             ->get();

//         // Extract unique client IDs from the transactions
//         $clientIds = $transactions->pluck('booking.client_id')->unique();

//         // Fetch the user details for these clients
//         $clients = User::whereIn('id', $clientIds)->get();

//         return response()->json(['status' => 'success', 'data' => $clients], 200);
//     } catch (\Exception $e) {
//         // Log the exception for debugging
//         Log::error("Error retrieving clients with pending transactions: " . $e->getMessage());
//         return response()->json(['error' => 'Error retrieving clients with pending transactions. Please try again.'], 500);
//     }
// }

}



