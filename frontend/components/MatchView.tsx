import React, { useEffect, useRef, useState } from 'react';
import { Team, Player } from '../types';
import { FORMATIONS, LIGA_LOGO_URL, UCL_LOGO_URL } from '../constants';
import { FastForward, Activity, Play, Pause, RotateCcw, PieChart } from 'lucide-react';

interface MatchViewProps {
    homeTeam: Team;
    awayTeam: Team;
    userTeamId: string;
    onMatchComplete: (homeScore: number, awayScore: number) => void;
    competition?: string;
    stage?: string;
}

export interface MatchStats {
    home: { shots: number, passes: number, possession: number };
    away: { shots: number, passes: number, possession: number };
}

// --- TUNED PHYSICS CONSTANTS ---
const HALF_DURATION_REAL_SEC = 15;
const PITCH_WIDTH = 100;
const PITCH_HEIGHT = 100;
const PLAYER_RADIUS = 1.5;
const BALL_RADIUS = 1.0;

const MAX_SPEED = 55.0;
const MAX_FORCE = 200.0;
const FRICTION = 0.94;
const BALL_FRICTION = 0.96;
const PASS_SPEED = 75.0;
const SHOOT_SPEED = 105.0;
const SEPARATION_DIST = 4.0;

const COLOR_PITCH = '#15803d';
const COLOR_LINE = 'rgba(255,255,255,0.4)';
const COLOR_BALL = '#ffffff';

class Vector {
    constructor(public x: number, public y: number) { }
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
    pos: Vector;
    vel: Vector;
    acc: Vector;
    constructor(x: number, y: number) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
    }
    applyForce(force: Vector) { this.acc.add(force); }
    updatePhysics(dt: number) {
        this.vel.add(this.acc.clone().mult(dt));
        this.pos.add(this.vel.clone().mult(dt));
        this.acc.mult(0);
    }
}

