// All sound is synthesised with WebAudio: no files, no network. Each effect is a short
// oscillator/noise envelope; the ambience is a slow low drone that swells during waves.
// An AudioContext can only start after a user gesture, so unlock() is called on first input.
export function createAudio() {
  let ctx = null;
  let master = null;
  let droneOsc = null;
  let droneGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // Ambient drone: two detuned sines, very quiet, always running.
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.03;
    droneGain.connect(master);
    droneOsc = ctx.createOscillator();
    droneOsc.type = "sine";
    droneOsc.frequency.value = 55;
    droneOsc.connect(droneGain);
    droneOsc.start();
    return true;
  }

  /** Call on the first user gesture; browsers block audio before one. */
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === "suspended") ctx.resume();
  }

  /** A short tone with an exponential decay envelope. */
  function tone(type, freq, seconds, volume, freqEnd) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + seconds);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  /** A short filtered-noise burst, for hits and bursts. */
  function noise(seconds, volume, cutoff) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const frames = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start(t);
  }

  return {
    unlock,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    shot() { tone("square", 880, 0.08, 0.12, 320); },
    hit() { noise(0.08, 0.18, 2400); },
    slain() { tone("triangle", 300, 0.25, 0.2, 90); noise(0.15, 0.14, 1200); },
    ember() { tone("sine", 1180, 0.12, 0.16, 1560); },
    coreHit() { tone("sawtooth", 140, 0.5, 0.3, 55); noise(0.3, 0.25, 700); },
    waveStart() { tone("sine", 440, 0.4, 0.18, 660); tone("sine", 550, 0.5, 0.12, 825); },
    waveClear() { tone("sine", 660, 0.3, 0.16); tone("sine", 880, 0.4, 0.14, 1100); },
    upgrade() { tone("sine", 520, 0.18, 0.16); tone("sine", 780, 0.22, 0.14, 900); },
    gameOver() { tone("sawtooth", 220, 1.2, 0.25, 60); },
    drone(level) {
      if (droneGain) droneGain.gain.setTargetAtTime(level, ctx.currentTime, 0.5);
    },
  };
}
