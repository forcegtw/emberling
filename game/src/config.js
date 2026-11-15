// Emberling — tuned constants. All gameplay feel lives here.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const CONFIG = {
  player: {
    radius: 14,
    speed: 240,          // px/s
    hp: 6,               // ember hearts
    maxHp: 8,
    invulnTime: 1.1,     // s after taking a hit
    regenDelay: 6,       // s without damage before slow regen
    regenRate: 1 / 9,    // hp per second while regenerating
  },
  bullet: {
    speed: 640,
    radius: 5,
    life: 0.85,          // s
    cooldown: 0.22,      // s between shots
    damage: 12,
    pierce: 0,           // extra enemies a bullet can pass through
  },
  ember: {
    startRadius: 46,     // the central flame you defend (visual)
  },
  waves: {
    firstBudget: 5,
    budgetGrowth: 1.55,  // enemies per wave, multiplicative
    spawnGap: 0.55,      // s between spawns, shrinks with wave
    spawnGapMin: 0.12,
    betweenWavePause: 2.4,
  },
  enemies: {
    // base stats; scaled per wave in waves.js
    wisp:   { hp: 20, speed: 68,  radius: 13, damage: 1, score: 10 },
    shard:  { hp: 46, speed: 118, radius: 11, damage: 1, score: 25 },
    brute:  { hp: 130, speed: 44, radius: 24, damage: 2, score: 60 },
  },
  combo: {
    window: 2.6,         // s to keep the chain alive
    perKill: 0.12,       // score multiplier bonus per chain step
    maxMult: 8,
  },
  seedDefault: 7,
};

// Deterministic RNG: mulberry32.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
