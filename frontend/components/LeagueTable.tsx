import React, { useState, useEffect } from 'react';
import { Team, Match, Competition } from '../types';
import { Trophy, Globe, List, GitBranch } from 'lucide-react';
import { LIGA_LOGO_URL, UCL_LOGO_URL } from '../constants';

interface LeagueTableProps {
    teams: Team[];
    userTeamId: string;
    activeTab: Competition;
    onTabChange: (tab: Competition) => void;
    schedule: Match[];
    currentWeek: number;
}

const KnockoutBracket = ({ schedule, teams, userTeamId }: { schedule: Match[], teams: Team[], userTeamId: string }) => {
    const stages = ['Playoffs', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

    return (
        <div className="w-full h-full overflow-y-auto bg-slate-900 p-4 space-y-8">
            {stages.map(stageName => {
                const stageMatches = schedule.filter(m => m.stage === stageName);
                if (stageMatches.length === 0) return null;

                const pairs: Record<string, Match[]> = {};
                stageMatches.forEach(m => {
                    const parts = m.id.split('-');
                    const matchIdx = parts[parts.length - 1];
                    if (!pairs[matchIdx]) pairs[matchIdx] = [];
                    pairs[matchIdx].push(m);
                });

                return (
                    <div key={stageName} className="mb-8">
                        <h3 className="text-lg font-bold text-blue-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2">{stageName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.values(pairs).map((pair, idx) => {
                                const l1 = pair.find(m => !m.isLeg2);
                                const l2 = pair.find(m => m.isLeg2);
                                if (!l1) return null;

                                const homeTeam = teams.find(t => t.id === l1.homeTeamId);
                                const awayTeam = teams.find(t => t.id === l1.awayTeamId);

                                const isUserInvolved = homeTeam?.id === userTeamId || awayTeam?.id === userTeamId;

                                return (
                                    <div key={idx} className={`bg-slate-800 rounded-lg p-3 border ${isUserInvolved ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-700'}`}>
                                        <div className="flex flex-col gap-2">
                                            {/* Top Team */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {homeTeam?.logoUrl ? <img src={homeTeam.logoUrl} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-slate-700 rounded-full"></div>}
                                                    <span className={`text-sm font-bold ${homeTeam?.id === userTeamId ? 'text-white' : 'text-slate-300'}`}>{homeTeam?.name || (l1.placeholder || 'TBD')}</span>
                                                </div>
                                                <div className="text-sm font-mono flex gap-1">
                                                    {l1.played ? <span className="bg-slate-700 px-1 rounded">{l1.homeScore}</span> : <span className="text-slate-500">-</span>}
                                                    {l2?.played ? <span className="bg-slate-700 px-1 rounded">{l2.awayScore}</span> : null}
                                                </div>
                                            </div>
                                            {/* Bottom Team */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {awayTeam?.logoUrl ? <img src={awayTeam.logoUrl} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-slate-700 rounded-full"></div>}
                                                    <span className={`text-sm font-bold ${awayTeam?.id === userTeamId ? 'text-white' : 'text-slate-300'}`}>{awayTeam?.name || (l2?.placeholder || 'TBD')}</span>
                                                </div>
                                                <div className="text-sm font-mono flex gap-1">
                                                    {l1.played ? <span className="bg-slate-700 px-1 rounded">{l1.awayScore}</span> : <span className="text-slate-500">-</span>}
                                                    {l2?.played ? <span className="bg-slate-700 px-1 rounded">{l2.homeScore}</span> : null}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Aggregate or Penalty display */}
                                        {l1.played && l2?.played && (
                                            <div className="mt-2 text-center text-xs font-bold text-slate-400 bg-slate-900 rounded py-1">
                                                Agg: {l2.homeScore! + l1.awayScore!} - {l2.awayScore! + l1.homeScore!}
                                                {l2.homePenalties !== undefined && (
                                                    <span className="text-yellow-500 ml-2">(Pens: {l2.awayPenalties} - {l2.homePenalties})</span>
                                                )}
                                            </div>
                                        )}
                                        {stageName === 'Final' && l1.played && !l2 && (
                                            <div className="mt-2 text-center text-xs font-bold text-slate-400 bg-slate-900 rounded py-1">
                                                {l1.homePenalties !== undefined && (
                                                    <span className="text-yellow-500">(Pens: {l1.homePenalties} - {l1.awayPenalties})</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const LeagueTable: React.FC<LeagueTableProps> = ({ teams, userTeamId, activeTab, onTabChange, schedule, currentWeek }) => {
    const [uclView, setUclView] = useState<'League' | 'Knockout'>('League');

    // Determine if any Knockout matches have been generated yet
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

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex flex-col w-full h-[600px] lg:h-[720px] overflow-hidden">
            <div className="bg-slate-900/50 flex border-b border-slate-700 shrink-0">
                <button onClick={() => { onTabChange('La Liga'); setUclView('League'); }} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'La Liga' ? 'bg-slate-800 text-[#FF2B44] border-b-2 border-[#FF2B44]' : 'text-slate-400 hover:text-white'}`}>{LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} alt="La Liga" className="w-5 h-5 object-contain" /> : <Trophy size={16} />} La Liga</button>
                <button onClick={() => onTabChange('Champions League')} className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'Champions League' ? 'bg-slate-900/80 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>{UCL_LOGO_URL ? <div className="bg-slate-200 rounded-full p-0.5 w-6 h-6 flex items-center justify-center shrink-0"><img src={UCL_LOGO_URL} alt="UCL" className="w-5 h-5 object-contain" /></div> : <Globe size={16} />} Champions League</button>
            </div>

            {/* ONLY render the toggle tabs once the Knockout stage actually exists */}
            {activeTab === 'Champions League' && hasKnockoutMatches && (
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