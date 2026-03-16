import React, { useEffect, useRef, useState } from 'react';
import { Team, Player } from '../types';
import { FORMATIONS } from '../constants';
import { FastForward, Play, Pause, RotateCcw, PieChart } from 'lucide-react';

interface MatchViewProps {
    homeTeam: Team;
    awayTeam: Team;
    userTeamId: string;
    onMatchComplete: (homeScore: number, awayScore: number) => void;
    competition?: string;
    stage?: string;
}

export interface MatchStats {
    home: { shots: number, possession: number };
    away: { shots: number, possession: number };
}

const HALF_DURATION_REAL_SEC = 18;
const MAX_SPEED = 45.0, MAX_FORCE = 150.0;
const FRICTION = 0.92, BALL_FRICTION = 0.98;
const PASS_SPEED = 65.0, SHOOT_SPEED = 95.0;

class Vector {
    constructor(public x: number, public y: number) {}
    add(v: Vector) { this.x += v.x; this.y += v.y; return this; }
    sub(v: Vector) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n: number) { this.x *= n; this.y *= n; return this; }
    div(n: number) { this.x /= n; this.y /= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const m = this.mag(); if (m !== 0) this.div(m); return this; }
    limit(max: number) { if (this.mag() > max) { this.normalize(); this.mult(max); } return this; }
    static dist(v1: Vector, v2: Vector) { return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2); }
    clone() { return new Vector(this.x, this.y); }
}

class GameEntity {
    pos: Vector; vel: Vector; acc: Vector;
    constructor(x: number, y: number) { this.pos = new Vector(x, y); this.vel = new Vector(0, 0); this.acc = new Vector(0, 0); }
    applyForce(force: Vector) { this.acc.add(force); }
    updatePhysics(dt: number) { this.vel.add(this.acc.clone().mult(dt)); this.pos.add(this.vel.clone().mult(dt)); this.acc.mult(0); }
}

class Agent extends GameEntity {
    id: string; teamId: string; role: string; number: number; rating: number; basePos: Vector; isHome: boolean;
    constructor(p: Player, teamId: string, role: string, isHome: boolean, bx: number, by: number) {
        super(bx, by); this.id = p.id; this.number = p.number; this.rating = p.rating;
        this.teamId = teamId; this.role = role; this.isHome = isHome; this.basePos = new Vector(bx, by);
    }
    arrive(target: Vector, speedMult = 1.0): Vector {
        const desired = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        const d = desired.mag(); desired.normalize();
        desired.mult(d < 15 ? MAX_SPEED * speedMult * (d / 15) : MAX_SPEED * speedMult);
        return desired.sub(this.vel).limit(MAX_FORCE * speedMult);
    }
}

class GameEngine {
    minute = 0; period = 1; homeScore = 0; awayScore = 0; events: string[] = [];
    ball: GameEntity; ballOwner: Agent | null = null; players: Agent[] = [];
    state: 'PLAYING' | 'HALFTIME' | 'STOPPED' = 'PLAYING';
    private cooldown = 0; private stateTimer = 0; private lastToucher: Agent | null = null;
    
    homeStats = { shots: 0, possessionFrames: 0 };
    awayStats = { shots: 0, possessionFrames: 0 };

    constructor(public homeTeam: Team, public awayTeam: Team, private onUpdate: (h: number, a: number, m: number, e: string[], stats: MatchStats) => void, private onHalftime: () => void) {
        this.ball = new GameEntity(50, 50);
        this.initPlayers(); this.setupKickoff(true);
    }

    private triggerUpdate() {
        const total = (this.homeStats.possessionFrames + this.awayStats.possessionFrames) || 1;
        this.onUpdate(this.homeScore, this.awayScore, Math.floor(this.minute), this.events, {
            home: { shots: this.homeStats.shots, possession: Math.round((this.homeStats.possessionFrames / total) * 100) },
            away: { shots: this.awayStats.shots, possession: Math.round((this.awayStats.possessionFrames / total) * 100) }
        });
    }

    initPlayers() {
        const createAgents = (team: Team, isHome: boolean) => {
            const formation = FORMATIONS[team.formation || '4-3-3'];
            return team.roster.filter(p => !p.offField).map((p, i) => {
                const pos = formation[i] || { x: 50, y: 50, position: 'MID' };
                return new Agent(p, team.id, pos.position, isHome, isHome ? pos.x : 100 - pos.x, pos.y);
            });
        };
        this.players = [...createAgents(this.homeTeam, true), ...createAgents(this.awayTeam, false)];
    }

    setupKickoff(homeStarts: boolean) {
        this.state = 'STOPPED'; this.stateTimer = 1.0;
        this.ball.pos = new Vector(50, 50); this.ball.vel = new Vector(0, 0); this.ballOwner = null; this.lastToucher = null;
        this.players.forEach(p => { p.pos = this.period === 2 ? new Vector(100 - p.basePos.x, p.basePos.y) : p.basePos.clone(); p.vel = new Vector(0, 0); });
        const striker = this.players.find(p => p.teamId === (homeStarts ? this.homeTeam.id : this.awayTeam.id) && p.role !== 'GK');
        if (striker) { striker.pos = new Vector(50, 50.5); this.ballOwner = striker; }
    }

    startSecondHalf() { this.period = 2; this.events.unshift("45' Second Half Started"); this.setupKickoff(false); }

    update(dt: number) {
        if (this.minute >= 90) return;

        if (this.state === 'PLAYING' || this.state === 'STOPPED') {
            this.minute += dt * (45 / HALF_DURATION_REAL_SEC);
            if (this.ballOwner) {
                if (this.ballOwner.isHome) this.homeStats.possessionFrames++;
                else this.awayStats.possessionFrames++;
            }
            if (this.period === 1 && this.minute >= 45) {
                this.state = 'HALFTIME'; this.events.unshift("45' Halftime");
                this.triggerUpdate(); this.onHalftime(); return;
            }
        }

        if (this.state === 'STOPPED') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                if (this.ballOwner) {
                    const mate = this.players.find(p => p.teamId === this.ballOwner!.teamId && p !== this.ballOwner);
                    if (mate) this.pass(this.ballOwner, mate);
                }
                this.state = 'PLAYING';
            }
            this.physicsStep(dt * 0.5); return;
        }

        if (this.state === 'PLAYING') {
            this.aiStep(dt); this.physicsStep(dt); this.checkCollisions(); this.checkBoundaries();
        }
        this.triggerUpdate();
    }

    aiStep(dt: number) {
        const ballPos = this.ball.pos;
        let cHome: Agent | null = null, cAway: Agent | null = null, dHome = Infinity, dAway = Infinity;
        this.players.forEach(p => {
            const d = Vector.dist(p.pos, ballPos);
            if (p.isHome && d < dHome) { dHome = d; cHome = p; }
            if (!p.isHome && d < dAway) { dAway = d; cAway = p; }
        });

        this.players.forEach(p => {
            const force = new Vector(0, 0);
            const homeAttacksRight = this.period === 1;
            const oppGoalX = p.isHome ? (homeAttacksRight ? 100 : 0) : (homeAttacksRight ? 0 : 100);

            if (p.role === 'GK') {
                force.add(p.arrive(new Vector(p.isHome ? (homeAttacksRight ? 2 : 98) : (homeAttacksRight ? 98 : 2), Math.max(35, Math.min(65, ballPos.y)))));
            } else {
                let target = p.basePos.clone();
                if (this.period === 2) target.x = 100 - target.x;
                target.x += (ballPos.x - 50) * 0.5;
                
                if (this.ballOwner?.teamId === p.teamId) {
                    if (this.ballOwner === p) {
                        force.add(p.arrive(new Vector(oppGoalX, 50)).mult(1.2));
                        if (Vector.dist(p.pos, new Vector(oppGoalX, 50)) < 30 && this.cooldown <= 0) {
                            if (Math.random() < 2.0 * dt) this.shoot(p);
                        } else if (this.cooldown <= 0 && Math.random() < 3.0 * dt) {
                            const mate = this.players.find(m => m.teamId === p.teamId && m !== p && Vector.dist(p.pos, m.pos) < 35 && Vector.dist(p.pos, m.pos) > 10);
                            if (mate) this.pass(p, mate);
                        }
                    } else force.add(p.arrive(new Vector(target.x + (p.isHome === homeAttacksRight ? 20 : -20), target.y)));
                } else {
                    if (p === cHome || p === cAway) force.add(p.arrive(ballPos).mult(1.5));
                    else force.add(p.arrive(target));
                }
            }
            p.applyForce(force);
        });
        if (this.cooldown > 0) this.cooldown -= dt;
    }

    physicsStep(dt: number) {
        this.players.forEach(p => { p.updatePhysics(dt); p.vel.mult(FRICTION); p.pos.x = Math.max(0, Math.min(100, p.pos.x)); p.pos.y = Math.max(0, Math.min(100, p.pos.y)); });
        if (this.ballOwner) {
            this.ball.pos.x += (this.ballOwner.pos.x + this.ballOwner.vel.x * 0.1 - this.ball.pos.x) * 0.3;
            this.ball.pos.y += (this.ballOwner.pos.y + this.ballOwner.vel.y * 0.1 - this.ball.pos.y) * 0.3;
            this.ball.vel = this.ballOwner.vel.clone();
        } else { this.ball.updatePhysics(dt); this.ball.vel.mult(BALL_FRICTION); }
    }

    pass(from: Agent, to: Agent) {
        this.ballOwner = null; this.lastToucher = from;
        const dir = new Vector(to.pos.x - from.pos.x, to.pos.y - from.pos.y).normalize();
        dir.x += (Math.random() - 0.5) * 0.1; dir.y += (Math.random() - 0.5) * 0.1;
        this.ball.vel = dir.mult(PASS_SPEED); this.cooldown = 0.3;
    }

    shoot(from: Agent) {
        this.ballOwner = null; this.lastToucher = from;
        if (from.isHome) this.homeStats.shots++; else this.awayStats.shots++;
        const oppGoalX = from.isHome ? (this.period === 1 ? 100 : 0) : (this.period === 1 ? 0 : 100);
        this.ball.vel = new Vector(oppGoalX - from.pos.x, 50 - from.pos.y).normalize().mult(SHOOT_SPEED);
        this.cooldown = 0.5;
        this.events.unshift(`${Math.floor(this.minute)}' Shot by ${from.teamId === this.homeTeam.id ? this.homeTeam.shortName : this.awayTeam.shortName}`);
    }

    checkCollisions() {
        if (!this.ballOwner) {
            let closest: Agent | null = null, minDist = 2.5;
            this.players.forEach(p => { const d = Vector.dist(p.pos, this.ball.pos); if (d < minDist && !(this.lastToucher === p && this.cooldown > 0)) { minDist = d; closest = p; } });
            if (closest) {
                if (Math.random() * 100 + closest.rating > this.ball.vel.mag() * 0.4) {
                    this.ballOwner = closest;
                    if (closest.role === 'GK') { this.state = 'STOPPED'; this.stateTimer = 1.0; this.events.unshift(`${Math.floor(this.minute)}' Great Save!`); }
                } else { this.ball.vel.mult(-0.5); this.lastToucher = closest; this.cooldown = 0.2; }
            }
        } else {
            this.players.forEach(p => {
                if (p.teamId !== this.ballOwner!.teamId && Vector.dist(p.pos, this.ballOwner!.pos) < 2.0 && this.cooldown <= 0) {
                    if (Math.random() * p.rating > Math.random() * this.ballOwner!.rating) { this.ballOwner = p; this.lastToucher = p; this.cooldown = 0.5; }
                }
            });
        }
    }

    checkBoundaries() {
        const { x, y } = this.ball.pos;
        if (y > 44 && y < 56) {
            if (x < 0.5) this.scoreGoal(this.period === 1 ? false : true);
            else if (x > 99.5) this.scoreGoal(this.period === 1 ? true : false);
            return;
        }
        if (y < 0 || y > 100 || x < 0 || x > 100) {
            this.state = 'STOPPED'; this.stateTimer = 1.0; this.ballOwner = null;
            if (y < 0 || y > 100) { this.ball.pos.y = y < 0 ? 0.5 : 99.5; this.events.unshift(`${Math.floor(this.minute)}' Throw-in`); }
            else { 
                const isHomeGoalLine = this.period === 1 ? x < 50 : x > 50;
                this.ball.pos = new Vector(isHomeGoalLine ? 5 : 95, 50);
                this.events.unshift(`${Math.floor(this.minute)}' Goal Kick`);
            }
            this.ball.vel = new Vector(0, 0);
            const teamId = (this.lastToucher?.teamId === this.homeTeam.id) ? this.awayTeam.id : this.homeTeam.id;
            const nearest = this.players.filter(p => p.teamId === teamId && p.role !== 'GK').sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
            if (nearest) { nearest.pos = this.ball.pos.clone(); this.ballOwner = nearest; }
        }
    }

    scoreGoal(isHome: boolean) {
        this.state = 'STOPPED'; this.stateTimer = 1.0;
        if (isHome) { this.homeScore++; this.events.unshift(`${Math.floor(this.minute)}' GOAL! ${this.homeTeam.shortName}`); }
        else { this.awayScore++; this.events.unshift(`${Math.floor(this.minute)}' GOAL! ${this.awayTeam.shortName}`); }
        this.setupKickoff(!isHome); this.triggerUpdate();
    }

    skipToEnd() {
        const remaining = 90 - this.minute; if (remaining <= 0) return;
        const diff = (this.homeTeam.strength + 5) - this.awayTeam.strength;
        const hProb = 0.015 + (diff * 0.0006), aProb = 0.015 - (diff * 0.0006);
        for (let m = 0; m < remaining; m++) {
            if (Math.random() < hProb) { this.homeScore++; this.homeStats.shots++; this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Sim)`); }
            if (Math.random() < aProb) { this.awayScore++; this.awayStats.shots++; this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Sim)`); }
        }
        this.minute = 90; this.triggerUpdate();
    }
}

const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, onMatchComplete, competition = 'La Liga' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const requestRef = useRef<number>(0);
    const prevTimeRef = useRef<number>(0);
    const isFinishedRef = useRef(false);

    const [isPausedState, setIsPausedState] = useState(false);
    const [isHalftime, setIsHalftime] = useState(false);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [minute, setMinute] = useState(0);
    const [events, setEvents] = useState<string[]>([]);
    const [stats, setStats] = useState<MatchStats>({ home: { shots: 0, possession: 50 }, away: { shots: 0, possession: 50 } });

    useEffect(() => {
        engineRef.current = new GameEngine(homeTeam, awayTeam, (h, a, m, e, s) => {
            setScore({ home: h, away: a }); setMinute(m); setEvents([...e]); setStats(s);
        }, () => { setIsHalftime(true); setIsPausedState(true); });

        const loop = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const dt = Math.min((time - prevTimeRef.current) / 1000, 0.1);
            prevTimeRef.current = time;

            if (engineRef.current && !isPausedState && !isHalftime && !isFinishedRef.current) {
                engineRef.current.update(dt);
                draw(engineRef.current);
                if (engineRef.current.minute >= 90) {
                    isFinishedRef.current = true;
                    setTimeout(() => onMatchComplete(engineRef.current!.homeScore, engineRef.current!.awayScore), 1000);
                    return;
                }
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isHalftime, isPausedState]);

    const draw = (game: GameEngine) => {
        const cvs = canvasRef.current, ctx = cvs?.getContext('2d'); if (!cvs || !ctx) return;
        const scaleX = cvs.width / 100, scaleY = cvs.height / 100;
        ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
        ctx.strokeRect(5 * scaleX, 0, 90 * scaleX, cvs.height);
        ctx.beginPath(); ctx.moveTo(cvs.width / 2, 0); ctx.lineTo(cvs.width / 2, cvs.height); ctx.stroke();
        ctx.beginPath(); ctx.arc(cvs.width / 2, cvs.height / 2, 9 * scaleX, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeRect(5 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY);
        ctx.strokeRect(80 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY);

        game.players.forEach(p => {
            const x = p.pos.x * scaleX, y = p.pos.y * scaleY;
            ctx.fillStyle = p.isHome ? homeTeam.primaryColor : awayTeam.primaryColor;
            ctx.beginPath(); ctx.arc(x, y, 1.5 * scaleX, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.number.toString(), x, y);
        });

        const bx = game.ball.pos.x * scaleX, by = game.ball.pos.y * scaleY;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, by, 1.0 * scaleX, 0, Math.PI * 2); ctx.fill();
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-900 text-white overflow-hidden min-w-0">
            <div className="h-16 md:h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-2 md:px-6 shadow-xl z-10 shrink-0 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-6 w-[35%] md:w-1/3 min-w-0">
                    <div className="w-8 h-8 md:w-14 md:h-14 flex items-center justify-center bg-slate-700 rounded-full shadow-inner p-1 shrink-0">
                        {homeTeam.logoUrl ? <img src={homeTeam.logoUrl} className="w-full h-full object-contain" /> : <div className="font-bold text-xs md:text-base">{homeTeam.shortName[0]}</div>}
                    </div>
                    <div className="min-w-0"><div className="text-base md:text-3xl font-black truncate">{homeTeam.shortName}</div></div>
                    <div className="text-2xl md:text-5xl font-mono font-bold ml-auto shrink-0">{score.home}</div>
                </div>
                <div className="flex flex-col items-center w-[30%] md:w-1/3 px-1 md:px-4 shrink-0">
                    <div className="bg-slate-900 px-3 md:px-6 py-1 md:py-2 rounded-full border border-slate-700 mb-1 md:mb-2">
                        <span className="font-mono font-bold text-xs md:text-xl text-blue-100">{minute >= 90 ? 'FT' : `${Math.floor(minute)}'`}</span>
                    </div>
                    <div className="w-full max-w-[200px] h-1 md:h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(minute / 90) * 100}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-6 w-[35%] md:w-1/3 justify-end min-w-0">
                    <div className="text-2xl md:text-5xl font-mono font-bold mr-auto shrink-0">{score.away}</div>
                    <div className="text-right min-w-0"><div className="text-base md:text-3xl font-black truncate">{awayTeam.shortName}</div></div>
                    <div className="w-8 h-8 md:w-14 md:h-14 flex items-center justify-center bg-slate-700 rounded-full p-1 shrink-0">
                        {awayTeam.logoUrl ? <img src={awayTeam.logoUrl} className="w-full h-full object-contain" /> : <div className="font-bold text-xs md:text-base">{awayTeam.shortName[0]}</div>}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
                <div className="w-full lg:flex-1 bg-slate-950 p-2 md:p-6 flex items-center justify-center relative min-h-[40vh] lg:min-h-0 shrink-0 border-b lg:border-b-0 border-slate-800">
                    <canvas ref={canvasRef} width={1000} height={600} className="max-w-full max-h-full aspect-[5/3] bg-emerald-800 rounded-lg md:rounded-xl shadow-2xl border-2 md:border-4 border-slate-800" />
                    
                    {isHalftime && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                            <div className="text-2xl md:text-4xl font-black mb-4 md:mb-6">HALFTIME</div>
                            <button onClick={() => { if (engineRef.current) engineRef.current.startSecondHalf(); setIsHalftime(false); setIsPausedState(false); }} className="bg-blue-600 px-4 md:px-8 py-2 md:py-3 rounded-xl font-bold flex items-center gap-2 text-sm md:text-base"><RotateCcw size={18} /> Start Second Half</button>
                        </div>
                    )}

                    {!isHalftime && !isFinishedRef.current && (
                        <div className="absolute bottom-2 md:bottom-8 flex gap-2 md:gap-4 bg-slate-900/90 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-700 scale-90 md:scale-100 origin-bottom">
                            <button onClick={() => setIsPausedState(!isPausedState)} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-blue-600 rounded-lg md:rounded-xl">
                                {isPausedState ? <Play fill="currentColor" size={20} className="md:w-[28px] md:h-[28px]" /> : <Pause fill="currentColor" size={20} className="md:w-[28px] md:h-[28px]" />}
                            </button>
                            <button onClick={() => { if (engineRef.current && !isFinishedRef.current) { isFinishedRef.current = true; engineRef.current.skipToEnd(); setIsPausedState(true); onMatchComplete(engineRef.current.homeScore, engineRef.current.awayScore); } }} className="px-3 md:px-6 h-10 md:h-14 flex items-center gap-2 bg-slate-700 rounded-lg md:rounded-xl font-bold text-xs md:text-base">
                                <FastForward fill="currentColor" size={18} className="md:w-[24px] md:h-[24px]" /> Skip to Result
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-96 bg-slate-900 lg:border-l border-slate-800 flex flex-col shadow-2xl z-20 flex-1 min-h-0 min-w-0">
                    <div className="border-b border-slate-800 bg-slate-800/30 flex flex-col shrink-0">
                        <div className="p-2 md:p-4 border-b border-slate-800/50 flex items-center gap-2 font-bold text-sm md:text-base"><PieChart size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" /> Match Stats</div>
                        <div className="p-2 md:p-4 space-y-2 md:space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase mb-1"><span className="text-blue-300">{stats.home.possession}%</span><span>Possession</span><span className="text-red-300">{stats.away.possession}%</span></div>
                                <div className="flex h-1.5 md:h-2 rounded-full overflow-hidden bg-slate-700"><div className="bg-blue-500 transition-all duration-300" style={{ width: `${stats.home.possession}%` }}></div><div className="bg-red-500 transition-all duration-300" style={{ width: `${stats.away.possession}%` }}></div></div>
                            </div>
                            <div className="flex justify-between items-center text-xs md:text-sm py-1">
                                <span className="font-bold text-blue-400 w-8 text-center">{stats.home.shots}</span><span className="text-slate-400 text-[10px] md:text-xs uppercase text-center flex-1">Shots</span><span className="font-bold text-red-400 w-8 text-center">{stats.away.shots}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4">
                        {events.map((ev, i) => (
                            <div key={i} className="flex gap-2 md:gap-4 items-start animate-in slide-in-from-right-4 fade-in duration-500">
                                <div className="text-slate-500 font-mono text-[10px] md:text-xs font-bold pt-1 min-w-[30px]">{ev.split(' ')[0]}</div>
                                <div className={`p-2 md:p-3 rounded-lg text-xs md:text-sm w-full border ${ev.includes('GOAL') ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
                                    {ev.substring(ev.indexOf(' ') + 1)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchView;