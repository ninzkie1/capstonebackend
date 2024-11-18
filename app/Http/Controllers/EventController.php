<?php
namespace App\Http\Controllers;

use App\Models\Event;

class EventController extends Controller
{
    public function getEvents()
    {
        // Fetch all events with their associated themes
        $events = Event::with('themes')->get();

        return response()->json($events);
    }

    public function getThemesByEvent($eventId)
    {
        $event = Event::with('themes')->find($eventId);

        if ($event) {
            return response()->json($event->themes);
        }

        return response()->json(['message' => 'Event not found'], 404);
    }
} 