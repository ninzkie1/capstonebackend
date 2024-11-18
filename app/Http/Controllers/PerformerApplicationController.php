<?php

namespace App\Http\Controllers;

use App\Models\PerformerApplication;
use App\Models\PerformerPortfolio;
use Illuminate\Http\Request;

class PerformerApplicationController extends Controller
{
    // Display all pending performer applications
    public function index()
    {
        try {
            // Fetch all applications
            $applications = PerformerApplication::all();
    
            // Group applications by status and convert them to arrays
            $groupedApplications = [
                'pending' => $applications->where('status', 'PENDING')->values()->toArray(),
                'approved' => $applications->where('status', 'APPROVED')->values()->toArray(),
                'rejected' => $applications->where('status', 'REJECTED')->values()->toArray(),
            ];
            
            // Return as JSON to be consumed by the frontend
            return response()->json($groupedApplications, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Approve a specific performer application
    public function approve($id)
    {
        try {
            $application = PerformerApplication::findOrFail($id);

            if ($application->status === 'PENDING') {
                // Update status to APPROVED
                $application->status = 'APPROVED';
                $application->save();

                // Create a performer portfolio for the approved user
                PerformerPortfolio::create([
                    'performer_id' => $application->user_id,
                    'talent_name' => $application->talent_name,
                    'location' => $application->location,
                    'description' => $application->description,
                    'rate' => 0, // Default rate
                    'availability_status' => 'Available', // Default availability
                ]);

                return response()->json([
                    'message' => 'Application approved and performer portfolio created successfully.'
                ], 200);
            }

            return response()->json([
                'message' => 'Application is not in a pending state.'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Application not found or already processed.',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // Reject a specific performer application
    public function reject($id)
    {
        try {
            $application = PerformerApplication::findOrFail($id);

            if ($application->status === 'PENDING') {
                // Update status to REJECTED
                $application->status = 'REJECTED';
                $application->save();

                return response()->json([
                    'message' => 'Application rejected successfully.'
                ], 200);
            }

            return response()->json([
                'message' => 'Application is not in a pending state.'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Application not found or already processed.',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}
