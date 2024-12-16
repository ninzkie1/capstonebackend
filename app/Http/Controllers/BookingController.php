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
use App\Models\BookingPerformer;

class BookingController extends Controller
{
    // Store a new booking awdawdw
    public function store(Request $request)
{
    // Validate the request
    $validatedData = $request->validate([
        'performer_ids' => 'required|array', // Multiple performer IDs
        'performer_ids.*' => 'exists:performer_portfolios,id', // Validate performer IDs
        'event_name' => 'required|string',
        'theme_name' => 'required|string',
        'start_date' => 'required|date',
        'start_time' => 'required|date_format:H:i',
        'end_time' => 'required|date_format:H:i|after:start_time',
        'municipality_name' => 'required|string',
        'barangay_name' => 'required|string',
        'notes' => 'nullable|string',
    ]);

    try {
        $user = Auth::user();

        // Ensure the user is authenticated
        if (!$user) {
            return response()->json(['error' => 'User not authenticated.'], 401);
        }

        DB::beginTransaction(); // Begin transaction

        // Step 1: Calculate the total cost and check performers' availability
        $totalCost = 0;
        $performers = PerformerPortfolio::whereIn('id', $validatedData['performer_ids'])->get();
        $conflictingPerformers = [];

        foreach ($performers as $performer) {
            // Check for conflicts with unavailable times
            $timeConflictUnavailable = UnavailableDate::where('performer_id', $performer->id)
                ->whereDate('unavailable_date', $validatedData['start_date'])
                ->where(function ($query) use ($validatedData) {
                    $query->where(function ($q) use ($validatedData) {
                        $q->where('start_time', '<=', $validatedData['start_time'])
                          ->where('end_time', '>', $validatedData['start_time']);
                    })
                    ->orWhere(function ($q) use ($validatedData) {
                        $q->where('start_time', '<', $validatedData['end_time'])
                          ->where('end_time', '>=', $validatedData['end_time']);
                    })
                    ->orWhere(function ($q) use ($validatedData) {
                        $q->where('start_time', '>=', $validatedData['start_time'])
                          ->where('end_time', '<=', $validatedData['end_time']);
                    });
                })
                ->exists();

            if ($timeConflictUnavailable) {
                $conflictingPerformers[] = "Performer {$performer->id} ({$performer->user->name}) is unavailable during the selected time on {$validatedData['start_date']}.";
                continue;
            }

            // Check for conflicts with pending bookings on the same date and time range
            $timeConflictPending = BookingPerformer::where('performer_id', $performer->id)
                ->whereHas('booking', function ($query) use ($validatedData) {
                    $query->whereDate('start_date', $validatedData['start_date'])
                        ->where(function ($q) use ($validatedData) {
                            $q->where('start_time', '<=', $validatedData['start_time'])
                              ->where('end_time', '>', $validatedData['start_time']);
                        })
                        ->orWhere(function ($q) use ($validatedData) {
                            $q->where('start_time', '<', $validatedData['end_time'])
                              ->where('end_time', '>=', $validatedData['end_time']);
                        })
                        ->orWhere(function ($q) use ($validatedData) {
                            $q->where('start_time', '>=', $validatedData['start_time'])
                              ->where('end_time', '<=', $validatedData['end_time']);
                        })
                        ->where('status', 'PENDING');
                })
                ->exists();

            if ($timeConflictPending) {
                $conflictingPerformers[] = "Performer {$performer->id} ({$performer->user->name}) has a pending booking that conflicts with the selected time on {$validatedData['start_date']}.";
                continue;
            }

            $totalCost += $performer->rate; // Sum the performer's rate
        }

        // Return errors if there are conflicts
        if (!empty($conflictingPerformers)) {
            return response()->json(['error' => $conflictingPerformers], 409);
        }

        // Step 2: Validate the client's balance
        if ($user->talento_coin_balance < $totalCost) {
            return response()->json(['error' => 'Insufficient balance for this booking.'], 409);
        }

        // Step 3: Deduct the total cost from the client's balance
        $user->talento_coin_balance -= $totalCost;
        $user->save();

        // Step 4: Create the booking
        $booking = Booking::create([
            'client_id' => $user->id,
            'event_name' => $validatedData['event_name'],
            'theme_name' => $validatedData['theme_name'],
            'start_date' => $validatedData['start_date'],
            'start_time' => $validatedData['start_time'],
            'end_time' => $validatedData['end_time'],
            'municipality_name' => $validatedData['municipality_name'],
            'barangay_name' => $validatedData['barangay_name'],
            'notes' => $validatedData['notes'],
            'status' => 'PENDING',
        ]);

        // Step 5: Attach performers and create payment transactions
        $balanceBefore = $user->talento_coin_balance + $totalCost;

        foreach ($performers as $performer) {
            // Link the performer to the booking
            BookingPerformer::create([
                'booking_id' => $booking->id,
                'performer_id' => $performer->id,
            ]);

            // Log the transaction for this performer's payment
            Transaction::create([
                'user_id' => $user->id,
                'performer_id' => $performer->id, // Store performer_id here
                'booking_id' => $booking->id,
                'transaction_type' => 'Booking Payment',
                'amount' => $performer->rate,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceBefore - $performer->rate,
                'status' => 'PENDING',
            ]);

            $balanceBefore -= $performer->rate;
        }

        DB::commit();

        return response()->json([
            'message' => 'Booking successfully created.',
            'booking' => $booking->load('performers.performer'),
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Booking Error: " . $e->getMessage());
        return response()->json(['error' => 'Error creating booking. Please try again.'], 500);
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
    public function show($bookingId)
    {
        $booking = Booking::with(['performers' => function ($query) {
            $query->select('performer_portfolios.id', 'performer_portfolios.talent_name', 'booking_performer.status');
        }])->find($bookingId);
    
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }
    
        return response()->json(['data' => $booking]);
    }
    
//performer side it will decline the booking request
    public function declineBooking($bookingId)
{
    try {
        $authUser = Auth::user();
        //if not login/authenticated user it will give an error
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized. User not found.'], 401);
        }

        $performer = $authUser->performerPortfolio;

        if (!$performer) {
            Log::error("Unauthorized action: Performer profile not found for user ID " . $authUser->id);
            return response()->json(['error' => 'Unauthorized action.'], 403);
        }

        $bookingPerformer = BookingPerformer::where('booking_id', $bookingId)
            ->where('performer_id', $performer->id)
            ->first();

        if (!$bookingPerformer) {
            Log::error("Booking not found for booking ID $bookingId and performer ID " . $performer->id);
            return response()->json(['error' => 'Booking not found.'], 404);
        }

        if ($bookingPerformer->status !== 'Pending') {
            return response()->json(['error' => 'Booking has already been processed.'], 400);
        }

        DB::beginTransaction();

        // Step 1: Update the status to 'Declined' for the performer
        $bookingPerformer->status = 'Declined';
        $bookingPerformer->save();

        // Step 2: Refund the amount to the client's balance
        $client = $bookingPerformer->booking->client;
        $performerRate = $performer->rate;

        $balanceBeforeClient = $client->talento_coin_balance;
        $client->talento_coin_balance += $performerRate;
        $client->save();

        // Step 3: Update the transaction for the declined performer
        $transaction = Transaction::where('booking_id', $bookingPerformer->booking_id)
            ->where('user_id', $client->id)
            ->where('performer_id', $performer->id) // Make sure we use performer_id to identify the correct transaction
            ->where('status', 'PENDING') // Make sure we only pick up transactions that haven't already been refunded
            ->first();

        if ($transaction) {
            $transaction->transaction_type = 'Booking Declined';
            $transaction->balance_before = $balanceBeforeClient;
            $transaction->balance_after = $client->talento_coin_balance;
            $transaction->status = 'REFUNDED';
            $transaction->save();
        } else {
            Log::warning("Transaction not found for booking ID $bookingId and client ID " . $client->id);
        }

        // Step 4: Check if all performers have declined the booking
        $remainingPerformers = BookingPerformer::where('booking_id', $bookingId)
            ->where('status', '!=', 'Declined')
            ->count();

        if ($remainingPerformers == 0) {
            // All performers have declined the booking, so mark it as cancelled
            $booking = $bookingPerformer->booking;
            $booking->status = 'DECLINED';
            $booking->save();
        }

        DB::commit();

        event(new BookingUpdated($bookingPerformer->booking));

        return response()->json([
            'message' => 'You have successfully declined the booking. The client has been refunded.',
            'booking' => $bookingPerformer,
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Booking Decline Error for Booking ID $bookingId: " . $e->getMessage());
        return response()->json(['error' => 'There was an error declining the booking. Please try again.'], 500);
    }
}

    
public function acceptBooking($bookingId)
{
    try {
        // Get the authenticated user
        $authUser = Auth::user();

        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized. User not found.'], 401);
        }

        // Check if the authenticated user is a performer
        $performer = $authUser->performerPortfolio;

        if (!$performer) {
            return response()->json(['error' => 'Unauthorized action.'], 403);
        }

        // Find the booking performer record
        $bookingPerformer = BookingPerformer::where('booking_id', $bookingId)
            ->where('performer_id', $performer->id)
            ->first();

        if (!$bookingPerformer) {
            return response()->json(['error' => 'Booking performer not found.'], 404);
        }

        if ($bookingPerformer->status !== 'Pending') {
            return response()->json(['error' => 'Booking has already been processed.'], 400);
        }

        // Begin a transaction
        DB::beginTransaction();

        // Update the status of the performer to 'Accepted'
        $bookingPerformer->status = 'Accepted';
        $bookingPerformer->save();

        // Update the transaction status to reflect the acceptance
        $transaction = Transaction::where('booking_id', $bookingId)
            ->where('user_id', $bookingPerformer->booking->client_id) // user_id should refer to client_id
            ->where('performer_id', $performer->id)
            ->first();

        if ($transaction) {
            // Update the transaction to indicate the booking has been accepted by this performer
            $transaction->transaction_type = 'Booking Accepted';
            $transaction->status = 'PROCESSING'; // Status can be updated to COMPLETED after the event
            $transaction->save();

            // Fetch the performer's balance before creating the "Waiting for Approval" transaction
            $performerUser = $authUser;

            if (!$performerUser) {
                throw new \Exception('Performer user not found.');
            }

            $balanceBefore = $performerUser->talento_coin_balance;
            $amount = $transaction->amount;

            // Create a new transaction for "Waiting for Approval"
            Transaction::create([
                'user_id' => $bookingPerformer->booking->client_id, // user_id is for client
                'booking_id' => $bookingId,
                'performer_id' => $performer->id, // performer_id is for performer
                'transaction_type' => 'Waiting for Approval',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceBefore, // No balance change yet since approval is pending
                'status' => 'PENDING', // Waiting for approval
            ]);
        } else {
            Log::error("Transaction not found for booking ID $bookingId and performer ID {$performer->id} and client ID {$bookingPerformer->booking->client_id}");
            return response()->json(['error' => 'Transaction not found.'], 404);
        }

        // Commit the transaction
        DB::commit();

        // Trigger an event to indicate the booking has been updated
        event(new BookingUpdated($bookingPerformer->booking));

        return response()->json([
            'message' => 'Booking accepted successfully.',
            'booking' => $bookingPerformer,
        ], 200);

    } catch (\Exception $e) {
        // Rollback transaction in case of any error
        DB::rollBack();
        Log::error("Booking Accept Error for Booking ID $bookingId: " . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
        return response()->json(['error' => 'There was an error accepting the booking. Please try again.'], 500);
    }
}


    
    
    
    


    
    
    

    // Get bookings for a specific performer
    public function getBookingsForPerformer($performerId)
    {
        try {
            // Fetch bookings for the given performer ID
            $bookings = Booking::whereHas('bookingPerformers', function ($query) use ($performerId) {
                    // Ensure we only get bookings where the specific performer has a status of Pending
                    $query->where('performer_id', $performerId)
                          ->where('status', 'Pending');
                })
                ->with(['client', 'bookingPerformers.performer.user'])  // Include related client and performer data
                ->get();
    
            // Filter bookings that are only pending for this performer
            $pendingBookings = $bookings->filter(function ($booking) use ($performerId) {
                $bookingPerformer = $booking->bookingPerformers->firstWhere('performer_id', $performerId);
                return $bookingPerformer && $bookingPerformer->status === 'Pending';
            });
    
            // Optionally format the response to include only necessary fields
            $formattedBookings = $pendingBookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'start_date' => $booking->start_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'municipality_name' => $booking->municipality_name,
                    'barangay_name' => $booking->barangay_name,
                    'notes' => $booking->notes,
                    'status' => $booking->status,
                    'client' => [
                        'name' => $booking->client->name,
                        'lastname' => $booking->client->lastname,
                        'email' => $booking->client->email,
                    ],
                    'performers' => $booking->bookingPerformers->map(function ($performer) {
                        return [
                            'name' => $performer->performer->user->name,
                            'lastname' => $performer->performer->user->lastname,
                            'rate' => $performer->performer->rate,
                            'average_rating' => $performer->performer->average_rating,
                            'image_profile' => $performer->performer->image_profile,
                        ];
                    }),
                ];
            });
    
            return response()->json(['status' => 'success', 'data' => $formattedBookings], 200);
        } catch (\Exception $e) {
            Log::error("Booking Retrieval Error for Performer ID $performerId: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving bookings. Please try again.'], 500);
        }
    }
    

    
    public function getPendingBookings()
{
    $authUser = Auth::user();

    $performer = $authUser->performerPortfolio;
    if (!$performer) {
        return response()->json(['error' => 'Unauthorized action.'], 403);
    }

    $pendingBookings = $performer->bookings()->wherePivot('status', 'Pending')->get();

    return response()->json(['data' => $pendingBookings]);
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
    public function getAcceptedBookings()
    {
        try {
            // Retrieve bookings that have been accepted
            $acceptedBookings = Booking::where('status', 'ACCEPTED')
                ->with(['performer.user', 'client'])  // Eager load the performer and client relationships
                ->get();

            // Map bookings to include relevant data
            $acceptedBookings = $acceptedBookings->map(function ($booking) {
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
                    'performer_name' => $booking->performer->user->name ?? 'Unknown Performer',
                    'client_name' => $booking->client->name ?? 'Unknown Client',
                    'created_at' => $booking->created_at,
                ];
            });

            return response()->json(['status' => 'success', 'data' => $acceptedBookings], 200);
        } catch (\Exception $e) {
            Log::error("Accepted Booking Retrieval Error: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving accepted bookings. Please try again.'], 500);
        }
    }
    public function getAcceptedBookingContacts()
    {
        try {
            // Step 1: Retrieve authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated. Please login to proceed.'], 401);
            }
    
            // Step 2: Retrieve performer portfolio IDs linked to accepted bookings by this client
            $performerPortfolioIds = Booking::where('client_id', $user->id)
                ->where('status', 'ACCEPTED')
                ->pluck('performer_id');
    
            if ($performerPortfolioIds->isEmpty()) {
                // If no accepted bookings are found, return empty data
                return response()->json(['status' => 'success', 'data' => []], 200);
            }
    
            // Step 3: Retrieve the performers (users) based on their IDs in the performer_portfolios table
            $performerIds = PerformerPortfolio::whereIn('id', $performerPortfolioIds)
                ->pluck('performer_id');
    
            if ($performerIds->isEmpty()) {
                // If no performers are found, return empty data
                return response()->json(['status' => 'success', 'data' => []], 200);
            }
    
            // Step 4: Retrieve the user details for those performers
            $users = User::whereIn('id', $performerIds)->get();
    
            // Step 5: Return the data
            return response()->json(['status' => 'success', 'data' => $users], 200);
        } catch (\Exception $e) {
            // Log the exception for debugging
            Log::error("Error retrieving accepted booking contacts: " . $e->getMessage());
            return response()->json(['error' => 'Error retrieving accepted booking contacts. Please try again.'], 500);
        }
    }
    public function getAcceptedBookingsForPerformer($performerId)
{
    try {
        // Query to get accepted bookings for the given performer ID
        $acceptedBookings = BookingPerformer::where('performer_id', $performerId)
            ->where('status', 'Accepted')
            ->with(['booking.client', 'booking'])  // Include related booking and client data
            ->get()
            ->map(function ($bookingPerformer) {
                $booking = $bookingPerformer->booking;

                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'start_date' => $booking->start_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'municipality_name' => $booking->municipality_name,
                    'barangay_name' => $booking->barangay_name,
                    'notes' => $booking->notes,
                    'status' => $bookingPerformer->status,
                    'client' => [
                        'name' => $booking->client->name ?? 'N/A',
                        'lastname' => $booking->client->lastname ?? 'N/A',
                        'email' => $booking->client->email ?? 'N/A',
                    ],
                ];
            });

        return response()->json(['acceptedBookings' => $acceptedBookings], 200);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to fetch accepted bookings', 'message' => $e->getMessage()], 500);
    }
}
public function getDeclinedBookingsForPerformer($performerId)
{
    try {
        // Query to get declined bookings for the given performer ID
        $declinedBookings = BookingPerformer::where('performer_id', $performerId)
            ->where('status', 'Declined')
            ->with(['booking.client', 'booking'])  // Include related booking and client data
            ->get()
            ->map(function ($bookingPerformer) {
                $booking = $bookingPerformer->booking;

                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'start_date' => $booking->start_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'municipality_name' => $booking->municipality_name,
                    'barangay_name' => $booking->barangay_name,
                    'notes' => $booking->notes,
                    'status' => $bookingPerformer->status,
                    'client' => [
                        'name' => $booking->client->name ?? 'N/A',
                        'lastname' => $booking->client->lastname ?? 'N/A',
                        'email' => $booking->client->email ?? 'N/A',
                    ],
                ];
            });

        return response()->json(['declinedBookings' => $declinedBookings], 200);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to fetch declined bookings', 'message' => $e->getMessage()], 500);
    }
}

} 