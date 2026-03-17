import React, { useState, useEffect, useMemo } from 'react';
import { Team, Player, Formation } from '../types';
import { FORMATIONS, getPositionFit, getPenalizedRating } from '../constants';
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
  
  const [isVertical, setIsVertical] = useState<boolean>(true);

  useEffect(() => {
    const checkOrientation = () => setIsVertical(window.innerWidth < 1280);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleFormationChange = (fmt: Formation) => {
    setSelectedFormation(fmt);
    onUpdateTeam({ ...team, formation: fmt });
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
      [newRoster[playerAIndex], newRoster[playerBIndex]] = [newRoster[playerBIndex], newRoster[playerAIndex]];
      newRoster.forEach((p, index) => { p.offField = index > 10; });

      setRoster(newRoster);
      onUpdateTeam({ ...team, roster: newRoster });
      setSelectedPlayerId(null);
    }
  };

  const starters = roster.slice(0, 11);
  const bench = roster.slice(11);
  const getFormationPos = (index: number) => FORMATIONS[selectedFormation][index] || { x: 50, y: 50, position: '?' };

  const outOfPosCount = useMemo(() => {
      return starters.filter((p, i) => getPositionFit(p.position, getFormationPos(i).position) === 'bad').length;
  }, [starters, selectedFormation]);

  return (
    <div className="h-[100dvh] bg-slate-900 text-slate-100 flex flex-col overflow-hidden w-full min-w-0">
      {/* Header */}
      <header className="bg-slate-800 p-2 md:p-4 border-b border-slate-700 flex items-center justify-between shrink-0 z-50 shadow-md">
        <button onClick={onBack} className="flex items-center gap-1 md:gap-2 text-slate-300 hover:text-white transition-colors text-xs md:text-base">
            <ChevronLeft size={18} className="md:w-[20px] md:h-[20px]" /> <span>Back</span>
        </button>
        <h1 className="text-sm md:text-lg font-bold flex items-center gap-1.5 md:gap-2"><Shirt size={16} className="md:w-[20px] md:h-[20px]" /> Squad</h1>
        <div className="w-10"></div> 
      </header>

      {/* Warning Banner */}
      {outOfPosCount > 0 && (
          <div className="bg-red-900/50 border-b border-red-700 p-1.5 md:p-3 flex items-center justify-center gap-1.5 md:gap-2 text-red-200 text-[10px] md:text-sm shadow-inner shrink-0 z-40 text-center px-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0 md:w-[16px] md:h-[16px]" />
              <span className="truncate"><strong>Warning:</strong> {outOfPosCount} player{outOfPosCount > 1 ? 's' : ''} out of position.</span>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-w-0">
        
        {/* Pitch View */}
        <div className="w-full xl:flex-1 bg-slate-950 p-2 md:p-6 flex flex-col items-center relative shrink-0 overflow-y-auto xl:overflow-hidden min-h-[50vh] xl:min-h-0 min-w-0">
             <div className="w-full max-w-[600px] mb-2 md:mb-4 z-20 flex justify-center">
                <div className="bg-slate-800/90 p-1.5 md:p-2 rounded-lg border border-slate-700 shadow-lg flex items-center gap-2 md:gap-3">
                    <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">Formation</span>
                    <select value={selectedFormation} onChange={(e) => handleFormationChange(e.target.value as Formation)} className="bg-slate-900 border border-slate-600 rounded px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs outline-none text-white min-w-[80px] md:min-w-[100px]">
                        <option value="4-3-3">4-3-3 Attack</option>
                        <option value="4-4-2">4-4-2 Flat</option>
                        <option value="3-5-2">3-5-2</option>
                    </select>
                </div>
             </div>

             <div className={`w-full max-w-[400px] sm:max-w-[500px] xl:max-w-[800px] ${isVertical ? 'aspect-[3/4]' : 'aspect-[4/3]'} bg-emerald-700 rounded-lg md:rounded-xl border-2 md:border-4 border-slate-800 relative shadow-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-300 min-h-0`}>
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
                 <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.05) 99px)' }}></div>
                 
                 <div className="absolute inset-0 m-auto w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 border border-white/30 rounded-full" />
                 
                 {isVertical ? (
                    <>
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/30 -translate-y-1/2" />
                        <div className="absolute top-0 left-1/4 right-1/4 h-8 sm:h-12 md:h-16 border-b border-l border-r border-white/30" />
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-8 sm:h-12 md:h-16 border-t border-l border-r border-white/30" />
                    </>
                 ) : (
                    <>
                        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/30 -translate-x-1/2" />
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-8 sm:w-12 md:w-16 border-r border-t border-b border-white/30" />
                        <div className="absolute right-0 top-1/4 bottom-1/4 w-8 sm:w-12 md:w-16 border-l border-t border-b border-white/30" />
                    </>
                 )}

                 {starters.map((player, index) => {
                     const pos = getFormationPos(index);
                     const isSelected = selectedPlayerId === player.id;
                     const fit = getPositionFit(player.position, pos.position);
                     const effectiveRating = getPenalizedRating(player.rating, player.position, pos.position);
                     
                     let style: React.CSSProperties = isVertical 
                        ? { left: `${pos.y}%`, top: `${100 - pos.x}%` }
                        : { left: `${pos.x}%`, top: `${pos.y}%` };

                     return (
                         <button key={player.id} onClick={() => handlePlayerClick(player)} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 group z-10 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}`} style={style}>
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
                                <span>{player.position}</span>
                                {fit !== 'good' && <span className="opacity-80">({pos.position})</span>}
                            </div>
                         </button>
                     );
                 })}
             </div>
        </div>

        {/* Roster List */}
        <div className="w-full xl:w-96 bg-slate-800 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col shrink-0 min-h-[40vh] xl:min-h-0 xl:h-auto shadow-xl z-10 min-w-0">
            <div className="p-2 md:p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10 min-w-0">
                <div className="min-w-0 pr-2">
                    <h3 className="font-bold flex items-center gap-1.5 md:gap-2 text-white text-xs md:text-sm truncate"><Users size={14} className="text-blue-400 shrink-0 md:w-[18px] md:h-[18px]" /> Bench & Reserves</h3>
                    <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 truncate">Tap player to swap positions</p>
                </div>
                {selectedPlayerId && <button onClick={() => setSelectedPlayerId(null)} className="text-[10px] md:text-xs bg-red-500/20 text-red-400 px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 shrink-0">Cancel</button>}
            </div>
            <div className="flex-1 p-2 md:p-3 space-y-1.5 md:space-y-2 bg-slate-800 overflow-y-auto custom-scrollbar">
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