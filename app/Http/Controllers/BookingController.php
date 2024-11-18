<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\UnavailableDate;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\PerformerPortfolio;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Transaction;
//listener to realtime pusher 
use App\Events\BookingUpdated;

class BookingController extends Controller
{
    // Store a new booking awdawdw
    public function store(Request $request)
{
    // Validation for the incoming request
        $validatedData = $request->validate([
            'performer_id' => 'required|exists:performer_portfolios,id', // performer_id must exist in performer_portfolios table
            'event_name' => 'required|string', // Event name as string
            'theme_name' => 'required|string', // Theme name as string
            'start_date' => 'required|date', // Start date must be a valid date
            'start_time' => 'required', // Start time is required
            'end_time' => 'nullable', // End time is optional
            'municipality_name' => 'required|string', // Municipality name as string
            'barangay_name' => 'required|string', // Barangay name as string
            'notes' => 'nullable|string', // Notes are optional but must be a string if provided
    ]);

    try {
            // Retrieve authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'error' => 'User not authenticated. Please login to proceed.'
                ], 401);
            }
    
            // Debug log to verify user details
            Log::info("User details: ", [$user]);
    
        // Check if the performer is available on the selected start date
            $performerId = $validatedData['performer_id'];
            $startDate = Carbon::parse($validatedData['start_date'])->format('Y-m-d');

        // Check unavailable dates table for conflicts
        $isUnavailable = UnavailableDate::where('performer_id', $performerId)
            ->whereDate('unavailable_date', $startDate)
            ->exists();

        // Check accepted bookings for conflicts
        $hasAcceptedBooking = Booking::where('performer_id', $performerId)
            ->whereDate('start_date', $startDate)
            ->where('status', 'Accepted')
            ->exists();

            if ($isUnavailable || $hasAcceptedBooking) {
                return response()->json(['error' => 'The performer is unavailable on the selected date. Please choose another date.'], 409);
            }

            // Find performer's portfolio
            $performerPortfolio = PerformerPortfolio::where('id', $performerId)->first();
            if (!$performerPortfolio) {
                return response()->json(['error' => 'Performer portfolio not found.'], 404);
            }
    
            // Debug log to verify performer portfolio details
            Log::info("Performer Portfolio details: ", [$performerPortfolio]);
    
            $rate = $performerPortfolio->rate;
    
            // Check if the user has enough balance
            if ($user->talento_coin_balance < $rate) {
                return response()->json([
                    'error' => 'Insufficient balance for this booking.'
                ], 409);
            }
    
            DB::beginTransaction();
            
            // Deduct from user's balance
            Log::info("User balance before deduction: ", [$user->talento_coin_balance]);
            $balanceBeforeUser = $user->talento_coin_balance;
    
            $user->talento_coin_balance -= $rate;
            $user->save();
            Log::info("User balance after deduction: ", [$user->talento_coin_balance]);
    
          
    
        // Creating a booking with validated data
        $booking = Booking::create([
                'client_id' => $user->id,  // Automatically set the client_id to the authenticated user's ID
                'performer_id' => $validatedData['performer_id'],
                'event_name' => $validatedData['event_name'],
                'theme_name' => $validatedData['theme_name'],
                'start_date' => $startDate,
                'start_time' => $validatedData['start_time'],
                'end_time' => $validatedData['end_time'],
                'municipality_name' => $validatedData['municipality_name'],
                'barangay_name' => $validatedData['barangay_name'],
                'notes' => $validatedData['notes'],
                'status' => 'Pending',  // Initially set booking status to Pending
        ]);
        Transaction::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,  // Link the booking
            'transaction_type' => 'Booking Payment',
            'amount' => $rate,
            'balance_before' => $balanceBeforeUser,
            'balance_after' => $user->talento_coin_balance,
            'status' => 'PENDING',
        ]);
            DB::commit();
            event(new BookingUpdated($booking));
            // Return a success message and booking details
            return response()->json([
                'message' => 'Booking successfully confirmed. Awaiting performer approval.',
                'booking' => $booking,
            ], 201);
    } catch (\Exception $e) {
            // Rollback transaction on error
            DB::rollBack();
        Log::error("Booking Error: " . $e->getMessage());
        return response()->json(['error' => 'There was an error booking the performer. Please try again.'], 500);
    }
}
    

    // Get a list of all bookings
    public function index()
    {
        try {
            // Retrieve bookings that belong to the authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated. Please login to proceed.'], 401);
            }
    
            // Retrieve bookings with nested performer and user data
            $bookings = Booking::where('client_id', $user->id)
                ->with('performer.user') // Eager load the performer and user relationships
                ->get();
    
            // Map bookings to include performer_name
            $bookings = $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'start_date' => $booking->start_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'municipality_name' => $booking->municipality_name,
                    'barangay_name' => $booking->barangay_name,
                    'status' => $booking->status,
                    'performer_name' => $booking->performer->user->name ?? null,
                    'created_at' => $booking->created_at,
                ];
            });
    
            return response()->json(['status' => 'success', 'data' => $bookings], 200);
        } catch (\Exception $e) {
            Log::error("Booking Retrieval Error: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving bookings. Please try again.'], 500);
        }
    }
    


    // Get a specific booking by ID
    public function show($id)
    {
        try {
            $booking = Booking::find($id);

            if (!$booking) {
                return response()->json(['error' => 'Booking not found.'], 404);
            }

            return response()->json($booking);
        } catch (\Exception $e) {
            Log::error("Booking Retrieval Error for ID $id: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving the booking. Please try again.'], 500);
        }
    }

    // Update a specific booking by ID
    public function declineBooking($id)
    {
        // Retrieve the authenticated user (performer)
        $authUser = Auth::user();
    
        // Retrieve the booking
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }
    
        // Check if the authenticated user is the correct performer
        if ($booking->performer->user->id != $authUser->id) {
            return response()->json(['error' => 'Unauthorized action. You are not allowed to decline this booking.'], 403);
        }
    
        // Prevent declining if the booking is already declined or accepted
        if ($booking->status === 'Declined' || $booking->status === 'Accepted') {
            return response()->json(['error' => 'This booking has already been processed.'], 400);
        }
    
        try {
            DB::beginTransaction();
    
            // Retrieve client and rate
            $client = User::find($booking->client_id);
            $performerPortfolio = PerformerPortfolio::find($booking->performer_id);
    
            if (!$client || !$performerPortfolio) {
                DB::rollBack();
                return response()->json(['error' => 'Client or performer portfolio not found.'], 404);
            }
    
            $rate = $performerPortfolio->rate;
    
            // Update booking status to 'Declined'
            $booking->update(['status' => 'Declined']);
    
            // Refund the client's balance
            $balanceBeforeClient = $client->talento_coin_balance;
            $client->talento_coin_balance += $rate;
            $client->save();
    
            // Log the refund transaction
            Transaction::create([
                'user_id' => $client->id,
                'booking_id' => $booking->id,
                'transaction_type' => 'Cancelled Booking',
                'amount' => $rate,
                'balance_before' => $balanceBeforeClient,
                'balance_after' => $client->talento_coin_balance,
                'status' => 'REFUNDED',
            ]);
    
            DB::commit();
            event(new BookingUpdated($booking));
    
            return response()->json(['message' => 'Booking declined and refund processed successfully.', 'booking' => $booking], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Booking Decline Error for ID $id: " . $e->getMessage());
            return response()->json(['error' => 'There was an error declining the booking. Please try again.'], 500);
        }
    }
    
    // Accept a booking by ID
    public function acceptBooking($id)
    {
        // Retrieve the authenticated user (performer)
        $authUser = Auth::user();
    
        // Retrieve the booking
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }
    
        // Check if the authenticated user is the correct performer
        if ($booking->performer->user->id != $authUser->id) {
            return response()->json(['error' => 'Unauthorized action. You are not allowed to accept this booking.'], 403);
        }
    
        // Prevent accepting if the booking is already accepted or declined
        if ($booking->status === 'Accepted' || $booking->status === 'Declined') {
            return response()->json(['error' => 'This booking has already been processed.'], 400);
        }
    
        try {
            DB::beginTransaction();
    
            // Retrieve the performer portfolio and rate
            $performerPortfolio = PerformerPortfolio::find($booking->performer_id);
            if (!$performerPortfolio) {
                DB::rollBack();
                return response()->json(['error' => 'Performer portfolio not found.'], 404);
            }
    
            $rate = $performerPortfolio->rate;
    
            // Update booking status to 'Accepted'
            $booking->update(['status' => 'Accepted']);
    
            // Log a pending transaction for the performer
            Transaction::create([
                'user_id' => $authUser->id,
                'booking_id' => $booking->id,
                'transaction_type' => 'Booking Received',
                'amount' => $rate,
                'balance_before' => $authUser->talento_coin_balance,
                'balance_after' => $authUser->talento_coin_balance,
                'status' => 'PENDING', // Pending until admin approval
            ]);
    
            DB::commit();
            event(new BookingUpdated($booking));
    
            return response()->json(['message' => 'Booking accepted successfully. Awaiting admin approval for payment.', 'booking' => $booking], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Booking Accept Error for ID $id: " . $e->getMessage());
            return response()->json(['error' => 'There was an error accepting the booking. Please try again.'], 500);
        }
    }
    
    

    // Get bookings for a specific performer
    public function getBookingsForPerformer($performerId)
    {
        try {
            // Fetch bookings for the given performer ID and include related client and performer data
            $bookings = Booking::where('performer_id', $performerId)
                ->with(['client', 'performer.user'])  // Add 'performer.user' to get performer details
                ->get();
            return response()->json($bookings, 200);
        } catch (\Exception $e) {
            Log::error("Booking Retrieval Error for Performer ID $performerId: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving bookings. Please try again.'], 500);
        }
    }





    // public function bookPerformer(Request $request)
    // {
    //     $validatedData = $request->validate([
    //         'performer_id' => 'required|exists:performer_portfolios,performer_id',
    //         'event_name' => 'required|string',
    //         'theme_name' => 'required|string',
    //         'start_date' => 'required|date',
    //         'start_time' => 'required|date_format:H:i',
    //         'end_time' => 'required|date_format:H:i',
    //         'municipality_name' => 'required|string',
    //         'barangay_name' => 'required|string',
    //         'notes' => 'nullable|string',
    //     ]);
    
    //     $user = Auth::user(); // Assuming the user is authenticated
    
    //     $performerPortfolio = PerformerPortfolio::where('performer_id', $request->performer_id)->firstOrFail();
    //     $performer = User::find($performerPortfolio->performer_id);
    //     $rate = $performerPortfolio->rate;
    
    //     // Check if the user has enough balance
    //     if ($user->talento_coin_balance < $rate) {
    //         return response()->json([
    //             'error' => 'Insufficient balance for this booking.'
    //         ], 409);
    //     }
    
    //     DB::beginTransaction();
    
    //     try {
    //         // Deduct from user's balance
    //         $user->talento_coin_balance -= $rate;
    //         $user->save();
    
    //         // Add to performer's balance
    //         $performer->talento_coin_balance += $rate;
    //         $performer->save();
    
    //         // Log the transaction for the user
    //         Transaction::create([
    //             'user_id' => $user->id,
    //             'transaction_type' => 'Booking Payment',
    //             'amount' => $rate,
    //             'balance_before' => $user->talento_coin_balance + $rate,
    //             'balance_after' => $user->talento_coin_balance,
    //             'status' => 'APPROVED',
    //         ]);
    
    //         // Log the transaction for the performer
    //         Transaction::create([
    //             'user_id' => $performer->id,
    //             'transaction_type' => 'Booking Received',
    //             'amount' => $rate,
    //             'balance_before' => $performer->talento_coin_balance - $rate,
    //             'balance_after' => $performer->talento_coin_balance,
    //             'status' => 'APPROVED',
    //         ]);
    
    //         // Save the booking details
    //         Booking::create([
    //             'user_id' => $user->id,
    //             'performer_id' => $performer->id,
    //             'event_name' => $validatedData['event_name'],
    //             'theme_name' => $validatedData['theme_name'],
    //             'start_date' => $validatedData['start_date'],
    //             'start_time' => $validatedData['start_time'],
    //             'end_time' => $validatedData['end_time'],
    //             'municipality_name' => $validatedData['municipality_name'],
    //             'barangay_name' => $validatedData['barangay_name'],
    //             'notes' => $validatedData['notes'],
    //             'status' => 'CONFIRMED',
    //         ]);
    
    //         DB::commit();
    
    //         return response()->json([
    //             'message' => 'Booking successfully confirmed.',
    //         ], 200);
    
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         return response()->json([
    //             'error' => 'An error occurred while processing your booking. Please try again.',
    //             'details' => $e->getMessage()
    //         ], 500);
    //     }
    // }
} 