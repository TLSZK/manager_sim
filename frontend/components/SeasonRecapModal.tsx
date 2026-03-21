import React, { useState, useEffect } from 'react';
import { SeasonSummary, Team } from '../types';
import { Trophy, Medal, AlertCircle, Quote, Star, Activity, Globe, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { askGemini } from '../services/api';

interface SeasonRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: SeasonSummary | null;
    team: Team;
}

const SeasonRecapModal: React.FC<SeasonRecapModalProps> = ({ isOpen, onClose, summary, team }) => {
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [isAILoading, setIsAILoading] = useState<boolean>(false);

    // Fetch AI Board Feedback when the modal opens
    useEffect(() => {
        const generateBoardFeedback = async () => {
            if (!summary || !isOpen) return;
            
            setIsAILoading(true);
            try {
                const prompt = `Act as the Board of Directors for the football club ${team.name}. The season has concluded. We finished in position ${summary.position} in the league with ${summary.points} points. Our record was ${team.stats.won} wins, ${team.stats.drawn} draws, and ${team.stats.lost} losses. Write a short, realistic, in-character 2-3 sentence performance review addressed to the manager. Do not use formatting or markdown.`;
                
                const answer = await askGemini(prompt);
                setAiFeedback(answer);
            } catch (error) {
                console.error("AI Request failed", error);
                // Fall back to the default message if the API call fails
                setAiFeedback(null);
            } finally {
                setIsAILoading(false);
            }
        };

        if (isOpen) {
            generateBoardFeedback();
        } else {
            setAiFeedback(null);
        }
    }, [isOpen, summary, team]);

    if (!isOpen || !summary) return null;

    const isChampion = summary.position === 1;
    const isUCLWinner = summary.uclResult === 'Winner';
    const isGoodSeason = summary.position <= 4 || isUCLWinner;

    // Trigger confetti on mount if it's a good season
    useEffect(() => {
        if (isGoodSeason) {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const random = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    angle: random(60, 120),
                    spread: random(50, 70),
                    particleCount,
                    origin: { y: 0.6 }
                });
            }, 250);
            return () => clearInterval(interval);
        }
    }, [isGoodSeason]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Banner */}
                <div className={`relative py-20 flex items-center justify-center overflow-hidden ${isChampion ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-slate-800 to-slate-700'}`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

                    <div className="z-10 text-center">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-24 h-24 mx-auto mb-8 object-contain drop-shadow-2xl" />
                        ) : (
                            <div
                                className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl border-4 border-white/20 mt-4"
                                style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                            >
                                {team.shortName}
                            </div>
                        )}

                        <h2 className="text-4xl font-extrabold text-white drop-shadow-md tracking-tight mb-6">
                            {isChampion ? 'CAMPEONES!' : 'Season Concluded'}
                        </h2>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                        {/* Domestic Performance */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" /> La Liga Performance
                            </h3>

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-center">
                                    <div className="text-5xl font-extrabold text-white mb-1">{summary.position}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase">Position</div>
                                </div>
                                <div className="h-12 w-px bg-slate-700" />
                                <div className="text-center">
                                    <div className="text-5xl font-extrabold text-white mb-1">{summary.points}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase">Points</div>
                                </div>
                                <div className="h-12 w-px bg-slate-700" />
                                <div className="text-center">
                                    <div className="text-5xl font-extrabold text-emerald-400 mb-1">{team.stats.won}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase">Wins</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-slate-900 rounded-lg text-sm">
                                    <span className="text-slate-400">Record</span>
                                    <span className="font-mono text-white">{team.stats.won}W - {team.stats.drawn}D - {team.stats.lost}L</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-900 rounded-lg text-sm">
                                    <span className="text-slate-400">Goals Scored</span>
                                    <span className="font-mono text-white">{team.stats.gf}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-900 rounded-lg text-sm">
                                    <span className="text-slate-400">Goals Conceded</span>
                                    <span className="font-mono text-white">{team.stats.ga}</span>
                                </div>
                            </div>
                        </div>

                        {/* Continental Performance */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Globe size={16} className="text-blue-500" /> European Performance
                            </h3>

                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                {summary.uclResult === 'Winner' ? (
                                    <>
                                        <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                                        <div className="text-3xl font-bold text-white mb-2">Champions!</div>
                                        <p className="text-slate-400">You conquered Europe.</p>
                                    </>
                                ) : summary.uclResult ? (
                                    <>
                                        <Medal size={64} className="text-blue-400 mb-4" />
                                        <div className="text-2xl font-bold text-white mb-2">{summary.uclResult}</div>
                                        <p className="text-slate-400">Final standing in Champions League</p>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={64} className="text-slate-600 mb-4" />
                                        <div className="text-xl font-bold text-slate-500 mb-2">Did Not Qualify</div>
                                        <p className="text-slate-600">Focus was on domestic glory.</p>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Board Feedback */}
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
                        <Quote size={80} className="absolute top-4 right-8 text-slate-700/20" />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Message from the Board</h3>
                        
                        <p className="text-xl md:text-2xl font-serif text-slate-200 italic leading-relaxed relative z-10 min-h-[5rem]">
                            {isAILoading ? (
                                <span className="flex items-center gap-3 text-slate-400 text-lg md:text-xl">
                                    <Loader2 className="animate-spin" size={24} /> 
                                    Evaluating manager performance...
                                </span>
                            ) : (
                                `"${aiFeedback || summary.message}"`
                            )}
                        </p>
                        
                        <div className="mt-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                {team.logoUrl ? <img src={team.logoUrl} className="w-8 h-8 object-contain" /> : <Activity size={20} className="text-slate-400" />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Board of Directors</div>
                                <div className="text-xs text-slate-500">{team.name} Administration</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAILoading}
                    >
                        Continue to Off-Season
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeasonRecapModal;