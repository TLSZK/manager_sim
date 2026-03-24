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
    home: { shots: number; possession: number };
    away: { shots: number; possession: number };
}

const HALF_DURATION_REAL_SEC = 30.0;
const MAX_SPEED = 75.0; 
const MAX_FORCE = 300.0;
const FRICTION = 0.92;
const BALL_FRICTION = 0.985;
const PASS_SPEED = 180.0;
const SHOOT_SPEED = 200.0;

const POSITION_ORDER: Record<string, number> = {
    'GK': 1,
    'LB': 2, 'CB': 3, 'RB': 4, 'LWB': 5, 'RWB': 6,
    'CDM': 7, 'CM': 8, 'LM': 9, 'RM': 10, 'CAM': 11,
    'LW': 12, 'RW': 13, 'CF': 14, 'ST': 15
};

class Vector {
    constructor(public x: number, public y: number) {}

    add(v: Vector) { this.x += v.x; this.y += v.y; return this; }
    sub(v: Vector) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n: number) { this.x *= n; this.y *= n; return this; }
    div(n: number) { this.x /= n; this.y /= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }

    normalize() {
        const m = this.mag();
        if (m !== 0) this.div(m);
        return this;
    }

    limit(max: number) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }

    static dist(v1: Vector, v2: Vector) {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }

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
    }

    arrive(target: Vector, speedMult = 1.0): Vector {
        const desired = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        const d = desired.mag();
        desired.normalize();
        
        const ratingFactor = this.rating / 100;
        const ratingPaceMult = 0.2 + Math.pow(ratingFactor, 4) * 2.0; 
        const finalMaxSpeed = MAX_SPEED * speedMult * ratingPaceMult;
        const finalMaxForce = MAX_FORCE * speedMult * ratingPaceMult;

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
    }
}

class GameEngine {
    minute = 0;
    period = 1;
    homeScore = 0;
    awayScore = 0;
    events: string[] = [];
    ball: GameEntity;
    ballOwner: Agent | null = null;
    passTarget: Agent | null = null;
    isShot: boolean = false;
    isLoftedPass: boolean = false;
    isSetPiece: boolean = false;
    isThrowInOrGoalKick: boolean = false;
    offsidePlayersOnPass: Set<string> = new Set();
    players: Agent[] = [];
    state: 'PLAYING' | 'HALFTIME' | 'STOPPED' = 'PLAYING';
    
    private cooldown = 0;
    private stateTimer = 0;
    private lastToucher: Agent | null = null;
    
    homeStats = { shots: 0, possessionTime: 0 };
    awayStats = { shots: 0, possessionTime: 0 };

    constructor(
        public homeTeam: Team,
        public awayTeam: Team,
        private onUpdate: (h: number, a: number, m: number, e: string[], stats: MatchStats) => void,
        private onHalftime: () => void
    ) {
        this.ball = new GameEntity(50, 50);
        this.initPlayers();
        this.setupKickoff(true);
    }

    private triggerUpdate() {
        const total = (this.homeStats.possessionTime + this.awayStats.possessionTime) || 1;
        this.onUpdate(this.homeScore, this.awayScore, Math.floor(this.minute), this.events, {
            home: { shots: this.homeStats.shots, possession: Math.round((this.homeStats.possessionTime / total) * 100) },
            away: { shots: this.awayStats.shots, possession: Math.round((this.awayStats.possessionTime / total) * 100) }
        });
    }

    initPlayers() {
        const createAgents = (team: Team, isHome: boolean) => {
            const formation = FORMATIONS[team.formation || '4-3-3'];
            const onField = [...team.roster!].filter(p => !p.offField);
            
            const usedSlots = new Set<number>();
            return onField.map((p) => {
                let slotIndex = formation.findIndex((f, idx) => f.position === p.position && !usedSlots.has(idx));
                if (slotIndex === -1) slotIndex = formation.findIndex((f, idx) => !usedSlots.has(idx));
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
        if (isHome) this.homeTeam = newTeam;
        else this.awayTeam = newTeam;
        
        const formation = FORMATIONS[newTeam.formation || '4-3-3'];
        const onField = [...newTeam.roster!].filter(p => !p.offField);
        
        const newAgents = onField.map((p) => {
            const usedSlots = new Set<number>();
            let slotIndex = formation.findIndex((f, idx) => f.position === p.position && !usedSlots.has(idx));
            if (slotIndex === -1) slotIndex = formation.findIndex((f, idx) => !usedSlots.has(idx));
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
                existing.basePos = new Vector(bx, by);
                return existing;
            }
            const agent = new Agent(p, newTeam.id, pos.position, isHome, bx, by, effectiveRating);
            
            let spawnX = bx;
            let spawnY = by;
            if (this.period === 2) {
                spawnX = 100 - spawnX;
                spawnY = 100 - spawnY;
            }
            agent.pos = new Vector(spawnX, spawnY);
            return agent;
        });
        
        if (this.ballOwner && this.ballOwner.teamId === newTeam.id && !newAgents.includes(this.ballOwner)) {
            this.ballOwner = null;
        }
        if (this.lastToucher && this.lastToucher.teamId === newTeam.id && !newAgents.includes(this.lastToucher)) {
            this.lastToucher = null;
        }

        this.players = this.players.filter(p => p.teamId !== newTeam.id).concat(newAgents);
        this.events.unshift(`${Math.floor(this.minute)}' Substitution / Tactical change by ${newTeam.shortName}`);
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
            if (this.period === 2) {
                startPos.x = 100 - startPos.x;
                startPos.y = 100 - startPos.y; 
            }
            
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
            const unmirroredA = a.isHome ? a.basePos.x : 100 - a.basePos.x;
            const unmirroredB = b.isHome ? b.basePos.x : 100 - b.basePos.x;
            return unmirroredB - unmirroredA; 
        })[0];

        if (striker) {
            striker.pos = new Vector(50, 50);
            this.ballOwner = striker;
        }
    }

    startSecondHalf() {
        this.period = 2;
        this.events.unshift("45' Second Half Started");
        this.setupKickoff(false);
    }

    isPassLaneOpen(from: Vector, to: Vector, teamId: string): boolean {
        const LANE_THRESHOLD = 4.5;
        const ABx = to.x - from.x;
        const ABy = to.y - from.y;
        const lenSq = ABx * ABx + ABy * ABy;
        
        if (lenSq === 0) return false;

        for (const p of this.players) {
            if (p.teamId === teamId) continue; 
            
            const APx = p.pos.x - from.x;
            const APy = p.pos.y - from.y;
            
            let t = (APx * ABx + APy * ABy) / lenSq;
            t = Math.max(0, Math.min(1, t)); 
            
            const Cx = from.x + t * ABx;
            const Cy = from.y + t * ABy;
            
            const distSq = (p.pos.x - Cx) ** 2 + (p.pos.y - Cy) ** 2;
            
            if (distSq < LANE_THRESHOLD * LANE_THRESHOLD) {
                return false;
            }
        }
        return true;
    }

    isShootingLaneOpen(from: Vector, to: Vector, teamId: string): boolean {
        const LANE_THRESHOLD = 3.0;
        const ABx = to.x - from.x;
        const ABy = to.y - from.y;
        const lenSq = ABx * ABx + ABy * ABy;
        
        if (lenSq === 0) return false;

        for (const p of this.players) {
            if (p.teamId === teamId || p.role === 'GK') continue; 
            
            const APx = p.pos.x - from.x;
            const APy = p.pos.y - from.y;
            
            let t = (APx * ABx + APy * ABy) / lenSq;
            t = Math.max(0, Math.min(1, t)); 
            
            const Cx = from.x + t * ABx;
            const Cy = from.y + t * ABy;
            
            const distSq = (p.pos.x - Cx) ** 2 + (p.pos.y - Cy) ** 2;
            
            if (distSq < LANE_THRESHOLD * LANE_THRESHOLD) {
                return false;
            }
        }
        return true;
    }

