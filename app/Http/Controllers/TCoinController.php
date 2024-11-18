<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;

class TCoinController extends Controller
{
    public function addTalentoCoin(Request $request, $userId)
    {
        Log::info("Request received for userId: $userId with amount: " . $request->input('amount'));
    
        // Validate that 'amount' is numeric and greater than 0
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);
    
        // Find the user by the provided ID, or return 404 if not found
        $user = User::findOrFail($userId);
        Log::info("User found: " . $user->name);
    
        // Increment user's TalentoCoin balance
        $user->talento_coin_balance += $request->input('amount');
        $user->save();
        Log::info("Updated TalentoCoin balance: " . $user->talento_coin_balance);
    
        // Return success response
        return response()->json([
            'message' => 'TalentoCoin balance updated successfully',
            'new_balance' => $user->talento_coin_balance,
        ]);
    }
    public function deductTalentoCoin(Request $request, $userId)
    {
        Log::info("Request received for userId: $userId to deduct amount: " . $request->input('amount'));
        
        // Validate that 'amount' is numeric and greater than 0
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);
    
        // Find the user by the provided ID, or return 404 if not found
        $user = User::findOrFail($userId);
        Log::info("User found: " . $user->name);
    
        // Check if the user has sufficient balance
        $amount = $request->input('amount');
        if ($user->talento_coin_balance < $amount) {
            Log::error("Insufficient balance for userId: $userId. Current balance: " . $user->talento_coin_balance);
            return response()->json([
                'message' => 'Insufficient TalentoCoin balance',
                'current_balance' => $user->talento_coin_balance,
            ], 400);
        }
    
        // Deduct user's TalentoCoin balance
        $user->talento_coin_balance -= $amount;
        $user->save();
        Log::info("Updated TalentoCoin balance after deduction: " . $user->talento_coin_balance);
    
        // Return success response
        return response()->json([
            'message' => 'TalentoCoin balance deducted successfully',
            'new_balance' => $user->talento_coin_balance,
        ]);
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

    // Find the performer associated with the transaction
    $performer = User::find($transaction->user_id);
    if (!$performer) {
        return response()->json(['error' => 'Performer not found.'], 404);
    }

    // Start transaction to ensure atomicity
    DB::beginTransaction();

    try {
        // Update the performer's balance
        $balanceBeforePerformer = $performer->talento_coin_balance;
        $performer->talento_coin_balance += $transaction->amount;
        $performer->save();

        // Update the transaction details
        $transaction->balance_before = $balanceBeforePerformer;
        $transaction->balance_after = $performer->talento_coin_balance;
        $transaction->status = 'APPROVED';
        $transaction->save();

        DB::commit();

        return response()->json(['message' => 'Transaction approved successfully and balance updated.'], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Transaction Approval Error: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred while approving the transaction. Please try again.'], 500);
    }
}

}
