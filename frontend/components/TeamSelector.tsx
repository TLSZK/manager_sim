import React, { useState } from 'react';
import { Team } from '../types';
import { Shield, Star, Trophy } from 'lucide-react';
import { TeamCardSkeleton } from './Skeletons';

interface TeamSelectorProps {
  teams: Team[];
  onSelect: (teamId: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, onSelect }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const laLigaTeams = teams
    .filter(team => team.tier === 1)
    .sort((a, b) => b.strength - a.strength);

  const isLoading = laLigaTeams.length === 0;

  // Tier grouping for visual hierarchy
  const eliteTeams = laLigaTeams.filter(t => t.strength >= 88);
  const midTeams = laLigaTeams.filter(t => t.strength >= 76 && t.strength < 88);
  const lowerTeams = laLigaTeams.filter(t => t.strength < 76);

  const renderTeamCard = (team: Team, index: number) => {
    const isHovered = hoveredId === team.id;
    const isUCL = team.isUCL;
    const strengthPct = ((team.strength - 60) / 40) * 100;

    return (
      <button
        key={team.id}
        onClick={() => onSelect(team.id)}
        onMouseEnter={() => setHoveredId(team.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={`group relative flex flex-col items-center p-4 md:p-5 bg-slate-800 rounded-xl border transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,43,68,0.15)] hover:-translate-y-1.5 active:scale-95 animate-in fade-in slide-in-from-bottom-2 fill-mode-both overflow-hidden ${
          isHovered ? 'border-[#FF2B44] shadow-lg' : 'border-slate-700/60 hover:border-[#FF2B44]/60'
        }`}
        style={{ animationDelay: `${index * 35}ms` }}
      >
        {/* Subtle gradient glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${team.primaryColor}15, transparent 70%)`,
          }}
        />

        {/* UCL badge */}
        {isUCL && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center" title="Champions League">
              <Star size={10} className="text-blue-400 md:w-[12px] md:h-[12px]" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Team crest */}
        {team.logoUrl ? (
          <div className="w-14 h-14 md:w-18 md:h-18 mb-3 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center relative z-10">
            <img
              src={team.logoUrl}
              alt={team.name}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 md:w-18 md:h-18 rounded-full flex items-center justify-center text-lg md:text-xl font-bold mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10"
            style={{ backgroundColor: team.primaryColor || '#333', color: team.secondaryColor || '#fff' }}
          >
            {team.shortName}
          </div>
        )}

        <h3 className="text-xs md:text-sm font-bold text-center text-slate-100 relative z-10 mb-2 leading-tight">
          {team.name}
        </h3>

        {/* Strength bar */}
        <div className="w-full mt-auto relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">OVR</span>
            <span className="text-[10px] md:text-xs font-mono font-bold text-slate-300">{team.strength}</span>
          </div>
          <div className="w-full h-1 md:h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 group-hover:brightness-125"
              style={{
                width: `${strengthPct}%`,
                background: team.strength >= 90
                  ? 'linear-gradient(90deg, #eab308, #f59e0b)'
                  : team.strength >= 80
                    ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
                    : 'linear-gradient(90deg, #64748b, #94a3b8)',
              }}
            />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-500 relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 60%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 60%)' }}
        />
      </div>
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF2B44] to-[#D31E35] leading-tight">
          La Liga Manager
        </h1>
        <p className="text-slate-400 text-base md:text-lg">Select your club to begin the 2025/26 Season</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Star size={10} className="text-blue-400" fill="currentColor" />
          </div>
          <span className="text-slate-500 text-xs">Champions League participant</span>
        </div>
      </div>

      {isLoading ? (
        /* ── Skeleton Grid ── */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <TeamCardSkeleton key={`skel-${i}`} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Elite Tier */}
          {eliteTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Trophy size={16} className="text-yellow-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Title Contenders</h2>
                <div className="flex-1 h-px bg-slate-800 ml-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {eliteTeams.map((team, i) => renderTeamCard(team, i))}
              </div>
            </div>
          )}

          {/* Mid Tier */}
          {midTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Shield size={16} className="text-blue-400" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Challengers</h2>
                <div className="flex-1 h-px bg-slate-800 ml-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {midTeams.map((team, i) => renderTeamCard(team, eliteTeams.length + i))}
              </div>
            </div>
          )}

          {/* Lower Tier */}
          {lowerTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Shield size={16} className="text-slate-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Underdogs</h2>
                <div className="flex-1 h-px bg-slate-800 ml-2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {lowerTeams.map((team, i) => renderTeamCard(team, eliteTeams.length + midTeams.length + i))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
