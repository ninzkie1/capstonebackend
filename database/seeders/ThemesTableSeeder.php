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
            'Birthday' => ['Retro', 'Disco', 'Casual', 'Carnival', 'Hollywood Glam'],
            'Wedding' => ['Romantic', 'Rustic', 'Fairytale', 'Bohemian', 'Garden Party'],
            'Corporate' => ['Formal', 'Tech', 'Minimal', 'Futuristic', 'Team Building'],
            'Concert' => ['Rock', 'Pop', 'Indie', 'Jazz', 'EDM'],
            'Reunion' => ['Highschool', 'Vintage', 'Nature', 'Summer time', 'Under the Sea'],
            'Anniversary' => ['Golden Jubilee', 'Vintage', 'Black Tie', 'Romantic Getaway'],
            'Graduation' => ['Academic Chic', 'Class Colors', 'Future Forward'],
            'Holiday Party' => ['Winter Wonderland', 'Tropical Escape', 'Ugly Sweater', 'Masquerade'],
            'Charity Gala' => ['Great Gatsby', 'Enchanted Forest', 'Starry Night'],
            'Festival' => ['Cultural Heritage', 'Artisan Market', 'Food Truck Fiesta', 'Music Extravaganza'],
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
