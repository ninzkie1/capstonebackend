<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Theme;
use App\Models\Event;

class ThemesTableSeeder extends Seeder
{
    public function run()
    {
        // Predefined themes for each event
        $themes = [
            'Birthday' => ['Retro', 'Disco', 'Casual'],
            'Wedding' => ['Romantic', 'Rustic', 'Fairytale'],
            'Corporate' => ['Formal', 'Tech', 'Minimal'],
            'Concert' => ['Rock', 'Pop', 'Indie']
        ];

        foreach ($themes as $eventName => $themeList) {
            $event = Event::where('name', $eventName)->first();

            if ($event) {
                foreach ($themeList as $theme) {
                    Theme::create([
                        'name' => $theme,
                        'event_id' => $event->id,
                    ]);
                }
            }
        }
    }
}
