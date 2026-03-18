import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { generateMasterSchedule, INITIAL_STATS, INITIAL_UCL_STATS, LIGA_LOGO_URL, UCL_LOGO_URL, getCompetitionWeeks } from './constants';
import { Team, Match, SimulationState, SeasonSummary, Competition, ManagerProfile as ManagerProfileType } from './types';
import TeamSelector from './components/TeamSelector';
import LeagueTable from './components/LeagueTable';
import ManagerProfile from './components/ManagerProfile';
import MatchView from './components/MatchView';
import SquadManagement from './components/SquadManagement';
import CalendarModal from './components/CalendarModal';
import SeasonRecapModal from './components/SeasonRecapModal';
import ContractModal from './components/ContractModal';
import LoginScreen from './components/LoginScreen';
import ProfileSelector from './components/ProfileSelector';
import { FullPageLoader, MatchResultSkeleton } from './components/Skeletons';
import { Play, FastForward, Trophy, Calendar, CheckCircle, ChevronLeft, ChevronRight, Shirt, CalendarDays, ArrowRight, ChevronDown, Users, User, Info, Globe } from 'lucide-react';
import { fetchTeams, saveSeasonResult, updateProfileName, fetchSavedGame, saveGame } from './services/api';
import { getTeamStrength, calculateMatchResult, resolveUCLKnockouts, applyMatchResultsToTeams } from './utils/simulationEngine';

