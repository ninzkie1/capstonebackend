<?php

namespace App\Http\Controllers;

use App\Models\BookingPerformer;
use Illuminate\Http\Request;
use App\Models\UnavailableDate;
use Illuminate\Support\Facades\Auth;

class UnavailableDateController extends Controller
{
    // Get unavailable dates for a performer
    public function index($performerId)
    {
        try {
            $unavailableDates = UnavailableDate::where('performer_id', $performerId)
                ->select('unavailable_date', 'start_time', 'end_time')
                ->get();
    
            return response()->json(['unavailableDates' => $unavailableDates]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch unavailable dates'], 500);
        }
    }
    
    // Store unavailable dates for a performer

    public function store(Request $request)
{
    // Validate the input data
    $validated = $request->validate([
        'performer_id' => 'required|exists:performer_portfolios,id',
        'unavailableDates' => 'required|array', // Ensure unavailableDates is an array
        'unavailableDates.*.date' => 'required|date', // Ensure each date is valid
        'unavailableDates.*.start_time' => 'required|date_format:H:i', // Validate time format (HH:mm)
        'unavailableDates.*.end_time' => 'required|date_format:H:i|after:unavailableDates.*.start_time', // Ensure valid time range
    ]);

    foreach ($validated['unavailableDates'] as $date) {
        // Check if the combination already exists
        $exists = UnavailableDate::where('performer_id', $validated['performer_id'])
            ->where('unavailable_date', $date['date'])
            ->where('start_time', $date['start_time'])
            ->where('end_time', $date['end_time'])
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'Unavailable time conflict. This time range is already set.',
            ], 409); // Use 409 Conflict for duplicate entries
        }

        // Create the unavailable date entry
        try {
            UnavailableDate::create([
                'performer_id' => $validated['performer_id'],
                'unavailable_date' => $date['date'],
                'start_time' => $date['start_time'],
                'end_time' => $date['end_time'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while saving unavailable times.',
            ], 500);
        }
    }

    return response()->json(['message' => 'Unavailable dates and times added successfully.']);
}


    public function getPendingBookingDates($performerId)
{
    try {
        $pendingBookings = BookingPerformer::where('performer_id', $performerId)
            ->whereHas('booking', function ($query) {
                $query->where('status', 'PENDING');
            })
            ->with('booking')
            ->get();

        // Extract pending booking dates
        $pendingBookingDates = $pendingBookings->map(function ($bookingPerformer) {
            return $bookingPerformer->booking->start_date;
        })->unique(); // Ensures no duplicates

        return response()->json(['pendingBookingDates' => $pendingBookingDates->values()]);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to fetch pending booking dates'], 500);
    }
}

    
    }
    