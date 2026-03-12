import { Team, Formation, Match } from './types';

export const LIGA_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/87.png";
export const UCL_LOGO_URL = "https://images.fotmob.com/image_resources/logo/leaguelogo/42.png";

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
        if (match === 0 && round % 2 === 1) { const temp = home; home = away; away = temp; } 
        else if (match !== 0 && match % 2 === 1) { const temp = home; home = away; away = temp; }

        if (home.id !== 'TBD' && away.id !== 'TBD') {
          schedule.push({ id: `LIGA-${matchIdCounter++}`, week: LIGA_WEEKS[round], date: getDateForWeek(LIGA_WEEKS[round]), homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null, played: false, competition: 'La Liga', stage: 'Regular Season' });
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

  // UCL GENERATION
  if (uclTeams.length > 0) {
    let teams = [...uclTeams].sort(() => Math.random() - 0.5);
    if (teams.length % 2 !== 0) teams.push({ id: `TBD-PAD`, name: 'TBD', shortName: 'TBD', tier: 2, strength: 0 } as Team);
    const numTeams = teams.length;
    const matchesPerRound = numTeams / 2;

    for (let round = 0; round < 8; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home = teams[match], away = teams[numTeams - 1 - match];
        if (match === 0 && round % 2 === 1) { [home, away] = [away, home]; } 
        else if (match !== 0 && match % 2 === 1) { [home, away] = [away, home]; }

        if (!home.id.startsWith('TBD') && !away.id.startsWith('TBD')) {
          const matchWeek = UCL_LP_WEEKS[round];
          schedule.push({ id: `UCL-LP-${matchIdCounter++}`, week: matchWeek, date: getDateForWeek(matchWeek), homeTeamId: home.id, awayTeamId: away.id, homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'League Phase' });
        }
      }
      teams.splice(1, 0, teams.pop()!); 
    }
  }

  return schedule;
};