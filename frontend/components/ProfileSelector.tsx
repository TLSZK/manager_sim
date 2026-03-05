import React, { useEffect, useState } from 'react';
import { ManagerProfile } from '../types';
import { fetchProfiles, createProfile, deleteProfile, fetchCurrentUser, updateAccountName } from '../services/api';
import { User, Plus, Trash2, Trophy, Calendar, LogOut, AlertTriangle, ChevronDown, Edit2, Check, X } from 'lucide-react';
import SetupModal from './SetupModal';

interface ProfileSelectorProps {
  onSelectProfile: (profile: ManagerProfile) => void;
  onLogout: () => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onSelectProfile, onLogout }) => {
  const [profiles, setProfiles] = useState<ManagerProfile[]>([]);
  const [userAccount, setUserAccount] = useState<{ name: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Dashboard State
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  // Deletion State
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, profilesData] = await Promise.all([
        fetchCurrentUser(),
        fetchProfiles()
      ]);
      setUserAccount(userData);
      setNewAccountName(userData.name);
      setProfiles(profilesData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    }
    setLoading(false);
  };

  const handleCreate = async (name: string) => {
    await createProfile(name);
    setIsCreating(false);
    loadData();
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setProfileToDelete(id);
  };

  const confirmDelete = async () => {
    if (profileToDelete) {
      setIsDeleting(true);
      await deleteProfile(profileToDelete);
      await loadData();
      setIsDeleting(false);
      setProfileToDelete(null);
    }
  };

  const handleSaveAccountName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim() && userAccount) {
      await updateAccountName(newAccountName.trim());
      setUserAccount({ ...userAccount, name: newAccountName.trim() });
      setIsEditingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col relative">
      {isCreating && <SetupModal onSave={handleCreate} />}

      {/* Account Edit Modal */}
      {isEditingAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Account</h3>
              <button onClick={() => setIsEditingAccount(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAccountName}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                autoFocus
              />
              <button type="submit" disabled={!newAccountName.trim()} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              <button onClick={() => setProfileToDelete(null)} disabled={isDeleting} className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {isDeleting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Trash2 size={18} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Dashboard */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <User className="text-blue-500 hidden md:block" /> Manager Profiles
        </h1>

        {/* User Account Dashboard */}
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userAccount?.name.substring(0, 1).toUpperCase() || <User size={16} />}
            </div>
            <div className="text-left hidden sm:block max-w-[120px]">
              <div className="text-sm font-bold text-white truncate">{userAccount?.name || 'Account'}</div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-sm text-white font-bold truncate mt-1">{userAccount?.name}</p>
                <p className="text-xs text-slate-500 truncate">{userAccount?.email}</p>
              </div>
              <button
                onClick={() => { setShowAccountMenu(false); setIsEditingAccount(true); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Edit2 size={16} /> Edit Account
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors border-t border-slate-700"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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