class Agent extends GameEntity {
    id: string; teamId: string; role: string; number: number; rating: number; basePos: Vector; isHome: boolean;
    constructor(p: Player, teamId: string, role: string, isHome: boolean, bx: number, by: number) {
        super(bx, by);
        this.id = p.id; this.number = p.number; this.rating = p.rating;
        this.teamId = teamId; this.role = role; this.isHome = isHome;
        this.basePos = new Vector(bx, by);
    }
    seek(target: Vector, speedMultiplier = 1.0): Vector {
        const desired = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        desired.normalize().mult(MAX_SPEED * speedMultiplier);
        return desired.sub(this.vel).limit(MAX_FORCE * speedMultiplier);
    }
    arrive(target: Vector, speedMultiplier = 1.0): Vector {
        const desired = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        const d = desired.mag();
        desired.normalize();
        if (d < 15) desired.mult(MAX_SPEED * speedMultiplier * (d / 15));
        else desired.mult(MAX_SPEED * speedMultiplier);
        return desired.sub(this.vel).limit(MAX_FORCE * speedMultiplier);
    }
    separate(agents: Agent[], speedMultiplier = 1.0): Vector {
        const steer = new Vector(0, 0);
        let count = 0;
        for (const other of agents) {
            const d = Vector.dist(this.pos, other.pos);
            if ((other !== this) && (d < SEPARATION_DIST) && (d > 0)) {
                const diff = new Vector(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
                diff.normalize().div(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
            steer.normalize().mult(MAX_SPEED * speedMultiplier);
            steer.sub(this.vel).limit(MAX_FORCE * 3.0 * speedMultiplier);
        }
        return steer;
    }
}

type MatchState = 'KICKOFF' | 'PLAYING' | 'GOAL' | 'THROW_IN' | 'GOAL_KICK' | 'GK_HOLD' | 'HALFTIME';

class GameEngine {
    minute = 0; period = 1; homeScore = 0; awayScore = 0; events: string[] = [];
    ball: GameEntity; ballOwner: Agent | null = null; players: Agent[] = [];
    public state: MatchState = 'KICKOFF';
    private cooldown = 0; private stateTimer = 0; private lastToucher: Agent | null = null;
    private restartSide: 'home' | 'away' = 'home';

    homeStats = { shots: 0, passes: 0, possessionFrames: 0 };
    awayStats = { shots: 0, passes: 0, possessionFrames: 0 };

    constructor(
        public homeTeam: Team, public awayTeam: Team,
        private onUpdate: (h: number, a: number, m: number, e: string[], stats: MatchStats) => void,
        private onHalftime: () => void
    ) {
        this.ball = new GameEntity(50, 50);
        this.initPlayers();
        this.setupKickoff(true);
    }

    private triggerUpdate() {
        const hF = this.homeStats.possessionFrames, aF = this.awayStats.possessionFrames;
        const total = hF + aF || 1;
        const currentStats: MatchStats = {
            home: { ...this.homeStats, possession: Math.round((hF / total) * 100) },
            away: { ...this.awayStats, possession: Math.round((aF / total) * 100) }
        };
        this.onUpdate(this.homeScore, this.awayScore, Math.floor(this.minute), this.events, currentStats);
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
        this.state = 'KICKOFF'; this.stateTimer = 1.0;
        this.ball.pos = new Vector(50, 50); this.ball.vel = new Vector(0, 0);
        this.ballOwner = null; this.lastToucher = null;

        this.players.forEach(p => {
            p.pos = this.period === 2 ? new Vector(100 - p.basePos.x, p.basePos.y) : p.basePos.clone();
            p.vel = new Vector(0, 0);
        });

        const startingTeam = homeStarts ? this.homeTeam.id : this.awayTeam.id;
        const striker = this.players.find(p => p.teamId === startingTeam && (p.role === 'FWD' || p.role === 'MID'));
        if (striker) { striker.pos = new Vector(50, 50.5); this.ballOwner = striker; }
        const partner = this.players.find(p => p.teamId === startingTeam && p !== striker && p.role !== 'GK');
        if (partner) partner.pos = new Vector((homeStarts && this.period === 1) || (!homeStarts && this.period === 2) ? 45 : 55, 50);
    }

    startSecondHalf() {
        this.period = 2; this.state = 'KICKOFF';
        this.events.unshift("--- Second Half Started ---");
        this.setupKickoff(false);
    }

    update(dt: number) {
        if (this.minute >= 90) return;

        if (this.state === 'PLAYING') {
            this.minute += dt * (45 / HALF_DURATION_REAL_SEC);
            if (this.ballOwner) {
                if (this.ballOwner.isHome) this.homeStats.possessionFrames++;
                else this.awayStats.possessionFrames++;
            }

            if (this.period === 1 && this.minute >= 45) {
                this.state = 'HALFTIME';
                this.events.unshift("--- Halftime ---");
                this.triggerUpdate();
                this.onHalftime();
                return;
            }
        }

        if (['GOAL', 'KICKOFF', 'GK_HOLD', 'THROW_IN', 'GOAL_KICK'].includes(this.state)) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0 && this.ballOwner) {
                if (['THROW_IN', 'GOAL_KICK', 'GK_HOLD'].includes(this.state)) {
                    const mate = this.findBestPassOption(this.ballOwner, true);
                    if (mate) this.pass(this.ballOwner, mate); else this.shoot(this.ballOwner);
                } else if (this.state === 'KICKOFF') {
                    const partner = this.players.find(p => p.teamId === this.ballOwner!.teamId && p !== this.ballOwner && Vector.dist(p.pos, this.ballOwner!.pos) < 20);
                    if (partner) this.pass(this.ballOwner, partner);
                }
                if (this.state !== 'GOAL') this.state = 'PLAYING';
            }
            this.physicsStep(dt * 0.5);
            return;
        }

        if (this.state === 'PLAYING') {
            this.aiStep(dt);
            this.physicsStep(dt);
            this.checkCollisions();
            this.checkBoundaries();
        }

        this.triggerUpdate();
    }

    aiStep(dt: number) {
        const ballPos = this.ball.pos;
        const fatigue = Math.max(0.65, 1.0 - (this.minute / 120.0));

        // Find closest players to prevent everyone from swarming the ball
        let closestHome: Agent | null = null, closestAway: Agent | null = null;
        let dHome = Infinity, dAway = Infinity;
        this.players.forEach(p => {
            const d = Vector.dist(p.pos, ballPos);
            if (p.isHome && d < dHome) { dHome = d; closestHome = p; }
            if (!p.isHome && d < dAway) { dAway = d; closestAway = p; }
        });

        this.players.forEach(p => {
            const force = new Vector(0, 0);
            const distToBall = Vector.dist(p.pos, ballPos);
            const homeAttacksRight = this.period === 1;
            const myGoalX = p.isHome ? (homeAttacksRight ? 2 : 98) : (homeAttacksRight ? 98 : 2);
            const opponentGoalX = p.isHome ? (homeAttacksRight ? 100 : 0) : (homeAttacksRight ? 0 : 100);

            if (p.role === 'GK') {
                const targetY = Math.max(35, Math.min(65, ballPos.y));
                let targetX = myGoalX;
                // GK comes off line if ball is very close
                if (distToBall < 25) targetX += p.isHome ? (homeAttacksRight ? 4 : -4) : (homeAttacksRight ? -4 : 4);
                force.add(p.arrive(new Vector(targetX, targetY), fatigue));
                p.applyForce(force);
                return;
            }

            let target = p.basePos.clone();
            if (this.period === 2) target.x = 100 - target.x;
            target.x += p.isHome ? (ballPos.x - 50) * 0.7 : (ballPos.x - 50) * 0.7;

            const hasBall = this.ballOwner?.teamId === p.teamId;
            const isClosestToBall = p === closestHome || p === closestAway;

            if (hasBall) {
                if (this.ballOwner === p) {
                    const goalPos = new Vector(opponentGoalX, 50);
                    force.add(p.seek(goalPos, fatigue).mult(1.2));
                    const distGoal = Vector.dist(p.pos, goalPos);

                    if (distGoal < 28 && this.cooldown <= 0) {
                        if (Math.random() < 3.0 * dt) this.shoot(p);
                    } else if (this.cooldown <= 0) {
                        if (Math.random() < 5.0 * dt) {
                            const mate = this.findBestPassOption(p);
                            if (mate) this.pass(p, mate);
                        }
                    }
                } else {
                    target.x += (p.isHome === homeAttacksRight ? 25 : -25); // Push up field
                    force.add(p.arrive(target, fatigue));
                }
            } else {
                if (isClosestToBall && !this.ballOwner) {
                    force.add(p.seek(ballPos, fatigue).mult(2.0)); // Aggressive intercept
                } else if (distToBall < 15 && isClosestToBall) {
                    force.add(p.seek(ballPos, fatigue).mult(1.5)); // Apply pressure to handler
                } else {
                    const defensiveShift = new Vector(ballPos.x - p.pos.x, ballPos.y - p.pos.y).mult(0.2);
                    target.add(defensiveShift);
                    force.add(p.arrive(target, fatigue));
                }
            }
            force.add(p.separate(this.players, fatigue).mult(3.0));
            p.applyForce(force);
        });

        if (this.cooldown > 0) this.cooldown -= dt;
    }

    findBestPassOption(owner: Agent, forcePass = false): Agent | null {
        const mates = this.players.filter(p => p.teamId === owner.teamId && p !== owner && p !== this.lastToucher);
        let bestMate = null, bestScore = -Infinity;
        const attacksRight = (owner.isHome && this.period === 1) || (!owner.isHome && this.period !== 1);

        mates.forEach(m => {
            const dist = Vector.dist(owner.pos, m.pos);
            if (!forcePass && (dist > 60 || dist < 8)) return;
            const forwardness = attacksRight ? (m.pos.x - owner.pos.x) : (owner.pos.x - m.pos.x);
            let score = forwardness * 2.0;

            let isBlocked = false;
            if (!forcePass) {
                const lineVec = new Vector(m.pos.x - owner.pos.x, m.pos.y - owner.pos.y).normalize();
                for (const enemy of this.players) {
                    if (enemy.teamId === owner.teamId) continue;
                    const toEnemy = new Vector(enemy.pos.x - owner.pos.x, enemy.pos.y - owner.pos.y);
                    const dot = (toEnemy.x * lineVec.x) + (toEnemy.y * lineVec.y);
                    if (dot > 0 && dot < dist) {
                        const distToLine = Math.sqrt((enemy.pos.x - (owner.pos.x + lineVec.x * dot)) ** 2 + (enemy.pos.y - (owner.pos.y + lineVec.y * dot)) ** 2);
                        if (distToLine < 3.0) { isBlocked = true; break; }
                    }
                }
            }
            if (isBlocked) score -= 50;
            score += Math.random() * 20;
            if (score > bestScore) { bestScore = score; bestMate = m; }
        });

        if (forcePass && !bestMate) return mates.sort((a, b) => Vector.dist(owner.pos, a.pos) - Vector.dist(owner.pos, b.pos))[0] || null;
        return bestMate || mates.find(p => Vector.dist(owner.pos, p.pos) < 25) || null;
    }

    physicsStep(dt: number) {
        this.players.forEach(p => {
            p.updatePhysics(dt); p.vel.mult(FRICTION);
            p.pos.x = Math.max(0, Math.min(100, p.pos.x));
            p.pos.y = Math.max(0, Math.min(100, p.pos.y));
        });

        if (this.ballOwner) {
            const dribbleOffset = this.ballOwner.vel.clone().normalize().mult(3.0);
            const targetPos = this.ballOwner.pos.clone().add(dribbleOffset);
            this.ball.pos.x += (targetPos.x - this.ball.pos.x) * 0.15;
            this.ball.pos.y += (targetPos.y - this.ball.pos.y) * 0.15;
            this.ball.vel = this.ballOwner.vel.clone();
        } else {
            this.ball.updatePhysics(dt);
            this.ball.vel.mult(BALL_FRICTION);
        }
    }

    pass(from: Agent, to: Agent) {
        this.ballOwner = null; this.lastToucher = from;
        if (from.isHome) this.homeStats.passes++; else this.awayStats.passes++;
        const dir = new Vector(to.pos.x - from.pos.x, to.pos.y - from.pos.y).normalize();
        const error = (100 - from.rating) * 0.001;
        dir.x += (Math.random() - 0.5) * error; dir.y += (Math.random() - 0.5) * error;
        this.ball.vel = dir.mult(PASS_SPEED);
        this.cooldown = 0.2;
    }

    shoot(from: Agent) {
        this.ballOwner = null; this.lastToucher = from;
        if (from.isHome) this.homeStats.shots++; else this.awayStats.shots++;
        const opponentGoalX = from.isHome ? (this.period === 1 ? 100 : 0) : (this.period === 1 ? 0 : 100);
        const dir = new Vector(opponentGoalX - from.pos.x, 50 - from.pos.y).normalize();
        dir.x += (Math.random() - 0.5) * 0.1; dir.y += (Math.random() - 0.5) * 0.1;
        this.ball.vel = dir.mult(SHOOT_SPEED);
        this.cooldown = 0.5;
    }

    checkCollisions() {
        if (this.ballOwner) {
            this.players.forEach(p => {
                if (p.teamId !== this.ballOwner!.teamId && Vector.dist(p.pos, this.ballOwner!.pos) < 2.0 && this.cooldown <= 0) {
                    if (Math.random() * p.rating > Math.random() * this.ballOwner!.rating) {
                        this.ballOwner = p; this.lastToucher = p; this.cooldown = 0.5;
                        if (p.role === 'GK') { this.state = 'GK_HOLD'; this.stateTimer = 1.0; this.events.unshift(`${Math.floor(this.minute)}' Save by GK!`); }
                    }
                }
            });
        } else {
            let closest: Agent | null = null, minDist = 3.5;
            this.players.forEach(p => {
                const d = Vector.dist(p.pos, this.ball.pos);
                if (d < minDist) { if (this.lastToucher === p && this.cooldown > 0) return; minDist = d; closest = p; }
            });
            if (closest) {
                const ballSpeed = this.ball.vel.mag();
                if (closest.role === 'GK' && ballSpeed > 80 && Math.random() > 0.4) return; // GK miss fast shot
                if (Math.random() * 100 + closest.rating > ballSpeed * 0.3) {
                    this.ballOwner = closest;
                    if (closest.role === 'GK') { this.state = 'GK_HOLD'; this.stateTimer = 1.0; this.events.unshift(`${Math.floor(this.minute)}' Save by GK!`); }
                } else {
                    this.ball.vel.mult(-0.4); this.lastToucher = closest; this.cooldown = 0.2;
                }
            }
        }
    }

    checkBoundaries() {
        const { x, y } = this.ball.pos;
        if (y > 44 && y < 56) {
            if (x < 0.5) this.scoreGoal(this.period === 1 ? false : true);
            if (x > 99.5) this.scoreGoal(this.period === 1 ? true : false);
            return;
        }
        if (y < 0 || y > 100) {
            this.restartSide = (this.lastToucher ? this.lastToucher.teamId : this.homeTeam.id) === this.homeTeam.id ? 'away' : 'home';
            this.state = 'THROW_IN'; this.stateTimer = 1.0;
            this.ball.pos.y = y < 0 ? 0.5 : 99.5; this.ball.vel = new Vector(0, 0); this.ballOwner = null;
            this.events.unshift(`${Math.floor(this.minute)}' Throw-in`); this.setupThrowIn();
            return;
        }
        if (x < 0 || x > 100) {
            const isHomeGoalLine = this.period === 1 ? x < 50 : x > 50;
            const lastTeamId = this.lastToucher ? this.lastToucher.teamId : this.homeTeam.id;
            const touchedByAttacker = (isHomeGoalLine && lastTeamId !== this.homeTeam.id) || (!isHomeGoalLine && lastTeamId === this.homeTeam.id);
            this.state = 'GOAL_KICK'; this.stateTimer = 1.5;
            this.restartSide = isHomeGoalLine ? 'home' : 'away';
            this.events.unshift(`${Math.floor(this.minute)}' Goal Kick${touchedByAttacker ? '' : ' (Corner)'}`);
            this.setupGoalKick();
        }
    }

    scoreGoal(isHome: boolean) {
        this.state = 'GOAL'; this.stateTimer = 1.0;
        if (isHome) { this.homeScore++; this.events.unshift(`${Math.floor(this.minute)}' GOAL! ${this.homeTeam.shortName}`); }
        else { this.awayScore++; this.events.unshift(`${Math.floor(this.minute)}' GOAL! ${this.awayTeam.shortName}`); }
        this.triggerUpdate();
    }

    skipToEnd() {
        const remainingMinutes = 90 - this.minute;
        if (remainingMinutes <= 0) return;

        // FIX: Calculate safe strength manually to ensure valid math
        const getStr = (t: Team) => t.roster && t.roster.length ? t.roster.reduce((sum, p) => sum + p.rating, 0) / t.roster.length : 80;
        const homeStr = getStr(this.homeTeam) + 5;
        const awayStr = getStr(this.awayTeam);

        const diff = homeStr - awayStr;
        const baseProb = 0.015;
        const homeProb = baseProb + (diff * 0.0006);
        const awayProb = baseProb - (diff * 0.0006);

        for (let m = 0; m < remainingMinutes; m++) {
            if (Math.random() < homeProb) {
                this.homeScore++; this.homeStats.shots++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! ${this.homeTeam.shortName} (Sim)`);
            }
            if (Math.random() < awayProb) {
                this.awayScore++; this.awayStats.shots++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! ${this.awayTeam.shortName} (Sim)`);
            }
        }
        this.minute = 90;
        this.triggerUpdate();
    }

