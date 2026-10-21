import type { Contact } from "./body";

export type ReactionStage = "IDLE" | "IMPACT" | "DIZZY" | "RECOVERING";
export const STRONG_CONTACT = 900;

/** A finite visual envelope, independent of flight/rest. Never restarts on a settling bounce. */
export class ImpactReaction {
  stage: ReactionStage = "IDLE";
  count = 0;
  contactAt = 0;
  startedAt = 0;
  speed = 0;
  wall: Contact["wall"] = "floor";
  strength = 0;
  until = 0;
  recoveryAt = 0;
  recoveryUntil = 0;
  private reacted = false;

  launch() { this.clear(); this.reacted = false; }
  clear() { this.stage = "IDLE"; this.strength = 0; this.until = 0; this.recoveryAt = this.recoveryUntil = 0; }

  contact(contact: Contact, time: number) {
    if (contact.speed < STRONG_CONTACT || this.reacted) return false;
    this.reacted = true;
    this.stage = "IMPACT"; this.count++;
    this.contactAt = this.startedAt = time; this.speed = contact.speed; this.wall = contact.wall;
    // Energy, rather than a fixed timer: gentle threshold crossings differ from violent throws.
    this.strength = Math.min(1, .22 + (contact.speed * contact.speed - STRONG_CONTACT ** 2) / 8_000_000);
    this.until = time + 400 + 500 * this.strength;
    return true;
  }

  recover(time: number) {
    this.stage = "RECOVERING"; this.recoveryAt = time;
    this.recoveryUntil = time + 350 + 200 * this.strength;
  }

  step(time: number) {
    if (this.stage === "RECOVERING") { if (time >= this.recoveryUntil) this.clear(); }
    else if (this.stage !== "IDLE") {
      if (time >= this.until) this.clear();
      else this.stage = time - this.startedAt < 90 ? "IMPACT" : "DIZZY";
    }
    return this.stage !== "IDLE";
  }

  /** Small, decaying disequilibrium for the orientation spring, never a pose jump. */
  wobble(time: number) {
    if (this.stage === "IDLE") return 0;
    const age = Math.max(0, time - this.startedAt) / 1000;
    const fade = this.stage === "RECOVERING" ? Math.max(0, (this.recoveryUntil - time) / (this.recoveryUntil - this.recoveryAt)) : Math.max(0, (this.until - time) / (this.until - this.startedAt));
    return Math.sin(age * 22) * .12 * this.strength * fade;
  }
}
