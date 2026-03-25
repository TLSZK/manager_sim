import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Team, Player } from '../types';
import { FORMATIONS, getPenalizedRating } from '../constants';
import { FastForward, Play, Pause, RotateCcw, PieChart, Sliders } from 'lucide-react';

interface MatchViewProps {
    homeTeam: Team;
    awayTeam: Team;
    userTeamId: string;
    onMatchComplete: (homeScore: number, awayScore: number) => void;
    competition?: string;
    stage?: string;
}

export interface MatchStats {
    home: { shots: number; shotsOnTarget: number; possession: number };
    away: { shots: number; shotsOnTarget: number; possession: number };
}

const HALF_DURATION_REAL_SEC = 30.0;
// Speed constants calibrated for 30 s/half (90× time compression).
// Real sprint: 10 m/s ≈ 8.57 coord-units/s. ×90 compression ÷ 12 watchability = ~64 units/s.
const MAX_SPEED = 65.0;
const MAX_FORCE = 280.0;
const FRICTION = 0.90;
const BALL_FRICTION = 0.982;
// Pass speed: real kick ≈ 25–30 m/s ≈ 21.4 coord-units/s × 90 ÷ 12 ≈ 160
const PASS_SPEED = 160.0;
const SHOOT_SPEED = 190.0;

// ── Position-specific rating components ─────────────────────────────────────
// Derives realistic sub-skills from overall rating and position
const getSkillComponents = (rating: number, position: string) => {
    const r = rating / 100;

    // Position modifiers: how much above/below the base rating each attribute is
    const modifiers: Record<string, { pace: number; shooting: number; passing: number; dribbling: number; defending: number; gk: number; positioning: number }> = {
        GK: { pace: -20, shooting: -40, passing: 0, dribbling: -25, defending: 5, gk: +25, positioning: 5 },
        CB: { pace: -8, shooting: -18, passing: -2, dribbling: -12, defending: +18, gk: -25, positioning: +5 },
        LB: { pace: +5, shooting: -12, passing: +5, dribbling: +3, defending: +10, gk: -25, positioning: +3 },
        RB: { pace: +5, shooting: -12, passing: +5, dribbling: +3, defending: +10, gk: -25, positioning: +3 },
        LWB: { pace: +10, shooting: -8, passing: +5, dribbling: +8, defending: +5, gk: -25, positioning: +3 },
        RWB: { pace: +10, shooting: -8, passing: +5, dribbling: +8, defending: +5, gk: -25, positioning: +3 },
        CDM: { pace: -5, shooting: -5, passing: +8, dribbling: +2, defending: +12, gk: -25, positioning: +5 },
        CM: { pace: 0, shooting: +2, passing: +12, dribbling: +5, defending: +2, gk: -25, positioning: +5 },
        CAM: { pace: +5, shooting: +10, passing: +12, dribbling: +12, defending: -10, gk: -25, positioning: +8 },
        LM: { pace: +12, shooting: +2, passing: +8, dribbling: +10, defending: -5, gk: -25, positioning: +5 },
        RM: { pace: +12, shooting: +2, passing: +8, dribbling: +10, defending: -5, gk: -25, positioning: +5 },
        LW: { pace: +15, shooting: +8, passing: +5, dribbling: +15, defending: -15, gk: -25, positioning: +8 },
        RW: { pace: +15, shooting: +8, passing: +5, dribbling: +15, defending: -15, gk: -25, positioning: +8 },
        ST: { pace: +10, shooting: +20, passing: 0, dribbling: +10, defending: -20, gk: -25, positioning: +12 },
        CF: { pace: +8, shooting: +15, passing: +5, dribbling: +12, defending: -15, gk: -25, positioning: +10 },
    };

    const mod = modifiers[position] ?? { pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, gk: -25, positioning: 0 };
    const clamp = (v: number) => Math.max(1, Math.min(99, v));

    return {
        pace: clamp(rating + mod.pace),
        shooting: clamp(rating + mod.shooting),
        passing: clamp(rating + mod.passing),
        dribbling: clamp(rating + mod.dribbling),
        defending: clamp(rating + mod.defending),
        gk: clamp(rating + mod.gk),
        positioning: clamp(rating + mod.positioning),
        // Raw normalised [0..1] for convenience
        paceN: clamp(rating + mod.pace) / 100,
        shootingN: clamp(rating + mod.shooting) / 100,
        passingN: clamp(rating + mod.passing) / 100,
        dribblingN: clamp(rating + mod.dribbling) / 100,
        defendingN: clamp(rating + mod.defending) / 100,
        gkN: clamp(rating + mod.gk) / 100,
        positioningN: clamp(rating + mod.positioning) / 100,
    };
};

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
    id: string;
    name: string;
    teamId: string;
    role: string;
    number: number;
    rating: number;
    basePos: Vector;
    isHome: boolean;
    currentMaxSpeed: number = MAX_SPEED;
    skills: ReturnType<typeof getSkillComponents>;
    // Stamina: starts at 1.0, degrades towards 0.6 by minute 90
    stamina: number = 1.0;
    // Off-ball run state
    runTarget: Vector | null = null;
    runTimer: number = 0;

    constructor(p: Player, teamId: string, role: string, isHome: boolean, bx: number, by: number, effectiveRating: number) {
        super(bx, by);
        this.id = p.id;
        this.name = p.name;
        this.number = p.number;
        this.rating = effectiveRating;
        this.teamId = teamId;
        this.role = role;
        this.isHome = isHome;
        this.basePos = new Vector(bx, by);
        this.skills = getSkillComponents(effectiveRating, role);
    }

    arrive(target: Vector, speedMult = 1.0): Vector {
        const desired = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        const d = desired.mag();
        desired.normalize();

        // Pace determines top speed; stamina reduces it as the match progresses
        const paceFactor = 0.5 + this.skills.paceN * 0.7;
        const staminaPenalty = this.stamina; // 0.6–1.0
        const finalMaxSpeed = MAX_SPEED * speedMult * paceFactor * staminaPenalty;
        const finalMaxForce = MAX_FORCE * speedMult * paceFactor * staminaPenalty;
        this.currentMaxSpeed = finalMaxSpeed;

        desired.mult(d < 15 ? finalMaxSpeed * (d / 15) : finalMaxSpeed);
        return desired.sub(this.vel).limit(finalMaxForce);
    }

    updatePhysics(dt: number) {
        this.vel.add(this.acc.clone().mult(dt));
        if (this.vel.mag() > this.currentMaxSpeed) {
            this.vel.normalize().mult(this.currentMaxSpeed);
        }
        this.pos.add(this.vel.clone().mult(dt));
        this.acc.mult(0);
        // Degrade stamina: over 90 mins (real ~60s) drop from 1.0 to ~0.6
        this.stamina = Math.max(0.60, this.stamina - dt * 0.0072);
    }
}

// ── Penalty shootout helper ───────────────────────────────────────────────
const getPenaltyResult = (): { home: number; away: number } => {
    const scores = [[5, 4], [5, 3], [4, 3], [4, 2], [3, 1], [3, 2], [6, 5]];
    const s = scores[Math.floor(Math.random() * scores.length)];
    return Math.random() > 0.5 ? { home: s[0], away: s[1] } : { home: s[1], away: s[0] };
};

class GameEngine {
    minute = 0;
    period = 1;
    homeScore = 0;
    awayScore = 0;
    events: string[] = [];
    ball: GameEntity;
    ballOwner: Agent | null = null;
    passTarget: Agent | null = null;
    isShot = false;
    isLoftedPass = false;
    isSetPiece = false;
    isThrowInOrGoalKick = false;
    offsidePlayersOnPass: Set<string> = new Set();
    players: Agent[] = [];
    state: 'PLAYING' | 'HALFTIME' | 'STOPPED' = 'PLAYING';

    private cooldown = 0;
    private stateTimer = 0;
    private gkHoldTime = 0;
    private lastToucher: Agent | null = null;
    // Momentum: shifts between -1 (away dominating) and +1 (home dominating)
    private momentum = 0;

    homeStats = { shots: 0, shotsOnTarget: 0, possessionTime: 0 };
    awayStats = { shots: 0, shotsOnTarget: 0, possessionTime: 0 };

    constructor(
        public homeTeam: Team,
        public awayTeam: Team,
        private onUpdate: (h: number, a: number, m: number, e: string[], stats: MatchStats) => void,
        private onHalftime: () => void,
    ) {
        this.ball = new GameEntity(50, 50);
        this.initPlayers();
        this.setupKickoff(true);
    }

