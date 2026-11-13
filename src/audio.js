/** Procedural sound (no asset files): ambient drone, heartbeat while chased, pickup blip, jump-scare sting. */
export class AudioFX {
  constructor() { this.ctx = null; this.t = 0; }
  start() {
    if (this.ctx) return;
    const c = (this.ctx = new AudioContext());
    const f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = 0.07;
    for (const [type, hz] of [['sawtooth', 48], ['sine', 51]]) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = hz; o.connect(f); o.start();
    }
    f.connect(g); g.connect(c.destination);
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.13; lg.gain.value = 90; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  }
  tone(freq, dur = 0.15, type = 'square', vol = 0.15, slide = 0) {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(t + dur);
  }
  pickup() { this.tone(660, 0.12, 'square', 0.08); setTimeout(() => this.tone(990, 0.15, 'square', 0.08), 90); }
  scare() { this.tone(900, 0.7, 'sawtooth', 0.35, -800); this.tone(130, 0.7, 'square', 0.3, -60); }
  update(dt, chasing) {
    if (!chasing) { this.t = 0; return; }
    this.t -= dt;
    if (this.t <= 0) { this.tone(70, 0.18, 'sine', 0.5, -30); setTimeout(() => this.tone(70, 0.18, 'sine', 0.5, -30), 160); this.t = 0.7; }
  }
}
