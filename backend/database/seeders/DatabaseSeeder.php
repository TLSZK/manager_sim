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
            // LA LIGA
            ['id' => 'bar', 'name' => 'Barcelona', 'shortName' => 'BAR', 'strength' => 99, 'primaryColor' => '#a50044', 'secondaryColor' => '#004d98', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png', 'tier' => 1],
            ['id' => 'rma', 'name' => 'Real Madrid', 'shortName' => 'RMA', 'strength' => 92, 'primaryColor' => '#ffffff', 'secondaryColor' => '#1e3a8a', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png', 'tier' => 1],
            ['id' => 'atm', 'name' => 'Atlético Madrid', 'shortName' => 'ATM', 'strength' => 88, 'primaryColor' => '#cb3524', 'secondaryColor' => '#171796', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png', 'tier' => 1],
            ['id' => 'gir', 'name' => 'Girona', 'shortName' => 'GIR', 'strength' => 84, 'primaryColor' => '#ef3340', 'secondaryColor' => '#ffffff', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png', 'tier' => 1],
            ['id' => 'ath', 'name' => 'Athletic Club', 'shortName' => 'ATH', 'strength' => 83, 'primaryColor' => '#e30613', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png', 'tier' => 1],
            ['id' => 'rso', 'name' => 'Real Sociedad', 'shortName' => 'RSO', 'strength' => 82, 'primaryColor' => '#0066b2', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png', 'tier' => 1],
            ['id' => 'bet', 'name' => 'Real Betis', 'shortName' => 'BET', 'strength' => 80, 'primaryColor' => '#0bb363', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png', 'tier' => 1],
            ['id' => 'vil', 'name' => 'Villarreal', 'shortName' => 'VIL', 'strength' => 79, 'primaryColor' => '#fbe10f', 'secondaryColor' => '#00519e', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png', 'tier' => 1],
            ['id' => 'val', 'name' => 'Valencia', 'shortName' => 'VAL', 'strength' => 77, 'primaryColor' => '#ffffff', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png', 'tier' => 1],
            ['id' => 'osa', 'name' => 'Osasuna', 'shortName' => 'OSA', 'strength' => 76, 'primaryColor' => '#da291c', 'secondaryColor' => '#0a1d56', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png', 'tier' => 1],
            ['id' => 'get', 'name' => 'Getafe', 'shortName' => 'GET', 'strength' => 75, 'primaryColor' => '#005999', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png', 'tier' => 1],
            ['id' => 'cel', 'name' => 'Celta Vigo', 'shortName' => 'CEL', 'strength' => 75, 'primaryColor' => '#8ac3ee', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png', 'tier' => 1],
            ['id' => 'sev', 'name' => 'Sevilla', 'shortName' => 'SEV', 'strength' => 76, 'primaryColor' => '#ffffff', 'secondaryColor' => '#d4001f', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png', 'tier' => 1],
            ['id' => 'mal', 'name' => 'Mallorca', 'shortName' => 'MAL', 'strength' => 74, 'primaryColor' => '#e20613', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png', 'tier' => 1],
            ['id' => 'ray', 'name' => 'Rayo Vallecano', 'shortName' => 'RAY', 'strength' => 73, 'primaryColor' => '#ffffff', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png', 'tier' => 1],
            ['id' => 'ala', 'name' => 'Alavés', 'shortName' => 'ALA', 'strength' => 72, 'primaryColor' => '#0057a6', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png', 'tier' => 1],
            ['id' => 'pal', 'name' => 'Las Palmas', 'shortName' => 'PAL', 'strength' => 71, 'primaryColor' => '#ffc400', 'secondaryColor' => '#00539f', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png', 'tier' => 1],
            ['id' => 'leg', 'name' => 'Leganés', 'shortName' => 'LEG', 'strength' => 70, 'primaryColor' => '#0055a4', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png', 'tier' => 1],
            ['id' => 'val2', 'name' => 'Valladolid', 'shortName' => 'VLD', 'strength' => 69, 'primaryColor' => '#5c2d7f', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png', 'tier' => 1],
            ['id' => 'esp', 'name' => 'Espanyol', 'shortName' => 'ESP', 'strength' => 70, 'primaryColor' => '#338ecc', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png', 'tier' => 1],

            // EUROPEAN GIANTS
            ['id' => 'mci', 'name' => 'Manchester City', 'shortName' => 'MCI', 'strength' => 96, 'primaryColor' => '#6CABDD', 'secondaryColor' => '#1C2C5B', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png', 'tier' => 2],
            ['id' => 'liv', 'name' => 'Liverpool', 'shortName' => 'LIV', 'strength' => 96, 'primaryColor' => '#C8102E', 'secondaryColor' => '#00B2A9', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png', 'tier' => 2],
            ['id' => 'ars', 'name' => 'Arsenal', 'shortName' => 'ARS', 'strength' => 94, 'primaryColor' => '#EF0107', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png', 'tier' => 2],
            ['id' => 'avl', 'name' => 'Aston Villa', 'shortName' => 'AVL', 'strength' => 85, 'primaryColor' => '#95BBE5', 'secondaryColor' => '#670E36', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png', 'tier' => 2],
            ['id' => 'bay', 'name' => 'Bayern Munich', 'shortName' => 'BAY', 'strength' => 96, 'primaryColor' => '#DC052D', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 'tier' => 2],
            ['id' => 'dor', 'name' => 'Dortmund', 'shortName' => 'BVB', 'strength' => 89, 'primaryColor' => '#FDE100', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png', 'tier' => 2],
            ['id' => 'rbl', 'name' => 'Leipzig', 'shortName' => 'RBL', 'strength' => 86, 'primaryColor' => '#DD0741', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png', 'tier' => 2],
            ['id' => 'lev', 'name' => 'Leverkusen', 'shortName' => 'B04', 'strength' => 92, 'primaryColor' => '#E32221', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png', 'tier' => 2],
            ['id' => 'stu', 'name' => 'Stuttgart', 'shortName' => 'VFB', 'strength' => 82, 'primaryColor' => '#FFFFFF', 'secondaryColor' => '#E32221', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png', 'tier' => 2],
            ['id' => 'int', 'name' => 'Inter', 'shortName' => 'INT', 'strength' => 92, 'primaryColor' => '#010E80', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png', 'tier' => 2],
            ['id' => 'mil', 'name' => 'Milan', 'shortName' => 'MIL', 'strength' => 88, 'primaryColor' => '#FB090B', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png', 'tier' => 2],
            ['id' => 'juv', 'name' => 'Juventus', 'shortName' => 'JUV', 'strength' => 87, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png', 'tier' => 2],
            ['id' => 'ata', 'name' => 'Atalanta', 'shortName' => 'ATA', 'strength' => 85, 'primaryColor' => '#1E71B8', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png', 'tier' => 2],
            ['id' => 'bol', 'name' => 'Bologna', 'shortName' => 'BOL', 'strength' => 80, 'primaryColor' => '#1A2F48', 'secondaryColor' => '#A21C26', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png', 'tier' => 2],
            ['id' => 'psg', 'name' => 'Paris SG', 'shortName' => 'PSG', 'strength' => 94, 'primaryColor' => '#004170', 'secondaryColor' => '#DA291C', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png', 'tier' => 2],
            ['id' => 'mon', 'name' => 'Monaco', 'shortName' => 'MON', 'strength' => 83, 'primaryColor' => '#E51D1F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png', 'tier' => 2],
            ['id' => 'bre', 'name' => 'Brest', 'shortName' => 'SB29', 'strength' => 78, 'primaryColor' => '#DD0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png', 'tier' => 2],
            ['id' => 'lil', 'name' => 'Lille', 'shortName' => 'LOSC', 'strength' => 82, 'primaryColor' => '#E01E13', 'secondaryColor' => '#20325F', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png', 'tier' => 2],
            ['id' => 'psv', 'name' => 'PSV', 'shortName' => 'PSV', 'strength' => 81, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png', 'tier' => 2],
            ['id' => 'fey', 'name' => 'Feyenoord', 'shortName' => 'FEY', 'strength' => 80, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png', 'tier' => 2],
            ['id' => 'spo', 'name' => 'Sporting', 'shortName' => 'SCP', 'strength' => 84, 'primaryColor' => '#008000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png', 'tier' => 2],
            ['id' => 'ben', 'name' => 'Benfica', 'shortName' => 'SLB', 'strength' => 83, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png', 'tier' => 2],
            ['id' => 'bru', 'name' => 'Brugge', 'shortName' => 'CLB', 'strength' => 78, 'primaryColor' => '#000000', 'secondaryColor' => '#0067CE', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png', 'tier' => 2],
            ['id' => 'cel_sco', 'name' => 'Celtic', 'shortName' => 'CEL', 'strength' => 77, 'primaryColor' => '#018749', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png', 'tier' => 2],
            ['id' => 'sha', 'name' => 'Shakhtar', 'shortName' => 'SHK', 'strength' => 78, 'primaryColor' => '#F58220', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9728.png', 'tier' => 2],
            ['id' => 'sal', 'name' => 'Salzburg', 'shortName' => 'RBS', 'strength' => 76, 'primaryColor' => '#D11241', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10013.png', 'tier' => 2],
            ['id' => 'you', 'name' => 'Young Boys', 'shortName' => 'YB', 'strength' => 74, 'primaryColor' => '#FFD700', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10192.png', 'tier' => 2],
            ['id' => 'zag', 'name' => 'Dinamo Zagreb', 'shortName' => 'DIN', 'strength' => 74, 'primaryColor' => '#00539F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10156.png', 'tier' => 2],
            ['id' => 'crv', 'name' => 'Red Star', 'shortName' => 'RSB', 'strength' => 73, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8687.png', 'tier' => 2],
            ['id' => 'spa', 'name' => 'Sparta Prague', 'shortName' => 'SPA', 'strength' => 75, 'primaryColor' => '#A41034', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10247.png', 'tier' => 2],
            ['id' => 'fer', 'name' => 'Ferencváros', 'shortName' => 'FTC', 'strength' => 72, 'primaryColor' => '#1A8C43', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8222.png', 'tier' => 2],
            ['id' => 'stg', 'name' => 'Sturm Graz', 'shortName' => 'STU', 'strength' => 72, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10014.png', 'tier' => 2],
        ];

        // Format is Name:Position:Rating:ShirtNumber 
        // 25/26 Updated Roster Database
        $realPlayers = [
            'bar' => ['J. García:GK:99:13', 'Szczesny:GK:80:25', 'Yamal:RW:99:10', 'Lewandowski:ST:91:9', 'Raphinha:LW:99:11', 'Pedri:CM:99:8', 'De Jong:CDM:99:21', 'Araújo:CB:99:4', 'Gavi:CM:99:6', 'Olmo:CAM:99:20', 'Koundé:RB:99:23', 'Balde:LB:99:3', 'Cubarsí:CB:99:5', 'Christensen:CB:84:15', 'Fermín:CAM:99:16', 'Eric García:CB:99:24', 'Casadó:CDM:83:17', 'Ferran:RW:81:7', 'Rashford:LW:84:14', 'Bardghji:RW:77:19', 'Gerard Martín:LB:75:18', 'Cancelo:RB:83:2'],
            'rma' => ['Mbappé:ST:93:9', 'Vinícius Jr:LW:92:7', 'Bellingham:CM:91:5', 'Courtois:GK:90:1', 'Valverde:CM:89:8', 'Rüdiger:CB:88:22', 'Carvajal:RB:87:2', 'Rodrygo:RW:86:11', 'Militao:CB:86:3', 'Tchouaméni:CDM:85:14', 'Modric:CM:85:10', 'Mendy:LB:84:23', 'Camavinga:CDM:84:6', 'Alaba:CB:83:4', 'Brahim:CAM:83:21', 'Lunin:GK:82:13', 'Güler:RW:81:15', 'Vazquez:RB:80:17', 'Ceballos:CM:80:19', 'Garcia:LB:79:20', 'Endrick:ST:78:16', 'Vallejo:CB:75:18'],
            'atm' => ['Griezmann:ST:88:7', 'Oblak:GK:88:13', 'Alvarez:ST:86:19', 'De Paul:CM:85:5', 'Giménez:CB:85:2', 'Llorente:RM:84:14', 'Le Normand:CB:84:24', 'Koke:CDM:84:6', 'Gallagher:CM:83:4', 'Sorloth:ST:83:9', 'Lino:LM:82:12', 'Witsel:CB:82:20', 'Correa:ST:82:10', 'Lemar:CM:81:11', 'Riquelme:LM:81:17', 'Azpilicueta:CB:81:3', 'Molina:RB:81:16', 'Lenglet:CB:81:15', 'Barrios:CM:80:8', 'Mandava:LB:80:23', 'Musso:GK:80:1', 'Simeone:ST:78:22'],
            'gir' => ['Gazzaniga:GK:82:13', 'Ter Stegen:GK:89:22', 'Tsygankov:RW:82:8', 'López:CB:81:5', 'Gutiérrez:LB:83:3', 'Herrera:CM:80:21', 'Martín:CAM:80:23', 'Martinez:RB:80:4', 'Blind:CB:80:17', 'Gil:LW:80:20', 'Romeu:CDM:79:14', 'Portu:CAM:79:24', 'Danjuma:LW:79:11', 'Ruiz:ST:79:9', 'Stuani:ST:78:7', 'Danzuma:LB:78:12', 'Asprilla:RW:77:10', 'Miovski:ST:76:19', 'Francés:RB:76:16', 'Juanpe:CB:76:15', 'Solís:CDM:75:22', 'Misehouy:CM:74:27'],
            'ath' => ['N. Williams:LW:86:10', 'Simón:GK:85:1', 'I. Williams:RW:84:9', 'Vivian:CB:83:3', 'Sancet:CAM:82:8', 'Guruzeta:ST:81:12', 'De Marcos:RB:80:18', 'Paredes:CB:80:4', 'Yuri:LB:80:17', 'Berenguer:RW:80:7', 'Yeray:CB:80:5', 'Vesga:CM:79:6', 'Herrera:CM:79:21', 'Prados:CDM:78:24', 'Ruiz:CDM:78:16', 'Agirrezabala:GK:78:13', 'Djalo:LW:78:11', 'Gómez:CAM:77:20', 'Lekue:RB:77:15', 'Boik:LB:75:14', 'Martón:ST:75:19', 'Serrano:ST:74:22'],
            'rso' => ['Zubimendi:CDM:85:4', 'Remiro:GK:84:1', 'Kubo:RW:84:14', 'Méndez:CM:83:23', 'Oyarzabal:ST:83:10', 'Zubeldia:CB:82:5', 'Traoré:RB:81:21', 'Aguerd:CB:81:23', 'Muñoz:LB:80:3', 'Barrenetxea:LW:80:7', 'Elustondo:CB:80:6', 'Turrientes:CM:79:22', 'Zakharyan:CAM:79:8', 'Sadiq:ST:78:19', 'Becker:RW:78:11', 'Gómez:LB:78:12', 'Gómez:LW:77:17', 'Óskarsson:ST:77:9', 'Aramburu:RB:76:27', 'Olasagasti:CDM:76:16', 'Marrero:GK:75:13', 'Marín:CM:75:20'],
            'bet' => ['Lo Celso:CAM:83:20', 'Silva:GK:82:1', 'Isco:CAM:82:22', 'Fornals:RW:81:18', 'Llorente:CB:81:3', 'Bellerín:RB:80:2', 'Natan:CB:80:6', 'Cardoso:CDM:80:4', 'Roca:CM:80:21', 'Carvalho:CM:80:14', 'Abde:LW:80:10', 'Roque:ST:80:8', 'Perraud:LB:79:15', 'Bartra:CB:79:5', 'Bakambu:ST:79:11', 'Avila:ST:79:9', 'Sabaly:RB:78:23', 'Ruibal:RW:78:24', 'Juanmi:LW:78:7', 'Altimira:CDM:77:16', 'Adrian:GK:76:13', 'Rodriguez:LB:76:12'],
            'vil' => ['Baena:LM:84:16', 'Pino:RM:82:21', 'Parejo:CM:82:10', 'Albiol:CB:81:3', 'Foyth:RB:81:8', 'Moreno:ST:81:7', 'Conde:GK:80:13', 'Costa:CB:80:5', 'Comesaña:CM:80:14', 'Barry:ST:80:15', 'Pépé:ST:80:19', 'Bailly:CB:80:4', 'Pedraza:LB:80:24', 'Gueye:CM:80:18', 'Femenía:RB:79:17', 'Suárez:CAM:79:6', 'Cardona:LB:78:2', 'Akhomach:RM:78:11', 'Terrats:CDM:77:22', 'Bernat:LM:77:12', 'Álvarez:GK:75:1', 'Cabanes:ST:74:26'],
            'val' => ['Mamardashvili:GK:85:25', 'Gayà:LB:83:14', 'Mosquera:CB:81:3', 'Pepelu:CM:81:18', 'Guerra:CM:80:8', 'Rioja:LM:80:22', 'Duro:ST:80:9', 'Correia:RB:79:20', 'López:RM:79:16', 'Almeida:ST:79:10', 'Tárrega:CB:78:15', 'Dimitrievski:GK:78:1', 'Guillamón:CDM:78:6', 'Gómez:ST:78:17', 'Mir:ST:78:11', 'Foulquier:RB:77:21', 'Vázquez:LB:77:2', 'Canós:RM:77:7', 'Gasiorowski:CB:76:24', 'Vallejo:LM:76:11', 'Pérez:CM:75:5', 'Tejón:CAM:74:23'],
            'osa' => ['Budimir:ST:82:17', 'Oroz:CAM:81:10', 'Herrera:GK:80:1', 'Catena:CB:80:24', 'Torró:CDM:80:24', 'Moncayola:CM:80:7', 'Zaragoza:LW:80:19', 'Areso:RB:79:12', 'Rubén:RW:79:14', 'Gómez:CAM:79:11', 'García:ST:79:9', 'Boyomo:CB:78:22', 'Bretones:LB:78:23', 'Vidal:RB:78:2', 'Cruz:CB:78:3', 'Muñoz:CDM:78:6', 'Peña:RW:78:20', 'Raúl:ST:78:21', 'Peña:LB:77:15', 'Ibáñez:CM:77:16', 'Arnaiz:LW:77:20', 'Fernández:GK:76:13'],
            'get' => ['Soria:GK:82:13', 'Mayoral:ST:81:19', 'Djené:CB:80:2', 'Arambarri:CM:80:8', 'Milla:CM:80:5', 'Alderete:CB:79:15', 'Aleñá:CAM:79:11', 'Iglesias:RB:78:21', 'Rico:LB:78:16', 'Pérez:LM:78:18', 'Domingos:CB:78:4', 'Sola:RM:77:11', 'Uche:ST:77:6', 'Peter:RM:76:17', 'Yildirim:ST:76:9', 'Nyom:RB:75:22', 'Angileri:LB:76:3', 'Rodríguez:LM:75:23', 'Santiago:CM:75:14', 'Letacek:GK:74:1', 'Aberdin:CDM:74:20', 'Risco:ST:73:26'],
            'cel' => ['Aspas:ST:82:10', 'Guaita:GK:80:13', 'Mingueza:RM:80:8', 'Beltrán:CDM:80:8', 'Bamba:CAM:80:17', 'Iglesias:ST:80:7', 'Starfelt:CB:79:2', 'Tapia:CDM:79:5', 'Alonso:CB:78:3', 'Moriba:CM:78:20', 'Douvikas:ST:78:9', 'Swedberg:ST:78:19', 'Domínguez:CB:77:24', 'Aidoo:CB:78:15', 'Cervi:CAM:77:11', 'Paciência:ST:77:22', 'Sotelo:CM:77:19', 'Álvarez:LM:76:14', 'Rodríguez:RB:76:22', 'Ristić:LB:76:21', 'Dotor:CM:76:6', 'Villar:GK:75:1'],
            'sev' => ['Badé:CB:81:22', 'Lukebakio:RW:81:11', 'Nyland:GK:80:13', 'Gudelj:CDM:80:6', 'Sow:CM:80:20', 'Ejuke:LW:80:21', 'Navas:RB:80:16', 'Saúl:CM:80:17', 'Suso:CAM:80:7', 'Lokonga:CDM:79:12', 'Nianzou:CB:79:14', 'Romero:ST:79:14', 'Carmona:RB:78:16', 'Marcão:CB:78:23', 'Pedrosa:LB:78:3', 'Agoumé:CM:78:8', 'Iheanacho:ST:78:9', 'Barco:LB:77:19', 'Peque:LW:76:14', 'Kike:ST:76:4', 'Fernández:GK:75:1', 'Idumbo:RW:75:28'],
            'mal' => ['Muriqi:ST:81:7', 'Maffeo:RB:80:15', 'Raíllo:CB:80:21', 'Darder:CM:81:10', 'Rodríguez:CM:80:14', 'Valjent:CB:79:24', 'Costa:CDM:79:12', 'Greif:GK:78:13', 'Mojica:LB:78:22', 'Asano:LW:78:16', 'Prats:ST:78:9', 'Larin:ST:78:17', 'Navarro:RW:77:11', 'Copete:CB:77:6', 'Mascarell:CDM:78:5', 'Morlanes:CM:77:8', 'Radonjić:LW:77:23', 'Morey:RB:76:2', 'Lato:LB:76:3', 'Luna:CAM:75:33', 'Román:GK:74:1', 'Llabrés:RW:74:19'],
            'ray' => ['García:LW:81:18', 'Lejeune:CB:80:24', 'Valentín:CDM:80:23', 'Palazón:RW:80:7', 'López:CM:79:17', 'Camello:ST:79:14', 'De Tomás:ST:79:11', 'Rațiu:RB:78:2', 'Mumin:CB:78:16', 'Espino:LB:78:12', 'Trejo:CAM:78:8', 'De Frutos:RW:78:19', 'Batalla:GK:76:13', 'Balliu:RB:77:20', 'Ciss:CDM:78:6', 'Cárdenas:GK:78:1', 'Aridane:CB:77:5', 'Embarba:LW:77:22', 'Chavarría:LB:76:3', 'Pathé:CM:77:4', 'Nteka:CAM:76:9', 'Trejo:ST:78:8'],
            'ala' => ['Sivera:GK:80:1', 'Guevara:CM:79:6', 'Vicente:RW:79:10', 'García:ST:79:15', 'Tenaglia:RB:78:14', 'Abqar:CB:78:5', 'Blanco:CDM:78:8', 'Guridi:CAM:78:18', 'Rioja:LW:78:11', 'Sedlar:CB:77:4', 'Sánchez:LB:77:22', 'Duarte:LB:77:3', 'Benavídez:CDM:77:23', 'Villalibre:ST:77:9', 'Conechny:LW:76:17', 'Mouriño:CB:76:12', 'Hagi:CM:76:10', 'Romero:RW:76:20', 'Simeone:ST:76:20', 'Novoa:RB:75:2', 'Rebbach:CAM:75:21', 'Owono:GK:74:31'],
            'pal' => ['Moleiro:CAM:81:10', 'Cillessen:GK:80:1', 'Rodríguez:CDM:80:20', 'Mármol:CB:79:15', 'Campaña:CM:79:8', 'McBurnie:ST:79:16', 'Suárez:CB:78:4', 'Sandro:RW:78:9', 'Perrone:CAM:78:8', 'Rozada:RB:77:28', 'Muñoz:LB:77:3', 'Fuster:LW:77:14', 'Loiodice:CDM:78:12', 'Pejiño:RW:77:24', 'Ramírez:ST:77:19', 'Mata:ST:77:18', 'Curbelo:CB:76:6', 'González:CM:76:5', 'Marc:LW:76:17', 'Sinkgraven:RB:75:8', 'Herzog:LB:75:2', 'Horkaš:GK:74:13'],
            'leg' => ['Haller:ST:80:9', 'Tapia:CDM:79:6', 'Soriano:GK:78:13', 'Rosier:RB:78:2', 'Cruz:RW:78:11', 'García:LW:78:19', 'Munir:RW:78:10', 'Sergio:CB:77:5', 'Sáenz:CB:77:3', 'Hernández:LB:77:20', 'Neyou:CDM:77:17', 'Brašanac:CM:77:14', 'De la Fuente:ST:77:10', 'Dmitrović:GK:77:1', 'Cissé:CM:76:8', 'López:CAM:76:21', 'Porozo:CB:76:4', 'Franquesa:LB:76:15', 'Dani:LW:76:12', 'Altimira:RB:75:2', 'Chicco:CAM:75:24', 'Gómez:ST:75:23'],
            'val2' => ['Moro:RW:79:11', 'Hein:GK:78:13', 'Cömert:CB:78:15', 'Pérez:CM:78:4', 'Amallah:CAM:78:10', 'Pérez:RB:77:2', 'Boyomo:CB:77:6', 'Jurić:CDM:77:16', 'Ndiaye:LW:77:18', 'Latasa:ST:77:14', 'Sylla:RW:77:7', 'Machís:ST:77:11', 'Rosa:LB:76:22', 'Sánchez:CB:76:5', 'Meseguer:CDM:76:20', 'Tuhami:CAM:76:19', 'Marcos:ST:76:9', 'Sánchez:RB:75:3', 'Pérez:LB:75:22', 'Pérez:CM:75:8', 'Amath:LW:76:10', 'Ferreira:GK:74:1'],
            'esp' => ['Puado:LM:80:7', 'García:GK:79:1', 'Cabrera:CB:79:6', 'Král:CM:79:20', 'Kumbulla:CB:78:4', 'Romero:LB:78:22', 'Gragera:CM:78:15', 'Véliz:ST:78:9', 'Milla:CAM:78:11', 'El Hilali:RB:77:23', 'Tejero:RM:77:12', 'Cardona:ST:77:18', 'Aguado:CDM:78:16', 'Cheddira:ST:77:16', 'Pacheco:GK:77:13', 'Calero:CB:77:5', 'Oliván:LB:77:14', 'Lozano:CAM:77:10', 'Roca:LW:76:19', 'Gómez:RB:76:3', 'Barei:CM:75:26', 'Svensson:RW:74:24'],

            // EUROPEAN GIANTS
            'mci' => ['Haaland:ST:94:9', 'Rodri:CDM:92:16', 'De Bruyne:CAM:92:17', 'Dias:CB:89:3', 'Foden:RW:89:47', 'Ederson:GK:89:31', 'Silva:CM:88:20', 'Akanji:CB:85:25', 'Walker:RB:85:2', 'Gvardiol:LB:86:24', 'Stones:CB:86:5', 'Gundogan:CM:86:19', 'Doku:LW:84:11', 'Kovacic:CDM:84:8', 'Grealish:LW:84:10', 'Ake:LB:83:6', 'Savinho:RW:82:26', 'Nunes:CM:81:27', 'Ortega:GK:81:18', 'Lewis:RB:80:82', 'Bobb:ST:78:52', 'McAtee:CAM:75:87'],
            'liv' => ['Salah:RW:90:11', 'Alisson:GK:89:1', 'Van Dijk:CB:89:4', 'Alexander-Arnold:RB:87:66', 'Mac Allister:CM:86:10', 'Robertson:LB:86:26', 'Konate:CB:85:5', 'Diaz:LW:85:7', 'Jota:ST:85:20', 'Gravenberch:CDM:84:38', 'Szoboszlai:CAM:84:8', 'Nunez:ST:84:9', 'Chiesa:RW:83:14', 'Gakpo:LW:83:18', 'Endo:CDM:82:3', 'Jones:CM:81:17', 'Elliott:CAM:81:19', 'Kelleher:GK:80:62', 'Bradley:RB:80:84', 'Tsimikas:LB:80:21', 'Quansah:CB:79:78', 'Danns:ST:74:76'],
            'ars' => ['Saka:RW:89:7', 'Saliba:CB:88:2', 'Rice:CM:88:41', 'Odegaard:CAM:88:8', 'Gabriel:CB:86:6', 'Raya:GK:86:22', 'White:RB:85:4', 'Havertz:ST:85:29', 'Partey:CDM:84:5', 'Martinelli:LW:84:11', 'Trossard:LW:84:19', 'Jesus:ST:84:9', 'Timber:LB:83:12', 'Merino:CM:83:23', 'Jorginho:CDM:83:20', 'Sterling:RW:83:30', 'Zinchenko:LB:82:17', 'Tomiyasu:RB:81:18', 'Neto:GK:81:32', 'Kiwior:CB:80:15', 'Nketiah:ST:79:14', 'Nwaneri:CAM:75:53'],
            'avl' => ['Martinez:GK:86:1', 'Watkins:ST:85:11', 'Torres:CB:83:14', 'McGinn:CAM:83:7', 'Bailey:RM:82:31', 'Konsa:CB:82:4', 'Onana:CM:82:24', 'Tielemans:CM:82:8', 'Cash:RB:81:2', 'Rogers:LM:80:27', 'Duran:ST:80:9', 'Digne:LB:80:12', 'Carlos:CB:80:3', 'Maatsen:LB:80:22', 'Kamara:CDM:82:44', 'Buendia:CAM:80:10', 'Barkley:CM:79:6', 'Philogene:RW:78:19', 'Iling-Jr:LW:77:21', 'Olsen:GK:76:25', 'Bogarde:RB:75:22', 'Young:ST:75:18'],
            'bay' => ['Kane:ST:92:9', 'Musiala:CAM:90:42', 'Neuer:GK:88:1', 'Kimmich:CM:87:6', 'Palhinha:CDM:86:16', 'Kim:CB:85:3', 'Davies:LB:85:19', 'Muller:CAM:85:25', 'Sane:RW:85:10', 'Upamecano:CB:84:2', 'Olise:RW:84:17', 'Gnabry:LW:84:7', 'Coman:LW:84:11', 'Guerreiro:LB:83:22', 'Laimer:CM:83:27', 'Pavlovic:CDM:82:45', 'Boey:RB:81:23', 'Stanisic:RB:81:44', 'Dier:CB:81:15', 'Tel:ST:80:39', 'Ulreich:GK:77:26', 'Ibrahimovic:ST:75:31'],
            'dor' => ['Kobel:GK:86:1', 'Brandt:CAM:84:10', 'Schlotterbeck:CB:84:4', 'Guirassy:ST:84:9', 'Can:CDM:82:23', 'Sabitzer:CM:82:20', 'Anton:CB:82:3', 'Malen:RW:82:21', 'Ryerson:RB:81:26', 'Gross:CM:81:13', 'Adeyemi:LW:81:27', 'Gittens:LW:80:43', 'Bensebaini:LB:80:5', 'Nmecha:CDM:80:8', 'Couto:RB:80:2', 'Sule:CB:82:25', 'Beier:ST:80:14', 'Haller:ST:79:9', 'Reyna:CAM:78:7', 'Meyer:GK:76:33', 'Wätjen:CAM:75:38', 'Kabar:LB:74:37'],
            'rbl' => ['Simons:RM:85:10', 'Openda:ST:84:11', 'Orban:CB:83:4', 'Gulacsi:GK:82:1', 'Lukeba:CB:82:23', 'Raum:LB:82:22', 'Sesko:ST:82:30', 'Geertruida:RB:81:3', 'Haidara:CM:81:8', 'Henrichs:RB:81:39', 'Kampl:CM:80:44', 'Baumgartner:CAM:80:14', 'Seiwald:CM:79:13', 'Nusa:LM:79:7', 'Elmas:LB:79:6', 'Vermeeren:CDM:78:18', 'Poulsen:ST:78:9', 'Silva:ST:78:19', 'Vandevoordt:GK:76:26', 'Bitshiabu:CB:76:5', 'Ouedraogo:CM:74:17', 'Gebel:ST:72:41'],
            'lev' => ['Wirtz:CAM:89:10', 'Grimaldo:LM:86:20', 'Xhaka:CDM:86:34', 'Frimpong:RM:85:30', 'Tah:CB:85:4', 'Tapsoba:CB:84:12', 'Boniface:ST:84:22', 'Hradecky:GK:83:1', 'Andrich:CM:83:8', 'Hincapie:CB:83:3', 'Hofmann:ST:83:7', 'Palacios:CDM:83:25', 'Schick:ST:82:14', 'Garcia:CM:81:24', 'Terrier:CAM:81:11', 'Adli:CAM:81:21', 'Tella:CAM:79:19', 'Mukiele:CB:78:23', 'Kovar:GK:77:17', 'Arthur:RWB:76:13', 'Belocian:CB:76:44', 'Deli:ST:74:28'],
            'stu' => ['Undav:ST:83:26', 'Mittelstadt:LB:81:7', 'Stiller:CM:81:6', 'Fuhrich:LM:81:27', 'Nubel:GK:81:33', 'Chabot:CB:80:24', 'Karazor:CM:80:16', 'Millot:ST:80:8', 'Demirovic:ST:80:9', 'Vagnoman:RB:79:4', 'Rouault:CB:79:29', 'Leweling:RM:79:18', 'Zagadou:CB:79:23', 'Toure:ST:79:10', 'Rieder:CM:78:32', 'Stenzel:RB:76:15', 'Keitel:CDM:76:5', 'Bredlow:GK:75:1', 'Hendriks:LB:75:3', 'Faghir:CAM:75:11', 'Raimund:RW:74:19', 'Diehl:ST:74:20'],
            'int' => ['Martinez:ST:88:10', 'Barella:CM:87:23', 'Bastoni:CB:86:95', 'Calhanoglu:CDM:86:20', 'Dimarco:LM:85:32', 'Sommer:GK:85:1', 'Thuram:ST:85:9', 'Pavard:CB:84:28', 'Acerbi:CB:84:15', 'Mkhitaryan:CM:83:22', 'Zielinski:CM:83:7', 'De Vrij:CB:82:6', 'Dumfries:RWB:82:2', 'Frattesi:CM:82:16', 'Darmian:RM:81:36', 'Augusto:LWB:80:30', 'Arnautovic:ST:79:8', 'Taremi:ST:83:99', 'Bisseck:CB:79:31', 'Asllani:CDM:78:21', 'Buchanan:LW:78:17', 'Martinez:GK:76:13'],
            'mil' => ['Maignan:GK:87:16', 'Leao:LW:86:10', 'Hernandez:LB:86:19', 'Pulisic:CAM:84:11', 'Tomori:CB:84:23', 'Morata:ST:83:7', 'Fofana:CDM:82:29', 'Reijnders:CM:82:14', 'Bennacer:CDM:82:4', 'Calabria:RB:81:2', 'Chukwueze:RW:81:21', 'Loftus-Cheek:CM:81:8', 'Abraham:ST:81:90', 'Pavlovic:CB:80:31', 'Emerson:RB:80:22', 'Okafor:RW:80:17', 'Thiaw:CB:80:28', 'Musah:CAM:79:80', 'Saelemaekers:LW:79:56', 'Jovic:ST:79:9', 'Sportiello:GK:77:57', 'Terracciano:LB:75:42'],
            'juv' => ['Bremer:CB:86:3', 'Koopmeiners:CAM:85:8', 'Vlahovic:ST:85:9', 'Luiz:CM:83:26', 'Di Gregorio:GK:82:29', 'Cambiaso:RB:82:27', 'Locatelli:CDM:82:5', 'Gonzalez:RW:82:11', 'Danilo:CB:82:6', 'Gatti:CB:81:4', 'Yildiz:LW:81:10', 'Thuram:CM:81:19', 'Conceicao:LW:81:7', 'Kalulu:RB:80:15', 'Fagioli:CDM:80:21', 'McKennie:CAM:80:16', 'Milik:ST:80:14', 'Cabal:LB:79:32', 'Weah:RW:79:22', 'Perin:GK:79:1', 'Savona:LB:76:37', 'Mbangula:ST:75:51'],
            'ata' => ['Lookman:ST:84:11', 'Ederson:CM:83:13', 'Retegui:ST:82:32', 'Scamacca:ST:82:9', 'De Ketelaere:ST:82:17', 'Carnesecchi:GK:81:29', 'Bellanova:RM:81:16', 'De Roon:CDM:81:15', 'Pasalic:CM:81:8', 'Ruggeri:LM:80:22', 'Samardzic:CM:80:24', 'Djimsiti:CB:80:19', 'Hien:CB:80:4', 'Kossounou:CB:80:3', 'Zappacosta:RWB:80:77', 'Toloi:CB:79:2', 'Patricio:GK:79:28', 'Zaniolo:RW:79:10', 'Brescianini:CAM:78:44', 'Cuadrado:ST:78:7'],
            'bol' => ['Orsolini:RW:81:7', 'Skorupski:GK:80:28', 'Posch:RB:80:3', 'Lucumi:CB:80:26', 'Freuler:CDM:80:8', 'Ndoye:LW:79:11', 'Beukema:CB:79:31', 'Aebischer:CM:79:20', 'Castro:ST:79:9', 'Fabbian:CAM:78:80', 'Miranda:LB:78:33', 'Casale:CB:78:15', 'Karlsson:RW:78:10', 'Dallinga:ST:78:24', 'Holm:RB:77:2', 'Moro:CDM:77:6', 'Pobega:CM:77:32', 'Iling-Junior:LW:77:14', 'Odgaard:ST:77:19'],
            'psg' => ['Donnarumma:GK:88:99', 'Marquinhos:CB:87:5', 'Hakimi:RB:86:2', 'Vitinha:CM:86:17', 'Dembele:RW:86:10', 'Mendes:LB:85:25', 'Barcola:LW:85:29', 'Neves:CDM:84:87', 'Ramos:ST:84:9', 'Skriniar:CB:84:37', 'Zaire-Emery:CM:83:33', 'Fabian:CDM:83:8', 'Ruiz:CM:83:8', 'Kolo Muani:ST:83:23', 'Asensio:LW:83:11', 'Pacho:CB:82:51', 'Lee:RW:81:19', 'Beraldo:LB:80:35', 'Doue:CAM:80:14', 'Safonov:GK:80:39', 'Zague:RB:75:42', 'Mbaye:ST:75:49'],
            'mon' => ['Golovin:ST:82:10', 'Zakaria:CM:81:6', 'Singo:RB:80:17', 'Kehrer:CB:80:5', 'Camara:CM:80:15', 'Embolo:ST:80:36', 'Minamino:CAM:80:18', 'Akliouche:RM:79:21', 'Salisu:CB:79:22', 'Balogun:LW:79:9', 'Diatta:RW:78:27', 'Ben Seghir:LM:78:7', 'Jakobs:LB:78:14', 'Kohn:GK:78:1', 'Teze:RB:77:4', 'Magassa:CM:77:88', 'Matazo:CDM:76:8', 'Ilenikhena:ST:76:21', 'Majecki:GK:76:1', 'Ouattara:LB:76:20', 'Mawissa:CB:75:13', 'Michelin:ST:74:2'],
            'bre' => ['Del Castillo:RW:80:10', 'Lees-Melou:CDM:80:20', 'Bizot:GK:79:40', 'Chardonnet:CB:79:5', 'Lala:RB:78:27', 'Faivre:LW:78:21', 'Ajorque:ST:78:19', 'Camara:CM:78:45', 'Magnetti:CM:77:8', 'Coulibaly:CB:77:3', 'Sima:RW:77:17', 'Martin:CDM:77:28', 'Doumbia:CM:77:26', 'Ndiaye:CB:76:44', 'Amavi:LB:76:12', 'Haidara:LB:76:23', 'Pereira:CAM:76:29', 'Baldé:ST:76:11', 'Salah:LW:75:34', 'Zogbe:RB:74:22', 'Camblan:ST:74:14', 'Coudert:GK:73:30'],
            'lil' => ['David:ST:84:9', 'Chevalier:GK:82:30', 'Zhegrova:RW:82:23', 'Andre:CDM:81:21', 'Gomes:CM:81:8', 'Diakite:CB:80:18', 'Cabella:CAM:79:10', 'Alexsandro:CB:79:4', 'Sahraoui:LW:78:11', 'Gudmundsson:LB:78:5', 'Meunier:RB:78:12', 'Ismaily:LB:78:31', 'Umtiti:CB:78:14', 'Bayo:ST:77:27', 'Tiago:RB:77:22', 'Fernandez:CAM:76:29', 'Bakker:RW:76:20', 'Bouaddi:CDM:75:32', 'Mukau:CM:75:17', 'Ilic:LW:75:19', 'Mannone:GK:74:1', 'Mbappe:ST:74:33'],
            'psv' => ['Veerman:CM:82:23', 'Bakayoko:RW:82:11', 'De Jong:ST:82:9', 'Schouten:CDM:81:22', 'Lozano:CM:80:27', 'Benitez:GK:80:1', 'Boscagli:CB:80:18', 'Lang:LW:80:10', 'Tillman:CM:80:7', 'Karsdorp:RB:79:2', 'Saibari:CDM:79:34', 'Pepi:RW:78:14', 'Obispo:LB:77:4', 'Flamingo:CB:77:6', 'Babadi:CAM:76:26', 'Dams:LB:76:39', 'Driouech:LW:76:21', 'Nagalo:CB:76:3', 'Oppegard:RB:75:35', 'Drommel:GK:74:16', 'Land:ST:74:37', 'Bresser:ST:73:38'],
            'fey' => ['Hancko:CB:82:33', 'Gimenez:ST:82:29', 'Timber:CDM:81:8', 'Paixao:RW:80:14', 'Stengs:CAM:80:10', 'Bijlow:GK:79:1', 'Hwang:CM:79:4', 'Ivanusec:LW:79:17', 'Trauner:CB:79:18', 'Wellenreuther:GK:78:22', 'Milambo:CM:78:27', 'Bueno:LB:78:15', 'Zerrouki:CDM:78:6', 'Beelen:CB:78:3', 'Smal:LB:77:5', 'Lotomba:RB:77:30', 'Ueda:ST:77:9'],
            'spo' => ['Gyokeres:ST:86:9', 'Pote:LW:83:8', 'Inacio:CB:83:25', 'Hjulmand:CDM:82:42', 'Trincao:ST:82:17', 'Diomande:CB:82:26', 'Edwards:CM:80:10', 'Morita:CM:80:5', 'Braganca:CM:79:23', 'Debast:CB:79:6', 'Santos:LM:79:11', 'Quenda:RM:78:57', 'Israel:GK:78:1', 'Reis:CB:78:2', 'Harder:CAM:77:19', 'Fresneda:RB:77:22', 'Kovacevic:GK:77:13', 'Quaresma:LB:77:3', 'Araujo:RW:76:20', 'Essugo:CDM:76:14', 'Ribeiro:ST:75:50', 'Nel:ST:74:44'],
            'ben' => ['Di Maria:RW:83:11', 'Otamendi:CB:81:30', 'Kokcu:CAM:82:10', 'Aursnes:CM:81:8', 'Pavlidis:ST:81:14', 'Trubin:GK:81:1', 'Akturkoglu:LW:81:17', 'Florentino:CDM:81:61', 'Bah:RB:80:6', 'Silva:CB:83:4', 'Sanches:CAM:79:85', 'Amoura:RW:79:9', 'Cabral:ST:79:9', 'Araujo:CB:79:44', 'Barreiro:CDM:79:18', 'Carreras:LB:79:3', 'Kabore:RB:78:28', 'Beste:LB:78:37', 'Rollheiser:CM:78:32', 'Schjelderup:LW:77:21', 'Prestianni:ST:76:25', 'Gomes:GK:75:24'],
            'bru' => ['Vanaken:CAM:80:20', 'Skov Olsen:RW:80:7', 'Mignolet:GK:78:22', 'Tzolis:LW:78:8', 'De Cuyper:LB:78:55', 'Onyedika:CDM:78:15', 'Nilsson:ST:77:19', 'Mechele:CB:77:44', 'Vetlesen:CDM:77:10', 'Jashari:CM:76:30', 'Zinckernagel:ST:76:77', 'Skoras:RW:76:21', 'Nielsen:CM:76:27', 'Jutgla:LW:77:9', 'Ordonez:CB:76:4', 'Seys:RB:75:64', 'Talbi:CAM:75:68', 'Spileers:CB:75:58', 'Sabbe:RB:74:65', 'Romero:LB:74:28', 'Vermant:ST:74:17', 'Jackers:GK:72:29'],
            'cel_sco' => ['Kyogo:ST:79:8', 'McGregor:CDM:79:42', 'Schmeichel:GK:78:1', 'Hatate:CM:78:41', 'Carter-Vickers:CB:78:20', 'Johnston:RB:78:2', 'Engels:CM:77:27', 'Kuhn:RW:77:10', 'Maeda:LW:77:38', 'Scales:CB:76:5', 'Taylor:LB:76:3', 'Palma:RW:76:7', 'Bernardo:CDM:76:28', 'Forrest:CAM:75:49', 'Trusty:CB:75:4', 'Idah:ST:75:9', 'Valle:LB:75:11', 'Ralston:RB:74:56', 'Yang:LW:74:13', 'McCarthy:CM:74:16', 'Sinisalo:GK:73:12', 'Turley:ST:70:44'],
            'sha' => ['Sudakov:CAM:80:10', 'Matviyenko:CB:79:22', 'Stepanenko:CDM:78:6', 'Zubkov:RW:78:11', 'Sikan:ST:77:14', 'Kryskiv:CM:77:21', 'Bondar:CB:77:5', 'Bondarenko:CDM:77:21', 'Riznyk:GK:76:31', 'Konoplia:RB:76:26', 'Kevin:LW:76:37', 'Azarovi:LB:76:13', 'Marlon:CM:76:8', 'Pedrinho:CAM:76:38', 'Traore:ST:76:2', 'Tobias:RB:75:18', 'Franjic:CB:75:16', 'Gocholeishvili:LB:75:13', 'Eguinaldo:RW:75:7', 'Gomes:LW:74:39', 'Newertton:ST:73:9', 'Fesyun:GK:72:12'],
            'sal' => ['Gloukh:CM:79:30', 'Dedic:RB:78:70', 'Blaswich:GK:77:1', 'Konate:ST:77:19', 'Gourna-Douath:CDM:77:27', 'Piatkowski:CB:76:4', 'Kjaergaard:CM:76:14', 'Terzic:LB:76:3', 'Nene:RW:76:11', 'Capaldo:CM:76:7', 'Fernando:ST:76:11', 'Daghim:LW:75:19', 'Schlager:GK:75:24', 'Baidoo:CB:75:6', 'Bidstrup:CAM:75:18', 'Clark:RW:75:10', 'Ratkov:LW:75:21', 'Diambou:CDM:74:15', 'Morgalla:RB:74:39', 'Blank:CB:74:5', 'Guindo:LB:74:29', 'Yeo:ST:73:28'],
            'you' => ['Ugrinic:CM:77:7', 'Monteiro:RW:76:77', 'Von Ballmoos:GK:76:26', 'Camara:CB:76:4', 'Elia:RW:76:15', 'Lauper:CDM:75:30', 'Imeri:CAM:75:10', 'Ganvoula:ST:75:35', 'Niasse:CDM:75:20', 'Colley:LW:75:11', 'Itten:LW:75:9', 'Athekame:RB:74:24', 'Zoukrou:CB:74:5', 'Males:CAM:74:39', 'Hadjjam:LB:74:3', 'Blum:RB:74:27', 'Virginius:ST:74:21', 'Crnovrsanin:CB:73:22', 'Conté:LB:73:2', 'Lakomy:ST:73:8', 'Chaiwa:CM:72:14', 'Keller:GK:72:40'],
            'zag' => ['Baturina:CAM:79:10', 'Petkovic:ST:78:9', 'Misic:CDM:77:27', 'Ristovski:RB:76:13', 'Sucic:CM:76:25', 'Theophile-Catherine:CB:76:28', 'Pjaca:LW:76:20', 'Kulenovic:ST:76:17', 'Ademi:CDM:76:5', 'Nevistic:GK:75:33', 'Bernauer:CB:75:4', 'Cordoba:RW:75:19', 'Pierre-Gabriel:LB:75:18', 'Rog:CAM:75:30', 'Spikic:RW:75:77', 'Kacavenda:CM:74:21', 'Stojkovic:LW:74:20', 'Mmaee:RB:74:3', 'Torrente:CB:74:2', 'Ogiwara:LB:74:3', 'Hoxha:ST:74:11', 'Zagorac:GK:72:1'],
            'crv' => ['Krunic:CM:78:6', 'Ivanic:CDM:77:4', 'Ndiaye:ST:77:9', 'Glazer:GK:76:18', 'Hwang:CM:76:8', 'Spajic:CB:76:5', 'Elšnik:CDM:76:21', 'Mvumpa:RW:76:14', 'Olayinka:LW:76:14', 'Duarte:ST:76:17', 'Seol:RB:75:66', 'Ilić:CAM:75:32', 'Drkusic:CB:75:33', 'Djiga:CB:75:24', 'Rodic:LB:75:23', 'Milson:CAM:75:10', 'Katai:LW:75:10', 'Maksimovic:RW:74:55', 'Mimovic:RB:73:2', 'Lekovic:LB:73:3', 'Sremcevic:ST:72:19', 'Ilić:GK:72:1'],
            'spa' => ['Haraslin:ST:78:22', 'Birmancevic:LW:78:14', 'Preciado:CM:77:17', 'Vitik:CB:77:41', 'Kairinen:CDM:76:6', 'Panak:CB:76:27', 'Olatunji:ST:76:7', 'Laci:CM:76:20', 'Kuchta:ST:76:9', 'Sadilek:CM:76:18', 'Rrahmani:LW:76:10', 'Vindahl:GK:75:1', 'Wiesner:RM:75:28', 'Zeleny:LM:75:30', 'Krasniqi:RW:75:10', 'Ross:CB:74:2', 'Pavelka:CDM:74:8', 'Danek:CAM:74:13', 'Tuci:ST:74:11', 'Mejdr:RB:73:18', 'Suchomel:LB:73:11', 'Jensen:GK:72:24'],
            'fer' => ['Varga:ST:77:19', 'Dibusz:GK:76:90', 'Abu Fani:CAM:76:15', 'Saldanha:ST:76:9', 'Traore:LW:76:20', 'Zachariassen:RW:75:16', 'Cisse:CB:75:27', 'Kady:RW:75:11', 'Pesic:ST:75:72', 'Maiga:CM:74:15', 'Makreckis:RB:74:22', 'Ramirez:LB:74:99', 'Rommens:CDM:74:8', 'Besic:CM:74:7', 'Gustavo:CB:74:3', 'Kehinde:LW:74:17', 'Botka:LB:73:21', 'Toth:CAM:72:10', 'Toth:RB:72:21', 'Szabo:CB:72:34', 'Papp:CDM:72:5', 'Varga:GK:71:29'],
            'stg' => ['Kiteishvili:ST:76:10', 'Gazibegovic:RB:75:22', 'Biereth:ST:75:18', 'Horvat:CM:75:19', 'Stankovic:CM:75:14', 'Scherpen:GK:74:1', 'Aiwu:CB:74:4', 'Bøving:RM:74:15', 'Johnston:LB:74:2', 'Jatta:LM:74:20', 'Sarkaria:ST:74:11', 'Lavalée:CB:73:5', 'Schnegg:LB:73:28', 'Wlodarczyk:ST:73:9', 'Chukwuani:CDM:73:8', 'Yardımcı:RW:73:9', 'Zvonarek:CM:73:21', 'Geyrhofer:RB:72:35', 'Malić:CB:72:24', 'Camara:CAM:72:11', 'Grgić:LW:72:17', 'Khudyakov:GK:71:31'],
        ];

        $formationRequirements = [
            '4-3-3' => ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'LW', 'ST'],
            '4-2-3-1' => ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'],
            '4-4-2' => ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
            '3-5-2' => ['GK', 'CB', 'CB', 'CB', 'RM', 'CDM', 'CM', 'CM', 'LM', 'ST', 'ST'],
        ];

        $positionFallbacks = [
            'CB' => ['CDM', 'RB', 'LB'],
            'LB' => ['LWB', 'CB'],
            'RB' => ['RWB', 'CB'],
            'CDM' => ['CM', 'CB'],
            'CM' => ['CDM', 'CAM', 'RM', 'LM'],
            'CAM' => ['CM', 'RW', 'LW', 'ST'],
            'RM' => ['RW', 'CM', 'RWB'],
            'LM' => ['LW', 'CM', 'LWB'],
            'RW' => ['RM', 'ST', 'CAM'],
            'LW' => ['LM', 'ST', 'CAM'],
            'ST' => ['CF', 'RW', 'LW', 'CAM']
        ];

        foreach ($teams as $team) {
            $initialStats = json_encode(['played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0, 'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0, 'form' => []]);
            $uclStats = $team['isUCL'] ? json_encode(['played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0, 'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0, 'rank' => 0]) : null;

            DB::table('teams')->insert(array_merge($team, ['stats' => $initialStats, 'uclStats' => $uclStats, 'created_at' => $now, 'updated_at' => $now]));

            $teamPlayers = [];
            if (isset($realPlayers[$team['id']])) {
                foreach ($realPlayers[$team['id']] as $idx => $pString) {
                    $parts = explode(':', $pString);
                    $teamPlayers[] = [
                        'id' => Str::orderedUuid(),
                        'team_id' => $team['id'],
                        'name' => $parts[0],
                        'position' => $parts[1] ?? 'RES',
                        'rating' => isset($parts[2]) ? (int)$parts[2] : 75,
                        'number' => isset($parts[3]) ? (int)$parts[3] : ($idx + 1),
                        'offField' => true // Everyone is offField initially
                    ];
                }
            }

            // AUTO-PICKER -> Assign offField = false for best 11
            $reqs = $formationRequirements[$team['formation']] ?? $formationRequirements['4-3-3'];
            $selectedIds = [];
            $availablePlayers = collect($teamPlayers)->sortByDesc('rating');

            foreach ($reqs as $reqPos) {
                $bestMatch = $availablePlayers->first(function($p) use ($reqPos, $selectedIds) {
                    return $p['position'] === $reqPos && !in_array($p['id'], $selectedIds);
                });

                if (!$bestMatch && isset($positionFallbacks[$reqPos])) {
                    foreach ($positionFallbacks[$reqPos] as $fallbackPos) {
                        $bestMatch = $availablePlayers->first(function($p) use ($fallbackPos, $selectedIds) {
                            return $p['position'] === $fallbackPos && !in_array($p['id'], $selectedIds);
                        });
                        if ($bestMatch) break;
                    }
                }

                if (!$bestMatch) {
                    $bestMatch = $availablePlayers->first(function($p) use ($reqPos, $selectedIds) {
                        if (in_array($p['id'], $selectedIds)) return false;
                        $isGK = ($p['position'] === 'GK');
                        $needsGK = ($reqPos === 'GK');
                        return $isGK === $needsGK;
                    });
                }

                if ($bestMatch) {
                    $selectedIds[] = $bestMatch['id'];
                    foreach ($teamPlayers as &$tp) {
                        if ($tp['id'] === $bestMatch['id']) {
                            $tp['offField'] = false;
                            break;
                        }
                    }
                    unset($tp);
                }
            }

            foreach ($teamPlayers as $tp) {
                DB::table('players')->insert([
                    'id' => $tp['id'],
                    'team_id' => $tp['team_id'],
                    'name' => $tp['name'],
                    'number' => $tp['number'],
                    'position' => $tp['position'],
                    'rating' => $tp['rating'],
                    'offField' => $tp['offField'],
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
            }
        }
    }
}