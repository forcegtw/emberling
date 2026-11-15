// random.js — seeded pseudo-random number generator (mulberry32), written fresh.
// Deterministic runs: seed once at startup (or per-run) and every subsystem that
// pulls from this module stays reproducible for the same seed.

let state = 0x9e3779b9 >>> 0; // default seed: golden-ratio constant
let uses = 0;

export function seed(s) {
  state = (s >>> 0) || 0x9e3779b9;
  uses = 0;
}

// Core generator: returns a float in [0, 1).
export function rng() {
  uses++;
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randRange(min, max) {
  return min + rng() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(p) {
  return rng() < p;
}

export function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function usesCount() {
  return uses;
}

export default { seed, rng, randRange, randInt, pick, chance, shuffle, usesCount };
