import React, { useState, useEffect } from 'react';
import { Team, Match, Competition } from '../types';
import { Trophy, Globe, List, GitBranch } from 'lucide-react';
import { LIGA_LOGO_URL, UCL_LOGO_URL } from '../constants';
import { TableRowSkeleton } from './Skeletons';

interface LeagueTableProps {
    teams: Team[];
    userTeamId: string;
    activeTab: Competition;
    onTabChange: (tab: Competition) => void;
    schedule: Match[];
    currentWeek: number;
}

const getLegColor = (score1: number | '-', score2: number | '-') => {
    if (score1 === '-' || score2 === '-') return 'bg-slate-700/60 text-slate-400';
    if (score1 > score2) return 'bg-[#1a8551] text-white';
    if (score1 < score2) return 'bg-[#e11d48] text-white';
    return 'bg-slate-600 text-white';
};

// ── Position Legend Components ─────────────────────────────────────────

const LaLigaLegend = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5 bg-[#0f172a]/60 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">1st — Champion & UCL Qualification</span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">2nd-5th — UCL Qualification</span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">18th-20th — Relegation Zone</span>
        </div>
    </div>
);

const UCLLeagueLegend = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5 bg-[#0f172a]/60 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">1st-8th — Direct Round of 16</span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">9th-24th — Playoffs</span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">25th-36th — Eliminated</span>
        </div>
    </div>
);

