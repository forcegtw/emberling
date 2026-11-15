// WebAudio synthesized sound. Created lazily; safe in headless (muted via ?shot=).
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  init() {
    if (this.ctx || this.muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.muted = true; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.muted = true;
    }
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  toggleMute() {
    if (this.muted) { this.muted = false; this.init(); } else { this.muted = true; }
    if (!this.master) return this.muted;
    this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  _env(dur, peak, attack = 0.005) {
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    return g;
  }

  _osc(type, freq, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    return o;
  }

  shoot() {
    if (!this.ctx || this.muted) return;
    const o = this._osc('triangle', 720);
    o.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.09);
    const buf = this.ctx.createBuffer(1, 2205, 44100);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const g = this._env(0.1, 0.22);
    o.connect(g); n.connect(g);
    o.start(); n.start();
    o.stop(this.ctx.currentTime + 0.12);
  }

  hit() {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, 3000, 44100);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    n.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 500; f.Q.value = 1.2;
    const g = this._env(0.07, 0.18);
    n.connect(f); f.connect(g);
    n.start();
  }

  kill(comboStep = 0) {
    if (!this.ctx || this.muted) return;
    const base = 330 * Math.pow(2, Math.min(comboStep, 12) / 12);
    const o = this._osc('square', base);
    o.frequency.exponentialRampToValueAtTime(base * 1.6, this.ctx.currentTime + 0.08);
    const g = this._env(0.14, 0.14);
    o.connect(g);
    o.start(); o.stop(this.ctx.currentTime + 0.16);
  }

  hurt() {
    if (!this.ctx || this.muted) return;
    const o = this._osc('sawtooth', 200);
    o.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.25);
    const g = this._env(0.3, 0.3);
    o.connect(g);
    o.start(); o.stop(this.ctx.currentTime + 0.32);
  }

  waveStart() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [440, 550, 660, 880].forEach((f, i) => {
      const o = this._osc('triangle', f);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.2);
      g.connect(this.master);
      o.connect(g);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.22);
    });
  }

  pick() {
    if (!this.ctx || this.muted) return;
    const o = this._osc('sine', 660);
    o.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.12);
    const g = this._env(0.2, 0.2);
    o.connect(g);
    o.start(); o.stop(this.ctx.currentTime + 0.22);
  }

  gameover() {
    if (!this.ctx || this.muted) return;
    const o = this._osc('sawtooth', 300);
    o.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 1.1);
    const g = this._env(1.2, 0.3, 0.05);
    o.connect(g);
    o.start(); o.stop(this.ctx.currentTime + 1.25);
  }
}
