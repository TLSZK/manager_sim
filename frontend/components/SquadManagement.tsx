import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Team, Player, Formation } from '../types';
import { FORMATIONS, getPositionFit, getPenalizedRating, alignRoster } from '../constants';
import { ChevronLeft, Shirt, Users, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface SquadManagementProps {
  team: Team;
  onUpdateTeam: (updatedTeam: Team) => void;
  onBack: () => void;
}

const SquadManagement: React.FC<SquadManagementProps> = ({ team, onUpdateTeam, onBack }) => {
  const [selectedFormation, setSelectedFormation] = useState<Formation>(team.formation || '4-3-3');
  const [roster, setRoster] = useState<Player[]>(team.roster || []);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const initializedRef = useRef<string | null>(null);

  // Sync local state when switching to a different team; otherwise leave local state as the source of truth
  useEffect(() => {
    const teamIdentifier = team.id || team.name || 'default';
    if (initializedRef.current !== teamIdentifier) {
        setSelectedFormation(team.formation || '4-3-3');
        setRoster(team.roster || []);
        initializedRef.current = teamIdentifier;
    }
  }, [team]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleFormationChange = (fmt: Formation) => {
    setSelectedFormation(fmt);
    // Re-align roster to the new formation so players are optimally placed
    const aligned = alignRoster(roster, fmt);
    setRoster(aligned);
    onUpdateTeam({ ...team, roster: aligned, formation: fmt });
  };

  const handlePlayerClick = (clickedPlayer: Player) => {
    if (selectedPlayerId === clickedPlayer.id) {
      setSelectedPlayerId(null);
      return;
    }

    if (!selectedPlayerId) {
      setSelectedPlayerId(clickedPlayer.id);
    } else {
      const playerAIndex = roster.findIndex(p => p.id === selectedPlayerId);
      const playerBIndex = roster.findIndex(p => p.id === clickedPlayer.id);
      if (playerAIndex === -1 || playerBIndex === -1) return;

      const newRoster = [...roster];
      const pA = { ...newRoster[playerAIndex] };
      const pB = { ...newRoster[playerBIndex] };

      // Prevent bench↔bench swaps
      if (pA.offField && pB.offField) {
        setSelectedPlayerId(null);
        return;
      }

      // Correctly swap offField status between the two clicked players
      const tempOffField = pA.offField;
      pA.offField = pB.offField;
      pB.offField = tempOffField;

      // Swap their array positions to freely persist visual spot selections
      newRoster[playerAIndex] = pB;
      newRoster[playerBIndex] = pA;

      setRoster(newRoster);
      onUpdateTeam({ ...team, roster: newRoster });
      setSelectedPlayerId(null);
    }
  };

  // Simply maintain the array sequence provided by the user's swaps 
  const starters = useMemo(() => {
      return roster.filter(p => !p.offField);
  }, [roster]);

  // Sort bench by rating so the highest rated subs are visible first
  const bench = useMemo(() => roster.filter(p => p.offField).sort((a, b) => b.rating - a.rating), [roster]);
  
  const getFormationPos = (index: number) => FORMATIONS[selectedFormation]?.[index] || { x: 50, y: 50, position: '?' };

  const outOfPosCount = useMemo(() => {
      return starters.filter((p, i) => getPositionFit(p.position, getFormationPos(i).position) === 'bad').length;
  }, [starters, selectedFormation]);

  return (
    <div className="h-[100dvh] bg-slate-900 text-slate-100 flex flex-col overflow-hidden w-full min-w-0">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 p-2 md:p-4 border-b border-slate-700/80 flex items-center justify-between shrink-0 z-50 shadow-lg">
        <button onClick={onBack} className="flex items-center gap-1 md:gap-2 text-slate-400 hover:text-white hover:-translate-x-0.5 transition-all duration-200 text-xs md:text-base">
            <ChevronLeft size={18} className="md:w-[20px] md:h-[20px]" /> <span>Back</span>
        </button>
        <h1 className="text-sm md:text-lg font-bold flex items-center gap-1.5 md:gap-2 text-slate-100">
            <Shirt size={16} className="md:w-[20px] md:h-[20px] text-indigo-400" /> Squad Management
        </h1>
        <div className="w-10"></div>
      </header>

      {outOfPosCount > 0 && (
          <div className="bg-red-900/50 border-b border-red-700 p-1.5 md:p-3 flex items-center justify-center gap-1.5 md:gap-2 text-red-200 text-[10px] md:text-sm shadow-inner shrink-0 z-40 text-center px-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0 md:w-[16px] md:h-[16px]" />
              <span className="truncate"><strong>Warning:</strong> {outOfPosCount} player{outOfPosCount > 1 ? 's' : ''} out of position.</span>
          </div>
      )}

      {/* Formation selector bar */}
      <div className="shrink-0 flex items-center gap-3 px-3 sm:px-5 py-2 bg-slate-800/40 border-b border-slate-700/60 z-40">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">Formation</span>
        <select value={selectedFormation} onChange={e => handleFormationChange(e.target.value as Formation)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white outline-none">
          <option value="4-3-3">4-3-3 Holding</option>
          <option value="4-2-3-1">4-2-3-1 Modern</option>
          <option value="4-4-2">4-4-2 Flat</option>
          <option value="3-5-2">3-5-2 Wingbacks</option>
        </select>
        <span className="text-[9px] text-slate-500 ml-auto hidden sm:block">Tap two players to swap positions</span>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden min-w-0 custom-scrollbar">

        <div className="w-full xl:flex-1 bg-slate-950 p-2 sm:p-4 md:p-6 flex items-center justify-center relative shrink-0 xl:overflow-hidden min-h-[40vw] xl:min-h-0 min-w-0">

             {/* Same 1000×583 aspect ratio as the live match canvas */}
             <div className="w-full relative rounded-lg md:rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10" style={{ aspectRatio: '1100 / 643', maxHeight: '100%', maxWidth: '100%' }}>
                 <svg viewBox="-50 -30 1100 643" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full" aria-hidden="true">
                 <rect x="-50" y="-30" width="1100" height="643" fill="#166534" />
                 {[0,2,4,6,8].map(i => <rect key={i} x={i*100} y="-30" width="100" height="643" fill="rgba(0,0,0,0.04)" />)}
                 <rect x="50" y="0" width="900" height="583" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <line x1="500" y1="0" x2="500" y2="583" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <circle cx="500" cy="291.5" r="78.4" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <circle cx="500" cy="291.5" r="6" fill="rgba(255,255,255,0.75)" />
                 <rect x="50"  y="118.6" width="141" height="345.7" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <rect x="809" y="118.6" width="141" height="345.7" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <rect x="50"  y="213.1" width="47" height="156.8" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <rect x="903" y="213.1" width="47" height="156.8" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <circle cx="144.2" cy="291.5" r="5" fill="rgba(255,255,255,0.75)" />
                 <circle cx="855.8" cy="291.5" r="5" fill="rgba(255,255,255,0.75)" />
                 <path d="M 191 228.6 A 78.4 78.4 0 0 1 191 354.4" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <path d="M 809 354.4 A 78.4 78.4 0 0 1 809 228.6" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <path d="M 58.6 0 A 8.6 8.6 0 0 1 50 8.6"       fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <path d="M 950 8.6 A 8.6 8.6 0 0 1 941.4 0"     fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <path d="M 50 574.4 A 8.6 8.6 0 0 1 58.6 583"   fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <path d="M 941.4 583 A 8.6 8.6 0 0 1 950 574.4" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                 <rect x="0"   y="253.6" width="50" height="75.8" fill="rgba(255,255,255,0.45)" />
                 <rect x="0"   y="253.6" width="50" height="75.8" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
                 <rect x="950" y="253.6" width="50" height="75.8" fill="rgba(255,255,255,0.45)" />
                 <rect x="950" y="253.6" width="50" height="75.8" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
                                        </svg>

                 {starters.map((player, index) => {
                     const pos = getFormationPos(index);
                     const isSelected = selectedPlayerId === player.id;
                     const fit = getPositionFit(player.position, pos.position);
                     const effectiveRating = getPenalizedRating(player.rating, player.position, pos.position);

                     return (
                         <button key={player.id} onClick={() => handlePlayerClick(player)} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 group z-10 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}`} style={{ left: `${((pos.x * 10 + 50) / 1100 * 100).toFixed(2)}%`, top: `${((pos.y * 5.83 + 30) / 643 * 100).toFixed(2)}%` }}>
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border md:border-2 shadow-lg flex items-center justify-center text-[8px] sm:text-[10px] md:text-base font-bold relative transition-colors ${isSelected ? 'ring-2 md:ring-4 ring-yellow-400 border-white' : 'border-white'}`} style={{ backgroundColor: team.primaryColor, color: team.secondaryColor === '#ffffff' ? 'white' : team.secondaryColor }}>
                                {player.number}
                                {isSelected && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-ping" />}
                                {fit === 'bad' && <div className="absolute -top-1 -left-1 bg-red-600 rounded-full shadow"><AlertTriangle size={10} className="text-white p-0.5" /></div>}
                                {fit === 'okay' && <div className="absolute -top-1 -left-1 bg-yellow-500 rounded-full shadow"><AlertTriangle size={10} className="text-black p-0.5" /></div>}
                            </div>
                            
                            <div className={`mt-0.5 px-1 py-0.5 rounded text-[7px] sm:text-[8px] md:text-xs font-bold truncate max-w-[50px] sm:max-w-[70px] md:max-w-[100px] text-center backdrop-blur-md border ${isSelected ? 'bg-yellow-400 text-black border-black/20' : 'bg-black/60 text-white border-black/20'}`}>
                                {player.name}
                            </div>
                            
                            <div className={`text-[6px] sm:text-[7px] md:text-[9px] font-bold drop-shadow-md px-1 rounded flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 ${fit === 'bad' ? 'bg-red-600/90 text-white' : fit === 'okay' ? 'bg-yellow-500/90 text-black' : 'bg-black/40 text-white'}`}>
                                <span className={fit === 'good' ? 'text-yellow-400' : 'inherit'}>{effectiveRating}</span>
                                {fit !== 'good' && <span className="line-through text-[5px] sm:text-[6px] md:text-[7px] opacity-70">({player.rating})</span>}
                                <span>{pos.position}</span>
                                {fit !== 'good' && <span className="opacity-80">({player.position})</span>}
                            </div>
                         </button>
                     );
                 })}
             </div>
        </div>

        {/* CHANGED: Removed min-h so it fully expands natively on mobile */}
        <div className="w-full xl:w-96 bg-slate-800 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col shrink-0 shadow-xl z-10 min-w-0 xl:h-full">
            <div className="p-2 md:p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10 min-w-0 backdrop-blur-sm">
                <div className="min-w-0 pr-2">
                    <h3 className="font-bold flex items-center gap-1.5 md:gap-2 text-white text-xs md:text-sm truncate"><Users size={14} className="text-blue-400 shrink-0 md:w-[18px] md:h-[18px]" /> Bench & Reserves</h3>
                    <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 truncate">Tap player to swap positions</p>
                </div>
                {selectedPlayerId && <button onClick={() => setSelectedPlayerId(null)} className="text-[10px] md:text-xs bg-red-500/20 text-red-400 px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 shrink-0">Cancel</button>}
            </div>
            {/* CHANGED: overflow-y-auto is now strictly applied on xl breakpoint only. Added pb-6 for clean mobile scroll ending. */}
            <div className="flex-1 p-2 md:p-3 pb-6 space-y-1.5 md:space-y-2 bg-slate-800 xl:overflow-y-auto custom-scrollbar">
                {bench.map(player => {
                    const isSelected = selectedPlayerId === player.id;
                    return (
                        <button key={player.id} onClick={() => handlePlayerClick(player)} className={`w-full p-2 md:p-3 rounded-lg border flex items-center justify-between transition-all duration-200 group relative min-w-0 ${isSelected ? 'bg-yellow-500/20 border-yellow-500 shadow-lg' : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-[10px] md:text-xs border shrink-0 ${isSelected ? 'bg-yellow-500 text-slate-900 border-yellow-400' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>{player.number}</div>
                                <div className="text-left min-w-0">
                                    <div className={`font-bold text-xs md:text-sm truncate ${isSelected ? 'text-yellow-400' : 'text-slate-200'}`}>{player.name}</div>
                                    <div className="text-[9px] md:text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                        <span className="bg-slate-900 px-1 md:px-1.5 rounded font-bold text-slate-300">{player.position}</span>
                                        <span>•</span>
                                        <span className="font-bold text-yellow-500">RAT {player.rating}</span>
                                    </div>
                                </div>
                            </div>
                            {selectedPlayerId && !isSelected && <ArrowRightLeft size={14} className="text-slate-500 group-hover:text-white animate-pulse shrink-0 md:w-[16px] md:h-[16px]" />}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SquadManagement;