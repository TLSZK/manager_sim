import React, { useState } from 'react';
import { Trophy, ArrowRight, Lock, Mail, UserPlus, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { loginAccount, registerAccount } from '../services/api';
import { Spinner } from './Skeletons';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = isRegistering
    ? emailRegex.test(email) && password.length >= 8 && name.trim().length > 0
    : emailRegex.test(email) && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await registerAccount(name, email, password);
      } else {
        await loginAccount(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow - OPTIMIZED FOR SAFARI/MOBILE */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none transform-gpu">
        <div
          className="absolute top-[-20%] left-[-15%] w-[90%] h-[90%] rounded-full opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 55%)' }}
        />
        {/* Center bridge glow — fills the gap between the two corner glows */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.07) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-15%] w-[90%] h-[90%] rounded-full opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 55%)' }}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="p-8 text-center border-b border-slate-800 bg-slate-900/50">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-900/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">La Liga Manager</h1>
          <p className="text-slate-400 text-sm">
            {isRegistering ? 'Create your manager account' : 'Sign in to manage your club'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm text-center flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <span>{error}</span>
              {error.includes('Email not registered') && !isRegistering && (
                <button
                  type="button"
                  onClick={toggleMode}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white font-bold py-2 px-4 rounded transition-colors mt-1"
                >
                  Create Account Now
                </button>
              )}
            </div>
          )}

          {isRegistering && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                  placeholder="e.g. Pep Guardiola"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                placeholder="manager@club.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isRegistering && (
              <p className="text-[10px] text-slate-500 ml-1 mt-1">Must be at least 8 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-800/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-4 hover:-translate-y-0.5 duration-200"
          >
            {isLoading ? (
              <Spinner size={20} />
            ) : (
              <>{isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            {isRegistering ? 'Already have an account? Sign In' : <><UserPlus size={16} /> Need an account? Register</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;