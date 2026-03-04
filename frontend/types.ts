
export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number; // 0-100
  offField: boolean;
}

export type Formation = '4-3-3' | '4-4-2' | '3-5-2';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  strength: number; // 1-100 rating
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;

  // Roster & Tactics (Frontend specific, often generated after fetch)
  roster?: Player[];
  formation?: Formation;

  // Flags & Classification
  tier: number;       // 1 = La Liga, 2 = European/Rest of World
  isUCL?: boolean;    // Eligible for Champions League

  // Domestic Stats
  stats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
  };

  // European Stats
  uclStats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
    rank: number;
  };
}

export type Competition = 'La Liga' | 'Champions League';
export type Stage = 'Regular Season' | 'League Phase' | 'Playoffs' | 'Round of 16' | 'Quarter-finals' | 'Semi-finals' | 'Final';

export interface Match {
  id: string;
  week: number; // Simulation Step Index
  date: Date; // Specific calendar date
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  competition: Competition;
  stage: Stage;
  isLeg2?: boolean;
  aggHomeScore?: number; // Snapshot of agg score after game
  aggAwayScore?: number;
  placeholder?: string; // e.g. "Winner PO1" for future rounds
  homePenalties?: number;
  awayPenalties?: number;
}

export type SimulationState = 'setup' | 'select_team' | 'ready' | 'squad_management' | 'playing_match' | 'season_over';

export interface SeasonSummary {
  position: number;
  points: number;
  wonLeague: boolean;
  uclResult?: string; // e.g., "Semi-finalist"
  message: string;
}

export interface PastSeason {
  id: string;
  seasonYear: string; // e.g., "2024/25"
  teamId: string;
  teamName: string;
  position: number;
  points: number;
  wonTrophy: boolean;
  timestamp: number;
}

export interface ManagerProfile {
  id: string;
  name: string;
  history: PastSeason[];
  createdAt: number;
}