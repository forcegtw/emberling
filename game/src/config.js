// Emberling — configuration and palette.
// A flame spirit survives waves of frost wisps in a frozen arena.

export const W = 1280;
export const H = 720;

export const ARENA = { w: 1280, h: 720, pad: 24 };

export const PALETTE = {
  bg: '#0a0e1a',
  bgGrid: '#131a2e',
  arenaEdge: '#2a3555',
  ember: '#ff9d3c',
  emberCore: '#ffe9b0',
  frost: '#7fd8ff',
  frostDeep: '#3a6ea8',
  shard: '#c8f2ff',
  danger: '#ff5b6a',
  good: '#7ce38b',
  text: '#e8eefc',
  dim: '#8fa0c0',
};

export const PLAYER = {
  radius: 14,
  speed: 260,          // px/s with WASD
  maxHp: 3,
  fireCooldown: 0.22,  // seconds between shots
  bulletSpeed: 520,
  invulnTime: 1.2,     // after taking a hit
};

export const WAVE = {
  baseEnemies: 6,      // enemies in wave 1
  growth: 2,           // extra enemies per wave
  spawnInterval: 0.55,
  speedBase: 55,
  speedPerWave: 9,
  hpBase: 1,
  hpEvery2Waves: 1,
};

export const SCORE = {
  perWisp: 10,
  perWaveClear: 100,
  comboStep: 5,        // combo grows by one per hit, adds comboStep*combo per kill
};
