<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use App\Models\Transaction;
use App\Models\BookingPerformer;
use App\Models\Talent;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // List all users
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    // Retrieve a specific user
    public function show($id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'password' => $user->password,
        'role' => $user->role,
    ]);
}


    // edit a user
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,performer,client',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => $request->role,
        ]);

        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    // Update a user
    public function update(Request $request, $id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    // Custom error messages
    $messages = [
        'name.string' => 'The name field must be a string.',
        'name.max' => 'The name field may not be greater than 255 characters.',
        'lastname.string' => 'The lastname field must be a filled.',
        'lastname.max' => 'The lastname field may not be greater than 255 characters.',
        'email.email' => 'The email field must be a valid email address.',
        'email.unique' => 'The email address has already been taken.',
        'password.string' => 'The password field must be a string.',
        'password.min' => 'The password field must be at least 8 characters.',
        'role.in' => 'The role field must be one of the following: admin, performer, customer.',
    ];

    $validator = Validator::make($request->all(), [
        'name' => 'string|max:255',
        'lastname' => 'string|max:255',
        'email' => 'email|unique:users,email,' . $id,
        'password' => 'string|min:8',
        'role' => 'in:admin,performer,client',
    ], $messages);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    if ($request->has('name')) {
        $user->name = $request->name;
    }
    if ($request->has('lastname')) {
        $user->lastname = $request->lastname;
    }

    if ($request->has('email')) {
        $user->email = $request->email;
    }

    if ($request->has('password')) {
        // Ensure the password is hashed before saving
        $user->password = bcrypt($request->password);
    }

    if ($request->has('role')) {
        $user->role = $request->role;
    }

    $user->save();

    return response()->json(['message' => 'User updated successfully', 'user' => $user]);
}


    // Delete a user
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

      public function getSummaryReport()
{
    try {
        // Basic summary stats
        $totalBookings = Booking::whereIn('status', ['COMPLETED', 'CANCELLED'])->count();
        $bookingsToday = Booking::whereDate('created_at', Carbon::today())->count();
        $cancelledBookings = Booking::where('status', 'CANCELLED')->count();
        $approvedBookings = Booking::where('status', 'COMPLETED')->count();
        $sales = Transaction::where('status', 'APPROVED')->sum('amount');

        // Weekly statistics for the current week
        $weeklyStats = Booking::select(
            DB::raw('WEEK(created_at) as week'),
            DB::raw('COUNT(CASE WHEN status IN ("CANCELLED", "COMPLETED") THEN 1 END) as total_bookings'),
            DB::raw('COUNT(CASE WHEN status = "CANCELLED" THEN 1 END) as cancelled_bookings'),
            DB::raw('COUNT(CASE WHEN status = "COMPLETED" THEN 1 END) as accepted_bookings')
        )
        ->whereYear('created_at', Carbon::now()->year)
        ->groupBy('week')
        ->orderBy('week')
        ->get();

        // Yearly statistics
        $yearlyStats = Booking::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('COUNT(CASE WHEN status IN ("CANCELLED", "COMPLETED") THEN 1 END) as total_bookings'),
            DB::raw('COUNT(CASE WHEN status = "CANCELLED" THEN 1 END) as cancelled_bookings'),
            DB::raw('COUNT(CASE WHEN status = "COMPLETED" THEN 1 END) as accepted_bookings')
        )
        ->groupBy('year')
        ->orderBy('year')
        ->get();

        // Weekly revenue
        $weeklyRevenue = Transaction::select(
            DB::raw('WEEK(created_at) as week'),
            DB::raw('SUM(amount) as total_revenue')
        )
        ->whereYear('created_at', Carbon::now()->year)
        ->where('status', 'APPROVED')
        ->groupBy('week')
        ->orderBy('week')
        ->get();

        // Yearly revenue
        $yearlyRevenue = Transaction::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('SUM(amount) as total_revenue')
        )
        ->where('status', 'APPROVED')
        ->groupBy('year')
        ->orderBy('year')
        ->get();

        // Talent bookings by week and year
        $talentBookingsWeekly = BookingPerformer::join('performer_portfolios', 'booking_performer.performer_id', '=', 'performer_portfolios.performer_id')
            ->join('bookings', 'booking_performer.booking_id', '=', 'bookings.id')
            ->select(
                'performer_portfolios.talent_name',
                DB::raw('WEEK(bookings.created_at) as week'),
                DB::raw('COUNT(*) as total_bookings')
            )
            ->whereYear('bookings.created_at', Carbon::now()->year)
            ->groupBy('talent_name', 'week')
            ->orderBy('week')
            ->get();

         $talentStatsWeekly = $talentBookingsWeekly->groupBy(function($item) {
            // Split talent_name by comma and trim whitespace
            $talents = array_map('trim', explode(',', $item->talent_name));
            return $talents;
            })
            ->map(function($bookings) {
            return [
                'weekly_bookings' => $bookings->mapWithKeys(function($booking) {
                return [$booking->week => $booking->total_bookings];
                }),
                'total_bookings' => $bookings->sum('total_bookings')
            ];
            });

        // Monthly statistics
        $monthlyStats = Booking::select(
            DB::raw('MONTH(created_at) as month'),
            DB::raw('COUNT(CASE WHEN status IN ("CANCELLED", "COMPLETED") THEN 1 END) as total_bookings'),
            DB::raw('COUNT(CASE WHEN status = "CANCELLED" THEN 1 END) as cancelled_bookings'),
            DB::raw('COUNT(CASE WHEN status = "COMPLETED" THEN 1 END) as completed_bookings')
        )
        ->whereYear('created_at', Carbon::now()->year)
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(function($stat) {
            return [
                'month' => Carbon::create()->month($stat->month)->format('F'),
                'total_bookings' => $stat->total_bookings,
                'cancelled_bookings' => $stat->cancelled_bookings,
                'completed_bookings' => $stat->completed_bookings
            ];
        });

        // Monthly revenue
        $monthlyRevenue = Transaction::select(
            DB::raw('MONTH(created_at) as month'),
            DB::raw('SUM(amount) as total_revenue')
        )
        ->whereYear('created_at', Carbon::now()->year)
        ->where('status', 'APPROVED')
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(function($rev) {
            return [
                'month' => Carbon::create()->month($rev->month)->format('F'),
                'revenue' => $rev->total_revenue
            ];
        });

         // Talent bookings by month
        $talentBookingsMonthly = BookingPerformer::join('performer_portfolios', 'booking_performer.performer_id', '=', 'performer_portfolios.performer_id')
            ->join('bookings', 'booking_performer.booking_id', '=', 'bookings.id')
            ->select(
            'performer_portfolios.talent_name',
            DB::raw('MONTH(bookings.created_at) as month'),
            DB::raw('COUNT(*) as total_bookings'),
            'bookings.status'
            )
            ->whereYear('bookings.created_at', Carbon::now()->year)
            ->whereIn('bookings.status', ['CANCELLED', 'COMPLETED'])
            ->groupBy('talent_name', 'month', 'status')
            ->orderBy('month')
            ->get();

        $talentStatsMonthly = $talentBookingsMonthly->groupBy('talent_name')
            ->map(function($bookings) {
            return [
                'monthly_bookings' => $bookings->mapWithKeys(function($booking) {
                return [Carbon::create()->month($booking->month)->format('F') => $booking->total_bookings];
                }),
                'total_bookings' => $bookings->sum('total_bookings')
            ];
            });


        return response()->json([
            'status' => 'success',
            'data' => [
                'total_bookings' => $totalBookings,
                'bookings_today' => $bookingsToday,
                'cancelled_bookings' => $cancelledBookings,
                'approved_bookings' => $approvedBookings,
                'sales' => $sales,
                'weekly_statistics' => $weeklyStats,
                'yearly_statistics' => $yearlyStats,
                'weekly_revenue' => $weeklyRevenue,
                'yearly_revenue' => $yearlyRevenue,
                'talent_statistics' => [
                    'by_week' => $talentStatsWeekly,
                    'by_month' => $talentStatsMonthly
                ],
                'monthly_statistics' => $monthlyStats,
                'monthly_revenue' => $monthlyRevenue
            ]
        ], 200);

    } catch (\Exception $e) {
        Log::error("Summary Report Error: " . $e->getMessage());
        return response()->json([
            'error' => 'There was an error generating the report. Please try again.'
        ], 500);
    }
}



    
    // Determine the admin balance
    public function getAdminBalance()
    {
        try {
            // Assuming there's a 'talento_coin_balance' field in the 'users' table for admins
            $adminBalance = User::where('role', 'admin')->sum('talento_coin_balance');

            return response()->json([
                'status' => 'success',
                'balance' => $adminBalance
            ], 200);
        } catch (\Exception $e) {
            Log::error("Admin Balance Error: " . $e->getMessage());
            return response()->json(['error' => 'There was an error retrieving the admin balance. Please try again.'], 500);
        }
    }
   
    public function showBookings()
    {
        try {
            $bookings = Booking::with([
                'bookingPerformers.performer.user',
                'client'
            ])
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'start_date' => $booking->start_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'status' => $booking->status,
                    'municipality_name' => $booking->municipality_name,
                    'barangay_name' => $booking->barangay_name,
                    'notes' => $booking->notes,
                    'performers' => $booking->bookingPerformers->map(function ($bp) {
                        return [
                            'id' => $bp->performer->user->id,
                            'name' => $bp->performer->user->name
                        ];
                    })->toArray(),
                    'client' => [
                        'id' => $booking->client->id,
                        'name' => $booking->client->name
                    ]
                ];
            });
    
            return response()->json([
                'status' => 'success',
                'data' => $bookings
            ]);
    
        } catch (\Exception $e) {
            Log::error('Error in showBookings: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch bookings'
            ], 500);
        }
    }

    public function updateBooking(Request $request, $id)
    {
        try {
            $booking = Booking::findOrFail($id);
            
            $validatedData = $request->validate([
                'event_name' => 'required|string',
                'theme_name' => 'required|string',
                'start_date' => 'required|date',
                'start_time' => 'required',
                'end_time' => 'required',
                'status' => 'required|in:PENDING,ACCEPTED,COMPLETED,CANCELLED'
            ]);
    
            $booking->update($validatedData);
    
            return response()->json([
                'status' => 'success',
                'message' => 'Booking updated successfully',
                'data' => $booking
            ]);
    
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Booking not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating booking: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update booking'
            ], 500);
        }
    }
    
    public function deleteBooking($id)
    {
        try {
            $booking = Booking::findOrFail($id);
            
            // Delete related records first
            $booking->bookingPerformers()->delete();
            $booking->delete();
    
            return response()->json([
                'status' => 'success',
                'message' => 'Booking deleted successfully'
            ]);
    
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Booking not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting booking: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete booking'
            ], 500);
        }
    }

    public function getBookingDetails()
{
    try {
        $bookings = Booking::with(['client', 'bookingPerformers.performer.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($booking) {
                // Get pending transactions
                $pendingTransactions = Transaction::where('booking_id', $booking->id)
                    ->where('transaction_type', 'Waiting For Approval')
                    ->with('performer.user')
                    ->get();

                // Get cancelled transactions
                $cancelledTransactions = Transaction::where('booking_id', $booking->id)
                    ->where('transaction_type', 'Booking Cancelled')
                    ->where('status', 'CANCELLED')
                    ->with('performer.user')
                    ->get();

                // Calculate total amount based on booking status
                $totalAmount = $booking->status === 'CANCELLED' 
                    ? $cancelledTransactions->sum('amount')
                    : $pendingTransactions->sum('amount');

                // Get performers with their amounts
                $performers = $booking->status === 'CANCELLED'
                    ? $cancelledTransactions->map(function ($transaction) {
                        return [
                            'name' => optional($transaction->performer->user)->name,
                            'amount' => $transaction->amount
                        ];
                    })
                    : $pendingTransactions->map(function ($transaction) {
                        return [
                            'name' => optional($transaction->performer->user)->name,
                            'amount' => $transaction->amount
                        ];
                    });

                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'client_name' => $booking->client->name,
                    'start_date' => $booking->start_date,
                    'status' => $booking->status,
                    'total_amount' => $totalAmount,
                    'performers' => $booking->bookingPerformers->map(function ($bp) {
                        return $bp->performer->user->name;
                    })->implode(', '),
                    'performer_details' => $performers
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $bookings
        ]);
    } catch (\Exception $e) {
        Log::error("Error fetching booking details: " . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch booking details'], 500);
    }
}
    public function getTodayBookings()
    {
        try {
            $bookings = Booking::with(['client', 'bookingPerformers.performer.user'])
                ->whereDate('created_at', Carbon::today())
                ->get()
                ->map(function ($booking) {
                    $transactions = Transaction::where('booking_id', $booking->id)
                        ->where('transaction_type', 'Waiting For Approval')
                        ->with('performer.user')
                        ->get();

                    return [
                        'id' => $booking->id,
                        'event_name' => $booking->event_name,
                        'theme_name' => $booking->theme_name,
                        'client_name' => $booking->client->name,
                        'start_time' => date('h:i A', strtotime($booking->start_time)),
                        'end_time' => date('h:i A', strtotime($booking->end_time)),
                        'status' => $booking->status,
                        'total_amount' => $transactions->sum('amount'),
                        'performers' => $booking->bookingPerformers->map(function ($bp) {
                            return $bp->performer->user->name;
                        })->implode(', ')
                    ];
                });

            return response()->json(['status' => 'success', 'data' => $bookings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch today\'s bookings'], 500);
        }
    }

    public function getCancelledBookings()
    {
        try {
            $bookings = Booking::with(['client', 'bookingPerformers.performer.user'])
                ->where('status', 'CANCELLED')
                ->get()
                ->map(function ($booking) {
                    $cancelledTransactions = Transaction::where('booking_id', $booking->id)
                        ->where('transaction_type', 'Booking Cancelled')
                        ->where('status', 'CANCELLED')
                        ->with('performer.user')
                        ->get();

                    return [
                        'id' => $booking->id,
                        'event_name' => $booking->event_name,
                        'theme_name' => $booking->theme_name,
                        'client_name' => $booking->client->name,
                        'cancelled_date' => $booking->updated_at->format('Y-m-d h:i A'),
                        'total_amount' => $cancelledTransactions->sum('amount'),
                        'performers' => $booking->bookingPerformers->map(function ($bp) {
                            return $bp->performer->user->name;
                        })->implode(', ')
                    ];
                });

            return response()->json(['status' => 'success', 'data' => $bookings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch cancelled bookings'], 500);
        }
    }

    public function getApprovedBookings()
    {
        try {
            $bookings = Booking::with(['client', 'bookingPerformers.performer.user'])
                ->where('status', 'COMPLETED')
                ->get()
                ->map(function ($booking) {
                    $approvedTransactions = Transaction::where('booking_id', $booking->id)
                        ->where('status', 'APPROVED')
                        ->with('performer.user')
                        ->get();

                    return [
                        'id' => $booking->id,
                        'event_name' => $booking->event_name,
                        'theme_name' => $booking->theme_name,
                        'client_name' => $booking->client->name,
                        'approved_date' => $booking->updated_at->format('Y-m-d'),
                        'total_amount' => $approvedTransactions->sum('amount'),
                        'performers' => $booking->bookingPerformers->map(function ($bp) {
                            return $bp->performer->user->name;
                        })->implode(', ')
                    ];
                });

            return response()->json(['status' => 'success', 'data' => $bookings]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch approved bookings'], 500);
        }
    }

    public function getTransactionDetails()
    {
        try {
            $transactions = Transaction::with(['user', 'performer.user', 'booking'])
                ->where('status', 'APPROVED')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'transaction_id' => $transaction->id,
                        'booking_id' => $transaction->booking_id,
                        'user' => $transaction->user->name,
                        'performer' => optional($transaction->performer->user)->name,
                        'event_name' => optional($transaction->booking)->event_name,
                        'theme_name' => optional($transaction->booking)->theme_name,
                        'amount' => $transaction->amount,
                        'date' => $transaction->created_at->format('Y-m-d h:i A'),
                        'status' => $transaction->status
                    ];
                });

            return response()->json(['status' => 'success', 'data' => $transactions]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch transaction details'], 500);
        }
    }
   
    
    public function getBookingsByTalentDetails()
    {
        try {
            $bookings = Booking::with([
                'client',
                'bookingPerformers.performer.user',
                'bookingPerformers.performer.talents',
                'transactions'
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($booking) {
                $transactions = Transaction::where('booking_id', $booking->id)
                    ->where(function($query) {
                        $query->where('transaction_type', 'Waiting For Approval')
                              ->orWhere('transaction_type', 'Booking Cancelled');
                    })
                    ->get();
    
                return [
                    'id' => $booking->id,
                    'event_name' => $booking->event_name,
                    'theme_name' => $booking->theme_name,
                    'client_name' => $booking->client->name,
                    'status' => $booking->status,
                    'total_amount' => $transactions->sum('amount'),
                    'event_date' => $booking->start_date,
                    'event_time' => [
                        'start' => $booking->start_time,
                        'end' => $booking->end_time
                    ],
                    'location' => [
                        'municipality' => $booking->municipality_name,
                        'barangay' => $booking->barangay_name
                    ],
                    'performers' => $booking->bookingPerformers->map(function ($bp) {
                        return [
                            'name' => $bp->performer->user->name,
                            'talents' => $bp->performer->talents->pluck('talent_name'),
                        'rate' => $bp->performer->rate,
                        'duration' => Carbon::parse($bp->booking->end_time)->diffForHumans(Carbon::parse($bp->booking->start_time), true) 
                        ];
                    }),
                    'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $booking->updated_at->format('Y-m-d H:i:s')
                ];
            });
    
            return response()->json([
                'status' => 'success',
                'data' => $bookings
            ]);
    
        } catch (\Exception $e) {
            Log::error("Error fetching booking details by talent: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch booking details by talent',
                'error' => $e->getMessage()
            ], 500);
        }
    }
   
  
}
