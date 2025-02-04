<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommenderController extends Controller
{
    public function getRecommendations(Request $request)
    {
        $eventName = $request->query('event_name');
        $themeName = $request->query('theme_name');
        $talentName = $request->query('talent_name');

        try {
            // Call Flask API
            $response = Http::get('https://recommend-mp6v.onrender.com/recommend', [
                'event_name' => $eventName,
                'theme_name' => $themeName,
                'talent_name' => $talentName,
            ]);

            // Log the raw response for debugging
            Log::info('Raw Flask API Response:', ['body' => $response->body()]);

            if ($response->successful()) {
                // Replace NaN values with null
                $rawBody = $response->body();
                $rawBody = str_replace('NaN', 'null', $rawBody);

                // Decode JSON manually and handle potential NaN values
                $responseData = json_decode($rawBody, true, 512, JSON_PARTIAL_OUTPUT_ON_ERROR);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('JSON Decode Error:', ['error' => json_last_error_msg(), 'body' => $rawBody]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Failed to decode Flask API response.',
                    ], 500);
                }

                // Check if 'recommendations' exists
                if (!isset($responseData['recommendations'])) {
                    Log::error('Recommendations not found in Flask API response.', ['response' => $responseData]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Recommendations not found in Flask API response.',
                    ], 500);
                }

                return response()->json([
                    'status' => 'success',
                    'recommendations' => $responseData['recommendations'],
                ]);
            }

            Log::error('Failed to fetch recommendations from Flask API.', ['status' => $response->status()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch recommendations from Flask API.',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Laravel API Error:', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    public function getTopPerformers(Request $request)
    {
        $eventName = $request->query('event_name');
        $themeName = $request->query('theme_name');
        $talentName = strtolower($request->query('talent_name'));

        try {
            // Call Flask API
            $response = Http::get('https://recommend-mp6v.onrender.com/recommend', [
                'event_name' => $eventName,
                'theme_name' => $themeName,
                'talent_name' => $talentName,
            ]);

            // Log the raw response for debugging
            Log::info('Raw Flask API Response:', ['body' => $response->body()]);

            if ($response->successful()) {
                // Replace NaN values with null
                $rawBody = $response->body();
                $rawBody = str_replace('NaN', 'null', $rawBody);

                // Decode JSON manually and handle potential NaN values
                $responseData = json_decode($rawBody, true, 512, JSON_PARTIAL_OUTPUT_ON_ERROR);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('JSON Decode Error:', ['error' => json_last_error_msg(), 'body' => $rawBody]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Failed to decode Flask API response.',
                    ], 500);
                }

                // Check if 'recommendations' exists
                if (!isset($responseData['recommendations'])) {
                    Log::error('Recommendations not found in Flask API response.', ['response' => $responseData]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Recommendations not found in Flask API response.',
                    ], 500);
                }

                // Filter recommendations by talent_name if provided
                $recommendations = $responseData['recommendations'];
                if ($talentName) {
                    $recommendations = array_filter($recommendations, function ($recommendation) use ($talentName) {
                        return isset($recommendation['talent_name']) && 
                               strcasecmp($recommendation['talent_name'], $talentName) === 0;
                    });
                }

                // Sort by highest bookings and scores
                usort($recommendations, function ($a, $b) {
                    return $b['total_bookings'] <=> $a['total_bookings'] ?: $b['average_rating'] <=> $a['average_rating'];
                });

                return response()->json([
                    'status' => 'success',
                    'top_performers' => array_values($recommendations), // Ensure indexed array
                ]);
            }

            Log::error('Failed to fetch recommendations from Flask API.', ['status' => $response->status()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch recommendations from Flask API.',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Laravel API Error:', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
