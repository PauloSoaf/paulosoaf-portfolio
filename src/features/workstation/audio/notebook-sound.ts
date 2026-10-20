/**
 * Small synthesized foley for the notebook. No audio files, no autoplay: the context is created
 * on the first real gesture, and the visitor's mute choice persists only in this browser.
 */
const STORAGE_KEY = "portfolio:workstation-sound";

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === "off"; } catch { return false; }
}

export class NotebookSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastKey = 0;
  private listeners = new Set<() => void>();
  muted = readMuted();

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getMuted = () => this.muted;
  toggle = () => this.setMuted(!this.muted);
  setMuted(muted: boolean) {
    this.muted = muted;
    try { localStorage.setItem(STORAGE_KEY, muted ? "off" : "on"); } catch { /* private mode */ }
    if (this.master && this.context) this.master.gain.setTargetAtTime(muted ? 0 : .9, this.context.currentTime, .02);
    if (!muted) { this.unlock(); this.click(.7); }
    this.listeners.forEach((listener) => listener());
  }

  /** Must run inside a user gesture; browsers refuse audio before one. */
  unlock() {
    if (this.muted || typeof window === "undefined") return;
    try {
      if (!this.context) {
        const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.master = this.context.createGain(); this.master.gain.value = .9; this.master.connect(this.context.destination);
        const length = Math.floor(this.context.sampleRate * .5), buffer = this.context.createBuffer(1, length, this.context.sampleRate), data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buffer;
      }
      if (this.context.state === "suspended") void this.context.resume();
    } catch { this.context = null; }
  }
  dispose() { void this.context?.close(); this.context = null; this.master = null; }

  private ready() { return !this.muted && this.context && this.master && this.context.state === "running" ? this.context : null; }
  private envelope(context: AudioContext, peak: number, attack: number, release: number, at = context.currentTime) {
    const gain = context.createGain(); gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack); gain.gain.exponentialRampToValueAtTime(.0001, at + attack + release);
    gain.connect(this.master!); return gain;
  }
  private tone(frequency: number, to: number, duration: number, peak: number, type: OscillatorType = "sine", delay = 0) {
    const context = this.ready(); if (!context) return;
    const at = context.currentTime + delay, oscillator = context.createOscillator();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    oscillator.connect(this.envelope(context, peak, .004, duration, at)); oscillator.start(at); oscillator.stop(at + duration + .05);
  }
  private burst(filter: BiquadFilterType, frequency: number, duration: number, peak: number, delay = 0, sweep?: number) {
    const context = this.ready(); if (!context || !this.noise) return;
    const at = context.currentTime + delay, source = context.createBufferSource(), shape = context.createBiquadFilter();
    source.buffer = this.noise; source.playbackRate.value = .9 + Math.random() * .2;
    shape.type = filter; shape.frequency.setValueAtTime(frequency, at); shape.Q.value = filter === "bandpass" ? 1.4 : .7;
    if (sweep) shape.frequency.exponentialRampToValueAtTime(sweep, at + duration);
    source.connect(shape); shape.connect(this.envelope(context, peak, .003, duration, at));
    source.start(at, Math.random() * .3); source.stop(at + duration + .05);
  }

  private click(level = 1) { this.burst("bandpass", 2600 + Math.random() * 900, .028, .07 * level); this.tone(1900, 1500, .012, .025 * level, "triangle"); }
  key() { const now = performance.now(); if (now - this.lastKey < 22) return; this.lastKey = now; this.click(); }
  /** Lid against the palm rest. */
  lid(speed: number) {
    const level = Math.min(1, speed / 500);
    this.tone(150, 70, .1, .22 * level); this.burst("lowpass", 1100, .06, .12 * level);
  }
  /** Floor landing; very hard ones rattle the keys. */
  thud(speed: number) {
    const level = Math.min(1, speed / 2800);
    this.tone(105, 38, .24, .5 * level); this.burst("lowpass", 320, .14, .35 * level);
    if (level > .45) for (let i = 0; i < 4; i++) this.burst("bandpass", 3000 + i * 400, .02, .05 * level, .03 + i * .025);
  }
  /** Ceiling bump: a cartoon boing. */
  bonk(speed: number) {
    const context = this.ready(); if (!context) return;
    const level = Math.min(1, speed / 2200), at = context.currentTime, oscillator = context.createOscillator(), wobble = context.createOscillator(), depth = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.setValueAtTime(240, at); oscillator.frequency.exponentialRampToValueAtTime(520, at + .08); oscillator.frequency.exponentialRampToValueAtTime(300, at + .38);
    wobble.frequency.value = 17; depth.gain.value = 38; wobble.connect(depth); depth.connect(oscillator.frequency);
    oscillator.connect(this.envelope(context, .2 * level + .05, .005, .4, at)); oscillator.start(at); wobble.start(at); oscillator.stop(at + .45); wobble.stop(at + .45);
  }
  wall(speed: number) { const level = Math.min(1, speed / 2400); this.tone(180, 90, .09, .18 * level); this.burst("lowpass", 700, .05, .12 * level); }
  whoosh(speed: number) { this.burst("bandpass", 420, .26, Math.min(.12, speed / 20000), 0, 1900); }
  hop() { this.tone(320, 640, .12, .06); }
  boot() { this.tone(660, 660, .32, .045, "sine", .05); this.tone(990, 990, .4, .035, "sine", .16); }
  /** Something on the page got knocked by the flying notebook. */
  tock() { this.tone(520 + Math.random() * 200, 300, .05, .06, "triangle"); }
}
