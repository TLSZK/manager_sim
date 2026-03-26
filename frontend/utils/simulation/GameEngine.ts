import { Vec2 } from './Vec2';
import { Ball } from './Ball';
import { PlayerAgent } from './PlayerAgent';
import {
  MatchPhase, SetPieceType, PlayerState, Role,
  PITCH, HALF_DURATION_SEC, TIME_SCALE,
  PASS_SPEED, SHOOT_SPEED, LOFTED_VZ,
  BALL_PICKUP_R, GK_PICKUP_R, TACKLE_R,
  MatchStats, getRole, deriveAttributes,
} from './types';
import { Team, Player } from '../../types';
import { FORMATIONS, getPenalizedRating } from '../../constants';

// ─────────────────────────────────────────────────────────────────────────────
// GameEngine — orchestrates the full match simulation
// ─────────────────────────────────────────────────────────────────────────────

export class GameEngine {
  // ── Time ───────────────────────────────────────────────────────────────
  minute = 0;
  period = 1;

  // ── Score ──────────────────────────────────────────────────────────────
  homeScore = 0;
  awayScore = 0;

  // ── Phase / set-piece ──────────────────────────────────────────────────
  phase: MatchPhase = MatchPhase.Stopped;
  private setPiece: SetPieceType = SetPieceType.KickOff;
  private setPieceTimer = 0;
  private isThrowInOrGoalKick = false;

  // ── Entities ───────────────────────────────────────────────────────────
  ball: Ball;
  players: PlayerAgent[] = [];

  // ── Possession ─────────────────────────────────────────────────────────
  ballOwner: PlayerAgent | null = null;
  passTarget: PlayerAgent | null = null;
  lastToucher: PlayerAgent | null = null;
  isShot = false;
  private isLoftedPass = false;
  private offsideOnPass = new Set<string>();

  // ── Stats ──────────────────────────────────────────────────────────────
  homeStats = { shots: 0, shotsOnTarget: 0, possessionTime: 0 };
  awayStats = { shots: 0, shotsOnTarget: 0, possessionTime: 0 };
  events: string[] = [];

  // ── Internal ───────────────────────────────────────────────────────────
  private cooldown = 0;
  private gkHoldTimer = 0;
  private momentum = 0;

  // ── Fixed-timestep accumulator (frame-rate independent) ───────────────
  private static readonly STEP = 1 / 60;   // 60 Hz physics
  private accumulator = 0;
  private halftimeFired = false;

  // ── Teams & callbacks ──────────────────────────────────────────────────
  homeTeam: Team;
  awayTeam: Team;
  private onUpdate: (h: number, a: number, m: number, e: string[], s: MatchStats) => void;
  private onHalftime: () => void;

  // ═══════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════

  constructor(
    homeTeam: Team,
    awayTeam: Team,
    onUpdate: (h: number, a: number, m: number, e: string[], s: MatchStats) => void,
    onHalftime: () => void,
  ) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.onUpdate = onUpdate;
    this.onHalftime = onHalftime;
    this.ball = new Ball(PITCH.CENTER_X, PITCH.CENTER_Y);
    this.initPlayers();
    this.setupKickoff(true);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════════════════

  private initPlayers() {
    const create = (team: Team, isHome: boolean): PlayerAgent[] => {
      const formation = FORMATIONS[team.formation || '4-3-3'];
      const onField = [...(team.roster ?? [])].filter(p => !p.offField);
      const used = new Set<number>();
      return onField.map(p => {
        let idx = formation.findIndex((f, i) => f.position === p.position && !used.has(i));
        if (idx === -1) idx = formation.findIndex((_, i) => !used.has(i));
        if (idx === -1) idx = 0;
        used.add(idx);
        const slot = formation[idx];
        const eff = getPenalizedRating(p.rating, p.position, slot.position);
        const yPos = isHome ? slot.y : 100 - slot.y;
        return new PlayerAgent(p, team.id, slot.position, isHome, isHome ? slot.x : 100 - slot.x, yPos, eff);
      });
    };
    this.players = [...create(this.homeTeam, true), ...create(this.awayTeam, false)];
  }

  private setupKickoff(homeStarts: boolean) {
    this.phase = MatchPhase.Stopped;
    this.setPiece = SetPieceType.KickOff;
    this.setPieceTimer = 1.0;
    this.ball.pos.set(PITCH.CENTER_X, PITCH.CENTER_Y);
    this.ball.stop();
    this.ballOwner = null;
    this.lastToucher = null;
    this.passTarget = null;
    this.isShot = false;
    this.isLoftedPass = false;
    this.isThrowInOrGoalKick = false;
    this.offsideOnPass.clear();

    const homeRight = this.period === 1;
    this.players.forEach(p => {
      let sp = p.basePos.clone();
      if (this.period === 2) { sp.x = 100 - sp.x; sp.y = 100 - sp.y; }
      // Compress toward own half for kickoff
      if (p.isHome) {
        sp.x = homeRight ? sp.x * 0.35 + 14 : 100 - ((100 - sp.x) * 0.35 + 14);
      } else {
        sp.x = homeRight ? 100 - ((100 - sp.x) * 0.35 + 14) : sp.x * 0.35 + 14;
      }
      p.pos.copy(sp);
      p.vel.set(0, 0);
      p.acc.set(0, 0);
      p.state = PlayerState.Idle;
    });

    // Place kicker at centre spot
    const atkId = homeStarts ? this.homeTeam.id : this.awayTeam.id;
    const kicker = this.players
      .filter(p => p.teamId === atkId && p.role !== Role.Goalkeeper)
      .sort((a, b) => {
        const ax = a.isHome ? a.basePos.x : 100 - a.basePos.x;
        const bx = b.isHome ? b.basePos.x : 100 - b.basePos.x;
        return bx - ax;
      })[0];
    if (kicker) {
      kicker.pos.set(PITCH.CENTER_X, PITCH.CENTER_Y);
      this.ballOwner = kicker;
      kicker.state = PlayerState.SetPiece;
    }
  }

  startSecondHalf() {
    this.period = 2;
    this.events.unshift("45' Second Half Started");
    this.setupKickoff(false);
  }