const KnockoutBracket = ({ schedule, teams, userTeamId }: { schedule: Match[], teams: Team[], userTeamId: string }) => {
    const stages = ['Playoffs', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
    const visibleStages = stages.filter(s => schedule.some(m => m.stage === s));

    return (
        <div className="w-full h-full bg-[#0f172a] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex h-[1100px] md:h-[1200px] min-w-max p-4 md:p-8 gap-8 md:gap-12 select-none relative items-stretch">
                {visibleStages.map((stageName, colIdx) => {
                    const stageMatches = schedule.filter(m => m.stage === stageName);
                    if (stageMatches.length === 0) return null;

                    const pairs: Record<string, Match[]> = {};
                    stageMatches.forEach(m => {
                        const parts = m.id.split('-');
                        const matchIdx = parts[parts.length - 1];
                        if (!pairs[matchIdx]) pairs[matchIdx] = [];
                        pairs[matchIdx].push(m);
                    });

                    const sortedPairs = Object.values(pairs).sort((a, b) => {
                        const idxA = parseInt(a[0].id.split('-').pop() || '0');
                        const idxB = parseInt(b[0].id.split('-').pop() || '0');
                        return idxA - idxB;
                    });

                    return (
                        <div key={stageName} className="flex flex-col h-full w-[240px] md:w-[280px] shrink-0 relative z-10">
                            {sortedPairs.map((pair, idx) => {
                                const l1 = pair.find(m => !m.isLeg2);
                                const l2 = pair.find(m => m.isLeg2);
                                if (!l1) return null;

                                const teamA = teams.find(t => t.id === l1.homeTeamId);
                                const teamB = teams.find(t => t.id === l1.awayTeamId);

                                const isUserInvolved = teamA?.id === userTeamId || teamB?.id === userTeamId;

                                const aL1 = l1.played ? l1.homeScore : '-';
                                const bL1 = l1.played ? l1.awayScore : '-';
                                const aL2 = l2 ? (l2.played ? l2.awayScore : '-') : null; 
                                const bL2 = l2 ? (l2.played ? l2.homeScore : '-') : null;

                                const aAgg = (l1.played && l2?.played) ? (l1.homeScore! + l2.awayScore!) : (l1.played && !l2 ? l1.homeScore : '-');
                                const bAgg = (l1.played && l2?.played) ? (l1.awayScore! + l2.homeScore!) : (l1.played && !l2 ? l1.awayScore : '-');

                                const aPen = stageName === 'Final' ? l1.homePenalties : l2?.awayPenalties;
                                const bPen = stageName === 'Final' ? l1.awayPenalties : l2?.homePenalties;

                                let winnerA = false, winnerB = false;
                                if (l1.played && (!l2 || l2.played)) {
                                    const finalA = aAgg !== '-' ? (aAgg as number) : 0;
                                    const finalB = bAgg !== '-' ? (bAgg as number) : 0;

                                    if (finalA > finalB) winnerA = true;
                                    else if (finalB > finalA) winnerB = true;
                                    else if (aPen !== undefined && bPen !== undefined) {
                                        if (aPen > bPen) winnerA = true;
                                        if (bPen > aPen) winnerB = true;
                                    }
                                }

                                return (
                                    <div key={idx} className="flex flex-col justify-center relative animate-in fade-in zoom-in-95 duration-500 fill-mode-both" style={{ height: `${100 / sortedPairs.length}%`, animationDelay: `${(colIdx * 150) + (idx * 50)}ms` }}>
                                        <div className={`bg-[#1e293b] rounded-lg p-2 md:p-3 flex flex-col gap-2 md:gap-2.5 relative z-10 border ${isUserInvolved ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-slate-700/50'}`}>
                                            
                                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-1.5 mb-0.5">
                                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stageName}</span>
                                                {stageName !== 'Final' && (
                                                    <div className="flex gap-1 text-[8px] md:text-[9px] text-slate-500 font-bold uppercase">
                                                        <span className="w-4 md:w-5 text-center">L1</span>
                                                        <span className="w-4 md:w-5 text-center">L2</span>
                                                        <span className="w-[30px] md:w-[40px] text-right pr-1">Agg</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between min-w-0">
                                                <div className={`flex items-center gap-1.5 md:gap-2 min-w-0 ${winnerA ? 'text-white font-bold' : (l1.played ? 'text-slate-300' : 'text-slate-400')}`}>
                                                    {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-4 h-4 md:w-5 md:h-5 object-contain shrink-0" /> : <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-700 rounded-full shrink-0"></div>}
                                                    <span className="text-[11px] md:text-[13px] truncate w-[80px] md:w-[120px]">{teamA?.name || l1.placeholder || 'TBD'}</span>
                                                </div>
                                                
                                                <div className="flex gap-0.5 md:gap-1 font-mono text-[10px] md:text-[12px] font-medium items-center shrink-0">
                                                    {stageName !== 'Final' ? (
                                                        <>
                                                            <div className={`w-4 md:w-5 h-5 md:h-6 flex items-center justify-center rounded-[3px] ${getLegColor(aL1, bL1)}`}>{aL1}</div>
                                                            {l2 && <div className={`w-4 md:w-5 h-5 md:h-6 flex items-center justify-center rounded-[3px] ${getLegColor(aL2, bL2)}`}>{aL2}</div>}
                                                            <div className={`flex items-center justify-end w-[30px] md:w-[40px] ml-1 pr-1 bg-[#0f172a] rounded-[3px] h-5 md:h-6`}>
                                                                {aPen !== undefined && <span className="text-[9px] md:text-[10px] text-yellow-500 font-bold mr-0.5 md:mr-1 leading-none">({aPen})</span>}
                                                                <span className={`text-center ${winnerA ? 'text-white font-bold' : (l1.played ? 'text-slate-400' : 'text-slate-600')}`}>{aAgg}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={`flex items-center justify-center w-8 md:w-10 h-5 md:h-6 rounded-[3px] ${getLegColor(aL1, bL1)}`}>
                                                            {aPen !== undefined && <span className="text-[9px] md:text-[10px] text-yellow-500 font-bold mr-0.5 md:mr-1 leading-none">({aPen})</span>}
                                                            <span className={l1.played ? 'text-white' : 'text-slate-400'}>{aL1}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between min-w-0">
                                                <div className={`flex items-center gap-1.5 md:gap-2 min-w-0 ${winnerB ? 'text-white font-bold' : (l1.played ? 'text-slate-300' : 'text-slate-400')}`}>
                                                    {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-4 h-4 md:w-5 md:h-5 object-contain shrink-0" /> : <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-700 rounded-full shrink-0"></div>}
                                                    <span className="text-[11px] md:text-[13px] truncate w-[80px] md:w-[120px]">{teamB?.name || l2?.placeholder || 'TBD'}</span>
                                                </div>
                                                
                                                <div className="flex gap-0.5 md:gap-1 font-mono text-[10px] md:text-[12px] font-medium items-center shrink-0">
                                                    {stageName !== 'Final' ? (
                                                        <>
                                                            <div className={`w-4 md:w-5 h-5 md:h-6 flex items-center justify-center rounded-[3px] ${getLegColor(bL1, aL1)}`}>{bL1}</div>
                                                            {l2 && <div className={`w-4 md:w-5 h-5 md:h-6 flex items-center justify-center rounded-[3px] ${getLegColor(bL2, aL2)}`}>{bL2}</div>}
                                                            <div className={`flex items-center justify-end w-[30px] md:w-[40px] ml-1 pr-1 bg-[#0f172a] rounded-[3px] h-5 md:h-6`}>
                                                                {bPen !== undefined && <span className="text-[9px] md:text-[10px] text-yellow-500 font-bold mr-0.5 md:mr-1 leading-none">({bPen})</span>}
                                                                <span className={`text-center ${winnerB ? 'text-white font-bold' : (l1.played ? 'text-slate-400' : 'text-slate-600')}`}>{bAgg}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={`flex items-center justify-center w-8 md:w-10 h-5 md:h-6 rounded-[3px] ${getLegColor(bL1, aL1)}`}>
                                                            {bPen !== undefined && <span className="text-[9px] md:text-[10px] text-yellow-500 font-bold mr-0.5 md:mr-1 leading-none">({bPen})</span>}
                                                            <span className={l1.played ? 'text-white' : 'text-slate-400'}>{bL1}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Connectors */}
                                        {colIdx < visibleStages.length - 1 && (
                                            <>
                                                {stageName === 'Playoffs' ? (
                                                    <div className="absolute top-1/2 -right-4 md:-right-6 w-4 md:w-6 h-[2px] bg-[#334155] z-0 pointer-events-none -translate-y-1/2" />
                                                ) : (
                                                    idx % 2 === 0 ? (
                                                        <div className="absolute top-1/2 -right-4 md:-right-6 w-4 md:w-6 h-1/2 border-t-2 border-r-2 border-[#334155] rounded-tr-xl z-0 pointer-events-none" />
                                                    ) : (
                                                        <div className="absolute bottom-1/2 -right-4 md:-right-6 w-4 md:w-6 h-1/2 border-b-2 border-r-2 border-[#334155] rounded-br-xl z-0 pointer-events-none" />
                                                    )
                                                )}
                                            </>
                                        )}
                                        {/* Left Connectors */}
                                        {colIdx > 0 && (
                                            <div className="absolute top-1/2 -left-4 md:-left-6 w-4 md:w-6 h-[2px] bg-[#334155] z-0 pointer-events-none -translate-y-1/2" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LeagueTable: React.FC<LeagueTableProps> = ({ teams, userTeamId, activeTab, onTabChange, schedule, currentWeek }) => {
    const [uclView, setUclView] = useState<'League' | 'Knockout'>('League');

    const hasKnockoutMatches = schedule.some(m => m.competition === 'Champions League' && m.stage !== 'League Phase');

    useEffect(() => {
        if (activeTab === 'Champions League') {
            if (hasKnockoutMatches) setUclView('Knockout');
            else setUclView('League');
        }
    }, [activeTab, hasKnockoutMatches]);

    const displayTeams = activeTab === 'La Liga' ? teams.filter(t => t.tier === 1) : teams.filter(t => t.uclStats !== undefined);
    const sortedTeams = [...displayTeams].sort((a, b) => {
        const statsA = activeTab === 'La Liga' ? a.stats : a.uclStats!;
        const statsB = activeTab === 'La Liga' ? b.stats : b.uclStats!;
        if (!statsA || !statsB) return 0;
        if (statsB.points !== statsA.points) return statsB.points - statsA.points;
        if (statsB.gd !== statsA.gd) return statsB.gd - statsA.gd;
        if (statsB.gf !== statsA.gf) return statsB.gf - statsA.gf;
        return a.name.localeCompare(b.name);
    });

    const isTableLoading = displayTeams.length === 0;
    const showLeagueTable = !(activeTab === 'Champions League' && uclView === 'Knockout');

    return (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl flex flex-col w-full h-[500px] md:h-[600px] lg:h-[720px] overflow-hidden min-w-0">
            <div className="bg-[#0f172a]/50 flex border-b border-slate-700 shrink-0">
                <button onClick={() => { onTabChange('La Liga'); setUclView('League'); }} className={`flex-1 py-3 md:py-4 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-colors ${activeTab === 'La Liga' ? 'bg-[#1e293b] text-[#FF2B44] border-b-2 border-[#FF2B44]' : 'text-slate-400 hover:text-white'}`}>{LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} alt="La Liga" className="w-4 h-4 md:w-5 md:h-5 object-contain" /> : <Trophy size={14} className="md:w-[16px] md:h-[16px]" />} <span className="truncate">La Liga</span></button>
                <button onClick={() => onTabChange('Champions League')} className={`flex-1 py-3 md:py-4 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-colors ${activeTab === 'Champions League' ? 'bg-[#1e293b] text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>{UCL_LOGO_URL ? <div className="bg-slate-200 rounded-full p-0.5 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center shrink-0"><img src={UCL_LOGO_URL} alt="UCL" className="w-3.5 h-3.5 md:w-5 md:h-5 object-contain" /></div> : <Globe size={14} className="md:w-[16px] md:h-[16px]" />} <span className="truncate">UCL</span></button>
            </div>

            {activeTab === 'Champions League' && hasKnockoutMatches && (
                <div className="flex bg-[#1e293b] border-b border-slate-700 shrink-0">
                    <button onClick={() => setUclView('League')} className={`flex-1 py-2 text-[10px] md:text-xs font-bold uppercase flex items-center justify-center gap-1.5 md:gap-2 ${uclView === 'League' ? 'bg-slate-700/50 text-white' : 'text-slate-500 hover:bg-slate-700/30'}`}><List size={12} className="md:w-[14px] md:h-[14px]" /> League Phase</button>
                    <button onClick={() => setUclView('Knockout')} className={`flex-1 py-2 text-[10px] md:text-xs font-bold uppercase flex items-center justify-center gap-1.5 md:gap-2 ${uclView === 'Knockout' ? 'bg-slate-700/50 text-white' : 'text-slate-500 hover:bg-slate-700/30'}`}><GitBranch size={12} className="md:w-[14px] md:h-[14px]" /> Knockout</button>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden relative">
                {activeTab === 'Champions League' && uclView === 'Knockout' ? (
                    <KnockoutBracket schedule={schedule} teams={teams} userTeamId={userTeamId} />
                ) : (
                    <div className="w-full h-full overflow-x-auto flex flex-col [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <table className="w-full min-w-[450px] text-xs md:text-sm text-left table-auto">
                                <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] md:text-xs sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-2 md:px-3 py-2 md:py-3 w-8 md:w-10 text-center">#</th>
                                        <th className="px-2 md:px-3 py-2 md:py-3">Club</th>
                                        <th className="px-1 py-2 md:py-3 text-center">MP</th>
                                        <th className="px-1 py-2 md:py-3 text-center">W</th>
                                        <th className="px-1 py-2 md:py-3 text-center">D</th>
                                        <th className="px-1 py-2 md:py-3 text-center">L</th>
                                        <th className="px-1 py-2 md:py-3 text-center hidden sm:table-cell">GF</th>
                                        <th className="px-1 py-2 md:py-3 text-center hidden sm:table-cell">GA</th>
                                        <th className="px-1 py-2 md:py-3 text-center">GD</th>
                                        <th className="px-2 md:px-3 py-2 md:py-3 text-center font-bold text-slate-200">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50 bg-[#1e293b]">
                                    {isTableLoading ? (
                                        Array.from({ length: activeTab === 'La Liga' ? 20 : 16 }).map((_, i) => (
                                            <TableRowSkeleton key={`skel-${i}`} index={i} />
                                        ))
                                    ) : (
                                        sortedTeams.map((team, index) => {
                                            const stats = activeTab === 'La Liga' ? team.stats : team.uclStats!, pos = index + 1;
                                            if (!stats) return null;
                                            let posClass = "text-slate-400";
                                            if (activeTab === 'La Liga') { if (pos === 1) posClass = "text-yellow-400 font-bold"; else if (pos <= 5) posClass = "text-blue-400"; else if (pos >= 18) posClass = "text-red-400"; }
                                            else { if (pos <= 8) posClass = "text-green-400 font-bold"; else if (pos <= 24) posClass = "text-blue-400"; else posClass = "text-red-400"; }
                                            return (
                                                <tr key={team.id} className={`${team.id === userTeamId ? 'bg-indigo-900/40' : 'hover:bg-slate-700/30'} transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both`} style={{ animationDelay: `${index * 30}ms` }}>
                                                    <td className={`px-2 md:px-3 py-2 md:py-3 text-center text-[10px] md:text-xs ${posClass}`}>{pos}</td>
                                                    <td className="px-2 md:px-3 py-2 md:py-3 font-medium text-slate-200 flex items-center gap-1.5 md:gap-2 min-w-[100px] md:min-w-[120px] sm:min-w-0">{team.logoUrl ? <img src={team.logoUrl} className="w-4 h-4 md:w-5 md:h-5 object-contain shrink-0" /> : <div className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}>{team.shortName[0]}</div>}<span className="truncate text-xs md:text-sm">{team.name}</span></td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-400">{stats.played}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-300">{stats.won}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-300">{stats.drawn}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-300">{stats.lost}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-400 hidden sm:table-cell">{stats.gf}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-400 hidden sm:table-cell">{stats.ga}</td>
                                                    <td className="px-1 py-2 md:py-3 text-center text-slate-300 font-medium">{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</td>
                                                    <td className="px-2 md:px-3 py-2 md:py-3 text-center font-bold text-slate-100">{stats.points}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* ── Position Color Legend ── */}
                        <div className="shrink-0">
                            {activeTab === 'La Liga' ? <LaLigaLegend /> : <UCLLeagueLegend />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeagueTable;