import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Team, Player, Formation } from '../types';
import { FORMATIONS, getPositionFit, getPenalizedRating, alignRoster } from '../constants';
import { GameEngine, PITCH, type MatchStats } from '../utils/simulation';
import { FastForward, Play, Pause, RotateCcw, Sliders, PlayIcon, AlertTriangle, ArrowRightLeft } from 'lucide-react';

// ── Public types re-exported for consumers ───────────────────────────────────
export type { MatchStats };

interface MatchViewProps {
    homeTeam: Team;
    awayTeam: Team;
    userTeamId: string;
    onMatchComplete: (homeScore: number, awayScore: number) => void;
    competition?: string;
    stage?: string;
}

// ── Penalty shootout helper ──────────────────────────────────────────────────
const getPenaltyResult = (): { home: number; away: number } => {
    const scores = [[5, 4], [5, 3], [4, 3], [4, 2], [3, 1], [3, 2], [6, 5]];
    const s = scores[Math.floor(Math.random() * scores.length)];
    return Math.random() > 0.5 ? { home: s[0], away: s[1] } : { home: s[1], away: s[0] };
};

// ═════════════════════════════════════════════════════════════════════════════
// CANVAS RENDERER — pure function, no React state mutations
// ═════════════════════════════════════════════════════════════════════════════

