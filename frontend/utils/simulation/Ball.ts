import { Vec2 } from './Vec2';
import { BALL_GROUND_FRICTION, BALL_AIR_FRICTION, BALL_GRAVITY, BALL_BOUNCE } from './types';

/**
 * Ball entity with 2D position/velocity and simulated z-axis (height)
 * for lofted passes, clearances, and shots.
 */
export class Ball {
  pos: Vec2;
  vel: Vec2;
  z  = 0;   // height above pitch surface (coord-units)
  vz = 0;   // vertical velocity

  constructor(x: number, y: number) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(0, 0);
  }

  update(dt: number) {
    // ── Z-axis: gravity + bounce ──────────────────────────────────────────
    if (this.z > 0 || this.vz > 0) {
      this.vz -= BALL_GRAVITY * dt;
      this.z  += this.vz * dt;
      if (this.z <= 0) {
        this.z = 0;
        if (Math.abs(this.vz) > 3) {
          this.vz = -this.vz * BALL_BOUNCE;
        } else {
          this.vz = 0;
        }
      }
    }

    // ── 2D friction (reduced in air) ──────────────────────────────────────
    const friction = this.z > 0.5 ? BALL_AIR_FRICTION : BALL_GROUND_FRICTION;
    this.vel.scale(Math.pow(friction, dt * 60));

    // ── Integrate position ────────────────────────────────────────────────
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  /** Kick the ball toward a target point. */
  kick(target: Vec2, speed: number, loftVz = 0) {
    const dir = Vec2.sub(target, this.pos);
    const len = dir.length();
    if (len > 0.01) dir.scale(1 / len); // normalize
    this.vel.set(dir.x * speed, dir.y * speed);
    if (loftVz > 0) {
      this.vz = loftVz;
      this.z  = Math.max(this.z, 0.1);
    }
  }

  /** Kill all velocity and height. */
  stop() {
    this.vel.set(0, 0);
    this.z  = 0;
    this.vz = 0;
  }

  get speed()      { return this.vel.length(); }
  get isAirborne() { return this.z > 1.0; }
}
