
import React, { useState, useEffect } from 'react';
import { Team, Player, Formation } from '../types';
import { FORMATIONS } from '../constants';
import { ChevronLeft, Shirt, Users, ArrowRightLeft } from 'lucide-react';

interface SquadManagementProps {
  team: Team;
  onUpdateTeam: (updatedTeam: Team) => void;
  onBack: () => void;
}

const SquadManagement: React.FC<SquadManagementProps> = ({ team, onUpdateTeam, onBack }) => {
  const [selectedFormation, setSelectedFormation] = useState<Formation>(team.formation || '4-3-3');
  const [roster, setRoster] = useState<Player[]>(team.roster);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Responsive State: Default to mobile (vertical) if server-side or small screen
  const [isVertical, setIsVertical] = useState<boolean>(true);

  useEffect(() => {
    // Check initial size
    const checkOrientation = () => {
        setIsVertical(window.innerWidth < 1280); // Matches 'xl' breakpoint
    };
    
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

  const starters = roster.slice(0, 11), bench = roster.slice(11);
  const getFormationPos = (index: number) => FORMATIONS[selectedFormation][index] || { x: 50, y: 50, position: '?' };

  return (
    <div className="h-[100dvh] bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="bg-slate-800 p-3 md:p-4 border-b border-slate-700 flex items-center justify-between shrink-0 z-50 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm md:text-base">
            <ChevronLeft size={20} /> <span>Back</span>
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2"><Shirt size={20} /> Squad</h1>
        <div className="w-10"></div> 
      </header>

      {/* Main Content Area - Scrollable on Mobile */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden">
        
        {/* Pitch View Container */}
        <div className="w-full xl:flex-1 bg-slate-950 p-2 md:p-6 flex flex-col items-center relative shrink-0">
             <div className="w-full max-w-[600px] mb-4 z-20 flex justify-center">
                <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700 shadow-lg flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Formation</span>
                    <select value={selectedFormation} onChange={(e) => handleFormationChange(e.target.value as Formation)} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs outline-none text-white min-w-[100px]">
                        <option value="4-3-3">4-3-3 Attack</option>
                        <option value="4-4-2">4-4-2 Flat</option>
                        <option value="3-5-2">3-5-2</option>
                    </select>
                </div>
             </div>

             {/* Pitch Visual - Vertical (3:4) on Mobile, Horizontal (4:3) on XL Desktop */}
             <div className={`w-full max-w-[500px] xl:max-w-[800px] ${isVertical ? 'aspect-[3/4]' : 'aspect-[4/3]'} bg-emerald-700 rounded-xl border-4 border-slate-800 relative shadow-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-300`}>
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
                 
                 {/* Grass Stripes - Always Horizontal lines visually */}
                 <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.05) 99px)' }}></div>
                 
                 {/* Center Circle */}
                 <div className="absolute inset-0 m-auto w-24 h-24 md:w-32 md:h-32 border-2 border-white/30 rounded-full" />
                 
                 {/* Markings based on Orientation */}
                 {isVertical ? (
                    <>
                        {/* Vertical Pitch: Halfway Horizontal */}
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/30 -translate-y-1/2" />
                        {/* Top Goal Area (Opponent/Away) */}
                        <div className="absolute top-0 left-1/4 right-1/4 h-12 md:h-16 border-b-2 border-l-2 border-r-2 border-white/30" />
                        {/* Bottom Goal Area (GK) */}
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-12 md:h-16 border-t-2 border-l-2 border-r-2 border-white/30" />
                    </>
                 ) : (
                    <>
                        {/* Horizontal Pitch: Halfway Vertical */}
                        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2" />
                        {/* Left Goal Area (GK) */}
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-12 md:w-16 border-r-2 border-t-2 border-b-2 border-white/30" />
                        {/* Right Goal Area (Opponent/Away) */}
                        <div className="absolute right-0 top-1/4 bottom-1/4 w-12 md:w-16 border-l-2 border-t-2 border-b-2 border-white/30" />
                    </>
                 )}

                 {starters.map((player, index) => {
                     const pos = getFormationPos(index);
                     const isSelected = selectedPlayerId === player.id;
                     
                     // Coordinate Transform
                     // Desktop (Horizontal): x=0 is left (GK), x=100 is right. y=0 is top, y=100 is bottom.
                     // Mobile (Vertical): x=0 is bottom (GK), x=100 is top. y=0 is left, y=100 is right.
                     // We need to map FORMATIONS x (0-100) to new coordinates.
                     
                     let style: React.CSSProperties = {};
                     if (isVertical) {
                         // Map X (Length) to Top (100 - x)
                         // Map Y (Width) to Left (y)
                         style = { left: `${pos.y}%`, top: `${100 - pos.x}%` };
                     } else {
                         // Standard Horizontal
                         style = { left: `${pos.x}%`, top: `${pos.y}%` };
                     }

                     return (
                         <button key={player.id} onClick={() => handlePlayerClick(player)} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 group z-10 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}`} style={style}>
                            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-2 shadow-lg flex items-center justify-center text-[10px] md:text-base font-bold relative transition-colors ${isSelected ? 'ring-4 ring-yellow-400 border-white' : 'border-white'}`} style={{ backgroundColor: team.primaryColor, color: team.secondaryColor === '#ffffff' ? 'white' : team.secondaryColor }}>
                                {player.number}
                                {isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-ping" />}
                            </div>
                            <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] md:text-xs font-bold truncate max-w-[70px] md:max-w-[100px] text-center backdrop-blur-md border border-black/20 ${isSelected ? 'bg-yellow-400 text-black' : 'bg-black/60 text-white'}`}>{player.name}</div>
                            <div className="text-[7px] md:text-[9px] font-bold text-white drop-shadow-md bg-black/20 px-1 rounded">{pos.position}</div>
                         </button>
                     );
                 })}
             </div>
        </div>

        {/* Roster List Container */}
        <div className="w-full xl:w-96 bg-slate-800 border-t xl:border-t-0 xl:border-l border-slate-700 flex flex-col shrink-0 min-h-[400px] xl:min-h-0 xl:h-auto shadow-xl z-10">
            <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-white text-sm"><Users size={18} className="text-blue-400" /> Bench & Reserves</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Tap player to swap positions</p>
                </div>
                {selectedPlayerId && <button onClick={() => setSelectedPlayerId(null)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded border border-red-500/30">Cancel</button>}
            </div>
            <div className="flex-1 p-2 md:p-3 space-y-2 bg-slate-800">
                {bench.map(player => {
                    const isSelected = selectedPlayerId === player.id;
                    return (
                        <button key={player.id} onClick={() => handlePlayerClick(player)} className={`w-full p-2 md:p-3 rounded-lg border flex items-center justify-between transition-all duration-200 group relative ${isSelected ? 'bg-yellow-500/20 border-yellow-500 shadow-lg' : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs border ${isSelected ? 'bg-yellow-500 text-slate-900 border-yellow-400' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>{player.number}</div>
                                <div className="text-left">
                                    <div className={`font-bold text-sm ${isSelected ? 'text-yellow-400' : 'text-slate-200'}`}>{player.name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="bg-slate-900 px-1 rounded">{player.position}</span><span>•</span><span>RAT {player.rating}</span></div>
                                </div>
                            </div>
                            {selectedPlayerId && !isSelected && <ArrowRightLeft size={16} className="text-slate-500 group-hover:text-white animate-pulse" />}
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
