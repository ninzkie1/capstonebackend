<?php

namespace App\Http\Controllers;

use App\Models\AdminWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdminWalletController extends Controller
{
    public function store(Request $request)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Optional QR image upload
        ]);
    
        try {
            $qrCodePath = null;
    
            // Debugging: Check if the request has a file
            if ($request->hasFile('qr_image')) {
                Log::info('QR image file detected.');
    
                // Try storing the file
                try {
                    $qrCodePath = $request->file('qr_image')->store('wallet_qr_codes', 'public');
                    Log::info('QR image stored at path: ' . $qrCodePath);
                } catch (\Exception $e) {
                    Log::error('Error storing QR image: ' . $e->getMessage());
                    return response()->json(['message' => 'Error storing QR image.'], 500);
                }
            } else {
                Log::info('No QR image file detected.');
            }
    
            // Create a new Admin Wallet record
            $wallet = AdminWallet::create([
                'account_name' => $validatedData['account_name'],
                'account_number' => $validatedData['account_number'],
                'qr_code_path' => $qrCodePath,
            ]);
    
            return response()->json([
                'status' => 'success',
                'wallet' => [
                    'id' => $wallet->id,
                    'account_name' => $wallet->account_name,
                    'account_number' => $wallet->account_number,
                    'qr_code_url' => $wallet->qr_code_path ? asset('storage/' . $wallet->qr_code_path) : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error("Failed to save admin wallet information: " . $e->getMessage());
    
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save admin wallet information.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    
    
    public function update(Request $request, $id)
    {
        // Log received request
        Log::info("Attempting to update wallet with ID: $id");
        Log::info("Request data: " . json_encode($request->all()));
    
        // Validate request data
        $validatedData = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
    
        try {
            // Find the wallet
            $wallet = AdminWallet::findOrFail($id);
            Log::info("Wallet found: " . json_encode($wallet));
    
            // Handle QR code image upload if available
            if ($request->hasFile('qr_image')) {
                Log::info("QR image file found, updating...");
    
                // Delete the old QR code image if it exists
                if ($wallet->qr_code_path) {
                    Storage::disk('public')->delete($wallet->qr_code_path);
                    Log::info("Old QR image deleted.");
                }
    
                // Store the new QR code image
                $wallet->qr_code_path = $request->file('qr_image')->store('wallet_qr_codes', 'public');
                Log::info("New QR image stored at: " . $wallet->qr_code_path);
            }
    
            // Update wallet information
            $wallet->account_name = $validatedData['account_name'];
            $wallet->account_number = $validatedData['account_number'];
            
            // Log before saving
            Log::info("Saving updated wallet data: " . json_encode($wallet));
    
            $wallet->save();
            Log::info("Wallet information updated successfully.");
    
            return response()->json([
                'status' => 'success',
                'wallet' => [
                    'id' => $wallet->id,
                    'account_name' => $wallet->account_name,
                    'account_number' => $wallet->account_number,
                    'qr_code_url' => $wallet->qr_code_path ? asset('storage/' . $wallet->qr_code_path) : null,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to update wallet information: " . $e->getMessage());
    
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update wallet information.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    

    public function show()
    {
        try {
            // Retrieve the first record of AdminWallet (assuming there is only one admin wallet)
            $wallet = AdminWallet::first();
            
            // If wallet information is found, return it
            if ($wallet) {
                return response()->json([
                    'status' => 'success',
                    'wallet' => [
                        'id' => $wallet->id,
                        'account_name' => $wallet->account_name,
                        'account_number' => $wallet->account_number,
                        // Corrected reference to qr_code_path and generating a proper public URL
                        'qr_code_url' => $wallet->qr_code_path ? asset('/backend/talentoproject_backend/public/storage/' . $wallet->qr_code_path) : null,
                    ],
                ], 200);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No wallet information found.',
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error("Failed to fetch wallet information: " . $e->getMessage());
    
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch wallet information.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    }
    

