import { PastSeason, Team, ManagerProfile } from '../types';
import { INITIAL_STATS, INITIAL_UCL_STATS } from '../constants';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
    ...options, 
    headers: { 
      ...headers, 
      ...(options.headers as Record<string, string>) 
    } 
  });

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/login')) {
      localStorage.removeItem('auth_token'); 
      window.location.reload();
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API Request failed: ${response.statusText}`);
  }
  
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  const json = JSON.parse(text);
  return json.data !== undefined ? json.data : json;
}

export const loginAccount = async (email: string, password: string): Promise<string> => {
  const res = await apiRequest<{ token: string }>('/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password }) 
  });
  localStorage.setItem('auth_token', res.token); 
  return res.token;
};

export const registerAccount = async (name: string, email: string, password: string): Promise<string> => {
  const res = await apiRequest<{ token: string }>('/register', { 
    method: 'POST', 
    body: JSON.stringify({ name, email, password }) 
  });
  localStorage.setItem('auth_token', res.token); 
  return res.token;
};

export const fetchTeams = async (): Promise<Team[]> => {
  const teams = await apiRequest<any[]>('/teams');
  
  return teams.map((t: any) => {
    const parsedStats = typeof t.stats === 'string' ? JSON.parse(t.stats) : t.stats;
    const parsedUclStats = typeof t.uclStats === 'string' ? JSON.parse(t.uclStats) : t.uclStats;
    const isUcl = Boolean(t.isUCL || t.isucl || t.is_ucl);

    return {
      id: t.id, 
      name: t.name, 
      shortName: t.shortName || t.shortname || t.short_name,
      logoUrl: t.logoUrl || t.logourl || t.logo_url,
      primaryColor: t.primaryColor || t.primarycolor || t.primary_color || '#333333',
      secondaryColor: t.secondaryColor || t.secondarycolor || t.secondary_color || '#ffffff',
      strength: t.strength, 
      tier: t.tier, 
      isUCL: isUcl,
      roster: (t.roster || []).map((p: any) => ({ 
        ...p, 
        offField: Boolean(p.offField || p.offfield || p.off_field) 
      })),
      formation: t.formation || '4-3-3', // Fixed: Now reads from backend, defaults to 4-3-3 if missing
      stats: parsedStats || { ...INITIAL_STATS, form: [] },
      uclStats: isUcl ? (parsedUclStats || { ...INITIAL_UCL_STATS }) : undefined
    };
  });
};

export const fetchProfiles = async (): Promise<ManagerProfile[]> => {
  const profiles = await apiRequest<any[]>('/managers');
  
  return profiles.map(p => {
    // 1. Determine current team name from the attached saved game
    let currentTeamName = 'Free Agent';
    const savedGame = (p.saved_games && p.saved_games[0]) || (p.savedGames && p.savedGames[0]);

    if (savedGame) {
      currentTeamName = savedGame.team_name || savedGame.teamName || 'Free Agent';

      // 2. If no direct name is stored, look it up in the teams_snapshot
      if (currentTeamName === 'Free Agent' && (savedGame.user_team_id || savedGame.userTeamId) && savedGame.teams_snapshot) {
        try {
          const snapshot = typeof savedGame.teams_snapshot === 'string' 
            ? JSON.parse(savedGame.teams_snapshot) 
            : savedGame.teams_snapshot;
          
          const teamId = savedGame.user_team_id || savedGame.userTeamId;
          const userTeam = snapshot.find((t: any) => t.id === teamId);
          
          if (userTeam && userTeam.name) {
            currentTeamName = userTeam.name;
          }
        } catch (e) {
          console.error("Failed to parse teams_snapshot for team lookup.");
        }
      }
    }

    // 3. Map and return the profile while injecting the savedGames context back in
    return {
      id: p.id, 
      name: p.name,
      history: (p.histories || p.history || []).map((h: any) => ({
        id: h.id,
        seasonYear: h.seasonYear,
        teamId: h.teamId,
        teamName: h.teamName,
        position: h.position,
        points: h.points,
        wonLiga: Boolean(h.wonLiga || h.wonTrophy),
        wonUcl: Boolean(h.wonUcl),
        wins: h.wins || 0,
        draws: h.draws || 0,
        losses: h.losses || 0,
        biggestWin: h.biggestWin || 'N/A',
        biggestLoss: h.biggestLoss || 'N/A',
        timestamp: new Date(h.created_at || Date.now()).getTime()
      })),
      createdAt: new Date(p.created_at || p.createdAt).getTime(),
      savedGames: [{ team_name: currentTeamName }]
    } as unknown as ManagerProfile;
  });
};

export const createProfile = async (name: string): Promise<ManagerProfile> => {
  const newProfile = await apiRequest<any>('/managers', { 
    method: 'POST', 
    body: JSON.stringify({ name }) 
  });
  
  return { 
    id: newProfile.id, 
    name: newProfile.name, 
    history: [], 
    createdAt: new Date(newProfile.created_at || Date.now()).getTime() 
  };
};

export const deleteProfile = async (id: string): Promise<void> => {
  await apiRequest(`/managers/${id}`, { method: 'DELETE' });
};

export const updateProfileName = async (id: string, name: string): Promise<void> => {
  await apiRequest(`/managers/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({ name }) 
  });
};

export const saveSeasonResult = async (profileId: string, result: Omit<PastSeason, 'id' | 'timestamp'>): Promise<PastSeason> => {
  const response = await apiRequest<any>(`/managers/${profileId}/history`, { 
    method: 'POST', 
    body: JSON.stringify(result) 
  });
  
  return { 
    ...result, 
    id: response.id, 
    timestamp: new Date(response.created_at || Date.now()).getTime() 
  };
};

export interface GameSaveData { 
  currentWeek: number; 
  userTeamId: string; 
  schedule: any[]; 
  teams: any[]; 
}

export const fetchSavedGame = async (managerId: string): Promise<GameSaveData | null> => {
  try {
    const data = await apiRequest<any>(`/managers/${managerId}/save`);
    if (!data) return null;
    
    return { 
      currentWeek: data.currentWeek || data.current_week, 
      userTeamId: data.userTeamId || data.user_team_id, 
      schedule: data.schedule.map((m: any) => ({ ...m, date: new Date(m.date) })), 
      teams: data.teams_snapshot 
    };
  } catch (error) { 
    return null; 
  }
};

export const saveGame = async (managerId: string, gameState: GameSaveData): Promise<void> => {
  await apiRequest(`/managers/${managerId}/save`, { 
    method: 'POST', 
    body: JSON.stringify(gameState) 
  });
};

export const fetchCurrentUser = async (): Promise<{ name: string, email: string }> => {
  return await apiRequest<{ name: string, email: string }>('/user');
};

export const updateAccountName = async (name: string): Promise<void> => {
  await apiRequest('/user', { 
    method: 'PUT', 
    body: JSON.stringify({ name }) 
  });
};