<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UnavailableDate;
use Illuminate\Support\Facades\Auth;

class UnavailableDateController extends Controller
{
    // Get unavailable dates for a performer
    public function index($performerId)
    {
        try {
            $unavailableDates = UnavailableDate::where('performer_id', $performerId)->pluck('unavailable_date');
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
            'unavailableDates.*' => 'required|date', // Ensure each date is valid
        ]);
    
        // Loop through each unavailable date and create the entry
        foreach ($validated['unavailableDates'] as $date) {
            UnavailableDate::create([
                'performer_id' => $validated['performer_id'],
                'unavailable_date' => $date,
            ]);
        }
    
        return response()->json(['message' => 'Unavailable dates added successfully.']);
    }
    
    
    }
    