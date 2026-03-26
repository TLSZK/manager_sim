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
            ['id' => 'bar', 'name' => 'Barcelona', 'shortName' => 'BAR', 'strength' => 95, 'primaryColor' => '#a50044', 'secondaryColor' => '#004d98', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png', 'tier' => 1],
            ['id' => 'rma', 'name' => 'Real Madrid', 'shortName' => 'RMA', 'strength' => 93, 'primaryColor' => '#ffffff', 'secondaryColor' => '#1e3a8a', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png', 'tier' => 1],
            ['id' => 'atm', 'name' => 'Atlético Madrid', 'shortName' => 'ATM', 'strength' => 88, 'primaryColor' => '#cb3524', 'secondaryColor' => '#171796', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png', 'tier' => 1],
            ['id' => 'gir', 'name' => 'Girona', 'shortName' => 'GIR', 'strength' => 80, 'primaryColor' => '#ef3340', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png', 'tier' => 1],
            ['id' => 'ath', 'name' => 'Athletic Club', 'shortName' => 'ATH', 'strength' => 84, 'primaryColor' => '#e30613', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png', 'tier' => 1],
            ['id' => 'rso', 'name' => 'Real Sociedad', 'shortName' => 'RSO', 'strength' => 83, 'primaryColor' => '#0066b2', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png', 'tier' => 1],
            ['id' => 'bet', 'name' => 'Real Betis', 'shortName' => 'BET', 'strength' => 81, 'primaryColor' => '#0bb363', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png', 'tier' => 1],
            ['id' => 'vil', 'name' => 'Villarreal', 'shortName' => 'VIL', 'strength' => 82, 'primaryColor' => '#fbe10f', 'secondaryColor' => '#00519e', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png', 'tier' => 1],
            ['id' => 'val', 'name' => 'Valencia', 'shortName' => 'VAL', 'strength' => 76, 'primaryColor' => '#ffffff', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png', 'tier' => 1],
            ['id' => 'osa', 'name' => 'Osasuna', 'shortName' => 'OSA', 'strength' => 78, 'primaryColor' => '#da291c', 'secondaryColor' => '#0a1d56', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png', 'tier' => 1],
            ['id' => 'get', 'name' => 'Getafe', 'shortName' => 'GET', 'strength' => 75, 'primaryColor' => '#005999', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png', 'tier' => 1],
            ['id' => 'cel', 'name' => 'Celta Vigo', 'shortName' => 'CEL', 'strength' => 77, 'primaryColor' => '#8ac3ee', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png', 'tier' => 1],
            ['id' => 'sev', 'name' => 'Sevilla', 'shortName' => 'SEV', 'strength' => 78, 'primaryColor' => '#ffffff', 'secondaryColor' => '#d4001f', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png', 'tier' => 1],
            ['id' => 'mal', 'name' => 'Mallorca', 'shortName' => 'MAL', 'strength' => 76, 'primaryColor' => '#e20613', 'secondaryColor' => '#000000', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png', 'tier' => 1],
            ['id' => 'ray', 'name' => 'Rayo Vallecano', 'shortName' => 'RAY', 'strength' => 75, 'primaryColor' => '#ffffff', 'secondaryColor' => '#ce0e2d', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png', 'tier' => 1],
            ['id' => 'ala', 'name' => 'Alavés', 'shortName' => 'ALA', 'strength' => 74, 'primaryColor' => '#0057a6', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png', 'tier' => 1],
            ['id' => 'esp', 'name' => 'Espanyol', 'shortName' => 'ESP', 'strength' => 71, 'primaryColor' => '#338ecc', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png', 'tier' => 1],
            ['id' => 'elc', 'name' => 'Elche', 'shortName' => 'ELC', 'strength' => 70, 'primaryColor' => '#0b7a3b', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10268.png', 'tier' => 1],
            ['id' => 'lev', 'name' => 'Levante', 'shortName' => 'LEV', 'strength' => 72, 'primaryColor' => '#1e3a8a', 'secondaryColor' => '#a50044', 'isUCL' => false, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png', 'tier' => 1],
            ['id' => 'ovi', 'name' => 'Real Oviedo', 'shortName' => 'OVI', 'strength' => 69, 'primaryColor' => '#0033a0', 'secondaryColor' => '#ffffff', 'isUCL' => false, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8670.png', 'tier' => 1],   

            // EUROPEAN GIANTS
            ['id' => 'mci', 'name' => 'Manchester City', 'shortName' => 'MCI', 'strength' => 95, 'primaryColor' => '#6CABDD', 'secondaryColor' => '#1C2C5B', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png', 'tier' => 2],
            ['id' => 'liv', 'name' => 'Liverpool', 'shortName' => 'LIV', 'strength' => 94, 'primaryColor' => '#C8102E', 'secondaryColor' => '#00B2A9', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png', 'tier' => 2],
            ['id' => 'ars', 'name' => 'Arsenal', 'shortName' => 'ARS', 'strength' => 93, 'primaryColor' => '#EF0107', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png', 'tier' => 2],
            ['id' => 'bay', 'name' => 'Bayern Munich', 'shortName' => 'BAY', 'strength' => 94, 'primaryColor' => '#DC052D', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png', 'tier' => 2],
            ['id' => 'dor', 'name' => 'Dortmund', 'shortName' => 'BVB', 'strength' => 87, 'primaryColor' => '#FDE100', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png', 'tier' => 2],
            ['id' => 'lev2', 'name' => 'Leverkusen', 'shortName' => 'B04', 'strength' => 91, 'primaryColor' => '#E32221', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png', 'tier' => 2],
            ['id' => 'int', 'name' => 'Inter', 'shortName' => 'INT', 'strength' => 92, 'primaryColor' => '#010E80', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png', 'tier' => 2],
            ['id' => 'juv', 'name' => 'Juventus', 'shortName' => 'JUV', 'strength' => 88, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png', 'tier' => 2],
            ['id' => 'ata', 'name' => 'Atalanta', 'shortName' => 'ATA', 'strength' => 86, 'primaryColor' => '#1E71B8', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png', 'tier' => 2],
            ['id' => 'psg', 'name' => 'Paris SG', 'shortName' => 'PSG', 'strength' => 92, 'primaryColor' => '#004170', 'secondaryColor' => '#DA291C', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png', 'tier' => 2],
            ['id' => 'mon', 'name' => 'Monaco', 'shortName' => 'MON', 'strength' => 84, 'primaryColor' => '#E51D1F', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-4-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png', 'tier' => 2],
            ['id' => 'psv', 'name' => 'PSV', 'shortName' => 'PSV', 'strength' => 82, 'primaryColor' => '#FF0000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png', 'tier' => 2],
            ['id' => 'spo', 'name' => 'Sporting', 'shortName' => 'SCP', 'strength' => 85, 'primaryColor' => '#008000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png', 'tier' => 2],
            ['id' => 'ben', 'name' => 'Benfica', 'shortName' => 'SLB', 'strength' => 84, 'primaryColor' => '#E30613', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png', 'tier' => 2],
            ['id' => 'bru', 'name' => 'Brugge', 'shortName' => 'CLB', 'strength' => 78, 'primaryColor' => '#000000', 'secondaryColor' => '#0067CE', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png', 'tier' => 2],
            ['id' => 'new', 'name' => 'Newcastle United', 'shortName' => 'NEW', 'strength' => 83, 'primaryColor' => '#241F20', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png', 'tier' => 2],
            ['id' => 'tot', 'name' => 'Tottenham', 'shortName' => 'TOT', 'strength' => 79, 'primaryColor' => '#132257', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png', 'tier' => 2],
            ['id' => 'nap', 'name' => 'Napoli', 'shortName' => 'NAP', 'strength' => 82, 'primaryColor' => '#008CFF', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png', 'tier' => 2],
            ['id' => 'mar', 'name' => 'Marseille', 'shortName' => 'OM', 'strength' => 80, 'primaryColor' => '#00AEEF', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png', 'tier' => 2],
            ['id' => 'gal', 'name' => 'Galatasaray', 'shortName' => 'GAL', 'strength' => 83, 'primaryColor' => '#A32638', 'secondaryColor' => '#FFCC00', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png', 'tier' => 2],
            ['id' => 'cph', 'name' => 'FC Copenhagen', 'shortName' => 'FCK', 'strength' => 78, 'primaryColor' => '#0000FF', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8391.png', 'tier' => 2],
            ['id' => 'qar', 'name' => 'Qarabag', 'shortName' => 'QAR', 'strength' => 74, 'primaryColor' => '#000000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7981.png', 'tier' => 2],
            ['id' => 'aja', 'name' => 'Ajax', 'shortName' => 'AJA', 'strength' => 78, 'primaryColor' => '#D2122E', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png', 'tier' => 2],
            ['id' => 'fra', 'name' => 'Eintracht Frankfurt', 'shortName' => 'FRA', 'strength' => 77, 'primaryColor' => '#000000', 'secondaryColor' => '#E1000F', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png', 'tier' => 2],
            ['id' => 'bod', 'name' => 'Bodø/Glimt', 'shortName' => 'BOD', 'strength' => 80, 'primaryColor' => '#FFD500', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8402.png', 'tier' => 2],
            ['id' => 'paf', 'name' => 'Pafos FC', 'shortName' => 'PAF', 'strength' => 70, 'primaryColor' => '#1E90FF', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/2137.png', 'tier' => 2],
            ['id' => 'usg', 'name' => 'Union Saint-Gilloise', 'shortName' => 'USG', 'strength' => 76, 'primaryColor' => '#FFD700', 'secondaryColor' => '#0000A0', 'isUCL' => true, 'formation' => '3-5-2', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7978.png', 'tier' => 2],
            ['id' => 'sla', 'name' => 'Slavia Praha', 'shortName' => 'SLA', 'strength' => 75, 'primaryColor' => '#D40000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/7787.png', 'tier' => 2],
            ['id' => 'krt', 'name' => 'Kairat Almaty', 'shortName' => 'KRT', 'strength' => 71, 'primaryColor' => '#FFD200', 'secondaryColor' => '#000000', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8037.png', 'tier' => 2],
            ['id' => 'oly', 'name' => 'Olympiacos', 'shortName' => 'OLY', 'strength' => 80, 'primaryColor' => '#E00000', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-3-3', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8638.png', 'tier' => 2],
            ['id' => 'che', 'name' => 'Chelsea', 'shortName' => 'CHE', 'strength' => 83, 'primaryColor' => '#034694', 'secondaryColor' => '#FFFFFF', 'isUCL' => true, 'formation' => '4-2-3-1', 'logoUrl' => 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png', 'tier' => 2],
            ];

        // Format is Name:Position:Rating:ShirtNumber 
        $realPlayers = [
            'bar' => ['J. García:GK:89:13', 'Szczesny:GK:80:25', 'Yamal:RW:95:10', 'Lewandowski:ST:86:9', 'Raphinha:LW:92:11', 'Pedri:CM:93:8', 'De Jong:CDM:90:21', 'Araújo:CB:82:4', 'Gavi:CM:85:6', 'Olmo:CAM:83:20', 'Koundé:RB:87:23', 'Balde:LB:84:3', 'Cubarsí:CB:85:5', 'Christensen:CB:82:15', 'Fermín:CAM:85:16', 'Eric García:CB:84:24', 'Casadó:CDM:80:17', 'Ferran:RW:79:7', 'Rashford:LW:83:14', 'Bardghji:RW:77:19', 'Gerard Martín:LB:80:18', 'Cancelo:RB:83:2'],
            'rma' => ['Mbappé:ST:94:9', 'Vinícius Jr:LW:91:7', 'Bellingham:CAM:87:5', 'Courtois:GK:93:1', 'Valverde:CM:90:8', 'Rüdiger:CB:83:22', 'Carvajal:RB:84:2', 'Rodrygo:RW:85:11', 'Militao:CB:84:3', 'Tchouaméni:CDM:86:14', 'Camavinga:CM:85:6', 'Pitarch:CM:75:45', 'Mendy:LB:77:23', 'Brahim:CAM:80:21', 'Alaba:CB:78:4', 'Lunin:GK:82:13', 'Güler:RW:84:15', 'Carreras:LB:84:18', 'Ceballos:CM:80:19', 'Alexander-Arnold:RB:85:12', 'García:ST:80:16', 'Huijsen:CB:84:24'],
            'atm' => ['Griezmann:ST:85:7', 'Oblak:GK:86:13', 'Alvarez:ST:88:19', 'Cardoso:CDM:83:5', 'Giménez:CB:82:2', 'Llorente:RM:84:14', 'Le Normand:CB:84:24', 'Koke:CDM:84:6', 'Baena:LM:83:10', 'Almada:CAM:80:11', 'Lookman:LM:85:22', 'Simeone:RM:82:20', 'Hancko:CB:83:17', 'Ruggeri:LB:78:3', 'Barrios:CM:83:8', 'Pubil:CB:80:18', 'González:LW:80:23', 'Molina:RB:80:16', 'Lenglet:CB:80:15', 'Mendoza:CDM:77:4', 'Musso:GK:82:1', 'Sørloth:ST:83:22'],
            'gir' => ['Gazzaniga:GK:83:13', 'Tsygankov:RW:83:8', 'Witsel:CB:75:20', 'López:CB:81:5', 'Moreno:LB:78:24', 'Martín:CAM:76:23', 'Blind:CB:76:17', 'Gil:LW:79:21', 'Martinez:RB:81:4', 'van de Beek:CM:78:6', 'Echeverri:CAM:79:14', 'Lemar:CM:79:11', 'Ruiz:ST:78:9', 'Stuani:ST:78:7', 'Reis:CB:80:12', 'Ounahi:CM:78:18', 'Vanat:ST:77:19', 'Rincón:RB:75:2', 'Francés:CB:74:16', 'Beltrán:CM:75:8', 'Roca:LW:75:3', 'Ter stegen:GK:85:22'],
            'ath' => ['N. Williams:LW:87:10', 'Simón:GK:85:1', 'I. Williams:RW:84:9', 'Vivian:CB:84:3', 'Sancet:CAM:83:8', 'Guruzeta:ST:81:12', 'Paredes:CB:81:4', 'De Marcos:RB:80:18', 'Yuri:LB:80:17', 'Berenguer:RW:80:7', 'Yeray:CB:80:5', 'Vesga:CM:79:6', 'Herrera:CM:79:21', 'Prados:CDM:79:24', 'Ruiz:CDM:78:16', 'Agirrezabala:GK:79:13', 'Djalo:LW:78:11', 'Gómez:CAM:78:20', 'Lekue:RB:77:15', 'Boik:LB:75:14', 'Martón:ST:75:19', 'Serrano:ST:74:22'],
            'rso' => ['Soler:CM:80:18', 'Remiro:GK:84:1', 'Kubo:RW:84:14', 'Méndez:CM:84:23', 'Oyarzabal:ST:85:10', 'Zubeldia:CB:82:5', 'Martín:CB:82:31', 'Aramburu:RB:80:2', 'Muñoz:LB:76:3', 'Barrenetxea:LW:80:7', 'Caleta-Car:CB:78:16', 'Turrientes:CM:81:8', 'Zakharyan:CAM:80:21', 'Óskarsson:ST:78:9', 'Guedes:RW:77:11', 'Gómez:LB:80:17', 'Herrera:CM:78:12', 'Marín:CM:77:15', 'Sucic:CM:77:24', 'Gorrotxategi:CDM:81:4', 'Marrero:GK:75:13', 'Marín:CM:75:20'],
            'bet' => ['Lo Celso:CAM:82:20', 'Valles:GK:77:1', 'Isco:CAM:84:22', 'Fornals:CAM:80:8', 'Llorente:CB:81:3', 'Bellerín:RB:76:2', 'Natan:CB:82:4', 'Amrabat:CDM:80:14', 'Roca:CM:77:21', 'Firpo:LB:81:23', 'Abde:LW:82:10', 'Antony:RW:85:7', 'Riquelme:LW:79:17', 'Bartra:CB:81:5', 'Bakambu:ST:79:11', 'Avila:ST:79:9', 'Hernández:ST:78:19', 'Ruibal:RW:78:24', 'Fidalgo:CM:78:15', 'Gómez:CB:77:16', 'López:GK:74:25', 'Rodriguez:LB:76:12'],
            'vil' => ['Mikautadze:ST:81:9', 'Buchanan:RW:82:17', 'Parejo:CM:82:10', 'Marín:CB:81:4', 'Foyth:CB:80:8', 'Morelio:LW:84:20', 'Júniór:GK:81:1', 'Costa:CB:80:2', 'Comesaña:CM:78:14', 'Gueye:CDM:84:18', 'Pépé:ST:79:19', 'Mouriño:RB:80:15', 'Pedraza:LB:80:24', 'Kambwala:CB:76:5', 'Navarro:RB:79:6', 'Partey:CDM:77:16', 'Cardona:LB:76:23', 'Veiga:CB:81:12', 'Oluwaseyi:ST:79:21', 'Maciá:CM:76:37', 'Tenas:GK:75:25', 'Pérez:ST:78:22'],
            'val' => ['Dimitrievski:GK:76:1', 'Gayà:LB:82:14', 'Tárrega:CB:80:5', 'Pepelu:CDM:82:18', 'Guerra:CM:82:8', 'Rioja:LM:76:11', 'Duro:ST:79:9', 'Correia:RB:77:12', 'Rodríguez:CDM:78:2', 'Sadiq:ST:75:6', 'Cömert:CB:77:24', 'Riverio:GK:72:13', 'Santamaria:CM:78:22', 'Danjuma:LW:80:7', 'Beltrán:ST:76:15', 'Copete:CB:74:3', 'Vázquez:LB:74:21', 'Ramazani:LW:77:17', 'Ugrincic:CM:75:23', 'López:LM:77:16', 'Almeida:CAM:78:10', 'Núnez:CB:71:4'],
            'osa' => ['Budimir:ST:82:17', 'Oroz:CAM:80:10', 'Herrera:GK:80:1', 'Catena:CB:77:24', 'Torró:CDM:76:6', 'Moncayola:CM:80:7', 'Muñoz:LW:75:21', 'Rosier:RB:77:19', 'Rubén:RW:76:14', 'Gómez:CAM:78:11', 'García:ST:79:9', 'Boyomo:CB:81:22', 'Galán:LB:77:20', 'Osambela:RB:75:29',/*asd*/ 'Cruz:LB:75:3', 'Muñoz:CDM:76:6', 'Moro:LW:78:15', 'Barja:ST:78:11', 'Herrando:CB:77:5', 'Benito:RW:76:2', 'Bretones:LB:76:23', 'Fernández:GK:76:13'],
            'get' => ['Soria:GK:83:13', 'Mayoral:ST:81:9', 'Djené:CB:80:2', 'Arambarri:CM:80:8', 'Milla:CM:81:5', 'Abqar:CB:76:3', 'Martín:CM:77:6', 'Iglesias:RB:78:21', 'Rico:LB:78:16', 'Birmancevic:LW:78:20', 'Romero:CB:78:24', 'Vázquez:ST:77:19', 'Satriano:ST:77:10', 'Muñoz:CM:76:14', 'Davinchi:CB:74:26', 'Nyom:RB:78:12', 'Liso:LW:76:23', 'Femenía:RB:78:17', 'Juanmi:LW:75:7', 'Letacek:GK:74:1', 'Kamara:RW:76:11', 'Sancris:ST:75:18'],
            'cel' => ['Aspas:ST:83:10', 'Radu:GK:80:13', 'Mingueza:RB:82:3', 'Román:CM:80:16', 'Jutglà:ST:78:9', 'Iglesias:ST:77:7', 'Starfelt:CB:77:2', 'El-Abdellaoui:RW:79:39', 'López:CAM:80:8', 'Alonso:CB:78:3', 'Moriba:CM:79:6', 'Swedberg:LW:80:19', 'Domínguez:CB:77:24', 'Aidoo:CB:75:4', 'Cervi:LW:76:11', 'Rodríguez:CB:79:32', 'Carrerira:RB:77:5', 'Álvarez:LW:79:23', 'Sotelo:CM:74:22', 'Ristić:LB:74:21', 'Lago:CB:71:29', 'Villar:GK:75:1'],
            'sev' => ['Azpilicueta:CB:78:3', 'Sánchez:ST:76:10', 'Nyland:GK:77:13', 'Gudelj:CDM:81:6', 'Sow:CM:80:20', 'Ejuke:LW:76:21', 'Salas:CB:78:4', 'Adams:ST:79:9', 'Mendy:CDM:78:19', 'Sánchez:RB:79:16', 'Nianzou:CB:76:14', 'Vargas:LM:78:11', 'Carmona:RB:78:2', 'Marcão:CB:78:23', 'Oso:LB:76:36', 'Januzaj:RW:75:24', 'Maupay:ST:75:17', 'Agoumé:CDM:77:18', 'Bueno:CM:74:28', 'Fernández:ST:73:14', 'Vlachodimos:GK:80:1', 'Jordán:CM:75:8'],
            'mal' => ['Muriqi:ST:81:7', 'Darder:CM:81:10', 'Maffeo:RB:80:23', 'Kumbulla:CB:78:4', 'Torre:CAM:79:20', 'Valjent:CB:77:24', 'Costa:CDM:79:12', 'Virgili:LW:80:17', 'Mojica:LB:78:22', 'Asano:LW:76:11', 'Prats:ST:75:9', 'Luvumbo:ST:76:15', 'Kalumba:RW:76:30', 'Raíllo:CB:77:21', 'Mascarell:CDM:76:5', 'Morlanes:CM:77:8', 'Morey:RB:74:2', 'Llabrés:LW:74:19', 'Lato:LB:76:3', 'Joseph:ST:77:18', 'Román:GK:76:1', 'Bergström:GK:74:13'],
            'ray' => ['García:LW:78:18', 'Lejeune:CB:77:24', 'Gumbau:CDM:76:15', 'Palazón:RW:84:7', 'López:CM:76:17', 'Camello:ST:78:10', 'Akhomach:RW:78:12', 'Rațiu:RB:81:2', 'Mumin:CB:78:16', 'Espino:LB:78:22', 'Trejo:CAM:77:8', 'De Frutos:RW:79:19', 'Batalla:GK:78:13', 'Balliu:RB:75:20', 'Ciss:CDM:75:6', 'Cárdenas:GK:76:1', 'Mendy:CB:77:32', 'Nteka:CAM:76:11', 'Chavarría:LB:79:3', 'Valentín:CM:76:23', 'Martín:LW:76:14', 'Pérez:RW:76:21'],
            'ala' => ['Sivera:GK:78:1', 'Guevara:CM:76:6', 'Diabate:ST:76:22', 'Díaz:ST:77:9', 'Tenaglia:RB:76:14', 'Pacheco:CB:78:5', 'Blanco:CDM:78:8', 'Suárez:CAM:77:4', 'Boyé:ST:75:15', 'Koski:CB:73:16', 'Enríquez:LB:76:3', 'Parada:LB:74:24', 'Aleñá:CAM:77:10', 'Martínez:ST:77:11', 'Rebbach:LW:74:21', 'Otto:RB:76:17', 'Calebe:CAM:74:20', 'Pérez:RW:75:7', 'Ibáñez:CM:76:19', 'Guridi:CM:74:18', 'Protesoni:CM:73:23', 'Fernández:GK:74:13'],
            'esp' => ['Puado:LM:79:7', 'Dmitrovic:GK:78:1', 'Cabrera:CB:74:6', 'Expósito:CM:78:8', 'Riedel:CB:77:4', 'Romero:LB:81:22', 'de Zárte:CM:78:4', 'Fernández:ST:78:9', 'Milla:LW:76:11', 'El Hilali:RB:78:23', 'Dolan:RW:77:24', 'Ngonge:ST:76:16', 'Pickel:CDM:76:18', 'García:ST:74:19', 'Fortuño:GK:74:1', 'Calero:CB:76:5', 'Salinas:LB:75:12', 'Terrats:CM:75:14', 'Roca:LW:72:20', 'Sánchez:RB:72:2', 'Lozano:CM:75:10', 'Carreras:RW:74:17'],
            'lev' => ['Ryan:GK:76:13','Campos:GK:74:13','Moreno:CB:75:2','Matturo:CB:74:3','Dela:CB:75:4','Toljan:RB:74:22','Sánchez:LB:73:23','Rey:CDM:75:6','Ragho:CM:74:20','Álvarez:CAM:75:24','Mártínez:CM:75:10','Eyong:ST:79:21','Romero:ST:77:9','Brogué:RW:75:7','Abed:RW:74:55','Espí:ST:74:19','Olasagatsí:CM:75:8','Vencedor:CM:74:20','Arriga:CDM:74:16','Toljan:RB:73:22','Pampín:LB:73:6','Morales:ST:73:11'],
            'elc' => ['Peña:GK:78:13','Dituro:GK:75:1','Pedrosa:LB:75:3','Bigas:CB:75:6','Affengruber:CB:77:22','Chust:CB:75:23','Fort:RB:76:39','Redondo:CDM:76:5','Aguado:CDM:75:8','Villar:CM:75:12','Febas:CM:75:14','Morente:LW:75:15','Valera:LW:76:11','Yago:RW:75:7','Rodríguez:ST:76:20','Neto:CM:74:16','Rafa Mir:ST:76:10','André Silva:ST:76:9','Pétrot:LB:74:21','Sangaré:RB:74:42','Diangana:RW:74:19','Cepeda:LW:75:24'],
            'ovi' => ['Escandell:GK:76:13','Moldovan:GK:74:1','Carmo:CB:75:16','Bailly:CB:75:2','Costas:CB:74:4','López:LB:75:25','Vidal:RB:75:22','Colombatto:CDM:75:11','Dendoncker:CM:74:20','Ilic:CM:75:21','Fonseca:CM:75:23','Cazorla:CAM:78:8','Borbas:ST:75:17','Hassan:RW:74:10','Fernández:LW:75:15','Viñas:ST:74:9','Reina:CM:74:5','Sibo:CM:73:6','Chaira:LW:76:7','Alhassene:LB:73:3','Ahijado:RB:72:24','Agudín:CAM:74:27'],

            // EUROPEAN GIANTS
            'mci' => ['Haaland:ST:92:9', 'Rodri:CDM:88:16', 'Marmoush:LW:85:7', 'Dias:CB:86:3', 'Foden:CAM:84:47', 'Donnarumma:GK:87:25', 'Silva:CM:86:20', 'Khusanov:CB:84:45', 'Rico:RB:81:82', 'Gvardiol:LB:83:24', 'Stones:CB:82:5', 'Reijnders:CM:86:4', 'Doku:LW:85:11', 'Kovacic:CDM:80:8', 'Semenyo:RW:84:42', 'Ake:LB:82:6', 'Savinho:RW:84:26', 'Nunes:RB:81:27', 'Trafford:GK:80:1', 'O`Rilley:LB:82:33', 'Cherki:CAM:84:10', 'Nico:CDM:80:14'],
            'liv' => ['Salah:RW:87:11', 'Alisson:GK:88:1', 'Van Dijk:CB:89:4', 'Frimpong:RB:84:30', 'Mac Allister:CM:85:10', 'Robertson:LB:82:26', 'Konate:CB:86:5', 'Ekitiké:ST:88:22', 'Wirtz:CAM:87:7', 'Gravenberch:CDM:86:38', 'Szoboszlai:CAM:90:8', 'Isak:ST:84:9', 'Chiesa:RW:83:14', 'Gakpo:LW:84:18', 'Endo:CDM:78:3', 'Jones:CM:82:17', 'Kerkez:LB:85:6', 'Mamardashvili:GK:84:25', 'Bradley:RB:81:12', 'Gomez:CB:79:2', 'Ngumoha:LW:80:73', 'Nyoni:CM:75:42'],  /*asd*/
            'ars' => ['Saka:RW:85:7', 'Saliba:CB:87:2', 'Rice:CM:88:41', 'Ødegaard:CAM:85:8', 'Gabriel:CB:88:6', 'Raya:GK:86:22', 'White:RB:83:4', 'Havertz:ST:83:29', 'Zubimendi:CDM:86:36', 'Martinelli:LW:83:11', 'Trossard:LW:82:19', 'Jesus:ST:80:9', 'Timber:RB:84:12', 'Merino:CM:85:23', 'Eze:CAM:81:10', 'Madueke:RW:82:20', 'Hincapié:LB:84:5', 'Mosquera:CB:83:3', 'Arrizabalaga:GK:81:13', 'Lewis-Skelly:LB:82:49', 'Dowman:RW:74:56', 'Nørgaard:CDM:81:16'],
            'bay' => ['Kane:ST:93:9', 'Musiala:CAM:90:10', 'Neuer:GK:84:1', 'Kimmich:CM:86:6', 'Pavlovic:CDM:83:45', 'Kim:CB:82:3', 'Davies:LB:82:19', 'Karl:CAM:82:42', 'Olise:RW:87:17', 'Upamecano:CB:84:2', 'Díaz:LW:88:14', 'Gnabry:LW:81:7', 'Jackson:ST:80:11', 'Guerreiro:LB:79:22', 'Laimer:RB:84:27', 'Bischof:CM:80:20', 'Stanisic:RB:80:44', 'Ito:LB:78:21', 'Tah:CB:86:4', 'Goretzka:CM:83:8', 'Ulreich:GK:79:26', 'Ndiaye:CM:70:39'],
            'dor' => ['Kobel:GK:87:1', 'Brandt:CAM:84:10', 'Schlotterbeck:CB:86:4', 'Guirassy:ST:83:9', 'Can:CB:84:23', 'Sabitzer:CM:78:20', 'Anton:CB:81:3', 'Beier:ST:83:14', 'Ryerson:RB:81:26', 'Nmecha:CM:83:8', 'Adeyemi:LW:84:27', 'Couto:RM:81:2', 'Svensson:LB:82:24', 'Jobe:CM:79:7', 'Chukwuemeka:CAM:76:17', 'Sule:CB:78:25', 'Inácio:ST:75:40', 'Özcan:CDM:79:6', 'Bensebani:CB:78:5', 'Meyer:GK:76:33', 'Silva:ST:76:21', 'Kabar:LB:71:42'],
            'lev2' => ['Ben Seghir:CAM:81:17', 'Grimaldo:LM:84:20', 'García:CM:84:24', 'Vázquez:RM:80:21', 'Quansah:CB:78:4', 'Tapsoba:CB:84:12', 'Tella:ST:81:23', 'Flekken:GK:80:1', 'Andrich:CM:84:8', 'Badé:CB:82:5', 'Hofmann:ST:83:7', 'Palacios:CDM:83:25', 'Schick:ST:82:14', 'Tillman:CAM:82:10', 'Terrier:CAM:81:11', 'Fernández:CM:79:6', 'Kofane:ST:77:35', 'Poku:LW:78:19', 'Omlin:GK:76:18', 'Arthur:CM:77:13', 'Oermann:CB:70:15', 'Maza:CM:70:30'],
            'int' => ['Martinez:ST:87:10', 'Barella:CM:86:23', 'Bastoni:CB:86:95', 'Calhanoglu:CDM:85:20', 'Dimarco:LM:84:32', 'Sommer:GK:86:1', 'Thuram:ST:86:9', 'Akanji:CB:83:25', 'Acerbi:CB:84:15', 'Mkhitaryan:CM:81:22', 'Zielinski:CM:82:7', 'De Vrij:CB:83:6', 'Dumfries:RM:86:2', 'Frattesi:CM:82:16', 'Darmian:RM:80:36', 'Augusto:LM:79:30', 'Sucic:CM:77:8', 'Diouf:CAM:75:17', 'Bisseck:CB:82:31', 'Martínez:GK:76:13', 'Bonny:ST:76:14', 'Henrique:LM:74:11'],
            'juv' => ['Bremer:CB:85:3', 'Koopmeiners:CAM:83:8', 'Vlahovic:ST:83:9', 'Conceição:RW:79:7', 'Di Gregorio:GK:83:16', 'Kalulu:RB:80:15', 'Locatelli:CDM:83:5', 'Zhegrova:RW:82:11', 'Yildiz:LW:84:10', 'Gatti:CB:82:4', 'Kostic:LB:80:18', 'Thuram:CM:82:19', 'Miretti:CAM:77:21', 'Cambiaso:LM:80:27', 'Kelly:CB:78:6', 'McKennie:CM:82:22', 'Milik:ST:76:14', 'Cabal:LB:80:32', 'David:ST:82:30', 'Openda:ST:82:20', 'Perin:GK:75:1', 'Boga:LW:78:13'],
            'ata' => ['Krstović:ST:82:90', 'Éderson:CM:84:13', 'Raspadori:ST:80:18', 'Scamacca:ST:81:9', 'De Ketelaere:CAM:82:17', 'Carnesecchi:GK:82:29', 'Bellanova:RM:81:16', 'De Roon:CDM:81:15', 'Pasalic:CM:80:8', 'Zalewski:LM:81:59', 'Musah:CM:82:6', 'Djimsiti:CB:79:19', 'Hien:CB:80:4', 'Kossounou:CB:81:3', 'Zappacosta:RM:76:77', 'Ahanor:CB:82:69', 'Sportiello:GK:74:57', 'Samardžić:CAM:82:10', 'Bernasconi:LM:79:47', 'Sulemana:LM:80:7'],
            'psg' => ['Chevalier:GK:83:30', 'Marquinhos:CB:86:5', 'Hakimi:RB:88:2', 'Vitinha:CDM:90:17', 'Dembele:ST:92:10', 'Mendes:LB:87:25', 'Barcola:LW:84:29', 'Neves:CM:84:87', 'Ramos:ST:81:9', 'Zabarnyi:CB:84:6', 'Zaïre-Emery:CM:80:33', 'Pacho:CB:88:51', 'Ruiz:CM:85:8', 'Kvaratshkelia:LW:88:7', 'Doué:RW:87:14', 'Mayulu:CAM:80:24', 'Lee:CAM:81:19', 'Beraldo:CB:80:35', 'Dro:CAM:76:27', 'Safonov:GK:81:39', 'Hernández:LB:81:21', 'Mbaye:RW:77:49'],
            'mon' => ['Golovin:CAM:81:10', 'Zakaria:CDM:81:6', 'Dier:CB:80:3', 'Kehrer:CB:81:5', 'Camara:CM:83:15', 'Balogun:ST:80:9', 'Minamino:LW:79:18', 'Akliouche:RW:83:11', 'Salisu:CB:80:22', 'Fati:LW:78:31', 'Diatta:RW:76:27', 'Pogba:CM:79:8', 'Teze:RB:78:4', 'Köhn:GK:78:16', 'Vanderson:RB:81:2', 'Coulibaly:CM:77:28', 'Caio Henrique:LB:79:12', 'Adingra:LW:80:24', 'Hradecky:GK:80:1', 'Ouattara:LB:76:20', 'Mawissa:CB:76:13', 'Biereth:ST:80:14'],
            'psv' => ['Veerman:CM:82:23', 'Pepi:ST:82:9', 'Wanner:CAM:80:10', 'Schouten:CDM:82:22', 'Saibari:CM:83:34', 'Kovar:GK:80:32', 'Gasiorowski:CB:80:3', 'Man:RW:79:27', 'Van Bommel:LW:80:7', 'Flamingo:CB:79:6', 'Boadu:ST:78:21', 'Pléa:ST:72:14', 'Obispo:CB:76:4', 'Dest:RB:77:8', 'Júnior:LB:81:17', 'Salah-Eddine:LB:80:2', 'Driouech:LW:77:11', 'Sildillia:RB:75:25', 'Til:CAM:77:20', 'Olij:GK:75:1', 'Perišić:LW:75:5', 'Bajraktarevic:RW:72:19'],
            'spo' => ['Suárez:ST:82:97', 'Gonçalves:LW:84:8', 'Inacio:CB:83:25', 'Hjulmand:CDM:82:42', 'Trincao:CAM:82:17', 'Diomande:CB:80:26', 'Edwards:RW:81:10', 'Morita:CM:78:5', 'Bragança:CM:78:23', 'Debast:CB:81:6', 'Santos:LM:79:11', 'Quenda:RW:80:7', 'Virgínia:GK:76:12', 'Quaresma:CB:78:72', 'Araújo:LB:81:20', 'Fresneda:RB:78:22', 'Rui Silva:GK:80:1', 'Catamo:RW:78:10', 'Simões:CAM:77:52', 'Vagiannidis:RB:77:13', 'Ioannidis:ST:78:89', 'Guilherme:RW:75:31'],
            'ben' => ['Lukébakio:RW:81:11', 'Otamendi:CB:81:30', 'Sudakov:CAM:82:10', 'Aursnes:CM:82:8', 'Pavlidis:ST:82:14', 'Trubin:GK:83:1', 'Schjelderup:LW:82:21', 'Ríos:CDM:80:20', 'Bah:RB:78:6', 'Silva:CB:83:4', 'Barriero:CM:79:18', 'Prestianni:RW:78:25', 'Cabral:ST:73:72', 'Araujo:CB:81:44', 'Barrenechea:CDM:78:5', 'Dedić:RB:78:17', 'Dahl:LB:77:26', 'Rafa:CAM:75:27', 'Bruma:LW:74:7', 'Rego:CAM:70:84', 'Veloso:CM:69:68', 'Soares:GK:75:24'],
            'bru' => ['Vanaken:CAM:81:20', 'Forbs:LW:80:9', 'Mignolet:GK:79:22', 'Tzolis:LW:81:8', 'Ordóñez:CB:82:4', 'Onyedika:CDM:79:15', 'Nilsson:ST:78:19', 'Mechele:CB:78:44', 'Vetlesen:CM:76:10', 'Stanković:CDM:80:25', 'Tresoldi:ST:77:7', 'Lemaréchal:CAM:75:80', 'Reis:CM:75:6', 'Vermant:ST:77:17', 'Seys:LB:78:65', 'Sabbe:RB:76:64', 'Spileers:CB:74:58', 'Audoor:CM:71:62', 'Osuji:CB:70:24', 'Sandra:CAM:70:11', 'Diakhon:LW:77:67', 'Jackers:GK:78:29'],
            'nap' => ['Lukaku:ST:85:9', 'Hojlund:ST:81:19', 'Neres:RW:82:7', 'Politano:RW:80:21','De Bruyne:CAM:87:11', 'Elmas:CAM:80:20', 'McTominay:CM:83:8', 'Anguissa:CM:82:99','Lobotka:CDM:84:68', 'Gilmour:CM:80:6', 'Vergara:CAM:77:26','Buongiorno:CB:83:4', 'Beukema:CB:82:31', 'Rrahmani:CB:80:13', 'Juan Jesus:CB:77:5','Di Lorenzo:RB:82:22', 'Mazzocchi:RB:78:30', 'Olivera:LB:80:17', 'Gutiérrez:LB:82:3','Meret:GK:81:1', 'Milinkovic-Savic:GK:80:32','Spinazzola:LB:79:37'], 
            'tot' => ['Vicario:GK:84:1','Kinsky:GK:78:31','Romero:CB:84:17','van de Ven:CB:84:37','Dragusin:CB:79:3','Danso:CB:81:4','Davies:CB:76:33','Porro:RB:84:23','Udogie:LB:84:13','Spence:RB:80:24','Palhinha:CDM:81:6','Bissouma:CDM:82:8','Bentancur:CM:82:30','Sarr:CM:81:29','Gray:CM:80:14','Maddison:CAM:84:10','Simons:CAM:83:7','Kulusevski:RW:83:21','Kudus:RW:84:20','Odobert:LW:79:28','Solanke:ST:82:19','Richarlison:ST:81:9'],
            'new' => ['Pope:GK:83:1','Ramsdale:GK:80:32','Botman:CB:81:4','Thiaw:CB:82:12','Schär:CB:80:5','Burn:CB:83:33','Lascelles:CB:76:6','Livramento:RB:80:21','Trippier:RB:82:2','Hall:LB:83:3','Tonali:CDM:85:8','Guimarães:CM:86:39','Joelinton:CM:84:7','Willock:CM:81:28','Miley:CM:78:67','Gordon:LW:83:10','Barnes:LW:81:11','Elanga:RW:81:20','Murphy:RW:79:23','Woltemade:ST:82:27','Wissa:ST:77:9','Osula:ST:80:18'],
            'mar' => ['De Lange:GK:77:12','Rulli:GK:83:1','Pavard:CB:83:28','Medina:CB:82:32','Balerdi:CB:82:5','Aguerd:CB:84:21','Vermeeren:CDM:78:18','Højbjerg:CDM:81:23','Kondogbia:CM:81:19','Timber:CM:82:27','Weah:RM:82:22','Nadir:CM:77:29','Paixão:LM:82:14','Traoré:LM:78:20','Egan-Riley:CB:78:4','Nwaneri:RM:80:11','Aubameyang:ST:82:17','Gouiri:ST:81:9','Greenwood:RM:85:10','Abdelli:CAM:76:8','Emerson:LM:78:33','Nnadi:CDM:75:6'],
            'gal' => ['Çakir:GK:84:1','Güvenç:GK:72:19','Sánchez:CB:82:6','Bardakci:CB:82:42','Baltaci:CB:78:3','Ünyay:CB:76:91','Singo:RB:83:90','Sallai:RB:82:7','Jakobs:LB:81:4','Elmali:LB:81:17','Torreira:CDM:82:34','Lemina:CDM:83:99','Kaan:CDM:74:23','Sara:CM:82:8','Gündoğan:CM:80:20','Boey:RB:76:93','Yilmaz:LW:82:53','Kutucu:LW:78:21','Sané:RW:81:10','Akgün:RW:82:11','Osimhen:ST:88:45','Icardi:ST:78:9'],
            'aja' => ['Jaros:GK:76:1','Paes:GK:72:26','Baas:CB:81:4','Šutalo:CB:80:37','Itakura:CB:77:4','Tomiyasu:RB:78:32','Gaaei:RB:75:3','Wijndal:LB:76:5','Zinchenko:LB:80:47','Mokio:CDM:77:24','Steur:CM:75:48','Gloukh:CAM:81:10','Berghuis:CAM:78:23','Boundia:CAM:75:43','Dolberg:ST:81:9','Klaassen:CM:75:18','Godts:LW:82:1','Carrizo:RW:78:7','Weghorst:ST:79:25','Fitz-Jim:CM:78:28','Bouwman:CB:76:30','Rosa:RB:72:2'],
            'che' => ['Sanchez:GK:82:1','Jorgensen:GK:76:12','Cucurella:LB:84:3','Adarabioyo:CB:78:4','Badiashile:CB:79:5','Colwill:CB:81:6','Fofana:CB:81:29','Chalobah:CB:78:23','Hato:LB:78:21','James:RB:84:24','Gusto:RB:80:27','Caicedo:CDM:87:25','Enzo:CM:84:8','Lavia:CDM:80:45','Essugo:CDM:77:14','Santos:CM:79:17','Palmer:CAM:85:10','Neto:RW:81:7','Jamie-Gittens:LW:79:11','João Pedro:ST:81:20','Delap:ST:78:9','Estêvão:RW:82:41'],
            'cph' => ['Kotarski:GK:78:1','Runarsson:GK:74:31','Huescas:RB:77:13','Buta:RB:76:17','Meling:LB:76:24','MarcosLopez:LB:75:15','Pereira:CB:78:5','Hatzidiakos:CB:77:6','Suzuki:CB:75:20','Garananga:CB:74:4','Zague:RB:73:22','Delaney:CM:76:27','Clem:CDM:75:36','Mattsson:CM:76:8','Madsen:CM:75:21','Lerager:CM:75:12','Hojer:CM:72:38','Sarapata:CM:73:23','Achouri:LW:77:30','Elyounoussi:FW:78:10','Larsson:RW:76:11','Claesson:FW:77:7','Moukoko:ST:79:9','Cornelius:ST:74:14'],
            'qar' => ['Kochalski:GK:76:99','Mahammadaliyev:GK:74:1','Mustafazada:CB:76:13','Medina:CB:75:81','Mmaee:CB:76:3','Huseynov:CB:73:55','Bayramov:LB:76:27','Cafarquliyev:LB:77:44','Silva:RB:75:2','Bolt:RB:74:18','HuseynovAbbas:RB:73:30','Bicalho:CDM:77:35','Jankovic:CM:77:8','Chriso:CM:74:6','Montiel:CAM:75:9','Zoubir:LW:76:10','Addai:LW:75:11','Andrade:RW:80:15','Kashchuk:RW:78:21','Akhundzade:ST:79:7','Qurbanly:ST:76:22','Durán:ST:75:17'],
            'fra' => ['Zetterer:GK:77:23','Grahl:GK:72:33','Theate:CB:82:3','Koch:CB:81:4','Amenda:CB:78:5','Collins:CB:77:34','Brown:LB:79:21','Kosugi:LB:74:26','Kristensen:RB:80:13','Baum:RB:75:2','Chandler:RB:72:22','Skhiri:CDM:80:15','Larsson:CM:84:16','Chaibi:CM:81:8','Hojlund:CM:78:6','Dahoud:CM:76:18','Uzun:CAM:82:42','Gotze:CAM:80:27','Arrhov:CAM:75:31','Bahoya:LW:81:19','Doan:RW:83:20','Knauff:RW:80:7','Burkardt:ST:82:9','Kalimuendo:ST:81:25'],
            'bod' => ['Haykin:GK:76:12','FayeLund:GK:74:44','Bjørkan:LB:78:5','Sjøvold:RB:76:20','Aleesami:CB:75:18','Bjørtuft:CB:78:4','Gundersen:CB:77:6','Nielsen:CB:75:2','Berg:CM:82:7','Saltnes:CM:80:14','Evjen:CM:81:8','Auklend:CM:76:23','Riisnæs:CM:75:22','Klynge:CM:75:19','Fet:CM:76:8','Hauge:LW:83:10','Blomberg:LW:77:11','Määttä:RW:78:25','Høgh:ST:82:9','Helmersen:ST:76:21','Bassi:RW:75:27'],
            'usg' => ['Scherpen:GK:77:37','Chambaere:GK:72:1','Mac Allister:CB:80:5','Leysen:CB:78:48','Sykes:CB:77:26','Burgess:CB:76:16','Barry:CB:74:3','Patris:RB:78:27','François:RB:73:19','Zorgane:CM:82:8','VanDePerre:CM:78:6','Zeneli:CM:79:23','Schoofs:CM:77:17','Pavlic:CM:74:14','Khalaili:RW:82:25','Niang:LW:80:22','AitElHadj:CAM:79:10','Boufal:CAM:78:23','David:ST:83:12','Rodriguez:ST:80:13','Florucz:ST:79:30','Fuseini:ST:78:7'],
            'sla' => ['Stanek:GK:75:36','Markovic:GK:72:35','Zima:CB:78:4','Ogbu:CB:78:5','Vlcek:CB:76:27','Chaloupek:CB:75:2','Bořil:LB:74:18','Hashioka:RB:75:8','Mbodji:LB:73:12','Douděra:RB:75:21','Holeš:CDM:77:3','Sadílek:CM:79:23','Zafeiris:CM:80:10','Dorley:CM:78:19','Moses:CM:75:16','Provod:CAM:81:17','Cham:CAM:80:7','Kusej:RW:77:9','Schranz:LW:78:26','Sanyang:RW:76:11','Chytil:ST:79:13','Chorý:ST:80:25','Prekop:ST:77:31'],
            'paf' => ['Ivušić:GK:77:1','Papadoudis:GK:72:99','Goldar:CB:78:5','Guessand:CB:75:4','Pedrao:CB:76:3','Ioannou:CB:77:31','David Luiz:CB:75:32','BrunoLanga:LB:77:12','Pileas:LB:75:2','Mimovic:RB:78:21','Bruno:RB:76:7','Šunjić:CDM:79:26','Name:CDM:78:50','Brito:CM:76:80','Dragomir:CM:80:88','DaniSilva:CM:77:6','Valakari:CM:78:8','Quina:CAM:78:12','Orsic:LW:80:17','Correia:RW:79:77','Jaja:RW:77:11','Silva:ST:80:9','Dimata:ST:78:18'],
            'krt' => ['Anarbekov:GK:74:77','Zarutskiy:GK:72:1','Sorokin:CB:76:80','Kasabulat:CB:75:4','Martynovich:CB:74:14','Shirobokov:CB:73:25','Mata:LB:76:3','Kurgin:LB:73:5','Tapalov:RB:74:20','Mrynskiy:RB:74:24','Arad:CDM:78:15','Glazer:CDM:77:18','Sadybekov:CDM:75:6','Baybek:CDM:73:17','Stanojev:RM:76:33','Gromyko:CAM:79:55','Zaria:CAM:78:10','Tuyakbaev:CAM:73:87','Bekbolat:RW:74:81','Satpaev:ST:80:9','Jorginho:ST:76:7','Ricardinho:ST:75:99','Edmilson:ST:74:26','Paulo:ST:73:11'],
            'oly' => ['Tzolakis:GK:76:88','Paschalakis:GK:73:1','Ortega:LB:77:3','Onyemaechi:LB:74:70','Rodinei:RB:78:23','Costinha:RB:76:20','Biancone:CB:75:4','Pirola:CB:76:5','Retsos:CB:75:45','Kalogeropoulos:CB:73:6','Hezze:CDM:78:32','Garcia:CM:75:14','Nascimento:CM:74:8','Scipioni:CM:73:16','Mouzakitis:CM:74:96','Chiquinho:CAM:77:22','Cabella:CAM:76:20','Podence:LW:78:56','GelsonMartins:RW:77:10','Strefezza:RW:78:27','ElKaabi:ST:80:9','Taremi:ST:80:99','Yaremchuk:ST:77:11','Clayton:ST:75:19'],
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