// Emberling — all sound is synthesized here with WebAudio. No files, no network.
// One lazily-created AudioContext; every effect is a short oscillator/noise voice.

let ctx = null;
let master = null;

function audio() {
  // Screenshot mode runs headless with no user gesture: stay silent, no console warnings.
  if (new URLSearchParams(location.search).has('shot')) return null;
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.5, slideTo = null, delay = 0) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.4, filterFreq = 1200, delay = 0) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(gain).connect(master);
  src.start(t0);
}

export const sfx = {
  shoot()      { tone(660, 0.09, 'square', 0.25, 220); },
  wispDies()   { noise(0.18, 0.35, 900); tone(300, 0.15, 'triangle', 0.3, 80); },
  playerHurt() { tone(200, 0.3, 'sawtooth', 0.5, 60); noise(0.25, 0.4, 500); },
  waveClear()  { tone(440, 0.12, 'square', 0.3); tone(550, 0.12, 'square', 0.3, null, 0.12); tone(660, 0.2, 'square', 0.35, null, 0.24); },
  upgrade()    { tone(520, 0.1, 'triangle', 0.4); tone(780, 0.15, 'triangle', 0.4, null, 0.1); },
  gameOver()   { tone(320, 0.4, 'sawtooth', 0.4, 60); tone(160, 0.5, 'square', 0.3, 40, 0.3); },
  start()      { tone(330, 0.12, 'square', 0.35); tone(495, 0.18, 'square', 0.35, null, 0.12); },
};
