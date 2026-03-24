import { Team, Formation, Match } from './types';

export const LIGA_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/87.png";
export const UCL_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/42.png";

export const INITIAL_STATS = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [] };
export const INITIAL_UCL_STATS = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, rank: 0 };

export const getPositionFit = (playerPos: string, slotPos: string) => {
    if (playerPos === slotPos) return 'good';
    if (playerPos === 'GK' || slotPos === 'GK') return 'bad';

    const compatibleMap: Record<string, string[]> = {
        'CB': ['LB', 'RB', 'CDM'],
        'LB': ['LWB', 'CB', 'LM'],
        'RB': ['RWB', 'CB', 'RM'],
        'LWB': ['LB', 'LM'],
        'RWB': ['RB', 'RM'],
        'CDM': ['CM', 'CB'],
        'CM': ['CDM', 'CAM', 'RM', 'LM'],
        'CAM': ['CM', 'CF', 'ST', 'RW', 'LW'],
        'RM': ['RW', 'RWB', 'CM'],
        'LM': ['LW', 'LWB', 'CM'],
        'RW': ['RM', 'ST', 'CAM'],
        'LW': ['LM', 'ST', 'CAM'],
        'ST': ['CF', 'RW', 'LW', 'CAM'],
        'CF': ['ST', 'CAM']
    };

    if (compatibleMap[playerPos]?.includes(slotPos)) {
        return 'okay'; 
    }
    return 'bad';
};

export const getPenalizedRating = (playerRating: number, playerPos: string, slotPos: string) => {
    const fit = getPositionFit(playerPos, slotPos);
    if (fit === 'good') return playerRating;
    if (fit === 'okay') return Math.max(1, playerRating - 5);
    return Math.max(1, playerRating - 15);
};

export const FORMATIONS: Record<Formation, { position: string, x: number, y: number }[]> = {
  '4-3-3': [ 
    { position: 'GK', x: 5, y: 50 }, 
    { position: 'RB', x: 20, y: 85 }, 
    { position: 'CB', x: 18, y: 56 }, 
    { position: 'CB', x: 18, y: 44 }, 
    { position: 'LB', x: 20, y: 15 }, 
    { position: 'CDM', x: 35, y: 50 }, 
    { position: 'CM', x: 45, y: 68 }, 
    { position: 'CM', x: 45, y: 32 }, 
    { position: 'RW', x: 75, y: 85 }, 
    { position: 'LW', x: 75, y: 15 }, 
    { position: 'ST', x: 80, y: 50 } 
  ],
  '4-4-2': [ 
    { position: 'GK', x: 5, y: 50 }, 
    { position: 'RB', x: 20, y: 85 }, 
    { position: 'CB', x: 18, y: 56 }, 
    { position: 'CB', x: 18, y: 44 }, 
    { position: 'LB', x: 20, y: 15 }, 
    { position: 'RM', x: 45, y: 85 }, 
    { position: 'CM', x: 40, y: 58 }, 
    { position: 'CM', x: 40, y: 42 }, 
    { position: 'LM', x: 45, y: 15 }, 
    { position: 'ST', x: 75, y: 58 }, 
    { position: 'ST', x: 75, y: 42 } 
  ],
  '3-5-2': [ 
    { position: 'GK', x: 5, y: 50 }, 
    { position: 'CB', x: 18, y: 68 }, 
    { position: 'CB', x: 15, y: 50 }, 
    { position: 'CB', x: 18, y: 32 }, 
    { position: 'RM', x: 40, y: 85 }, 
    { position: 'CDM', x: 35, y: 50 }, 
    { position: 'CM', x: 45, y: 65 }, 
    { position: 'CM', x: 45, y: 35 }, 
    { position: 'LM', x: 40, y: 15 }, 
    { position: 'ST', x: 75, y: 58 }, 
    { position: 'ST', x: 75, y: 42 } 
  ],
  '4-2-3-1': [
    { position: 'GK', x: 5, y: 50 },
    { position: 'RB', x: 20, y: 85 },
    { position: 'CB', x: 18, y: 64 },
    { position: 'CB', x: 18, y: 42 },
    { position: 'LB', x: 20, y: 15 },
    { position: 'CDM', x: 35, y: 60 },
    { position: 'CM', x: 35, y: 40 },
    { position: 'CAM', x: 55, y: 50 },
    { position: 'RW', x: 75, y: 85 },
    { position: 'LW', x: 75, y: 15 },
    { position: 'ST', x: 80, y: 50 }
  ]
};

export const getSimulationDays = (seasonYearStr: string) => {
  const startYear = parseInt(seasonYearStr.split('/')[0], 10);
  const startDate = new Date(`${startYear}-08-15T12:00:00Z`);
  const endDate = new Date(`${startYear + 1}-06-10T12:00:00Z`);
  const days = [];
  let d = new Date(startDate);
  let week = 1;
  while (d <= endDate) {
    days.push({
      week: week++,
      date: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay()
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
};

export const getCompetitionWeeks = (seasonYearStr: string) => {
  const startYear = parseInt(seasonYearStr.split('/')[0], 10);
  const days = getSimulationDays(seasonYearStr);
  
  const weekends = days.filter(d => d.dayOfWeek === 6).map(d => d.week);
  const uclStartDate = new Date(`${startYear}-09-15T12:00:00Z`);
  const midweeks = days.filter(d => d.dayOfWeek === 3 && new Date(`${d.date}T12:00:00Z`) >= uclStartDate).map(d => d.week);
  
  const stepLiga = weekends.length / 38;
  const ligaBase = Array.from({length: 38}, (_, i) => weekends[Math.floor(i * stepLiga)]);
  
  const stepUcl = midweeks.length / 17;
  const uclBase = Array.from({length: 17}, (_, i) => midweeks[Math.floor(i * stepUcl)]);

  return { ligaBase, uclBase, days };
};

export const generateMasterSchedule = (ligaTeams: Team[], uclTeams: Team[], seasonYearStr: string): Match[] => {
  const schedule: Match[] = [];
  let matchIdCounter = 1;
  
  const { ligaBase, uclBase, days } = getCompetitionWeeks(seasonYearStr);

  if (ligaTeams.length > 0) {
    const teams = [...ligaTeams].sort(() => Math.random() - 0.5);
    if (teams.length % 2 !== 0) teams.push({ id: 'TBD' } as Team);
    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;

    for (let round = 0; round < totalRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home = teams[match], away = teams[teams.length - 1 - match];
        if (match === 0 && round % 2 === 1) { [home, away] = [away, home]; } 
        else if (match !== 0 && match % 2 === 1) { [home, away] = [away, home]; }

        if (home.id !== 'TBD' && away.id !== 'TBD') {
          const baseWeek = ligaBase[round];
          const offsets = [0, 1]; 
          const offset = offsets[Math.floor(Math.random() * offsets.length)];
          const actualWeek = Math.max(1, Math.min(days.length, baseWeek + offset));
          const actualDateStr = days.find(d => d.week === actualWeek)?.date || days[0].date;
          const actualDate = new Date(`${actualDateStr}T12:00:00Z`);

          schedule.push({ id: `LIGA-${matchIdCounter++}`, week: actualWeek, date: actualDate, homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null, played: false, competition: 'La Liga', stage: 'Regular Season' });
        }
      }
      teams.splice(1, 0, teams.pop()!); 
    }

    const firstHalf = [...schedule];
    firstHalf.forEach(m => {
      const roundIndex = ligaBase.findIndex(w => Math.abs(w - m.week) <= 3);
      if (roundIndex !== -1 && roundIndex + totalRounds < ligaBase.length) {
          const baseWeek = ligaBase[roundIndex + totalRounds];
          const offsets = [0, 1];
          const offset = offsets[Math.floor(Math.random() * offsets.length)];
          const actualWeek = Math.max(1, Math.min(days.length, baseWeek + offset));
          const actualDateStr = days.find(d => d.week === actualWeek)?.date || days[0].date;
          const actualDate = new Date(`${actualDateStr}T12:00:00Z`);
          schedule.push({ ...m, id: `LIGA-${matchIdCounter++}`, week: actualWeek, date: actualDate, homeTeamId: m.awayTeamId, awayTeamId: m.homeTeamId });
      }
    });
  }

  if (uclTeams.length > 0) {
    let teams = [...uclTeams].sort(() => Math.random() - 0.5);
    if (teams.length % 2 !== 0) teams.push({ id: `TBD-PAD`, name: 'TBD', shortName: 'TBD', tier: 2, strength: 0 } as Team);
    const numTeams = teams.length;
    const matchesPerRound = numTeams / 2;

    const UCL_LP_WEEKS = uclBase.slice(0, 8);

    for (let round = 0; round < 8; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home = teams[match], away = teams[numTeams - 1 - match];
        if (match === 0 && round % 2 === 1) { [home, away] = [away, home]; } 
        else if (match !== 0 && match % 2 === 1) { [home, away] = [away, home]; }

        if (!home.id.startsWith('TBD') && !away.id.startsWith('TBD')) {
          const baseWeek = UCL_LP_WEEKS[round];
          const offsets = [-1, 0];
          const offset = offsets[Math.floor(Math.random() * offsets.length)];
          const actualWeek = Math.max(1, Math.min(days.length, baseWeek + offset));
          const actualDateStr = days.find(d => d.week === actualWeek)?.date || days[0].date;
          const actualDate = new Date(`${actualDateStr}T12:00:00Z`);

          schedule.push({ id: `UCL-LP-${matchIdCounter++}`, week: actualWeek, date: actualDate, homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'League Phase' });
        }
      }
      teams.splice(1, 0, teams.pop()!); 
    }
  }

  return schedule;
};