
import React, { useEffect, useState } from 'react';
import { ManagerProfile } from '../types';
import { fetchProfiles, createProfile, deleteProfile } from '../services/api';
import { User, Plus, Trash2, Trophy, Calendar, LogOut, AlertTriangle, X } from 'lucide-react';
import SetupModal from './SetupModal';

interface ProfileSelectorProps {
  onSelectProfile: (profile: ManagerProfile) => void;
  onLogout: () => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onSelectProfile, onLogout }) => {
  const [profiles, setProfiles] = useState<ManagerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Custom Modal State for Deletion
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await fetchProfiles();
    // Sort by most recently created or played
    setProfiles(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  const handleCreate = async (name: string) => {
    await createProfile(name);
    setIsCreating(false);
    loadProfiles();
  };

  // 1. Initial Click - Open Custom Modal
  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop bubbling to select profile
    e.preventDefault();
    setProfileToDelete(id);
  };

  // 2. Confirm Click - Perform Deletion
  const confirmDelete = async () => {
    if (profileToDelete) {
      setIsDeleting(true);
      await deleteProfile(profileToDelete);
      await loadProfiles();
      setIsDeleting(false);
      setProfileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setProfileToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col relative">
      {isCreating && <SetupModal onSave={handleCreate} />}
      
      {/* Custom Delete Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100">
              <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-900/20">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Delete Profile?</h3>
                  <p className="text-slate-400 text-sm">
                    Are you sure you want to delete this manager? All career history and stats will be permanently lost.
                  </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Trash2 size={18} />}
                    Delete
                  </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="text-blue-500" /> Select Manager Profile
        </h1>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-slate-700"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card */}
          <button 
            onClick={() => setIsCreating(true)}
            className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-slate-800 transition-all min-h-[200px]"
          >
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <span className="font-bold text-lg text-slate-300 group-hover:text-white">Create New Manager</span>
          </button>

          {/* Profile Cards */}
          {profiles.map(profile => {
            const trophies = profile.history.filter(h => h.wonTrophy).length;
            const seasons = profile.history.length;
            
            return (
              <div 
                key={profile.id}
                className="relative bg-slate-800 border border-slate-700 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:shadow-blue-900/10 group hover:border-blue-500 overflow-hidden"
              >
                {/* Clickable Content Area */}
                <div 
                    onClick={() => onSelectProfile(profile)}
                    className="p-6 cursor-pointer h-full select-none"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                            {profile.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                    <p className="text-xs text-slate-500 mb-6">Created {new Date(profile.createdAt).toLocaleDateString()}</p>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg text-sm border border-slate-700/50">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="font-mono font-bold text-slate-200">{trophies}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg text-sm border border-slate-700/50">
                            <Calendar size={14} className="text-blue-400" />
                            <span className="font-mono font-bold text-slate-200">{seasons} Seasons</span>
                        </div>
                    </div>
                </div>

                {/* Separate Touch-Friendly Delete Button */}
                <div 
                    onClick={(e) => requestDelete(e, profile.id)}
                    className="absolute top-0 right-0 p-4 z-20 cursor-pointer group/delete"
                >
                    <div className="p-2.5 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-red-600 rounded-full transition-all shadow-lg ring-1 ring-slate-700 group-hover/delete:scale-110">
                        <Trash2 size={18} />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
