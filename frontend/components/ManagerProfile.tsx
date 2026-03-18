import React, { useState } from 'react';
import { PastSeason, Match, Team } from '../types';
import { Trophy, X, Calendar, Medal, Edit2, Check, User } from 'lucide-react';

interface ManagerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  history: PastSeason[];
  managerName: string | null;
  onUpdateName: (name: string) => void;
  currentTeamLogo?: string;
  currentSchedule?: Match[];
  teams?: Team[];
  userTeamId?: string | null;
}

const ManagerProfile: React.FC<ManagerProfileProps> = ({
  isOpen, onClose, history, managerName, onUpdateName, currentTeamLogo, currentSchedule, teams, userTeamId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(managerName || '');

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(editName.trim());
      setIsEditing(false);
    }
  };

  // --- Aggregate Career Statistics (Live + History) ---
  let uclTrophies = 0, ligaTrophies = 0;
  let totalWins = 0, totalDraws = 0, totalLosses = 0;
  let globalBiggestWinDiff = -1, globalBiggestLossDiff = -1;
  let globalBiggestWinStr = "N/A", globalBiggestLossStr = "N/A";

  // 1. Process Past History
  history.forEach(h => {
    if (h.wonUcl) uclTrophies++;
    if (h.wonLiga) ligaTrophies++;
    totalWins += h.wins || 0;
    totalDraws += h.draws || 0;
    totalLosses += h.losses || 0;

    if (h.biggestWin && h.biggestWin !== "N/A") {
      const matchResult = h.biggestWin.split(' vs ')[0];
      const gf = parseInt(matchResult.split('-')[0] || '0');
      const ga = parseInt(matchResult.split('-')[1] || '0');
      const diff = gf - ga;
      if (diff > globalBiggestWinDiff || (diff === globalBiggestWinDiff && gf > parseInt(globalBiggestWinStr.split('-')[0] || '0'))) {
        globalBiggestWinDiff = diff; globalBiggestWinStr = h.biggestWin;
      }
    }

    if (h.biggestLoss && h.biggestLoss !== "N/A") {
      const matchResult = h.biggestLoss.split(' vs ')[0];
      const gf = parseInt(matchResult.split('-')[0] || '0');
      const ga = parseInt(matchResult.split('-')[1] || '0');
      const diff = ga - gf;
      if (diff > globalBiggestLossDiff || (diff === globalBiggestLossDiff && ga > parseInt(globalBiggestLossStr.split('-')[1] || '0'))) {
        globalBiggestLossDiff = diff; globalBiggestLossStr = h.biggestLoss;
      }
    }
  });

  // 2. Add Live Active Season Matches to the Tally
  if (currentSchedule && userTeamId && teams) {
    const userMatches = currentSchedule.filter(m => m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId));
    userMatches.forEach(m => {
      const isHome = m.homeTeamId === userTeamId;
      const scored = isHome ? m.homeScore! : m.awayScore!;
      const conceded = isHome ? m.awayScore! : m.homeScore!;
      const oppId = isHome ? m.awayTeamId : m.homeTeamId;
      const oppTeam = teams.find(t => t.id === oppId);
      const oppName = oppTeam ? oppTeam.name : oppId;

      if (scored > conceded) {
        totalWins++;
        const diff = scored - conceded;
        if (diff > globalBiggestWinDiff || (diff === globalBiggestWinDiff && scored > parseInt(globalBiggestWinStr.split('-')[0] || '0'))) {
          globalBiggestWinDiff = diff; globalBiggestWinStr = `${scored}-${conceded} vs ${oppName}`;
        }
      } else if (scored < conceded) {
        totalLosses++;
        const diff = conceded - scored;
        if (diff > globalBiggestLossDiff || (diff === globalBiggestLossDiff && conceded > parseInt(globalBiggestLossStr.split('-')[1] || '0'))) {
          globalBiggestLossDiff = diff; globalBiggestLossStr = `${scored}-${conceded} vs ${oppName}`;
        }
      } else {
        totalDraws++;
      }
    });
  }

  const totalGames = totalWins + totalDraws + totalLosses;
  const winPct = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0.0";
  const drawPct = totalGames > 0 ? ((totalDraws / totalGames) * 100).toFixed(1) : "0.0";
  const lossPct = totalGames > 0 ? ((totalLosses / totalGames) * 100).toFixed(1) : "0.0";
  const avgPos = history.length > 0 ? (history.reduce((acc, curr) => acc + curr.position, 0) / history.length).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-600 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] min-w-0 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 sm:p-4 md:p-6 flex justify-between items-start border-b border-slate-700 shrink-0 min-w-0">
          <div className="flex gap-2 sm:gap-3 md:gap-4 items-center flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 md:ring-4 ring-slate-700 shadow-lg shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-9 md:h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full max-w-[200px]">
                    <input
                      type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white font-bold text-sm sm:text-base md:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-[100px]" autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1 sm:p-1.5 bg-green-600 hover:bg-green-500 rounded text-white transition-colors shrink-0"><Check size={16} className="md:w-[18px] md:h-[18px]" /></button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white truncate">{managerName || 'Unknown Manager'}</h2>
                    <button onClick={() => { setEditName(managerName || ''); setIsEditing(true); }} className="text-slate-500 hover:text-white transition-colors shrink-0"><Edit2 size={14} className="md:w-[16px] md:h-[16px]" /></button>
                  </>
                )}
              </div>
              <p className="text-slate-400 text-[9px] sm:text-xs md:text-sm truncate mt-0.5">Manager Profile • Career Overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 pl-2">
            {currentTeamLogo && (<img src={currentTeamLogo} alt="Current Club" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain drop-shadow-lg" />)}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-slate-700 rounded-full bg-slate-900/50"><X size={18} className="md:w-[24px] md:h-[24px]" /></button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-slate-900 flex flex-col custom-scrollbar min-w-0">
          
          <div className="bg-slate-800/50 shrink-0">
            {/* Trophies & Core Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 p-3 md:p-6">
              <div className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner text-center animate-in fade-in duration-300 fill-mode-both" style={{ animationDelay: '50ms' }}>
                <div className="text-blue-400 mb-0.5 md:mb-1"><Trophy size={20} className="md:w-[24px] md:h-[24px]" /></div>
                <div className="text-xl md:text-2xl font-bold text-white leading-tight">{uclTrophies}</div>
                <div className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-bold mt-1 truncate w-full px-1">UCL</div>
              </div>
              <div className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner text-center animate-in fade-in duration-300 fill-mode-both" style={{ animationDelay: '100ms' }}>
                <div className="text-[#FF2B44] mb-0.5 md:mb-1"><Trophy size={20} className="md:w-[24px] md:h-[24px]" /></div>
                <div className="text-xl md:text-2xl font-bold text-white leading-tight">{ligaTrophies}</div>
                <div className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-bold mt-1 truncate w-full px-1">La Liga</div>
              </div>
              <div className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner text-center animate-in fade-in duration-300 fill-mode-both" style={{ animationDelay: '150ms' }}>
                <div className="text-slate-400 mb-0.5 md:mb-1"><Calendar size={20} className="md:w-[24px] md:h-[24px]" /></div>
                <div className="text-xl md:text-2xl font-bold text-white leading-tight">{history.length}</div>
                <div className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-bold mt-1 truncate w-full px-1">Seasons</div>
              </div>
              <div className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner text-center animate-in fade-in duration-300 fill-mode-both" style={{ animationDelay: '200ms' }}>
                <div className="text-emerald-500 mb-0.5 md:mb-1"><Medal size={20} className="md:w-[24px] md:h-[24px]" /></div>
                <div className="text-xl md:text-2xl font-bold text-white leading-tight">{avgPos}</div>
                <div className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-bold mt-1 truncate w-full px-1">Avg Pos</div>
              </div>
            </div>

            {/* Detailed Career Stats Grid */}
            <div className="p-3 md:p-6 pt-0">
              <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Career Match Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="bg-slate-900/80 p-2 md:p-3 rounded-lg border border-slate-700 text-center shadow-md">
                  <div className="text-lg md:text-xl font-bold text-white">{totalGames}</div>
                  <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold mt-0.5">Played</div>
                </div>
                <div className="bg-emerald-900/20 p-2 md:p-3 rounded-lg border border-emerald-700/30 text-center shadow-md">
                  <div className="text-lg md:text-xl font-bold text-emerald-400">{totalWins}</div>
                  <div className="text-[9px] md:text-[10px] text-emerald-500 uppercase font-bold mt-0.5 truncate">Wins ({winPct}%)</div>
                </div>
                <div className="bg-slate-900/80 p-2 md:p-3 rounded-lg border border-slate-700 text-center shadow-md">
                  <div className="text-lg md:text-xl font-bold text-slate-300">{totalDraws}</div>
                  <div className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold mt-0.5 truncate">Draws ({drawPct}%)</div>
                </div>
                <div className="bg-red-900/20 p-2 md:p-3 rounded-lg border border-red-700/30 text-center shadow-md">
                  <div className="text-lg md:text-xl font-bold text-red-400">{totalLosses}</div>
                  <div className="text-[9px] md:text-[10px] text-red-500 uppercase font-bold mt-0.5 truncate">Losses ({lossPct}%)</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                <div className="bg-emerald-900/20 border border-emerald-700/30 p-2.5 md:p-3 rounded-lg flex flex-col justify-center items-center shadow-md">
                  <div className="text-[9px] md:text-[10px] text-emerald-500 uppercase font-bold mb-0.5">Biggest Career Win</div>
                  <div className="text-sm md:text-lg font-bold text-white text-center tracking-tight leading-tight">{globalBiggestWinStr}</div>
                </div>
                <div className="bg-red-900/20 border border-red-700/30 p-2.5 md:p-3 rounded-lg flex flex-col justify-center items-center shadow-md">
                  <div className="text-[9px] md:text-[10px] text-red-500 uppercase font-bold mb-0.5">Biggest Career Loss</div>
                  <div className="text-sm md:text-lg font-bold text-white text-center tracking-tight leading-tight">{globalBiggestLossStr}</div>
                </div>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 p-3 md:p-6 border-t border-slate-700 shadow-inner flex flex-col min-h-[150px]">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 shrink-0">Season by Season</h3>
            
            {history.length === 0 ? (
              <div className="text-center py-4 md:py-6 text-xs md:text-sm text-slate-600 italic border-2 border-dashed border-slate-800 rounded-xl my-auto">No seasons completed yet.</div>
            ) : (
              <div className="space-y-2 md:space-y-3 pb-2">
                {history.map((season, idx) => (
                  <div
                    key={season.id}
                    className="flex items-center justify-between p-3 md:p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors shadow-sm min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-sm md:text-base font-bold shrink-0 ${(season.wonLiga || season.wonUcl) ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-slate-700 text-slate-300'}`}>
                        {(season.wonLiga || season.wonUcl) ? <Trophy size={16} className="md:w-[18px] md:h-[18px]" /> : <span>#{season.position}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs md:text-base leading-tight truncate">{season.teamName}</div>
                        <div className="text-[10px] md:text-xs text-slate-400 font-mono truncate">{season.seasonYear} Season</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <div className="font-mono font-bold text-slate-200 text-xs md:text-base">{season.points} pts</div>
                      <div className="text-[8px] md:text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                        {season.wonUcl && season.wonLiga ? 'Double Winner' : season.wonUcl ? 'UCL Winner' : season.wonLiga ? 'Liga Champ' : season.position <= 4 ? 'UCL Qual' : 'Finished'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;
