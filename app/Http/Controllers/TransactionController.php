<?php
namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Booking;
use App\Models\BookingPerformer;
use App\Models\PerformerPortfolio;
use Illuminate\Support\Carbon;

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
        
            // Log transaction data for debugging
            Log::info('Transaction Details', [
                'id' => $transaction->id,
                'transaction_type' => $transaction->transaction_type,
                'status' => $transaction->status,
            ]);
        
            // Ensure that the transaction is for waiting for approval and is currently pending
            if ($transaction->transaction_type !== 'Waiting for Approval' || $transaction->status !== 'PENDING') {
                return response()->json(['error' => 'Transaction cannot be approved.'], 400);
            }
        
            DB::beginTransaction();
        
            try {
                // Find the performer associated with the performer_id in transactions
                $performerPortfolio = PerformerPortfolio::find($transaction->performer_id);
                if (!$performerPortfolio) {
                    throw new \Exception('Performer portfolio not found.');
                }
        
                // Now get the actual performer (user) linked to this portfolio
                $performer = User::find($performerPortfolio->performer_id);
                if (!$performer) {
                    throw new \Exception('Performer user not found.');
                }
        
                // Check if the current date is the booking start date
                $booking = Booking::find($transaction->booking_id);
                if (!$booking) {
                    throw new \Exception('Booking not found.');
                }
        
                // Cast start_date as a Carbon instance and compare with today's date
                $currentDate = now(); // Current date and time
                $bookingStartDate = Carbon::parse($booking->start_date);
        
                if (!$bookingStartDate->isSameDay($currentDate)) {
                    return response()->json(['error' => 'Approval can only be made on the start date.'], 400);
                }
        
                // Update the performer's balance
                $balanceBefore = $performer->talento_coin_balance;
                $performer->talento_coin_balance += $transaction->amount;
                $performer->save();
        
                // Update the transaction details
                $transaction->balance_before = $balanceBefore;
                $transaction->balance_after = $performer->talento_coin_balance;
                $transaction->status = 'APPROVED';
                $transaction->save();
        
                // Update the corresponding performer transaction status to 'APPROVED'
                Transaction::where('booking_id', $transaction->booking_id)
                    ->where('performer_id', $transaction->performer_id)
                    ->where('transaction_type', 'Booking Accepted')
                    ->update(['status' => 'APPROVED']);
        
                // Decline all performers who haven't accepted the booking yet and refund the client
                $declinedPerformers = BookingPerformer::where('booking_id', $booking->id)
                    ->where('status', 'Pending')
                    ->get();
        
                foreach ($declinedPerformers as $declinedPerformer) {
                    // Update status of performer to 'Declined'
                    $declinedPerformer->status = 'Declined';
                    $declinedPerformer->save();
        
                    // Find the corresponding transaction and update its status and type
                    $declinedTransaction = Transaction::where('booking_id', $booking->id)
                        ->where('performer_id', $declinedPerformer->performer_id)
                        ->where('status', 'PENDING')
                        ->first();
        
                    if ($declinedTransaction) {
                        // Refund the amount to the client
                        $client = User::find($transaction->user_id);
                        if ($client) {
                            $clientBalanceBefore = $client->talento_coin_balance;
                            $client->talento_coin_balance += $declinedTransaction->amount;
                            $client->save();
                            
                            // Update the refunded transaction details
                            $declinedTransaction->balance_before = $clientBalanceBefore;
                            $declinedTransaction->balance_after = $client->talento_coin_balance;
                            $declinedTransaction->status = 'DECLINED';
                            $declinedTransaction->transaction_type = 'Refunded by system';
                            $declinedTransaction->save();
                        }
                    }
                }
        
                // Check if all performers have either accepted or declined for this booking
                $pendingPerformersCount = BookingPerformer::where('booking_id', $booking->id)
                    ->where('status', 'Pending')
                    ->count();
        
                // If no performers are left with a "Pending" status, mark the booking as COMPLETED or CANCELLED
                if ($pendingPerformersCount == 0) {
                    // Check if there are any accepted performers
                    $acceptedPerformersCount = BookingPerformer::where('booking_id', $booking->id)
                        ->where('status', 'Accepted')
                        ->count();
        
                    if ($acceptedPerformersCount > 0) {
                        $booking->status = 'COMPLETED'; // At least one performer accepted, mark as COMPLETED
                    } else {
                        $booking->status = 'CANCELLED'; // No performers accepted, mark as CANCELLED
                    }
        
                    $booking->save();
                }
        
                DB::commit();
                return response()->json(['message' => 'Transaction approved successfully.'], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error approving transaction: " . $e->getMessage());
                return response()->json(['error' => 'Failed to approve transaction.'], 500);
            }
        }
        
        public function declineTransaction($transactionId)
        {
            // Find the transaction by its ID
            $transaction = Transaction::find($transactionId);
            if (!$transaction) {
                return response()->json(['error' => 'Transaction not found.'], 404);
            }
        
            // Check if the transaction type is "Waiting for Approval" and the status is "PENDING"
            if ($transaction->transaction_type !== 'Waiting for Approval' || $transaction->status !== 'PENDING') {
                return response()->json(['error' => 'Transaction cannot be declined.'], 400);
            }
        
            DB::beginTransaction();
        
            try {
                // Find the client related to this booking
                $booking = $transaction->booking;
                if (!$booking) {
                    return response()->json(['error' => 'Booking associated with this transaction not found.'], 404);
                }
        
                $client = User::find($booking->client_id);
                if (!$client) {
                    throw new \Exception('Client not found.');
                }
        
                // Update the client's balance to reflect the refund
                $balanceBefore = $client->talento_coin_balance;
                $client->talento_coin_balance += $transaction->amount;
                $client->save();
        
                // Log the balance update for debugging
                Log::info("Client Balance Updated for Decline", [
                    'client_id' => $client->id,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $client->talento_coin_balance,
                ]);
        
                // Update the transaction details
                $transaction->balance_before = $balanceBefore;
                $transaction->balance_after = $client->talento_coin_balance;
                $transaction->transaction_type = 'Booking Cancelled'; // Mark the transaction type as Booking Cancelled
                $transaction->status = 'CANCELLED'; // Set the status to Cancelled
                $transaction->save();
        
                // Update the corresponding performer transaction status to 'CANCELLED'
                Transaction::where('booking_id', $transaction->booking_id)
                    ->where('performer_id', $transaction->performer_id)
                    ->where('transaction_type', 'Booking Accepted')
                    ->update([
                        'transaction_type' => 'Booking Cancelled',
                        'status' => 'CANCELLED'
                    ]);
        
                // Check if all transactions for this booking are declined/cancelled
                $allCancelled = Transaction::where('booking_id', $booking->id)
                    ->where('transaction_type', 'Booking Accepted')
                    ->where('status', '!=', 'CANCELLED')
                    ->count() == 0;
        
                if ($allCancelled) {
                    $booking->status = 'CANCELLED';
                    $booking->save();
        
                    // Log booking status update
                    Log::info("Booking Status Updated to Cancelled", [
                        'booking_id' => $booking->id,
                    ]);
                }
        
                DB::commit();
                return response()->json(['message' => 'Transaction declined successfully and marked as Booking Cancelled.'], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error declining transaction: " . $e->getMessage());
                return response()->json(['error' => 'Failed to decline transaction.'], 500);
            }
        }

        

    public function getPerformerTransactions()
    {
        try {
            $user = Auth::user();
           
            // Check if the user is authenticated and is a performer
            if (!$user || $user->role !== 'performer') {
                return response()->json(['error' => 'Unauthorized access.'], 403);
            }
    
            // Get the performer's portfolio ID (assuming each performer has a performerPortfolio linked to the user)
            $performerPortfolio = $user->performerPortfolio;
    
            if (!$performerPortfolio) {
                return response()->json(['error' => 'Performer portfolio not found.'], 404);
            }
    
            // Fetch transactions where performer_id matches the authenticated user
            $transactions = Transaction::where('performer_id', $performerPortfolio->id)
                ->with('booking') // Load the related booking details if needed
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'transaction_type' => $transaction->transaction_type,
                        'amount' => $transaction->amount,
                        'start_date' => $transaction->booking->start_date ?? null,
                        'status' => $transaction->status,
                        'decline_message' => $transaction->decline_message ?? null,
                    ];
                });
    
            // Return the transaction details
            return response()->json(['status' => 'success', 'data' => $transactions], 200);
    
        } catch (\Exception $e) {
            Log::error("Error fetching performer transactions: " . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => 'An unexpected error occurred. Please check the logs.'], 500);
        }
    }    
    public function getClientTransactions()
    {
        try {
            // Get the authenticated client
            $user = Auth::user();
    
            // Ensure the user is authenticated
            if (!$user) {
                return response()->json(['error' => 'User not authenticated.'], 401);
            }
    
            // Fetch transactions related to the authenticated client
            $transactions = Transaction::where('user_id', $user->id)
                ->with(['booking', 'performer.user']) // Load related booking and performer details, including the performer user
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'performer_name' => $transaction->performer && $transaction->performer->user 
                            ? $transaction->performer->user->name 
                            : 'Unknown Performer',
                        'transaction_type' => $transaction->transaction_type,
                        'amount' => $transaction->amount,
                        'start_date' => $transaction->booking->start_date ?? null,
                        'status' => $transaction->status,
                    ];
                });
    
            return response()->json(['status' => 'success', 'data' => $transactions], 200);
    
        } catch (\Exception $e) {
            Log::error("Error fetching client transactions: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch client transactions.'], 500);
        }
    }


    //get Performer Transaction 
    public function getClientPerformerTransactions($performerId)
{
    try {
        // Get the authenticated client
        $user = Auth::user();

        // Ensure the user is authenticated
        if (!$user) {
            return response()->json(['error' => 'User not authenticated.'], 401);
        }

        // Fetch transactions where the client is the authenticated user
        // and where the specified performer is involved
        $transactions = Transaction::where('user_id', $user->id)
            ->where('performer_id', $performerId)
            ->with(['booking', 'performer.user']) // Load related booking and performer details, including the user for the performer
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'performer_name' => $transaction->performer && $transaction->performer->user
                        ? $transaction->performer->user->name
                        : 'Unknown Performer',
                    'transaction_type' => $transaction->transaction_type,
                    'amount' => $transaction->amount,
                    'start_date' => $transaction->booking->start_date ?? null,
                    'status' => $transaction->status,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $transactions], 200);

    } catch (\Exception $e) {
        Log::error("Error fetching performer transactions for client: " . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch performer transactions.'], 500);
    }
}
public function cancelBooking($bookingId)
{
    try {
        // Start a database transaction
        DB::beginTransaction();

        // Validate the booking
        $booking = Booking::find($bookingId);
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }

        // Cancel the booking
        $booking->status = 'CANCELLED';
        $booking->save();

        // Process related transactions
        $transactions = Transaction::where('booking_id', $booking->id)->get();

        foreach ($transactions as $transaction) {
            if ($transaction->status === 'PENDING') {
                $transaction->status = 'CANCELLED';
                $transaction->transaction_type = 'Booking Cancelled';
                $transaction->save();

                // Refund client and distribute deductions
                $client = User::find($transaction->user_id);
                if ($client) {
                    $deduction = $transaction->amount * 0.10; // 10% deduction
                    $refundAmount = $transaction->amount - $deduction;

                    // Update client balance
                    $client->talento_coin_balance += $refundAmount;
                    $client->save();

                    // Update transaction balance details for the client
                    $transaction->balance_before = $client->talento_coin_balance - $refundAmount;
                    $transaction->balance_after = $client->talento_coin_balance;
                    $transaction->save();

                    // Split the 10% deduction
                    $adminAmount = $deduction * 0.5; // 5% to admin
                    $performerAmount = $deduction * 0.5; // 5% to performer

                    // Update admin balance
                    $admin = User::where('role', 'admin')->first();
                    if ($admin) {
                        $admin->talento_coin_balance += $adminAmount;
                        $admin->save();
                    } else {
                        Log::error("Admin user not found.");
                    }

                    $performerPortfolio = PerformerPortfolio::find($transaction->performer_id);
                    if (!$performerPortfolio) {
                        throw new \Exception('Performer portfolio not found.');
                    }
        
                // Now get the actual performer (user) linked to this portfolio
                $performer = User::find($performerPortfolio->performer_id);
                if (!$performer) {
                    throw new \Exception('Performer user not found.');
                }
                    if ($performer) {
                        $performer->talento_coin_balance += $performerAmount;
                        $performer->save();
                    } else {
                        Log::error("Performer not found for transaction ID: {$transaction->id}");
                    }
                }
            }
        }

        // Update performers associated with this booking
        BookingPerformer::where('booking_id', $booking->id)
            ->where('status', 'Pending')
            ->update(['status' => 'Declined']);

        DB::commit();

        return response()->json(['message' => 'Booking and related transactions cancelled successfully.'], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Error cancelling booking: " . $e->getMessage());
        return response()->json(['error' => 'Failed to cancel booking.'], 500);
    }
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

    