function drawPitch(ctx: CanvasRenderingContext2D, W: number, H: number, sx: number, sy: number) {
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent';
        ctx.fillRect(i * 10 * sx, 0, 10 * sx, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PITCH.LEFT * sx, 0, 90 * sx, H);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, PITCH.CIRCLE_RX * sx, PITCH.CIRCLE_RY * sy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeRect(PITCH.LEFT * sx, PITCH.PEN_TOP * sy, PITCH.PEN_DEPTH * sx, (PITCH.PEN_BOTTOM - PITCH.PEN_TOP) * sy);
    ctx.strokeRect((PITCH.RIGHT - PITCH.PEN_DEPTH) * sx, PITCH.PEN_TOP * sy, PITCH.PEN_DEPTH * sx, (PITCH.PEN_BOTTOM - PITCH.PEN_TOP) * sy);
    ctx.strokeRect(PITCH.LEFT * sx, PITCH.SIX_TOP * sy, PITCH.SIX_DEPTH * sx, (PITCH.SIX_BOTTOM - PITCH.SIX_TOP) * sy);
    ctx.strokeRect((PITCH.RIGHT - PITCH.SIX_DEPTH) * sx, PITCH.SIX_TOP * sy, PITCH.SIX_DEPTH * sx, (PITCH.SIX_BOTTOM - PITCH.SIX_TOP) * sy);
    [PITCH.LEFT + PITCH.PEN_SPOT, PITCH.RIGHT - PITCH.PEN_SPOT].forEach(px => {
        ctx.beginPath(); ctx.arc(px * sx, H / 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    });
    ctx.beginPath();
    ctx.ellipse((PITCH.LEFT + PITCH.PEN_SPOT) * sx, H / 2, PITCH.CIRCLE_RX * sx, PITCH.CIRCLE_RY * sy, 0, -0.93, 0.93);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse((PITCH.RIGHT - PITCH.PEN_SPOT) * sx, H / 2, PITCH.CIRCLE_RX * sx, PITCH.CIRCLE_RY * sy, 0, Math.PI - 0.93, Math.PI + 0.93);
    ctx.stroke();
    [[PITCH.LEFT, 0], [PITCH.RIGHT, 0], [PITCH.LEFT, 100], [PITCH.RIGHT, 100]].forEach(([cx, cy]) => {
        const startA = (cx < 50 ? 0 : Math.PI) + (cy < 50 ? -Math.PI / 2 : Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(cx * sx, cy * sy, 0.86 * sx, 1.47 * sy, 0, startA, startA + Math.PI / 2);
        ctx.stroke();
    });
    const gNetY = PITCH.GOAL_TOP * sy, gNetH = (PITCH.GOAL_BOTTOM - PITCH.GOAL_TOP) * sy;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(0, gNetY, PITCH.LEFT * sx, gNetH);
    ctx.fillRect(PITCH.RIGHT * sx, gNetY, PITCH.LEFT * sx, gNetH);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, gNetY, PITCH.LEFT * sx, gNetH);
    ctx.strokeRect(PITCH.RIGHT * sx, gNetY, PITCH.LEFT * sx, gNetH);
}

function drawFrame(
    ctx: CanvasRenderingContext2D,
    game: GameEngine,
    homeColor: string, homeSec: string,
    awayColor: string, awaySec: string,
) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const sx = W / 100, sy = H / 100;
    drawPitch(ctx, W, H, sx, sy);
    const pr = 1.2 * sx;
    for (const p of game.players) {
        const x = p.pos.x * sx, y = p.pos.y * sy;
        const stAlpha = 0.35 + (0.6 + p.stamina * 0.4) * 0.65;
        ctx.globalAlpha = Math.min(1, stAlpha);
        ctx.fillStyle = p.isHome ? homeColor : awayColor;
        ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.isHome ? homeSec : awaySec;
        ctx.lineWidth = 1.2; ctx.stroke();
        ctx.globalAlpha = 1.0;
        if (game.ballOwner === p) {
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, pr + 2.5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = p.isHome ? homeSec : awaySec;
        ctx.font = `bold ${Math.round(pr * 0.9)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.number.toString(), x, y);
    }
    const bx = game.ball.pos.x * sx;
    const by = game.ball.pos.y * sy;
    const ballR = 0.55 * sx;
    const ballZ = game.ball.z;
    if (ballZ > 0.5) {
        const shadowAlpha = Math.max(0.08, 0.35 - ballZ * 0.015);
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(bx, by, ballR * 1.3, ballR * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    const heightOffset = ballZ * sy * 0.4;
    const drawY = by - heightOffset;
    const perspR = ballR * Math.max(0.7, 1 - ballZ * 0.01);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, drawY, perspR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333333'; ctx.lineWidth = 0.7; ctx.stroke();
}

// ═════════════════════════════════════════════════════════════════════════════
// REACT COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, userTeamId, onMatchComplete, competition = 'La Liga' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const prevTimeRef = useRef<number>(0);
    const isFinishedRef = useRef(false);

    // ── React state (UI only — canvas reads engine ref directly) ─────────
    const [isPausedState, setIsPausedState] = useState(false);
    const [isHalftime, setIsHalftime] = useState(false);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [minute, setMinute] = useState(0);
    const [events, setEvents] = useState<string[]>([]);
    const [stats, setStats] = useState<MatchStats>({
        home: { shots: 0, shotsOnTarget: 0, possession: 50 },
        away: { shots: 0, shotsOnTarget: 0, possession: 50 },
    });
    const [showTacticsModal, setShowTacticsModal] = useState(false);
    const [liveUserTeam, setLiveUserTeam] = useState<Team>(userTeamId === homeTeam.id ? homeTeam : awayTeam);
    const [subbedOutIds, setSubbedOutIds] = useState<Set<string>>(new Set());

    // ── Tactics modal draft state ────────────────────────────────────────
    const [draftRoster, setDraftRoster] = useState<Player[]>([]);
    const [draftFormation, setDraftFormation] = useState<Formation>('4-3-3');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [changeCount, setChangeCount] = useState(0);

    // ── Canvas alignment ─────────────────────────────────────────────────
    const [alignPad, setAlignPad] = useState({ left: 0, right: 0 });
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const update = () => {
            const r = canvas.getBoundingClientRect();
            setAlignPad({
                left: Math.round(r.left),
                right: Math.round(window.innerWidth - r.right),
            });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    const isPausedRef = useRef(isPausedState || showTacticsModal);
    const isHalftimeRef = useRef(isHalftime);
    const onMatchCompleteRef = useRef(onMatchComplete);
    isPausedRef.current = isPausedState || showTacticsModal;
    isHalftimeRef.current = isHalftime;
    onMatchCompleteRef.current = onMatchComplete;

    // ── Open tactics modal: snapshot current state into draft ─────────────
    const openTacticsModal = () => {
        setDraftRoster([...(liveUserTeam.roster || [])]);
        setDraftFormation(liveUserTeam.formation || '4-3-3');
        setSelectedPlayerId(null);
        setChangeCount(0);
        setShowTacticsModal(true);
    };

    // ── Handle player click in tactics modal (swap any two) ──────────────
    const handleTacticsPlayerClick = (clickedPlayer: Player) => {
        if (selectedPlayerId === clickedPlayer.id) {
            setSelectedPlayerId(null);
            return;
        }
        if (!selectedPlayerId) {
            setSelectedPlayerId(clickedPlayer.id);
        } else {
            const playerAIndex = draftRoster.findIndex(p => p.id === selectedPlayerId);
            const playerBIndex = draftRoster.findIndex(p => p.id === clickedPlayer.id);
            if (playerAIndex === -1 || playerBIndex === -1) return;

            const newRoster = [...draftRoster];
            const pA = { ...newRoster[playerAIndex] };
            const pB = { ...newRoster[playerBIndex] };

            // If swapping field↔bench, it's a substitution
            const isSub = pA.offField !== pB.offField;
            if (isSub) {
                const goingOff = pA.offField ? pB : pA;
                // Can't bring back someone already subbed off
                if (subbedOutIds.has(pA.id) || subbedOutIds.has(pB.id)) {
                    setSelectedPlayerId(null);
                    return;
                }
            }

            const tempOffField = pA.offField;
            pA.offField = pB.offField;
            pB.offField = tempOffField;
            newRoster[playerAIndex] = pB;
            newRoster[playerBIndex] = pA;

            setDraftRoster(newRoster);
            setChangeCount(prev => prev + 1);
            setSelectedPlayerId(null);
        }
    };

    // ── Handle formation change in draft ─────────────────────────────────
    const handleDraftFormationChange = (fmt: Formation) => {
        setDraftFormation(fmt);
        const aligned = alignRoster(draftRoster, fmt);
        setDraftRoster(aligned);
        setChangeCount(prev => prev + 1);
    };

    // ── Apply all draft changes ──────────────────────────────────────────
    const applyDraftChanges = () => {
        // Figure out who was subbed out
        const originalOnField = new Set((liveUserTeam.roster || []).filter(p => !p.offField).map(p => p.id));
        const newOnField = new Set(draftRoster.filter(p => !p.offField).map(p => p.id));
        const newSubbedOut = new Set(subbedOutIds);
        originalOnField.forEach(id => {
            if (!newOnField.has(id)) newSubbedOut.add(id);
        });
        setSubbedOutIds(newSubbedOut);

        const updatedTeam = { ...liveUserTeam, roster: draftRoster, formation: draftFormation };
        setLiveUserTeam(updatedTeam);
        engineRef.current?.applyTacticalChange(updatedTeam, userTeamId === homeTeam.id);
        setShowTacticsModal(false);
        setSelectedPlayerId(null);
    };

    // ── Computed values for the draft modal ──────────────────────────────
    const draftStarters = useMemo(() => draftRoster.filter(p => !p.offField), [draftRoster]);
    const draftBench = useMemo(() =>
        draftRoster.filter(p => p.offField && !subbedOutIds.has(p.id)).sort((a, b) => b.rating - a.rating),
        [draftRoster, subbedOutIds]
    );
    const draftSubbedOff = useMemo(() =>
        draftRoster.filter(p => subbedOutIds.has(p.id)),
        [draftRoster, subbedOutIds]
    );
    const getDraftFormationPos = (index: number) => FORMATIONS[draftFormation]?.[index] || { x: 50, y: 50, position: '?' };

    // ── Canvas draw callback ─────────────────────────────────────────────
    const draw = useCallback((game: GameEngine) => {
        const cvs = canvasRef.current;
        const ctx = cvs?.getContext('2d');
        if (!cvs || !ctx) return;
        drawFrame(ctx, game, homeTeam.primaryColor, homeTeam.secondaryColor, awayTeam.primaryColor, awayTeam.secondaryColor);
    }, [homeTeam, awayTeam]);

    // ── Game loop ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new GameEngine(
                homeTeam, awayTeam,
                (h, a, m, e, s) => {
                    setScore({ home: h, away: a });
                    setMinute(m);
                    setEvents([...e]);
                    setStats(s);
                },
                () => {
                    setIsHalftime(true);
                    setIsPausedState(true);
                },
            );
        }

        let rafId: number;
        const loop = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const rawDt = (time - prevTimeRef.current) / 1000;
            prevTimeRef.current = time;

            const engine = engineRef.current!;

            if (!isPausedRef.current && !isHalftimeRef.current && !isFinishedRef.current) {
                engine.update(rawDt);
                draw(engine);

                if (engine.minute >= 90) {
                    isFinishedRef.current = true;
                    setTimeout(() => onMatchCompleteRef.current(engine.homeScore, engine.awayScore), 1000);
                    return;
                }
            } else {
                draw(engine);
            }

            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [draw, homeTeam, awayTeam]);

    // ═════════════════════════════════════════════════════════════════════
    // JSX
    // ═════════════════════════════════════════════════════════════════════

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-950 text-white overflow-hidden">

            {/* ── 1. Scoreboard ──────────────────────────────────────────── */}
            <header className="shrink-0 flex items-center bg-slate-900 border-b border-slate-800 shadow-lg z-10 py-2">
                <div className="flex items-center w-full gap-3" style={{ paddingLeft: alignPad.left, paddingRight: alignPad.right }}>
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 p-1.5">
                            {homeTeam.logoUrl
                                ? <img src={homeTeam.logoUrl} className="w-full h-full object-contain" alt={homeTeam.shortName} />
                                : <span className="text-xs font-black text-slate-300">{homeTeam.shortName[0]}</span>}
                        </div>
                        <div className="min-w-0">
                            <span className="block font-black text-sm md:text-base tracking-tight truncate leading-tight">{homeTeam.shortName}</span>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-px">Home</span>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-4xl md:text-5xl font-mono font-black tabular-nums w-10 text-right leading-none">{score.home}</span>
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-0.5 min-w-[3.5rem] text-center">
                                    <span className="font-mono font-bold text-xs md:text-sm text-emerald-400 tracking-widest">
                                        {minute >= 90 ? 'FT' : `${minute}'`}
                                    </span>
                                </div>
                                <div className="w-20 md:w-28 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000 rounded-full" style={{ width: `${(minute / 90) * 100}%` }} />
                                </div>
                            </div>
                            <span className="text-4xl md:text-5xl font-mono font-black tabular-nums w-10 text-left leading-none">{score.away}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{competition}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                        <div className="min-w-0 text-right">
                            <span className="block font-black text-sm md:text-base tracking-tight truncate leading-tight">{awayTeam.shortName}</span>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-px">Away</span>
                        </div>
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 p-1.5">
                            {awayTeam.logoUrl
                                ? <img src={awayTeam.logoUrl} className="w-full h-full object-contain" alt={awayTeam.shortName} />
                                : <span className="text-xs font-black text-slate-300">{awayTeam.shortName[0]}</span>}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── 2. Pitch (canvas) ──────────────────────────────────────── */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-950 p-2 md:p-3 relative">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={583}
                    className="max-w-full max-h-full aspect-[1000/583] rounded-xl shadow-2xl ring-1 ring-white/10"
                />

                {/* Halftime overlay */}
                {isHalftime && !showTacticsModal && (
                    <div className="absolute inset-0 m-2 md:m-3 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-xl">
                        <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 mb-5">Half Time</span>
                            <p className="text-6xl font-black mb-1.5 tabular-nums tracking-tight">{score.home} – {score.away}</p>
                            <p className="text-slate-500 text-xs mb-7">{homeTeam.shortName} vs {awayTeam.shortName}</p>
                            <button
                                onClick={() => { engineRef.current?.startSecondHalf(); setIsHalftime(false); setIsPausedState(false); }}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-all px-7 py-3 rounded-xl font-bold text-sm shadow-xl hover:-translate-y-0.5 duration-150"
                            >
                                <PlayIcon size={16} /> Start Second Half
                            </button>
                        </div>
                    </div>
                )}

                {/* ── OVERHAULED TACTICS MODAL ──────────────────────────────── */}
                {showTacticsModal && (
                    <div className="absolute inset-0 m-2 md:m-3 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl p-2 md:p-4">
                        <div className="bg-slate-900 border border-slate-700 p-3 md:p-5 rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl overflow-hidden">
                            {/* Modal header */}
                            <div className="flex items-center justify-between shrink-0 pb-2 md:pb-3 mb-2 md:mb-4 border-b border-slate-800">
                                <h2 className="text-sm md:text-base font-black flex items-center gap-2 text-white">
                                    <Sliders className="text-emerald-400" size={18} /> Tactics
                                    {changeCount > 0 && (
                                        <span className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                            {changeCount} change{changeCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{ backgroundColor: liveUserTeam.primaryColor }} />
                                    <span className="text-xs md:text-sm font-bold text-slate-300">{liveUserTeam.shortName}</span>
                                </div>
                            </div>

                            {/* Formation selector */}
                            <div className="flex items-center gap-3 mb-3 shrink-0">
                                <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">Formation</span>
                                <select
                                    value={draftFormation}
                                    onChange={(e) => handleDraftFormationChange(e.target.value as Formation)}
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-[10px] md:text-xs outline-none text-white min-w-[100px]"
                                >
                                    <option value="4-3-3">4-3-3 Holding</option>
                                    <option value="4-2-3-1">4-2-3-1 Modern</option>
                                    <option value="4-4-2">4-4-2 Flat</option>
                                    <option value="3-5-2">3-5-2 Wingbacks</option>
                                </select>
                                <span className="text-[9px] text-slate-500 ml-auto hidden sm:block">Tap two players to swap</span>
                            </div>

                            <div className="flex flex-row gap-3 md:gap-4 flex-1 min-h-0 overflow-hidden mb-3 md:mb-4">
                                {/* Mini pitch */}
                                <div className="flex-1 flex items-start justify-center min-h-0">
                                    <div className="w-full aspect-[3/4] bg-emerald-900 rounded-xl border border-slate-600/80 relative overflow-hidden shadow-xl" style={{ maxHeight: '100%' }}>
                                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 28px)' }} />
                                        <div className="absolute inset-x-0 top-1/2 h-px bg-white/25 -translate-y-1/2" />
                                        <div className="absolute top-0 left-1/4 right-1/4 h-10 border-b border-l border-r border-white/20" />
                                        <div className="absolute bottom-0 left-1/4 right-1/4 h-10 border-t border-l border-r border-white/20" />
                                        <div className="absolute inset-0 m-auto w-14 h-14 border border-white/20 rounded-full" />

                                        {draftStarters.map((player: Player, index: number) => {
                                            const pos = getDraftFormationPos(index);
                                            const isSelected = selectedPlayerId === player.id;
                                            const fit = getPositionFit(player.position, pos.position);
                                            const effRating = getPenalizedRating(player.rating, player.position, pos.position);
                                            return (
                                                <button key={player.id}
                                                    onClick={() => handleTacticsPlayerClick(player)}
                                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-transform duration-150 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                                                    style={{ left: `${pos.y}%`, top: `${100 - pos.x}%` }}>
                                                    <div
                                                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-black shadow-lg ${isSelected ? 'ring-2 ring-offset-1 ring-yellow-400 border-white ring-offset-emerald-900' : 'border-white/70'}`}
                                                        style={{ backgroundColor: liveUserTeam.primaryColor, color: liveUserTeam.secondaryColor }}>
                                                        {player.number}
                                                    </div>
                                                    <div className={`mt-0.5 px-1 rounded text-[7px] font-bold truncate max-w-[52px] text-center ${isSelected ? 'bg-yellow-400 text-black' : 'bg-black/60 text-white/90'}`}>
                                                        {player.name.split(' ').pop()}
                                                    </div>
                                                    <div className={`text-[6px] font-bold px-0.5 rounded flex items-center gap-0.5 mt-0.5 ${fit === 'bad' ? 'bg-red-600/90 text-white' : fit === 'okay' ? 'bg-yellow-500/90 text-black' : 'bg-black/40 text-white'}`}>
                                                        <span>{effRating}</span>
                                                        <span>{player.position}</span>
                                                        {fit !== 'good' && <span className="opacity-70">→{pos.position}</span>}
                                                    </div>
                                                    {fit === 'bad' && <div className="absolute -top-1 -left-1 bg-red-600 rounded-full shadow"><AlertTriangle size={8} className="text-white p-0.5" /></div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bench panel */}
                                <div className="w-40 md:w-44 flex flex-col overflow-y-auto min-h-0 custom-scrollbar gap-1.5">
                                    <p className="font-black text-slate-400 text-[9px] uppercase tracking-widest mb-1 shrink-0">Bench</p>
                                    {draftBench.map((p: Player) => {
                                        const isSelected = selectedPlayerId === p.id;
                                        return (
                                            <div key={p.id}
                                                onClick={() => handleTacticsPlayerClick(p)}
                                                className={`p-2 md:p-2.5 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-yellow-500/20 border-yellow-500 shadow-sm' : 'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-700/70'}`}>
                                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                                    <span className="text-xs font-bold text-white truncate">{p.number}. {p.name.split(' ').pop()}</span>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${isSelected ? 'bg-yellow-700/60 text-yellow-200' : 'bg-slate-700 text-slate-400'}`}>{p.position}</span>
                                                </div>
                                                <div className="text-slate-500 text-[9px] font-mono">★ {p.rating}</div>
                                                {selectedPlayerId && !isSelected && <ArrowRightLeft size={10} className="text-slate-500 animate-pulse mt-1" />}
                                            </div>
                                        );
                                    })}
                                    {draftSubbedOff.length > 0 && (
                                        <>
                                            <p className="font-bold text-slate-600 text-[9px] uppercase tracking-widest mt-2 mb-1 shrink-0">Subbed Off</p>
                                            {draftSubbedOff.map((p: Player) => (
                                                <div key={p.id} className="p-2 rounded-xl border bg-slate-900/50 border-slate-800 opacity-40">
                                                    <div className="text-xs text-slate-500">{p.number}. {p.name.split(' ').pop()}</div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex justify-between items-center gap-2 shrink-0 pt-2 md:pt-3 border-t border-slate-800">
                                {selectedPlayerId && (
                                    <button
                                        onClick={() => setSelectedPlayerId(null)}
                                        className="text-[10px] md:text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded border border-red-500/30"
                                    >
                                        Deselect
                                    </button>
                                )}
                                <div className="flex-1" />
                                <button onClick={() => { setShowTacticsModal(false); setSelectedPlayerId(null); }} className="px-4 py-2 md:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs md:text-sm transition-colors border border-slate-700">Cancel</button>
                                <button onClick={applyDraftChanges} disabled={changeCount === 0}
                                    className="px-5 py-2 md:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs md:text-sm transition-all hover:-translate-y-0.5 duration-150 shadow-lg shadow-emerald-900/30">
                                    Apply {changeCount > 0 ? `(${changeCount})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 3. Controls ────────────────────────────────────────────── */}
            <div className="shrink-0 h-16 flex items-center justify-center gap-3 bg-slate-900 border-t border-slate-800 px-4">
                {isHalftime ? (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-slate-300 text-xs uppercase tracking-widest font-black">Half Time</span>
                    </div>
                ) : isFinishedRef.current ? (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-300 text-xs uppercase tracking-widest font-black">Full Time</span>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setIsPausedState(!isPausedState)}
                            className="w-11 h-11 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors rounded-xl shadow-lg shadow-emerald-900/30"
                        >
                            {isPausedState ? <Play fill="currentColor" size={18} /> : <Pause fill="currentColor" size={18} />}
                        </button>
                        <button
                            onClick={openTacticsModal}
                            className="h-11 px-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors rounded-xl font-bold text-sm border border-slate-700 shadow-md"
                        >
                            <Sliders size={15} /> Tactics
                        </button>
                        <button
                            onClick={() => {
                                if (engineRef.current && !isFinishedRef.current) {
                                    isFinishedRef.current = true;
                                    engineRef.current.skipToEnd();
                                    setIsPausedState(true);
                                    onMatchComplete(engineRef.current.homeScore, engineRef.current.awayScore);
                                }
                            }}
                            className="h-11 px-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors rounded-xl font-bold text-sm border border-slate-700 shadow-md"
                        >
                            <FastForward size={15} /> Sim to End
                        </button>
                    </>
                )}
            </div>

            {/* ── 4. Stats bar + Events log ──────────────────────────────── */}
            <div className="shrink-0 h-[26vh] flex flex-col bg-slate-900 border-t border-slate-800">
                <div className="shrink-0 flex items-center gap-2.5 py-2.5 border-b border-slate-800" style={{ paddingLeft: alignPad.left, paddingRight: alignPad.right }}>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400/80 hidden sm:block">{homeTeam.shortName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                        <span className="font-black text-emerald-400 tabular-nums">{stats.home.shots}</span>
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Shots</span>
                        <span className="font-black text-sky-400 tabular-nums">{stats.away.shots}</span>
                    </div>
                    <div className="w-px h-3.5 bg-slate-700 shrink-0" />
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                        <span className="font-black text-emerald-400 tabular-nums">{stats.home.shotsOnTarget}</span>
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">On Target</span>
                        <span className="font-black text-sky-400 tabular-nums">{stats.away.shotsOnTarget}</span>
                    </div>
                    <div className="w-px h-3.5 bg-slate-700 shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-emerald-400 tabular-nums shrink-0">{stats.home.possession}%</span>
                        <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${stats.home.possession}%` }} />
                            <div className="bg-sky-500 transition-all duration-500" style={{ width: `${stats.away.possession}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-sky-400 tabular-nums shrink-0">{stats.away.possession}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-sky-400/80 hidden sm:block">{awayTeam.shortName}</span>
                        <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1.5 custom-scrollbar" style={{ paddingLeft: alignPad.left, paddingRight: alignPad.right }}>
                    {events.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-slate-600 text-xs uppercase tracking-widest font-bold">Match underway...</span>
                        </div>
                    ) : (
                        [...events].reverse().map((ev, i) => {
                            const isGoal    = ev.includes('GOAL');
                            const isSave    = ev.includes('Save') || ev.includes('Punched');
                            const isShot    = ev.includes('Shot');
                            const isOffside = ev.includes('OFFSIDE');
                            const evMinute  = ev.split(' ')[0];
                            const text      = ev.substring(ev.indexOf(' ') + 1);
                            return (
                                <div key={events.length - 1 - i} className="flex gap-2 items-start">
                                    <span className="text-slate-600 font-mono text-[10px] font-bold pt-1.5 shrink-0 w-7 text-right">{evMinute}</span>
                                    <div className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs border leading-snug ${
                                        isGoal    ? 'bg-amber-950/70 border-amber-600/60 text-amber-200 font-black border-l-2 border-l-amber-400' :
                                        isSave    ? 'bg-sky-950/60 border-sky-800/60 text-sky-300 font-medium' :
                                        isShot    ? 'bg-slate-800/70 border-slate-700 text-slate-200 font-medium' :
                                        isOffside ? 'bg-red-950/50 border-red-800/50 text-red-400' :
                                                    'bg-slate-800/40 border-slate-800 text-slate-400'
                                    }`}>
                                        {text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchView;