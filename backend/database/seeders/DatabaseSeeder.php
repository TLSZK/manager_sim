<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('players')->truncate();
        DB::table('teams')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $now = now();

        $teams = [
            // LA LIGA (20 Teams - 4 UCL)
            ['id' => 'bar', 'name' => 'Barcelona', 'shortName' => 'BAR', 'strength' => 99, 'primaryColor' => '#a50044', 'secondaryColor' => '#004d98', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png', 'tier' => 1],
            ['id' => 'rma', 'name' => 'Real Madrid', 'shortName' => 'RMA', 'strength' => 92, 'primaryColor' => '#ffffff', 'secondaryColor' => '#1e3a8a', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png', 'tier' => 1],
            ['id' => 'atm', 'name' => 'Atlético Madrid', 'shortName' => 'ATM', 'strength' => 88, 'primaryColor' => '#cb3524', 'secondaryColor' => '#171796', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png', 'tier' => 1],
            ['id' => 'gir', 'name' => 'Girona', 'shortName' => 'GIR', 'strength' => 84, 'primaryColor' => '#ef3340', 'secondaryColor' => '#ffffff', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png', 'tier' => 1],
            ['id' => 'ath', 'name' => 'Athletic Club', 'shortName' => 'ATH', 'strength' => 83, 'primaryColor' => '#e30613', 'secondaryColor' => '#000000', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png', 'tier' => 1],
            ['id' => 'rso', 'name' => 'Real Sociedad', 'shortName' => 'RSO', 'strength' => 82, 'primaryColor' => '#0066b2', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png', 'tier' => 1],
            ['id' => 'bet', 'name' => 'Real Betis', 'shortName' => 'BET', 'strength' => 80, 'primaryColor' => '#0bb363', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png', 'tier' => 1],
            ['id' => 'vil', 'name' => 'Villarreal', 'shortName' => 'VIL', 'strength' => 79, 'primaryColor' => '#fbe10f', 'secondaryColor' => '#00519e', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png', 'tier' => 1],
            ['id' => 'val', 'name' => 'Valencia', 'shortName' => 'VAL', 'strength' => 77, 'primaryColor' => '#ffffff', 'secondaryColor' => '#000000', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png', 'tier' => 1],
            ['id' => 'osa', 'name' => 'Osasuna', 'shortName' => 'OSA', 'strength' => 76, 'primaryColor' => '#da291c', 'secondaryColor' => '#0a1d56', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png', 'tier' => 1],
            ['id' => 'get', 'name' => 'Getafe', 'shortName' => 'GET', 'strength' => 75, 'primaryColor' => '#005999', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png', 'tier' => 1],
            ['id' => 'cel', 'name' => 'Celta Vigo', 'shortName' => 'CEL', 'strength' => 75, 'primaryColor' => '#8ac3ee', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png', 'tier' => 1],
            ['id' => 'sev', 'name' => 'Sevilla', 'shortName' => 'SEV', 'strength' => 76, 'primaryColor' => '#ffffff', 'secondaryColor' => '#d4001f', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png', 'tier' => 1],
            ['id' => 'mal', 'name' => 'Mallorca', 'shortName' => 'MAL', 'strength' => 74, 'primaryColor' => '#e20613', 'secondaryColor' => '#000000', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png', 'tier' => 1],
            ['id' => 'ray', 'name' => 'Rayo Vallecano', 'shortName' => 'RAY', 'strength' => 73, 'primaryColor' => '#ffffff', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png', 'tier' => 1],
            ['id' => 'ala', 'name' => 'Alavés', 'shortName' => 'ALA', 'strength' => 72, 'primaryColor' => '#0057a6', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png', 'tier' => 1],
            ['id' => 'pal', 'name' => 'Las Palmas', 'shortName' => 'PAL', 'strength' => 71, 'primaryColor' => '#ffc400', 'secondaryColor' => '#00539f', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png', 'tier' => 1],
            ['id' => 'leg', 'name' => 'Leganés', 'shortName' => 'LEG', 'strength' => 70, 'primaryColor' => '#0055a4', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png', 'tier' => 1],
            ['id' => 'val2', 'name' => 'Valladolid', 'shortName' => 'VLD', 'strength' => 69, 'primaryColor' => '#5c2d7f', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png', 'tier' => 1],
            ['id' => 'esp', 'name' => 'Espanyol', 'shortName' => 'ESP', 'strength' => 70, 'primaryColor' => '#338ecc', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png', 'tier' => 1],

            // EUROPEAN GIANTS (32 Teams - All UCL)
            ['id' => 'mci', 'name' => 'Manchester City', 'shortName' => 'MCI', 'strength' => 96, 'primaryColor' => '#6CABDD', 'secondaryColor' => '#1C2C5B', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png', 'tier' => 2],
            ['id' => 'liv', 'name' => 'Liverpool', 'shortName' => 'LIV', 'strength' => 96, 'primaryColor' => '#C8102E', 'secondaryColor' => '#00B2A9', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png', 'tier' => 2],
            ['id' => 'ars', 'name' => 'Arsenal', 'shortName' => 'ARS', 'strength' => 94, 'primaryColor' => '#EF0107', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png', 'tier' => 2],
            ['id' => 'avl', 'name' => 'Aston Villa', 'shortName' => 'AVL', 'strength' => 85, 'primaryColor' => '#95BBE5', 'secondaryColor' => '#670E36', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png', 'tier' => 2],
            ['id' => 'bay', 'name' => 'Bayern Munich', 'shortName' => 'BAY', 'strength' => 96, 'primaryColor' => '#DC052D', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 'tier' => 2],
            ['id' => 'dor', 'name' => 'Dortmund', 'shortName' => 'BVB', 'strength' => 89, 'primaryColor' => '#FDE100', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png', 'tier' => 2],
            ['id' => 'rbl', 'name' => 'Leipzig', 'shortName' => 'RBL', 'strength' => 86, 'primaryColor' => '#DD0741', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png', 'tier' => 2],
            ['id' => 'lev', 'name' => 'Leverkusen', 'shortName' => 'B04', 'strength' => 92, 'primaryColor' => '#E32221', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png', 'tier' => 2],
            ['id' => 'stu', 'name' => 'Stuttgart', 'shortName' => 'VFB', 'strength' => 82, 'primaryColor' => '#FFFFFF', 'secondaryColor' => '#E32221', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png', 'tier' => 2],
            ['id' => 'int', 'name' => 'Inter', 'shortName' => 'INT', 'strength' => 92, 'primaryColor' => '#010E80', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png', 'tier' => 2],
            ['id' => 'mil', 'name' => 'Milan', 'shortName' => 'MIL', 'strength' => 88, 'primaryColor' => '#FB090B', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png', 'tier' => 2],
            ['id' => 'juv', 'name' => 'Juventus', 'shortName' => 'JUV', 'strength' => 87, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png', 'tier' => 2],
            ['id' => 'ata', 'name' => 'Atalanta', 'shortName' => 'ATA', 'strength' => 85, 'primaryColor' => '#1E71B8', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png', 'tier' => 2],
            ['id' => 'bol', 'name' => 'Bologna', 'shortName' => 'BOL', 'strength' => 80, 'primaryColor' => '#1A2F48', 'secondaryColor' => '#A21C26', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png', 'tier' => 2],
            ['id' => 'psg', 'name' => 'Paris SG', 'shortName' => 'PSG', 'strength' => 94, 'primaryColor' => '#004170', 'secondaryColor' => '#DA291C', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png', 'tier' => 2],
            ['id' => 'mon', 'name' => 'Monaco', 'shortName' => 'MON', 'strength' => 83, 'primaryColor' => '#E51D1F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png', 'tier' => 2],
            ['id' => 'bre', 'name' => 'Brest', 'shortName' => 'SB29', 'strength' => 78, 'primaryColor' => '#DD0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png', 'tier' => 2],
            ['id' => 'lil', 'name' => 'Lille', 'shortName' => 'LOSC', 'strength' => 82, 'primaryColor' => '#E01E13', 'secondaryColor' => '#20325F', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png', 'tier' => 2],
            ['id' => 'psv', 'name' => 'PSV', 'shortName' => 'PSV', 'strength' => 81, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png', 'tier' => 2],
            ['id' => 'fey', 'name' => 'Feyenoord', 'shortName' => 'FEY', 'strength' => 80, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png', 'tier' => 2],
            ['id' => 'spo', 'name' => 'Sporting', 'shortName' => 'SCP', 'strength' => 84, 'primaryColor' => '#008000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png', 'tier' => 2],
            ['id' => 'ben', 'name' => 'Benfica', 'shortName' => 'SLB', 'strength' => 83, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png', 'tier' => 2],
            ['id' => 'bru', 'name' => 'Brugge', 'shortName' => 'CLB', 'strength' => 78, 'primaryColor' => '#000000', 'secondaryColor' => '#0067CE', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png', 'tier' => 2],
            ['id' => 'cel_sco', 'name' => 'Celtic', 'shortName' => 'CEL', 'strength' => 77, 'primaryColor' => '#018749', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png', 'tier' => 2],
            ['id' => 'sha', 'name' => 'Shakhtar', 'shortName' => 'SHK', 'strength' => 78, 'primaryColor' => '#F58220', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9728.png', 'tier' => 2],
            ['id' => 'sal', 'name' => 'Salzburg', 'shortName' => 'RBS', 'strength' => 76, 'primaryColor' => '#D11241', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10013.png', 'tier' => 2],
            ['id' => 'you', 'name' => 'Young Boys', 'shortName' => 'YB', 'strength' => 74, 'primaryColor' => '#FFD700', 'secondaryColor' => '#000000', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10192.png', 'tier' => 2],
            ['id' => 'zag', 'name' => 'Dinamo Zagreb', 'shortName' => 'DIN', 'strength' => 74, 'primaryColor' => '#00539F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10156.png', 'tier' => 2],
            ['id' => 'crv', 'name' => 'Red Star', 'shortName' => 'RSB', 'strength' => 73, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8687.png', 'tier' => 2],
            ['id' => 'spa', 'name' => 'Sparta Prague', 'shortName' => 'SPA', 'strength' => 75, 'primaryColor' => '#A41034', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10247.png', 'tier' => 2],
            ['id' => 'fer', 'name' => 'Ferencváros', 'shortName' => 'FTC', 'strength' => 72, 'primaryColor' => '#1A8C43', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8222.png', 'tier' => 2],
            ['id' => 'stg', 'name' => 'Sturm Graz', 'shortName' => 'STU', 'strength' => 72, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10014.png', 'tier' => 2],
        ];

        // Specific real players for major teams
        $realPlayers = [
            'bar' => ['J. Garcia', 'Cubarsí', 'Balde', 'Araújo', 'Koundé', 'Pedri', 'Gavi', 'De Jong', 'Raphinha', 'Yamal', 'Lewandowski', 'Szczesny', 'Christensen', 'Fermin', 'Olmo', 'Ferran', 'Martinez', 'Fati', 'Casado', 'Fort', 'Pena'],
            'rma' => ['Courtois', 'Carvajal', 'Militao', 'Rüdiger', 'Mendy', 'Tchouaméni', 'Valverde', 'Bellingham', 'Rodrygo', 'Mbappé', 'Vinícius Jr', 'Lunin', 'Camavinga', 'Brahim', 'Güler', 'Alaba', 'Vazquez', 'Garcia', 'Modric', 'Ceballos', 'Endrick'],
            'atm' => ['Oblak', 'Molina', 'Gimenez', 'Le Normand', 'Lino', 'De Paul', 'Koke', 'Gallagher', 'Griezmann', 'Alvarez', 'Sorloth', 'Musso', 'Witsel', 'Azpilicueta', 'Llorente', 'Riquelme', 'Correa', 'Barrios', 'Mandava'],
            'mci' => ['Ederson', 'Walker', 'Dias', 'Gvardiol', 'Ake', 'Rodri', 'Kovacic', 'De Bruyne', 'Silva', 'Foden', 'Haaland', 'Ortega', 'Stones', 'Akanji', 'Grealish', 'Doku', 'Savinho', 'Nunes', 'Bobb', 'Lewis'],
            'liv' => ['Alisson', 'Alexander-Arnold', 'Van Dijk', 'Konate', 'Robertson', 'Mac Allister', 'Gravenberch', 'Szoboszlai', 'Salah', 'Diaz', 'Jota', 'Kelleher', 'Gomez', 'Quansah', 'Bradley', 'Endo', 'Jones', 'Elliott', 'Gakpo', 'Nunez', 'Chiesa'],
            'ars' => ['Raya', 'White', 'Saliba', 'Gabriel', 'Timber', 'Rice', 'Odegaard', 'Merino', 'Saka', 'Martinelli', 'Havertz', 'Neto', 'Kiwior', 'Zinchenko', 'Calafiori', 'Partey', 'Jorginho', 'Trossard', 'Sterling', 'Jesus'],
            'bay' => ['Neuer', 'Boey', 'Upamecano', 'Kim', 'Davies', 'Kimmich', 'Pavlovic', 'Musiala', 'Olise', 'Sane', 'Kane', 'Ulreich', 'Dier', 'Ito', 'Guerreiro', 'Palhinha', 'Laimer', 'Goretzka', 'Gnabry', 'Coman', 'Muller', 'Tel'],
            'psg' => ['Donnarumma', 'Hakimi', 'Marquinhos', 'Pacho', 'Mendes', 'Vitinha', 'Neves', 'Zaire-Emery', 'Dembele', 'Barcola', 'Asensio', 'Safonov', 'Skriniar', 'Beraldo', 'Ruiz', 'Lee', 'Doue', 'Kolo Muani', 'Ramos', 'Hernandez']
        ];

        foreach ($teams as $team) {
            $initialStats = json_encode(['played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0, 'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0, 'form' => []]);
            $uclStats = $team['isUCL'] ? json_encode(['played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0, 'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0, 'rank' => 0]) : null;

            DB::table('teams')->insert(array_merge($team, ['stats' => $initialStats, 'uclStats' => $uclStats, 'created_at' => $now, 'updated_at' => $now]));

            if (isset($realPlayers[$team['id']])) {
                foreach ($realPlayers[$team['id']] as $idx => $pName) {
                    DB::table('players')->insert(['id' => Str::uuid(), 'team_id' => $team['id'], 'name' => $pName, 'number' => $idx + 1, 'position' => $this->getPosition($idx), 'rating' => min(99, max(60, floor($team['strength'] + (rand(0, 8) - 4)))), 'offField' => $idx >= 11, 'created_at' => $now, 'updated_at' => $now]);
                }
            } else {
                $this->generateRealisticRoster($team['id'], $team['strength'], $team['tier'] === 1 ? 'es' : 'eu');
            }
        }
    }

    private function generateRealisticRoster($teamId, $strength, $region)
    {
        $esFirst = ['Alejandro', 'Diego', 'Carlos', 'Javier', 'Miguel', 'Jose', 'David', 'Jorge', 'Ivan', 'Raul', 'Sergio', 'Pablo'];
        $esLast = ['Garcia', 'Rodriguez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Martin', 'Ruiz', 'Hernandez'];
        $euFirst = ['Lukas', 'Matteo', 'Thomas', 'Kevin', 'Maxim', 'Leon', 'Arthur', 'Julian', 'Enzo', 'Oliver'];
        $euLast = ['Muller', 'Rossi', 'Silva', 'Costa', 'Russo', 'Weber', 'Novak', 'Peeters', 'Hansen', 'Jensen'];

        for ($i = 0; $i < 22; $i++) {
            $first = $region === 'es' ? $esFirst[array_rand($esFirst)] : $euFirst[array_rand($euFirst)];
            $last = $region === 'es' ? $esLast[array_rand($esLast)] : $euLast[array_rand($euLast)];
            DB::table('players')->insert(['id' => Str::uuid(), 'team_id' => $teamId, 'name' => mb_substr($first, 0, 1) . '. ' . $last, 'number' => $i + 1, 'position' => $this->getPosition($i), 'rating' => min(99, max(50, floor($strength + (rand(0, 12) - 6)))), 'offField' => $i >= 11, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    private function getPosition($i) {
        if ($i === 0 || $i === 11) return 'GK';
        if ($i <= 4 || ($i >= 12 && $i <= 15)) return 'DEF';
        if ($i <= 7 || ($i >= 16 && $i <= 18)) return 'MID';
        return 'FWD';
    }
}