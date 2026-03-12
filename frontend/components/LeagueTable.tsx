
import React, { useState, useEffect, useRef } from 'react';
import { Team, Competition, Match } from '../types';
import { Trophy, Globe, GitBranch, List } from 'lucide-react';
import { LIGA_LOGO_URL, UCL_LOGO_URL } from '../constants';

interface KnockoutBracketProps {
    schedule: Match[];
    teams: Team[];
    userTeamId: string;
}

// Fixed slot heights to ensure perfect alignment
const SLOT_HEIGHTS: Record<string, number> = {
    'Playoffs': 100,
    'Round of 16': 100,
    'Quarter-finals': 200,
    'Semi-finals': 400,
    'Final': 800
};

// SVG Connector Component for perfect curves and gaps
const Connector: React.FC<{ type: 'straight' | 'fork', height: number }> = ({ type, height }) => {
    const width = 32;
    const strokeWidth = 2;
    const color = "#64748b";
    const radius = 12;
    const midX = width / 2;

    if (type === 'straight') {
        return (
            <svg width={width} height={height} className="absolute top-0 right-full pointer-events-none" style={{ overflow: 'visible' }}>
                <path d={`M 0,${height / 2} L ${width},${height / 2}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
            </svg>
        );
    }

    const y1 = height * 0.25, y2 = height * 0.75, yMid = height * 0.5;
    return (
        <svg width={width} height={height} className="absolute top-0 right-full pointer-events-none" style={{ overflow: 'visible' }}>
            <path d={`M 0,${y1} L ${midX - radius},${y1} Q ${midX},${y1} ${midX},${y1 + radius} L ${midX},${yMid}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
            <path d={`M 0,${y2} L ${midX - radius},${y2} Q ${midX},${y2} ${midX},${y2 - radius} L ${midX},${yMid}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
            <path d={`M ${midX},${yMid} L ${width},${yMid}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
        </svg>
    );
};

const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ schedule, teams, userTeamId }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stages = ['Playoffs', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

    useEffect(() => {
        const timer = setTimeout(() => {
            let activeStage = 'Round of 16';
            for (const stage of stages) {
                const matches = schedule.filter(m => m.competition === 'Champions League' && m.stage === stage);
                if (matches.length > 0 && matches.some(m => !m.played)) { activeStage = stage; break; }
            }
            const el = document.getElementById(`stage-${activeStage}`);
            if (el && scrollRef.current) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 100);
        return () => clearTimeout(timer);
    }, [schedule]);

    const hasAnyData = schedule.some(m => m.competition === 'Champions League' && stages.includes(m.stage));
    if (!hasAnyData) return <div className="flex-1 flex items-center justify-center h-full bg-slate-900/50"><div className="text-[6rem] md:text-[10rem] font-black text-slate-800/80 tracking-widest animate-pulse select-none">TBD</div></div>;

    return (
        <div ref={scrollRef} className="flex flex-row overflow-auto h-full p-8 bg-slate-900/50 items-stretch gap-8 select-none">
            {stages.map((stage) => {
                const matches = schedule.filter(m => m.competition === 'Champions League' && m.stage === stage);
                const slotHeight = SLOT_HEIGHTS[stage] || 100;
                const uniqueTies: { m1: Match, m2?: Match }[] = [];
                const processed = new Set();

                matches.forEach(m => {
                    if (processed.has(m.id) || m.isLeg2) return;
                    if (stage === 'Final') { uniqueTies.push({ m1: m }); processed.add(m.id); return; }
                    const l2Id = m.id.replace('L1', 'L2'), m2 = matches.find(mm => mm.id === l2Id);
                    uniqueTies.push({ m1: m, m2 }); processed.add(m.id); if (m2) processed.add(m2.id);
                });

                uniqueTies.sort((a, b) => parseInt(a.m1.id.split('-').pop() || '0') - parseInt(b.m1.id.split('-').pop() || '0'));

                return (
                    <div key={stage} id={`stage-${stage}`} className="flex flex-col shrink-0 relative w-80">
                        <div className="h-10 flex items-center justify-center font-bold uppercase text-sm text-blue-400 tracking-widest sticky top-0 bg-slate-900/90 z-20 border-b border-blue-900/30 mb-4 backdrop-blur-sm shadow-sm">{stage}</div>
                        <div className="flex flex-col">{uniqueTies.map(({ m1, m2 }) => {
                            const home = teams.find(t => t.id === m1.homeTeamId), away = teams.find(t => t.id === m1.awayTeamId);
                            const homeName = home?.id === 'TBD' ? (m1.placeholder || 'TBD') : home?.name || 'Unknown', awayName = away?.id === 'TBD' ? (m1.placeholder || 'TBD') : away?.name || 'Unknown';
                            let aggHome = 0, aggAway = 0, isFinished = false, winnerId: string | null = null;
                            if (stage === 'Final') {
                                aggHome = m1.homeScore || 0;
                                aggAway = m1.awayScore || 0;
                                isFinished = m1.played;
                                if (isFinished) winnerId = m1.homeScore! > m1.awayScore! ? m1.homeTeamId : (m1.homeScore! < m1.awayScore! ? m1.awayTeamId : (m1.homePenalties! > m1.awayPenalties! ? m1.homeTeamId : m1.awayTeamId));
                            } else {
                                const s1h = m1.homeScore || 0, s1a = m1.awayScore || 0;
                                const s2h = m2?.homeScore || 0, s2a = m2?.awayScore || 0;
                                aggHome = s1h + s2a;
                                aggAway = s1a + s2h;
                                isFinished = !!(m1.played && m2?.played);
                                if (isFinished) {
                                    if (aggHome > aggAway) winnerId = m1.homeTeamId;
                                    else if (aggAway > aggHome) winnerId = m1.awayTeamId;
                                    else if (m2?.homePenalties !== undefined) winnerId = m2.awayPenalties! > m2.homePenalties! ? m1.homeTeamId : m1.awayTeamId;
                                }
                            }

                            const renderRow = (isTeamA: boolean) => {
                                const team = isTeamA ? home : away, name = isTeamA ? homeName : awayName, isW = winnerId === team?.id;
                                let s1: string | number = '-', s2: string | number = '-', agg: string | number = '-', pen: number | null = null;
                                if (stage !== 'Final') {
                                    s1 = m1.played ? (isTeamA ? m1.homeScore! : m1.awayScore!) : '-';
                                    s2 = m2?.played ? (isTeamA ? m2.awayScore! : m2.homeScore!) : '-';
                                    if (isFinished && m2?.homePenalties !== undefined) pen = isTeamA ? m2.awayPenalties! : m2.homePenalties!;
                                } else if (m1.played && m1.homePenalties !== undefined) {
                                    pen = isTeamA ? m1.homePenalties : m1.awayPenalties;
                                }
                                if (isFinished || (stage === 'Final' && m1.played)) agg = isTeamA ? aggHome : aggAway;

                                return (
                                    <div className={`flex justify-between items-center px-3 py-2 ${isW ? 'bg-gradient-to-r from-emerald-900/30 to-transparent' : (isFinished ? 'opacity-40' : '')}`}>
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden">{team?.logoUrl ? <img src={team.logoUrl} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-slate-700">{name[0]}</div>}<span className={`text-xs font-bold truncate ${team?.id === userTeamId ? 'text-blue-300' : 'text-slate-200'}`}>{name}</span></div>
                                        <div className="flex items-center justify-end gap-1 text-xs font-mono ml-2">{stage !== 'Final' && <><span className="text-slate-500 w-3">{s1}</span><span className="text-slate-500 w-3">{s2}</span></>}<span className={`font-bold w-5 text-center ${isW ? 'text-emerald-400' : 'text-slate-300'}`}>{agg}</span>{pen !== null && <span className="text-[10px] text-slate-400 w-5">({pen})</span>}</div>
                                    </div>
                                );
                            };
                            return (
                                <div key={m1.id} style={{ height: slotHeight }} className="flex items-center relative">{stage !== 'Playoffs' && <Connector type={stage === 'Round of 16' ? 'straight' : 'fork'} height={slotHeight} />}<div className={`w-full bg-slate-800 border rounded-lg overflow-hidden shadow-lg z-10 transition-all ${(home?.id === userTeamId || away?.id === userTeamId) ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-700'}`}><div className="border-b border-slate-700/50">{renderRow(true)}</div><div>{renderRow(false)}</div></div></div>
                            );
                        })}</div>
                    </div>
                )
            })}
        </div>
    );
};

interface LeagueTableProps {
    teams: Team[];
    userTeamId: string;
    activeTab: Competition;
    onTabChange: (tab: Competition) => void;
    schedule: Match[];
    currentWeek: number;
}

const LeagueTable: React.FC<LeagueTableProps> = ({ teams, userTeamId, activeTab, onTabChange, schedule }) => {
    const [uclView, setUclView] = useState<'League' | 'Knockout'>('League');

    useEffect(() => {
        if (activeTab === 'Champions League') {
            if (schedule.some(m => m.competition === 'Champions League' && m.stage !== 'League Phase')) setUclView('Knockout');
            else setUclView('League');
        }
    }, [schedule, activeTab]);

    const displayTeams = activeTab === 'La Liga' ? teams.filter(t => t.tier === 1) : teams.filter(t => t.uclStats !== undefined);
    const sortedTeams = [...displayTeams].sort((a, b) => {
        const statsA = activeTab === 'La Liga' ? a.stats : a.uclStats!;
        const statsB = activeTab === 'La Liga' ? b.stats : b.uclStats!;

        if (!statsA || !statsB) return 0;

        // 1. Sort by Points (Highest first)
        if (statsB.points !== statsA.points) return statsB.points - statsA.points;

        // 2. Sort by Goal Difference (Highest first)
        if (statsB.gd !== statsA.gd) return statsB.gd - statsA.gd;

        // 3. Sort by Goals For (Highest first)
        if (statsB.gf !== statsA.gf) return statsB.gf - statsA.gf;

        // 4. Sort Alphabetically (A-Z) if everything else is tied
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex flex-col w-full h-[600px] lg:h-[720px] overflow-hidden">
            <div className="bg-slate-900/50 flex border-b border-slate-700 shrink-0">
                <button onClick={() => { onTabChange('La Liga'); setUclView('League'); }} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'La Liga' ? 'bg-slate-800 text-[#FF2B44] border-b-2 border-[#FF2B44]' : 'text-slate-400 hover:text-white'}`}>{LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} alt="La Liga" className="w-5 h-5 object-contain" /> : <Trophy size={16} />} La Liga</button>
                <button onClick={() => onTabChange('Champions League')} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'Champions League' ? 'bg-slate-900/80 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>{UCL_LOGO_URL ? <div className="bg-slate-200 rounded-full p-0.5 w-6 h-6 flex items-center justify-center shrink-0"><img src={UCL_LOGO_URL} alt="UCL" className="w-5 h-5 object-contain" /></div> : <Globe size={16} />} Champions League</button>
            </div>

            {activeTab === 'Champions League' && (
                <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
                    <button onClick={() => setUclView('League')} className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${uclView === 'League' ? 'bg-slate-700/50 text-white' : 'text-slate-500 hover:bg-slate-700/30'}`}><List size={14} /> Table</button>
                    <button onClick={() => setUclView('Knockout')} className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${uclView === 'Knockout' ? 'bg-slate-700/50 text-white' : 'text-slate-500 hover:bg-slate-700/30'}`}><GitBranch size={14} /> Knockout</button>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden relative">
                {activeTab === 'Champions League' && uclView === 'Knockout' ? (
                    <KnockoutBracket schedule={schedule} teams={teams} userTeamId={userTeamId} />
                ) : (
                    <div className="w-full h-full overflow-auto">
                        <table className="w-full text-sm text-left table-auto">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-xs sticky top-0 z-10 shadow-sm">
                                <tr><th className="px-3 py-3 w-10 text-center">#</th><th className="px-3 py-3">Club</th><th className="px-1 py-3 text-center">MP</th><th className="px-1 py-3 text-center">W</th><th className="px-1 py-3 text-center">D</th><th className="px-1 py-3 text-center">L</th><th className="px-1 py-3 text-center hidden sm:table-cell">GF</th><th className="px-1 py-3 text-center hidden sm:table-cell">GA</th><th className="px-1 py-3 text-center">GD</th><th className="px-3 py-3 text-center font-bold text-slate-200">Pts</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {sortedTeams.map((team, index) => {
                                    const stats = activeTab === 'La Liga' ? team.stats : team.uclStats!, pos = index + 1;
                                    if (!stats) return null;
                                    let posClass = "text-slate-400";
                                    if (activeTab === 'La Liga') { if (pos === 1) posClass = "text-yellow-400 font-bold"; else if (pos <= 4) posClass = "text-blue-400"; else if (pos >= 18) posClass = "text-red-400"; }
                                    else { if (pos <= 8) posClass = "text-green-400 font-bold"; else if (pos <= 24) posClass = "text-blue-400"; else posClass = "text-red-400"; }
                                    return (
                                        <tr key={team.id} className={`${team.id === userTeamId ? 'bg-indigo-900/30' : 'hover:bg-slate-700/50'} transition-colors`}>
                                            <td className={`px-3 py-3 text-center text-xs ${posClass}`}>{pos}</td>
                                            <td className="px-3 py-3 font-medium text-slate-200 flex items-center gap-2 min-w-[120px] sm:min-w-0">{team.logoUrl ? <img src={team.logoUrl} className="w-5 h-5 object-contain shrink-0" /> : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}>{team.shortName[0]}</div>}<span className="truncate">{team.name}</span></td>
                                            <td className="px-1 py-3 text-center text-slate-400">{stats.played}</td>
                                            <td className="px-1 py-3 text-center text-slate-300">{stats.won}</td>
                                            <td className="px-1 py-3 text-center text-slate-300">{stats.drawn}</td>
                                            <td className="px-1 py-3 text-center text-slate-300">{stats.lost}</td>
                                            <td className="px-1 py-3 text-center text-slate-400 hidden sm:table-cell">{stats.gf}</td>
                                            <td className="px-1 py-3 text-center text-slate-400 hidden sm:table-cell">{stats.ga}</td>
                                            <td className="px-1 py-3 text-center text-slate-300 font-medium">{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</td>
                                            <td className="px-3 py-3 text-center font-bold text-slate-100">{stats.points}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeagueTable;