    private triggerUpdate() {
        const total = (this.homeStats.possessionTime + this.awayStats.possessionTime) || 1;
        this.onUpdate(this.homeScore, this.awayScore, Math.floor(this.minute), this.events, {
            home: {
                shots: this.homeStats.shots,
                shotsOnTarget: this.homeStats.shotsOnTarget,
                possession: Math.round((this.homeStats.possessionTime / total) * 100),
            },
            away: {
                shots: this.awayStats.shots,
                shotsOnTarget: this.awayStats.shotsOnTarget,
                possession: Math.round((this.awayStats.possessionTime / total) * 100),
            },
        });
    }

    initPlayers() {
        const createAgents = (team: Team, isHome: boolean) => {
            const formation = FORMATIONS[team.formation || '4-3-3'];
            const onField = [...(team.roster ?? [])].filter(p => !p.offField);
            const usedSlots = new Set<number>();
            return onField.map(p => {
                let slotIndex = formation.findIndex((f, idx) => f.position === p.position && !usedSlots.has(idx));
                if (slotIndex === -1) slotIndex = formation.findIndex((_, idx) => !usedSlots.has(idx));
                if (slotIndex === -1) slotIndex = 0;
                usedSlots.add(slotIndex);
                const pos = formation[slotIndex];
                const effectiveRating = getPenalizedRating(p.rating, p.position, pos.position);
                const yPos = isHome ? pos.y : 100 - pos.y;
                return new Agent(p, team.id, pos.position, isHome, isHome ? pos.x : 100 - pos.x, yPos, effectiveRating);
            });
        };
        this.players = [...createAgents(this.homeTeam, true), ...createAgents(this.awayTeam, false)];
    }

    applyTacticalChange(newTeam: Team, isHome: boolean) {
        if (isHome) this.homeTeam = newTeam; else this.awayTeam = newTeam;
        const formation = FORMATIONS[newTeam.formation || '4-3-3'];
        const onField = [...(newTeam.roster ?? [])].filter(p => !p.offField);
        const usedSlots = new Set<number>();
        const newAgents = onField.map(p => {
            let slotIndex = formation.findIndex((f, idx) => f.position === p.position && !usedSlots.has(idx));
            if (slotIndex === -1) slotIndex = formation.findIndex((_, idx) => !usedSlots.has(idx));
            if (slotIndex === -1) slotIndex = 0;
            usedSlots.add(slotIndex);
            const pos = formation[slotIndex];
            const effectiveRating = getPenalizedRating(p.rating, p.position, pos.position);
            const bx = isHome ? pos.x : 100 - pos.x;
            const by = isHome ? pos.y : 100 - pos.y;
            const existing = this.players.find(old => old.id === p.id && old.teamId === newTeam.id);
            if (existing) {
                existing.role = pos.position;
                existing.rating = effectiveRating;
                existing.skills = getSkillComponents(effectiveRating, pos.position);
                existing.basePos = new Vector(bx, by);
                return existing;
            }
            const agent = new Agent(p, newTeam.id, pos.position, isHome, bx, by, effectiveRating);
            const spawnX = this.period === 2 ? 100 - bx : bx;
            const spawnY = this.period === 2 ? 100 - by : by;
            agent.pos = new Vector(spawnX, spawnY);
            return agent;
        });
        if (this.ballOwner?.teamId === newTeam.id && !newAgents.includes(this.ballOwner)) this.ballOwner = null;
        if (this.lastToucher?.teamId === newTeam.id && !newAgents.includes(this.lastToucher)) this.lastToucher = null;
        this.players = this.players.filter(p => p.teamId !== newTeam.id).concat(newAgents);
        this.events.unshift(`${Math.floor(this.minute)}' Tactical change – ${newTeam.shortName}`);
    }

    setupKickoff(homeStarts: boolean) {
        this.state = 'STOPPED';
        this.stateTimer = 1.0;
        this.ball.pos = new Vector(50, 50);
        this.ball.vel = new Vector(0, 0);
        this.ballOwner = null;
        this.lastToucher = null;
        this.passTarget = null;
        this.isShot = false;
        this.isLoftedPass = false;
        this.isSetPiece = false;
        this.isThrowInOrGoalKick = false;
        this.offsidePlayersOnPass.clear();
        const homeAttacksRight = this.period === 1;
        this.players.forEach(p => {
            let startPos = p.basePos.clone();
            if (this.period === 2) { startPos.x = 100 - startPos.x; startPos.y = 100 - startPos.y; }
            if (p.isHome) {
                startPos.x = homeAttacksRight ? (startPos.x * 0.35 + 14) : 100 - ((100 - startPos.x) * 0.35 + 14);
            } else {
                startPos.x = homeAttacksRight ? 100 - ((100 - startPos.x) * 0.35 + 14) : (startPos.x * 0.35 + 14);
            }
            p.pos = startPos;
            p.vel = new Vector(0, 0);
        });
        const attackingTeamId = homeStarts ? this.homeTeam.id : this.awayTeam.id;
        const teamPlayers = this.players.filter(p => p.teamId === attackingTeamId && p.role !== 'GK');
        const striker = teamPlayers.sort((a, b) => {
            const ax = a.isHome ? a.basePos.x : 100 - a.basePos.x;
            const bx = b.isHome ? b.basePos.x : 100 - b.basePos.x;
            return bx - ax;
        })[0];
        if (striker) { striker.pos = new Vector(50, 50); this.ballOwner = striker; }
    }

    startSecondHalf() {
        this.period = 2;
        this.events.unshift("45' Second Half Started");
        this.setupKickoff(false);
    }

