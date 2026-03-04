import { PastSeason, Team, ManagerProfile } from '../types';
import { TEAMS_DATA, INITIAL_STATS } from '../constants';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const DB_PROFILES_KEY = 'laliga_manager_profiles_v2';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Append Bearer token to all requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers as Record<string, string> }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.reload(); // Force logout
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API Request failed: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

// --- AUTH METHODS ---
export const loginAccount = async (email: string, password: string): Promise<string> => {
  const res = await apiRequest<any>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem('auth_token', res.token);
  return res.token;
};

export const registerAccount = async (email: string, password: string): Promise<string> => {
  const res = await apiRequest<any>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem('auth_token', res.token);
  return res.token;
};

// --- GAME METHODS ---
export const fetchTeams = async (): Promise<Team[]> => {
  try {
    const teams = await apiRequest<any[]>('/teams');
    return teams.map((t: any) => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName || t.shortname || t.short_name,
      logoUrl: t.logoUrl || t.logourl || t.logo_url,
      primaryColor: t.primaryColor || t.primarycolor || t.primary_color || '#333333',
      secondaryColor: t.secondaryColor || t.secondarycolor || t.secondary_color || '#ffffff',
      strength: t.strength,
      tier: t.tier,
      isUCL: Boolean(t.isUCL || t.isucl || t.is_ucl),
      roster: t.roster ? t.roster.map((p: any) => ({
        ...p,
        offField: Boolean(p.offField || p.offfield || p.off_field)
      })) : [],
      formation: '4-3-3',
      stats: t.stats || { ...INITIAL_STATS, form: [] },
      uclStats: t.uclStats || t.uclstats || t.ucl_stats || undefined
    }));
  } catch (error) {
    console.warn("Backend unreachable, using local data for Teams.");
    await delay(300);
    return TEAMS_DATA.map(t => ({
      ...t,
      tier: 1,
      stats: { ...INITIAL_STATS, form: [] },
      roster: [],
      formation: '4-3-3'
    })) as Team[];
  }
};

export const fetchProfiles = async (): Promise<ManagerProfile[]> => {
  try {
    const profiles = await apiRequest<any[]>('/managers');
    return profiles.map(p => ({
      id: p.id,
      name: p.name,
      history: p.history || [],
      createdAt: new Date(p.created_at || p.createdAt).getTime()
    }));
  } catch (error) {
    console.warn("Backend unreachable, using local storage for Profiles.");
    await delay(200);
    const json = localStorage.getItem(DB_PROFILES_KEY);
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }
};

export const createProfile = async (name: string): Promise<ManagerProfile> => {
  try {
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
  } catch (error) {
    console.warn("Backend unreachable, creating profile locally.");
    await delay(300);
    const profiles = await fetchProfilesFallback();
    const newProfile: ManagerProfile = { id: crypto.randomUUID(), name, history: [], createdAt: Date.now() };
    localStorage.setItem(DB_PROFILES_KEY, JSON.stringify([...profiles, newProfile]));
    return newProfile;
  }
};

export const deleteProfile = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/managers/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.warn("Backend unreachable, deleting profile locally.");
    await delay(200);
    const profiles = await fetchProfilesFallback();
    const filtered = profiles.filter(p => p.id !== id);
    localStorage.setItem(DB_PROFILES_KEY, JSON.stringify(filtered));
  }
};

export const updateProfileName = async (id: string, name: string): Promise<void> => {
  try {
    await apiRequest(`/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  } catch (error) {
    console.warn("Backend unreachable, updating profile locally.");
    await delay(200);
    const profiles = await fetchProfilesFallback();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx].name = name;
      localStorage.setItem(DB_PROFILES_KEY, JSON.stringify(profiles));
    }
  }
};

export const saveSeasonResult = async (profileId: string, result: Omit<PastSeason, 'id' | 'timestamp'>): Promise<PastSeason> => {
  try {
    const response = await apiRequest<any>(`/managers/${profileId}/history`, {
      method: 'POST',
      body: JSON.stringify(result)
    });
    return {
      ...result,
      id: response.id,
      timestamp: new Date(response.created_at || Date.now()).getTime()
    };
  } catch (error) {
    console.warn("Backend unreachable, saving history locally.");
    await delay(500);
    const profiles = await fetchProfilesFallback();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) throw new Error("Profile not found locally");
    const newRecord: PastSeason = { ...result, id: crypto.randomUUID(), timestamp: Date.now() };
    profiles[idx].history = [newRecord, ...profiles[idx].history];
    localStorage.setItem(DB_PROFILES_KEY, JSON.stringify(profiles));
    return newRecord;
  }
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
    const hydratedSchedule = data.schedule.map((m: any) => ({
      ...m,
      date: new Date(m.date)
    }));
    return {
      currentWeek: data.currentWeek,
      userTeamId: data.userTeamId,
      schedule: hydratedSchedule,
      teams: data.teams_snapshot
    };
  } catch (error) {
    console.warn("Could not load save from backend.");
    return null;
  }
};

export const saveGame = async (managerId: string, gameState: GameSaveData): Promise<void> => {
  try {
    await apiRequest(`/managers/${managerId}/save`, {
      method: 'POST',
      body: JSON.stringify(gameState)
    });
  } catch (error) {
    console.error("Failed to save game:", error);
  }
};

async function fetchProfilesFallback(): Promise<ManagerProfile[]> {
  const json = localStorage.getItem(DB_PROFILES_KEY);
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}