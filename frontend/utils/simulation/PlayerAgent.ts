import { Vec2 } from './Vec2';
import {
  PlayerState, Role, getRole, getRoleType, deriveAttributes,
  PlayerAttributes, MAX_PLAYER_SPEED, MAX_PLAYER_FORCE, PLAYER_FRICTION,
} from './types';
import { Player } from '../../types';

/**
 * In-match representation of a player with physics, steering behaviours,
 * an explicit state machine, and role-derived attributes.
 */
export class PlayerAgent {
  // ── Identity ───────────────────────────────────────────────────────────
  id: string;
  name: string;
  number: number;
  teamId: string;
  position: string;
  role: Role;
  isHome: boolean;
  rating: number;

  // ── Derived attributes ─────────────────────────────────────────────────
  attrs: PlayerAttributes;

  // ── Physics ────────────────────────────────────────────────────────────
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  heading = 0;

  // ── Formation ──────────────────────────────────────────────────────────
  basePos: Vec2;              // assigned position in formation (home-orient)
  roleType: 'DEF' | 'MID' | 'FWD';

  // ── State machine ──────────────────────────────────────────────────────
  state: PlayerState = PlayerState.Idle;

  // ── Stamina (1.0 → ~0.55 over 90 min) ─────────────────────────────────
  stamina = 1.0;

  // ── Off-ball run ───────────────────────────────────────────────────────
  runTarget: Vec2 | null = null;
  runTimer = 0;

  constructor(
    player: Player,
    teamId: string,
    slotPosition: string,
    isHome: boolean,
    baseX: number,
    baseY: number,
    effectiveRating: number,
  ) {
    this.id       = player.id;
    this.name     = player.name;
    this.number   = player.number;
    this.teamId   = teamId;
    this.position = slotPosition;
    this.role     = getRole(slotPosition);
    this.isHome   = isHome;
    this.rating   = effectiveRating;
    this.attrs    = deriveAttributes(effectiveRating, this.role);
    this.basePos  = new Vec2(baseX, baseY);
    this.pos      = new Vec2(baseX, baseY);
    this.vel      = new Vec2(0, 0);
    this.acc      = new Vec2(0, 0);
    this.roleType = getRoleType(isHome ? baseX : 100 - baseX);
  }

  // ── Computed speed caps ────────────────────────────────────────────────

  get staminaFactor() { return 0.6 + this.stamina * 0.4; }
  get maxSpeed()      { return MAX_PLAYER_SPEED * this.attrs.maxVelocity * this.staminaFactor; }
  get maxForce()      { return MAX_PLAYER_FORCE * this.attrs.acceleration * this.staminaFactor; }

  // ── Steering behaviours ────────────────────────────────────────────────

  /** Arrive: decelerate smoothly as we approach `target`. */
  arrive(target: Vec2, speedMult = 1.0): Vec2 {
    const toTarget = Vec2.sub(target, this.pos);
    const dist = toTarget.length();
    if (dist < 0.1) return new Vec2(0, 0);
    toTarget.normalize();
    const slowR = 15;
    const speed = dist < slowR
      ? this.maxSpeed * speedMult * (dist / slowR)
      : this.maxSpeed * speedMult;
    toTarget.scale(speed);
    return Vec2.sub(toTarget, this.vel).limit(this.maxForce * speedMult);
  }

  /** Seek: head toward `target` at full throttle. */
  seek(target: Vec2, speedMult = 1.0): Vec2 {
    const desired = Vec2.sub(target, this.pos).normalize().scale(this.maxSpeed * speedMult);
    return Vec2.sub(desired, this.vel).limit(this.maxForce * speedMult);
  }

  /** Separation: push away from nearby agents to avoid clumping. */
  separate(neighbours: PlayerAgent[], radius = 10, strength = 35): Vec2 {
    const force = new Vec2(0, 0);
    for (const o of neighbours) {
      if (o === this) continue;
      const d = Vec2.dist(this.pos, o.pos);
      if (d > 0.01 && d < radius) {
        force.add(Vec2.sub(this.pos, o.pos).normalize().scale(strength / (d + 0.1)));
      }
    }
    return force;
  }

  // ── Physics integration ────────────────────────────────────────────────

  applyForce(force: Vec2) { this.acc.add(force); }

  updatePhysics(dt: number) {
    // Integrate acceleration → velocity
    this.vel.x += this.acc.x * dt;
    this.vel.y += this.acc.y * dt;
    this.acc.set(0, 0);

    // Clamp to max speed
    const spd = this.vel.length();
    if (spd > this.maxSpeed) this.vel.scale(this.maxSpeed / spd);

    // Integrate velocity → position
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Friction
    this.vel.scale(Math.pow(PLAYER_FRICTION, dt * 60));

    // Heading
    if (this.vel.length() > 1) this.heading = Math.atan2(this.vel.y, this.vel.x);

    // Stamina degradation
    this.stamina = Math.max(0, this.stamina - dt * 0.0065 * this.attrs.staminaRate);

    // Keep on pitch
    this.pos.x = Math.max(3, Math.min(97, this.pos.x));
    this.pos.y = Math.max(0, Math.min(100, this.pos.y));
  }
}
