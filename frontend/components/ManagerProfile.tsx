import React, { useState } from 'react';
import { PastSeason } from '../types';
import { Trophy, X, Calendar, Medal, Edit2, Check, User } from 'lucide-react';

interface ManagerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  history: PastSeason[];
  managerName: string | null;
  onUpdateName: (name: string) => void;
}

const ManagerProfile: React.FC<ManagerProfileProps> = ({ isOpen, onClose, history, managerName, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(managerName || '');

  if (!isOpen) return null;

  const trophies = history.filter(h => h.wonTrophy).length;
  // const totalGames = history.length * 38; 

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(editName.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-start border-b border-slate-700">
          <div className="flex gap-4 items-center w-full">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-slate-700 shadow-lg shrink-0">
              {editName ? editName.substring(0, 2).toUpperCase() : <User />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1 bg-green-600 hover:bg-green-500 rounded text-white transition-colors">
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white truncate max-w-[300px]">{managerName || 'Unknown Manager'}</h2>
                    <button 
                      onClick={() => {
                        setEditName(managerName || '');
                        setIsEditing(true);
                      }}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-slate-400 text-sm">Manager Profile • Career Overview</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-full shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800/50">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
            <div className="text-yellow-500 mb-1"><Trophy size={24} /></div>
            <div className="text-2xl font-bold text-white">{trophies}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Trophies</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
            <div className="text-blue-500 mb-1"><Calendar size={24} /></div>
            <div className="text-2xl font-bold text-white">{history.length}</div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Seasons</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
             {/* Average Position Calculation */}
             <div className="text-emerald-500 mb-1"><Medal size={24} /></div>
             <div className="text-2xl font-bold text-white">
                {history.length > 0 
                  ? (history.reduce((acc, curr) => acc + curr.position, 0) / history.length).toFixed(1)
                  : '-'}
             </div>
             <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Avg Pos</div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Career History</h3>
            
            {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500 italic border-2 border-dashed border-slate-700 rounded-xl">
                    No seasons completed yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((season) => (
                        <div key={season.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${season.wonTrophy ? 'bg-yellow-500 text-slate-900' : 'bg-slate-600 text-slate-300'}`}>
                                    {season.wonTrophy ? <Trophy size={18} /> : <span>#{season.position}</span>}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{season.teamName}</div>
                                    <div className="text-xs text-slate-400">{season.seasonYear} Season</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono font-bold text-slate-200">{season.points} pts</div>
                                <div className="text-xs text-slate-500">
                                    {season.wonTrophy ? 'Champion' : season.position <= 4 ? 'UCL Qualified' : 'Finished'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900/30 text-center"></div>

      </div>
    </div>
  );
};

export default ManagerProfile;