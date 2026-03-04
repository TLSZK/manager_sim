
import React, { useState, useMemo, useEffect } from 'react';
import { Match, Team } from '../types';
import { X, ChevronLeft, ChevronRight, PlayCircle, Trophy, Globe, Calendar as CalendarIcon } from 'lucide-react';
import { LIGA_LOGO_URL, UCL_LOGO_URL } from '../constants';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Match[];
  userTeamId: string | null;
  teams: Team[];
  currentWeek: number;
  onSimulateToWeek: (week: number) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  schedule, 
  userTeamId, 
  teams,
  currentWeek,
  onSimulateToWeek
}) => {
  const [displayDate, setDisplayDate] = useState(new Date(2025, 7, 1)); // Start Aug 2025

  // Find the date of the current week to allow jumping
  const currentWeekDate = useMemo(() => {
      const match = schedule.find(m => m.week === currentWeek);
      return match ? new Date(match.date) : new Date(2025, 7, 1);
  }, [schedule, currentWeek]);

  // Reset to current date when opening
  useEffect(() => {
      if (isOpen) {
          setDisplayDate(new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), 1));
      }
  }, [isOpen, currentWeekDate]);

  const monthMatches = useMemo(() => {
    if (!userTeamId) return [];
    
    // Filter matches for this month involving the user
    return schedule.filter(m => {
      const d = new Date(m.date);
      return (
        d.getMonth() === displayDate.getMonth() &&
        d.getFullYear() === displayDate.getFullYear() &&
        (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId)
      );
    });
  }, [schedule, displayDate, userTeamId]);

  if (!isOpen) return null;

  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay(); // 0 = Sun
  
  // Adjust for Monday start (0 = Mon, 6 = Sun)
  const startDayAdjusted = startDay === 0 ? 6 : startDay - 1;

  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDayAdjusted + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) return dayNum;
    return null;
  });

  const changeMonth = (delta: number) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setDisplayDate(newDate);
  };

  const jumpToCurrent = () => {
      setDisplayDate(new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), 1));
  };

  const monthName = displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-5xl md:rounded-2xl border-t md:border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-3 md:p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
             <button onClick={() => changeMonth(-1)} className="p-1.5 md:p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300">
                <ChevronLeft size={20} />
             </button>
             <h2 className="text-lg md:text-xl font-bold text-white text-center flex-1 md:flex-none md:min-w-[150px]">{monthName}</h2>
             <button onClick={() => changeMonth(1)} className="p-1.5 md:p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300">
                <ChevronRight size={20} />
             </button>
             <button 
                onClick={jumpToCurrent}
                className="ml-auto md:ml-4 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
             >
                <CalendarIcon size={14} /> <span className="hidden sm:inline">Current</span>
             </button>
          </div>
          <button onClick={onClose} className="p-2 ml-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 p-1 md:p-6 overflow-y-auto bg-slate-950/50">
          <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                 <div key={d} className="bg-slate-800 p-2 md:p-3 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                     <span className="md:hidden">{d.charAt(0)}</span>
                     <span className="hidden md:inline">{d}</span>
                 </div>
             ))}

             {daysArray.map((day, idx) => {
                 if (!day) return <div key={idx} className="bg-slate-900/50 min-h-[60px] md:min-h-[100px]" />;

                 // Find match
                 const match = monthMatches.find(m => new Date(m.date).getDate() === day);
                 const opponent = match 
                    ? teams.find(t => t.id === (match.homeTeamId === userTeamId ? match.awayTeamId : match.homeTeamId))
                    : null;
                 
                 const isUCL = match?.competition === 'Champions League';
                 const isPlayed = match?.played;
                 const isFuture = match && match.week >= currentWeek;
                 const isHome = match && match.homeTeamId === userTeamId;
                 
                 // Sim Capability
                 const canSimTo = isFuture && !isPlayed;

                 // Highlight current day
                 const isSimCurrentDate = day === currentWeekDate.getDate() && displayDate.getMonth() === currentWeekDate.getMonth();

                 return (
                     <div key={idx} className={`bg-slate-900 min-h-[60px] md:min-h-[100px] p-1 md:p-2 relative group border-t border-l border-slate-800 hover:bg-slate-800/50 transition-colors ${isSimCurrentDate ? 'bg-indigo-900/20' : ''}`}>
                         <div className="flex justify-between items-start">
                             <span className={`text-xs md:text-sm font-bold ${isSimCurrentDate ? 'text-indigo-400' : 'text-slate-500'}`}>{day}</span>
                         </div>
                         
                         {match && opponent && (
                             <div className={`mt-1 md:mt-2 p-1 md:p-2 rounded md:rounded-lg text-[9px] md:text-xs border cursor-pointer relative overflow-hidden group/match shadow-md
                                 ${isUCL 
                                     ? 'bg-blue-900/30 border-blue-700/50 hover:bg-blue-900/50' 
                                     : 'bg-emerald-900/20 border-emerald-700/50 hover:bg-emerald-900/40'
                                 }
                             `}
                             onClick={() => canSimTo && onSimulateToWeek(match.week)}
                             >
                                 <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1">
                                     <div className="flex items-center gap-1">
                                         {isUCL && UCL_LOGO_URL ? <img src={UCL_LOGO_URL} className="w-2.5 h-2.5 md:w-3 md:h-3 object-contain" /> : (isUCL ? <Globe size={10} className="text-blue-400 shrink-0" /> : null)}
                                         {!isUCL && LIGA_LOGO_URL ? <img src={LIGA_LOGO_URL} className="w-2.5 h-2.5 md:w-3 md:h-3 object-contain" /> : (!isUCL ? <Trophy size={10} className="text-emerald-400 shrink-0" /> : null)}
                                         <span className={`font-mono font-bold text-[8px] md:text-[9px] px-1 rounded ${isHome ? 'bg-white/10 text-white' : 'bg-black/20 text-slate-400'}`}>
                                            {isHome ? 'H' : 'A'}
                                         </span>
                                     </div>
                                     <span className={`font-bold truncate max-w-full ${isUCL ? 'text-blue-200' : 'text-emerald-200'}`}>
                                         {opponent.shortName}
                                     </span>
                                 </div>
                                 
                                 {isPlayed ? (
                                     <div className="font-mono font-bold text-white bg-black/40 text-center rounded py-0.5 md:py-1">
                                         {match.homeScore} - {match.awayScore}
                                     </div>
                                 ) : (
                                     <div className="text-center text-slate-400 text-[8px] md:text-[10px] uppercase font-bold tracking-wider bg-black/20 rounded py-0.5">
                                         {match.week < currentWeek ? 'TBP' : 'VS'}
                                     </div>
                                 )}

                                 {canSimTo && (
                                     <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/match:opacity-100 transition-opacity">
                                         <span className="flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-wider">
                                            <PlayCircle size={14} /> Sim
                                         </span>
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 );
             })}
          </div>
        </div>

        <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700 text-[10px] md:text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-2">
             <div className="flex gap-4 md:gap-6">
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-900/50 border border-emerald-500 rounded"></div>
                     <span>La Liga</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-900/50 border border-blue-500 rounded"></div>
                     <span>UCL</span>
                 </div>
             </div>
             <div className="text-center md:text-right">Tap a future match to fast-sim to that date</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