const TBD_TEAM: Team = {
    id: 'TBD',
    name: 'TBD',
    shortName: 'TBD',
    tier: 0,
    strength: 0,
    primaryColor: '#334155',
    secondaryColor: '#94a3b8',
    roster: [],
    formation: '4-3-3',
    stats: { ...INITIAL_STATS, form: [] }
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('auth_token'));
    const [activeProfile, setActiveProfile] = useState<ManagerProfileType | null>(null);
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const [isAppLoading, setIsAppLoading] = useState(false);

    const [teams, setTeams] = useState<Team[]>([]);
    const [schedule, setSchedule] = useState<Match[]>([]);
    const [userTeamId, setUserTeamId] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [simState, setSimState] = useState<SimulationState | 'match_recap'>('select_team');
    const [seasonSummary, setSeasonSummary] = useState<SeasonSummary | null>(null);
    const [activeTableTab, setActiveTableTab] = useState<Competition>('La Liga');

    const [resultsComp, setResultsComp] = useState<Competition>('La Liga');
    const [resultsIndex, setResultsIndex] = useState<number>(-1);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isRecapOpen, setIsRecapOpen] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);

    const [isSkipSeasonConfirmOpen, setIsSkipSeasonConfirmOpen] = useState(false);
    const [isSimSummaryOpen, setIsSimSummaryOpen] = useState(false);
    const [simSummaryMatches, setSimSummaryMatches] = useState<Match[]>([]);
    const [simSummaryFilter, setSimSummaryFilter] = useState<'all' | 'mine'>('mine');
    const [summaryLimit, setSummaryLimit] = useState(50); // <--- ADD THIS LINE
    const [isSimulating, setIsSimulating] = useState(false);

    const [currentSeasonYear, setCurrentSeasonYear] = useState<string>("2025/26");
    const [lastSimulatedMatchId, setLastSimulatedMatchId] = useState<string | null>(null);

    const lastInitializedProfileId = useRef<string | null>(null);

    const maxWeek = useMemo(() => {
        if (!currentSeasonYear) return 300;
        return getCompetitionWeeks(currentSeasonYear).days.length;
    }, [currentSeasonYear]);

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
            if (targetComp) {
                setActiveTableTab(targetComp);
                setResultsComp(targetComp);
            }
        }
    }, [currentWeek, userTeamId, schedule, simState, lastSimulatedMatchId]);

    useEffect(() => {
        if (!activeProfile) return;
        if (activeProfile.id === lastInitializedProfileId.current) return;
        lastInitializedProfileId.current = activeProfile.id;

        const initGame = async () => {
            setIsAppLoading(true);
            try {
                const savedGame = await fetchSavedGame(activeProfile.id);

                if (savedGame && savedGame.userTeamId) {
                    if (savedGame.schedule && savedGame.schedule.length > 0) {
                        const firstDate = new Date(savedGame.schedule[0].date);
                        const startYear = firstDate.getFullYear();
                        setCurrentSeasonYear(`${startYear}/${(startYear + 1).toString().slice(2)}`);
                    }
                    setTeams(savedGame.teams);
                    setSchedule(savedGame.schedule);
                    setCurrentWeek(savedGame.currentWeek);
                    setUserTeamId(savedGame.userTeamId);
                    setSimState('ready');
                    return;
                }

                const fetchedTeams = await fetchTeams();
                const allTeams = [
                    ...fetchedTeams.map(t => ({
                        ...t,
                        isLaLiga: t.tier === 1,
                        roster: t.roster ? [...t.roster].sort((a, b) => a.number - b.number) : []
                    })),
                    TBD_TEAM
                ];
                setTeams(allTeams);

                const ligaTeams = allTeams.filter(t => t.tier === 1 && t.id !== 'TBD');
                const uclTeams = allTeams.filter(t => t.isUCL && t.id !== 'TBD');

                const masterSchedule = generateMasterSchedule(ligaTeams, uclTeams, "2025/26");
                setSchedule(masterSchedule);
                setSimState('select_team');
                setCurrentSeasonYear("2025/26");
                setCurrentWeek(1);
                setUserTeamId(null);
            } catch (err) {
                alert("Error connecting to database. Please check your connection.");
            } finally {
                setIsAppLoading(false);
            }
        };
        initGame();
    }, [activeProfile?.id]);

    const handleLogin = () => setIsAuthenticated(true);

    const handleExitProfile = async () => {
        if (activeProfile && userTeamId) {
            await saveGame(activeProfile.id, { currentWeek, userTeamId, schedule, teams });
        }
        setActiveProfile(null);
        lastInitializedProfileId.current = null;
        setTeams([]);
        setSchedule([]);
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setActiveProfile(null);
        lastInitializedProfileId.current = null;
        setShowAccountMenu(false);
        setSimState('select_team');
        setUserTeamId(null);
        setTeams([]);
        setSchedule([]);
    };

    const handleSelectProfile = (profile: ManagerProfileType) => setActiveProfile(profile);

    const handleUpdateManagerName = async (name: string) => {
        if (activeProfile) {
            await updateProfileName(activeProfile.id, name);
            setActiveProfile({ ...activeProfile, name });
        }
    };

    const handleSelectTeam = (id: string) => {
        setUserTeamId(id);
        setSimState('ready');
        setCurrentWeek(1);
    };

    const performAutoSave = async (newTeams: Team[], newSchedule: Match[], newWeek: number) => {
        if (activeProfile && userTeamId) {
            saveGame(activeProfile.id, { currentWeek: newWeek, userTeamId: userTeamId, schedule: newSchedule, teams: newTeams });
        }
    };

    const runSimulation = useCallback(async (targetWeek: number, userResult: { matchId: string, homeScore: number, awayScore: number } | null = null, stopAtUserMatch: boolean = true, showSummary: boolean = false) => {
        if (currentWeek > maxWeek || isSimulating) return;
        setIsSimulating(true);

        let tempTeams = [...teams];
        let tempSchedule = [...schedule];
        let tempWeek = currentWeek;

        let finalState: SimulationState | 'match_recap' | null = null;
        let finalLastSimMatchId = lastSimulatedMatchId;
        let newlyPlayedMatches: Match[] = [];

        const teamStrengths: Record<string, number> = {};
        tempTeams.forEach(t => {
            teamStrengths[t.id] = getTeamStrength(t);
        });

        while (tempWeek < targetWeek && tempWeek <= maxWeek) {
            // FIX 1: Reduced yield frequency from % 4 to % 10
            if (tempWeek % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const matchesToPlay = tempSchedule.filter(m => m.week === tempWeek && !m.played);
            const userMatchThisWeek = matchesToPlay.find(m => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId);

            if (stopAtUserMatch && userMatchThisWeek && (!userResult || userResult.matchId !== userMatchThisWeek.id)) {
                break;
            }

            if (matchesToPlay.length > 0) {
                const simulatedResults = matchesToPlay.map(match => {
                    if (userResult && match.id === userResult.matchId) {
                        return { ...match, homeScore: userResult.homeScore, awayScore: userResult.awayScore, played: true };
                    }
                    if (match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD') return match;

                    const homeStr = teamStrengths[match.homeTeamId] || 50;
                    const awayStr = teamStrengths[match.awayTeamId] || 50;

                    return calculateMatchResult(match, homeStr, awayStr);
                });

                simulatedResults.forEach(m => {
                    const oldMatch = tempSchedule.find(old => old.id === m.id);
                    if (m.played && oldMatch && !oldMatch.played) {
                        newlyPlayedMatches.push(m);
                    }
                });

                tempSchedule = tempSchedule.map(m => simulatedResults.find(r => r.id === m.id) || m);

                tempTeams = applyMatchResultsToTeams(tempTeams, simulatedResults);

                // FIX 2: Only call UCL resolution if there were UCL matches played this iteration
                const hadUCLAction = simulatedResults.some(m => m.competition === 'Champions League' && m.played);
                if (hadUCLAction) {
                    tempSchedule = resolveUCLKnockouts(tempSchedule, tempTeams, currentSeasonYear);
                }
            }

            if (userMatchThisWeek) {
                finalLastSimMatchId = userMatchThisWeek.id;
                finalState = 'match_recap';
            }

            userResult = null;
            tempWeek++;
        }

        setTeams(tempTeams);
        setSchedule(tempSchedule);
        setCurrentWeek(tempWeek);

        if (finalLastSimMatchId) setLastSimulatedMatchId(finalLastSimMatchId);
        if (finalState) setSimState(finalState);
        else setSimState('ready');

        performAutoSave(tempTeams, tempSchedule, tempWeek);

        if (showSummary && newlyPlayedMatches.length > 0) {
            setSimSummaryMatches(newlyPlayedMatches);
            setSummaryLimit(50); // <--- ADD THIS LINE
            setIsSimSummaryOpen(true);
        }

        setIsSimulating(false);

    }, [teams, schedule, currentWeek, userTeamId, maxWeek, currentSeasonYear, lastSimulatedMatchId, isSimulating]);


    const handlePlayVisualMatch = () => setSimState('playing_match');

    const handleQuickSimWeek = () => {
        runSimulation(currentWeek + 1, null, false, false);
    };

    const handleSimulateToWeek = (targetWeek: number) => {
        setIsCalendarOpen(false);
        runSimulation(targetWeek, null, false, true);
    };

    const handleSimToNextMatch = () => {
        const nextMatch = schedule.find(m => m.week > currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
        if (nextMatch) {
            runSimulation(nextMatch.week, null, true, false);
        } else {
            runSimulation(maxWeek + 1, null, true, false);
        }
    };

    const handleMatchComplete = (homeScore: number, awayScore: number) => {
        const userMatch = schedule.find(m => m.week === currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
        if (userMatch) {
            runSimulation(currentWeek + 1, { matchId: userMatch.id, homeScore, awayScore }, false, false);
        } else {
            runSimulation(currentWeek + 1, null, false, false);
        }
    };

    const handleUpdateTeam = (updatedTeam: Team) => {
        const nextTeams = teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
        setTeams(nextTeams);
        if (activeProfile && userTeamId) {
            saveGame(activeProfile.id, { currentWeek, userTeamId, schedule, teams: nextTeams });
        }
    };

    const handleConcludeSeason = useCallback(async () => {
        if (!userTeamId || !activeProfile) return;
        try {
            const sorted = teams
                .filter(t => t.isLaLiga && t.id !== 'TBD')
                .sort((a, b) => b.stats.points - a.stats.points || b.stats.gd - a.stats.gd);

            const userPos = sorted.findIndex(t => t.id === userTeamId) + 1;
            const userTeam = teams.find(t => t.id === userTeamId);
            if (!userTeam) return;

            setSimState('season_over');

            let wonUCL = false;
            let uclResultString = '';
            const final = schedule.find(m => m.stage === 'Final' && m.played);

            if (final) {
                const isParticipant = final.homeTeamId === userTeamId || final.awayTeamId === userTeamId;
                let homeWin = final.homeScore! > final.awayScore!;
                if (final.homeScore === final.awayScore && final.homePenalties !== undefined) {
                    homeWin = final.homePenalties > final.awayPenalties!;
                }
                const isWinner = (final.homeTeamId === userTeamId && homeWin) || (final.awayTeamId === userTeamId && !homeWin);

                if (isWinner) {
                    wonUCL = true;
                    uclResultString = 'Winner';
                } else if (isParticipant) {
                    uclResultString = 'Runner-up';
                } else {
                    const uclMatches = schedule.filter(m => m.competition === 'Champions League' && m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
                    const lastMatch = uclMatches[uclMatches.length - 1];
                    if (lastMatch) uclResultString = lastMatch.stage || '';
                }
            }

            const userMatches = schedule.filter(m => m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
            let wins = 0, draws = 0, losses = 0;
            let biggestWinDiff = -1, biggestLossDiff = -1;
            let biggestWinStr = "N/A", biggestLossStr = "N/A";

            userMatches.forEach(m => {
                const isHome = m.homeTeamId === userTeamId;
                const scored = isHome ? m.homeScore! : m.awayScore!;
                const conceded = isHome ? m.awayScore! : m.homeScore!;
                const oppId = isHome ? m.awayTeamId : m.homeTeamId;
                const oppTeam = teams.find(t => t.id === oppId);
                const oppName = oppTeam ? oppTeam.name : oppId;

                if (scored > conceded) {
                    wins++;
                    const diff = scored - conceded;
                    if (diff > biggestWinDiff || (diff === biggestWinDiff && scored > parseInt(biggestWinStr.split('-')[0] || '0'))) {
                        biggestWinDiff = diff;
                        biggestWinStr = `${scored}-${conceded} vs ${oppName}`;
                    }
                } else if (scored < conceded) {
                    losses++;
                    const diff = conceded - scored;
                    if (diff > biggestLossDiff || (diff === biggestLossDiff && conceded > parseInt(biggestLossStr.split('-')[1] || '0'))) {
                        biggestLossDiff = diff;
                        biggestLossStr = `${scored}-${conceded} vs ${oppName}`;
                    }
                } else {
                    draws++;
                }
            });

            if (userPos === 1 || wonUCL) {
                confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
            }

            const newRecord = await saveSeasonResult(activeProfile.id, {
                seasonYear: currentSeasonYear, teamId: userTeam.id, teamName: userTeam.name,
                position: userPos, points: userTeam.stats.points,
                wonLiga: userPos === 1, wonUcl: wonUCL,
                wins, draws, losses, biggestWin: biggestWinStr, biggestLoss: biggestLossStr
            });

            setActiveProfile(prev => prev ? ({ ...prev, history: [newRecord, ...prev.history] }) : null);
            setSeasonSummary({ position: userPos, points: userTeam.stats.points, wonLeague: userPos === 1, uclResult: uclResultString, message: "Season concluded." });
            setIsRecapOpen(true);
        } catch (error) {
            alert("Failed to save season data.");
            setSimState('ready');
        }
    }, [userTeamId, activeProfile, teams, schedule, currentSeasonYear]);

    useEffect(() => {
        if (currentWeek > maxWeek && simState !== 'season_over' && simState !== 'match_recap' && !isSimSummaryOpen) {
            handleConcludeSeason();
        }
    }, [currentWeek, maxWeek, simState, handleConcludeSeason, isSimSummaryOpen]);

    const handleSeasonTransition = async (stayWithTeam: boolean) => {
        setIsRecapOpen(false);
        setIsContractModalOpen(false);

        const resetTeams = teams.map(t => ({
            ...t,
            stats: { ...INITIAL_STATS, form: [] },
            uclStats: t.isUCL ? { ...INITIAL_UCL_STATS } : undefined
        }));
        setTeams(resetTeams);

        const ligaTeams = resetTeams.filter(t => t.tier === 1 && t.id !== 'TBD');
        const uclTeams = resetTeams.filter(t => t.isUCL && t.id !== 'TBD');

        const parts = currentSeasonYear.split('/');
        const newSeasonYear = `${parseInt(parts[0] || '2025', 10) + 1}/${parseInt(parts[1] || '26', 10) + 1}`;
        setCurrentSeasonYear(newSeasonYear);

        const nextSchedule = generateMasterSchedule(ligaTeams, uclTeams, newSeasonYear);
        setSchedule(nextSchedule);
        setCurrentWeek(1);
        setSeasonSummary(null);

        let newUserTeamId = userTeamId;
        if (!stayWithTeam || !userTeamId) {
            newUserTeamId = null;
            setUserTeamId(null);
            setSimState('select_team');
        } else {
            setSimState('ready');
        }

        if (activeProfile && newUserTeamId) {
            saveGame(activeProfile.id, { currentWeek: 1, userTeamId: newUserTeamId, schedule: nextSchedule, teams: resetTeams });
        }
    };

    const resultGroups = useMemo(() => {
        const playedInComp = schedule.filter(m => m.competition === resultsComp && m.played);
        const uniqueWeeks = Array.from(new Set(playedInComp.map(m => m.week))).sort((a: number, b: number) => a - b);

        return uniqueWeeks.map(week => {
            const matches = playedInComp.filter(m => m.week === week);
            if (userTeamId) matches.sort((a, b) => (a.homeTeamId === userTeamId || a.awayTeamId === userTeamId) ? -1 : 1);

            const dateStr = new Date(matches[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            let label = resultsComp === 'La Liga'
                ? dateStr
                : (matches[0]?.stage === 'League Phase' ? `League Phase - ${dateStr}` : `${matches[0]?.stage} - ${dateStr}`);

            return { week, matches, label };
        });
    }, [schedule, resultsComp, userTeamId]);

    useEffect(() => {
        setResultsIndex(resultGroups.length > 0 ? resultGroups.length - 1 : 0);
    }, [resultGroups.length, resultsComp]);

    const currentResultGroup = resultGroups[resultsIndex];

    const currentDayObj = useMemo(() => {
        if (!currentSeasonYear) return undefined;
        const { days } = getCompetitionWeeks(currentSeasonYear);
        return days.find(d => d.week === currentWeek) || days[days.length - 1];
    }, [currentSeasonYear, currentWeek]);

    const formattedCurrentDate = useMemo(() => {
        if (!currentDayObj) return "Unknown Date";
        const d = new Date(`${currentDayObj.date}T12:00:00Z`);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        return `${mm}.${dd} ${dayName}`;
    }, [currentDayObj]);

    const nextUserMatch = useMemo(() => {
        if (!userTeamId) return undefined;
        return schedule.find(m => m.week > currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
    }, [schedule, currentWeek, userTeamId]);

    const userMatch = useMemo(() => {
        if (!userTeamId) return undefined;
        return schedule.find(m => m.week === currentWeek && !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
    }, [schedule, currentWeek, userTeamId]);

    const userHome = useMemo(() => userMatch ? teams.find(t => t.id === userMatch.homeTeamId) : undefined, [userMatch, teams]);
    const userAway = useMemo(() => userMatch ? teams.find(t => t.id === userMatch.awayTeamId) : undefined, [userMatch, teams]);

    const isUCLWeek = useMemo(() => {
        if (simState === 'match_recap' && lastSimulatedMatchId) {
            const lastMatch = schedule.find(m => m.id === lastSimulatedMatchId);
            if (lastMatch) return lastMatch.competition === 'Champions League';
        }
        if (userMatch) return userMatch.competition === 'Champions League';
        return schedule.some(m => m.week === currentWeek && m.competition === 'Champions League');
    }, [userMatch, schedule, currentWeek, simState, lastSimulatedMatchId]);

    const isSeasonFinished = simState === 'season_over';
    const isScheduleComplete = currentWeek > maxWeek;
    const lastSimMatch = useMemo(() => lastSimulatedMatchId ? schedule.find(m => m.id === lastSimulatedMatchId) : undefined, [lastSimulatedMatchId, schedule]);
    const lastSimHome = useMemo(() => lastSimMatch ? teams.find(t => t.id === lastSimMatch.homeTeamId) : undefined, [lastSimMatch, teams]);
    const lastSimAway = useMemo(() => lastSimMatch ? teams.find(t => t.id === lastSimMatch.awayTeamId) : undefined, [lastSimMatch, teams]);

    // ─── Global Pre-Routing Flow ───
    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    if (!activeProfile) return <ProfileSelector onSelectProfile={handleSelectProfile} onLogout={handleLogout} />;

    // ─── Full Page Loading with polished loader ───
    if (isAppLoading) {
        return (
            <FullPageLoader
                title="Initializing Career"
                subtitle="Synchronizing databases & schedules..."
            />
        );
    }

    if (!userTeamId) return <TeamSelector teams={teams.filter(t => t.id !== 'TBD')} onSelect={handleSelectTeam} />;

    if (simState === 'squad_management') {
        const myTeam = teams.find(t => t.id === userTeamId);
        if (myTeam) return <SquadManagement team={myTeam} onUpdateTeam={handleUpdateTeam} onBack={() => setSimState('ready')} />;
    }

    if (simState === 'playing_match' && userMatch && userHome && userAway) {
        return <MatchView homeTeam={userHome} awayTeam={userAway} userTeamId={userTeamId} onMatchComplete={handleMatchComplete} competition={userMatch.competition} stage={userMatch.stage} />;
    }

    // Helper to check if results are still loading (no played matches yet)
    const hasNoResults = resultGroups.length === 0;

    return (
        <div className={`min-h-screen w-full overflow-x-hidden text-slate-100 p-2 sm:p-3 md:p-8 transition-colors duration-500 ${isUCLWeek ? 'bg-slate-950' : 'bg-slate-900'}`}>

            {/* Sim Summary Modal */}
            {isSimSummaryOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                        <div className="p-3 sm:p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center flex-wrap gap-3">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <CalendarDays className="text-blue-400" />
                                <span className="hidden sm:inline">Simulation Complete</span>
                                <span className="sm:hidden">Sim Complete</span>
                            </h2>
                            <div className="flex items-center gap-1 sm:gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 shrink-0">
                                <button
                                    onClick={() => { setSimSummaryFilter('mine'); setSummaryLimit(50); }}
                                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-colors outline-none focus:outline-none focus:ring-0 ${simSummaryFilter === 'mine' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    My Team Only
                                </button>
                                <button
                                    onClick={() => { setSimSummaryFilter('all'); setSummaryLimit(50); }}
                                    className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-colors outline-none focus:outline-none focus:ring-0 ${simSummaryFilter === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    All Matches
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-4 overflow-y-auto flex-1 bg-slate-900/50 space-y-2">
                            {(() => {
                                let sortedMatches = [...simSummaryMatches].sort((a, b) => a.week - b.week);

                                if (simSummaryFilter === 'mine') {
                                    sortedMatches = sortedMatches.filter(m => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId);
                                }

                                if (sortedMatches.length === 0) {
                                    return (
                                        <div className="py-12 flex flex-col items-center justify-center text-slate-500 animate-in fade-in duration-500">
                                            <Info size={40} className="mb-2 opacity-50" />
                                            <p className="text-sm">No matches to display.</p>
                                        </div>
                                    );
                                }

                                const visibleMatches = sortedMatches.slice(0, summaryLimit);
                                const hasMore = sortedMatches.length > summaryLimit;

                                return (
                                    <>
                                        {visibleMatches.map((m, idx) => {
                                            const h = teams.find(t => t.id === m.homeTeamId);
                                            const a = teams.find(t => t.id === m.awayTeamId);
                                            const d = typeof m.date === 'string' ? new Date(m.date) : m.date;
                                            const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                                            const isUserMatch = h?.id === userTeamId || a?.id === userTeamId;

                                            const homeWon = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                                            const awayWon = (m.awayScore ?? 0) > (m.homeScore ?? 0);
                                            const isDraw = m.homeScore === m.awayScore && m.homeScore !== null;

                                            const homeColor = homeWon ? 'text-green-400 font-extrabold' : (isDraw ? 'text-yellow-400 font-bold' : 'text-slate-500 font-normal');
                                            const awayColor = awayWon ? 'text-green-400 font-extrabold' : (isDraw ? 'text-yellow-400 font-bold' : 'text-slate-500 font-normal');
                                            const scoreColor = isDraw ? 'text-yellow-400 border-yellow-700/50' : 'text-white border-slate-700';

                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${isUserMatch ? 'bg-blue-900/30 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}
                                                >
                                                    <div className="text-[10px] sm:text-xs text-slate-400 w-8 sm:w-10 font-mono shrink-0">{dateStr}</div>

                                                    <div className={`flex-1 flex justify-end items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0 ${homeColor}`}>
                                                        <span className={`truncate ${h?.id === userTeamId ? 'font-black tracking-wide' : ''}`}>{h?.name}</span>
                                                        {h?.logoUrl ? (
                                                            <img src={h.logoUrl} className={`w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0 transition-opacity duration-300 ${!homeWon && !isDraw ? 'opacity-40 grayscale-[50%]' : ''}`} />
                                                        ) : (
                                                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 transition-opacity duration-300 ${!homeWon && !isDraw ? 'opacity-40' : ''}`} style={{ backgroundColor: h?.primaryColor || '#94a3b8' }}></div>
                                                        )}
                                                    </div>

                                                    <div className={`px-1.5 sm:px-3 py-1 bg-slate-900 font-mono font-bold rounded mx-1.5 sm:mx-3 border text-xs sm:text-sm shrink-0 min-w-[45px] sm:min-w-[60px] text-center transition-colors duration-300 ${scoreColor}`}>
                                                        {m.homeScore} - {m.awayScore}
                                                    </div>

                                                    <div className={`flex-1 flex justify-start items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0 ${awayColor}`}>
                                                        {a?.logoUrl ? (
                                                            <img src={a.logoUrl} className={`w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0 transition-opacity duration-300 ${!awayWon && !isDraw ? 'opacity-40 grayscale-[50%]' : ''}`} />
                                                        ) : (
                                                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 transition-opacity duration-300 ${!awayWon && !isDraw ? 'opacity-40' : ''}`} style={{ backgroundColor: a?.primaryColor || '#94a3b8' }}></div>
                                                        )}
                                                        <span className={`truncate ${a?.id === userTeamId ? 'font-black tracking-wide' : ''}`}>{a?.name}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {hasMore && (
                                            <button
                                                onClick={() => setSummaryLimit(prev => prev + 50)}
                                                className="w-full py-3 mt-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-bold text-xs sm:text-sm transition-colors outline-none focus:outline-none shadow-sm active:scale-95"
                                            >
                                                Load More Matches ({sortedMatches.length - summaryLimit} remaining)
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsSimSummaryOpen(false);
                                    if (simState === 'match_recap') {
                                        setSimState('ready');
                                    }
                                }}
                                className="bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 text-white font-bold py-2 sm:py-2.5 px-6 sm:px-8 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-200 active:scale-95 text-sm sm:text-base outline-none focus:outline-none focus:ring-0"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip to Season End Confirmation Modal */}
            {isSkipSeasonConfirmOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                        <FastForward size={48} className="mx-auto text-yellow-500 mb-4" />
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Skip to Season End?</h2>
                        <p className="text-slate-400 mb-8 text-xs sm:text-sm leading-relaxed">
                            Are you sure you want to simulate all remaining matches? This will instantly calculate all results until the end of the season. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 sm:gap-4 w-full">
                            <button onClick={() => setIsSkipSeasonConfirmOpen(false)} disabled={isSimulating} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors active:scale-95 text-sm sm:text-base outline-none focus:outline-none focus:ring-0">
                                Cancel
                            </button>
                            <button onClick={() => {
                                setIsSkipSeasonConfirmOpen(false);
                                runSimulation(maxWeek + 1, null, false, true);
                            }} disabled={isSimulating} className="flex-1 bg-yellow-600 hover:bg-yellow-500 hover:-translate-y-0.5 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all duration-200 active:scale-95 text-sm sm:text-base outline-none focus:outline-none focus:ring-0">
                                Simulate Season
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ManagerProfile
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                history={activeProfile.history}
                managerName={activeProfile.name}
                onUpdateName={handleUpdateManagerName}
                currentTeamLogo={userTeamId && teams.find(t => t.id === userTeamId) ? teams.find(t => t.id === userTeamId)?.logoUrl : undefined}
                currentSchedule={schedule}
                teams={teams}
                userTeamId={userTeamId}
            />

            {userTeamId && teams.find(t => t.id === userTeamId) && (
                <SeasonRecapModal
                    isOpen={isRecapOpen}
                    onClose={() => {
                        setIsRecapOpen(false);
                        setIsContractModalOpen(true);
                    }}
                    summary={seasonSummary}
                    team={teams.find(t => t.id === userTeamId)!}
                />
            )}

            <ContractModal
                isOpen={isContractModalOpen}
                team={teams.find(t => t.id === userTeamId) || null}
                onRenew={() => handleSeasonTransition(true)}
                onResign={() => handleSeasonTransition(false)}
            />

            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                schedule={schedule}
                teams={teams}
                userTeamId={userTeamId}
                currentWeek={currentWeek}
                onSimulateToWeek={handleSimulateToWeek}
                currentSeasonYear={currentSeasonYear}
            />

            <header className={`relative z-50 flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 p-3 sm:p-4 gap-3 sm:gap-4 rounded-xl border shadow-lg transition-colors duration-500 animate-in slide-in-from-top-4 fade-in backdrop-blur-md bg-opacity-90 ${isUCLWeek ? 'bg-blue-950 border-blue-900' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                        {isUCLWeek ? (
                            UCL_LOGO_URL ? (
                                <div className="bg-white rounded-lg p-1 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-sm">
                                    <img src={UCL_LOGO_URL} alt="UCL" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <Globe size={24} className="text-blue-400" />
                            )
                        ) : (
                            LIGA_LOGO_URL ? (
                                <img src={LIGA_LOGO_URL} alt="La Liga" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                            ) : (
                                <Trophy size={24} className="text-[#FF2B44]" />
                            )
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
                            {isUCLWeek ? 'Champions League Action' : 'La Liga Action'}
                        </h1>
                        <p className={`text-[10px] sm:text-xs truncate ${isUCLWeek ? 'text-blue-300' : 'text-slate-400'}`}>
                            Season {currentSeasonYear}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between sm:justify-end">
                    <div className="flex flex-1 sm:flex-none items-center bg-slate-900/80 rounded-lg border border-slate-700 font-mono font-bold text-white shadow-inner overflow-hidden min-w-0">
                        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm truncate hidden sm:block flex-1">
                            {userMatch
                                ? `Upcoming: ${(userHome?.id === userTeamId ? userAway : userHome)?.name} ${userHome?.id === userTeamId ? '(H)' : '(A)'} (${userMatch.competition === 'Champions League' ? 'UCL' : 'Liga'})`
                                : (isSeasonFinished || isScheduleComplete)
                                    ? "End of Season"
                                    : "No Match Today"}
                        </div>
                        <button
                            onClick={() => setIsCalendarOpen(true)}
                            className="bg-slate-800/80 hover:bg-slate-700 p-2 sm:p-2 h-full w-full sm:w-auto flex items-center justify-center sm:border-l border-slate-700 transition-colors text-slate-400 hover:text-white shrink-0 outline-none focus:outline-none focus:ring-0"
                        >
                            <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                    </div>

                    <button
                        onClick={() => setSimState('squad_management')}
                        className="flex items-center justify-center gap-2 px-3 sm:px-3 py-2 bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(79,70,229,0.3)] text-white rounded-lg transition-all duration-200 font-bold text-[10px] sm:text-xs md:text-sm shrink-0 outline-none focus:outline-none focus:ring-0"
                    >
                        <Shirt size={16} />
                        <span className="hidden lg:inline">Squad</span>
                    </button>

                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white shadow-sm outline-none focus:outline-none focus:ring-0"
                        >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner border border-blue-400/50">
                                <User size={14} className="sm:w-[16px] sm:h-[16px]" />
                            </div>
                            <div className="text-left hidden sm:block max-w-[120px] min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-white truncate">{activeProfile.name}</div>
                                <div className="text-[10px] text-slate-400 truncate -mt-0.5">Manager Profile</div>
                            </div>
                            <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showAccountMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Manager</p>
                                    <p className="text-sm text-white font-bold truncate mt-1">{activeProfile.name}</p>
                                </div>
                                <button
                                    onClick={() => { setShowAccountMenu(false); setIsProfileOpen(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors outline-none focus:outline-none focus:ring-0"
                                >
                                    <Trophy size={16} /> Career History
                                </button>
                                <button
                                    onClick={() => { setShowAccountMenu(false); handleExitProfile(); }}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors border-t border-slate-700 outline-none focus:outline-none focus:ring-0"
                                >
                                    <Users size={16} /> Switch Manager
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative z-10 w-full min-w-0">
                <div className="lg:col-span-2 flex flex-col order-2 lg:order-1 min-w-0 w-full">
                    <div className="w-full overflow-x-auto">
                        <LeagueTable
                            teams={teams}
                            userTeamId={userTeamId || ''}
                            activeTab={activeTableTab}
                            onTabChange={setActiveTableTab}
                            schedule={schedule}
                            currentWeek={currentWeek}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 w-full min-w-0 animate-in slide-in-from-right-4 fade-in duration-500">
                    <div className={`p-3 sm:p-4 md:p-6 rounded-xl border shadow-xl flex flex-col justify-between transition-colors duration-500 ${isUCLWeek ? 'bg-gradient-to-br from-blue-950 to-[#0b132b] border-blue-900' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 drop-shadow-sm">
                                    <Calendar size={18} className="text-blue-400" /> Action Center
                                </h2>
                                {simState !== 'season_over' && (
                                    <div className="text-[10px] sm:text-xs md:text-sm font-mono font-bold text-slate-300 bg-slate-900/80 px-2 md:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700 shadow-inner">
                                        {formattedCurrentDate}
                                    </div>
                                )}
                            </div>

                            {simState === 'season_over' ? (
                                <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                                    <Trophy size={48} className="text-yellow-500 mb-4" />
                                    <h3 className="text-white font-bold text-lg sm:text-xl mb-2">Season Completed</h3>
                                    <p className="text-slate-400 text-xs sm:text-sm">Please finalize your contract options in the pop-up.</p>
                                </div>
                            ) : simState === 'match_recap' && lastSimMatch && lastSimHome && lastSimAway ? (
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="mb-2 p-3 sm:p-4 bg-slate-900/80 rounded-lg border border-slate-700 shadow-xl backdrop-blur-sm">
                                        <div className="text-center text-[10px] sm:text-xs mb-2 uppercase tracking-wide font-bold text-green-400">Match Finished</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-center w-[40%] sm:w-1/3 flex flex-col items-center">
                                                {lastSimHome.logoUrl ? (
                                                    <img src={lastSimHome.logoUrl} className="w-10 h-10 sm:w-12 sm:h-12 mb-2 object-contain" />
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2" style={{ backgroundColor: lastSimHome.primaryColor }}></div>
                                                )}
                                                <div className="font-bold text-xs sm:text-sm md:text-lg leading-tight truncate w-full">{lastSimHome.shortName}</div>
                                            </div>
                                            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-white bg-slate-800 px-2 sm:px-3 py-1 rounded border border-slate-700 mx-1">
                                                {lastSimMatch.homeScore} - {lastSimMatch.awayScore}
                                            </div>
                                            <div className="text-center w-[40%] sm:w-1/3 flex flex-col items-center">
                                                {lastSimAway.logoUrl ? (
                                                    <img src={lastSimAway.logoUrl} className="w-10 h-10 sm:w-12 sm:h-12 mb-2 object-contain" />
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2" style={{ backgroundColor: lastSimAway.primaryColor }}></div>
                                                )}
                                                <div className="font-bold text-xs sm:text-sm md:text-lg leading-tight truncate w-full">{lastSimAway.shortName}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSimState('ready')}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/20 active:scale-95 text-sm sm:text-base outline-none focus:outline-none focus:ring-0"
                                    >
                                        Continue <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-900/60 rounded-lg border border-slate-700/80 backdrop-blur-sm shadow-inner">
                                    {userMatch ? (
                                        <>
                                            <div className={`text-center text-[10px] sm:text-xs mb-2 uppercase tracking-wide font-bold transition-colors ${isUCLWeek ? 'text-blue-400' : 'text-slate-500'}`}>
                                                {userMatch.competition}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-center w-[40%] sm:w-1/3 flex flex-col items-center">
                                                    {userHome?.logoUrl ? <img src={userHome.logoUrl} className="w-8 h-8 sm:w-10 sm:h-10 mb-2 object-contain" /> : null}
                                                    <div className="font-bold text-xs sm:text-sm md:text-lg leading-tight truncate w-full">{userHome?.name}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400">Home</div>
                                                </div>
                                                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-500 px-1">VS</div>
                                                <div className="text-center w-[40%] sm:w-1/3 flex flex-col items-center">
                                                    {userAway?.logoUrl ? <img src={userAway.logoUrl} className="w-8 h-8 sm:w-10 sm:h-10 mb-2 object-contain" /> : null}
                                                    <div className="font-bold text-xs sm:text-sm md:text-lg leading-tight truncate w-full">{userAway?.name}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400">Away</div>
                                                </div>
                                            </div>
                                        </>
                                    ) : isScheduleComplete ? (
                                        <div className="flex flex-col items-center text-center">
                                            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                                            <div className="font-bold text-emerald-100 text-sm sm:text-base">Schedule Complete</div>
                                            <div className="text-[10px] sm:text-xs text-emerald-200/70 mt-1">Season finalization pending</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-2">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 border border-slate-700 shadow-inner">
                                                <Calendar size={20} className="sm:w-[24px] sm:h-[24px] text-slate-400" />
                                            </div>
                                            <div className="font-bold text-slate-300 text-base sm:text-lg">Training & Rest</div>
                                            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">No match today</div>

                                            {nextUserMatch && (() => {
                                                const oppId = nextUserMatch.homeTeamId === userTeamId ? nextUserMatch.awayTeamId : nextUserMatch.homeTeamId;
                                                const opp = teams.find(t => t.id === oppId);
                                                const d = typeof nextUserMatch.date === 'string' ? new Date(nextUserMatch.date) : nextUserMatch.date;
                                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                const dd = String(d.getDate()).padStart(2, '0');
                                                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

                                                return (
                                                    <div className="mt-4 sm:mt-5 w-full bg-slate-900/80 rounded-lg border border-slate-700 p-2 sm:p-3 shadow-sm min-w-0">
                                                        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Next Match</div>
                                                        <div className="font-mono font-bold text-indigo-300 text-xs sm:text-sm">{mm}.{dd} {dayName}</div>
                                                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 min-w-0">
                                                            {opp?.logoUrl ? (
                                                                <img src={opp.logoUrl} className="w-3 h-3 sm:w-4 sm:h-4 object-contain shrink-0" />
                                                            ) : (
                                                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: opp?.primaryColor || '#94a3b8' }}></div>
                                                            )}
                                                            <span className="text-white font-bold text-xs sm:text-sm truncate">{opp?.name}</span>
                                                            <span className="text-[10px] sm:text-xs text-slate-400 font-mono shrink-0">
                                                                ({nextUserMatch.homeTeamId === userTeamId ? 'H' : 'A'})
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {simState !== 'season_over' && simState !== 'match_recap' && !isScheduleComplete && (
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                                {userMatch ? (
                                    <button
                                        onClick={handlePlayVisualMatch}
                                        disabled={isSimulating}
                                        className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 text-white font-bold py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-xs sm:text-sm md:text-base outline-none focus:outline-none focus:ring-0 disabled:opacity-50"
                                    >
                                        <Play size={14} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" /> Play
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSimToNextMatch}
                                        disabled={isSimulating}
                                        className="flex items-center justify-center gap-1 sm:gap-2 bg-indigo-700/80 hover:bg-indigo-600 hover:-translate-y-0.5 text-white font-bold py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg border border-indigo-600 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-200 text-xs sm:text-sm md:text-base outline-none focus:outline-none focus:ring-0 disabled:opacity-50"
                                    >
                                        {isSimulating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CalendarDays size={14} className="sm:w-[18px] sm:h-[18px]" />} Sim to Match
                                    </button>
                                )}
                                <button
                                    onClick={handleQuickSimWeek}
                                    disabled={isSimulating}
                                    className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-700/80 hover:bg-slate-600 hover:-translate-y-0.5 text-white font-bold py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg border border-slate-600 transition-all duration-200 text-xs sm:text-sm md:text-base outline-none focus:outline-none focus:ring-0 disabled:opacity-50"
                                >
                                    {isSimulating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FastForward size={14} className="sm:w-[18px] sm:h-[18px]" />} {userMatch ? 'Sim Match' : 'Sim Day'}
                                </button>
                                <button
                                    onClick={() => setIsSkipSeasonConfirmOpen(true)}
                                    disabled={isSimulating}
                                    className="col-span-2 flex items-center justify-center gap-1 sm:gap-2 font-bold py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm md:text-base bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-600 transition-colors outline-none focus:outline-none focus:ring-0 disabled:opacity-50"
                                >
                                    {isSimulating ? <div className="w-4 h-4 border-2 border-slate-300/30 border-t-slate-300 rounded-full animate-spin" /> : <FastForward size={14} className="sm:w-[18px] sm:h-[18px]" />} Skip to Season End
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results Panel with Skeleton Loading */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden flex flex-col w-full min-w-0 shadow-lg">
                        <div className="p-3 sm:p-4 bg-slate-900/50 border-b border-slate-700 space-y-2 sm:space-y-3">
                            <div className="relative">
                                <select
                                    value={resultsComp}
                                    onChange={(e) => setResultsComp(e.target.value as Competition)}
                                    className="w-full bg-slate-800 border border-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg p-2 sm:p-2.5 pl-8 sm:pl-10 appearance-none focus:ring-1 focus:ring-slate-500"
                                >
                                    <option value="La Liga">La Liga</option>
                                    <option value="Champions League">Champions League</option>
                                </select>
                                <div className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 pointer-events-none flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                                    {resultsComp === 'La Liga' && LIGA_LOGO_URL ? (
                                        <img src={LIGA_LOGO_URL} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                    ) : null}
                                    {resultsComp === 'Champions League' && UCL_LOGO_URL ? (
                                        <div className="bg-slate-200 rounded-full p-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                                            <img src={UCL_LOGO_URL} className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain" />
                                        </div>
                                    ) : null}
                                </div>
                                <ChevronDown className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 text-slate-400 sm:w-[16px] sm:h-[16px]" size={14} />
                            </div>
                            <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-1">
                                <button
                                    onClick={() => setResultsIndex((prev: number) => Math.max(0, prev - 1))}
                                    className="p-1 sm:p-1.5 hover:bg-slate-600 rounded transition-colors disabled:opacity-30"
                                    disabled={resultsIndex <= 0}
                                >
                                    <ChevronLeft size={14} className="sm:w-[16px] sm:h-[16px]" />
                                </button>
                                <h3 className="font-bold text-[10px] sm:text-xs uppercase truncate px-2 text-slate-200 tracking-wider">
                                    {currentResultGroup?.label || (hasNoResults ? 'No Matches Yet' : 'No Matches')}
                                </h3>
                                <button
                                    onClick={() => setResultsIndex((prev: number) => Math.min(resultGroups.length - 1, prev + 1))}
                                    className="p-1 sm:p-1.5 hover:bg-slate-600 rounded transition-colors disabled:opacity-30"
                                    disabled={resultsIndex >= resultGroups.length - 1}
                                >
                                    <ChevronRight size={14} className="sm:w-[16px] sm:h-[16px]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50 min-w-0 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
                            {hasNoResults ? (
                                /* ── Skeleton Results ── */
                                <div className="divide-y divide-slate-700/50">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <MatchResultSkeleton key={`res-skel-${i}`} index={i} />
                                    ))}
                                </div>
                            ) : currentResultGroup?.matches.length ? currentResultGroup.matches.map((match, idx) => {
                                const h = teams.find(t => t.id === match.homeTeamId);
                                const a = teams.find(t => t.id === match.awayTeamId);

                                if (!h || !a) return null;

                                return (
                                    // FIX 3: Removed staggered animations and delay classes
                                    <div
                                        key={match.id}
                                        className={`group hover:bg-slate-700/60 transition-all duration-200 hover:scale-[1.01] p-2 sm:p-3 flex justify-between items-center text-[10px] sm:text-sm min-w-0 cursor-default ${(h.id === userTeamId || a.id === userTeamId) ? (match.competition === 'Champions League' ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'bg-indigo-900/20 border-l-2 border-indigo-500') : 'bg-transparent'}`}
                                    >
                                        <div className="flex-1 text-right font-medium text-slate-300 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
                                            <span className={`truncate ${h.id === userTeamId ? 'text-white font-bold' : ''}`}>
                                                {h.name}
                                            </span>
                                            {h.logoUrl ? (
                                                <img src={h.logoUrl} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: h.primaryColor }}></div>
                                            )}
                                        </div>
                                        <div className="px-1.5 sm:px-3 font-bold text-white bg-slate-900/80 py-1 rounded mx-1.5 sm:mx-2 border border-slate-700 min-w-[40px] sm:min-w-[45px] text-center text-[10px] sm:text-xs shrink-0 transition-colors group-hover:border-slate-500">
                                            {match.homeScore} - {match.awayScore}
                                        </div>
                                        <div className="flex-1 text-left font-medium text-slate-300 flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            {a.logoUrl ? (
                                                <img src={a.logoUrl} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: a.primaryColor }}></div>
                                            )}
                                            <span className={`truncate ${a.id === userTeamId ? 'text-white font-bold' : ''}`}>
                                                {a.name}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-6 sm:p-8 text-center text-[10px] sm:text-sm text-slate-500 italic animate-in fade-in">
                                    No matches...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;