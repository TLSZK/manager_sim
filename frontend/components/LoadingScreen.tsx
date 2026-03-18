import React from 'react';

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparing Your Season',
  subtitle = 'Synchronizing databases & schedules...'
}) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-100 overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Animated pitch icon */}
      <div className="relative mb-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-[spin_1.5s_linear_infinite]" />
          {/* Inner ring */}
          <div className="absolute inset-2 rounded-full border border-slate-700/50 border-b-indigo-400/50 animate-[spin_2.5s_linear_infinite_reverse]" />
          {/* Center ball icon */}
          <div className="relative z-10">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
              <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1.5" className="text-slate-400" />
              <path d="M18 2 L18 6 M18 30 L18 34 M2 18 L6 18 M30 18 L34 18" stroke="currentColor" strokeWidth="1" className="text-slate-500" />
              <circle cx="18" cy="18" r="4" fill="currentColor" className="text-blue-500" />
              <circle cx="18" cy="18" r="2" fill="currentColor" className="text-blue-300" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="text-center z-10 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          {message}
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm tracking-wide uppercase font-mono animate-pulse">
          {subtitle}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-8 animate-in fade-in duration-500" style={{ animationDelay: '500ms' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500/60"
            style={{
              animation: 'loadingDot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
