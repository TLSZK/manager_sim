/**
 * Lightweight 2D vector with mutating methods (return `this` for chaining)
 * and static helpers that return new instances.
 */
export class Vec2 {
  constructor(public x = 0, public y = 0) {}

  // ── Mutating ───────────────────────────────────────────────────────────
  set(x: number, y: number) { this.x = x; this.y = y; return this; }
  copy(v: Vec2) { this.x = v.x; this.y = v.y; return this; }
  add(v: Vec2) { this.x += v.x; this.y += v.y; return this; }
  sub(v: Vec2) { this.x -= v.x; this.y -= v.y; return this; }
  scale(n: number) { this.x *= n; this.y *= n; return this; }

  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }

  normalize() {
    const m = this.length();
    if (m > 0) { this.x /= m; this.y /= m; }
    return this;
  }

  limit(max: number) {
    if (this.lengthSq() > max * max) this.normalize().scale(max);
    return this;
  }

  clone() { return new Vec2(this.x, this.y); }

  // ── Static (non-mutating) ──────────────────────────────────────────────
  static dist(a: Vec2, b: Vec2) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distSq(a: Vec2, b: Vec2) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static sub(a: Vec2, b: Vec2) { return new Vec2(a.x - b.x, a.y - b.y); }
  static add(a: Vec2, b: Vec2) { return new Vec2(a.x + b.x, a.y + b.y); }
  static scale(v: Vec2, n: number) { return new Vec2(v.x * n, v.y * n); }
  static dot(a: Vec2, b: Vec2) { return a.x * b.x + a.y * b.y; }

  static lerp(a: Vec2, b: Vec2, t: number) {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
