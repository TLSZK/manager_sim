import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { generateMasterSchedule, INITIAL_STATS, INITIAL_UCL_STATS, SIMULATION_SCHEDULE, LIGA_LOGO_URL, UCL_LOGO_URL } from './constants';
import { Team, Match, SimulationState, SeasonSummary, Competition, ManagerProfile as ManagerProfileType } from './types';
import TeamSelector from './components/TeamSelector';
import LeagueTable from './components/LeagueTable';
import ManagerProfile from './components/ManagerProfile';
import MatchView from './components/MatchView';
import SquadManagement from './components/SquadManagement';
import CalendarModal from './components/CalendarModal';
import SeasonRecapModal from './components/SeasonRecapModal';
import LoginScreen from './components/LoginScreen';
import ProfileSelector from './components/ProfileSelector';
import { Play, FastForward, Trophy, Calendar, Pause, CheckCircle, ChevronLeft, ChevronRight, Shirt, Briefcase, Search, Globe, CalendarDays, ArrowRight, ChevronDown, LogOut, Users } from 'lucide-react';
import { getBoardFeedback } from './services/geminiService';
import { fetchTeams, saveSeasonResult, updateProfileName, fetchSavedGame, saveGame, fetchCurrentUser } from './services/api';

const TBD_TEAM: Team = { id: 'TBD', name: 'TBD', shortName: 'TBD', tier: 0, strength: 0, primaryColor: '#334155', secondaryColor: '#94a3b8', roster: [], formation: '4-3-3', stats: { ...INITIAL_STATS, form: [] } };

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('auth_token'));
    const [activeProfile, setActiveProfile] = useState<ManagerProfileType | null>(null);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [userAccount, setUserAccount] = useState<{ name: string, email: string } | null>(null);

    const [teams, setTeams] = useState<Team[]>([]);
    const [schedule, setSchedule] = useState<Match[]>([]);
    const [userTeamId, setUserTeamId] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [simState, setSimState] = useState<SimulationState | 'match_recap'>('select_team');
    const [seasonSummary, setSeasonSummary] = useState<SeasonSummary | null>(null);
    const [isSimulatingFast, setIsSimulatingFast] = useState(false);
    const [activeTableTab, setActiveTableTab] = useState<Competition>('La Liga');

    const [resultsComp, setResultsComp] = useState<Competition>('La Liga');
    const [resultsIndex, setResultsIndex] = useState<number>(-1);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isRecapOpen, setIsRecapOpen] = useState(false);
    const [currentSeasonYear, setCurrentSeasonYear] = useState<string>("2025/26");

    const [targetSimWeek, setTargetSimWeek] = useState<number | null>(null);
    const [lastSimulatedMatchId, setLastSimulatedMatchId] = useState<string | null>(null);

    const [seasonId, setSeasonId] = useState<string>(() => crypto.randomUUID());
    const seasonIdRef = useRef(seasonId);
    const lastInitializedProfileId = useRef<string | null>(null);

    useEffect(() => { seasonIdRef.current = seasonId; }, [seasonId]);
    useEffect(() => { if (isAuthenticated) fetchCurrentUser().then(data => setUserAccount(data)); }, [isAuthenticated]);

    useEffect(() => {
        if (userTeamId) {
            let targetComp: Competition | null = null;
            if (simState === 'match_recap' && lastSimulatedMatchId) {
                const lastMatch = schedule.find(m => m.id === lastSimulatedMatchId);
                if (lastMatch) targetComp = lastMatch.competition;
            } else {
                const nextMatch = schedule.find(m => m.week === currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
                if (nextMatch) targetComp = nextMatch.competition;
            }
            if (targetComp) { setActiveTableTab(targetComp); setResultsComp(targetComp); }
        }
    }, [currentWeek, userTeamId, schedule, simState, lastSimulatedMatchId]);

    useEffect(() => {
        if (!activeProfile) return;
        if (activeProfile.id === lastInitializedProfileId.current) return;
        lastInitializedProfileId.current = activeProfile.id;

        const initGame = async () => {
            const savedGame = await fetchSavedGame(activeProfile.id);

            if (savedGame && savedGame.userTeamId) {
                if (savedGame.schedule && savedGame.schedule.length > 0) {
                    const firstDate = new Date(savedGame.schedule[0].date);
                    const startYear = firstDate.getFullYear();
                    setCurrentSeasonYear(`${startYear}/${(startYear + 1).toString().slice(2)}`);
                }
                setTeams(savedGame.teams); setSchedule(savedGame.schedule); setCurrentWeek(savedGame.currentWeek);
                setUserTeamId(savedGame.userTeamId); setSimState('ready');
                return;
            }

            try {
                const fetchedTeams = await fetchTeams();
                const allTeams = [...fetchedTeams.map(t => ({ ...t, isLaLiga: t.tier === 1 })), TBD_TEAM];
                setTeams(allTeams);

                const ligaTeams = allTeams.filter(t => t.tier === 1 && t.id !== 'TBD');
                const uclTeams = allTeams.filter(t => t.isUCL && t.id !== 'TBD');

                const masterSchedule = generateMasterSchedule(ligaTeams, uclTeams, "2025/26");
                setSchedule(masterSchedule); setSimState('select_team'); setCurrentSeasonYear("2025/26");
                setCurrentWeek(1); setUserTeamId(null);
            } catch (err) { alert("Error connecting to database. Please check your connection."); }
        };
        initGame();
    }, [activeProfile?.id]);

    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = () => { localStorage.removeItem('auth_token'); setIsAuthenticated(false); setActiveProfile(null); lastInitializedProfileId.current = null; setShowAccountMenu(false); setSimState('select_team'); setUserTeamId(null); setTeams([]); setSchedule([]); };
    const handleSelectProfile = (profile: ManagerProfileType) => setActiveProfile(profile);
    const handleExitProfile = () => { setActiveProfile(null); lastInitializedProfileId.current = null; setTeams([]); setSchedule([]); };
    const handleUpdateManagerName = async (name: string) => { if (activeProfile) { await updateProfileName(activeProfile.id, name); setActiveProfile({ ...activeProfile, name }); } };
    const handleSelectTeam = (id: string) => { setUserTeamId(id); setSimState('ready'); setCurrentWeek(1); };

    const calculateMatchResult = (match: Match, home: Team, away: Team): Match => {
        if (home.id === 'TBD' || away.id === 'TBD') return match;
        let homeStr = home.strength, awayStr = away.strength;
        if (match.stage !== 'Final') homeStr += 5;
        const diff = homeStr - awayStr;
        let homeProb = 0.38 + (diff * 0.015), drawProb = 0.26 - (Math.abs(diff) * 0.005);
        if (!['League Phase', 'Regular Season', 'Playoffs', 'Final'].includes(match.stage || '')) drawProb *= 0.8;
        homeProb = Math.max(0.1, Math.min(0.85, homeProb)); drawProb = Math.max(0.1, drawProb);
        const rand = Math.random();
        let homeGoals = 0, awayGoals = 0;
        if (rand < homeProb) { homeGoals = Math.floor(Math.random() * 4) + 1; awayGoals = Math.floor(Math.random() * homeGoals); }
        else if (rand < homeProb + drawProb) { homeGoals = Math.floor(Math.random() * 4); awayGoals = homeGoals; }
        else { awayGoals = Math.floor(Math.random() * 4) + 1; homeGoals = Math.floor(Math.random() * awayGoals); }
        return { ...match, homeScore: homeGoals, awayScore: awayGoals, played: true };
    };

    const handlePlayVisualMatch = () => setSimState('playing_match');
    const handleQuickSimWeek = () => {
        const matchesToPlay = schedule.filter(m => m.week === currentWeek && !m.played);
        const userMatch = matchesToPlay.find(m => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId);
        let nextState: SimulationState | 'match_recap' | null = null;
        if (userMatch) { setLastSimulatedMatchId(userMatch.id); nextState = 'match_recap'; }
        simulateWeekLogic(null, nextState);
    };

    const handleSimulateToWeek = (targetWeek: number) => { setTargetSimWeek(targetWeek); setIsSimulatingFast(true); setIsCalendarOpen(false); };

    const getMatchDate = (week: number) => {
        const startYear = parseInt(currentSeasonYear.split('/')[0], 10);
        const entry = SIMULATION_SCHEDULE.find(s => s.week === week);
        if (!entry) return new Date();
        const monthStr = entry.date.split('-')[1];
        const isNextYear = parseInt(monthStr, 10) < 7;
        const year = isNextYear ? startYear + 1 : startYear;
        return new Date(`${year}-${monthStr}-${entry.date.split('-')[2]}T12:00:00Z`);
    };

    const getPenaltyResult = () => { const possibleScores = [[5, 4], [5, 3], [4, 3], [4, 2], [3, 1], [3, 2], [6, 5]]; const score = possibleScores[Math.floor(Math.random() * possibleScores.length)]; const homeWins = Math.random() > 0.5; return homeWins ? { home: score[0], away: score[1] } : { home: score[1], away: score[0] }; };

    const resolveUCLKnockouts = (currentSchedule: Match[], teamsState: Team[]): Match[] => {
        let updatedSchedule = [...currentSchedule];
        const isPhaseComplete = (stage: string) => { const matches = updatedSchedule.filter(m => m.stage === stage); return matches.length > 0 && matches.every(m => m.played); };
        const hasNextStageGenerated = (stage: string) => updatedSchedule.some(m => m.stage === stage);

        if (isPhaseComplete('League Phase') && !hasNextStageGenerated('Playoffs')) {
            const uclTeams = teamsState.filter(t => t.isUCL && t.id !== 'TBD').sort((a, b) => { if (b.uclStats!.points !== a.uclStats!.points) return b.uclStats!.points - a.uclStats!.points; if (b.uclStats!.gd !== a.uclStats!.gd) return b.uclStats!.gd - a.uclStats!.gd; return b.uclStats!.gf - a.uclStats!.gf; });
            const topSeeds = uclTeams.slice(0, 8);
            const playoffsMatches: Match[] = [], r16Matches: Match[] = [], qfMatches: Match[] = [], sfMatches: Match[] = [];

            for (let i = 0; i < 8; i++) {
                const seedHigh = uclTeams[8 + i], seedLow = uclTeams[23 - i];
                if (seedHigh && seedLow) {
                    playoffsMatches.push({ id: `UCL-PO-L1-${i}`, week: 30, homeTeamId: seedLow.id, awayTeamId: seedHigh.id, date: getMatchDate(30), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Playoffs', isLeg2: false });
                    playoffsMatches.push({ id: `UCL-PO-L2-${i}`, week: 32, homeTeamId: seedHigh.id, awayTeamId: seedLow.id, date: getMatchDate(32), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Playoffs', isLeg2: true });
                }
            }
            [...topSeeds].sort(() => Math.random() - 0.5).forEach((seed, idx) => {
                const placeholderText = `Winner: ${uclTeams[8 + idx]?.shortName} / ${uclTeams[23 - idx]?.shortName}`;
                r16Matches.push({ id: `UCL-R16-L1-${idx}`, week: 35, homeTeamId: 'TBD', awayTeamId: seed.id, date: getMatchDate(35), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Round of 16', isLeg2: false, placeholder: placeholderText });
                r16Matches.push({ id: `UCL-R16-L2-${idx}`, week: 37, homeTeamId: seed.id, awayTeamId: 'TBD', date: getMatchDate(37), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Round of 16', isLeg2: true, placeholder: placeholderText });
            });
            for (let i = 0; i < 4; i++) { qfMatches.push({ id: `UCL-QF-L1-${i}`, week: 41, homeTeamId: 'TBD', awayTeamId: 'TBD', date: getMatchDate(41), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Quarter-finals', isLeg2: false }); qfMatches.push({ id: `UCL-QF-L2-${i}`, week: 43, homeTeamId: 'TBD', awayTeamId: 'TBD', date: getMatchDate(43), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Quarter-finals', isLeg2: true }); }
            for (let i = 0; i < 2; i++) { sfMatches.push({ id: `UCL-SF-L1-${i}`, week: 47, homeTeamId: 'TBD', awayTeamId: 'TBD', date: getMatchDate(47), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Semi-finals', isLeg2: false }); sfMatches.push({ id: `UCL-SF-L2-${i}`, week: 49, homeTeamId: 'TBD', awayTeamId: 'TBD', date: getMatchDate(49), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Semi-finals', isLeg2: true }); }

            updatedSchedule.push(...playoffsMatches, ...r16Matches, ...qfMatches, ...sfMatches, { id: `UCL-FINAL`, week: 55, homeTeamId: 'TBD', awayTeamId: 'TBD', date: getMatchDate(55), homeScore: null, awayScore: null, played: false, competition: 'Champions League', stage: 'Final', isLeg2: false });
        }

        const processStageWinners = (currentStage: string) => {
            if (!isPhaseComplete(currentStage)) return null;
            const stageMatches = updatedSchedule.filter(m => m.stage === currentStage);
            const winners: string[] = [];
            const pairs: Record<string, Match[]> = {};
            stageMatches.forEach(m => { const idx = m.id.split('-').pop(); if (idx) { pairs[idx] = pairs[idx] || []; pairs[idx].push(m); } });

            Object.keys(pairs).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
                if (currentStage === 'Final') {
                    const m = pairs[key][0];
                    if (m.homeScore === m.awayScore && m.homePenalties === undefined) { const pens = getPenaltyResult(); const idx = updatedSchedule.findIndex(match => match.id === m.id); updatedSchedule[idx] = { ...updatedSchedule[idx], homePenalties: pens.home, awayPenalties: pens.away }; }
                    return;
                }
                const l1 = pairs[key].find(m => !m.isLeg2), l2 = pairs[key].find(m => m.isLeg2);
                if (l1 && l2 && l1.played && l2.played) {
                    const aggHome = l2.homeScore! + l1.awayScore!, aggAway = l2.awayScore! + l1.homeScore!;
                    let winnerId = aggHome > aggAway ? l2.homeTeamId : l2.awayTeamId;
                    if (aggHome === aggAway) {
                        let hp = l2.homePenalties, ap = l2.awayPenalties;
                        if (hp === undefined || ap === undefined) { const pens = getPenaltyResult(); hp = pens.home; ap = pens.away; const idx = updatedSchedule.findIndex(match => match.id === l2.id); updatedSchedule[idx] = { ...updatedSchedule[idx], homePenalties: hp, awayPenalties: ap }; }
                        winnerId = hp! > ap! ? l2.homeTeamId : l2.awayTeamId;
                    }
                    winners.push(winnerId);
                }
            });
            return winners;
        };

        const mapWinners = (stageComp: string, targetStage: string, pairFactor: number) => {
            if (isPhaseComplete(stageComp) && updatedSchedule.some(m => m.stage === targetStage && (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD'))) {
                const winners = processStageWinners(stageComp);
                if (winners) {
                    updatedSchedule = updatedSchedule.map(m => {
                        if (m.stage === targetStage) {
                            const idx = parseInt(m.id.split('-').pop() || '');
                            if (pairFactor === 0) { const winnerId = winners[idx]; if (winnerId) return !m.isLeg2 ? { ...m, homeTeamId: winnerId, placeholder: undefined } : { ...m, awayTeamId: winnerId, placeholder: undefined }; }
                            else { const t1 = winners[idx * 2], t2 = winners[idx * 2 + 1]; if (t1 && t2) return { ...m, homeTeamId: m.isLeg2 ? t2 : t1, awayTeamId: m.isLeg2 ? t1 : t2 }; }
                        }
                        return m;
                    });
                }
            }
        };

        mapWinners('Playoffs', 'Round of 16', 0); mapWinners('Round of 16', 'Quarter-finals', 1);
        mapWinners('Quarter-finals', 'Semi-finals', 1);

        if (isPhaseComplete('Semi-finals') && updatedSchedule.some(m => m.stage === 'Final' && m.homeTeamId === 'TBD')) {
            const winners = processStageWinners('Semi-finals');
            if (winners && winners.length === 2) updatedSchedule = updatedSchedule.map(m => m.stage === 'Final' ? { ...m, homeTeamId: winners[0], awayTeamId: winners[1] } : m);
        }
        if (isPhaseComplete('Final')) processStageWinners('Final');
        return updatedSchedule;
    };

    const simulateWeekLogic = useCallback((userResult: { matchId: string, homeScore: number, awayScore: number } | null, targetState: SimulationState | 'match_recap' | null = null) => {
        if (currentWeek > 55) return;
        let procWeek = currentWeek, nextTeams = [...teams], nextSchedule = [...schedule];
        while (procWeek <= 55) {
            const matchesToPlay = nextSchedule.filter(m => m.week === procWeek && !m.played);
            if (matchesToPlay.length > 0) {
                const simulatedResults = matchesToPlay.map(match => {
                    if (userResult && match.id === userResult.matchId && procWeek === currentWeek) return { ...match, homeScore: userResult.homeScore, awayScore: userResult.awayScore, played: true };
                    const home = nextTeams.find(t => t.id === match.homeTeamId), away = nextTeams.find(t => t.id === match.awayTeamId);
                    return (!home || !away || home.id === 'TBD' || away.id === 'TBD') ? match : calculateMatchResult(match, home, away);
                });
                nextSchedule = nextSchedule.map(m => simulatedResults.find(r => r.id === m.id) || m);
                const tempTeams = [...nextTeams];
                simulatedResults.forEach(match => {
                    if (!match.played) return;
                    const homeIdx = tempTeams.findIndex(t => t.id === match.homeTeamId), awayIdx = tempTeams.findIndex(t => t.id === match.awayTeamId);
                    if (homeIdx === -1 || awayIdx === -1) return;
                    const home = { ...tempTeams[homeIdx] }, away = { ...tempTeams[awayIdx] };
                    const updateStatObj = (stats: any, hS: number, aS: number) => {
                        stats.played += 1; stats.gf += hS; stats.ga += aS; stats.gd = stats.gf - stats.ga;
                        if (hS > aS) { stats.won++; stats.points += 3; } else if (hS < aS) { stats.lost++; } else { stats.drawn++; stats.points += 1; }
                    };
                    if (match.competition === 'La Liga') {
                        home.stats = { ...home.stats, form: [...home.stats.form] }; away.stats = { ...away.stats, form: [...away.stats.form] };
                        updateStatObj(home.stats, match.homeScore!, match.awayScore!);
                        const hRes = match.homeScore! > match.awayScore! ? 'W' : match.homeScore! === match.awayScore! ? 'D' : 'L';
                        const aRes = match.homeScore! < match.awayScore! ? 'W' : match.homeScore! === match.awayScore! ? 'D' : 'L';
                        home.stats.form = [hRes as any, ...home.stats.form].slice(0, 5); away.stats.form = [aRes as any, ...away.stats.form].slice(0, 5);
                        updateStatObj(away.stats, match.awayScore!, match.homeScore!);
                    } else if (match.competition === 'Champions League' && match.stage === 'League Phase') {
                        if (home.uclStats) { home.uclStats = { ...home.uclStats }; updateStatObj(home.uclStats, match.homeScore!, match.awayScore!); }
                        if (away.uclStats) { away.uclStats = { ...away.uclStats }; updateStatObj(away.uclStats, match.awayScore!, match.homeScore!); }
                    }
                    tempTeams[homeIdx] = home; tempTeams[awayIdx] = away;
                });
                nextTeams = tempTeams; nextSchedule = resolveUCLKnockouts(nextSchedule, nextTeams);
            }
            const nextW = procWeek + 1;
            if (nextW > 55) { procWeek = nextW; break; }
            const matchesNext = nextSchedule.filter(m => m.week === nextW);
            if (matchesNext.length === 0 || matchesNext.some(m => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId)) { procWeek = nextW; break; }
            procWeek = nextW;
        }
        setTeams(nextTeams); setSchedule(nextSchedule); setCurrentWeek(procWeek); setSimState(targetState || 'ready');
        performAutoSave(nextTeams, nextSchedule, procWeek);
    }, [currentWeek, schedule, teams, userTeamId]);

    const performAutoSave = async (newTeams: Team[], newSchedule: Match[], newWeek: number) => {
        if (activeProfile && userTeamId) saveGame(activeProfile.id, { currentWeek: newWeek, userTeamId: userTeamId, schedule: newSchedule, teams: newTeams });
    };

    const handleMatchComplete = (homeScore: number, awayScore: number) => {
        const userMatch = schedule.find(m => m.week === currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
        if (userMatch) { setLastSimulatedMatchId(userMatch.id); simulateWeekLogic({ matchId: userMatch.id, homeScore, awayScore }, 'match_recap'); }
        else simulateWeekLogic(null);
    };

    const handleUpdateTeam = (updatedTeam: Team) => setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isSimulatingFast) {
            const maxWeek = schedule.reduce((max, m) => Math.max(max, m.week), 55);
            if (targetSimWeek ? currentWeek < targetSimWeek : currentWeek <= maxWeek) timer = setTimeout(() => simulateWeekLogic(null), 80);
            else { setIsSimulatingFast(false); setTargetSimWeek(null); }
        }
        return () => clearTimeout(timer);
    }, [isSimulatingFast, currentWeek, simulateWeekLogic, schedule, targetSimWeek]);

    const handleConcludeSeason = async () => {
        if (!userTeamId || !activeProfile) return;
        try {
            const sorted = teams.filter(t => t.isLaLiga && t.id !== 'TBD').sort((a, b) => b.stats.points - a.stats.points || b.stats.gd - a.stats.gd);
            const userPos = sorted.findIndex(t => t.id === userTeamId) + 1, userTeam = teams.find(t => t.id === userTeamId);
            if (!userTeam) return;
            setSimState('season_over');
            let wonUCL = false, uclResultString = '';
            const final = schedule.find(m => m.stage === 'Final' && m.played);
            if (final) {
                const isParticipant = final.homeTeamId === userTeamId || final.awayTeamId === userTeamId;
                let homeWin = final.homeScore! > final.awayScore!;
                if (final.homeScore === final.awayScore && final.homePenalties !== undefined) homeWin = final.homePenalties > final.awayPenalties!;
                const isWinner = (final.homeTeamId === userTeamId && homeWin) || (final.awayTeamId === userTeamId && !homeWin);
                if (isWinner) { wonUCL = true; uclResultString = 'Winner'; }
                else if (isParticipant) uclResultString = 'Runner-up';
                else { const uclMatches = schedule.filter(m => m.competition === 'Champions League' && m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId)); const lastMatch = uclMatches[uclMatches.length - 1]; if (lastMatch) uclResultString = lastMatch.stage || ''; }
            }
            if (userPos === 1 || wonUCL) confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
            const newRecord = await saveSeasonResult(activeProfile.id, { seasonYear: currentSeasonYear, teamId: userTeam.id, teamName: userTeam.name, position: userPos, points: userTeam.stats.points, wonTrophy: userPos === 1 || wonUCL });
            setActiveProfile(prev => prev ? ({ ...prev, history: [newRecord, ...prev.history] }) : null);
            const activeSeasonId = seasonId;
            setSeasonSummary({ position: userPos, points: userTeam.stats.points, wonLeague: userPos === 1, uclResult: uclResultString, message: "Waiting for board evaluation..." });
            setIsRecapOpen(true);
            getBoardFeedback(userTeam, userPos, sorted.length, uclResultString).then(feedback => { if (seasonIdRef.current === activeSeasonId) setSeasonSummary(prev => prev ? { ...prev, message: feedback } : null); });
        } catch (error) { alert("Failed to save season data."); setSimState('ready'); }
    };

    const toggleFastSim = () => { setIsSimulatingFast(prev => !prev); setTargetSimWeek(null); };

    const handleSeasonTransition = async (stayWithTeam: boolean) => {
        setIsSimulatingFast(false); setIsRecapOpen(false); setSeasonId(crypto.randomUUID());
        const fetchedTeams = await fetchTeams();
        const allTeams = [...fetchedTeams.map(t => ({ ...t, isLaLiga: t.tier === 1 })), TBD_TEAM];
        setTeams(allTeams);

        const ligaTeams = allTeams.filter(t => t.tier === 1 && t.id !== 'TBD');
        const uclTeams = allTeams.filter(t => t.isUCL && t.id !== 'TBD');

        const parts = currentSeasonYear.split('/');
        const newSeasonYear = `${parseInt(parts[0] || '2025', 10) + 1}/${parseInt(parts[1] || '26', 10) + 1}`;
        setCurrentSeasonYear(newSeasonYear);

        const nextSchedule = generateMasterSchedule(ligaTeams, uclTeams, newSeasonYear);
        setSchedule(nextSchedule); setCurrentWeek(1); setSeasonSummary(null);

        let newUserTeamId = userTeamId;
        if (!stayWithTeam || !userTeamId) { newUserTeamId = null; setUserTeamId(null); setSimState('select_team'); } else { setSimState('ready'); }
        if (activeProfile && newUserTeamId) saveGame(activeProfile.id, { currentWeek: 1, userTeamId: newUserTeamId, schedule: nextSchedule, teams: allTeams });
    };

    const resultGroups = useMemo(() => {
        const playedInComp = schedule.filter(m => m.competition === resultsComp && m.played);
        const uniqueWeeks = Array.from(new Set(playedInComp.map(m => m.week))).sort((a: number, b: number) => a - b);
        return uniqueWeeks.map(week => {
            const matches = playedInComp.filter(m => m.week === week);
            if (userTeamId) matches.sort((a, b) => (a.homeTeamId === userTeamId || a.awayTeamId === userTeamId) ? -1 : 1);
            let label = resultsComp === 'La Liga' ? `Matchday ${uniqueWeeks.indexOf(week) + 1}` : (matches[0]?.stage === 'League Phase' ? `League Phase Game ${uniqueWeeks.indexOf(week) + 1}` : matches[0]?.stage || `Week ${week}`);
            return { week, matches, label };
        });
    }, [schedule, resultsComp, userTeamId]);

    useEffect(() => { setResultsIndex(resultGroups.length > 0 ? resultGroups.length - 1 : 0); }, [resultGroups.length, resultsComp]);

    const currentResultGroup = resultGroups[resultsIndex];
    const userMatch = useMemo(() => { if (!userTeamId) return undefined; return schedule.find(m => m.week === currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId)); }, [schedule, currentWeek, userTeamId]);
    const userHome = useMemo(() => userMatch ? teams.find(t => t.id === userMatch.homeTeamId) : undefined, [userMatch, teams]);
    const userAway = useMemo(() => userMatch ? teams.find(t => t.id === userMatch.awayTeamId) : undefined, [userMatch, teams]);
    const isUCLWeek = useMemo(() => { if (simState === 'match_recap' && lastSimulatedMatchId) { const lastMatch = schedule.find(m => m.id === lastSimulatedMatchId); if (lastMatch) return lastMatch.competition === 'Champions League'; } if (userMatch) return userMatch.competition === 'Champions League'; return schedule.some(m => m.week === currentWeek && m.competition === 'Champions League'); }, [userMatch, schedule, currentWeek, simState, lastSimulatedMatchId]);
    const isSeasonFinished = simState === 'season_over';
    const isScheduleComplete = currentWeek > 55;
    const lastSimMatch = useMemo(() => lastSimulatedMatchId ? schedule.find(m => m.id === lastSimulatedMatchId) : undefined, [lastSimulatedMatchId, schedule]);
    const lastSimHome = useMemo(() => lastSimMatch ? teams.find(t => t.id === lastSimMatch.homeTeamId) : undefined, [lastSimMatch, teams]);
    const lastSimAway = useMemo(() => lastSimMatch ? teams.find(t => t.id === lastSimMatch.awayTeamId) : undefined, [lastSimMatch, teams]);

    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
    if (!activeProfile) return <ProfileSelector onSelectProfile={handleSelectProfile} onLogout={handleLogout} />;
    if (!userTeamId) return <TeamSelector teams={teams.filter(t => t.id !== 'TBD')} onSelect={handleSelectTeam} />;
    if (simState === 'squad_management') { const myTeam = teams.find(t => t.id === userTeamId); if (myTeam) return <SquadManagement team={myTeam} onUpdateTeam={handleUpdateTeam} onBack={() => setSimState('ready')} />; }
    if (simState === 'playing_match' && userMatch && userHome && userAway) { return <MatchView homeTeam={userHome} awayTeam={userAway} userTeamId={userTeamId} onMatchComplete={handleMatchComplete} competition={userMatch.competition} stage={userMatch.stage} />; }

    return (
        <div className={`min-h-screen text-slate-100 p-3 md:p-8 transition-colors duration-500 ${isUCLWeek ? 'bg-slate-950' : 'bg-slate-900'}`}>
            <ManagerProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} history={activeProfile.history} managerName={activeProfile.name} onUpdateName={handleUpdateManagerName} />
            {userTeamId && teams.find(t => t.id === userTeamId) && <SeasonRecapModal isOpen={isRecapOpen} onClose={() => setIsRecapOpen(false)} summary={seasonSummary} team={teams.find(t => t.id === userTeamId)!} />}
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} schedule={schedule} teams={teams} userTeamId={userTeamId} currentWeek={currentWeek} onSimulateToWeek={handleSimulateToWeek} currentSeasonYear={currentSeasonYear} />

            <header className={`flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 p-4 gap-4 rounded-xl border shadow-md transition-colors ${isUCLWeek ? 'bg-blue-950/50 border-blue-900' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-center w-12 h-12 shrink-0">{isUCLWeek ? (UCL_LOGO_URL ? <div className="bg-white rounded-lg p-1 w-10 h-10 flex items-center justify-center shadow-sm"><img src={UCL_LOGO_URL} alt="UCL" className="w-full h-full object-contain" /></div> : <Globe size={24} className="text-blue-400" />) : (LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} alt="La Liga" className="w-10 h-10 object-contain" /> : <Trophy size={24} className="text-[#FF2B44]" />)}</div>
                    <div className="flex-1"><h1 className="text-lg md:text-xl font-bold">{isUCLWeek ? 'Champions League Matchday' : 'La Liga Matchday'}</h1><p className={`text-xs ${isUCLWeek ? 'text-blue-300' : 'text-slate-400'}`}>Season {currentSeasonYear}</p></div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 font-mono font-bold text-white shadow-inner overflow-hidden max-w-[200px] md:max-w-none">
                        <div className="px-3 py-2 text-xs md:text-sm truncate hidden sm:block">{userMatch ? `Upcoming: ${(userHome?.id === userTeamId ? userAway : userHome)?.name} ${userHome?.id === userTeamId ? '(H)' : '(A)'} (${userMatch.competition === 'Champions League' ? 'UCL' : 'Liga'})` : (isSeasonFinished || isScheduleComplete) ? "End of Season" : "No Match"}</div>
                        <button onClick={() => setIsCalendarOpen(true)} className="bg-slate-800 hover:bg-slate-700 p-2 h-full border-l border-slate-700 transition-colors text-slate-400 hover:text-white"><CalendarDays size={18} /></button>
                    </div>

                    <button onClick={() => setSimState('squad_management')} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold text-xs md:text-sm"><Shirt size={16} /><span className="hidden lg:inline">Squad</span></button>

                    <div className="relative z-50">
                        <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner border border-blue-400/50">{activeProfile.name.substring(0, 2).toUpperCase()}</div>
                            <div className="text-left hidden sm:block max-w-[120px]"><div className="text-sm font-bold text-white truncate">{activeProfile.name}</div><div className="text-[10px] text-slate-400 truncate -mt-0.5">{userAccount?.name || 'Account'}</div></div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showAccountMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 border-b border-slate-700 bg-slate-900/50"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager Profile</p><p className="text-sm text-white font-bold truncate mt-1">{activeProfile.name}</p><div className="h-px bg-slate-800 my-2"></div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Account</p><p className="text-xs text-slate-500 truncate mt-1">{userAccount?.email || 'Loading...'}</p></div>
                                <button onClick={() => { setShowAccountMenu(false); setIsProfileOpen(true); }} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"><Trophy size={16} /> Career History</button>
                                <button onClick={() => { setShowAccountMenu(false); handleExitProfile(); }} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"><Users size={16} /> Switch Manager Profile</button>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors border-t border-slate-700"><LogOut size={16} /> Sign Out Completely</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                <div className="lg:col-span-2 flex flex-col order-2 lg:order-1">
                    <LeagueTable teams={teams} userTeamId={userTeamId || ''} activeTab={activeTableTab} onTabChange={setActiveTableTab} schedule={schedule} currentWeek={currentWeek} />
                </div>

                <div className="flex flex-col gap-6 order-1 lg:order-2">
                    <div className={`p-4 md:p-6 rounded-xl border shadow-lg ${isUCLWeek ? 'bg-blue-950 border-blue-900' : 'bg-slate-800 border-slate-700'}`}>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-400" /> Action Center</h2>
                        {simState === 'season_over' ? (
                            <div className="grid grid-cols-1 gap-3"><h3 className="text-slate-400 text-sm font-bold uppercase mb-1">Contract Options</h3><button onClick={() => handleSeasonTransition(true)} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all"><Briefcase size={20} /> Renew Contract</button><button onClick={() => handleSeasonTransition(false)} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-4 rounded-xl border border-slate-600 transition-all"><Search size={20} /> Resign</button></div>
                        ) : simState === 'match_recap' && lastSimMatch && lastSimHome && lastSimAway ? (
                            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300"><div className="mb-2 p-4 bg-slate-900 rounded-lg border border-slate-700 shadow-xl"><div className="text-center text-xs mb-2 uppercase tracking-wide font-bold text-green-400">Match Finished</div><div className="flex items-center justify-between"><div className="text-center w-1/3 flex flex-col items-center">{lastSimHome.logoUrl ? <img src={lastSimHome.logoUrl} className="w-12 h-12 mb-2 object-contain" /> : <div className="w-12 h-12 rounded-full mb-2" style={{ backgroundColor: lastSimHome.primaryColor }}></div>}<div className="font-bold text-sm md:text-lg leading-tight truncate w-full">{lastSimHome.shortName}</div></div><div className="text-2xl md:text-3xl font-mono font-bold text-white bg-slate-800 px-3 py-1 rounded border border-slate-700">{lastSimMatch.homeScore} - {lastSimMatch.awayScore}</div><div className="text-center w-1/3 flex flex-col items-center">{lastSimAway.logoUrl ? <img src={lastSimAway.logoUrl} className="w-12 h-12 mb-2 object-contain" /> : <div className="w-12 h-12 rounded-full mb-2" style={{ backgroundColor: lastSimAway.primaryColor }}></div>}<div className="font-bold text-sm md:text-lg leading-tight truncate w-full">{lastSimAway.shortName}</div></div></div></div><button onClick={() => setSimState('ready')} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg active:scale-95">Continue <ArrowRight size={18} /></button></div>
                        ) : (
                            <><div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">{userMatch ? <><div className={`text-center text-xs mb-2 uppercase tracking-wide font-bold ${isUCLWeek ? 'text-blue-400' : 'text-slate-500'}`}>{userMatch.competition}</div><div className="flex items-center justify-between"><div className="text-center w-1/3 flex flex-col items-center">{userHome?.logoUrl ? <img src={userHome.logoUrl} className="w-10 h-10 mb-2 object-contain" /> : null}<div className="font-bold text-sm md:text-lg leading-tight truncate w-full">{userHome?.name}</div><div className="text-xs text-slate-400">Home</div></div><div className="text-lg md:text-xl font-bold text-slate-600">VS</div><div className="text-center w-1/3 flex flex-col items-center">{userAway?.logoUrl ? <img src={userAway.logoUrl} className="w-10 h-10 mb-2 object-contain" /> : null}<div className="font-bold text-sm md:text-lg leading-tight truncate w-full">{userAway?.name}</div><div className="text-xs text-slate-400">Away</div></div></div></> : isScheduleComplete ? <div className="mb-6 p-4 bg-emerald-900/30 rounded-lg border border-emerald-500/30 flex flex-col items-center text-center"><CheckCircle className="w-8 h-8 text-emerald-400 mb-2" /><div className="font-bold text-emerald-100">Schedule Complete</div><div className="text-xs text-emerald-200/70 mt-1">Ready to finalize season</div></div> : null}</div><div className="grid grid-cols-2 gap-3">{isScheduleComplete ? <button onClick={handleConcludeSeason} className="col-span-2 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 px-4 rounded-lg shadow-lg animate-pulse"><Trophy size={20} /> Conclude Season</button> : <><button onClick={handlePlayVisualMatch} disabled={isSimulatingFast || !userMatch} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-sm md:text-base"><Play size={18} fill="currentColor" /> Play</button><button onClick={handleQuickSimWeek} disabled={isSimulatingFast} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg border border-slate-600 text-sm md:text-base"><FastForward size={18} /> Quick Sim</button><button onClick={toggleFastSim} className={`col-span-2 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg text-sm md:text-base ${isSimulatingFast ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'}`}>{isSimulatingFast ? <><Pause size={18} fill="currentColor" /> Stop Sim</> : <><FastForward size={18} /> Sim Season</>}</button></>}</div></>
                        )}
                    </div>
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 min-h-[300px] flex flex-col">
                        <div className="p-4 bg-slate-900/50 border-b border-slate-700 space-y-3"><div className="relative"><select value={resultsComp} onChange={(e) => setResultsComp(e.target.value as Competition)} className="w-full bg-slate-800 border border-slate-600 text-white text-sm font-bold rounded-lg p-2.5 outline-none pl-10 appearance-none"><option value="La Liga">La Liga</option><option value="Champions League">Champions League</option></select><div className="absolute left-3 top-3 pointer-events-none flex items-center justify-center w-5 h-5">{resultsComp === 'La Liga' && LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} className="w-4 h-4 object-contain" /> : null}{resultsComp === 'Champions League' && UCL_LOGO_URL ? <div className="bg-slate-200 rounded-full p-0.5 w-4 h-4 flex items-center justify-center"><img src={UCL_LOGO_URL} className="w-3 h-3 object-contain" /></div> : null}</div><ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} /></div><div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-1"><button onClick={() => setResultsIndex((prev: number) => Math.max(0, prev - 1))} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30" disabled={resultsIndex <= 0}><ChevronLeft size={16} /></button><h3 className="font-bold text-xs uppercase">{currentResultGroup?.label || 'No Matches'}</h3><button onClick={() => setResultsIndex((prev: number) => Math.min(resultGroups.length - 1, prev + 1))} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30" disabled={resultsIndex >= resultGroups.length - 1}><ChevronRight size={16} /></button></div></div>
                        <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-700/50">{currentResultGroup?.matches.length ? currentResultGroup.matches.map(match => { const h = teams.find(t => t.id === match.homeTeamId), a = teams.find(t => t.id === match.awayTeamId); if (!h || !a) return null; return (<div key={match.id} className={`p-3 flex justify-between items-center text-sm ${(h.id === userTeamId || a.id === userTeamId) ? (match.competition === 'Champions League' ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'bg-indigo-900/20 border-l-2 border-indigo-500') : 'bg-slate-800/10'}`}><div className="flex-1 text-right font-medium text-slate-300 flex items-center justify-end gap-2 min-w-0"><span className={`truncate ${h.id === userTeamId ? 'text-white font-bold' : ''}`}>{h.name}</span>{h.logoUrl ? <img src={h.logoUrl} className="w-5 h-5 object-contain shrink-0" /> : <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.primaryColor }}></div>}</div><div className="px-3 font-bold text-white bg-slate-800/50 py-1 rounded mx-2 min-w-[45px] text-center text-xs">{match.homeScore} - {match.awayScore}</div><div className="flex-1 text-left font-medium text-slate-300 flex items-center gap-2 min-w-0">{a.logoUrl ? <img src={a.logoUrl} className="w-5 h-5 object-contain shrink-0" /> : <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.primaryColor }}></div>}<span className={`truncate ${a.id === userTeamId ? 'text-white font-bold' : ''}`}>{a.name}</span></div></div>); }) : <div className="p-8 text-center text-slate-500 italic">No matches...</div>}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;