    setupThrowIn() {
        const teamId = this.restartSide === 'home' ? this.homeTeam.id : this.awayTeam.id;
        const nearest = this.players.filter(p => p.teamId === teamId && p.role !== 'GK').sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
        if (nearest) { nearest.pos = this.ball.pos.clone(); nearest.pos.y = nearest.pos.y < 50 ? 1 : 99; this.ballOwner = nearest; this.ball.vel = new Vector(0, 0); }
    }
    setupGoalKick() {
        const isHomeKick = this.restartSide === 'home';
        const gk = this.players.find(p => p.isHome === isHomeKick && p.role === 'GK');
        this.players.forEach(p => { p.pos = this.period === 2 ? new Vector(100 - p.basePos.x, p.basePos.y) : p.basePos.clone(); p.vel = new Vector(0, 0); });
        if (gk) {
            const isLeftEnd = (this.period === 1 && isHomeKick) || (this.period === 2 && !isHomeKick);
            this.ball.pos = new Vector(isLeftEnd ? 5 : 95, 50); this.ball.vel = new Vector(0, 0);
            gk.pos = new Vector(isLeftEnd ? 4 : 96, 50); this.ballOwner = gk;
        }
    }
}

// --- REACT COMPONENT ---

const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, userTeamId, onMatchComplete, competition = 'La Liga', stage = 'Regular Season' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const requestRef = useRef<number>(0);
    const prevTimeRef = useRef<number>(0);
    const isFinishedRef = useRef(false);

    const isPausedRef = useRef(false);
    const [isPausedState, setIsPausedState] = useState(false);
    const [isHalftime, setIsHalftime] = useState(false);

    const [score, setScore] = useState({ home: 0, away: 0 });
    const [minute, setMinute] = useState(0);
    const [events, setEvents] = useState<string[]>([]);
    const [stats, setStats] = useState<MatchStats>({
        home: { shots: 0, passes: 0, possession: 50 },
        away: { shots: 0, passes: 0, possession: 50 }
    });

    useEffect(() => {
        engineRef.current = new GameEngine(
            homeTeam, awayTeam,
            (h, a, m, e, s) => {
                setScore({ home: h, away: a });
                setMinute(m);
                setEvents([...e]);
                setStats(s);
            },
            () => { setIsHalftime(true); setIsPausedState(true); }
        );

        const loop = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const dt = Math.min((time - prevTimeRef.current) / 1000, 0.1);
            prevTimeRef.current = time;

            if (engineRef.current && !isPausedRef.current && !isHalftime && !isFinishedRef.current) {
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
    }, [isHalftime]);

    const startSecondHalf = () => {
        if (engineRef.current) {
            engineRef.current.startSecondHalf();
            setIsHalftime(false); setIsPausedState(false);
        }
    };

    const draw = (game: GameEngine) => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        const w = cvs.width, h = cvs.height, scaleX = w / PITCH_WIDTH, scaleY = h / PITCH_HEIGHT;

        // Field Grass
        ctx.fillStyle = COLOR_PITCH; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for (let i = 0; i < PITCH_WIDTH; i += 10) ctx.fillRect(i * scaleX, 0, 5 * scaleX, h);

        // Lines & Markings
        ctx.strokeStyle = COLOR_LINE; ctx.lineWidth = 2;
        ctx.strokeRect(5 * scaleX, 0, (PITCH_WIDTH - 10) * scaleX, h); // Outline
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); // Halfway line
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 9 * scaleX, 0, Math.PI * 2); ctx.stroke(); // Center Circle

        // Boxes
        ctx.strokeRect(5 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY); // Home Penalty
        ctx.strokeRect(80 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY); // Away Penalty
        ctx.strokeRect(5 * scaleX, 35 * scaleY, 5 * scaleX, 30 * scaleY); // Home 6-yard
        ctx.strokeRect(90 * scaleX, 35 * scaleY, 5 * scaleX, 30 * scaleY); // Away 6-yard

        // Spots
        ctx.fillStyle = COLOR_LINE;
        ctx.beginPath(); ctx.arc(16 * scaleX, 50 * scaleY, 0.5 * scaleX, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(84 * scaleX, 50 * scaleY, 0.5 * scaleX, 0, Math.PI * 2); ctx.fill();

        // Goals
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(3 * scaleX, (PITCH_HEIGHT / 2 - 8) * scaleY, 2 * scaleX, 16 * scaleY);
        ctx.fillRect(95 * scaleX, (PITCH_HEIGHT / 2 - 8) * scaleY, 2 * scaleX, 16 * scaleY);

        // Entities
        game.players.forEach(p => {
            const x = p.pos.x * scaleX, y = p.pos.y * scaleY;
            const color = p.isHome ? homeTeam.primaryColor : (awayTeam.secondaryColor === '#ffffff' ? awayTeam.primaryColor : awayTeam.secondaryColor);
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 3, PLAYER_RADIUS * scaleX, PLAYER_RADIUS * 0.5 * scaleX, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, PLAYER_RADIUS * scaleX, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.number.toString(), x, y);
        });

        const bx = game.ball.pos.x * scaleX, by = game.ball.pos.y * scaleY;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(bx, by + 2, BALL_RADIUS * scaleX, BALL_RADIUS * 0.6 * scaleX, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLOR_BALL; ctx.beginPath(); ctx.arc(bx, by, BALL_RADIUS * scaleX, 0, Math.PI * 2); ctx.fill();
    };

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPausedState(isPausedRef.current);
    };

    const handleSkip = () => {
        if (engineRef.current && !isFinishedRef.current) {
            isFinishedRef.current = true; // Lock further updates
            engineRef.current.skipToEnd();
            setIsPausedState(true); // Visually pause interface
            onMatchComplete(engineRef.current.homeScore, engineRef.current.awayScore);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
            {/* Scoreboard Header */}
            <div className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-xl z-10 shrink-0">
                <div className="flex items-center gap-6 w-1/3">
                    <div className="w-14 h-14 flex items-center justify-center bg-slate-700 rounded-full shadow-inner p-1">
                        {homeTeam.logoUrl ? <img src={homeTeam.logoUrl} className="w-full h-full object-contain drop-shadow-md" /> : <div className="font-bold text-xl">{homeTeam.shortName[0]}</div>}
                    </div>
                    <div>
                        <div className="text-3xl font-black tracking-tight leading-none">{homeTeam.shortName}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Home</div>
                    </div>
                    <div className="text-5xl font-mono font-bold text-white bg-slate-900 px-4 py-1 rounded-lg border border-slate-700 shadow-inner ml-auto">{score.home}</div>
                </div>

                <div className="flex flex-col items-center justify-center w-1/3 px-4">
                    <div className="bg-slate-900 px-6 py-2 rounded-full border border-slate-700 flex items-center gap-3 mb-2 shadow-lg">
                        {competition === 'Champions League' && <img src={UCL_LOGO_URL} className="h-5 w-5 object-contain" />}
                        {competition === 'La Liga' && <img src={LIGA_LOGO_URL} className="h-5 w-5 object-contain" />}
                        <span className="font-mono font-bold text-xl text-blue-100">{minute >= 90 ? 'FT' : `${Math.floor(minute)}'`}</span>
                    </div>
                    <div className="w-full max-w-[200px] h-2 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-1000 ease-linear" style={{ width: `${(minute / 90) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-1/3 justify-end">
                    <div className="text-5xl font-mono font-bold text-white bg-slate-900 px-4 py-1 rounded-lg border border-slate-700 shadow-inner mr-auto">{score.away}</div>
                    <div className="text-right">
                        <div className="text-3xl font-black tracking-tight leading-none">{awayTeam.shortName}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Away</div>
                    </div>
                    <div className="w-14 h-14 flex items-center justify-center bg-slate-700 rounded-full shadow-inner p-1">
                        {awayTeam.logoUrl ? <img src={awayTeam.logoUrl} className="w-full h-full object-contain drop-shadow-md" /> : <div className="font-bold text-xl">{awayTeam.shortName[0]}</div>}
                    </div>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center relative">
                    <canvas ref={canvasRef} width={1000} height={600} className="max-w-full max-h-full aspect-[5/3] bg-emerald-800 rounded-xl shadow-2xl border-4 border-slate-800" />

                    {isHalftime && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in">
                            <div className="text-4xl font-black text-white mb-2">HALFTIME</div>
                            <div className="text-xl text-slate-300 mb-6">{score.home} - {score.away}</div>
                            <button onClick={startSecondHalf} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95">
                                <RotateCcw size={20} /> Start Second Half
                            </button>
                        </div>
                    )}

                    {!isHalftime && !isFinishedRef.current && (
                        <div className="absolute bottom-8 flex gap-4 bg-slate-900/90 p-2 rounded-2xl border border-slate-700 backdrop-blur-md shadow-2xl">
                            <button onClick={togglePause} className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg">
                                {isPausedState ? <Play fill="currentColor" size={28} /> : <Pause fill="currentColor" size={28} />}
                            </button>
                            <button onClick={handleSkip} className="px-6 h-14 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all hover:scale-105 active:scale-95 border border-slate-600">
                                <FastForward fill="currentColor" size={24} /> Skip to Result
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">

                    {/* Live Match Stats Dashboard */}
                    <div className="border-b border-slate-800 bg-slate-800/30 flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-800/50 flex items-center gap-2 font-bold text-slate-200">
                            <PieChart size={18} className="text-blue-400" /> Live Stats
                        </div>
                        <div className="p-4 space-y-3">
                            {/* Possession */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    <span className="text-blue-300">{stats.home.possession}%</span><span>Possession</span><span className="text-red-300">{stats.away.possession}%</span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                                    <div className="bg-blue-500 transition-all duration-300" style={{ width: `${stats.home.possession}%` }}></div>
                                    <div className="bg-red-500 transition-all duration-300" style={{ width: `${stats.away.possession}%` }}></div>
                                </div>
                            </div>
                            {/* Shots & Passes */}
                            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-700/50">
                                <span className="font-bold text-blue-400 w-8 text-center">{stats.home.shots}</span>
                                <span className="text-slate-400 text-xs uppercase tracking-wider flex-1 text-center">Shots</span>
                                <span className="font-bold text-red-400 w-8 text-center">{stats.away.shots}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1">
                                <span className="font-bold text-blue-400 w-8 text-center">{stats.home.passes}</span>
                                <span className="text-slate-400 text-xs uppercase tracking-wider flex-1 text-center">Passes</span>
                                <span className="font-bold text-red-400 w-8 text-center">{stats.away.passes}</span>
                            </div>
                        </div>
                    </div>

                    {/* Match Feed */}
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between shrink-0">
                        <div className="font-bold flex items-center gap-2 text-slate-200"><Activity size={18} className="text-emerald-400" /> Match Feed</div>
                        {!isFinishedRef.current && <div className="text-[10px] font-bold px-2 py-0.5 bg-green-500/20 text-green-400 rounded uppercase tracking-wider animate-pulse">Live</div>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {events.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-600 italic space-y-2">
                                <div className="w-2 h-2 bg-slate-600 rounded-full animate-ping"></div>
                                <span>Waiting for kickoff...</span>
                            </div>
                        )}
                        {events.map((ev, i) => (
                            <div key={i} className="flex gap-4 items-start animate-in slide-in-from-right-4 fade-in duration-500">
                                <div className="flex flex-col items-center">
                                    <div className="text-slate-500 font-mono text-xs font-bold pt-1">{ev.split(' ')[0]}</div>
                                    <div className="h-full w-px bg-slate-800 my-1"></div>
                                </div>
                                <div className={`p-3 rounded-lg text-sm w-full shadow-sm border ${ev.includes('GOAL') ? 'bg-yellow-900/20 border-yellow-700/50' : 'bg-slate-800 border-slate-700'}`}>
                                    <div className={`${ev.includes('GOAL') ? 'text-yellow-400 font-bold text-lg' : 'text-slate-200'}`}>
                                        {ev.includes('GOAL') ? 'GOAL!' : ev.includes('Goal Kick') ? 'Goal Kick' : ev.includes('Throw-in') ? 'Throw-in' : ev.includes('Save') ? 'Great Save' : 'Event'}
                                    </div>
                                    <div className="text-slate-400 text-xs mt-1">
                                        {ev.substring(ev.indexOf(' ') + 1).replace('GOAL! ', '').replace('Goal Kick ', '').replace('Throw-in ', '').replace('Save ', '')}
                                    </div>
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