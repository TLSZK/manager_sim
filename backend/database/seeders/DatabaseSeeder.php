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
            ['id' => 'rma', 'name' => 'Real Madrid', 'shortName' => 'RMA', 'strength' => 95, 'primaryColor' => '#ffffff', 'secondaryColor' => '#1e3a8a', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png', 'tier' => 1],
            ['id' => 'atm', 'name' => 'Atlético Madrid', 'shortName' => 'ATM', 'strength' => 89, 'primaryColor' => '#cb3524', 'secondaryColor' => '#171796', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png', 'tier' => 1],
            ['id' => 'gir', 'name' => 'Girona', 'shortName' => 'GIR', 'strength' => 82, 'primaryColor' => '#ef3340', 'secondaryColor' => '#ffffff', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png', 'tier' => 1],
            ['id' => 'ath', 'name' => 'Athletic Club', 'shortName' => 'ATH', 'strength' => 84, 'primaryColor' => '#e30613', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png', 'tier' => 1],
            ['id' => 'rso', 'name' => 'Real Sociedad', 'shortName' => 'RSO', 'strength' => 83, 'primaryColor' => '#0066b2', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png', 'tier' => 1],
            ['id' => 'bet', 'name' => 'Real Betis', 'shortName' => 'BET', 'strength' => 81, 'primaryColor' => '#0bb363', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png', 'tier' => 1],
            ['id' => 'vil', 'name' => 'Villarreal', 'shortName' => 'VIL', 'strength' => 82, 'primaryColor' => '#fbe10f', 'secondaryColor' => '#00519e', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png', 'tier' => 1],
            ['id' => 'val', 'name' => 'Valencia', 'shortName' => 'VAL', 'strength' => 76, 'primaryColor' => '#ffffff', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png', 'tier' => 1],
            ['id' => 'osa', 'name' => 'Osasuna', 'shortName' => 'OSA', 'strength' => 78, 'primaryColor' => '#da291c', 'secondaryColor' => '#0a1d56', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png', 'tier' => 1],
            ['id' => 'get', 'name' => 'Getafe', 'shortName' => 'GET', 'strength' => 75, 'primaryColor' => '#005999', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png', 'tier' => 1],
            ['id' => 'cel', 'name' => 'Celta Vigo', 'shortName' => 'CEL', 'strength' => 77, 'primaryColor' => '#8ac3ee', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png', 'tier' => 1],
            ['id' => 'sev', 'name' => 'Sevilla', 'shortName' => 'SEV', 'strength' => 78, 'primaryColor' => '#ffffff', 'secondaryColor' => '#d4001f', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png', 'tier' => 1],
            ['id' => 'mal', 'name' => 'Mallorca', 'shortName' => 'MAL', 'strength' => 76, 'primaryColor' => '#e20613', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png', 'tier' => 1],
            ['id' => 'ray', 'name' => 'Rayo Vallecano', 'shortName' => 'RAY', 'strength' => 75, 'primaryColor' => '#ffffff', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png', 'tier' => 1],
            ['id' => 'ala', 'name' => 'Alavés', 'shortName' => 'ALA', 'strength' => 74, 'primaryColor' => '#0057a6', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png', 'tier' => 1],
            ['id' => 'pal', 'name' => 'Las Palmas', 'shortName' => 'PAL', 'strength' => 72, 'primaryColor' => '#ffc400', 'secondaryColor' => '#00539f', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png', 'tier' => 1],
            ['id' => 'leg', 'name' => 'Leganés', 'shortName' => 'LEG', 'strength' => 71, 'primaryColor' => '#0055a4', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png', 'tier' => 1],
            ['id' => 'val2', 'name' => 'Valladolid', 'shortName' => 'VLD', 'strength' => 70, 'primaryColor' => '#5c2d7f', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png', 'tier' => 1],
            ['id' => 'esp', 'name' => 'Espanyol', 'shortName' => 'ESP', 'strength' => 71, 'primaryColor' => '#338ecc', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png', 'tier' => 1],

            // EUROPEAN GIANTS
            ['id' => 'mci', 'name' => 'Manchester City', 'shortName' => 'MCI', 'strength' => 95, 'primaryColor' => '#6CABDD', 'secondaryColor' => '#1C2C5B', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png', 'tier' => 2],
            ['id' => 'liv', 'name' => 'Liverpool', 'shortName' => 'LIV', 'strength' => 94, 'primaryColor' => '#C8102E', 'secondaryColor' => '#00B2A9', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png', 'tier' => 2],
            ['id' => 'ars', 'name' => 'Arsenal', 'shortName' => 'ARS', 'strength' => 93, 'primaryColor' => '#EF0107', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png', 'tier' => 2],
            ['id' => 'avl', 'name' => 'Aston Villa', 'shortName' => 'AVL', 'strength' => 86, 'primaryColor' => '#95BBE5', 'secondaryColor' => '#670E36', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png', 'tier' => 2],
            ['id' => 'bay', 'name' => 'Bayern Munich', 'shortName' => 'BAY', 'strength' => 94, 'primaryColor' => '#DC052D', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 'tier' => 2],
            ['id' => 'dor', 'name' => 'Dortmund', 'shortName' => 'BVB', 'strength' => 87, 'primaryColor' => '#FDE100', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png', 'tier' => 2],
            ['id' => 'rbl', 'name' => 'Leipzig', 'shortName' => 'RBL', 'strength' => 86, 'primaryColor' => '#DD0741', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png', 'tier' => 2],
            ['id' => 'lev', 'name' => 'Leverkusen', 'shortName' => 'B04', 'strength' => 91, 'primaryColor' => '#E32221', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png', 'tier' => 2],
            ['id' => 'stu', 'name' => 'Stuttgart', 'shortName' => 'VFB', 'strength' => 83, 'primaryColor' => '#FFFFFF', 'secondaryColor' => '#E32221', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png', 'tier' => 2],
            ['id' => 'int', 'name' => 'Inter', 'shortName' => 'INT', 'strength' => 92, 'primaryColor' => '#010E80', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png', 'tier' => 2],
            ['id' => 'mil', 'name' => 'Milan', 'shortName' => 'MIL', 'strength' => 87, 'primaryColor' => '#FB090B', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png', 'tier' => 2],
            ['id' => 'juv', 'name' => 'Juventus', 'shortName' => 'JUV', 'strength' => 88, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png', 'tier' => 2],
            ['id' => 'ata', 'name' => 'Atalanta', 'shortName' => 'ATA', 'strength' => 86, 'primaryColor' => '#1E71B8', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png', 'tier' => 2],
            ['id' => 'bol', 'name' => 'Bologna', 'shortName' => 'BOL', 'strength' => 80, 'primaryColor' => '#1A2F48', 'secondaryColor' => '#A21C26', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png', 'tier' => 2],
            ['id' => 'psg', 'name' => 'Paris SG', 'shortName' => 'PSG', 'strength' => 92, 'primaryColor' => '#004170', 'secondaryColor' => '#DA291C', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png', 'tier' => 2],
            ['id' => 'mon', 'name' => 'Monaco', 'shortName' => 'MON', 'strength' => 84, 'primaryColor' => '#E51D1F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png', 'tier' => 2],
            ['id' => 'bre', 'name' => 'Brest', 'shortName' => 'SB29', 'strength' => 78, 'primaryColor' => '#DD0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png', 'tier' => 2],
            ['id' => 'lil', 'name' => 'Lille', 'shortName' => 'LOSC', 'strength' => 83, 'primaryColor' => '#E01E13', 'secondaryColor' => '#20325F', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png', 'tier' => 2],
            ['id' => 'psv', 'name' => 'PSV', 'shortName' => 'PSV', 'strength' => 82, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png', 'tier' => 2],
            ['id' => 'fey', 'name' => 'Feyenoord', 'shortName' => 'FEY', 'strength' => 81, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png', 'tier' => 2],
            ['id' => 'spo', 'name' => 'Sporting', 'shortName' => 'SCP', 'strength' => 85, 'primaryColor' => '#008000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png', 'tier' => 2],
            ['id' => 'ben', 'name' => 'Benfica', 'shortName' => 'SLB', 'strength' => 84, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png', 'tier' => 2],
            ['id' => 'bru', 'name' => 'Brugge', 'shortName' => 'CLB', 'strength' => 78, 'primaryColor' => '#000000', 'secondaryColor' => '#0067CE', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png', 'tier' => 2],
            ['id' => 'cel_sco', 'name' => 'Celtic', 'shortName' => 'CEL', 'strength' => 78, 'primaryColor' => '#018749', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png', 'tier' => 2],
            ['id' => 'sha', 'name' => 'Shakhtar', 'shortName' => 'SHK', 'strength' => 78, 'primaryColor' => '#F58220', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9728.png', 'tier' => 2],
            ['id' => 'sal', 'name' => 'Salzburg', 'shortName' => 'RBS', 'strength' => 76, 'primaryColor' => '#D11241', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10013.png', 'tier' => 2],
            ['id' => 'you', 'name' => 'Young Boys', 'shortName' => 'YB', 'strength' => 74, 'primaryColor' => '#FFD700', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10192.png', 'tier' => 2],
            ['id' => 'zag', 'name' => 'Dinamo Zagreb', 'shortName' => 'DIN', 'strength' => 75, 'primaryColor' => '#00539F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10156.png', 'tier' => 2],
            ['id' => 'crv', 'name' => 'Red Star', 'shortName' => 'RSB', 'strength' => 74, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8687.png', 'tier' => 2],
            ['id' => 'spa', 'name' => 'Sparta Prague', 'shortName' => 'SPA', 'strength' => 76, 'primaryColor' => '#A41034', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10247.png', 'tier' => 2],
            ['id' => 'fer', 'name' => 'Ferencváros', 'shortName' => 'FTC', 'strength' => 73, 'primaryColor' => '#1A8C43', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8222.png', 'tier' => 2],
            ['id' => 'stg', 'name' => 'Sturm Graz', 'shortName' => 'STU', 'strength' => 73, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10014.png', 'tier' => 2],
        ];

        // Format is Name:Position:Rating:ShirtNumber 
        $realPlayers = [
            'bar' => ['J. García:GK:89:13', 'Szczesny:GK:80:25', 'Yamal:RW:95:10', 'Lewandowski:ST:86:9', 'Raphinha:LW:92:11', 'Pedri:CM:93:8', 'De Jong:CDM:90:21', 'Araújo:CB:82:4', 'Gavi:CM:85:6', 'Olmo:CAM:83:20', 'Koundé:RB:87:23', 'Balde:LB:85:3', 'Cubarsí:CB:85:5', 'Christensen:CB:82:15', 'Fermín:CAM:85:16', 'Eric García:CB:84:24', 'Casadó:CDM:80:17', 'Ferran:RW:79:7', 'Rashford:LW:83:14', 'Bardghji:RW:77:19', 'Gerard Martín:LB:80:18', 'Cancelo:RB:83:2'],
            'rma' => ['Mbappé:ST:94:9', 'Vinícius Jr:LW:91:7', 'Bellingham:CAM:88:5', 'Courtois:GK:93:1', 'Valverde:CM:90:8', 'Rüdiger:CB:83:22', 'Carvajal:RB:84:2', 'Rodrygo:RW:85:11', 'Militao:CB:84:3', 'Tchouaméni:CDM:86:14', 'Camavinga:CM:85:6', 'Pitarch:CM:80:45', 'Mendy:LB:77:23', 'Brahim:CAM:80:21', 'Alaba:CB:78:4', 'Lunin:GK:82:13', 'Güler:RW:84:15', 'Carreras:LB:84:18', 'Ceballos:CM:80:19', 'Alexander-Arnold:RB:85:12', 'García:ST:80:16', 'Huijsen:CB:84:24'],
            'atm' => ['Griezmann:ST:85:7', 'Oblak:GK:86:13', 'Alvarez:ST:88:19', 'Cardoso:CDM:83:5', 'Giménez:CB:82:2', 'Llorente:RB:84:14', 'Le Normand:CB:84:24', 'Koke:CDM:84:6', 'Baena:LM:83:10', 'Almada:CAM:80:11', 'Lookman:LM:85:22', 'Simeone:RM:82:20', 'Hancko:CB:83:17', 'Ruggeri:LB:78:3', 'Barrios:CM:83:8', 'Pubil:CB:80:18', 'González:LW:80:23', 'Molina:RB:80:16', 'Lenglet:CB:80:15', 'Mendoza:CDM:77:4', 'Musso:GK:82:1', 'Sørloth:ST:83:22'],
            'gir' => ['Gazzaniga:GK:83:13', 'Tsygankov:RW:83:8', 'Witsel:CB:75:20', 'López:CB:81:5', 'Moreno:LB:78:24', 'Martín:CAM:76:23', 'Blind:CB:76:17', 'Gil:LW:79:21', 'Martinez:RB:81:4', 'van de Beek:CM:78:6', 'Echeverri:CAM:79:14', 'Lemar:CM:79:11', 'Ruiz:ST:78:9', 'Stuani:ST:78:7', 'Reis:CB:80:12', 'Ounahi:CM:78:18', 'Vanat:ST:77:19', 'Rincón:RB:75:2', 'Francés:CB:74:16', 'Beltrán:CM:75:8', 'Roca:LW:75:3', 'Ter stegen:GK:85:22'],
            'ath' => ['N. Williams:LW:87:10', 'Simón:GK:85:1', 'I. Williams:RW:84:9', 'Vivian:CB:84:3', 'Sancet:CAM:83:8', 'Guruzeta:ST:81:12', 'Paredes:CB:81:4', 'De Marcos:RB:80:18', 'Yuri:LB:80:17', 'Berenguer:RW:80:7', 'Yeray:CB:80:5', 'Vesga:CM:79:6', 'Herrera:CM:79:21', 'Prados:CDM:79:24', 'Ruiz:CDM:78:16', 'Agirrezabala:GK:79:13', 'Djalo:LW:78:11', 'Gómez:CAM:78:20', 'Lekue:RB:77:15', 'Boik:LB:75:14', 'Martón:ST:75:19', 'Serrano:ST:74:22'],
            'rso' => ['Soler:CM:80:18', 'Remiro:GK:85:1', 'Kubo:RW:85:14', 'Méndez:CM:84:23', 'Oyarzabal:ST:86:10', 'Zubeldia:CB:82:5', 'Martín:CB:82:31', 'Aramburu:RB:81:2', 'Muñoz:LB:76:3', 'Barrenetxea:LW:80:7', 'Caleta-Car:CB:78:16', 'Turrientes:CM:81:8', 'Zakharyan:CAM:80:21', 'Óskarsson:ST:78:9', 'Guedes:RW:77:11', 'Gómez:LB:80:17', 'Herrera:CM:78:12', 'Marín:CM:77:15', 'Sucic:CM:77:24', 'Gorrotxategi:CDM:83:4', 'Marrero:GK:75:13', 'Marín:CM:75:20'],
            'bet' => ['Lo Celso:CAM:82:20', 'Valles:GK:77:1', 'Isco:CAM:84:22', 'Fornals:CAM:80:8', 'Llorente:CB:81:3', 'Bellerín:RB:76:2', 'Natan:CB:82:4', 'Amrabat:CDM:80:14', 'Roca:CM:77:21', 'Firpo:LB:81:23', 'Abde:LW:82:10', 'Antony:RW:85:7', 'Riquelme:LW:79:17', 'Bartra:CB:81:5', 'Bakambu:ST:79:11', 'Avila:ST:79:9', 'Hernández:ST:78:19', 'Ruibal:RW:78:24', 'Fidalgo:CM:78:15', 'Gómez:CB:77:16', 'López:GK:74:25', 'Rodriguez:LB:76:12'],
            'vil' => ['Mikautadze:ST:81:9', 'Buchanan:RW:82:17', 'Parejo:CM:82:10', 'Marín:CB:81:4', 'Foyth:CB:80:8', 'Morelio:LW:84:20', 'Júniór:GK:81:1', 'Costa:CB:80:2', 'Comesaña:CM:78:14', 'Gueye:CDM:84:18', 'Pépé:ST:79:19', 'Mouriño:RB:80:15', 'Pedraza:LB:80:24', 'Kambwala:CB:76:5', 'Navarro:RB:79:6', 'Partey:CDM:77:16', 'Cardona:LB:76:23', 'Veiga:CB:81:12', 'Oluwaseyi:ST:79:21', 'Maciá:CM:76:37', 'Tenas:GK:75:25', 'Pérez:ST:78:22'],
            'val' => ['Dimitrievski:GK:76:1', 'Gayà:LB:82:14', 'Tárrega:CB:80:5', 'Pepelu:CDM:82:18', 'Guerra:CM:82:8', 'Rioja:LM:76:11', 'Duro:ST:79:9', 'Correia:RB:77:12', 'Rodríguez:CDM:78:2', 'Sadiq:ST:75:6', 'Cömert:CB:77:24', 'Riverio:GK:72:13', 'Santamaria:CM:78:22', 'Danjuma:LW:80:7', 'Beltrán:ST:76:15', 'Copete:CB:74:3', 'Vázquez:LB:74:21', 'Ramazani:LW:77:17', 'Ugrincic:CM:75:23', 'López:LM:77:16', 'Almeida:CAM:78:10', 'Núnez:CB:71:4'],
            'osa' => ['Budimir:ST:82:17', 'Oroz:CAM:80:10', 'Herrera:GK:80:1', 'Catena:CB:77:24', 'Torró:CDM:76:24', 'Moncayola:CM:80:7', 'Muñoz:LW:75:21', 'Rosier:RB:77:19', 'Rubén:RW:76:14', 'Gómez:CAM:78:11', 'García:ST:79:9', 'Boyomo:CB:81:22', 'Galán:LB:77:20', 'Osambela:RB:75:29',/*asd*/ 'Cruz:CB:78:3', 'Muñoz:CDM:78:6', 'Peña:RW:78:20', 'Raúl:ST:78:21', 'Peña:LB:77:15', 'Ibáñez:CM:77:16', 'Arnaiz:LW:77:20', 'Fernández:GK:76:13'],
            'get' => ['Soria:GK:82:13', 'Mayoral:ST:81:19', 'Djené:CB:80:2', 'Arambarri:CM:80:8', 'Milla:CM:80:5', 'Alderete:CB:80:15', 'Aleñá:CAM:79:11', 'Iglesias:RB:78:21', 'Rico:LB:78:16', 'Pérez:LM:78:18', 'Domingos:CB:78:4', 'Uche:ST:78:6', 'Sola:RM:77:11', 'Peter:RM:76:17', 'Yildirim:ST:76:9', 'Nyom:RB:75:22', 'Angileri:LB:76:3', 'Rodríguez:LM:75:23', 'Santiago:CM:75:14', 'Letacek:GK:74:1', 'Aberdin:CDM:74:20', 'Risco:ST:73:26'],
            'cel' => ['Aspas:ST:82:10', 'Guaita:GK:80:13', 'Mingueza:RM:81:8', 'Beltrán:CDM:80:8', 'Bamba:CAM:80:17', 'Iglesias:ST:80:7', 'Starfelt:CB:79:2', 'Douvikas:ST:79:9', 'Tapia:CDM:79:5', 'Alonso:CB:78:3', 'Moriba:CM:78:20', 'Swedberg:ST:78:19', 'Domínguez:CB:78:24', 'Aidoo:CB:78:15', 'Cervi:CAM:77:11', 'Paciência:ST:77:22', 'Sotelo:CM:77:19', 'Álvarez:LM:77:14', 'Rodríguez:RB:76:22', 'Ristić:LB:76:21', 'Dotor:CM:76:6', 'Villar:GK:75:1'],
            'sev' => ['Badé:CB:82:22', 'Lukebakio:RW:82:11', 'Nyland:GK:80:13', 'Gudelj:CDM:80:6', 'Sow:CM:80:20', 'Ejuke:LW:81:21', 'Navas:RB:80:16', 'Saúl:CM:80:17', 'Suso:CAM:80:7', 'Lokonga:CDM:79:12', 'Nianzou:CB:79:14', 'Romero:ST:79:14', 'Carmona:RB:78:16', 'Marcão:CB:78:23', 'Pedrosa:LB:78:3', 'Agoumé:CM:78:8', 'Iheanacho:ST:78:9', 'Barco:LB:77:19', 'Peque:LW:77:14', 'Kike:ST:76:4', 'Fernández:GK:75:1', 'Idumbo:RW:75:28'],
            'mal' => ['Muriqi:ST:81:7', 'Darder:CM:81:10', 'Maffeo:RB:80:15', 'Raíllo:CB:80:21', 'Rodríguez:CM:80:14', 'Valjent:CB:79:24', 'Costa:CDM:79:12', 'Greif:GK:79:13', 'Mojica:LB:78:22', 'Asano:LW:78:16', 'Prats:ST:78:9', 'Larin:ST:78:17', 'Navarro:RW:78:11', 'Copete:CB:77:6', 'Mascarell:CDM:78:5', 'Morlanes:CM:77:8', 'Radonjić:LW:77:23', 'Morey:RB:76:2', 'Lato:LB:76:3', 'Luna:CAM:75:33', 'Román:GK:74:1', 'Llabrés:RW:74:19'],
            'ray' => ['García:LW:81:18', 'Lejeune:CB:80:24', 'Valentín:CDM:80:23', 'Palazón:RW:80:7', 'López:CM:79:17', 'Camello:ST:80:14', 'De Tomás:ST:79:11', 'Rațiu:RB:79:2', 'Mumin:CB:78:16', 'Espino:LB:78:12', 'Trejo:CAM:78:8', 'De Frutos:RW:79:19', 'Batalla:GK:78:13', 'Balliu:RB:77:20', 'Ciss:CDM:78:6', 'Cárdenas:GK:78:1', 'Aridane:CB:77:5', 'Embarba:LW:77:22', 'Chavarría:LB:76:3', 'Pathé:CM:77:4', 'Nteka:CAM:76:9', 'Trejo:ST:78:8'],
            'ala' => ['Sivera:GK:80:1', 'Guevara:CM:79:6', 'Vicente:RW:80:10', 'García:ST:79:15', 'Tenaglia:RB:78:14', 'Abqar:CB:78:5', 'Blanco:CDM:78:8', 'Guridi:CAM:78:18', 'Rioja:LW:78:11', 'Sedlar:CB:77:4', 'Sánchez:LB:77:22', 'Duarte:LB:77:3', 'Benavídez:CDM:77:23', 'Villalibre:ST:77:9', 'Conechny:LW:76:17', 'Mouriño:CB:76:12', 'Hagi:CM:76:10', 'Romero:RW:76:20', 'Simeone:ST:76:20', 'Novoa:RB:75:2', 'Rebbach:CAM:75:21', 'Owono:GK:74:31'],
            'pal' => ['Moleiro:CAM:82:10', 'Cillessen:GK:80:1', 'Rodríguez:CDM:80:20', 'Mármol:CB:80:15', 'Campaña:CM:79:8', 'McBurnie:ST:79:16', 'Suárez:CB:78:4', 'Sandro:RW:78:9', 'Perrone:CAM:78:8', 'Rozada:RB:77:28', 'Muñoz:LB:77:3', 'Fuster:LW:77:14', 'Loiodice:CDM:78:12', 'Pejiño:RW:77:24', 'Ramírez:ST:77:19', 'Mata:ST:77:18', 'Curbelo:CB:76:6', 'González:CM:76:5', 'Marc:LW:76:17', 'Sinkgraven:RB:75:8', 'Herzog:LB:75:2', 'Horkaš:GK:74:13'],
            'leg' => ['Haller:ST:80:9', 'Tapia:CDM:79:6', 'Soriano:GK:78:13', 'Rosier:RB:78:2', 'Cruz:RW:79:11', 'García:LW:78:19', 'Munir:RW:78:10', 'Sergio:CB:77:5', 'Sáenz:CB:77:3', 'Hernández:LB:77:20', 'Neyou:CDM:78:17', 'Brašanac:CM:77:14', 'De la Fuente:ST:78:10', 'Dmitrović:GK:77:1', 'Cissé:CM:76:8', 'López:CAM:76:21', 'Porozo:CB:76:4', 'Franquesa:LB:76:15', 'Dani:LW:76:12', 'Altimira:RB:75:2', 'Chicco:CAM:75:24', 'Gómez:ST:75:23'],
            'val2' => ['Moro:RW:80:11', 'Hein:GK:79:13', 'Cömert:CB:78:15', 'Pérez:CM:78:4', 'Amallah:CAM:78:10', 'Pérez:RB:77:2', 'Boyomo:CB:78:6', 'Jurić:CDM:77:16', 'Ndiaye:LW:77:18', 'Latasa:ST:77:14', 'Sylla:RW:77:7', 'Machís:ST:77:11', 'Rosa:LB:77:22', 'Sánchez:CB:76:5', 'Meseguer:CDM:76:20', 'Tuhami:CAM:76:19', 'Marcos:ST:76:9', 'Sánchez:RB:75:3', 'Pérez:LB:75:22', 'Pérez:CM:75:8', 'Amath:LW:76:10', 'Ferreira:GK:74:1'],
            'esp' => ['Puado:LM:81:7', 'García:GK:79:1', 'Cabrera:CB:79:6', 'Král:CM:80:20', 'Kumbulla:CB:79:4', 'Romero:LB:79:22', 'Gragera:CM:78:15', 'Véliz:ST:78:9', 'Milla:CAM:78:11', 'El Hilali:RB:78:23', 'Tejero:RM:77:12', 'Cardona:ST:77:18', 'Aguado:CDM:78:16', 'Cheddira:ST:77:16', 'Pacheco:GK:77:13', 'Calero:CB:77:5', 'Oliván:LB:77:14', 'Lozano:CAM:77:10', 'Roca:LW:76:19', 'Gómez:RB:76:3', 'Barei:CM:75:26', 'Svensson:RW:74:24'],

            // EUROPEAN GIANTS
            'mci' => ['Haaland:ST:95:9', 'Rodri:CDM:93:16', 'De Bruyne:CAM:92:17', 'Dias:CB:89:3', 'Foden:RW:90:47', 'Ederson:GK:89:31', 'Silva:CM:89:20', 'Akanji:CB:86:25', 'Walker:RB:85:2', 'Gvardiol:LB:87:24', 'Stones:CB:86:5', 'Gundogan:CM:86:19', 'Doku:LW:85:11', 'Kovacic:CDM:85:8', 'Grealish:LW:84:10', 'Ake:LB:84:6', 'Savinho:RW:84:26', 'Nunes:CM:81:27', 'Ortega:GK:82:18', 'Lewis:RB:81:82', 'Bobb:ST:79:52', 'McAtee:CAM:76:87'],
            'liv' => ['Salah:RW:91:11', 'Alisson:GK:89:1', 'Van Dijk:CB:90:4', 'Alexander-Arnold:RB:88:66', 'Mac Allister:CM:87:10', 'Robertson:LB:86:26', 'Konate:CB:86:5', 'Diaz:LW:86:7', 'Jota:ST:85:20', 'Gravenberch:CDM:85:38', 'Szoboszlai:CAM:84:8', 'Nunez:ST:84:9', 'Chiesa:RW:83:14', 'Gakpo:LW:84:18', 'Endo:CDM:82:3', 'Jones:CM:82:17', 'Elliott:CAM:81:19', 'Kelleher:GK:81:62', 'Bradley:RB:81:84', 'Tsimikas:LB:80:21', 'Quansah:CB:80:78', 'Danns:ST:75:76'],
            'ars' => ['Saka:RW:90:7', 'Saliba:CB:89:2', 'Rice:CM:88:41', 'Odegaard:CAM:89:8', 'Gabriel:CB:87:6', 'Raya:GK:87:22', 'White:RB:85:4', 'Havertz:ST:86:29', 'Partey:CDM:84:5', 'Martinelli:LW:84:11', 'Trossard:LW:84:19', 'Jesus:ST:84:9', 'Timber:LB:84:12', 'Merino:CM:84:23', 'Jorginho:CDM:83:20', 'Sterling:RW:83:30', 'Zinchenko:LB:82:17', 'Tomiyasu:RB:81:18', 'Neto:GK:81:32', 'Kiwior:CB:80:15', 'Nketiah:ST:79:14', 'Nwaneri:CAM:76:53'],
            'avl' => ['Martinez:GK:87:1', 'Watkins:ST:86:11', 'Torres:CB:84:14', 'McGinn:CAM:84:7', 'Bailey:RM:83:31', 'Konsa:CB:83:4', 'Onana:CM:83:24', 'Tielemans:CM:83:8', 'Cash:RB:81:2', 'Rogers:LM:82:27', 'Duran:ST:82:9', 'Digne:LB:80:12', 'Carlos:CB:80:3', 'Maatsen:LB:80:22', 'Kamara:CDM:82:44', 'Buendia:CAM:80:10', 'Barkley:CM:79:6', 'Philogene:RW:79:19', 'Iling-Jr:LW:78:21', 'Olsen:GK:76:25', 'Bogarde:RB:75:22', 'Young:ST:75:18'],
            'bay' => ['Kane:ST:93:9', 'Musiala:CAM:91:42', 'Neuer:GK:88:1', 'Kimmich:CM:88:6', 'Palhinha:CDM:86:16', 'Kim:CB:85:3', 'Davies:LB:85:19', 'Muller:CAM:85:25', 'Sane:RW:85:10', 'Upamecano:CB:85:2', 'Olise:RW:86:17', 'Gnabry:LW:84:7', 'Coman:LW:84:11', 'Guerreiro:LB:83:22', 'Laimer:CM:83:27', 'Pavlovic:CDM:83:45', 'Boey:RB:81:23', 'Stanisic:RB:81:44', 'Dier:CB:81:15', 'Tel:ST:80:39', 'Ulreich:GK:77:26', 'Ibrahimovic:ST:76:31'],
            'dor' => ['Kobel:GK:87:1', 'Brandt:CAM:85:10', 'Schlotterbeck:CB:85:4', 'Guirassy:ST:85:9', 'Can:CDM:82:23', 'Sabitzer:CM:83:20', 'Anton:CB:83:3', 'Malen:RW:82:21', 'Ryerson:RB:82:26', 'Gross:CM:82:13', 'Adeyemi:LW:82:27', 'Gittens:LW:82:43', 'Bensebaini:LB:80:5', 'Nmecha:CDM:81:8', 'Couto:RB:81:2', 'Sule:CB:82:25', 'Beier:ST:81:14', 'Haller:ST:79:9', 'Reyna:CAM:78:7', 'Meyer:GK:76:33', 'Wätjen:CAM:75:38', 'Kabar:LB:74:37'],
            'rbl' => ['Simons:RM:86:10', 'Openda:ST:85:11', 'Orban:CB:84:4', 'Gulacsi:GK:83:1', 'Lukeba:CB:83:23', 'Raum:LB:83:22', 'Sesko:ST:83:30', 'Geertruida:RB:82:3', 'Haidara:CM:82:8', 'Henrichs:RB:81:39', 'Kampl:CM:80:44', 'Baumgartner:CAM:80:14', 'Seiwald:CM:80:13', 'Nusa:LM:80:7', 'Elmas:LB:79:6', 'Vermeeren:CDM:79:18', 'Poulsen:ST:78:9', 'Silva:ST:78:19', 'Vandevoordt:GK:77:26', 'Bitshiabu:CB:76:5', 'Ouedraogo:CM:75:17', 'Gebel:ST:72:41'],
            'lev' => ['Wirtz:CAM:90:10', 'Grimaldo:LM:87:20', 'Xhaka:CDM:87:34', 'Frimpong:RM:86:30', 'Tah:CB:86:4', 'Tapsoba:CB:85:12', 'Boniface:ST:85:22', 'Hradecky:GK:83:1', 'Andrich:CM:84:8', 'Hincapie:CB:84:3', 'Hofmann:ST:83:7', 'Palacios:CDM:83:25', 'Schick:ST:82:14', 'Garcia:CM:82:24', 'Terrier:CAM:81:11', 'Adli:CAM:81:21', 'Tella:CAM:80:19', 'Mukiele:CB:79:23', 'Kovar:GK:78:17', 'Arthur:RWB:77:13', 'Belocian:CB:77:44', 'Deli:ST:74:28'],
            'stu' => ['Undav:ST:84:26', 'Mittelstadt:LB:82:7', 'Stiller:CM:83:6', 'Fuhrich:LM:82:27', 'Nubel:GK:82:33', 'Chabot:CB:81:24', 'Karazor:CM:81:16', 'Millot:ST:82:8', 'Demirovic:ST:81:9', 'Vagnoman:RB:80:4', 'Rouault:CB:80:29', 'Leweling:RM:80:18', 'Zagadou:CB:79:23', 'Toure:ST:79:10', 'Rieder:CM:79:32', 'Stenzel:RB:76:15', 'Keitel:CDM:76:5', 'Bredlow:GK:75:1', 'Hendriks:LB:75:3', 'Faghir:CAM:75:11', 'Raimund:RW:74:19', 'Diehl:ST:74:20'],
            'int' => ['Martinez:ST:89:10', 'Barella:CM:88:23', 'Bastoni:CB:87:95', 'Calhanoglu:CDM:87:20', 'Dimarco:LM:86:32', 'Sommer:GK:86:1', 'Thuram:ST:86:9', 'Pavard:CB:85:28', 'Acerbi:CB:84:15', 'Mkhitaryan:CM:84:22', 'Zielinski:CM:84:7', 'De Vrij:CB:83:6', 'Dumfries:RWB:83:2', 'Frattesi:CM:83:16', 'Darmian:RM:81:36', 'Augusto:LWB:81:30', 'Arnautovic:ST:79:8', 'Taremi:ST:83:99', 'Bisseck:CB:80:31', 'Asllani:CDM:79:21', 'Buchanan:LW:78:17', 'Martinez:GK:76:13'],
            'mil' => ['Maignan:GK:88:16', 'Leao:LW:87:10', 'Hernandez:LB:87:19', 'Pulisic:CAM:86:11', 'Tomori:CB:85:23', 'Morata:ST:84:7', 'Fofana:CDM:83:29', 'Reijnders:CM:84:14', 'Bennacer:CDM:82:4', 'Calabria:RB:81:2', 'Chukwueze:RW:81:21', 'Loftus-Cheek:CM:82:8', 'Abraham:ST:81:90', 'Pavlovic:CB:81:31', 'Emerson:RB:80:22', 'Okafor:RW:80:17', 'Thiaw:CB:80:28', 'Musah:CAM:80:80', 'Saelemaekers:LW:79:56', 'Jovic:ST:79:9', 'Sportiello:GK:77:57', 'Terracciano:LB:76:42'],
            'juv' => ['Bremer:CB:87:3', 'Koopmeiners:CAM:86:8', 'Vlahovic:ST:86:9', 'Luiz:CM:84:26', 'Di Gregorio:GK:83:29', 'Cambiaso:RB:83:27', 'Locatelli:CDM:83:5', 'Gonzalez:RW:82:11', 'Danilo:CB:82:6', 'Gatti:CB:82:4', 'Yildiz:LW:82:10', 'Thuram:CM:82:19', 'Conceicao:LW:82:7', 'Kalulu:RB:81:15', 'Fagioli:CDM:81:21', 'McKennie:CAM:81:16', 'Milik:ST:80:14', 'Cabal:LB:80:32', 'Weah:RW:79:22', 'Perin:GK:79:1', 'Savona:LB:77:37', 'Mbangula:ST:76:51'],
            'ata' => ['Lookman:ST:85:11', 'Ederson:CM:84:13', 'Retegui:ST:83:32', 'Scamacca:ST:82:9', 'De Ketelaere:ST:83:17', 'Carnesecchi:GK:82:29', 'Bellanova:RM:82:16', 'De Roon:CDM:82:15', 'Pasalic:CM:81:8', 'Ruggeri:LM:81:22', 'Samardzic:CM:81:24', 'Djimsiti:CB:80:19', 'Hien:CB:81:4', 'Kossounou:CB:81:3', 'Zappacosta:RWB:80:77', 'Toloi:CB:79:2', 'Patricio:GK:79:28', 'Zaniolo:RW:79:10', 'Brescianini:CAM:79:44', 'Cuadrado:ST:78:7'],
            'bol' => ['Orsolini:RW:81:7', 'Skorupski:GK:80:28', 'Posch:RB:80:3', 'Lucumi:CB:80:26', 'Freuler:CDM:80:8', 'Ndoye:LW:80:11', 'Beukema:CB:80:31', 'Aebischer:CM:79:20', 'Castro:ST:80:9', 'Fabbian:CAM:79:80', 'Miranda:LB:78:33', 'Casale:CB:78:15', 'Karlsson:RW:78:10', 'Dallinga:ST:78:24', 'Holm:RB:77:2', 'Moro:CDM:77:6', 'Pobega:CM:77:32', 'Iling-Junior:LW:77:14', 'Odgaard:ST:77:19'],
            'psg' => ['Donnarumma:GK:88:99', 'Marquinhos:CB:87:5', 'Hakimi:RB:87:2', 'Vitinha:CM:87:17', 'Dembele:RW:86:10', 'Mendes:LB:85:25', 'Barcola:LW:86:29', 'Neves:CDM:85:87', 'Ramos:ST:84:9', 'Skriniar:CB:84:37', 'Zaire-Emery:CM:84:33', 'Fabian:CDM:84:8', 'Ruiz:CM:84:8', 'Kolo Muani:ST:83:23', 'Asensio:LW:83:11', 'Pacho:CB:83:51', 'Lee:RW:82:19', 'Beraldo:LB:80:35', 'Doue:CAM:81:14', 'Safonov:GK:80:39', 'Zague:RB:76:42', 'Mbaye:ST:76:49'],
            'mon' => ['Golovin:ST:82:10', 'Zakaria:CM:82:6', 'Singo:RB:81:17', 'Kehrer:CB:81:5', 'Camara:CM:80:15', 'Embolo:ST:80:36', 'Minamino:CAM:81:18', 'Akliouche:RM:80:21', 'Salisu:CB:80:22', 'Balogun:LW:79:9', 'Diatta:RW:78:27', 'Ben Seghir:LM:79:7', 'Jakobs:LB:78:14', 'Kohn:GK:78:1', 'Teze:RB:78:4', 'Magassa:CM:77:88', 'Matazo:CDM:76:8', 'Ilenikhena:ST:77:21', 'Majecki:GK:77:1', 'Ouattara:LB:76:20', 'Mawissa:CB:76:13', 'Michelin:ST:74:2'],
            'bre' => ['Del Castillo:RW:80:10', 'Lees-Melou:CDM:81:20', 'Bizot:GK:80:40', 'Chardonnet:CB:79:5', 'Lala:RB:78:27', 'Faivre:LW:78:21', 'Ajorque:ST:78:19', 'Camara:CM:78:45', 'Magnetti:CM:78:8', 'Coulibaly:CB:78:3', 'Sima:RW:78:17', 'Martin:CDM:77:28', 'Doumbia:CM:77:26', 'Ndiaye:CB:77:44', 'Amavi:LB:76:12', 'Haidara:LB:76:23', 'Pereira:CAM:76:29', 'Baldé:ST:76:11', 'Salah:LW:76:34', 'Zogbe:RB:74:22', 'Camblan:ST:74:14', 'Coudert:GK:73:30'],
            'lil' => ['David:ST:85:9', 'Chevalier:GK:83:30', 'Zhegrova:RW:83:23', 'Andre:CDM:81:21', 'Gomes:CM:82:8', 'Diakite:CB:81:18', 'Cabella:CAM:79:10', 'Alexsandro:CB:80:4', 'Sahraoui:LW:79:11', 'Gudmundsson:LB:79:5', 'Meunier:RB:78:12', 'Ismaily:LB:78:31', 'Umtiti:CB:78:14', 'Bayo:ST:77:27', 'Tiago:RB:77:22', 'Fernandez:CAM:77:29', 'Bakker:RW:76:20', 'Bouaddi:CDM:76:32', 'Mukau:CM:75:17', 'Ilic:LW:75:19', 'Mannone:GK:74:1', 'Mbappe:ST:74:33'],
            'psv' => ['Veerman:CM:83:23', 'Bakayoko:RW:83:11', 'De Jong:ST:82:9', 'Schouten:CDM:82:22', 'Lozano:CM:80:27', 'Benitez:GK:81:1', 'Boscagli:CB:81:18', 'Lang:LW:81:10', 'Tillman:CM:81:7', 'Karsdorp:RB:79:2', 'Saibari:CDM:80:34', 'Pepi:RW:79:14', 'Obispo:LB:77:4', 'Flamingo:CB:78:6', 'Babadi:CAM:77:26', 'Dams:LB:76:39', 'Driouech:LW:77:21', 'Nagalo:CB:76:3', 'Oppegard:RB:75:35', 'Drommel:GK:74:16', 'Land:ST:75:37', 'Bresser:ST:73:38'],
            'fey' => ['Hancko:CB:83:33', 'Gimenez:ST:82:29', 'Timber:CDM:82:8', 'Paixao:RW:81:14', 'Stengs:CAM:81:10', 'Bijlow:GK:80:1', 'Hwang:CM:80:4', 'Ivanusec:LW:79:17', 'Trauner:CB:79:18', 'Wellenreuther:GK:79:22', 'Milambo:CM:79:27', 'Bueno:LB:79:15', 'Zerrouki:CDM:78:6', 'Beelen:CB:78:3', 'Smal:LB:78:5', 'Lotomba:RB:77:30', 'Ueda:ST:78:9'],
            'spo' => ['Gyokeres:ST:87:9', 'Pote:LW:84:8', 'Inacio:CB:84:25', 'Hjulmand:CDM:83:42', 'Trincao:ST:83:17', 'Diomande:CB:83:26', 'Edwards:CM:81:10', 'Morita:CM:81:5', 'Braganca:CM:80:23', 'Debast:CB:80:6', 'Santos:LM:79:11', 'Quenda:RM:79:57', 'Israel:GK:78:1', 'Reis:CB:78:2', 'Harder:CAM:78:19', 'Fresneda:RB:78:22', 'Kovacevic:GK:78:13', 'Quaresma:LB:78:3', 'Araujo:RW:77:20', 'Essugo:CDM:77:14', 'Ribeiro:ST:76:50', 'Nel:ST:75:44'],
            'ben' => ['Di Maria:RW:83:11', 'Otamendi:CB:81:30', 'Kokcu:CAM:83:10', 'Aursnes:CM:82:8', 'Pavlidis:ST:81:14', 'Trubin:GK:82:1', 'Akturkoglu:LW:82:17', 'Florentino:CDM:82:61', 'Bah:RB:81:6', 'Silva:CB:83:4', 'Sanches:CAM:80:85', 'Amoura:RW:80:9', 'Cabral:ST:79:9', 'Araujo:CB:80:44', 'Barreiro:CDM:79:18', 'Carreras:LB:80:3', 'Kabore:RB:78:28', 'Beste:LB:79:37', 'Rollheiser:CM:79:32', 'Schjelderup:LW:78:21', 'Prestianni:ST:77:25', 'Gomes:GK:75:24'],
            'bru' => ['Vanaken:CAM:81:20', 'Skov Olsen:RW:81:7', 'Mignolet:GK:79:22', 'Tzolis:LW:79:8', 'De Cuyper:LB:79:55', 'Onyedika:CDM:79:15', 'Nilsson:ST:78:19', 'Mechele:CB:78:44', 'Vetlesen:CDM:78:10', 'Jashari:CM:77:30', 'Zinckernagel:ST:77:77', 'Skoras:RW:77:21', 'Nielsen:CM:77:27', 'Jutgla:LW:77:9', 'Ordonez:CB:77:4', 'Seys:RB:76:64', 'Talbi:CAM:76:68', 'Spileers:CB:76:58', 'Sabbe:RB:75:65', 'Romero:LB:75:28', 'Vermant:ST:75:17', 'Jackers:GK:73:29'],
            'cel_sco' => ['Kyogo:ST:79:8', 'McGregor:CDM:80:42', 'Schmeichel:GK:79:1', 'Hatate:CM:79:41', 'Carter-Vickers:CB:79:20', 'Johnston:RB:79:2', 'Engels:CM:78:27', 'Kuhn:RW:78:10', 'Maeda:LW:78:38', 'Scales:CB:77:5', 'Taylor:LB:77:3', 'Palma:RW:77:7', 'Bernardo:CDM:77:28', 'Forrest:CAM:76:49', 'Trusty:CB:76:4', 'Idah:ST:76:9', 'Valle:LB:76:11', 'Ralston:RB:75:56', 'Yang:LW:75:13', 'McCarthy:CM:75:16', 'Sinisalo:GK:74:12', 'Turley:ST:71:44'],
            'sha' => ['Sudakov:CAM:81:10', 'Matviyenko:CB:80:22', 'Stepanenko:CDM:78:6', 'Zubkov:RW:79:11', 'Sikan:ST:78:14', 'Kryskiv:CM:78:21', 'Bondar:CB:78:5', 'Bondarenko:CDM:78:21', 'Riznyk:GK:77:31', 'Konoplia:RB:77:26', 'Kevin:LW:77:37', 'Azarovi:LB:77:13', 'Marlon:CM:77:8', 'Pedrinho:CAM:77:38', 'Traore:ST:77:2', 'Tobias:RB:76:18', 'Franjic:CB:76:16', 'Gocholeishvili:LB:76:13', 'Eguinaldo:RW:76:7', 'Gomes:LW:75:39', 'Newertton:ST:74:9', 'Fesyun:GK:73:12'],
            'sal' => ['Gloukh:CM:80:30', 'Dedic:RB:79:70', 'Blaswich:GK:78:1', 'Konate:ST:78:19', 'Gourna-Douath:CDM:78:27', 'Piatkowski:CB:77:4', 'Kjaergaard:CM:77:14', 'Terzic:LB:77:3', 'Nene:RW:77:11', 'Capaldo:CM:77:7', 'Fernando:ST:77:11', 'Daghim:LW:76:19', 'Schlager:GK:76:24', 'Baidoo:CB:76:6', 'Bidstrup:CAM:76:18', 'Clark:RW:76:10', 'Ratkov:LW:76:21', 'Diambou:CDM:75:15', 'Morgalla:RB:75:39', 'Blank:CB:75:5', 'Guindo:LB:75:29', 'Yeo:ST:74:28'],
            'you' => ['Ugrinic:CM:78:7', 'Monteiro:RW:77:77', 'Von Ballmoos:GK:77:26', 'Camara:CB:77:4', 'Elia:RW:77:15', 'Lauper:CDM:76:30', 'Imeri:CAM:76:10', 'Ganvoula:ST:76:35', 'Niasse:CDM:76:20', 'Colley:LW:76:11', 'Itten:LW:76:9', 'Athekame:RB:75:24', 'Zoukrou:CB:75:5', 'Males:CAM:75:39', 'Hadjjam:LB:75:3', 'Blum:RB:75:27', 'Virginius:ST:75:21', 'Crnovrsanin:CB:74:22', 'Conté:LB:74:2', 'Lakomy:ST:74:8', 'Chaiwa:CM:73:14', 'Keller:GK:73:40'],
            'zag' => ['Baturina:CAM:80:10', 'Petkovic:ST:79:9', 'Misic:CDM:78:27', 'Ristovski:RB:77:13', 'Sucic:CM:77:25', 'Theophile-Catherine:CB:77:28', 'Pjaca:LW:77:20', 'Kulenovic:ST:77:17', 'Ademi:CDM:77:5', 'Nevistic:GK:76:33', 'Bernauer:CB:76:4', 'Cordoba:RW:76:19', 'Pierre-Gabriel:LB:76:18', 'Rog:CAM:76:30', 'Spikic:RW:76:77', 'Kacavenda:CM:75:21', 'Stojkovic:LW:75:20', 'Mmaee:RB:75:3', 'Torrente:CB:75:2', 'Ogiwara:LB:75:3', 'Hoxha:ST:75:11', 'Zagorac:GK:73:1'],
            'crv' => ['Krunic:CM:79:6', 'Ivanic:CDM:78:4', 'Ndiaye:ST:78:9', 'Glazer:GK:77:18', 'Hwang:CM:77:8', 'Spajic:CB:77:5', 'Elšnik:CDM:77:21', 'Mvumpa:RW:77:14', 'Olayinka:LW:77:14', 'Duarte:ST:77:17', 'Seol:RB:76:66', 'Ilić:CAM:76:32', 'Drkusic:CB:76:33', 'Djiga:CB:76:24', 'Rodic:LB:76:23', 'Milson:CAM:76:10', 'Katai:LW:76:10', 'Maksimovic:RW:75:55', 'Mimovic:RB:74:2', 'Lekovic:LB:74:3', 'Sremcevic:ST:73:19', 'Ilić:GK:73:1'],
            'spa' => ['Haraslin:ST:79:22', 'Birmancevic:LW:79:14', 'Preciado:CM:78:17', 'Vitik:CB:78:41', 'Kairinen:CDM:77:6', 'Panak:CB:77:27', 'Olatunji:ST:77:7', 'Laci:CM:77:20', 'Kuchta:ST:77:9', 'Sadilek:CM:77:18', 'Rrahmani:LW:77:10', 'Vindahl:GK:76:1', 'Wiesner:RM:76:28', 'Zeleny:LM:76:30', 'Krasniqi:RW:76:10', 'Ross:CB:75:2', 'Pavelka:CDM:75:8', 'Danek:CAM:75:13', 'Tuci:ST:75:11', 'Mejdr:RB:74:18', 'Suchomel:LB:74:11', 'Jensen:GK:73:24'],
            'fer' => ['Varga:ST:78:19', 'Dibusz:GK:77:90', 'Abu Fani:CAM:77:15', 'Saldanha:ST:77:9', 'Traore:LW:77:20', 'Zachariassen:RW:76:16', 'Cisse:CB:76:27', 'Kady:RW:76:11', 'Pesic:ST:76:72', 'Maiga:CM:75:15', 'Makreckis:RB:75:22', 'Ramirez:LB:75:99', 'Rommens:CDM:75:8', 'Besic:CM:75:7', 'Gustavo:CB:75:3', 'Kehinde:LW:75:17', 'Botka:LB:74:21', 'Toth:CAM:73:10', 'Toth:RB:73:21', 'Szabo:CB:73:34', 'Papp:CDM:73:5', 'Varga:GK:72:29'],
            'stg' => ['Kiteishvili:ST:77:10', 'Gazibegovic:RB:76:22', 'Biereth:ST:76:18', 'Horvat:CM:76:19', 'Stankovic:CM:76:14', 'Scherpen:GK:75:1', 'Aiwu:CB:75:4', 'Bøving:RM:75:15', 'Johnston:LB:75:2', 'Jatta:LM:75:20', 'Sarkaria:ST:75:11', 'Lavalée:CB:74:5', 'Schnegg:LB:74:28', 'Wlodarczyk:ST:74:9', 'Chukwuani:CDM:74:8', 'Yardımcı:RW:74:9', 'Zvonarek:CM:74:21', 'Geyrhofer:RB:73:35', 'Malić:CB:73:24', 'Camara:CAM:73:11', 'Grgić:LW:73:17', 'Khudyakov:GK:72:31'],
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
                $bestMatch = $availablePlayers->first(function ($p) use ($reqPos, $selectedIds) {
                    return $p['position'] === $reqPos && !in_array($p['id'], $selectedIds);
                });

                if (!$bestMatch && isset($positionFallbacks[$reqPos])) {
                    foreach ($positionFallbacks[$reqPos] as $fallbackPos) {
                        $bestMatch = $availablePlayers->first(function ($p) use ($fallbackPos, $selectedIds) {
                            return $p['position'] === $fallbackPos && !in_array($p['id'], $selectedIds);
                        });
                        if ($bestMatch) break;
                    }
                }

                if (!$bestMatch) {
                    $bestMatch = $availablePlayers->first(function ($p) use ($reqPos, $selectedIds) {
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
