<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barangay;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $barangays = [
            // Lapu-Lapu City
            ['name' => 'Agus', 'municipality_id' => 1],
            ['name' => 'Babag', 'municipality_id' => 1],
            ['name' => 'Bankal', 'municipality_id' => 1],
            ['name' => 'Basak', 'municipality_id' => 1],
            ['name' => 'Buaya', 'municipality_id' => 1],
            ['name' => 'Calawisan', 'municipality_id' => 1],
            ['name' => 'Canjulao', 'municipality_id' => 1],
            ['name' => 'Gun-ob', 'municipality_id' => 1],
            ['name' => 'Ibo', 'municipality_id' => 1],
            ['name' => 'Looc', 'municipality_id' => 1],
            ['name' => 'Maribago', 'municipality_id' => 1],
            ['name' => 'Marigondon', 'municipality_id' => 1],
            ['name' => 'Pajo', 'municipality_id' => 1],
            ['name' => 'Poblacion', 'municipality_id' => 1],
            ['name' => 'Punta Engaño', 'municipality_id' => 1],
            ['name' => 'Pusok', 'municipality_id' => 1],
            ['name' => 'Suba-Basbas', 'municipality_id' => 1],
            ['name' => 'Talima', 'municipality_id' => 1],

            // Mandaue City
            ['name' => 'Alang-Alang', 'municipality_id' => 2],
            ['name' => 'Banilad', 'municipality_id' => 2],
            ['name' => 'Basak', 'municipality_id' => 2],
            ['name' => 'Cabancalan', 'municipality_id' => 2],
            ['name' => 'Cambaro', 'municipality_id' => 2],
            ['name' => 'Casuntingan', 'municipality_id' => 2],
            ['name' => 'Centro', 'municipality_id' => 2],
            ['name' => 'Guizo', 'municipality_id' => 2],
            ['name' => 'Ibabao-Estancia', 'municipality_id' => 2],
            ['name' => 'Jagobiao', 'municipality_id' => 2],
            ['name' => 'Looc', 'municipality_id' => 2],
            ['name' => 'Maguikay', 'municipality_id' => 2],
            ['name' => 'Mantuyong', 'municipality_id' => 2],
            ['name' => 'Opao', 'municipality_id' => 2],
            ['name' => 'Pagsabungan', 'municipality_id' => 2],
            ['name' => 'Paknaan', 'municipality_id' => 2],
            ['name' => 'Subangdaku', 'municipality_id' => 2],
            ['name' => 'Tabok', 'municipality_id' => 2],
            ['name' => 'Tawason', 'municipality_id' => 2],
            ['name' => 'Tipolo', 'municipality_id' => 2],
            ['name' => 'Umapad', 'municipality_id' => 2],

            // Liloan
            ['name' => 'Calero', 'municipality_id' => 3],
            ['name' => 'Catarman', 'municipality_id' => 3],
            ['name' => 'Cotcot', 'municipality_id' => 3],
            ['name' => 'Jubay', 'municipality_id' => 3],
            ['name' => 'Lataban', 'municipality_id' => 3],
            ['name' => 'Poblacion', 'municipality_id' => 3],
            ['name' => 'San Vicente', 'municipality_id' => 3],
            ['name' => 'Yati', 'municipality_id' => 3],

            // Consolacion
            ['name' => 'Cabangahan', 'municipality_id' => 4],
            ['name' => 'Cansaga', 'municipality_id' => 4],
            ['name' => 'Casili', 'municipality_id' => 4],
            ['name' => 'Danglag', 'municipality_id' => 4],
            ['name' => 'Garing', 'municipality_id' => 4],
            ['name' => 'Jugan', 'municipality_id' => 4],
            ['name' => 'Lamac', 'municipality_id' => 4],
            ['name' => 'Nangka', 'municipality_id' => 4],
            ['name' => 'Poblacion Occidental', 'municipality_id' => 4],
            ['name' => 'Poblacion Oriental', 'municipality_id' => 4],
            ['name' => 'Pulpogan', 'municipality_id' => 4],
            ['name' => 'Tayud', 'municipality_id' => 4],
            ['name' => 'Tolotolo', 'municipality_id' => 4],
            ['name' => 'Pitogo', 'municipality_id' => 4],

            // Cebu City
            ['name' => 'Apas', 'municipality_id' => 5],
            ['name' => 'Banilad', 'municipality_id' => 5],
            ['name' => 'Basak Pardo', 'municipality_id' => 5],
            ['name' => 'Basak San Nicolas', 'municipality_id' => 5],
            ['name' => 'Bonbon', 'municipality_id' => 5],
            ['name' => 'Budlaan', 'municipality_id' => 5],
            ['name' => 'Busay', 'municipality_id' => 5],
            ['name' => 'Capitol Site', 'municipality_id' => 5],
            ['name' => 'Cogon Ramos', 'municipality_id' => 5],
            ['name' => 'Day-as', 'municipality_id' => 5],
            ['name' => 'Ermita', 'municipality_id' => 5],
            ['name' => 'Guadalupe', 'municipality_id' => 5],
            ['name' => 'Kalunasan', 'municipality_id' => 5],
            ['name' => 'Kinasang-an', 'municipality_id' => 5],
            ['name' => 'Lahug', 'municipality_id' => 5],
            ['name' => 'Mabolo', 'municipality_id' => 5],
            ['name' => 'Mambaling', 'municipality_id' => 5],
            ['name' => 'Pasil', 'municipality_id' => 5],
            ['name' => 'Poblacion Pardo', 'municipality_id' => 5],
            ['name' => 'Punta Princesa', 'municipality_id' => 5],
            ['name' => 'Quiot', 'municipality_id' => 5],
            ['name' => 'San Jose', 'municipality_id' => 5],
            ['name' => 'San Nicolas Proper', 'municipality_id' => 5],
            ['name' => 'Sawang Calero', 'municipality_id' => 5],
            ['name' => 'Talamban', 'municipality_id' => 5],
            ['name' => 'Tisa', 'municipality_id' => 5],
            ['name' => 'Zapatera', 'municipality_id' => 5],
        ];

        foreach ($barangays as $barangay) {
            Barangay::create($barangay);
        }
    }
}