  applyTacticalChange(newTeam: Team, isHome: boolean) {
    if (isHome) this.homeTeam = newTeam; else this.awayTeam = newTeam;
    const formation = FORMATIONS[newTeam.formation || '4-3-3'];
    const onField = [...(newTeam.roster ?? [])].filter(p => !p.offField);
    const used = new Set<number>();
    const newAgents = onField.map(p => {
      let idx = formation.findIndex((f, i) => f.position === p.position && !used.has(i));
      if (idx === -1) idx = formation.findIndex((_, i) => !used.has(i));
      if (idx === -1) idx = 0;
      used.add(idx);
      const slot = formation[idx];
      const eff = getPenalizedRating(p.rating, p.position, slot.position);
      const bx = isHome ? slot.x : 100 - slot.x;
      const by = isHome ? slot.y : 100 - slot.y;
      const existing = this.players.find(old => old.id === p.id && old.teamId === newTeam.id);
      if (existing) {
        existing.position = slot.position;
        existing.role = getRole(slot.position);
        existing.rating = eff;
        existing.attrs = deriveAttributes(eff, existing.role);
        existing.basePos.set(bx, by);
        return existing;
      }
      const agent = new PlayerAgent(p, newTeam.id, slot.position, isHome, bx, by, eff);
      const sx = this.period === 2 ? 100 - bx : bx;
      const sy = this.period === 2 ? 100 - by : by;
      agent.pos.set(sx, sy);
      return agent;
    });
    if (this.ballOwner?.teamId === newTeam.id && !newAgents.includes(this.ballOwner)) this.ballOwner = null;
    if (this.lastToucher?.teamId === newTeam.id && !newAgents.includes(this.lastToucher)) this.lastToucher = null;
    this.players = this.players.filter(p => p.teamId !== newTeam.id).concat(newAgents);
    this.events.unshift(`${Math.floor(this.minute)}' Tactical change – ${newTeam.shortName}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN LOOP
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Called every animation frame with the raw wall-clock delta.
   * Internally runs fixed-size simulation steps so behaviour is
   * identical on 60 Hz, 144 Hz, or any other refresh rate.
   */
  update(rawDt: number) {
    if (this.minute >= 90) return;

    this.accumulator += Math.min(rawDt, 0.1); // cap to avoid spiral of death

    while (this.accumulator >= GameEngine.STEP) {
      this.tick(GameEngine.STEP);
      this.accumulator -= GameEngine.STEP;
      // Stop consuming steps if match paused by halftime / full-time
      if (this.phase === MatchPhase.Halftime || this.minute >= 90) {
        this.accumulator = 0;
        break;
      }
    }

    // Fire React callbacks once per frame (not per tick)
    this.triggerUpdate();

    if (this.phase === MatchPhase.Halftime && !this.halftimeFired) {
      this.halftimeFired = true;
      this.onHalftime();
    }
  }

  /** Single deterministic simulation step at fixed dt. */
  private tick(dt: number) {
    // Advance game clock
    if (this.phase === MatchPhase.Playing || this.phase === MatchPhase.Stopped) {
      this.minute += dt * TIME_SCALE;
      if (this.ballOwner) {
        (this.ballOwner.isHome ? this.homeStats : this.awayStats).possessionTime += dt;
      }
      if (this.period === 1 && this.minute >= 45) {
        this.phase = MatchPhase.Halftime;
        this.events.unshift("45' Halftime");
        return;
      }
    }

    // Set-piece countdown
    if (this.phase === MatchPhase.Stopped) {
      this.setPieceTimer -= dt;
      if (this.setPieceTimer <= 0 && this.ballOwner) {
        this.executeSetPiece();
        this.phase = MatchPhase.Playing;
      }
      this.physicsStep(dt);
      return;
    }

    // Normal play
    if (this.phase === MatchPhase.Playing) {
      this.aiStep(dt);
      this.physicsStep(dt);
      this.checkCollisions();
      this.checkBoundaries();
    }
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

  // ═══════════════════════════════════════════════════════════════════════
  // SET-PIECE EXECUTION
  // ═══════════════════════════════════════════════════════════════════════

  private executeSetPiece() {
    if (!this.ballOwner) return;
    const maxDist = this.isThrowInOrGoalKick && this.ballOwner.role !== Role.Goalkeeper ? 28 : 100;
    const mates = this.players.filter(m =>
      m.teamId === this.ballOwner!.teamId && m !== this.ballOwner &&
      Vec2.dist(m.pos, this.ballOwner!.pos) < maxDist,
    );
    const fallback = this.players.filter(m => m.teamId === this.ballOwner!.teamId && m !== this.ballOwner);
    const targets = mates.length > 0 ? mates : fallback;
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      const lofted = this.setPiece === SetPieceType.Corner || this.setPiece === SetPieceType.GoalKick;
      this.executePass(this.ballOwner, target, lofted);
    }
    this.isThrowInOrGoalKick = false;
    this.setPiece = SetPieceType.None;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AI — COORDINATOR
  // ═══════════════════════════════════════════════════════════════════════

  private aiStep(dt: number) {
    const homeRight = this.period === 1;
    const possTeam = this.ballOwner?.teamId ?? this.lastToucher?.teamId ?? null;
    const homeOff = this.getOffsideLine(this.homeTeam.id, homeRight);
    const awayOff = this.getOffsideLine(this.awayTeam.id, !homeRight);

    // Determine closest-to-ball pressers per team
    const ballPos = this.ball.pos;
    const homeField = this.players.filter(p => p.isHome && p.role !== Role.Goalkeeper)
      .sort((a, b) => Vec2.dist(a.pos, ballPos) - Vec2.dist(b.pos, ballPos));
    const awayField = this.players.filter(p => !p.isHome && p.role !== Role.Goalkeeper)
      .sort((a, b) => Vec2.dist(a.pos, ballPos) - Vec2.dist(b.pos, ballPos));
    const homePressers = homeField.slice(0, 2);
    const awayPressers = awayField.slice(0, 2);

    for (const p of this.players) {
      const force = new Vec2(0, 0);
      const isDefending = possTeam !== null && possTeam !== p.teamId;
      const atkRight = p.isHome ? homeRight : !homeRight;
      const oppGoalX = atkRight ? PITCH.RIGHT : PITCH.LEFT;
      const ownGoalX = atkRight ? PITCH.LEFT : PITCH.RIGHT;
      const offLine = p.isHome ? homeOff : awayOff;
      const pressers = p.isHome ? homePressers : awayPressers;

      // ── Dispatch to role-specific AI ─────────────────────────────────
      if (p.role === Role.Goalkeeper) {
        this.aiGoalkeeper(p, dt, force, atkRight, ownGoalX);
      } else if (this.ballOwner === p) {
        p.state = PlayerState.Dribbling;
        this.aiBallCarrier(p, dt, force, atkRight, oppGoalX);
      } else if (!this.ballOwner && this.passTarget === p) {
        p.state = PlayerState.Receiving;
        force.add(p.arrive(ballPos, 1.25));
      } else if (isDefending) {
        this.aiDefending(p, dt, force, pressers, atkRight, oppGoalX, ownGoalX, offLine);
      } else {
        this.aiAttacking(p, dt, force, atkRight, oppGoalX, ownGoalX, offLine);
      }

      // Separation (teammates tighter, opponents looser)
      const sepR = p.teamId === possTeam ? 10 : 6;
      force.add(p.separate(this.players, sepR));

      p.applyForce(force);
    }

    if (this.cooldown > 0) this.cooldown -= dt;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AI — GOALKEEPER
  // ═══════════════════════════════════════════════════════════════════════

  private aiGoalkeeper(p: PlayerAgent, dt: number, force: Vec2, atkRight: boolean, ownGoalX: number) {
    if (this.ballOwner === p) {
      // ── GK holding ball: distribute ──────────────────────────────────
      p.state = PlayerState.GKHold;
      if (this.cooldown <= 0) {
        this.gkHoldTimer += dt;
        const openMates = this.players
          .filter(m => m.teamId === p.teamId && m !== p && this.isPassLaneOpen(p.pos, m.pos, p.teamId))
          .sort((a, b) => {
            const sa = this.players.filter(d => d.teamId !== p.teamId && Vec2.dist(a.pos, d.pos) < 15).length;
            const sb = this.players.filter(d => d.teamId !== p.teamId && Vec2.dist(b.pos, d.pos) < 15).length;
            return sa - sb;
          });
        if (openMates.length > 0 && Math.random() < 2.5 * dt) {
          this.executePass(p, openMates[0], false);
          this.gkHoldTimer = 0;
        } else if (this.gkHoldTimer > 3.0) {
          const any = this.players.filter(m => m.teamId === p.teamId && m !== p);
          if (any.length > 0) {
            this.executePass(p, any[Math.floor(Math.random() * any.length)], true);
            this.gkHoldTimer = 0;
          }
        }
      }
    } else {
      // ── GK positioning ───────────────────────────────────────────────
      p.state = PlayerState.GKPosition;
      this.gkHoldTimer = 0;
      const lineX = atkRight ? PITCH.LEFT + 1 : PITCH.RIGHT - 1;
      const tgtY = Math.max(PITCH.GOAL_TOP, Math.min(PITCH.GOAL_BOTTOM, this.ball.pos.y));
      const distBall = Vec2.dist(p.pos, this.ball.pos);
      const x = distBall < 30 ? (atkRight ? lineX + 4 : lineX - 4) : lineX;
      force.add(p.arrive(new Vec2(x, tgtY), 1.3));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AI — BALL CARRIER
  // ═══════════════════════════════════════════════════════════════════════

  private aiBallCarrier(p: PlayerAgent, dt: number, force: Vec2, atkRight: boolean, oppGoalX: number) {
    const goalCenter = new Vec2(oppGoalX, PITCH.CENTER_Y);
    const distGoal = Vec2.dist(p.pos, goalCenter);
    const distGoalX = Math.abs(p.pos.x - oppGoalX);

    // Threats nearby (outfield defenders only)
    const threats = this.players
      .filter(d => d.teamId !== p.teamId && d.role !== Role.Goalkeeper)
      .map(d => ({ agent: d, dist: Vec2.dist(d.pos, p.pos) }))
      .filter(t => t.dist < 14)
      .sort((a, b) => a.dist - b.dist);
    const nearest = threats[0];
    const underPressure = nearest != null && nearest.dist < 6;

    // ── 1v1 detection: only the GK between carrier and goal ─────────
    const outfieldBetween = this.players.filter(d => {
      if (d.teamId === p.teamId || d.role === Role.Goalkeeper) return false;
      const between = atkRight
        ? d.pos.x > p.pos.x && d.pos.x < oppGoalX
        : d.pos.x < p.pos.x && d.pos.x > oppGoalX;
      if (!between) return false;
      // Must be roughly in the path (not out wide)
      return Math.abs(d.pos.y - p.pos.y) < 18;
    });
    const isOneOnOne = outfieldBetween.length === 0 && distGoalX < 40;

    if (this.cooldown <= 0) {
      if (isOneOnOne) {
        // ── 1v1 behaviour: dribble into close range, then shoot ─────
        // Real-life: players in a 1v1 carry the ball to ~8-12 yards
        // before shooting. Only shoot if inside penalty area.
        if (distGoalX <= PITCH.PEN_DEPTH) {
          // Close enough — take the shot with high confidence
          if (this.tryShoot(p, distGoal, distGoalX, oppGoalX, dt)) return;
        }
        // Otherwise keep dribbling toward goal (skip passing — we're through!)
      } else {
        // Normal possession: shoot → through ball → pass
        if (this.tryShoot(p, distGoal, distGoalX, oppGoalX, dt)) return;
        if (this.tryThroughBall(p, atkRight, dt)) return;
        if (this.tryPass(p, oppGoalX, underPressure, dt)) return;
      }
    }

    // ── Movement: 1v1 sprint vs normal dribble ──────────────────────
    if (isOneOnOne) {
      // Sprint directly at goal — carrier should get as close as possible
      // Aim slightly off-centre from GK to open up the angle
      const gk = this.players.find(d => d.teamId !== p.teamId && d.role === Role.Goalkeeper);
      let targetY = PITCH.CENTER_Y;
      if (gk && distGoalX > PITCH.SIX_DEPTH) {
        // Drift to the side opposite the GK to create a better angle
        const gkOffset = gk.pos.y - PITCH.CENTER_Y;
        targetY = PITCH.CENTER_Y - gkOffset * 0.4;
      }
      force.add(p.seek(new Vec2(oppGoalX, targetY), 1.5));
      return;
    }

    // ── Check for a clear forward cone to goal ──────────────────────
    const coneHalfAngle = 0.35; // ~20 degrees
    const toGoal = Vec2.sub(goalCenter, p.pos);
    const goalAngle = Math.atan2(toGoal.y, toGoal.x);
    const clearCone = !this.players.some(d => {
      if (d.teamId === p.teamId || d.role === Role.Goalkeeper) return false;
      const toD = Vec2.sub(d.pos, p.pos);
      const dd = toD.length();
      if (dd < 1 || dd > distGoal) return false;
      const ahead = atkRight ? d.pos.x > p.pos.x : d.pos.x < p.pos.x;
      if (!ahead) return false;
      const angle = Math.atan2(toD.y, toD.x);
      let diff = angle - goalAngle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return Math.abs(diff) < coneHalfAngle;
    });

    if (clearCone && distGoalX < 40) {
      force.add(p.seek(goalCenter, 1.45));
      return;
    }

    // ── Normal dribble with evasion ─────────────────────────────────
    let driveY = p.pos.y;
    if (underPressure) {
      const evadeDir = p.pos.y > nearest.agent.pos.y ? 1 : -1;
      driveY = p.pos.y + evadeDir * 18 * p.attrs.dribbleSkill;
    }

    const fwdX = atkRight ? p.pos.x + 25 : p.pos.x - 25;
    const clearPath = !this.players.some(d =>
      d.teamId !== p.teamId && d.role !== Role.Goalkeeper &&
      (atkRight ? d.pos.x > p.pos.x && d.pos.x < fwdX : d.pos.x < p.pos.x && d.pos.x > fwdX) &&
      Math.abs(d.pos.y - p.pos.y) < 14,
    );
    const speed = underPressure ? 0.75 : clearPath ? 1.35 : 0.95;
    force.add(p.arrive(new Vec2(oppGoalX, driveY), speed));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AI — DEFENDING
  // ═══════════════════════════════════════════════════════════════════════

  private aiDefending(
    p: PlayerAgent, dt: number, force: Vec2,
    pressers: PlayerAgent[], atkRight: boolean,
    oppGoalX: number, ownGoalX: number, offLine: number,
  ) {
    const ballPos = this.ball.pos;

    if (pressers[0] === p) {
      // Primary presser
      p.state = PlayerState.Pressing;
      const intensity = 1.0 + p.attrs.tackleSkill * 0.3;
      force.add(p.arrive(new Vec2(
        ballPos.x + (ownGoalX > 50 ? -3 : 3), ballPos.y,
      ), intensity));
    } else if (pressers[1] === p) {
      // Cover player — block passing lane
      p.state = PlayerState.Covering;
      const coverX = ballPos.x + (ownGoalX > 50 ? 14 : -14);
      force.add(p.arrive(new Vec2(coverX, ballPos.y), 1.0));
    } else {
      // Positional defending
      const target = this.getDefensiveTarget(p, atkRight, ownGoalX);
      if (p.roleType === 'DEF' || Vec2.dist(p.pos, target) > 20) {
        p.state = PlayerState.TrackingBack;
        force.add(p.arrive(target, 1.1));
      } else {
        p.state = PlayerState.Positioning;
        force.add(p.arrive(target, 0.9));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AI — ATTACKING (off-ball)
  // ═══════════════════════════════════════════════════════════════════════

  private aiAttacking(
    p: PlayerAgent, dt: number, force: Vec2,
    atkRight: boolean, oppGoalX: number, ownGoalX: number, offLine: number,
  ) {
    // Decay active run
    if (p.runTimer > 0) {
      p.runTimer -= dt;
      if (p.runTimer <= 0) p.runTarget = null;
    }

    // ── FWD half-space exploitation ───────────────────────────────────
    // Attackers look for the channels between CBs and fullbacks
    if (p.roleType === 'FWD' && !p.runTarget && Math.random() < 0.18 * dt) {
      // Half-space y-zones: between CB (~50) and fullbacks (~30 or ~70)
      const halfSpaces = [33, 67]; // left & right half-space channels
      const bestY = halfSpaces.reduce((best, hy) =>
        Math.abs(hy - p.pos.y) < Math.abs(best - p.pos.y) ? hy : best,
      );
      // Find gaps — look for space between defenders at this y-zone
      const defenders = this.players.filter(d =>
        d.teamId !== p.teamId && d.role !== Role.Goalkeeper &&
        Math.abs(d.pos.y - bestY) < 15,
      );
      const defX = defenders.length > 0
        ? defenders.reduce((sum, d) => sum + d.pos.x, 0) / defenders.length
        : (atkRight ? 75 : 25);
      // Target the space behind/between the defensive line
      const runX = atkRight
        ? Math.min(oppGoalX - 8, defX + 6)
        : Math.max(oppGoalX + 8, defX - 6);
      p.runTarget = new Vec2(
        Math.max(10, Math.min(90, runX)),
        bestY + (Math.random() - 0.5) * 12,
      );
      p.runTimer = 2.0 + Math.random() * 2.0;
    }

    // ── General off-ball runs (MID & FWD) ────────────────────────────
    if (p.roleType !== 'DEF' && !p.runTarget && Math.random() < 0.10 * dt) {
      const depth = atkRight
        ? Math.min(oppGoalX - 5, this.ball.pos.x + 8 + Math.random() * 22)
        : Math.max(oppGoalX + 5, this.ball.pos.x - 8 - Math.random() * 22);
      p.runTarget = new Vec2(Math.max(10, Math.min(90, depth)), 20 + Math.random() * 60);
      p.runTimer = 1.8 + Math.random() * 2.0;
    }

    let target: Vec2;
    if (p.runTarget) {
      p.state = PlayerState.SeekingSpace;
      target = p.runTarget.clone();
    } else {
      p.state = PlayerState.Positioning;
      target = this.getAttackingTarget(p, atkRight, oppGoalX);
    }

    // ── Offside awareness ────────────────────────────────────────────
    // Only restrict players who are BOTH:
    //   (a) without the ball (ball carrier handled by aiBallCarrier, not here)
    //   (b) ahead of the ball's current x-coordinate
    const ballX = this.ball.pos.x;
    const isAheadOfBall = atkRight ? p.pos.x > ballX + 1 : p.pos.x < ballX - 1;

    if (isAheadOfBall) {
      if (p.state === PlayerState.SeekingSpace) {
        // Running players hold exactly on the offside line until pass is played
        if (atkRight && offLine > 52) {
          target.x = Math.min(target.x, offLine - 0.5); // ride the line
          if (p.pos.x > offLine + 0.5) {
            force.add(p.arrive(new Vec2(offLine - 1, p.pos.y), 2.0));
          }
        } else if (!atkRight && offLine < 48) {
          target.x = Math.max(target.x, offLine + 0.5);
          if (p.pos.x < offLine - 0.5) {
            force.add(p.arrive(new Vec2(offLine + 1, p.pos.y), 2.0));
          }
        }
      } else {
        // Positioning players stay comfortably onside
        if (atkRight && offLine > 52) {
          target.x = Math.min(target.x, offLine - 2);
          if (p.pos.x > offLine) force.add(p.arrive(new Vec2(offLine - 3, p.pos.y), 1.8));
        } else if (!atkRight && offLine < 48) {
          target.x = Math.max(target.x, offLine + 2);
          if (p.pos.x < offLine) force.add(p.arrive(new Vec2(offLine + 3, p.pos.y), 1.8));
        }
      }
    }
    // Players behind the ball are never offside — no restriction applied

    const spd = p.state === PlayerState.SeekingSpace ? 1.3 : 0.9;
    force.add(p.arrive(target, spd));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FORMATION TARGETS
  // ═══════════════════════════════════════════════════════════════════════

  private getAttackingTarget(p: PlayerAgent, atkRight: boolean, oppGoalX: number): Vec2 {
    let bx = this.period === 2 ? 100 - p.basePos.x : p.basePos.x;
    let by = this.period === 2 ? 100 - p.basePos.y : p.basePos.y;
    const isWide = by < 35 || by > 65;

    const push = 35 * (0.7 + p.attrs.positioning * 0.5);
    const mult = p.roleType === 'DEF' ? 0.6 : p.roleType === 'FWD' ? 1.0 : 0.85;

    if (atkRight) bx = Math.min(oppGoalX - 5, bx + push * mult);
    else bx = Math.max(oppGoalX + 5, bx - push * mult);

    // Ball tracking
    bx += (this.ball.pos.x - 50) * (p.roleType === 'FWD' ? 0.55 : 0.35);
    if (isWide) {
      by = by < 50 ? 14 : 86;
    } else {
      by += (this.ball.pos.y - 50) * 0.2;
    }

    return new Vec2(Math.max(10, Math.min(90, bx)), Math.max(5, Math.min(95, by)));
  }

  private getDefensiveTarget(p: PlayerAgent, atkRight: boolean, ownGoalX: number): Vec2 {
    let bx = this.period === 2 ? 100 - p.basePos.x : p.basePos.x;
    let by = this.period === 2 ? 100 - p.basePos.y : p.basePos.y;
    const isWide = by < 35 || by > 65;

    if (p.roleType === 'DEF') {
      const depth = 22;
      if (atkRight) bx = Math.max(ownGoalX + 10, Math.min(48, this.ball.pos.x - depth));
      else bx = Math.min(ownGoalX - 10, Math.max(52, this.ball.pos.x + depth));
    } else {
      const drop = p.roleType === 'FWD' ? 0.08 : 0.45;
      if (atkRight) bx = Math.max(ownGoalX + 5, bx - 10 * drop);
      else bx = Math.min(ownGoalX - 5, bx + 10 * drop);
    }

    by += (this.ball.pos.y - 50) * (p.roleType === 'DEF' ? 0.55 : 0.25);

    if (p.roleType === 'DEF' && !isWide) {
      const boxLine = atkRight ? 26 : 74;
      if (atkRight && bx < boxLine) bx = boxLine;
      else if (!atkRight && bx > boxLine) bx = boxLine;
    }

    return new Vec2(Math.max(10, Math.min(90, bx)), Math.max(5, Math.min(95, by)));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHOOTING
  // ═══════════════════════════════════════════════════════════════════════

  private tryShoot(p: PlayerAgent, _distGoal: number, distGoalX: number, oppGoalX: number, dt: number): boolean {
    const offCentre = Math.abs(p.pos.y - PITCH.CENTER_Y);

    // Real-life: almost no goals from extreme angles
    if (distGoalX < 20 && (p.pos.y < 25 || p.pos.y > 75)) return false;

    const topOpen = this.isShootingLaneOpen(p.pos, new Vec2(oppGoalX, PITCH.GOAL_TOP + 1), p.teamId);
    const botOpen = this.isShootingLaneOpen(p.pos, new Vec2(oppGoalX, PITCH.GOAL_BOTTOM - 1), p.teamId);
    if (!topOpen && !botOpen) return false;

    // ── Zone-based shooting decision (real-life xG-inspired) ─────────
    // 6-yard box: shoot immediately
    const inSixYard = distGoalX <= PITCH.SIX_DEPTH && p.pos.y >= PITCH.SIX_TOP && p.pos.y <= PITCH.SIX_BOTTOM;
    if (inSixYard) {
      this.executeShot(p, oppGoalX, topOpen, botOpen);
      return true;
    }

    // Penalty area: high willingness to shoot
    const inBox = distGoalX <= PITCH.PEN_DEPTH && p.pos.y >= PITCH.PEN_TOP && p.pos.y <= PITCH.PEN_BOTTOM;
    if (inBox) {
      // Shoot readily from inside the box — higher rate for better shooters
      const rate = (3.0 + p.attrs.shotAccuracy * 8.0) * dt;
      if (Math.random() < rate) {
        this.executeShot(p, oppGoalX, topOpen, botOpen);
        return true;
      }
      return false;
    }

    // Edge of box (14–22 units from goal): occasional long shot
    if (distGoalX <= 22 && offCentre < 22) {
      const rate = 0.8 * p.attrs.shotAccuracy * dt;
      if (Math.random() < rate) {
        this.executeShot(p, oppGoalX, topOpen, botOpen);
        return true;
      }
    }

    // Beyond 22 units: very rare speculative effort (real-life ~3% conversion)
    if (distGoalX <= 30 && distGoalX > 22 && offCentre < 15 && p.attrs.shotPower > 0.6) {
      const rate = 0.15 * p.attrs.shotAccuracy * dt;
      if (Math.random() < rate) {
        this.executeShot(p, oppGoalX, topOpen, botOpen);
        return true;
      }
    }

    // No shots from beyond 30 units — unrealistic
    return false;
  }

  private executeShot(p: PlayerAgent, oppGoalX: number, topOpen: boolean, botOpen: boolean) {
    this.ballOwner = null;
    this.lastToucher = p;
    this.passTarget = null;
    this.isShot = true;
    this.isLoftedPass = false;
    this.offsideOnPass.clear();
    (p.isHome ? this.homeStats : this.awayStats).shots++;

    const { GOAL_TOP: GT, GOAL_BOTTOM: GB, GOAL_CENTER: GC } = PITCH;
    const distGoalX = Math.abs(p.pos.x - oppGoalX);

    // ── Angle factor (0–1): how central the shooter is ───────────────
    const offCentre = Math.abs(p.pos.y - GC);
    const angleFactor = Math.max(0.1, 1 - offCentre / 30);

    // ── Pressure: defenders closing in ──────────────────────────────
    const pressure = this.players.filter(d =>
      d.teamId !== p.teamId && d.role !== Role.Goalkeeper && Vec2.dist(d.pos, p.pos) < 7,
    ).length;
    const pressFactor = Math.max(0.3, 1 - pressure * 0.15);

    // ── Distance factor: realistic xG curve ─────────────────────────
    // Real data: ~45% conversion in 6-yard box, ~12% in box, ~3% edge, ~1.5% long range
    let distFactor: number;
    if (distGoalX <= PITCH.SIX_DEPTH) {
      distFactor = 1.0;          // point-blank
    } else if (distGoalX <= PITCH.PEN_DEPTH) {
      distFactor = 0.75 + 0.25 * (1 - (distGoalX - PITCH.SIX_DEPTH) / (PITCH.PEN_DEPTH - PITCH.SIX_DEPTH));
    } else if (distGoalX <= 22) {
      distFactor = 0.40;         // edge of box
    } else {
      distFactor = 0.20;         // long range
    }

    const quality = Math.min(1, p.attrs.shotAccuracy * angleFactor * pressFactor * distFactor);

    // ── Target: aim away from GK ────────────────────────────────────
    const gk = this.players.find(d => d.teamId !== p.teamId && d.role === Role.Goalkeeper);
    let targetY: number;
    if (topOpen && botOpen) {
      targetY = gk
        ? (Math.abs(gk.pos.y - GT) > Math.abs(gk.pos.y - GB) ? GT + 2 : GB - 2)
        : (Math.random() > 0.5 ? GT + 2 : GB - 2);
    } else if (topOpen) { targetY = GT + 2; }
    else if (botOpen) { targetY = GB - 2; }
    else { targetY = GC + (Math.random() - 0.5) * (GB - GT); }

    // ── Spread: scales with quality AND distance ────────────────────
    // Close range = tight, long range = wild. Quality tames spread.
    const baseSpread = distGoalX <= PITCH.SIX_DEPTH ? 3
      : distGoalX <= PITCH.PEN_DEPTH ? 8
      : distGoalX <= 22 ? 14
      : 22;
    const spread = baseSpread * (1 - quality * 0.7);
    targetY = Math.max(GT - 3, Math.min(GB + 3, targetY + (Math.random() - 0.5) * spread));
    const spreadX = (Math.random() - 0.5) * spread * 0.15;

    const power = SHOOT_SPEED * (0.75 + p.attrs.shotPower * 0.45) * p.staminaFactor;
    const target = new Vec2(oppGoalX + spreadX, targetY);
    this.ball.kick(target, power, distGoalX > 22 ? 3 : 0);
    this.cooldown = 0.45;

    const onTarget = targetY >= GT && targetY <= GB;
    if (onTarget) (p.isHome ? this.homeStats : this.awayStats).shotsOnTarget++;

    const teamName = p.isHome ? this.homeTeam.shortName : this.awayTeam.shortName;
    this.events.unshift(`${Math.floor(this.minute)}' Shot${onTarget ? ' (on target)' : ''} by ${p.name} (${teamName})`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PASSING
  // ═══════════════════════════════════════════════════════════════════════

  private tryThroughBall(p: PlayerAgent, atkRight: boolean, dt: number): boolean {
    const opps = this.players.filter(d => d.teamId !== p.teamId && d.role !== Role.Goalkeeper);
    const oppGoalX = atkRight ? PITCH.RIGHT : PITCH.LEFT;

    // Evaluate all potential through-ball targets and score them
    const candidates: { mate: PlayerAgent; score: number }[] = [];
    for (const m of this.players) {
      if (m.teamId !== p.teamId || m === p) continue;
      const ahead = atkRight ? m.pos.x > p.pos.x + 5 : m.pos.x < p.pos.x - 5;
      if (!ahead) continue;
      const d = Vec2.dist(p.pos, m.pos);
      if (d < 12 || d > 55) continue;

      // Space around target — no close markers
      const nearestOpp = Math.min(...opps.map(o => Vec2.dist(o.pos, m.pos)));
      if (nearestOpp < 8) continue;

      // Count defenders between target and goal (fewer = better through ball)
      const behindCount = opps.filter(o =>
        atkRight ? o.pos.x > m.pos.x : o.pos.x < m.pos.x,
      ).length;
      if (behindCount >= 2) continue; // still well covered, not a through ball opportunity

      // Must be a running player or an attacker positioned high
      const isRunning = m.state === PlayerState.SeekingSpace;
      const isHighAttacker = m.roleType === 'FWD' && Math.abs(m.pos.x - oppGoalX) < 35;

      // Score: proximity to goal + space + running bonus
      const goalProximity = 50 - Math.abs(m.pos.x - oppGoalX);
      let score = goalProximity + nearestOpp * 1.5;
      if (isRunning) score += 20; // big bonus for timed runs
      if (isHighAttacker) score += 10;
      // Penalty for being too wide (through balls should target central/half-space areas)
      const centralness = 1 - Math.abs(m.pos.y - PITCH.CENTER_Y) / 40;
      score += centralness * 8;

      candidates.push({ mate: m, score });
    }

    if (candidates.length === 0) return false;

    // Pick the best candidate
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (Math.random() < 4.0 * p.attrs.vision * dt) {
      this.executePass(p, best.mate, true);
      return true;
    }
    return false;
  }

  private tryPass(p: PlayerAgent, oppGoalX: number, underPressure: boolean, dt: number): boolean {
    const atkRight = (oppGoalX > 50);
    const opps = this.players.filter(d => d.teamId !== p.teamId && d.role !== Role.Goalkeeper);

    const mates = this.players.filter(m =>
      m.teamId === p.teamId && m !== p &&
      Vec2.dist(p.pos, m.pos) > 6 && Vec2.dist(p.pos, m.pos) < 60 &&
      this.isPassLaneOpen(p.pos, m.pos, p.teamId),
    );
    if (mates.length === 0) return false;

    // Progressive pass weighting (Expected Threat model)
    const vision = p.attrs.vision; // 0–1, scales forward-pass bonus
    const passerGoalDist = Math.abs(p.pos.x - oppGoalX);

    const scored = mates.map(m => {
      const targetGoalDist = Math.abs(m.pos.x - oppGoalX);
      // How many units closer to goal the pass moves the ball (positive = forward)
      const progression = passerGoalDist - targetGoalDist;

      // Space around the receiver — nearest opponent distance
      const space = Math.min(
        ...opps.map(d => Vec2.dist(m.pos, d.pos)),
        30, // cap so it doesn't dominate
      );

      // Count defensive lines bypassed (opponents between passer and target x)
      const linesBypassed = opps.filter(o =>
        atkRight
          ? o.pos.x > p.pos.x && o.pos.x < m.pos.x && Math.abs(o.pos.y - m.pos.y) < 25
          : o.pos.x < p.pos.x && o.pos.x > m.pos.x && Math.abs(o.pos.y - m.pos.y) < 25,
      ).length;

      // Zone bonus — passes into the final third get extra weight
      const finalThirdX = atkRight ? 70 : 30;
      const inFinalThird = atkRight ? m.pos.x > finalThirdX : m.pos.x < finalThirdX;

      // Build score: forward progression is king
      let score = 0;
      // Forward pass multiplier: massive bonus scaled by vision
      if (progression > 0) {
        score += progression * (2.0 + vision * 4.0);
      } else {
        // Backward/lateral: only acceptable if under pressure or no forward options
        score += progression * 0.3; // negative = penalty
      }

      // Lines bypassed bonus (through-the-lines passing)
      score += linesBypassed * (8 + vision * 12);

      // Space bonus (moderate weight)
      score += space * 1.5;

      // Final third bonus
      if (inFinalThird) score += 15 + vision * 10;

      // Decision noise — lower vision = noisier decisions
      const noise = (1 - vision) * 20;
      score += (Math.random() - 0.5) * noise;

      return { mate: m, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // If not under pressure and best option is backward, reduce pass frequency
    const bestIsBackward = atkRight
      ? scored[0].mate.pos.x <= p.pos.x
      : scored[0].mate.pos.x >= p.pos.x;

    let rate: number;
    if (underPressure) {
      rate = 7.0 * p.attrs.passAccuracy * dt;
    } else if (bestIsBackward) {
      rate = 1.5 * p.attrs.passAccuracy * dt; // reluctant to play it backward
    } else {
      rate = 4.5 * p.attrs.passAccuracy * dt;
    }

    if (Math.random() < rate) {
      this.executePass(p, scored[0].mate, false);
      return true;
    }
    return false;
  }

  private executePass(from: PlayerAgent, to: PlayerAgent, isLofted = false) {
    this.ballOwner = null;
    this.lastToucher = from;
    this.passTarget = to;
    this.isShot = false;
    this.isLoftedPass = from.role === Role.Goalkeeper || this.setPiece !== SetPieceType.None || isLofted;
    this.offsideOnPass.clear();

    // Mark offside players (skip on throw-in / goal kick)
    if (!this.isThrowInOrGoalKick) {
      const homeRight = this.period === 1;
      const atkRight = from.isHome ? homeRight : !homeRight;
      const offLine = this.getOffsideLine(from.teamId, atkRight);
      for (const p of this.players) {
        if (p.teamId !== from.teamId || p === from) continue;
        const offside = atkRight ? p.pos.x > offLine + 0.2 : p.pos.x < offLine - 0.2;
        if (offside) this.offsideOnPass.add(p.id);
      }
    }
    this.isThrowInOrGoalKick = false;

    // Pass accuracy — higher rating = tighter delivery
    const acc = from.attrs.passAccuracy;
    const pressure = this.players.filter(d =>
      d.teamId !== from.teamId && d.role !== Role.Goalkeeper && Vec2.dist(d.pos, from.pos) < 7,
    ).length;
    const pressFactor = Math.max(0, 1 - pressure * 0.15);
    const quality = acc * pressFactor;
    const spread = Math.pow(1 - quality, 3) * 60;

    const tx = to.pos.x + (Math.random() - 0.5) * spread;
    const ty = to.pos.y + (Math.random() - 0.5) * spread;

    const dist = Vec2.dist(from.pos, to.pos);
    const speedMult = 0.5 + quality * 0.7;
    const passSpd = Math.min(PASS_SPEED, 80 + dist * 2.5) * speedMult;

    const target = new Vec2(tx, ty);
    const loftVz = this.isLoftedPass ? LOFTED_VZ : 0;
    this.ball.kick(target, passSpd, loftVz);
    this.cooldown = 0.28;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHYSICS
  // ═══════════════════════════════════════════════════════════════════════

  private physicsStep(dt: number) {
    // Players
    for (const p of this.players) {
      p.updatePhysics(dt);
    }

    // Ball
    if (this.ballOwner) {
      // Stick ball to carrier (slightly ahead)
      this.ball.pos.x = this.ballOwner.pos.x + this.ballOwner.vel.x * 0.05;
      this.ball.pos.y = this.ballOwner.pos.y + this.ballOwner.vel.y * 0.05;
      this.ball.vel.copy(this.ballOwner.vel);
      this.ball.z = 0;
      this.ball.vz = 0;
    } else {
      // Lofted pass tracking: steer toward receiver while airborne
      if (this.isLoftedPass && this.passTarget && this.ball.isAirborne) {
        const dir = Vec2.sub(this.passTarget.pos, this.ball.pos);
        if (dir.length() > 0.1) {
          dir.normalize();
          const spd = this.ball.speed;
          this.ball.vel.set(dir.x * spd, dir.y * spd);
        }
      }
      // End lofted state when ball lands
      if (this.isLoftedPass && !this.ball.isAirborne && this.ball.speed < 70) {
        this.isLoftedPass = false;
      }

      this.ball.update(dt);
      this.ball.pos.x = Math.max(0, Math.min(100, this.ball.pos.x));
      this.ball.pos.y = Math.max(0, Math.min(100, this.ball.pos.y));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COLLISIONS — ball pickup, GK saves, tackles, offside
  // ═══════════════════════════════════════════════════════════════════════

  private checkCollisions() {
    // ── Ball is free — check who picks it up ─────────────────────────────
    if (!this.ballOwner) {
      let closest: PlayerAgent | null = null;
      let minD = Infinity;
      for (const p of this.players) {
        // Lofted balls can only be received by target or GK
        if (this.isLoftedPass && p !== this.passTarget && p.role !== Role.Goalkeeper) continue;
        // Airborne balls can't be picked up by outfield players
        if (this.ball.isAirborne && p.role !== Role.Goalkeeper) continue;
        const d = Vec2.dist(p.pos, this.ball.pos);
        const r = p.role === Role.Goalkeeper ? GK_PICKUP_R : BALL_PICKUP_R;
        if (d < r && d < minD && !(this.lastToucher === p && this.cooldown > 0)) {
          minD = d;
          closest = p;
        }
      }

      if (closest) {
        const isOppGK = closest.role === Role.Goalkeeper && this.lastToucher && this.lastToucher.teamId !== closest.teamId;

        if (isOppGK && this.isShot) {
          this.handleGKSave(closest);
        } else if (isOppGK && !this.isShot) {
          // Non-shot reaches GK
          this.ballOwner = closest;
          this.passTarget = null;
          this.isShot = false;
          this.isLoftedPass = false;
        } else if (closest.role !== Role.Goalkeeper && this.isShot && this.lastToucher?.teamId !== closest.teamId) {
          // Block by outfield defender
          this.ball.vel.scale(-0.45);
          this.lastToucher = closest;
          this.cooldown = 0.2;
          this.isShot = false;
        } else {
          // Normal ball receipt — first touch check
          let goodTouch = true;
          if (this.passTarget === closest && closest.role !== Role.Goalkeeper) {
            const pressure = this.players.filter(d =>
              d.teamId !== closest.teamId && d.role !== Role.Goalkeeper && Vec2.dist(d.pos, closest.pos) < 7,
            ).length;
            const trap = closest.attrs.firstTouch * (1 - pressure * 0.1);
            if (Math.random() < Math.pow(1 - trap, 4)) goodTouch = false;
          }
          if (goodTouch && (this.passTarget === closest || Math.random() < 0.88)) {
            this.ballOwner = closest;
            this.passTarget = null;
            this.isShot = false;
            this.isLoftedPass = false;
          } else {
            this.ball.vel.scale(-0.5);
            this.lastToucher = closest;
            this.cooldown = 0.2;
          }
        }
      }
    } else {
      // ── Ball is held — check tackles ─────────────────────────────────
      for (const p of this.players) {
        if (!this.ballOwner) break;
        if (p.teamId === this.ballOwner.teamId) continue;
        if (this.ballOwner.role === Role.Goalkeeper) continue;
        if (Vec2.dist(p.pos, this.ballOwner.pos) >= TACKLE_R) continue;
        if (this.cooldown > 0) continue;

        // Can't tackle from behind
        const homeRight = this.period === 1;
        const atkDir = this.ballOwner.isHome ? (homeRight ? 1 : -1) : (homeRight ? -1 : 1);
        if ((this.ballOwner.pos.x - p.pos.x) * atkDir > 0.8) continue;

        // Contest: defender tackle vs carrier dribble
        const defScore = p.attrs.tackleSkill * (0.8 + Math.random() * 0.4) * p.staminaFactor;
        const dribScore = this.ballOwner.attrs.dribbleSkill * (0.8 + Math.random() * 0.4) * this.ballOwner.staminaFactor;

        if (defScore > dribScore + 0.08) {
          if (defScore > dribScore + 0.22) {
            // Win possession
            this.ballOwner = p;
            this.cooldown = 0.9;
            this.momentum += p.isHome ? 0.15 : -0.15;
            this.momentum = Math.max(-1, Math.min(1, this.momentum));
          } else {
            // Ball loose
            this.lastToucher = p;
            this.passTarget = null;
            this.ballOwner = null;
            this.ball.vel.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
            this.cooldown = 0.5;
          }
        } else {
          this.cooldown = 0.22; // tackler beaten
        }
      }
    }

    // ── Offside check after reception ────────────────────────────────────
    if (this.ballOwner && this.lastToucher && this.ballOwner.teamId === this.lastToucher.teamId) {
      if (this.offsideOnPass.has(this.ballOwner.id)) {
        this.phase = MatchPhase.Stopped;
        this.setPieceTimer = 1.5;
        this.setPiece = SetPieceType.FreeKick;
        this.events.unshift(`${Math.floor(this.minute)}' OFFSIDE – ${this.ballOwner.name}`);
        const defTeam = this.ballOwner.teamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
        this.ballOwner = null;
        this.passTarget = null;
        this.ball.stop();
        const fk = this.players
          .filter(p => p.teamId === defTeam && p.role !== Role.Goalkeeper)
          .sort((a, b) => Vec2.dist(a.pos, this.ball.pos) - Vec2.dist(b.pos, this.ball.pos))[0];
        if (fk) { fk.pos.copy(this.ball.pos); this.ballOwner = fk; }
        this.offsideOnPass.clear();
      }
    } else {
      this.offsideOnPass.clear();
    }
  }

  // ── GK save model ─────────────────────────────────────────────────────

  private handleGKSave(gk: PlayerAgent) {
    const gkSkill = gk.attrs.gkReflex;
    const shooter = this.lastToucher!;

    // Project where ball arrives on goal line
    const ballDir = this.ball.vel.clone().normalize();
    const goalX = gk.pos.x < 50 ? PITCH.LEFT : PITCH.RIGHT;
    const t = (goalX - this.ball.pos.x) / (ballDir.x || 0.001);
    const arrivalY = this.ball.pos.y + ballDir.y * t;

    // Distance the shot was taken from (affects GK reaction time)
    const shotDistX = Math.abs(shooter.pos.x - goalX);

    const gkDist = Math.abs(gk.pos.y - arrivalY);
    const inPath = gkDist < 5;
    const diveRange = 8 + gk.attrs.gkReach * 10;
    const canDive = gkDist < diveRange;

    // ── Realistic save probabilities based on shot distance ─────────
    // Real-life data (approximate):
    //   6-yard box shot:  GK saves ~20-25% (point blank, little reaction time)
    //   Penalty area shot: GK saves ~50-60% (standard saves)
    //   Edge of box:       GK saves ~65-75% (more time to set)
    //   Long range:        GK saves ~80-90% (plenty of time)
    let distModifier: number;
    if (shotDistX <= PITCH.SIX_DEPTH) {
      distModifier = 0.35;     // point blank — GK has almost no time
    } else if (shotDistX <= PITCH.PEN_DEPTH) {
      distModifier = 0.70;     // inside box — standard
    } else if (shotDistX <= 22) {
      distModifier = 0.90;     // edge of box — GK well set
    } else {
      distModifier = 1.05;     // long range — GK has lots of time
    }

    let baseSave: number;
    if (inPath) {
      baseSave = (0.45 + gkSkill * 0.40) * distModifier;
    } else if (canDive) {
      baseSave = (0.20 + gkSkill * 0.40) * (1 - gkDist / diveRange) * distModifier;
    } else {
      baseSave = 0.03; // out of reach
    }

    // Shooter quality reduces save chance (well-placed shots are harder to stop)
    const finalSave = Math.min(0.92, baseSave * (1 - shooter.attrs.shotAccuracy * 0.30));

    if (Math.random() < finalSave) {
      if (Math.random() < 0.25) {
        // Punch away
        this.ball.vel.set(
          (gk.isHome ? 1 : -1) * 60 + (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 40,
        );
        this.ball.vz = 6 + Math.random() * 4;
        this.ball.z = 0.5;
        this.lastToucher = gk;
        this.isShot = false;
        this.cooldown = 0.4;
        this.events.unshift(`${Math.floor(this.minute)}' Punched away by ${gk.name}`);
      } else {
        // Caught
        this.ballOwner = gk;
        this.passTarget = null;
        this.isShot = false;
        this.isLoftedPass = false;
        this.phase = MatchPhase.Stopped;
        this.setPieceTimer = 1.0;
        this.setPiece = SetPieceType.GoalKick;
        this.events.unshift(`${Math.floor(this.minute)}' Save by ${gk.name}!`);
      }
    } else {
      // Parry attempt (glancing touch — even on a "not saved" the GK might deflect)
      if (Math.random() < 0.25 && canDive) {
        this.ball.vel.y += (Math.random() - 0.5) * 12;
        this.ball.vel.scale(0.82);
        this.cooldown = 0.2;
        this.events.unshift(`${Math.floor(this.minute)}' Parried! Rebound...`);
      }
      // else: ball continues → goal handled by boundary check
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BOUNDARIES — goals, throw-ins, corners, goal kicks
  // ═══════════════════════════════════════════════════════════════════════

  private checkBoundaries() {
    const { x, y } = this.ball.pos;
    const { GOAL_TOP: GT, GOAL_BOTTOM: GB } = PITCH;

    // ── Goal check ───────────────────────────────────────────────────────
    if (y > GT && y < GB) {
      if (x < PITCH.LEFT) { this.scoreGoal(this.period === 1 ? false : true); return; }
      if (x > PITCH.RIGHT) { this.scoreGoal(this.period === 1 ? true : false); return; }
    }

    // ── Out of play ──────────────────────────────────────────────────────
    if (y < PITCH.TOP || y > PITCH.BOTTOM || x < PITCH.LEFT || x > PITCH.RIGHT) {
      this.phase = MatchPhase.Stopped;
      this.setPieceTimer = 1.0;
      this.ballOwner = null;
      this.passTarget = null;
      this.isShot = false;
      this.isLoftedPass = false;
      this.offsideOnPass.clear();

      if (y < PITCH.TOP || y > PITCH.BOTTOM) {
        // ── Throw-in ───────────────────────────────────────────────────
        this.ball.pos.y = y < PITCH.TOP ? 0.5 : 99.5;
        this.ball.stop();
        this.setPiece = SetPieceType.ThrowIn;
        this.isThrowInOrGoalKick = true;
        const throwTeam = this.lastToucher?.teamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
        const nearest = this.players
          .filter(p => p.teamId === throwTeam && p.role !== Role.Goalkeeper)
          .sort((a, b) => Vec2.dist(a.pos, this.ball.pos) - Vec2.dist(b.pos, this.ball.pos))[0];
        if (nearest) { nearest.pos.copy(this.ball.pos); this.ballOwner = nearest; nearest.state = PlayerState.SetPiece; }
      } else {
        // ── Ball over goal line (not a goal) ───────────────────────────
        const homeRight = this.period === 1;
        const isLeftLine = x < 50;
        const defTeamId = (homeRight === isLeftLine) ? this.homeTeam.id : this.awayTeam.id;
        const atkTeamId = defTeamId === this.homeTeam.id ? this.awayTeam.id : this.homeTeam.id;
        const lastTouchAtk = this.lastToucher?.teamId === atkTeamId;
        this.ball.stop();

        if (lastTouchAtk) {
          // ── Corner ─────────────────────────────────────────────────
          const cx = x < PITCH.LEFT ? PITCH.LEFT + 0.5 : PITCH.RIGHT - 0.5;
          const cy = y < 50 ? 0.5 : 99.5;
          this.ball.pos.set(cx, cy);
          this.setPiece = SetPieceType.Corner;
          this.isThrowInOrGoalKick = false;
          this.events.unshift(`${Math.floor(this.minute)}' Corner`);
          const taker = this.players
            .filter(p => p.teamId === atkTeamId && p.role !== Role.Goalkeeper)
            .sort((a, b) => Vec2.dist(a.pos, this.ball.pos) - Vec2.dist(b.pos, this.ball.pos))[0];
          if (taker) { taker.pos.copy(this.ball.pos); this.ballOwner = taker; taker.state = PlayerState.SetPiece; }
        } else {
          // ── Goal kick ──────────────────────────────────────────────
          const gkX = x < 50 ? PITCH.LEFT + 4 : PITCH.RIGHT - 4;
          this.ball.pos.set(gkX, PITCH.CENTER_Y);
          this.setPiece = SetPieceType.GoalKick;
          this.isThrowInOrGoalKick = true;
          this.events.unshift(`${Math.floor(this.minute)}' Goal Kick`);
          const gk = this.players.find(p => p.teamId === defTeamId && p.role === Role.Goalkeeper);
          if (gk) { gk.pos.copy(this.ball.pos); this.ballOwner = gk; gk.state = PlayerState.SetPiece; }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GOAL SCORING
  // ═══════════════════════════════════════════════════════════════════════

  scoreGoal(isHome: boolean) {
    this.isShot = false;
    this.isLoftedPass = false;
    this.offsideOnPass.clear();

    let scorer = 'Unknown';
    let isOG = false;
    if (this.lastToucher) {
      scorer = this.lastToucher.name;
      if (this.lastToucher.isHome !== isHome) isOG = true;
    }

    const teamName = isHome ? this.homeTeam.shortName : this.awayTeam.shortName;
    if (isHome) {
      this.homeScore++;
      this.momentum = Math.min(1, this.momentum + 0.3);
    } else {
      this.awayScore++;
      this.momentum = Math.max(-1, this.momentum - 0.3);
    }
    this.events.unshift(`${Math.floor(this.minute)}' ${isOG ? 'OWN GOAL' : 'GOAL'}! ${scorer} (${teamName})`);
    this.setupKickoff(!isHome);
    this.triggerUpdate();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SKIP TO END
  // ═══════════════════════════════════════════════════════════════════════

  skipToEnd() {
    const remaining = 90 - this.minute;
    if (remaining <= 0) return;

    const avgRating = (team: Team) => {
      const on = (team.roster ?? []).filter(p => !p.offField);
      if (on.length === 0) return team.strength;
      const formation = FORMATIONS[team.formation || '4-3-3'];
      const used = new Set<number>();
      return on.reduce((sum, p) => {
        let idx = formation.findIndex((f, i) => f.position === p.position && !used.has(i));
        if (idx === -1) idx = formation.findIndex((_, i) => !used.has(i));
        if (idx === -1) idx = 0;
        used.add(idx);
        return sum + getPenalizedRating(p.rating, p.position, formation[idx]?.position || 'CM');
      }, 0) / on.length;
    };

    const hStr = avgRating(this.homeTeam);
    const aStr = avgRating(this.awayTeam);
    const diff = (hStr + 4) - aStr;
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

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private getOffsideLine(atkTeamId: string, atkRight: boolean): number {
    const defenders = this.players.filter(p => p.teamId !== atkTeamId);
    if (atkRight) {
      defenders.sort((a, b) => b.pos.x - a.pos.x);
      const line = defenders[1]?.pos.x ?? PITCH.RIGHT;
      return Math.max(PITCH.CENTER_X, this.ball.pos.x, line);
    } else {
      defenders.sort((a, b) => a.pos.x - b.pos.x);
      const line = defenders[1]?.pos.x ?? PITCH.LEFT;
      return Math.min(PITCH.CENTER_X, this.ball.pos.x, line);
    }
  }

  private isPassLaneOpen(from: Vec2, to: Vec2, teamId: string): boolean {
    const TH = 4.5;
    const abx = to.x - from.x, aby = to.y - from.y;
    const lenSq = abx * abx + aby * aby;
    if (lenSq === 0) return false;
    for (const p of this.players) {
      if (p.teamId === teamId) continue;
      const apx = p.pos.x - from.x, apy = p.pos.y - from.y;
      const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
      const cx = from.x + t * abx, cy = from.y + t * aby;
      if ((p.pos.x - cx) ** 2 + (p.pos.y - cy) ** 2 < TH * TH) return false;
    }
    return true;
  }

  private isShootingLaneOpen(from: Vec2, to: Vec2, teamId: string): boolean {
    const TH = 3.0;
    const abx = to.x - from.x, aby = to.y - from.y;
    const lenSq = abx * abx + aby * aby;
    if (lenSq === 0) return false;
    for (const p of this.players) {
      if (p.teamId === teamId || p.role === Role.Goalkeeper) continue;
      const apx = p.pos.x - from.x, apy = p.pos.y - from.y;
      const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
      const cx = from.x + t * abx, cy = from.y + t * aby;
      if ((p.pos.x - cx) ** 2 + (p.pos.y - cy) ** 2 < TH * TH) return false;
    }
    return true;
  }
}
