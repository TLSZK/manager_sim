// ── Pitch layout (coordinate space 0-100) ────────────────────────────────────
export const PITCH = {
  LEFT: 5, RIGHT: 95, TOP: 0, BOTTOM: 100,
  CENTER_X: 50, CENTER_Y: 50,
  GOAL_TOP: 43.5, GOAL_BOTTOM: 56.5, GOAL_CENTER: 50,
  PEN_DEPTH: 14.1, PEN_TOP: 20.35, PEN_BOTTOM: 79.65,
  SIX_DEPTH: 4.7, SIX_TOP: 36.55, SIX_BOTTOM: 63.45,
  PEN_SPOT: 9.42,
  CIRCLE_RX: 7.84, CIRCLE_RY: 13.45,
} as const;

// ── Timing ───────────────────────────────────────────────────────────────────
export const HALF_DURATION_SEC = 30.0;
export const TIME_SCALE = 45 / HALF_DURATION_SEC;

// ── Physics ──────────────────────────────────────────────────────────────────
export const MAX_PLAYER_SPEED = 65.0;
export const MAX_PLAYER_FORCE = 280.0;
export const PLAYER_FRICTION = 0.90;
export const BALL_GROUND_FRICTION = 0.982;
export const BALL_AIR_FRICTION = 0.997;
export const BALL_GRAVITY = 120.0;
export const BALL_BOUNCE = 0.4;
export const PASS_SPEED = 160.0;
export const SHOOT_SPEED = 190.0;
export const LOFTED_VZ = 18.0;
export const BALL_PICKUP_R = 3.5;
export const GK_PICKUP_R = 5.5;
export const TACKLE_R = 3.5;

// ── Enums ────────────────────────────────────────────────────────────────────

export enum Role { Attacker = 'ATT', Midfielder = 'MID', Defender = 'DEF', Goalkeeper = 'GK' }

export enum PlayerState {
  Idle         = 'IDLE',
  Positioning  = 'POS',
  SeekingSpace = 'SEEK',
  Pressing     = 'PRESS',
  Covering     = 'COVER',
  TrackingBack = 'TRACK',
  Dribbling    = 'DRIB',
  Receiving    = 'RECV',
  SetPiece     = 'SETP',
  GKPosition   = 'GKP',
  GKHold       = 'GKH',
}

export enum MatchPhase {
  Playing  = 'PLAY',
  Stopped  = 'STOP',
  Halftime = 'HALF',
  Finished = 'FIN',
}

export enum SetPieceType {
  None     = 'NONE',
  KickOff  = 'KO',
  ThrowIn  = 'TI',
  GoalKick = 'GK',
  Corner   = 'CK',
  FreeKick = 'FK',
}

// ── Position → Role mapping ──────────────────────────────────────────────────

export function getRole(pos: string): Role {
  if (pos === 'GK') return Role.Goalkeeper;
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return Role.Defender;
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return Role.Midfielder;
  return Role.Attacker; // ST, CF, LW, RW
}

/** Classify by base-position x (in home-attacking-right orientation). */
export function getRoleType(homeBaseX: number): 'DEF' | 'MID' | 'FWD' {
  if (homeBaseX <= 42) return 'DEF';
  if (homeBaseX >= 72) return 'FWD';
  return 'MID';
}

// ── Attribute system ─────────────────────────────────────────────────────────
// All derived from a single 0-100 overall rating × role multiplier.

export interface PlayerAttributes {
  maxVelocity: number;       // fraction of MAX_PLAYER_SPEED
  acceleration: number;      // fraction of MAX_PLAYER_FORCE
  passAccuracy: number;      // [0-1] precision of passes
  shotPower: number;         // multiplier on SHOOT_SPEED
  shotAccuracy: number;      // [0-1] precision of shots
  tackleSkill: number;       // tackle-contest modifier
  interceptionRange: number; // interception reach modifier
  dribbleSkill: number;      // dribble-vs-tackle modifier
  firstTouch: number;        // [0-1] clean first touch probability
  gkReach: number;           // GK dive range modifier
  gkReflex: number;          // [0-1] GK save probability modifier
  positioning: number;       // tactical positioning quality
  vision: number;            // pass-target selection quality
  staminaRate: number;       // stamina degradation rate (higher = drains faster)
}

type MultTable = Record<keyof PlayerAttributes, number>;

const ROLE_MULTS: Record<Role, MultTable> = {
  [Role.Attacker]: {
    maxVelocity: 1.12, acceleration: 1.10, passAccuracy: 0.88, shotPower: 1.20,
    shotAccuracy: 1.18, tackleSkill: 0.65, interceptionRange: 0.70, dribbleSkill: 1.15,
    firstTouch: 1.10, gkReach: 0.20, gkReflex: 0.20, positioning: 0.88,
    vision: 0.90, staminaRate: 1.00,
  },
  [Role.Midfielder]: {
    maxVelocity: 1.00, acceleration: 1.00, passAccuracy: 1.12, shotPower: 0.92,
    shotAccuracy: 0.88, tackleSkill: 0.88, interceptionRange: 1.00, dribbleSkill: 1.05,
    firstTouch: 1.08, gkReach: 0.20, gkReflex: 0.20, positioning: 1.05,
    vision: 1.15, staminaRate: 1.10,
  },
  [Role.Defender]: {
    maxVelocity: 0.95, acceleration: 0.95, passAccuracy: 0.82, shotPower: 0.72,
    shotAccuracy: 0.62, tackleSkill: 1.20, interceptionRange: 1.15, dribbleSkill: 0.78,
    firstTouch: 0.85, gkReach: 0.20, gkReflex: 0.20, positioning: 1.12,
    vision: 0.78, staminaRate: 1.05,
  },
  [Role.Goalkeeper]: {
    maxVelocity: 0.82, acceleration: 0.85, passAccuracy: 0.72, shotPower: 0.55,
    shotAccuracy: 0.40, tackleSkill: 0.55, interceptionRange: 0.55, dribbleSkill: 0.50,
    firstTouch: 0.65, gkReach: 1.30, gkReflex: 1.30, positioning: 1.00,
    vision: 0.70, staminaRate: 0.85,
  },
};

/** Derive all physical/technical attributes from a single overall rating + role. */
export function deriveAttributes(rating: number, role: Role): PlayerAttributes {
  const b = rating / 100;
  const m = ROLE_MULTS[role];
  return {
    maxVelocity:       b * m.maxVelocity,
    acceleration:      b * m.acceleration,
    passAccuracy:      Math.min(1, b * m.passAccuracy),
    shotPower:         b * m.shotPower,
    shotAccuracy:      Math.min(1, b * m.shotAccuracy),
    tackleSkill:       b * m.tackleSkill,
    interceptionRange: b * m.interceptionRange,
    dribbleSkill:      b * m.dribbleSkill,
    firstTouch:        Math.min(1, b * m.firstTouch),
    gkReach:           b * m.gkReach,
    gkReflex:          Math.min(1, b * m.gkReflex),
    positioning:       b * m.positioning,
    vision:            b * m.vision,
    staminaRate:       m.staminaRate * (1 + (1 - b) * 0.6),
  };
}

// ── Match stats ───────────────────────────────────────

export interface MatchStats {
  home: { shots: number; shotsOnTarget: number; possession: number };
  away: { shots: number; shotsOnTarget: number; possession: number };
}
