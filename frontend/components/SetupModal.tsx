import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';

interface SetupModalProps {
  onSave: (name: string) => void;
  onCancel?: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-slate-700">
             <UserCheck size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, Manager!</h2>
          <p className="text-slate-400">Before we begin the 2025/26 La Liga season, please register your name with the league.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-2">
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Manager Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg placeholder-slate-600"
              placeholder="e.g. Hans-Dieter Flick"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit"
              disabled={!name.trim()}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700/50 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg"
            >
              Start Career
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupModal;