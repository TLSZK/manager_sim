import React from 'react';
import { Team } from '../types';
import { Shield } from 'lucide-react';

interface TeamSelectorProps {
  teams: Team[];
  onSelect: (teamId: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, onSelect }) => {
  // FILTER & SORT: Show Tier 1 teams, sorted by Strength (Highest First)
  const laLigaTeams = teams
    .filter(team => team.tier === 1)
    .sort((a, b) => b.strength - a.strength); // Descending sort

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF2B44] to-[#D31E35]">
          La Liga Manager
        </h1>
        <p className="text-slate-400 text-lg">Select your club to begin the 2025/26 Season</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {laLigaTeams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team.id)}
            className="group relative flex flex-col items-center p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-[#FF2B44] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,43,68,0.2)] hover:-translate-y-1 active:scale-95"
          >
            {team.logoUrl ? (
              <div className="w-12 h-12 md:w-16 md:h-16 mb-3 group-hover:scale-110 transition-transform flex items-center justify-center">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg md:text-xl font-bold mb-3 shadow-lg group-hover:scale-110 transition-transform"
                style={{ backgroundColor: team.primaryColor || '#333', color: team.secondaryColor || '#fff' }}
              >
                {team.shortName}
              </div>
            )}

            <h3 className="text-xs md:text-sm font-bold text-center text-slate-100">{team.name}</h3>
            <div className="mt-2 flex items-center text-[10px] md:text-xs text-slate-500 gap-1">
              <Shield size={10} />
              <span>OVR: {team.strength ?? '-'}</span>
            </div>

            <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeamSelector;