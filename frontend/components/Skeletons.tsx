import React from 'react';

// ── Base Skeleton Primitive ──────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`skeleton-shimmer rounded ${className}`} style={style} />
);

// ── Profile Card Skeleton (ProfileSelector) ─────────────────────────
export const ProfileCardSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div
    className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 min-h-[200px] flex flex-col animate-in fade-in duration-500 fill-mode-both"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <Skeleton className="h-6 w-3/4 mb-2 rounded-lg" />
    <Skeleton className="h-4 w-1/2 mb-1 rounded-lg" />
    <Skeleton className="h-3 w-2/5 mb-6 rounded-lg" />
    <div className="flex gap-4 mt-auto">
      <Skeleton className="h-9 w-20 rounded-lg" />
      <Skeleton className="h-9 w-28 rounded-lg" />
    </div>
  </div>
);

// ── Team Card Skeleton (TeamSelector) ───────────────────────────────
export const TeamCardSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div
    className="flex flex-col items-center p-4 bg-slate-800/60 rounded-xl border border-slate-700/30 animate-in fade-in duration-500 fill-mode-both"
    style={{ animationDelay: `${index * 40}ms` }}
  >
    <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full mb-3" />
    <Skeleton className="h-4 w-20 mb-2 rounded-md" />
    <Skeleton className="h-3 w-14 rounded-md" />
  </div>
);

// ── League Table Row Skeleton ───────────────────────────────────────
export const TableRowSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <tr
    className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
    style={{ animationDelay: `${index * 40}ms` }}
  >
    <td className="px-2 md:px-3 py-2 md:py-3 text-center">
      <Skeleton className="h-4 w-5 mx-auto rounded" />
    </td>
    <td className="px-2 md:px-3 py-2 md:py-3">
      <div className="flex items-center gap-1.5 md:gap-2">
        <Skeleton className="w-4 h-4 md:w-5 md:h-5 rounded-full shrink-0" />
        <Skeleton className="h-4 w-24 md:w-32 rounded" />
      </div>
    </td>
    <td className="px-1 py-2 md:py-3"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3 hidden sm:table-cell"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3 hidden sm:table-cell"><Skeleton className="h-4 w-5 mx-auto rounded" /></td>
    <td className="px-1 py-2 md:py-3"><Skeleton className="h-4 w-7 mx-auto rounded" /></td>
    <td className="px-2 md:px-3 py-2 md:py-3"><Skeleton className="h-4 w-6 mx-auto rounded" /></td>
  </tr>
);

// ── Match Result Row Skeleton ───────────────────────────────────────
export const MatchResultSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="p-2 sm:p-3 flex justify-between items-center animate-in fade-in slide-in-from-right-4 duration-300 fill-mode-both"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2">
      <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
      <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0" />
    </div>
    <Skeleton className="mx-1.5 sm:mx-2 h-6 w-[40px] sm:w-[45px] rounded shrink-0" />
    <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
      <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0" />
      <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
    </div>
  </div>
);

// ── Action Center Skeleton ──────────────────────────────────────────
export const ActionCenterSkeleton: React.FC = () => (
  <div className="p-3 sm:p-4 md:p-6 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl animate-in fade-in duration-500">
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="h-5 w-36 rounded-lg" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-900/60 rounded-lg border border-slate-700/80">
      <Skeleton className="h-3 w-24 mx-auto mb-3 rounded" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center w-1/3 gap-2">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-6 w-10 rounded" />
        <div className="flex flex-col items-center w-1/3 gap-2">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="h-11 col-span-2 rounded-lg" />
    </div>
  </div>
);

// ── Results Panel Skeleton ──────────────────────────────────────────
export const ResultsPanelSkeleton: React.FC = () => (
  <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg animate-in fade-in duration-500">
    <div className="p-3 sm:p-4 bg-slate-900/50 border-b border-slate-700 space-y-2 sm:space-y-3">
      <Skeleton className="h-9 w-full rounded-lg" />
      <div className="flex items-center justify-between bg-slate-700/20 rounded-lg p-1.5">
        <Skeleton className="w-7 h-7 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="w-7 h-7 rounded" />
      </div>
    </div>
    <div className="divide-y divide-slate-700/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <MatchResultSkeleton key={i} index={i} />
      ))}
    </div>
  </div>
);

// ── Header Skeleton ─────────────────────────────────────────────────
export const HeaderSkeleton: React.FC = () => (
  <header className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 p-3 sm:p-4 gap-3 sm:gap-4 rounded-xl border border-slate-700 shadow-lg bg-slate-800 animate-in fade-in duration-300">
    <div className="flex items-center gap-3 w-full md:w-auto">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0" />
      <div>
        <Skeleton className="h-5 w-40 mb-1.5 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <Skeleton className="h-9 w-16 rounded-lg" />
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
  </header>
);

// ── Full Page Loading Screen ────────────────────────────────────────
export const FullPageLoader: React.FC<{
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}> = ({
  title = 'Loading',
  subtitle = 'Please wait...',
  icon,
}) => (
  <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-100 animate-in fade-in duration-500">
    <div className="relative flex items-center justify-center mb-8">
      {/* Glow */}
      <div className="absolute w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
      {/* Outer ring - slow ping */}
      <div
        className="absolute w-20 h-20 rounded-full border border-blue-500/20"
        style={{ animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
      />
      {/* Spinning ring */}
      <div
        className="absolute w-16 h-16 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'rgb(59 130 246)',
          borderRightColor: 'rgba(59, 130, 246, 0.3)',
          animation: 'spin 1.2s linear infinite',
        }}
      />
      {/* Inner counter-spin */}
      <div
        className="absolute w-10 h-10 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'rgb(129 140 248)',
          borderLeftColor: 'rgba(129, 140, 248, 0.3)',
          animation: 'spin 0.9s linear infinite reverse',
        }}
      />
      {/* Center dot or icon */}
      {icon || (
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] relative z-10" />
      )}
    </div>
    <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1.5 text-center px-4">{title}</h2>
    <p className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase animate-pulse">
      {subtitle}
    </p>
  </div>
);

// ── Season Transition Loader ────────────────────────────────────────
export const SeasonTransitionLoader: React.FC<{ seasonYear?: string }> = ({ seasonYear }) => (
  <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-100 animate-in fade-in duration-500">
    <div className="relative mb-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/20 animate-bounce" style={{ animationDuration: '2s' }}>
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
    </div>
    <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-center">
      {seasonYear ? `Preparing ${seasonYear} Season` : 'New Season Loading'}
    </h2>
    <p className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase animate-pulse">
      Generating fixtures & schedules...
    </p>
    {/* Progress bar */}
    <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
        style={{
          animation: 'shimmer-progress 1.5s ease-in-out infinite',
          width: '60%',
        }}
      />
    </div>
  </div>
);

// ── Inline Spinner ──────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <div
    className={`border-2 border-white/20 border-t-white rounded-full animate-spin ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Skeleton;
