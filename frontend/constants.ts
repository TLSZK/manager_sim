import { Team, Player, Formation, Match } from './types';

export const LIGA_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/87.png";
export const UCL_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/42.png";

export const TEAMS_DATA: Omit<Team, 'stats' | 'roster' | 'formation'>[] = [
  { id: 'bar', name: 'Barcelona', tier: 1, shortName: 'BAR', strength: 99, primaryColor: '#a50044', secondaryColor: '#004d98', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png' },
  { id: 'rma', name: 'Real Madrid', tier: 1, shortName: 'RMA', strength: 92, primaryColor: '#ffffff', secondaryColor: '#1e3a8a', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
  { id: 'atm', name: 'Atlético Madrid', tier: 1, shortName: 'ATM', strength: 88, primaryColor: '#cb3524', secondaryColor: '#171796', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png' },
  { id: 'gir', name: 'Girona', tier: 1, shortName: 'GIR', strength: 84, primaryColor: '#ef3340', secondaryColor: '#ffffff', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png' },
  { id: 'ath', name: 'Athletic Club', tier: 1, shortName: 'ATH', strength: 83, primaryColor: '#e30613', secondaryColor: '#000000', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png' },
  { id: 'rso', name: 'Real Sociedad', tier: 1, shortName: 'RSO', strength: 82, primaryColor: '#0066b2', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
  { id: 'bet', name: 'Real Betis', tier: 1, shortName: 'BET', strength: 80, primaryColor: '#0bb363', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png' },
  { id: 'vil', name: 'Villarreal', tier: 1, shortName: 'VIL', strength: 79, primaryColor: '#fbe10f', secondaryColor: '#00519e', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png' },
  { id: 'val', name: 'Valencia', tier: 1, shortName: 'VAL', strength: 77, primaryColor: '#ffffff', secondaryColor: '#000000', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png' },
  { id: 'osa', name: 'Osasuna', tier: 1, shortName: 'OSA', strength: 76, primaryColor: '#da291c', secondaryColor: '#0a1d56', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png' },
  { id: 'get', name: 'Getafe', tier: 1, shortName: 'GET', strength: 75, primaryColor: '#005999', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png' },
  { id: 'cel', name: 'Celta Vigo', tier: 1, shortName: 'CEL', strength: 75, primaryColor: '#8ac3ee', secondaryColor: '#ce0e2d', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png' },
  { id: 'sev', name: 'Sevilla', tier: 1, shortName: 'SEV', strength: 76, primaryColor: '#ffffff', secondaryColor: '#d4001f', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png' },
  { id: 'mal', name: 'Mallorca', tier: 1, shortName: 'MAL', strength: 74, primaryColor: '#e20613', secondaryColor: '#000000', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png' },
  { id: 'ray', name: 'Rayo Vallecano', tier: 1, shortName: 'RAY', strength: 73, primaryColor: '#ffffff', secondaryColor: '#ce0e2d', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png' },
  { id: 'ala', name: 'Alavés', tier: 1, shortName: 'ALA', strength: 72, primaryColor: '#0057a6', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png' },
  { id: 'pal', name: 'Las Palmas', tier: 1, shortName: 'PAL', strength: 71, primaryColor: '#ffc400', secondaryColor: '#00539f', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png' },
  { id: 'leg', name: 'Leganés', tier: 1, shortName: 'LEG', strength: 70, primaryColor: '#0055a4', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png' },
  { id: 'val2', name: 'Valladolid', tier: 1, shortName: 'VLD', strength: 69, primaryColor: '#5c2d7f', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png' },
  { id: 'esp', name: 'Espanyol', tier: 1, shortName: 'ESP', strength: 70, primaryColor: '#338ecc', secondaryColor: '#ffffff', logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png' },
];

export const EUROPEAN_TEAMS: Omit<Team, 'stats' | 'roster' | 'formation'>[] = [
  { id: 'mci', name: 'Manchester City', tier: 2, shortName: 'MCI', strength: 96, primaryColor: '#6CABDD', secondaryColor: '#1C2C5B', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png' },
  { id: 'liv', name: 'Liverpool', tier: 2, shortName: 'LIV', strength: 96, primaryColor: '#C8102E', secondaryColor: '#00B2A9', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png' },
  { id: 'ars', name: 'Arsenal', tier: 2, shortName: 'ARS', strength: 94, primaryColor: '#EF0107', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png' },
  { id: 'avl', name: 'Aston Villa', tier: 2, shortName: 'AVL', strength: 85, primaryColor: '#95BBE5', secondaryColor: '#670E36', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png' },
  { id: 'bay', name: 'Bayern Munich', tier: 2, shortName: 'BAY', strength: 96, primaryColor: '#DC052D', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png' },
  { id: 'dor', name: 'Dortmund', tier: 2, shortName: 'BVB', strength: 89, primaryColor: '#FDE100', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png' },
  { id: 'rbl', name: 'Leipzig', tier: 2, shortName: 'RBL', strength: 86, primaryColor: '#DD0741', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png' },
  { id: 'lev', name: 'Leverkusen', tier: 2, shortName: 'B04', strength: 92, primaryColor: '#E32221', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png' },
  { id: 'stu', name: 'Stuttgart', tier: 2, shortName: 'VFB', strength: 82, primaryColor: '#FFFFFF', secondaryColor: '#E32221', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png' },
  { id: 'int', name: 'Inter', tier: 2, shortName: 'INT', strength: 92, primaryColor: '#010E80', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png' },
  { id: 'mil', name: 'Milan', tier: 2, shortName: 'MIL', strength: 88, primaryColor: '#FB090B', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png' },
  { id: 'juv', name: 'Juventus', tier: 2, shortName: 'JUV', strength: 87, primaryColor: '#000000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png' },
  { id: 'ata', name: 'Atalanta', tier: 2, shortName: 'ATA', strength: 85, primaryColor: '#1E71B8', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png' },
  { id: 'bol', name: 'Bologna', tier: 2, shortName: 'BOL', strength: 80, primaryColor: '#1A2F48', secondaryColor: '#A21C26', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png' },
  { id: 'psg', name: 'Paris SG', tier: 2, shortName: 'PSG', strength: 94, primaryColor: '#004170', secondaryColor: '#DA291C', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png' },
  { id: 'mon', name: 'Monaco', tier: 2, shortName: 'MON', strength: 83, primaryColor: '#E51D1F', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png' },
  { id: 'bre', name: 'Brest', tier: 2, shortName: 'SB29', strength: 78, primaryColor: '#DD0000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png' },
  { id: 'lil', name: 'Lille', tier: 2, shortName: 'LOSC', strength: 82, primaryColor: '#E01E13', secondaryColor: '#20325F', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png' },
  { id: 'psv', name: 'PSV', tier: 2, shortName: 'PSV', strength: 81, primaryColor: '#FF0000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png' },
  { id: 'fey', name: 'Feyenoord', tier: 2, shortName: 'FEY', strength: 80, primaryColor: '#FF0000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png' },
  { id: 'spo', name: 'Sporting', tier: 2, shortName: 'SCP', strength: 84, primaryColor: '#008000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png' },
  { id: 'ben', name: 'Benfica', tier: 2, shortName: 'SLB', strength: 83, primaryColor: '#E30613', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png' },
  { id: 'bru', name: 'Brugge', tier: 2, shortName: 'CLB', strength: 78, primaryColor: '#000000', secondaryColor: '#0067CE', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png' },
  { id: 'cel_sco', name: 'Celtic', tier: 2, shortName: 'CEL', strength: 77, primaryColor: '#018749', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png' },
  { id: 'sha', name: 'Shakhtar', tier: 2, shortName: 'SHK', strength: 78, primaryColor: '#F58220', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9728.png' },
  { id: 'sal', name: 'Salzburg', tier: 2, shortName: 'RBS', strength: 76, primaryColor: '#D11241', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10013.png' },
  { id: 'you', name: 'Young Boys', tier: 2, shortName: 'YB', strength: 74, primaryColor: '#FFD700', secondaryColor: '#000000', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10192.png' },
  { id: 'zag', name: 'Dinamo Zagreb', tier: 2, shortName: 'DIN', strength: 74, primaryColor: '#00539F', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10156.png' },
  { id: 'crv', name: 'Red Star', tier: 2, shortName: 'RSB', strength: 73, primaryColor: '#E30613', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8687.png' },
  { id: 'spa', name: 'Sparta Prague', tier: 2, shortName: 'SPA', strength: 75, primaryColor: '#A41034', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10247.png' },
  { id: 'fer', name: 'Ferencváros', tier: 2, shortName: 'FTC', strength: 72, primaryColor: '#1A8C43', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8222.png' },
  { id: 'stg', name: 'Sturm Graz', tier: 2, shortName: 'STU', strength: 72, primaryColor: '#000000', secondaryColor: '#FFFFFF', isUCL: true, logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/10014.png' },
];

export const INITIAL_STATS = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [] };
export const INITIAL_UCL_STATS = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, rank: 0 };

export const SIMULATION_SCHEDULE: { week: number, type: 'LIGA' | 'UCL' | 'UCL-KO', date: string }[] = [
  { week: 1, type: 'LIGA', date: '2025-08-16' }, { week: 2, type: 'LIGA', date: '2025-08-23' },
  { week: 3, type: 'LIGA', date: '2025-08-30' }, { week: 4, type: 'LIGA', date: '2025-09-13' },
  { week: 5, type: 'UCL', date: '2025-09-17' }, { week: 6, type: 'LIGA', date: '2025-09-20' },
  { week: 7, type: 'LIGA', date: '2025-09-27' }, { week: 8, type: 'UCL', date: '2025-10-01' },
  { week: 9, type: 'LIGA', date: '2025-10-04' }, { week: 10, type: 'LIGA', date: '2025-10-18' },
  { week: 11, type: 'UCL', date: '2025-10-22' }, { week: 12, type: 'LIGA', date: '2025-10-25' },
  { week: 13, type: 'LIGA', date: '2025-11-01' }, { week: 14, type: 'UCL', date: '2025-11-05' },
  { week: 15, type: 'LIGA', date: '2025-11-08' }, { week: 16, type: 'LIGA', date: '2025-11-22' },
  { week: 17, type: 'UCL', date: '2025-11-26' }, { week: 18, type: 'LIGA', date: '2025-11-29' },
  { week: 19, type: 'LIGA', date: '2025-12-06' }, { week: 20, type: 'UCL', date: '2025-12-10' },
  { week: 21, type: 'LIGA', date: '2025-12-13' }, { week: 22, type: 'LIGA', date: '2025-12-20' },
  { week: 23, type: 'LIGA', date: '2026-01-03' }, { week: 24, type: 'LIGA', date: '2026-01-10' },
  { week: 25, type: 'LIGA', date: '2026-01-17' }, { week: 26, type: 'UCL', date: '2026-01-21' },
  { week: 27, type: 'LIGA', date: '2026-01-24' }, { week: 28, type: 'UCL', date: '2026-01-29' },
  { week: 29, type: 'LIGA', date: '2026-02-01' }, { week: 30, type: 'UCL-KO', date: '2026-02-11' },
  { week: 31, type: 'LIGA', date: '2026-02-15' }, { week: 32, type: 'UCL-KO', date: '2026-02-18' },
  { week: 33, type: 'LIGA', date: '2026-02-22' }, { week: 34, type: 'LIGA', date: '2026-03-01' },
  { week: 35, type: 'UCL-KO', date: '2026-03-04' }, { week: 36, type: 'LIGA', date: '2026-03-08' },
  { week: 37, type: 'UCL-KO', date: '2026-03-11' }, { week: 38, type: 'LIGA', date: '2026-03-15' },
  { week: 39, type: 'LIGA', date: '2026-03-29' }, { week: 40, type: 'LIGA', date: '2026-04-05' },
  { week: 41, type: 'UCL-KO', date: '2026-04-08' }, { week: 42, type: 'LIGA', date: '2026-04-12' },
  { week: 43, type: 'UCL-KO', date: '2026-04-15' }, { week: 44, type: 'LIGA', date: '2026-04-19' },
  { week: 45, type: 'LIGA', date: '2026-04-22' }, { week: 46, type: 'LIGA', date: '2026-04-26' },
  { week: 47, type: 'UCL-KO', date: '2026-04-29' }, { week: 48, type: 'LIGA', date: '2026-05-03' },
  { week: 49, type: 'UCL-KO', date: '2026-05-06' }, { week: 50, type: 'LIGA', date: '2026-05-10' },
  { week: 51, type: 'LIGA', date: '2026-05-13' }, { week: 52, type: 'LIGA', date: '2026-05-17' },
  { week: 53, type: 'LIGA', date: '2026-05-24' }, { week: 54, type: 'LIGA', date: '2026-05-31' },
  { week: 55, type: 'UCL-KO', date: '2026-06-06' },
];

const REAL_PLAYERS: Record<string, Partial<Player>[]> = {
  'bar': [ { name: 'Joan Garcia', number: 1, position: 'GK', rating: 95 }, { name: 'Balde', number: 3, position: 'DEF', rating: 87 }, { name: 'Cubarsí', number: 2, position: 'DEF', rating: 88 }, { name: 'Araújo', number: 4, position: 'DEF', rating: 88 }, { name: 'Koundé', number: 23, position: 'DEF', rating: 86 }, { name: 'Pedri', number: 8, position: 'MID', rating: 96 }, { name: 'De Jong', number: 21, position: 'MID', rating: 87 }, { name: 'Gavi', number: 6, position: 'MID', rating: 90 }, { name: 'Raphinha', number: 11, position: 'FWD', rating: 96 }, { name: 'Lewandowski', number: 9, position: 'FWD', rating: 90 }, { name: 'Yamal', number: 19, position: 'FWD', rating: 96 }, { name: 'Szczesny', number: 13, position: 'GK', rating: 86 }, { name: 'Christensen', number: 15, position: 'DEF', rating: 83 }, { name: 'Fermin', number: 16, position: 'MID', rating: 80 }, { name: 'Ferran', number: 7, position: 'FWD', rating: 81 }, { name: 'Olmo', number: 20, position: 'MID', rating: 85 } ],
  'rma': [ { name: 'Courtois', number: 1, position: 'GK', rating: 90 }, { name: 'Carvajal', number: 2, position: 'DEF', rating: 86 }, { name: 'Militao', number: 3, position: 'DEF', rating: 87 }, { name: 'Rüdiger', number: 22, position: 'DEF', rating: 88 }, { name: 'Mendy', number: 23, position: 'DEF', rating: 84 }, { name: 'Tchouaméni', number: 14, position: 'MID', rating: 86 }, { name: 'Valverde', number: 8, position: 'MID', rating: 89 }, { name: 'Bellingham', number: 5, position: 'MID', rating: 91 }, { name: 'Rodrygo', number: 11, position: 'FWD', rating: 86 }, { name: 'Mbappé', number: 9, position: 'FWD', rating: 92 }, { name: 'Vinícius Jr', number: 7, position: 'FWD', rating: 91 }, { name: 'Lunin', number: 13, position: 'GK', rating: 82 } ],
  'mci': [ { name: 'Ederson', number: 31, position: 'GK', rating: 89 }, { name: 'Dias', number: 3, position: 'DEF', rating: 89 }, { name: 'Gvardiol', number: 24, position: 'DEF', rating: 86 }, { name: 'Rodri', number: 16, position: 'MID', rating: 93 }, { name: 'De Bruyne', number: 17, position: 'MID', rating: 91 }, { name: 'Haaland', number: 9, position: 'FWD', rating: 95 } ]
};

export const FORMATIONS: Record<Formation, { position: string, x: number, y: number }[]> = {
  '4-3-3': [ { position: 'GK', x: 5, y: 50 }, { position: 'DEF', x: 20, y: 15 }, { position: 'DEF', x: 18, y: 38 }, { position: 'DEF', x: 18, y: 62 }, { position: 'DEF', x: 20, y: 85 }, { position: 'MID', x: 40, y: 25 }, { position: 'MID', x: 35, y: 50 }, { position: 'MID', x: 40, y: 75 }, { position: 'FWD', x: 70, y: 15 }, { position: 'FWD', x: 75, y: 50 }, { position: 'FWD', x: 70, y: 85 } ],
  '4-4-2': [ { position: 'GK', x: 5, y: 50 }, { position: 'DEF', x: 20, y: 15 }, { position: 'DEF', x: 18, y: 38 }, { position: 'DEF', x: 18, y: 62 }, { position: 'DEF', x: 20, y: 85 }, { position: 'MID', x: 45, y: 15 }, { position: 'MID', x: 40, y: 38 }, { position: 'MID', x: 40, y: 62 }, { position: 'MID', x: 45, y: 85 }, { position: 'FWD', x: 70, y: 35 }, { position: 'FWD', x: 70, y: 65 } ],
  '3-5-2': [ { position: 'GK', x: 5, y: 50 }, { position: 'DEF', x: 18, y: 25 }, { position: 'DEF', x: 15, y: 50 }, { position: 'DEF', x: 18, y: 75 }, { position: 'MID', x: 30, y: 10 }, { position: 'MID', x: 35, y: 35 }, { position: 'MID', x: 35, y: 65 }, { position: 'MID', x: 30, y: 90 }, { position: 'MID', x: 45, y: 50 }, { position: 'FWD', x: 70, y: 35 }, { position: 'FWD', x: 70, y: 65 } ]
};

export const generateMasterSchedule = (ligaTeams: Team[], uclTeams: Team[], seasonYearStr: string): Match[] => {
  const schedule: Match[] = [];
  let matchIdCounter = 1;

  const startYear = parseInt(seasonYearStr.split('/')[0], 10);

  const getDateForWeek = (week: number) => {
    const entry = SIMULATION_SCHEDULE.find(s => s.week === week);
    if (!entry) return new Date();
    const monthStr = entry.date.split('-')[1];
    const isNextYear = parseInt(monthStr, 10) < 7;
    const year = isNextYear ? startYear + 1 : startYear;
    return new Date(`${year}-${monthStr}-${entry.date.split('-')[2]}T12:00:00Z`);
  };

  const KNOCKOUT_WEEKS = [30, 32, 35, 37, 41, 43, 47, 49, 55];
  const UCL_LP_WEEKS = [3, 6, 9, 12, 15, 18, 21, 24];
  const ALL_UCL_WEEKS = [...UCL_LP_WEEKS, ...KNOCKOUT_WEEKS];

  const LIGA_WEEKS: number[] = [];
  for (let i = 1; i <= 55; i++) {
    if (!ALL_UCL_WEEKS.includes(i)) LIGA_WEEKS.push(i);
  }

  // LIGA GENERATION
  if (ligaTeams.length > 0) {
    const teams = [...ligaTeams];
    if (teams.length % 2 !== 0) teams.push({ id: 'TBD' } as Team);
    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;

    for (let round = 0; round < totalRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home = teams[match], away = teams[teams.length - 1 - match];
        if (match === 0) { if (round % 2 === 1) { const temp = home; home = away; away = temp; } } 
        else { if (match % 2 === 1) { const temp = home; home = away; away = temp; } }

        if (home.id !== 'TBD' && away.id !== 'TBD') {
          schedule.push({
            id: `LIGA-${matchIdCounter++}`, week: LIGA_WEEKS[round], date: getDateForWeek(LIGA_WEEKS[round]), 
            homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null,
            played: false, competition: 'La Liga', stage: 'Regular Season'
          });
        }
      }
      teams.splice(1, 0, teams.pop()!); 
    }

    const firstHalf = [...schedule];
    firstHalf.forEach(m => {
      const roundIndex = LIGA_WEEKS.indexOf(m.week);
      const newWeek = LIGA_WEEKS[roundIndex + totalRounds];
      schedule.push({ ...m, id: `LIGA-${matchIdCounter++}`, week: newWeek, date: getDateForWeek(newWeek), homeTeamId: m.awayTeamId, awayTeamId: m.homeTeamId });
    });
  }

  // UCL GENERATION - BALANCED 8 ROUNDS
  if (uclTeams.length > 0) {
    let teams = [...uclTeams].sort(() => Math.random() - 0.5);
    if (teams.length % 2 !== 0) teams.push({ id: `TBD-PAD`, name: 'TBD', shortName: 'TBD', tier: 2, strength: 0 } as Team);

    const numTeams = teams.length;
    const matchesPerRound = numTeams / 2;

    for (let round = 0; round < 8; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home = teams[match], away = teams[numTeams - 1 - match];
        if (match === 0) { if (round % 2 === 1) { [home, away] = [away, home]; } } 
        else { if (match % 2 === 1) { [home, away] = [away, home]; } }

        if (!home.id.startsWith('TBD') && !away.id.startsWith('TBD')) {
          const matchWeek = UCL_LP_WEEKS[round];
          schedule.push({
            id: `UCL-LP-${matchIdCounter++}`, week: matchWeek, date: getDateForWeek(matchWeek),
            homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null, played: false, 
            competition: 'Champions League', stage: 'League Phase'
          });
        }
      }
      teams.splice(1, 0, teams.pop()!); 
    }
  }

  return schedule;
};

export const generateRoster = (teamId: string, strength: number): Player[] => {
  const customPlayers = REAL_PLAYERS[teamId];
  const getPosition = (i: number): Player['position'] => { if (i === 0 || i === 11) return 'GK'; if (i <= 4 || (i >= 12 && i <= 14)) return 'DEF'; if (i <= 7 || (i >= 15 && i <= 17)) return 'MID'; return 'FWD'; };
  const getRating = (base: number) => Math.min(99, Math.max(50, Math.floor(base + (Math.random() * 10 - 5))));
  if (customPlayers) {
    return Array.from({ length: 22 }).map((_, index) => {
      const custom = customPlayers[index];
      if (custom) return { id: `${teamId}-p-${index}`, name: custom.name!, number: custom.number!, position: custom.position!, rating: custom.rating!, offField: index >= 11 };
      return { id: `${teamId}-p-${index}`, name: `Reserve ${index + 1}`, number: 30 + index, position: getPosition(index), rating: getRating(strength - 10), offField: true };
    });
  }
  return Array.from({ length: 22 }).map((_, index) => ({ id: `${teamId}-p-${index}`, name: `Player ${index + 1}`, number: index + 1, position: getPosition(index), rating: getRating(strength), offField: index > 10 }));
};