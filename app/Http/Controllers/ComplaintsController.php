<?php
namespace App\Http\Controllers;

use App\Models\Complaints;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ComplaintSubmissionNotification;
use Illuminate\Support\Facades\Auth;

class ComplaintsController extends Controller
{
    // Store a new complaint
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $complaint = Complaints::create([
            'user_id' => Auth::id(),
            'title' => $request->title,
            'description' => $request->description,
        ]);
        Mail::to(Auth::user()->email)->send(new ComplaintSubmissionNotification($complaint));

        return response()->json(['message' => 'Complaint submitted successfully.', 'complaint' => $complaint], 201);
    }

    // Fetch all complaints (for admin)
    public function index()
    {
        $complaints = Complaints::with('user')->get();
        return response()->json($complaints);
    }

    // Admin response to a complaint
    public function respond(Request $request, $id)
    {
        $request->validate([
            'response' => 'required|string',
        ]);

        $complaint = Complaints::findOrFail($id);
        $complaint->update([
            'response' => $request->response,
            'status' => 'Resolved',
        ]);

        return response()->json(['message' => 'Complaint responded successfully.', 'complaint' => $complaint]);
    }
}
