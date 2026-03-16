import React from 'react';
import { Briefcase, Search } from 'lucide-react';
import { Team } from '../types';

interface ContractModalProps {
    isOpen: boolean;
    team: Team | null;
    onRenew: () => void;
    onResign: () => void;
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, team, onRenew, onResign }) => {
    if (!isOpen || !team) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl flex flex-col items-center">
                <div className="w-20 h-20 mb-4 flex items-center justify-center bg-slate-800 rounded-full border-4 border-slate-700 overflow-hidden">
                    {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" />
                    ) : (
                        <Briefcase size={32} className="text-slate-400" />
                    )}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Off-Season Options</h2>
                
                <p className="text-slate-400 text-center mb-8 text-sm">
                    Your contract with {team.name} is up for review. What would you like to do next season?
                </p>
                
                <div className="w-full flex flex-col gap-4">
                    <button 
                        onClick={onRenew} 
                        className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        <Briefcase size={20} /> Renew Contract
                    </button>
                    
                    <button 
                        onClick={onResign} 
                        className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 px-4 rounded-xl border border-slate-600 transition-all active:scale-95"
                    >
                        <Search size={20} /> Resign & Find New Club
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContractModal;