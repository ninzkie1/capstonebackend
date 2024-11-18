<?php

namespace App\Http\Controllers;

use App\Models\Municipality;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    // Get all municipalities with their barangays
    public function getMunicipalities()
    {
        try {
            // Fetch all municipalities
            $municipalities = Municipality::with('barangays')->get(); // 'barangay' should be 'barangays' if your model relation is defined this way

            return response()->json($municipalities, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch municipalities', 'error' => $e->getMessage()], 500);
        }
    }

    // Get barangays by municipality id
    public function getBarangaysByMunicipality($municipalityId)
    {
        $municipality = Municipality::with('barangays')->find($municipalityId);

        if ($municipality) {
            return response()->json($municipality->barangays);
        }

        return response()->json(['message' => 'Municipality not found'], 404);
    }
}