    getOffsideLine(attackingTeamId: string, attackingRight: boolean): number {
        const defenders = this.players.filter(p => p.teamId !== attackingTeamId);
        if (attackingRight) {
            defenders.sort((a, b) => b.pos.x - a.pos.x);
            const secondLastX = defenders[1]?.pos.x || 95;
            return Math.max(50, this.ball.pos.x, secondLastX);
        } else {
            defenders.sort((a, b) => a.pos.x - b.pos.x);
            const secondLastX = defenders[1]?.pos.x || 5;
            return Math.min(50, this.ball.pos.x, secondLastX);
        }
    }

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
            if (this.stateTimer <= 0) {
                if (this.ballOwner) {
                    let validMates = this.players.filter(m => m.teamId === this.ballOwner!.teamId && m !== this.ballOwner && Vector.dist(this.ballOwner!.pos, m.pos) <= 65);
                    if (validMates.length === 0) {
                        validMates = this.players.filter(m => m.teamId === this.ballOwner!.teamId && m !== this.ballOwner);
                    }

                    if (validMates.length > 0) {
                        if (this.isSetPiece) {
                            validMates.sort((a, b) => Math.abs(Vector.dist(this.ballOwner!.pos, a.pos) - 40) - Math.abs(Vector.dist(this.ballOwner!.pos, b.pos) - 40));
                            const bestOptions = validMates.slice(0, 3);
                            const mate = bestOptions[Math.floor(Math.random() * bestOptions.length)];
                            this.pass(this.ballOwner, mate);
                        } else {
                            const mate = validMates[Math.floor(Math.random() * validMates.length)];
                            this.pass(this.ballOwner, mate);
                        }
                    }
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

    aiStep(dt: number) {
        const ballPos = this.ball.pos;
        
        const homeDefenders: {player: Agent, dist: number}[] = [];
        const awayDefenders: {player: Agent, dist: number}[] = [];

        this.players.forEach(p => {
            const dist = Vector.dist(p.pos, ballPos);
            if (p.role !== 'GK') {
                if (p.isHome) homeDefenders.push({player: p, dist});
                else awayDefenders.push({player: p, dist});
            }
        });

        homeDefenders.sort((a, b) => a.dist - b.dist);
        awayDefenders.sort((a, b) => a.dist - b.dist);

        const primaryPresserHome = homeDefenders[0]?.player;
        const coverHome = homeDefenders[1]?.player;
        const primaryPresserAway = awayDefenders[0]?.player;
        const coverAway = awayDefenders[1]?.player;

        const possessingTeam = this.ballOwner ? this.ballOwner.teamId : (this.lastToucher ? this.lastToucher.teamId : null);
        const homeAttacksRight = this.period === 1;

        const homeOffsideLine = this.getOffsideLine(this.homeTeam.id, homeAttacksRight);
        const awayOffsideLine = this.getOffsideLine(this.awayTeam.id, !homeAttacksRight);

        this.players.forEach(p => {
            const force = new Vector(0, 0);
            let separation = new Vector(0, 0);
            const isDefending = possessingTeam && possessingTeam !== p.teamId;
            const oppGoalX = p.isHome ? (homeAttacksRight ? 95 : 5) : (homeAttacksRight ? 5 : 95);
            const ownGoalX = p.isHome ? (homeAttacksRight ? 5 : 95) : (homeAttacksRight ? 95 : 5);
            const attackingRight = p.isHome ? homeAttacksRight : !homeAttacksRight;
            
            this.players.forEach(other => {
                if (p !== other && p.role !== 'GK' && other.role !== 'GK') {
                    const dist = Vector.dist(p.pos, other.pos);
                    
                    if (p.teamId === other.teamId) {
                        if (dist < 10.0) {
                            const diff = new Vector(p.pos.x - other.pos.x, p.pos.y - other.pos.y);
                            separation.add(diff.normalize().mult(35.0 / (dist + 0.1)));
                        }
                    } else if (this.ballOwner !== p && this.ballOwner !== other && dist < 3.0) {
                        const diff = new Vector(p.pos.x - other.pos.x, p.pos.y - other.pos.y);
                        separation.add(diff.normalize().mult(10.0 / (dist + 0.1)));
                    }
                }
            });

            const offsideLine = p.isHome ? homeOffsideLine : awayOffsideLine;
            const primaryPresser = p.isHome ? primaryPresserHome : primaryPresserAway;
            const coverDefender = p.isHome ? coverHome : coverAway;

            let currentMoveSpeed = 1.0;

            if (p.role === 'GK') {
                const distToBall = Vector.dist(p.pos, ballPos);
                const diveSpeed = distToBall < 40 ? 1.5 : 1.0;
                
                force.add(p.arrive(new Vector(ownGoalX === 5 ? 7 : 93, Math.max(40, Math.min(60, ballPos.y))), diveSpeed));
                
                if (this.ballOwner === p && this.cooldown <= 0) {
                    if (Math.random() < 2.0 * dt) { 
                        let validMates = this.players.filter(m => m.teamId === p.teamId && m !== p && Vector.dist(p.pos, m.pos) <= 65);
                        if (validMates.length === 0) {
                            validMates = this.players.filter(m => m.teamId === p.teamId && m !== p);
                        }

                        if (validMates.length > 0) {
                            validMates.sort((a, b) => {
                                let spaceA = 50, spaceB = 50;
                                this.players.forEach(def => {
                                    if (def.teamId !== p.teamId) {
                                        spaceA = Math.min(spaceA, Vector.dist(a.pos, def.pos));
                                        spaceB = Math.min(spaceB, Vector.dist(b.pos, def.pos));
                                    }
                                });
                                return spaceB - spaceA; 
                            });
                            this.pass(p, validMates[0]);
                        }
                    }
                }
            } else {
                let targetX = this.period === 2 ? 100 - p.basePos.x : p.basePos.x;
                let targetY = this.period === 2 ? 100 - p.basePos.y : p.basePos.y;
                let target = new Vector(targetX, targetY);

                const unmirroredX = p.isHome ? p.basePos.x : 100 - p.basePos.x;
                let roleType = 'MID';
                if (unmirroredX <= 45) roleType = 'DEF';
                else if (unmirroredX >= 75) roleType = 'FWD';

                const baseY = targetY; 
                const isWide = baseY < 35 || baseY > 65;

                if (!isDefending) {
                    const pushForward = p.isHome === homeAttacksRight ? 35 : -35;
                    target.x += pushForward * (roleType === 'DEF' ? 0.7 : roleType === 'FWD' ? 1.0 : 1.0);
                    
                    if (isWide) {
                        target.y = baseY < 50 ? 15 : 85;
                        target.x += (ballPos.x - 50) * 0.2; 
                    } else {
                        target.x += (ballPos.x - 50) * (roleType === 'DEF' ? 0.3 : roleType === 'FWD' ? 0.6 : 0.5);
                        target.y = baseY + (ballPos.y - 50) * 0.2; 
                    }

                    // CAM Freedom
                    if (p.role === 'CAM') {
                        target.x = this.ballOwner ? this.ballOwner.pos.x + (p.isHome === homeAttacksRight ? 15 : -15) : target.x;
                        if (ballPos.y < 30 || ballPos.y > 70) {
                            target.y += (ballPos.y - target.y) * 0.7;
                        }
                    }

                    // Dynamic Passing Lane Creation
                    if (this.ballOwner && p !== this.ballOwner) {
                        if (!this.isPassLaneOpen(this.ballOwner.pos, p.pos, p.teamId)) {
                            const toPlayer = new Vector(p.pos.x - this.ballOwner.pos.x, p.pos.y - this.ballOwner.pos.y);
                            const perp = new Vector(-toPlayer.y, toPlayer.x).normalize().mult(12.0); 
                            
                            // Move towards center or edge to find space
                            if (p.pos.y > 50) target.y -= Math.abs(perp.y);
                            else target.y += Math.abs(perp.y);
                        }
                    }

                } else {
                    const dropBack = p.isHome === homeAttacksRight ? -10 : 10;
                    target.x += dropBack * (roleType === 'DEF' ? 0.3 : roleType === 'FWD' ? 0.1 : 0.5);
                    
                    if (isWide) {
                        target.y = baseY < 50 ? 25 : 75; 
                    } else {
                        target.y = baseY + (ballPos.y - 50) * 0.2; 
                    }
                    target.x += (ballPos.x - 50) * 0.3;

                    if (roleType === 'DEF') {
                        target.y += (ballPos.y - 50) * 0.6;
                    }

                    // Forwards track back directly behind the ball
                    if (roleType === 'FWD') {
                        const ballLine = ballPos.x + (p.isHome === homeAttacksRight ? -10 : 10);
                        if (p.isHome === homeAttacksRight) {
                             target.x = Math.max(target.x, ballLine); 
                        } else {
                             target.x = Math.min(target.x, ballLine);
                        }
                    }
                }

                if (!isDefending && p !== this.ballOwner) {
                    if (attackingRight) {
                        target.x = Math.min(target.x, offsideLine - 2.0);
                        if (p.pos.x > offsideLine) currentMoveSpeed = 1.5; 
                    } else {
                        target.x = Math.max(target.x, offsideLine + 2.0);
                        if (p.pos.x < offsideLine) currentMoveSpeed = 1.5; 
                    }
                }

                if (roleType === 'DEF' && isDefending) {
                    const boxLine = p.isHome === homeAttacksRight ? 26 : 74;
                    if (p.isHome === homeAttacksRight) {
                        if (target.x < boxLine && ballPos.x > 35) target.x = boxLine;
                    } else {
                        if (target.x > boxLine && ballPos.x < 65) target.x = boxLine;
                    }
                }

                target.x = Math.max(16, Math.min(84, target.x));
                target.y = Math.max(5, Math.min(95, target.y));

                if (this.ballOwner?.teamId === p.teamId) {
                    if (this.ballOwner === p) {
                        const distToGoalX = Math.abs(p.pos.x - oppGoalX);
                        const distToGoal = Vector.dist(p.pos, new Vector(oppGoalX, 50));
                        let driveY = p.pos.y;
                        let driveX = oppGoalX;
                        
                        let closestThreat: Agent | null = null;
                        let closestThreatDist = Infinity;
                        this.players.forEach(def => {
                            if (def.teamId !== p.teamId && def.role !== 'GK') {
                                const distX = (def.pos.x - p.pos.x) * (attackingRight ? 1 : -1);
                                const distY = Math.abs(def.pos.y - p.pos.y);
                                if (distX > -2 && distY < 15) { 
                                    const trueDist = Vector.dist(p.pos, def.pos);
                                    if (trueDist < closestThreatDist) {
                                        closestThreatDist = trueDist;
                                        closestThreat = def;
                                    }
                                }
                            }
                        });

                        const inPenaltyBox = distToGoalX <= 18 && p.pos.y >= 22 && p.pos.y <= 78;

                        if (closestThreatDist < 15 && !inPenaltyBox) {
                            const evadeY = (p.pos.y > closestThreat!.pos.y) ? 1 : -1;
                            const evadeX = attackingRight ? 0.5 : -0.5;
                            const dribbleSkill = p.rating / 100;
                            
                            driveY = p.pos.y + evadeY * 20 * dribbleSkill;
                            driveX = p.pos.x + evadeX * 20;
                            
                            force.add(p.arrive(new Vector(driveX, driveY), 0.85 + (dribbleSkill * 0.15)));
                        } else {
                            if (distToGoalX < 35 && (p.pos.y < 35 || p.pos.y > 65)) {
                                driveY = p.pos.y < 50 ? p.pos.y + 15 : p.pos.y - 15;
                            } else if (distToGoalX > 40) {
                                driveY = baseY; 
                            } else {
                                driveY = 50; 
                            }
                            force.add(p.arrive(new Vector(oppGoalX, driveY), 0.95)); 
                        }
                        
                        if (this.cooldown <= 0) {
                            let shotTaken = false;
                            const ratingMod = Math.pow(p.rating / 100, 2);
                            const isAwfulAngle = distToGoalX < 25 && (p.pos.y < 30 || p.pos.y > 70);
                            
                            const topOpen = this.isShootingLaneOpen(p.pos, new Vector(oppGoalX, 42), p.teamId);
                            const bottomOpen = this.isShootingLaneOpen(p.pos, new Vector(oppGoalX, 58), p.teamId);
                            const centerOpen = this.isShootingLaneOpen(p.pos, new Vector(oppGoalX, 50), p.teamId);
                            const hasClearShot = topOpen || bottomOpen || centerOpen;
                            
                            if (!isAwfulAngle) {
                                if (inPenaltyBox && hasClearShot) {
                                    this.shoot(p);
                                    shotTaken = true;
                                } else if (distToGoal < 40 && hasClearShot) {
                                    const shootProb = (distToGoal < 20 ? 4.0 : (distToGoal < 30 ? 2.0 : 0.5)) * ratingMod;
                                    if (Math.random() < shootProb * dt) {
                                        this.shoot(p);
                                        shotTaken = true;
                                    }
                                }
                            }
                            
                            if (!shotTaken && Math.random() < (5.0 * ratingMod) * dt) {
                                const validMates = this.players.filter(m => m.teamId === p.teamId && m !== p && Vector.dist(p.pos, m.pos) < 55 && Vector.dist(p.pos, m.pos) > 8);
                                const openMates = validMates.filter(m => this.isPassLaneOpen(p.pos, m.pos, p.teamId));
                                
                                if (openMates.length > 0) {
                                    openMates.sort((a, b) => {
                                        const distAGoal = Math.abs(a.pos.x - oppGoalX);
                                        const distBGoal = Math.abs(b.pos.x - oppGoalX);
                                        
                                        let spaceA = 50, spaceB = 50;
                                        this.players.forEach(def => {
                                            if (def.teamId !== p.teamId && def.role !== 'GK') {
                                                spaceA = Math.min(spaceA, Vector.dist(a.pos, def.pos));
                                                spaceB = Math.min(spaceB, Vector.dist(b.pos, def.pos));
                                            }
                                        });
                                        
                                        const randomWeightA = Math.random() * (100 - p.rating);
                                        const randomWeightB = Math.random() * (100 - p.rating);
                                        
                                        return (distAGoal - spaceA * 3.5 + randomWeightA) - (distBGoal - spaceB * 3.5 + randomWeightB);
                                    });
                                    const bestOptions = openMates.slice(0, 2);
                                    const mate = bestOptions[Math.floor(Math.random() * bestOptions.length)];
                                    this.pass(p, mate);
                                }
                            }
                        }
                    } else {
                        force.add(p.arrive(target, 1.0));
                    }
                } else {
                    if (!this.ballOwner && this.passTarget === p) {
                        force.add(p.arrive(ballPos, 1.15));
                    } else if (isDefending && this.ballOwner) {
                        if (p === primaryPresser) {
                            const interceptX = ballPos.x + (ownGoalX > 50 ? -2.5 : 2.5); 
                            let interceptPoint = new Vector(interceptX, ballPos.y);
                            
                            const predictionAccuracy = p.rating / 100;
                            interceptPoint.y += this.ballOwner.vel.y * 0.3 * predictionAccuracy;
                            
                            force.add(p.arrive(interceptPoint, 1.15));
                        } else if (p === coverDefender) {
                            let coverPos = new Vector((ballPos.x + ownGoalX) / 2, ballPos.y);
                            coverPos.x = ballPos.x + (ownGoalX > 50 ? 12 : -12);
                            force.add(p.arrive(coverPos, currentMoveSpeed));
                        } else {
                            force.add(p.arrive(target, currentMoveSpeed));
                        }
                    } else {
                        force.add(p.arrive(target, currentMoveSpeed));
                    }
                }
            }
            force.add(separation);
            p.applyForce(force);
        });
        
        if (this.cooldown > 0) this.cooldown -= dt;
    }

    physicsStep(dt: number) {
        const fpsScale = dt * 60;
        
        if (this.isLoftedPass && this.ball.vel.mag() < 70) {
            this.isLoftedPass = false;
        }

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

    pass(from: Agent, to: Agent) {
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
                if (p.teamId === from.teamId && p !== from) {
                    const isOffside = attackingRight ? (p.pos.x > offsideLine + 0.2) : (p.pos.x < offsideLine - 0.2);
                    if (isOffside) {
                        this.offsidePlayersOnPass.add(p.id);
                    }
                }
            });
        }
        
        this.isSetPiece = false;
        this.isThrowInOrGoalKick = false;

        const ratingFactor = Math.min(100, Math.max(1, from.rating));
        const ratingMultiplier = 0.4 + (ratingFactor / 100) * 0.8;
        const actualPassSpeed = PASS_SPEED * ratingMultiplier;

        const inaccuracyScale = Math.pow((100 - ratingFactor) / 100, 4) * 80.0; 
        
        const targetX = to.pos.x + (Math.random() - 0.5) * inaccuracyScale;
        const targetY = to.pos.y + (Math.random() - 0.5) * inaccuracyScale;

        const dir = new Vector(targetX - from.pos.x, targetY - from.pos.y).normalize();
        this.ball.vel = dir.mult(actualPassSpeed);
        this.cooldown = 0.3;
    }

    shoot(from: Agent) {
        this.ballOwner = null;
        this.lastToucher = from;
        this.passTarget = null;
        this.isShot = true;
        this.isLoftedPass = false;
        this.offsidePlayersOnPass.clear();
        
        if (from.isHome) this.homeStats.shots++;
        else this.awayStats.shots++;
        
        const oppGoalX = from.isHome ? (this.period === 1 ? 95 : 5) : (this.period === 1 ? 5 : 95);
        
        const topCorner = 42;
        const bottomCorner = 58;
        let targetY = 50;

        const topOpen = this.isShootingLaneOpen(from.pos, new Vector(oppGoalX, topCorner), from.teamId);
        const bottomOpen = this.isShootingLaneOpen(from.pos, new Vector(oppGoalX, bottomCorner), from.teamId);
        const accuracy = from.rating / 100;

        if (topOpen && bottomOpen) {
            const gk = this.players.find(p => p.teamId !== from.teamId && p.role === 'GK');
            if (gk) {
                targetY = Math.abs(gk.pos.y - topCorner) > Math.abs(gk.pos.y - bottomCorner) ? topCorner : bottomCorner;
            } else {
                targetY = Math.random() > 0.5 ? topCorner : bottomCorner;
            }
        } else if (topOpen) {
            targetY = topCorner;
        } else if (bottomOpen) {
            targetY = bottomCorner;
        } else {
            targetY = 50 + (Math.random() - 0.5) * 16;
        }

        const distToGoal = Vector.dist(from.pos, new Vector(oppGoalX, 50));

        if (topOpen || bottomOpen) {
             const distPenalty = distToGoal > 25 ? (distToGoal - 25) * 0.5 : 0;
             const missMargin = Math.pow(1 - accuracy, 4) * 100 + distPenalty; 
             targetY += (Math.random() - 0.5) * missMargin;
        }

        const actualShootSpeed = SHOOT_SPEED * (0.7 + (from.rating / 100) * 0.5);
        const dir = new Vector(oppGoalX - from.pos.x, targetY - from.pos.y).normalize();
        
        this.ball.vel = dir.mult(actualShootSpeed);
        this.cooldown = 0.5;
        this.events.unshift(`${Math.floor(this.minute)}' Shot by ${from.name} (${from.isHome ? this.homeTeam.shortName : this.awayTeam.shortName})`);
    }

    checkCollisions() {
        if (!this.ballOwner) {
            let closest: Agent | null = null, minD = 1000;
            this.players.forEach(p => {
                if (this.isLoftedPass && p !== this.passTarget && p.role !== 'GK') return;

                const d = Vector.dist(p.pos, this.ball.pos);
                const threshold = p.role === 'GK' ? 5.0 : 3.5;
                if (d < threshold && d < minD && !(this.lastToucher === p && this.cooldown > 0)) {
                    minD = d;
                    closest = p;
                }
            });
            
            if (closest) {
                if (closest.role === 'GK' && this.lastToucher && this.lastToucher.teamId !== closest.teamId) {
                    if (this.isShot) {
                        const shooterRating = this.lastToucher.rating;
                        const gkRating = closest.rating;
                        
                        const saveScore = Math.pow(gkRating, 5) * Math.random();
                        const shotScore = Math.pow(shooterRating, 5) * Math.random();
                        
                        if (saveScore > shotScore) {
                            this.ballOwner = closest;
                            this.passTarget = null;
                            this.isShot = false;
                            this.isLoftedPass = false;
                            this.state = 'STOPPED';
                            this.stateTimer = 1.0;
                            this.events.unshift(`${Math.floor(this.minute)}' Great Save by ${closest.name}!`);
                        } else {
                            this.ball.vel.mult(0.85); 
                            this.ball.vel.y += (Math.random() - 0.5) * 10;
                            this.cooldown = 0.3; 
                        }
                    } else {
                        this.ballOwner = closest;
                        this.passTarget = null;
                        this.isShot = false;
                        this.isLoftedPass = false;
                    }
                } else if (closest.role !== 'GK' && this.isShot && this.lastToucher && this.lastToucher.teamId !== closest.teamId) {
                    this.ball.vel.mult(-0.5); 
                    this.lastToucher = closest;
                    this.cooldown = 0.2;
                    this.isShot = false;
                } else {
                    let goodTouch = true;
                    if (this.passTarget === closest && closest.role !== 'GK') {
                        const failChance = Math.pow((100 - closest.rating) / 100, 4);
                        if (Math.random() < failChance) goodTouch = false;
                    }

                    if (goodTouch && (this.passTarget === closest || Math.random() < 0.90)) {
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
            this.players.forEach(p => {
                if (!this.ballOwner) return; 
                
                if (p.teamId !== this.ballOwner.teamId && this.ballOwner.role !== 'GK' && Vector.dist(p.pos, this.ballOwner.pos) < 3.5 && this.cooldown <= 0) {
                    
                    const homeAttacksRight = this.period === 1;
                    const attackingDir = this.ballOwner.isHome ? (homeAttacksRight ? 1 : -1) : (homeAttacksRight ? -1 : 1);
                    const isBehind = (this.ballOwner.pos.x - p.pos.x) * attackingDir > 0.5;

                    if (!isBehind) {
                        const tackleScore = p.rating + (Math.random() * 15); 
                        const possessionScore = this.ballOwner.rating + (Math.random() * 15);

                        if (tackleScore > possessionScore + 5) {
                            this.lastToucher = p;
                            this.passTarget = null;
                            
                            if (tackleScore > possessionScore + 15) {
                                this.ballOwner = p;
                                this.cooldown = 1.0; 
                            } else {
                                this.ballOwner = null;
                                this.ball.vel = new Vector((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
                                this.cooldown = 0.5;
                            }
                        } else {
                            this.cooldown = 0.25; 
                        }
                    }
                }
            });
        }

        if (this.ballOwner && this.lastToucher) {
            if (this.ballOwner.teamId === this.lastToucher.teamId) {
                if (this.offsidePlayersOnPass.has(this.ballOwner.id)) {
                    this.state = 'STOPPED';
                    this.stateTimer = 1.5;
                    this.isSetPiece = true;
                    this.isThrowInOrGoalKick = false;
                    this.events.unshift(`${Math.floor(this.minute)}' OFFSIDE! ${this.ballOwner.name}`);
                    
                    const defendingTeamId = this.ballOwner.teamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
                    this.ballOwner = null;
                    this.passTarget = null;
                    this.ball.vel.mult(0);
                    
                    const freeKickTaker = this.players.filter(p => p.teamId === defendingTeamId && p.role !== 'GK')
                                            .sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
                    if (freeKickTaker) {
                        freeKickTaker.pos = this.ball.pos.clone();
                        this.ballOwner = freeKickTaker;
                    }
                    this.offsidePlayersOnPass.clear();
                }
            } else {
                this.offsidePlayersOnPass.clear();
            }
        }
    }

    checkBoundaries() {
        const { x, y } = this.ball.pos;
        if (y > 40 && y < 60) {
            if (x < 5) this.scoreGoal(this.period === 1 ? false : true);
            else if (x > 95) this.scoreGoal(this.period === 1 ? true : false);
            return;
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
                this.ball.pos.y = y < 0 ? 0.5 : 99.5;
            } else { 
                const isHomeGoalLine = this.period === 1 ? x < 50 : x > 50;
                this.ball.pos = new Vector(isHomeGoalLine ? 10 : 90, 50);
                this.events.unshift(`${Math.floor(this.minute)}' Goal Kick`);
            }
            
            this.ball.vel = new Vector(0, 0);
            const teamId = (this.lastToucher?.teamId === this.homeTeam.id) ? this.awayTeam.id : this.homeTeam.id;
            const nearest = this.players
                .filter(p => p.teamId === teamId && p.role !== 'GK')
                .sort((a, b) => Vector.dist(a.pos, this.ball.pos) - Vector.dist(b.pos, this.ball.pos))[0];
                
            if (nearest) {
                nearest.pos = this.ball.pos.clone();
                this.ballOwner = nearest;
            }
        }
    }

    scoreGoal(isHome: boolean) {
        this.state = 'STOPPED';
        this.stateTimer = 1.0;
        this.isShot = false;
        this.isLoftedPass = false;
        this.offsidePlayersOnPass.clear();
        
        let scorer = 'Unknown Player';
        let isOwnGoal = false;
        if (this.lastToucher) {
            scorer = this.lastToucher.name;
            if (this.lastToucher.isHome !== isHome) isOwnGoal = true;
        }

        if (isHome) {
            this.homeScore++;
            this.events.unshift(`${Math.floor(this.minute)}' ${isOwnGoal ? 'OWN GOAL' : 'GOAL'}! ${scorer} (${this.homeTeam.shortName})`);
        } else {
            this.awayScore++;
            this.events.unshift(`${Math.floor(this.minute)}' ${isOwnGoal ? 'OWN GOAL' : 'GOAL'}! ${scorer} (${this.awayTeam.shortName})`);
        }
        this.setupKickoff(!isHome);
        this.triggerUpdate();
    }

    skipToEnd() {
        const remaining = 90 - this.minute;
        if (remaining <= 0) return;
        
        const getTeamStrength = (team: Team) => {
            if (!team.roster || team.roster.length === 0) return team.strength;
            const onFieldPlayers = team.roster.filter(p => !p.offField);
            if (onFieldPlayers.length === 0) return team.strength;
            
            const formation = FORMATIONS[team.formation || '4-3-3'];
            return onFieldPlayers.reduce((sum, p, index) => {
                const slotPos = formation[index]?.position || 'MID';
                return sum + getPenalizedRating(p.rating, p.position, slotPos);
            }, 0) / onFieldPlayers.length;
        };

        const homeStr = getTeamStrength(this.homeTeam);
        const awayStr = getTeamStrength(this.awayTeam);
        
        const diff = (homeStr + 5) - awayStr;
        const hProb = 0.015 + (diff * 0.0006);
        const aProb = 0.015 - (diff * 0.0006);
        
        for (let m = 0; m < remaining; m++) {
            if (Math.random() < hProb) {
                this.homeScore++;
                this.homeStats.shots++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Sim) - ${this.homeTeam.shortName}`);
            }
            if (Math.random() < aProb) {
                this.awayScore++;
                this.awayStats.shots++;
                this.events.unshift(`${Math.floor(this.minute + m)}' GOAL! (Sim) - ${this.awayTeam.shortName}`);
            }
        }
        this.minute = 90;
        this.triggerUpdate();
    }
}

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
    const [stats, setStats] = useState<MatchStats>({ home: { shots: 0, possession: 50 }, away: { shots: 0, possession: 50 } });

    const [showTacticsModal, setShowTacticsModal] = useState(false);
    const [liveUserTeam, setLiveUserTeam] = useState<Team>(userTeamId === homeTeam.id ? homeTeam : awayTeam);
    const [selectedSub, setSelectedSub] = useState<{onFieldId?: string, offFieldId?: string}>({});

    const isPausedRef = useRef(isPausedState || showTacticsModal);
    const isHalftimeRef = useRef(isHalftime);
    const onMatchCompleteRef = useRef(onMatchComplete);

    isPausedRef.current = isPausedState || showTacticsModal;
    isHalftimeRef.current = isHalftime;
    onMatchCompleteRef.current = onMatchComplete;

    const applySubstitutions = () => {
        if (selectedSub.onFieldId && selectedSub.offFieldId) {
            const updatedTeam = {
                ...liveUserTeam,
                roster: liveUserTeam.roster?.map(p => {
                    if (p.id === selectedSub.onFieldId) return { ...p, offField: true };
                    if (p.id === selectedSub.offFieldId) return { ...p, offField: false };
                    return p;
                })
            };
            setLiveUserTeam(updatedTeam);
            setSelectedSub({});
            if (engineRef.current) {
                engineRef.current.applyTacticalChange(updatedTeam, userTeamId === homeTeam.id);
            }
        }
    };

    const draw = useCallback((game: GameEngine) => {
        const cvs = canvasRef.current;
        const ctx = cvs?.getContext('2d');
        if (!cvs || !ctx) return;
        
        const scaleX = cvs.width / 100;
        const scaleY = cvs.height / 100;
        
        ctx.fillStyle = '#166534';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(5 * scaleX, 0, 90 * scaleX, cvs.height);
        
        ctx.beginPath();
        ctx.moveTo(cvs.width / 2, 0);
        ctx.lineTo(cvs.width / 2, cvs.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cvs.width / 2, cvs.height / 2, 9 * scaleX, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeRect(5 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY);
        ctx.strokeRect(80 * scaleX, 20 * scaleY, 15 * scaleX, 60 * scaleY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(0, 40 * scaleY, 5 * scaleX, 20 * scaleY); 
        ctx.fillRect(95 * scaleX, 40 * scaleY, 5 * scaleX, 20 * scaleY); 
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 40 * scaleY, 5 * scaleX, 20 * scaleY); 
        ctx.strokeRect(95 * scaleX, 40 * scaleY, 5 * scaleX, 20 * scaleY);

        game.players.forEach(p => {
            const x = p.pos.x * scaleX;
            const y = p.pos.y * scaleY;
            ctx.fillStyle = p.isHome ? homeTeam.primaryColor : awayTeam.primaryColor;
            
            ctx.beginPath();
            ctx.arc(x, y, 1.67 * scaleX, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = p.isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = p.isHome ? homeTeam.secondaryColor : awayTeam.secondaryColor;
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.number.toString(), x, y);
        });

        const bx = game.ball.pos.x * scaleX;
        const by = game.ball.pos.y * scaleY;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 * scaleX, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }, [homeTeam.primaryColor, awayTeam.primaryColor, homeTeam.secondaryColor, awayTeam.secondaryColor]);

    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new GameEngine(
                homeTeam,
                awayTeam,
                (h, a, m, e, s) => {
                    setScore({ home: h, away: a });
                    setMinute(m);
                    setEvents([...e]);
                    setStats(s);
                },
                () => {
                    setIsHalftime(true);
                    setIsPausedState(true);
                }
            );
        }

        let requestRefId: number;

        const loop = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const dt = Math.min((time - prevTimeRef.current) / 1000, 0.1);
            prevTimeRef.current = time;

            if (
                engineRef.current &&
                !isPausedRef.current &&
                !isHalftimeRef.current &&
                !isFinishedRef.current
            ) {
                engineRef.current.update(dt);
                draw(engineRef.current);
                
                if (engineRef.current.minute >= 90) {
                    isFinishedRef.current = true;
                    setTimeout(() => {
                        onMatchCompleteRef.current(
                            engineRef.current!.homeScore,
                            engineRef.current!.awayScore
                        );
                    }, 1000);
                    return; 
                }
            } else if (engineRef.current) {
                draw(engineRef.current); 
            }
            
            requestRefId = requestAnimationFrame(loop);
        };
        
        requestRefId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRefId);
    }, [draw, homeTeam, awayTeam]); 

    return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-slate-900 to-slate-950 text-white overflow-hidden min-w-0">
            <div className="h-16 md:h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-4 md:px-8 shadow-2xl z-10 shrink-0 min-w-0">
                <div className="flex items-center gap-3 md:gap-6 w-[35%] md:w-1/3 min-w-0">
                    <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-slate-800 rounded-full shadow-lg p-1.5 shrink-0 border border-slate-700">
                        {homeTeam.logoUrl ? <img src={homeTeam.logoUrl} className="w-full h-full object-contain drop-shadow-md" /> : <div className="font-bold text-sm md:text-base">{homeTeam.shortName[0]}</div>}
                    </div>
                    <div className="min-w-0"><div className="text-lg md:text-3xl font-black truncate tracking-tight">{homeTeam.shortName}</div></div>
                    <div className="text-3xl md:text-5xl font-mono font-bold ml-auto shrink-0 text-white drop-shadow-lg">{score.home}</div>
                </div>
                
                <div className="flex flex-col items-center w-[30%] md:w-1/3 px-2 md:px-4 shrink-0">
                    <div className="bg-slate-800/80 px-4 md:px-6 py-1 md:py-2 rounded-xl border border-slate-600/50 mb-1 md:mb-2 shadow-inner">
                        <span className="font-mono font-bold text-sm md:text-xl text-emerald-400">{minute >= 90 ? 'FT' : `${Math.floor(minute)}'`}</span>
                    </div>
                    <div className="w-full max-w-[240px] h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000" style={{ width: `${(minute / 90) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 w-[35%] md:w-1/3 justify-end min-w-0">
                    <div className="text-3xl md:text-5xl font-mono font-bold mr-auto shrink-0 text-white drop-shadow-lg">{score.away}</div>
                    <div className="text-right min-w-0"><div className="text-lg md:text-3xl font-black truncate tracking-tight">{awayTeam.shortName}</div></div>
                    <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-slate-800 rounded-full p-1.5 shrink-0 border border-slate-700 shadow-lg">
                        {awayTeam.logoUrl ? <img src={awayTeam.logoUrl} className="w-full h-full object-contain drop-shadow-md" /> : <div className="font-bold text-sm md:text-base">{awayTeam.shortName[0]}</div>}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
                <div className="w-full lg:flex-1 p-2 md:p-6 flex items-center justify-center relative min-h-[40vh] lg:min-h-0 shrink-0 lg:border-r border-slate-800/50">
                    <canvas ref={canvasRef} width={1000} height={600} className="max-w-full max-h-full aspect-[5/3] bg-[#166534] rounded-lg md:rounded-2xl shadow-2xl border-2 md:border-4 border-slate-800" />
                    
                    {isHalftime && !showTacticsModal && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-lg md:rounded-2xl">
                            <div className="text-3xl md:text-5xl font-black mb-6 tracking-widest text-white drop-shadow-lg">HALFTIME</div>
                            <button onClick={() => { if (engineRef.current) engineRef.current.startSecondHalf(); setIsHalftime(false); setIsPausedState(false); }} className="bg-emerald-600 hover:bg-emerald-500 transition-colors px-6 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                                <RotateCcw size={20} /> Start Second Half
                            </button>
                        </div>
                    )}

                    {!isHalftime && !isFinishedRef.current && !showTacticsModal && (
                        <div className="absolute bottom-4 md:bottom-8 flex gap-3 md:gap-4 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl">
                            <button onClick={() => setIsPausedState(!isPausedState)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-xl shadow-lg">
                                {isPausedState ? <Play fill="currentColor" size={24} /> : <Pause fill="currentColor" size={24} />}
                            </button>
                            <button onClick={() => setShowTacticsModal(true)} className="px-4 h-12 md:h-14 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600 shadow-lg">
                                <Sliders size={20} /> Tactics
                            </button>
                            <button onClick={() => { if (engineRef.current && !isFinishedRef.current) { isFinishedRef.current = true; engineRef.current.skipToEnd(); setIsPausedState(true); onMatchComplete(engineRef.current.homeScore, engineRef.current.awayScore); } }} className="px-4 h-12 md:h-14 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600 shadow-lg">
                                <FastForward fill="currentColor" size={20} /> Skip
                            </button>
                        </div>
                    )}

                    {showTacticsModal && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl max-h-[90%] overflow-y-auto shadow-2xl">
                                <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Sliders className="text-emerald-400"/> Manage Tactics</h2>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-wider">On Pitch (Select to sub out)</h3>
                                        <div className="space-y-1">
                                            {liveUserTeam.roster?.filter(p => !p.offField).map(p => (
                                                <div key={p.id} onClick={() => setSelectedSub(prev => ({ ...prev, onFieldId: p.id }))} 
                                                     className={`p-2 rounded cursor-pointer text-sm font-medium border ${selectedSub.onFieldId === p.id ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                                    {p.number}. {p.name} ({p.position})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-wider">Bench (Select to sub in)</h3>
                                        <div className="space-y-1">
                                            {liveUserTeam.roster?.filter(p => p.offField).map(p => (
                                                <div key={p.id} onClick={() => setSelectedSub(prev => ({ ...prev, offFieldId: p.id }))} 
                                                     className={`p-2 rounded cursor-pointer text-sm font-medium border ${selectedSub.offFieldId === p.id ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                                    {p.number}. {p.name} ({p.position})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setShowTacticsModal(false); setSelectedSub({}); }} className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold transition-colors">Cancel</button>
                                    <button onClick={() => { applySubstitutions(); setShowTacticsModal(false); }} disabled={!selectedSub.onFieldId || !selectedSub.offFieldId} 
                                            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors">Confirm Sub</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[400px] bg-slate-900/50 flex flex-col shadow-2xl z-20 flex-1 min-h-0 min-w-0">
                    <div className="border-b border-slate-800/50 bg-slate-800/30 flex flex-col shrink-0">
                        <div className="p-3 md:p-4 border-b border-slate-800/50 flex items-center gap-2 font-bold text-sm md:text-base uppercase tracking-wider"><PieChart size={18} className="text-emerald-400" /> Match Stats</div>
                        <div className="p-4 md:p-5 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold uppercase mb-1.5"><span className="text-emerald-400">{stats.home.possession}%</span><span className="text-slate-400">Possession</span><span className="text-blue-400">{stats.away.possession}%</span></div>
                                <div className="flex h-2 md:h-2.5 rounded-full overflow-hidden bg-slate-800 border border-slate-700/50"><div className="bg-emerald-500 transition-all duration-300" style={{ width: `${stats.home.possession}%` }}></div><div className="bg-blue-500 transition-all duration-300" style={{ width: `${stats.away.possession}%` }}></div></div>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-slate-800/50 pt-3">
                                <span className="font-bold text-emerald-400 w-10 text-center text-lg">{stats.home.shots}</span><span className="text-slate-400 text-xs uppercase tracking-widest text-center flex-1">Total Shots</span><span className="font-bold text-blue-400 w-10 text-center text-lg">{stats.away.shots}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">
                        {events.map((ev, i) => {
                            const isGoal = ev.includes('GOAL');
                            const isShot = ev.includes('Shot');
                            const isSave = ev.includes('Save');
                            return (
                                <div key={i} className="flex gap-3 items-start animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="text-emerald-500/80 font-mono text-xs font-bold pt-1.5 min-w-[35px] text-right">{ev.split(' ')[0]}</div>
                                    <div className={`p-3 rounded-xl text-sm w-full border shadow-sm leading-relaxed ${
                                        isGoal ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300 font-black' : 
                                        isSave ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' :
                                        isShot ? 'bg-slate-800/80 border-slate-600 text-slate-100 font-medium' : 
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