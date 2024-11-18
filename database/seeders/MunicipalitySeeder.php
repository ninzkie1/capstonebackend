<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Municipality;

class MunicipalitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $municipalities = [
            ['name' => 'Lapu-Lapu City'],
            ['name' => 'Mandaue City'],
            ['name' => 'Liloan'],
            ['name' => 'Consolacion'],
            ['name' => 'Cebu City'],
        ];

        foreach ($municipalities as $municipality) {
            Municipality::create($municipality);
        }
    }
}