    // ── Pitch geometry helpers ───────────────────────────────────────────
    private isPassLaneOpen(from: Vector, to: Vector, teamId: string): boolean {
        const THRESHOLD = 4.5;
        const ABx = to.x - from.x, ABy = to.y - from.y;
        const lenSq = ABx * ABx + ABy * ABy;
        if (lenSq === 0) return false;
        for (const p of this.players) {
            if (p.teamId === teamId) continue;
            const APx = p.pos.x - from.x, APy = p.pos.y - from.y;
            let t = (APx * ABx + APy * ABy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const Cx = from.x + t * ABx, Cy = from.y + t * ABy;
            if ((p.pos.x - Cx) ** 2 + (p.pos.y - Cy) ** 2 < THRESHOLD * THRESHOLD) return false;
        }
        return true;
    }

    private isShootingLaneOpen(from: Vector, to: Vector, teamId: string): boolean {
        const THRESHOLD = 3.0;
        const ABx = to.x - from.x, ABy = to.y - from.y;
        const lenSq = ABx * ABx + ABy * ABy;
        if (lenSq === 0) return false;
        for (const p of this.players) {
            if (p.teamId === teamId || p.role === 'GK') continue;
            const APx = p.pos.x - from.x, APy = p.pos.y - from.y;
            let t = (APx * ABx + APy * ABy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const Cx = from.x + t * ABx, Cy = from.y + t * ABy;
            if ((p.pos.x - Cx) ** 2 + (p.pos.y - Cy) ** 2 < THRESHOLD * THRESHOLD) return false;
        }
        return true;
    }

    private getOffsideLine(attackingTeamId: string, attackingRight: boolean): number {
        // The offside line is the position of the second-to-last opponent —
        // i.e. the last OUTFIELD defender (the GK being the last one).
        // "Second-to-last from their own goal" means:
        //   attacking right → own goal is high-x → sort DESCENDING, take [1]
        //   attacking left  → own goal is low-x  → sort ASCENDING,  take [1]
        const defenders = this.players.filter(p => p.teamId !== attackingTeamId);
        if (attackingRight) {
            defenders.sort((a, b) => b.pos.x - a.pos.x);          // highest x first
            const line = defenders[1]?.pos.x ?? 95;                // second-deepest defender
            return Math.max(50, this.ball.pos.x, line);            // can't be offside in own half or behind ball
        } else {
            defenders.sort((a, b) => a.pos.x - b.pos.x);          // lowest x first
            const line = defenders[1]?.pos.x ?? 5;
            return Math.min(50, this.ball.pos.x, line);
        }
    }

    // ── Shooting: position-specific accuracy + distance/angle/pressure ───
    private shoot(from: Agent) {
        this.ballOwner = null;
        this.lastToucher = from;
        this.passTarget = null;
        this.isShot = true;
        this.isLoftedPass = false;
        this.offsidePlayersOnPass.clear();

        if (from.isHome) this.homeStats.shots++; else this.awayStats.shots++;

        const oppGoalX = from.isHome ? (this.period === 1 ? 95 : 5) : (this.period === 1 ? 5 : 95);

        // Goal opening: y 44.6–55.4 (7.32 m on a 68 m pitch ≈ 10.8 %)
        const GOAL_TOP = 44.6, GOAL_BOT = 55.4, GOAL_MID = 50;

        // Distance from goal in "pitch units" (goal is at x=0 or x=100)
        const distToGoalX = Math.abs(from.pos.x - oppGoalX);
        const distToGoal = Vector.dist(from.pos, new Vector(oppGoalX, GOAL_MID));

        // Shooting skill of the player (position-adjusted)
        const shootSkill = from.skills.shootingN; // 0..1

        // Angle penalty: sharper angle → much harder
        const offCentre = Math.abs(from.pos.y - GOAL_MID); // 0=central, 50=wide
        const angleFactor = Math.max(0, 1 - (offCentre / 28)); // drops off fast past ~28 units

        // Pressure: number of close opponents within 8 units
        const pressure = this.players.filter(p =>
            p.teamId !== from.teamId && p.role !== 'GK' &&
            Vector.dist(p.pos, from.pos) < 8
        ).length;
        const pressurePenalty = Math.max(0, 1 - pressure * 0.18);

        // Distance penalty: accuracy falls with range (realistic ~35 units = edge of box)
        const distancePenalty = Math.max(0.25, 1 - distToGoalX / 55);

        // Combined shot quality [0..1]
        const shotQuality = shootSkill * angleFactor * pressurePenalty * distancePenalty;

        // GK for opponent
        const gk = this.players.find(p => p.teamId !== from.teamId && p.role === 'GK');

        // Choose target corner: aim away from GK position
        let targetY: number;
        const topOpen = this.isShootingLaneOpen(from.pos, new Vector(oppGoalX, GOAL_TOP + 1), from.teamId);
        const bottomOpen = this.isShootingLaneOpen(from.pos, new Vector(oppGoalX, GOAL_BOT - 1), from.teamId);

        if (topOpen && bottomOpen) {
            // Aim away from GK y-position
            targetY = gk
                ? (Math.abs(gk.pos.y - GOAL_TOP) > Math.abs(gk.pos.y - GOAL_BOT) ? GOAL_TOP + 2 : GOAL_BOT - 2)
                : (Math.random() > 0.5 ? GOAL_TOP + 2 : GOAL_BOT - 2);
        } else if (topOpen) {
            targetY = GOAL_TOP + 2;
        } else if (bottomOpen) {
            targetY = GOAL_BOT - 2;
        } else {
            targetY = GOAL_MID + (Math.random() - 0.5) * 12;
        }

        // Accuracy noise: better players place the ball more precisely
        // Poor shot quality → big spread, possibly off target entirely
        const maxSpread = (1 - shotQuality) * 20;
        const spreadY = (Math.random() - 0.5) * maxSpread;
        const spreadX = (Math.random() - 0.5) * maxSpread * 0.3;
        targetY = Math.max(GOAL_TOP - 4, Math.min(GOAL_BOT + 4, targetY + spreadY));

        // Shot power scales with shooting skill and stamina
        const shotPower = SHOOT_SPEED * (0.7 + shootSkill * 0.5) * from.stamina;

        const dir = new Vector(oppGoalX + spreadX - from.pos.x, targetY - from.pos.y).normalize();
        this.ball.vel = dir.mult(shotPower);
        this.cooldown = 0.45;

        const onTarget = targetY >= GOAL_TOP && targetY <= GOAL_BOT;
        if (onTarget) {
            if (from.isHome) this.homeStats.shotsOnTarget++; else this.awayStats.shotsOnTarget++;
        }

        this.events.unshift(`${Math.floor(this.minute)}' Shot${onTarget ? ' (on target)' : ''} by ${from.name} (${from.isHome ? this.homeTeam.shortName : this.awayTeam.shortName})`);
    }

    // ── Passing: rating-based accuracy + smart target selection ─────────
    private pass(from: Agent, to: Agent) {
        this.ballOwner = null;
        this.lastToucher = from;
        this.passTarget = to;
        this.isShot = false;
        this.isLoftedPass = from.role === 'GK' || this.isSetPiece;
        this.offsidePlayersOnPass.clear();

        if (!this.isThrowInOrGoalKick) {
            const homeAttacksRight = this.period === 1;
            const attackingRight = from.isHome ? homeAttacksRight : !homeAttacksRight;
            const offsideLine = this.getOffsideLine(from.teamId, attackingRight);
            this.players.forEach(p => {
                if (p.teamId !== from.teamId || p === from) return;
                const isOffside = attackingRight ? p.pos.x > offsideLine + 0.2 : p.pos.x < offsideLine - 0.2;
                if (isOffside) this.offsidePlayersOnPass.add(p.id);
            });
        }
        this.isSetPiece = false;
        this.isThrowInOrGoalKick = false;

        // Passing accuracy: higher rating → tighter pass
        const passSkill = from.skills.passingN;
        // Pressure on passer
        const pressure = this.players.filter(p =>
            p.teamId !== from.teamId && p.role !== 'GK' &&
            Vector.dist(p.pos, from.pos) < 7
        ).length;
        const pressureFactor = Math.max(0, 1 - pressure * 0.15);
        const quality = passSkill * pressureFactor;

        // Inaccuracy: great passers hit the target within 1–2 units, poor ones can spray it
        const spread = Math.pow(1 - quality, 3) * 60;
        const tx = to.pos.x + (Math.random() - 0.5) * spread;
        const ty = to.pos.y + (Math.random() - 0.5) * spread;

        // Speed proportional to quality and distance
        const dist = Vector.dist(from.pos, to.pos);
        const speedMult = 0.5 + quality * 0.7;
        const passSpeed = Math.min(PASS_SPEED, 80 + dist * 2.5) * speedMult;

        const dir = new Vector(tx - from.pos.x, ty - from.pos.y).normalize();
        this.ball.vel = dir.mult(passSpeed);
        this.cooldown = 0.28;
    }

    // ── Main update ────────────────────────────────────────────────────
    update(dt: number) {
        if (this.minute >= 90) return;
        if (this.state === 'PLAYING' || this.state === 'STOPPED') {
            this.minute += dt * (45 / HALF_DURATION_REAL_SEC);
            if (this.ballOwner) {
                if (this.ballOwner.isHome) this.homeStats.possessionTime += dt;
                else this.awayStats.possessionTime += dt;
            }
            if (this.period === 1 && this.minute >= 45) {
                this.state = 'HALFTIME';
                this.events.unshift("45' Halftime");
                this.triggerUpdate();
                this.onHalftime();
                return;
            }
        }
        if (this.state === 'STOPPED') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0 && this.ballOwner) {
                // Throw-ins limited to 28 units; goal kicks and other restarts unrestricted
                const maxDist = this.isThrowInOrGoalKick && this.ballOwner.role !== 'GK' ? 28 : 100;
                const validMates = this.players.filter(m =>
                    m.teamId === this.ballOwner!.teamId &&
                    m !== this.ballOwner &&
                    Vector.dist(m.pos, this.ballOwner!.pos) < maxDist
                );
                const fallback = this.players.filter(m => m.teamId === this.ballOwner!.teamId && m !== this.ballOwner);
                const targets = validMates.length > 0 ? validMates : fallback;
                if (targets.length > 0) {
                    const mate = targets[Math.floor(Math.random() * targets.length)];
                    this.pass(this.ballOwner, mate);
                }
                this.state = 'PLAYING';
            }
            this.physicsStep(dt);
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

    // ── AI: improved decision-making using skill components ───────────
    private aiStep(dt: number) {
        const ballPos = this.ball.pos;
        const homeAttacksRight = this.period === 1;
        const possessingTeam = this.ballOwner?.teamId ?? this.lastToucher?.teamId ?? null;
        const homeOffsideLine = this.getOffsideLine(this.homeTeam.id, homeAttacksRight);
        const awayOffsideLine = this.getOffsideLine(this.awayTeam.id, !homeAttacksRight);

        // Sort by distance to ball for pressing priority
        const homeNonGK = this.players.filter(p => p.isHome && p.role !== 'GK').sort((a, b) => Vector.dist(a.pos, ballPos) - Vector.dist(b.pos, ballPos));
        const awayNonGK = this.players.filter(p => !p.isHome && p.role !== 'GK').sort((a, b) => Vector.dist(a.pos, ballPos) - Vector.dist(b.pos, ballPos));
        const homePressers = homeNonGK.slice(0, 2);
        const awayPressers = awayNonGK.slice(0, 2);

        this.players.forEach(p => {
            const force = new Vector(0, 0);
            let separation = new Vector(0, 0);
            const isDefending = possessingTeam !== null && possessingTeam !== p.teamId;
            const attackingRight = p.isHome ? homeAttacksRight : !homeAttacksRight;
            const oppGoalX = attackingRight ? 95 : 5;
            const ownGoalX = attackingRight ? 5 : 95;
            const offsideLine = p.isHome ? homeOffsideLine : awayOffsideLine;
            const pressers = p.isHome ? homePressers : awayPressers;

            // Separation force to avoid clumping
            this.players.forEach(other => {
                if (p === other || p.role === 'GK' || other.role === 'GK') return;
                const dist = Vector.dist(p.pos, other.pos);
                if (p.teamId === other.teamId && dist < 10) {
                    const diff = new Vector(p.pos.x - other.pos.x, p.pos.y - other.pos.y);
                    separation.add(diff.normalize().mult(35 / (dist + 0.1)));
                } else if (p.teamId !== other.teamId && dist < 3 && !this.ballOwner) {
                    const diff = new Vector(p.pos.x - other.pos.x, p.pos.y - other.pos.y);
                    separation.add(diff.normalize().mult(10 / (dist + 0.1)));
                }
            });

            if (p.role === 'GK') {
                // GK: stay on goal line but track ball laterally, use positioning skill
                const gkLineX = attackingRight ? 6 : 94;
                const gkTargetY = Math.max(44, Math.min(56, ballPos.y));
                // GK comes off line slightly when ball is close
                const distBall = Vector.dist(p.pos, ballPos);
                const lineX = distBall < 30 ? (attackingRight ? gkLineX + 4 : gkLineX - 4) : gkLineX;
                force.add(p.arrive(new Vector(lineX, gkTargetY), 1.3));

                // GK distributes when has ball
                if (this.ballOwner === p && this.cooldown <= 0) {
                    this.gkHoldTime += dt;
                    const openMates = this.players.filter(m =>
                        m.teamId === p.teamId && m !== p &&
                        this.isPassLaneOpen(p.pos, m.pos, p.teamId)
                    ).sort((a, b) => {
                        const sa = this.players.filter(d => d.teamId !== p.teamId && Vector.dist(a.pos, d.pos) < 15).length;
                        const sb = this.players.filter(d => d.teamId !== p.teamId && Vector.dist(b.pos, d.pos) < 15).length;
                        return sa - sb;
                    });
                    if (openMates.length > 0 && Math.random() < 2.5 * dt) {
                        this.pass(p, openMates[0]);
                        this.gkHoldTime = 0;
                    } else if (this.gkHoldTime > 3.0) {
                        // No open lane for 3+ seconds – punt to any teammate
                        const anyMate = this.players.filter(m => m.teamId === p.teamId && m !== p);
                        if (anyMate.length > 0) {
                            this.pass(p, anyMate[Math.floor(Math.random() * anyMate.length)]);
                            this.gkHoldTime = 0;
                        }
                    }
                } else if (this.ballOwner !== p) {
                    this.gkHoldTime = 0;
                }
            } else {
                let baseX = this.period === 2 ? 100 - p.basePos.x : p.basePos.x;
                let baseY = this.period === 2 ? 100 - p.basePos.y : p.basePos.y;
                const unmirroredX = p.isHome ? p.basePos.x : 100 - p.basePos.x;
                const roleType = unmirroredX <= 42 ? 'DEF' : unmirroredX >= 72 ? 'FWD' : 'MID';
                const isWide = baseY < 35 || baseY > 65;

                let target = new Vector(baseX, baseY);

                if (!isDefending) {
                    // Push forward with positioning ability
                    const fwdPush = 35 * (0.7 + p.skills.positioningN * 0.5);
                    if (attackingRight) target.x = Math.min(oppGoalX - 5, target.x + fwdPush * (roleType === 'DEF' ? 0.6 : roleType === 'FWD' ? 1.0 : 0.85));
                    else target.x = Math.max(oppGoalX + 5, target.x - fwdPush * (roleType === 'DEF' ? 0.6 : roleType === 'FWD' ? 1.0 : 0.85));

                    // Ball tracking
                    target.x += (ballPos.x - 50) * (roleType === 'FWD' ? 0.55 : 0.35);
                    if (isWide) {
                        target.y = baseY < 50 ? 14 : 86;
                    } else {
                        target.y = baseY + (ballPos.y - 50) * 0.2;
                    }

                    // Offside awareness – only restrict movement when the line is
                    // actually inside the opponent's half (> 52 / < 48).
                    // This prevents players being blocked at the halfway line.
                    if (attackingRight) {
                        if (offsideLine > 52) target.x = Math.min(target.x, offsideLine - 2);
                        if (p.pos.x > offsideLine) force.add(p.arrive(new Vector(offsideLine - 3, p.pos.y), 1.8));
                    } else {
                        if (offsideLine < 48) target.x = Math.max(target.x, offsideLine + 2);
                        if (p.pos.x < offsideLine) force.add(p.arrive(new Vector(offsideLine + 3, p.pos.y), 1.8));
                    }
                } else {
                    // Defend
                    if (roleType === 'DEF') {
                        // Hold a compact, high defensive line tracking ball depth.
                        // Stay ~22 units behind the ball – prevents dropping to own box
                        // and allows the offside trap to function.
                        const lineDepth = 22;
                        if (attackingRight) {
                            target.x = Math.max(ownGoalX + 10, Math.min(48, ballPos.x - lineDepth));
                        } else {
                            target.x = Math.min(ownGoalX - 10, Math.max(52, ballPos.x + lineDepth));
                        }
                    } else {
                        const dropFactor = roleType === 'FWD' ? 0.08 : 0.45;
                        if (attackingRight) target.x = Math.max(ownGoalX + 5, target.x - 10 * dropFactor);
                        else target.x = Math.min(ownGoalX - 5, target.x + 10 * dropFactor);
                    }
                    target.y = baseY + (ballPos.y - 50) * (roleType === 'DEF' ? 0.55 : 0.25);
                    // Clamp central defenders to box width
                    if (roleType === 'DEF' && !isWide) {
                        const boxLine = attackingRight ? 26 : 74;
                        if (attackingRight && target.x < boxLine) target.x = boxLine;
                        else if (!attackingRight && target.x > boxLine) target.x = boxLine;
                    }
                }

                target.x = Math.max(10, Math.min(90, target.x));
                target.y = Math.max(5, Math.min(95, target.y));

                if (this.ballOwner === p) {
                    // Ball carrier: decide to dribble, pass, or shoot
                    const distToGoalX = Math.abs(p.pos.x - oppGoalX);
                    const distToGoal = Vector.dist(p.pos, new Vector(oppGoalX, 50));
                    const inPenBox = distToGoalX <= 20 && p.pos.y >= 25 && p.pos.y <= 75;

                    // Nearest opponent threat
                    const threats = this.players
                        .filter(d => d.teamId !== p.teamId && d.role !== 'GK')
                        .map(d => ({ d, dist: Vector.dist(d.pos, p.pos) }))
                        .filter(x => x.dist < 14)
                        .sort((a, b) => a.dist - b.dist);

                    const closestThreat = threats[0];
                    const underPressure = closestThreat && closestThreat.dist < 6;

                    if (this.cooldown <= 0) {
                        const shootProb = p.skills.shootingN;
                        // Attempt shot?
                        const isAwfulAngle = distToGoalX < 25 && (p.pos.y < 28 || p.pos.y > 72);
                        const topOpen = this.isShootingLaneOpen(p.pos, new Vector(oppGoalX, 45), p.teamId);
                        const bottomOpen = this.isShootingLaneOpen(p.pos, new Vector(oppGoalX, 55), p.teamId);
                        const clearShot = topOpen || bottomOpen;

                        let shotTaken = false;
                        if (!isAwfulAngle && clearShot) {
                            if (inPenBox && shootProb > 0.4) {
                                this.shoot(p); shotTaken = true;
                            } else if (distToGoal < 40) {
                                const probScale = distToGoal < 20 ? 5 : distToGoal < 30 ? 2.5 : 1.0;
                                if (Math.random() < probScale * shootProb * dt) {
                                    this.shoot(p); shotTaken = true;
                                }
                            }
                        }

                        // Pass?
                        if (!shotTaken) {
                            // Find open teammates, prefer those in dangerous positions
                            const mates = this.players.filter(m =>
                                m.teamId === p.teamId && m !== p &&
                                Vector.dist(p.pos, m.pos) > 6 &&
                                Vector.dist(p.pos, m.pos) < 60 &&
                                this.isPassLaneOpen(p.pos, m.pos, p.teamId)
                            );
                            if (mates.length > 0) {
                                // Score each option: closer to goal + more space = better
                                mates.sort((a, b) => {
                                    const distA = Math.abs(a.pos.x - oppGoalX);
                                    const distB = Math.abs(b.pos.x - oppGoalX);
                                    const spaceA = Math.min(...this.players.filter(d => d.teamId !== p.teamId && d.role !== 'GK').map(d => Vector.dist(a.pos, d.pos)));
                                    const spaceB = Math.min(...this.players.filter(d => d.teamId !== p.teamId && d.role !== 'GK').map(d => Vector.dist(b.pos, d.pos)));
                                    // Randomise slightly (lower quality players are less decisive)
                                    const noise = (1 - p.skills.passingN) * 25;
                                    return (distA - spaceA * 4 + (Math.random() - 0.5) * noise) -
                                        (distB - spaceB * 4 + (Math.random() - 0.5) * noise);
                                });
                                // Pass probability scales with pressure and passing skill
                                const passRate = underPressure
                                    ? 6.0 * p.skills.passingN * dt
                                    : 4.0 * p.skills.passingN * dt;
                                if (Math.random() < passRate) {
                                    this.pass(p, mates[0]);
                                }
                            }
                        }
                    }

                    // Dribble movement: drive toward goal, avoid threats with dribbling skill
                    let driveY = p.pos.y;
                    if (underPressure) {
                        const evadeY = p.pos.y > closestThreat.d.pos.y ? 1 : -1;
                        const dribSkill = p.skills.dribblingN;
                        driveY = p.pos.y + evadeY * 18 * dribSkill;
                    } else if (distToGoalX < 35 && (p.pos.y < 33 || p.pos.y > 67)) {
                        driveY = p.pos.y < 50 ? p.pos.y + 12 : p.pos.y - 12;
                    }
                    force.add(p.arrive(new Vector(oppGoalX, driveY), 0.9));

                } else if (!this.ballOwner && this.passTarget === p) {
                    force.add(p.arrive(ballPos, 1.25));
                } else if (isDefending && this.ballOwner) {
                    const isPrimary = pressers[0] === p;
                    const isCover = pressers[1] === p;
                    if (isPrimary) {
                        // Press with intensity based on defending skill
                        const pressIntensity = 1.0 + p.skills.defendingN * 0.3;
                        force.add(p.arrive(new Vector(
                            ballPos.x + (ownGoalX > 50 ? -3 : 3),
                            ballPos.y
                        ), pressIntensity));
                    } else if (isCover) {
                        // Cover the passing lane
                        const coverX = ballPos.x + (ownGoalX > 50 ? 14 : -14);
                        force.add(p.arrive(new Vector(coverX, ballPos.y), 1.0));
                    } else {
                        force.add(p.arrive(target, 1.0));
                    }
                } else {
                    // Off-ball movement: decay run timer, occasionally trigger a run into space
                    if (p.runTimer > 0) {
                        p.runTimer -= dt;
                        if (p.runTimer <= 0) p.runTarget = null;
                    }
                    if (!isDefending && roleType !== 'DEF' && !p.runTarget && Math.random() < 0.10 * dt) {
                        const runDepth = attackingRight
                            ? Math.min(oppGoalX - 5, ballPos.x + 8 + Math.random() * 22)
                            : Math.max(oppGoalX + 5, ballPos.x - 8 - Math.random() * 22);
                        p.runTarget = new Vector(
                            Math.max(10, Math.min(90, runDepth)),
                            20 + Math.random() * 60
                        );
                        p.runTimer = 1.8 + Math.random() * 2.0;
                    }
                    const moveTarget = (!isDefending && p.runTarget) ? p.runTarget.clone() : target.clone();
                    // Respect offside line on runs — only in opponent's half
                    if (!isDefending) {
                        if (attackingRight && offsideLine > 52) moveTarget.x = Math.min(moveTarget.x, offsideLine - 2);
                        else if (!attackingRight && offsideLine < 48) moveTarget.x = Math.max(moveTarget.x, offsideLine + 2);
                    }
                    force.add(p.arrive(moveTarget, 1.0));
                }
            }

            force.add(separation);
            p.applyForce(force);
        });

        if (this.cooldown > 0) this.cooldown -= dt;
    }

    private physicsStep(dt: number) {
        const fpsScale = dt * 60;
        if (this.isLoftedPass && this.ball.vel.mag() < 70) this.isLoftedPass = false;
        this.players.forEach(p => {
            p.updatePhysics(dt);
            p.vel.mult(Math.pow(FRICTION, fpsScale));
            p.pos.x = Math.max(5, Math.min(95, p.pos.x));
            p.pos.y = Math.max(0, Math.min(100, p.pos.y));
        });
        if (this.ballOwner) {
            this.ball.pos.x = this.ballOwner.pos.x + this.ballOwner.vel.x * 0.05;
            this.ball.pos.y = this.ballOwner.pos.y + this.ballOwner.vel.y * 0.05;
            this.ball.vel = this.ballOwner.vel.clone();
        } else {
            this.ball.updatePhysics(dt);
            this.ball.pos.x = Math.max(0, Math.min(100, this.ball.pos.x));
            this.ball.pos.y = Math.max(0, Math.min(100, this.ball.pos.y));
            if (this.passTarget) {
                const dir = new Vector(this.passTarget.pos.x - this.ball.pos.x, this.passTarget.pos.y - this.ball.pos.y).normalize();
                const currentSpeed = this.ball.vel.mag();
                this.ball.vel = dir.mult(currentSpeed > 0 ? currentSpeed : PASS_SPEED);
            } else {
                this.ball.vel.mult(Math.pow(BALL_FRICTION, fpsScale));
            }
        }
    }

    // ── Collision: improved GK save probability + tackling ───────────
    private checkCollisions() {
        if (!this.ballOwner) {
            let closest: Agent | null = null;
            let minD = 1000;
            this.players.forEach(p => {
                if (this.isLoftedPass && p !== this.passTarget && p.role !== 'GK') return;
                const d = Vector.dist(p.pos, this.ball.pos);
                const threshold = p.role === 'GK' ? 5.5 : 3.5;
                if (d < threshold && d < minD && !(this.lastToucher === p && this.cooldown > 0)) {
                    minD = d; closest = p;
                }
            });

            if (closest) {
                const isOpponentGK = closest.role === 'GK' && this.lastToucher && this.lastToucher.teamId !== closest.teamId;

                if (isOpponentGK && this.isShot) {
                    // ── Realistic GK save model ────────────────────────────────────
                    const gkSkill = closest.skills.gkN;  // 0..1 GK-specific rating
                    const shooter = this.lastToucher!;
                    const shotSkill = shooter.skills.shootingN;

                    // Ball velocity direction → infer target Y on goal line
                    const ballDir = this.ball.vel.clone().normalize();
                    const tGoalX = closest.pos.x < 50 ? 5 : 95;
                    const t = (tGoalX - this.ball.pos.x) / (ballDir.x || 0.001);
                    const ballArrivalY = this.ball.pos.y + ballDir.y * t;

                    // GK distance from projected arrival point
                    const gkDistToArrival = Math.abs(closest.pos.y - ballArrivalY);

                    // Save probability:
                    // - GK directly in path → high save chance (scaled by gk skill)
                    // - GK far from arrival → dive chance scaled by gk skill and reaction
                    const inPath = gkDistToArrival < 5;
                    const diveRange = 8 + gkSkill * 10; // elite GKs dive further
                    const canDive = gkDistToArrival < diveRange;

                    let baseSaveProb: number;
                    if (inPath) {
                        baseSaveProb = 0.55 + gkSkill * 0.35;   // 55–90% if ball hits GK
                    } else if (canDive) {
                        const diveDecay = 1 - gkDistToArrival / diveRange;
                        baseSaveProb = (0.25 + gkSkill * 0.45) * diveDecay;
                    } else {
                        baseSaveProb = 0.04; // unlikely but not impossible (own-goal-style rebounds)
                    }

                    // Shot quality reduces save probability
                    const finalSaveProb = baseSaveProb * (1 - shotSkill * 0.35);

                    if (Math.random() < finalSaveProb) {
                        // Saved! GK picks up or punches out
                        const punched = Math.random() < 0.25;
                        if (punched) {
                            // Punch: ball bounces away from goal
                            this.ball.vel = new Vector(
                                (closest.isHome ? 1 : -1) * 60 + (Math.random() - 0.5) * 30,
                                (Math.random() - 0.5) * 40,
                            );
                            this.lastToucher = closest;
                            this.isShot = false;
                            this.cooldown = 0.4;
                            this.events.unshift(`${Math.floor(this.minute)}' Punched away by ${closest.name}`);
                        } else {
                            this.ballOwner = closest;
                            this.passTarget = null;
                            this.isShot = false;
                            this.isLoftedPass = false;
                            this.state = 'STOPPED';
                            this.stateTimer = 1.0;
                            this.events.unshift(`${Math.floor(this.minute)}' Save by ${closest.name}!`);
                        }
                    } else {
                        // GK touch but can't hold – deflect slightly
                        if (Math.random() < 0.3 && canDive) {
                            this.ball.vel.y += (Math.random() - 0.5) * 15;
                            this.ball.vel.mult(0.80);
                            this.cooldown = 0.2;
                            this.events.unshift(`${Math.floor(this.minute)}' Parried! Rebound...`);
                        }
                        // else: goal – handled by boundary check
                    }

                } else if (isOpponentGK && !this.isShot) {
                    // Non-shot reaches GK (through-ball etc.)
                    this.ballOwner = closest;
                    this.passTarget = null;
                    this.isShot = false;
                    this.isLoftedPass = false;
                } else if (closest.role !== 'GK' && this.isShot && this.lastToucher?.teamId !== closest.teamId) {
                    // Blocked by outfield defender
                    this.ball.vel.mult(-0.45);
                    this.lastToucher = closest;
                    this.cooldown = 0.2;
                    this.isShot = false;
                } else {
                    // Normal ball receipt
                    let goodTouch = true;
                    if (this.passTarget === closest && closest.role !== 'GK') {
                        // First touch: poor players mishit sometimes (especially under pressure)
                        const pressure = this.players.filter(d =>
                            d.teamId !== closest.teamId && d.role !== 'GK' &&
                            Vector.dist(d.pos, closest.pos) < 7
                        ).length;
                        const trapSkill = closest.skills.passingN * (1 - pressure * 0.1);
                        if (Math.random() < Math.pow(1 - trapSkill, 4)) goodTouch = false;
                    }
                    if (goodTouch && (this.passTarget === closest || Math.random() < 0.88)) {
                        this.ballOwner = closest;
                        this.passTarget = null;
                        this.isShot = false;
                        this.isLoftedPass = false;
                    } else {
                        this.ball.vel.mult(-0.5);
                        this.lastToucher = closest;
                        this.cooldown = 0.2;
                    }
                }
            }
        } else {
            // ── Tackling: defending skill vs dribbling skill ─────────────
            this.players.forEach(p => {
                if (!this.ballOwner) return;
                if (p.teamId === this.ballOwner.teamId) return;
                if (this.ballOwner.role === 'GK') return;
                if (Vector.dist(p.pos, this.ballOwner.pos) >= 3.5) return;
                if (this.cooldown > 0) return;

                const homeAttacksRight = this.period === 1;
                const attackingDir = this.ballOwner.isHome ? (homeAttacksRight ? 1 : -1) : (homeAttacksRight ? -1 : 1);
                const isBehind = (this.ballOwner.pos.x - p.pos.x) * attackingDir > 0.8;
                if (isBehind) return; // can't tackle from behind legitimately

                // Tackle contest: defender's defending vs carrier's dribbling
                const defScore = p.skills.defendingN * (0.8 + Math.random() * 0.4);
                const dribScore = this.ballOwner.skills.dribblingN * (0.8 + Math.random() * 0.4);
                // Stamina affects both
                const defFinal = defScore * p.stamina;
                const dribFinal = dribScore * this.ballOwner.stamina;

                if (defFinal > dribFinal + 0.08) {
                    // Clean tackle
                    if (defFinal > dribFinal + 0.22) {
                        // Win possession
                        this.ballOwner = p;
                        this.cooldown = 0.9;
                        // Momentum shifts
                        this.momentum += p.isHome ? 0.15 : -0.15;
                        this.momentum = Math.max(-1, Math.min(1, this.momentum));
                    } else {
                        // Ball loose
                        this.lastToucher = p;
                        this.passTarget = null;
                        this.ballOwner = null;
                        this.ball.vel = new Vector((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
                        this.cooldown = 0.5;
                    }
                } else {
                    // Tackler beaten – small cooldown so they don't instantly re-tackle
                    this.cooldown = 0.22;
                }
            });
        }

        // Offside check after a pass is received
        if (this.ballOwner && this.lastToucher && this.ballOwner.teamId === this.lastToucher.teamId) {
            if (this.offsidePlayersOnPass.has(this.ballOwner.id)) {
                this.state = 'STOPPED';
                this.stateTimer = 1.5;
                this.isSetPiece = true;
                this.events.unshift(`${Math.floor(this.minute)}' OFFSIDE – ${this.ballOwner.name}`);
                const defendingTeam = this.ballOwner.teamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
                this.ballOwner = null;
                this.passTarget = null;
                this.ball.vel.mult(0);
                const fkTaker = this.players
                    .filter(p => p.teamId === defendingTeam && p.role !== 'GK')
                    .sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
                if (fkTaker) { fkTaker.pos = this.ball.pos.clone(); this.ballOwner = fkTaker; }
                this.offsidePlayersOnPass.clear();
            }
        } else {
            this.offsidePlayersOnPass.clear();
        }
    }

    private checkBoundaries() {
        const { x, y } = this.ball.pos;
        // Goal mouth check: y 44.6–55.4 (accurate goal width), x past the line
        if (y > 44.6 && y < 55.4) {
            if (x < 5) { this.scoreGoal(this.period === 1 ? false : true); return; }
            if (x > 95) { this.scoreGoal(this.period === 1 ? true : false); return; }
        }
        if (y < 0 || y > 100 || x < 5 || x > 95) {
            this.state = 'STOPPED';
            this.stateTimer = 1.0;
            this.ballOwner = null;
            this.passTarget = null;
            this.isShot = false;
            this.isLoftedPass = false;
            this.isSetPiece = true;
            this.isThrowInOrGoalKick = true;
            this.offsidePlayersOnPass.clear();
            if (y < 0 || y > 100) {
                // Throw-in: ball stays on the touchline where it left
                this.ball.pos.y = y < 0 ? 0.5 : 99.5;
                this.ball.vel = new Vector(0, 0);
                const throwTeamId = this.lastToucher?.teamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
                const nearest = this.players
                    .filter(p => p.teamId === throwTeamId && p.role !== 'GK')
                    .sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
                if (nearest) { nearest.pos = this.ball.pos.clone(); this.ballOwner = nearest; }
            } else {
                // Ball over goal line (but not in goal) – corner or goal kick
                const homeAttacksRight = this.period === 1;
                const isLeftGoalLine = x < 50; // x<50 is left side of pitch
                // Which team defends this goal line?
                const defendingTeamId = (homeAttacksRight === isLeftGoalLine)
                    ? this.awayTeam.id   // left line in p1 = away goal
                    : this.homeTeam.id;
                const attackingTeamId = defendingTeamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
                const lastTouchWasAttacking = this.lastToucher?.teamId === attackingTeamId;
                this.ball.vel = new Vector(0, 0);

                if (lastTouchWasAttacking) {
                    // CORNER KICK – ball placed at the nearest corner flag
                    const cornerX = x < 5 ? 5.5 : 94.5;
                    const cornerY = y < 50 ? 0.5 : 99.5;
                    this.ball.pos = new Vector(cornerX, cornerY);
                    this.isSetPiece = true;
                    this.events.unshift(`${Math.floor(this.minute)}' Corner`);
                    const taker = this.players
                        .filter(p => p.teamId === attackingTeamId && p.role !== 'GK')
                        .sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
                    if (taker) { taker.pos = this.ball.pos.clone(); this.ballOwner = taker; }
                } else {
                    // GOAL KICK – GK restarts from 6-yard box
                    const gkX = x < 50 ? 9 : 91;
                    this.ball.pos = new Vector(gkX, 50);
                    this.events.unshift(`${Math.floor(this.minute)}' Goal Kick`);
                    const gk = this.players.find(p => p.teamId === defendingTeamId && p.role === 'GK');
                    if (gk) { gk.pos = this.ball.pos.clone(); this.ballOwner = gk; }
                }
            }
        }
    }

    scoreGoal(isHome: boolean) {
        this.state = 'STOPPED';
        this.stateTimer = 1.0;
        this.isShot = false;
        this.isLoftedPass = false;
        this.offsidePlayersOnPass.clear();
        let scorer = 'Unknown';
        let isOwnGoal = false;
        if (this.lastToucher) {
            scorer = this.lastToucher.name;
            if (this.lastToucher.isHome !== isHome) isOwnGoal = true;
        }
        if (isHome) {
            this.homeScore++;
            this.events.unshift(`${Math.floor(this.minute)}' ${isOwnGoal ? 'OWN GOAL' : 'GOAL'}! ${scorer} (${this.homeTeam.shortName})`);
            this.momentum = Math.min(1, this.momentum + 0.3);
        } else {
            this.awayScore++;
            this.events.unshift(`${Math.floor(this.minute)}' ${isOwnGoal ? 'OWN GOAL' : 'GOAL'}! ${scorer} (${this.awayTeam.shortName})`);
            this.momentum = Math.max(-1, this.momentum - 0.3);
        }
        this.setupKickoff(!isHome);
        this.triggerUpdate();
    }

    skipToEnd() {
        const remaining = 90 - this.minute;
        if (remaining <= 0) return;

        const avgRating = (team: Team) => {
            const on = (team.roster ?? []).filter(p => !p.offField);
            if (on.length === 0) return team.strength;

            const formation = FORMATIONS[team.formation || '4-3-3'];
            const usedSlots = new Set<number>();

            return on.reduce((sum, p) => {
                // Try to find an exact position match first
                let slotIndex = formation.findIndex((f, idx) => f.position === p.position && !usedSlots.has(idx));

                // If no perfect match, just take the first available slot
                if (slotIndex === -1) slotIndex = formation.findIndex((_, idx) => !usedSlots.has(idx));
                if (slotIndex === -1) slotIndex = 0; // Fallback

                usedSlots.add(slotIndex);
                return sum + getPenalizedRating(p.rating, p.position, formation[slotIndex]?.position || 'MID');
            }, 0) / on.length;
        };

        const homeStr = avgRating(this.homeTeam);
        const awayStr = avgRating(this.awayTeam);
        const diff = (homeStr + 4) - awayStr; // slight home advantage
        const hProb = Math.max(0.005, 0.015 + diff * 0.0006);
        const aProb = Math.max(0.005, 0.015 - diff * 0.0006);

        for (let m = 0; m < remaining; m++) {
            if (Math.random() < hProb) {
                this.homeScore++;
                this.homeStats.shots++;
                this.homeStats.shotsOnTarget++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Simulated) – ${this.homeTeam.shortName}`);
            }
            if (Math.random() < aProb) {
                this.awayScore++;
                this.awayStats.shots++;
                this.awayStats.shotsOnTarget++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Simulated) – ${this.awayTeam.shortName}`);
            }
        }
        this.minute = 90;
        this.triggerUpdate();
    }
}

// ── React Component ──────────────────────────────────────────────────────────
const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, userTeamId, onMatchComplete, competition = 'La Liga' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const prevTimeRef = useRef<number>(0);
    const isFinishedRef = useRef(false);

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
    const [selectedSub, setSelectedSub] = useState<{ onFieldId?: string; offFieldId?: string }>({});

    const isPausedRef = useRef(isPausedState || showTacticsModal);
    const isHalftimeRef = useRef(isHalftime);
    const onMatchCompleteRef = useRef(onMatchComplete);
    isPausedRef.current = isPausedState || showTacticsModal;
    isHalftimeRef.current = isHalftime;
    onMatchCompleteRef.current = onMatchComplete;

    const applySubstitutions = () => {
        if (selectedSub.onFieldId && selectedSub.offFieldId) {
            const updated = {
                ...liveUserTeam,
                roster: liveUserTeam.roster?.map(p => {
                    if (p.id === selectedSub.onFieldId) return { ...p, offField: true };
                    if (p.id === selectedSub.offFieldId) return { ...p, offField: false };
                    return p;
                }),
            };
            setLiveUserTeam(updated);
            setSelectedSub({});
            engineRef.current?.applyTacticalChange(updated, userTeamId === homeTeam.id);
        }
    };

    const draw = useCallback((game: GameEngine) => {
        const cvs = canvasRef.current;
        const ctx = cvs?.getContext('2d');
        if (!cvs || !ctx) return;
        const sx = cvs.width / 100, sy = cvs.height / 100;

        // Pitch
        ctx.fillStyle = '#166534';
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        // Stripe pattern
        for (let i = 0; i < 10; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent';
            ctx.fillRect(i * 10 * sx, 0, 10 * sx, cvs.height);
        }

        // ── Real pitch markings (105 m × 68 m) ──────────────────────────────
        // Coordinate space: x 0–100 (pitch x=5–95), y 0–100
        // 1 x-unit = 105/90 = 1.167 m | 1 y-unit = 68/100 = 0.68 m
        //
        // Penalty area: 16.5 m deep → 16.5/1.167 = 14.1 x-units from goal line (x=5)
        //               40.32 m wide → 40.32/0.68 = 59.3 y-units → y 20.35–79.65
        // 6-yard box:   5.5 m deep  → 5.5/1.167  =  4.7 x-units
        //               18.32 m wide→ 18.32/0.68 = 26.9 y-units → y 36.55–63.45
        // Centre circle:9.15 m r    → x: 9.15/1.167=7.84 units | y: 9.15/0.68=13.45 units
        // Goal:         7.32 m wide → 7.32/0.68 = 10.76 y-units → y 44.6–55.4

        const W = cvs.width, H = cvs.height;

        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        // Pitch outline
        ctx.strokeRect(5 * sx, 0, 90 * sx, H);
        // Halfway line
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
        // Centre circle (ellipse to preserve real-world proportions)
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, 7.84 * sx, 13.45 * sy, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Centre spot
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 2, 0, Math.PI * 2); ctx.fill();
        // Penalty areas
        ctx.strokeRect(5 * sx,  20.35 * sy, 14.1 * sx, 59.3 * sy);
        ctx.strokeRect((95 - 14.1) * sx, 20.35 * sy, 14.1 * sx, 59.3 * sy);
        // 6-yard boxes
        ctx.strokeRect(5 * sx, 36.55 * sy, 4.7 * sx, 26.9 * sy);
        ctx.strokeRect((95 - 4.7) * sx, 36.55 * sy, 4.7 * sx, 26.9 * sy);
        // Penalty spots (11 m from goal line = 11/1.167 = 9.42 x-units)
        const pSpot = 9.42;
        [5 + pSpot, 95 - pSpot].forEach(px => {
            ctx.beginPath(); ctx.arc(px * sx, H / 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
        });
        // Penalty arcs (9.15 m from penalty spot, outside the box)
        ctx.beginPath();
        ctx.ellipse((5 + pSpot) * sx, H / 2, 7.84 * sx, 13.45 * sy, 0, -0.93, 0.93);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse((95 - pSpot) * sx, H / 2, 7.84 * sx, 13.45 * sy, 0, Math.PI - 0.93, Math.PI + 0.93);
        ctx.stroke();
        // Corner arcs (1 m radius ≈ 0.86 x-units / 1.47 y-units)
        [[5, 0], [95, 0], [5, 100], [95, 100]].forEach(([cx, cy]) => {
            const startA = (cx < 50 ? 0 : Math.PI) + (cy < 50 ? -Math.PI / 2 : Math.PI / 2);
            ctx.beginPath();
            ctx.ellipse(cx * sx, cy * sy, 0.86 * sx, 1.47 * sy, 0, startA, startA + Math.PI / 2);
            ctx.stroke();
        });

        // Goal nets (y 44.6–55.4, x 0–5 and 95–100)
        const GNET_Y = 44.6 * sy, GNET_H = 10.8 * sy;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(0, GNET_Y, 5 * sx, GNET_H);
        ctx.fillRect(95 * sx, GNET_Y, 5 * sx, GNET_H);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, GNET_Y, 5 * sx, GNET_H);
        ctx.strokeRect(95 * sx, GNET_Y, 5 * sx, GNET_H);

        // Players
        // Real player footprint ≈ 0.5 m = 0.5/1.167 ≈ 0.43 x-units.
        // Use 0.7 * sx (~7 px at 1000 px canvas) for visibility.
        const pr = 0.7 * sx;
        game.players.forEach(p => {
            const x = p.pos.x * sx, y = p.pos.y * sy;

            // Stamina tint
            const staminaAlpha = 0.35 + p.stamina * 0.65;
            ctx.globalAlpha = staminaAlpha;
            ctx.fillStyle = p.isHome ? homeTeam.primaryColor : awayTeam.primaryColor;
            ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = p.isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            ctx.lineWidth = 1.2; ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Ball-carrier highlight ring
            if (game.ballOwner === p) {
                ctx.strokeStyle = '#FBBF24';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, pr + 2.5, 0, Math.PI * 2); ctx.stroke();
            }

            ctx.fillStyle = p.isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            ctx.font = `bold ${Math.round(pr * 1.3)}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.number.toString(), x, y);
        });

        // Ball – real ball diameter ≈ 0.22 m = 0.19 x-units; use 0.38*sx for visibility
        const bx = game.ball.pos.x * sx, by = game.ball.pos.y * sy;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(bx, by, 0.38 * sx, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333333'; ctx.lineWidth = 0.7; ctx.stroke();
    }, [homeTeam, awayTeam]);

    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new GameEngine(
                homeTeam, awayTeam,
                (h, a, m, e, s) => { setScore({ home: h, away: a }); setMinute(m); setEvents([...e]); setStats(s); },
                () => { setIsHalftime(true); setIsPausedState(true); },
            );
        }
        let rafId: number;
        const loop = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const dt = Math.min((time - prevTimeRef.current) / 1000, 0.1);
            prevTimeRef.current = time;
            if (engineRef.current && !isPausedRef.current && !isHalftimeRef.current && !isFinishedRef.current) {
                engineRef.current.update(dt);
                draw(engineRef.current);
                if (engineRef.current.minute >= 90) {
                    isFinishedRef.current = true;
                    setTimeout(() => onMatchCompleteRef.current(engineRef.current!.homeScore, engineRef.current!.awayScore), 1000);
                    return;
                }
            } else if (engineRef.current) {
                draw(engineRef.current);
            }
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [draw, homeTeam, awayTeam]);

    return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-slate-900 to-slate-950 text-white overflow-hidden min-w-0">
            {/* Scoreboard */}
            <div className="h-16 md:h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-4 md:px-8 shadow-2xl z-10 shrink-0 min-w-0">
                {[{ team: homeTeam, score: score.home, isRight: false }, { team: awayTeam, score: score.away, isRight: true }].map(({ team, score: sc, isRight }) => (
                    <div key={team.id} className={`flex items-center gap-3 md:gap-6 w-[35%] md:w-1/3 min-w-0 ${isRight ? 'justify-end flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-slate-800 rounded-full shadow-lg p-1.5 shrink-0 border border-slate-700">
                            {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" /> : <span className="font-bold text-sm">{team.shortName[0]}</span>}
                        </div>
                        <div className="min-w-0"><div className="text-lg md:text-3xl font-black truncate tracking-tight">{team.shortName}</div></div>
                        <div className="text-3xl md:text-5xl font-mono font-bold text-white drop-shadow-lg shrink-0">{sc}</div>
                    </div>
                ))}
                <div className="flex flex-col items-center w-[30%] md:w-1/3 px-2">
                    <div className="bg-slate-800/80 px-4 py-1 md:py-2 rounded-xl border border-slate-600/50 mb-1 shadow-inner">
                        <span className="font-mono font-bold text-sm md:text-xl text-emerald-400">{minute >= 90 ? 'FT' : `${minute}'`}</span>
                    </div>
                    <div className="w-full max-w-[240px] h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000" style={{ width: `${(minute / 90) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
                {/* Canvas */}
                <div className="w-full lg:flex-1 p-2 md:p-6 flex items-center justify-center relative min-h-[40vh] lg:min-h-0 shrink-0 lg:border-r border-slate-800/50">
                    <canvas ref={canvasRef} width={1000} height={583} className="max-w-full max-h-full aspect-[1000/583] bg-[#166534] rounded-lg md:rounded-2xl shadow-2xl border-2 md:border-4 border-slate-800" />

                    {isHalftime && !showTacticsModal && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-lg md:rounded-2xl">
                            <div className="text-3xl md:text-5xl font-black mb-6 tracking-widest text-white">HALFTIME</div>
                            <button onClick={() => { engineRef.current?.startSecondHalf(); setIsHalftime(false); setIsPausedState(false); }}
                                className="bg-emerald-600 hover:bg-emerald-500 transition-colors px-6 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                                <RotateCcw size={20} /> Start Second Half
                            </button>
                        </div>
                    )}

                    {!isHalftime && !isFinishedRef.current && !showTacticsModal && (
                        <div className="absolute bottom-4 md:bottom-8 flex gap-3 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl">
                            <button onClick={() => setIsPausedState(!isPausedState)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-xl shadow-lg">
                                {isPausedState ? <Play fill="currentColor" size={24} /> : <Pause fill="currentColor" size={24} />}
                            </button>
                            <button onClick={() => setShowTacticsModal(true)} className="px-4 h-12 md:h-14 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600 shadow-lg">
                                <Sliders size={20} /> Tactics
                            </button>
                            <button onClick={() => {
                                if (engineRef.current && !isFinishedRef.current) {
                                    isFinishedRef.current = true;
                                    engineRef.current.skipToEnd();
                                    setIsPausedState(true);
                                    onMatchComplete(engineRef.current.homeScore, engineRef.current.awayScore);
                                }
                            }} className="px-4 h-12 md:h-14 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600 shadow-lg">
                                <FastForward fill="currentColor" size={20} /> Skip
                            </button>
                        </div>
                    )}

                    {showTacticsModal && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl max-h-[90%] overflow-y-auto shadow-2xl">
                                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Sliders className="text-emerald-400" /> Manage Tactics</h2>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-wider">On Pitch</h3>
                                        <div className="space-y-1">
                                            {liveUserTeam.roster?.filter(p => !p.offField).map(p => (
                                                <div key={p.id} onClick={() => setSelectedSub(prev => ({ ...prev, onFieldId: p.id }))}
                                                    className={`p-2 rounded cursor-pointer text-sm font-medium border ${selectedSub.onFieldId === p.id ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                                    {p.number}. {p.name} <span className="text-slate-400">({p.position})</span> <span className="text-yellow-400 text-xs ml-1">★{p.rating}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-wider">Bench</h3>
                                        <div className="space-y-1">
                                            {liveUserTeam.roster?.filter(p => p.offField).map(p => (
                                                <div key={p.id} onClick={() => setSelectedSub(prev => ({ ...prev, offFieldId: p.id }))}
                                                    className={`p-2 rounded cursor-pointer text-sm font-medium border ${selectedSub.offFieldId === p.id ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                                    {p.number}. {p.name} <span className="text-slate-400">({p.position})</span> <span className="text-yellow-400 text-xs ml-1">★{p.rating}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setShowTacticsModal(false); setSelectedSub({}); }} className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold">Cancel</button>
                                    <button onClick={() => { applySubstitutions(); setShowTacticsModal(false); }} disabled={!selectedSub.onFieldId || !selectedSub.offFieldId}
                                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold">Confirm Sub</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats panel */}
                <div className="w-full lg:w-[400px] bg-slate-900/50 flex flex-col shadow-2xl z-20 flex-1 min-h-0 min-w-0">
                    <div className="border-b border-slate-800/50 bg-slate-800/30 shrink-0">
                        <div className="p-3 md:p-4 border-b border-slate-800/50 flex items-center gap-2 font-bold text-sm md:text-base uppercase tracking-wider">
                            <PieChart size={18} className="text-emerald-400" /> Match Stats
                        </div>
                        <div className="p-4 md:p-5 space-y-4">
                            {/* Possession */}
                            <div>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1.5">
                                    <span className="text-emerald-400">{stats.home.possession}%</span>
                                    <span className="text-slate-400">Possession</span>
                                    <span className="text-blue-400">{stats.away.possession}%</span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
                                    <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${stats.home.possession}%` }} />
                                    <div className="bg-blue-500 transition-all duration-300" style={{ width: `${stats.away.possession}%` }} />
                                </div>
                            </div>
                            {/* Shots */}
                            <div className="flex justify-between items-center text-sm border-t border-slate-800/50 pt-3">
                                <span className="font-bold text-emerald-400 w-10 text-center text-lg">{stats.home.shots}</span>
                                <span className="text-slate-400 text-xs uppercase tracking-widest text-center flex-1">Shots</span>
                                <span className="font-bold text-blue-400 w-10 text-center text-lg">{stats.away.shots}</span>
                            </div>
                            {/* Shots on target */}
                            <div className="flex justify-between items-center text-sm border-t border-slate-800/50 pt-3">
                                <span className="font-bold text-emerald-400 w-10 text-center text-lg">{stats.home.shotsOnTarget}</span>
                                <span className="text-slate-400 text-xs uppercase tracking-widest text-center flex-1">On Target</span>
                                <span className="font-bold text-blue-400 w-10 text-center text-lg">{stats.away.shotsOnTarget}</span>
                            </div>
                        </div>
                    </div>

                    {/* Event log */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">
                        {events.map((ev, i) => {
                            const isGoal = ev.includes('GOAL');
                            const isSave = ev.includes('Save') || ev.includes('Punched');
                            const isShot = ev.includes('Shot');
                            const isOffside = ev.includes('OFFSIDE');
                            return (
                                <div key={i} className="flex gap-3 items-start animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="text-emerald-500/80 font-mono text-xs font-bold pt-1.5 min-w-[35px] text-right">{ev.split(' ')[0]}</div>
                                    <div className={`p-3 rounded-xl text-sm w-full border shadow-sm leading-relaxed ${isGoal ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300 font-black' :
                                            isSave ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' :
                                                isShot ? 'bg-slate-800/80 border-slate-600 text-slate-100 font-medium' :
                                                    isOffside ? 'bg-red-900/20 border-red-700/50 text-red-300' :
                                                        'bg-slate-800/40 border-slate-700/50 text-slate-300'
                                        }`}>
                                        {ev.substring(ev.indexOf(' ') + 1)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchView;