/**
 * Reads native scroll (never writes it) and reports the viewport's velocity, acceleration and
 * abrupt brakes. A brake only counts after a sustained fast phase that collapses quickly, so
 * keyboard paging, trackpad momentum and ordinary reading never knock the notebook over.
 */
export const SCROLL_FAST = 2300;
const SUSTAIN_MS = 110, BRAKE_MS = 180, COOLDOWN_MS = 2600, TAU_V = .05, TAU_A = .06;

export type Brake = { direction: 1 | -1; speed: number };

export class ScrollInertia {
  velocity = 0;
  acceleration = 0;
  private last: { y: number; time: number } | null = null;
  private fastSince = 0;
  private fastLast = 0;
  private nearPeak = 0;
  private peak = 0;
  private direction: 1 | -1 = 1;
  private cooldownUntil = 0;
  private suppressedUntil = 0;

  /** Programmatic navigation (anchors, terminal commands) moves the page on purpose. */
  suppress(time: number, ms = 1600) { this.suppressedUntil = Math.max(this.suppressedUntil, time + ms); this.clearFast(); }
  reset() { this.last = null; this.velocity = 0; this.acceleration = 0; this.clearFast(); }
  /** Something still to observe: keep sampling until velocity has settled. */
  get active() { return Math.abs(this.velocity) > 25 || this.fastSince > 0; }

  sample(y: number, time: number, viewportHeight = 900): Brake | null {
    const previous = this.last; this.last = { y, time };
    if (!previous || !Number.isFinite(y) || !Number.isFinite(time)) return null;
    const dt = (time - previous.time) / 1000;
    if (!(dt > 0)) return null;
    // A long gap means no frames ran because nothing moved; jumps are teleports, not motion.
    if (dt > .25 || Math.abs(y - previous.y) > viewportHeight * 2.5) { this.velocity = 0; this.acceleration = 0; this.clearFast(); return null; }
    const raw = Math.max(-20000, Math.min(20000, (y - previous.y) / dt));
    const before = this.velocity;
    this.velocity += (1 - Math.exp(-dt / TAU_V)) * (raw - this.velocity);
    this.acceleration += (1 - Math.exp(-dt / TAU_A)) * ((this.velocity - before) / dt - this.acceleration);
    // Exponential filters never reach zero on their own; snap the residue so idle means idle.
    if (raw === 0 && Math.abs(this.velocity) < 5 && Math.abs(this.acceleration) < 60) { this.velocity = 0; this.acceleration = 0; }
    const speed = Math.abs(this.velocity);
    if (speed >= SCROLL_FAST) {
      const direction = this.velocity > 0 ? 1 : -1;
      if (!this.fastSince || direction !== this.direction) { this.fastSince = time; this.peak = 0; this.direction = direction; }
      this.fastLast = time; this.peak = Math.max(this.peak, speed);
      if (speed >= this.peak * .85) this.nearPeak = time;
      return null;
    }
    if (!this.fastSince) return null;
    const sustained = this.fastLast - this.fastSince >= SUSTAIN_MS;
    // Abruptness, not just slowing down: from near the peak to 30% of it within BRAKE_MS.
    // Momentum decay (trackpad flings) takes several times longer and never qualifies.
    if (time - this.nearPeak > BRAKE_MS) { this.clearFast(); return null; }
    if (speed > this.peak * .3) return null;
    const brake: Brake = { direction: this.direction, speed: this.peak };
    const allowed = sustained && time >= this.cooldownUntil && time >= this.suppressedUntil;
    this.clearFast();
    if (!allowed) return null;
    this.cooldownUntil = time + COOLDOWN_MS;
    return brake;
  }

  private clearFast() { this.fastSince = 0; this.fastLast = 0; this.nearPeak = 0; this.peak = 0; }
}
