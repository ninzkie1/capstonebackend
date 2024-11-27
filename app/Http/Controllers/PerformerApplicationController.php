<?php
namespace App\Http\Controllers;

use App\Models\PerformerApplication;
use App\Models\PerformerPortfolio;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PerformerApplicationController extends Controller
{
    public function index()
    {
        try {
            $applications = PerformerApplication::all()->map(function ($application) {
                $application->id_picture_url = $application->id_picture ? asset('storage/' . $application->id_picture) : null;
                $application->holding_id_picture_url = $application->holding_id_picture ? asset('storage/' . $application->holding_id_picture) : null;
                return $application;
            });

            $groupedApplications = [
                'pending' => $applications->where('status', 'PENDING')->values(),
                'approved' => $applications->where('status', 'APPROVED')->values(),
                'rejected' => $applications->where('status', 'REJECTED')->values(),
            ];

            return response()->json($groupedApplications, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function approve($id)
    {
        try {
            $application = PerformerApplication::findOrFail($id);
    
            if ($application->status !== 'PENDING') {
                return response()->json(['message' => 'Application is not pending.'], 400);
            }
    
            // Approve the application
            $application->status = 'APPROVED';
            $application->save();
    
            // Create the user account
            $user = User::create([
                'name' => $application->name,
                'lastname' => $application->lastname,
                'email' => $application->email,
                'password' => Hash::make($application->password), // Set default or generate random password
                'role' => 'performer',
            ]);
    
            // Create performer portfolio
            PerformerPortfolio::create([
                'performer_id' => $user->id,
                'talent_name' => $application->talent_name,
                'location' => $application->location,
                'description' => $application->description,
                'rate' => 0, // Default rate
                'availability_status' => 'Available',
            ]);
    
            // Send email notification
            Mail::to($application->email)->send(new \App\Mail\ApplicationApproved([
                'name' => $application->name,
                'email' => $application->email,
            ]));
    
            return response()->json(['message' => 'Application approved and performer created.'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error approving application.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    

    public function reject($id)
    {
        try {
            $application = PerformerApplication::findOrFail($id);

            if ($application->status !== 'PENDING') {
                return response()->json(['message' => 'Application is not pending.'], 400);
            }

            // Reject the application
            $application->status = 'REJECTED';
            $application->save();

            return response()->json(['message' => 'Application rejected successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error rejecting application.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
