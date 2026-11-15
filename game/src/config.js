// Every tuning number and colour of Lumenfall in one place. The arena is a fixed 1280x720
// logical stage; the renderer scales it to the window, so no rule below depends on screen size.

export const STEP = 1 / 60;            // fixed simulation step: 60 updates a second
export const FIELD = { width: 1280, height: 720 };
export const CORE = { x: 640, y: 360, radius: 26, hpMax: 100, hitFlashSeconds: 0.35 };

export const PLAYER = {
  radius: 13,
  speed: 290,
  fireInterval: 0.16,   // seconds between shots
  bulletSpeed: 640,
  bulletDamage: 12,
  bulletRadius: 4,
  pickRadius: 34,       // distance at which embers are drawn to the player
};

export const LIVES = 3;

export const WAVE = {
  first: 1,
  spawnIntervalStart: 1.15,
  spawnIntervalPerWave: 0.82,   // interval is multiplied by this each wave
  spawnIntervalMin: 0.28,
  enemiesPerWaveBase: 6,
  enemiesPerWavePerWave: 3,
  enemiesPerWaveLateGrowth: 0.7, // quadratic extra enemies per wave beyond wave 4
  shadeGrowthPerWave: 0.09,      // shade hp multiplier added per wave
  shadeSpeedGrowthPerWave: 0.03, // shade speed multiplier added per wave
  intermission: 4.5,            // seconds between waves (upgrade choice sits over it)
  announceSeconds: 2.2,
};

export const SHADE = {
  crawler: { radius: 12, hp: 22, speed: 96, damage: 6, score: 15, color: "crawler" },
  drifter: { radius: 16, hp: 40, speed: 62, damage: 10, score: 30, color: "drifter" },
  spitter: { radius: 14, hp: 30, speed: 58, damage: 4, score: 40, color: "spitter" },
  brute:   { radius: 24, hp: 110, speed: 46, damage: 18, score: 80, color: "brute" },
  husk:    { radius: 11, hp: 12, speed: 150, damage: 4, score: 20, color: "husk" },
};

/** Which shades a wave may pick from, and how many of each spawn per wave (relative weights). */
export const WAVE_MIX = [
  { kind: "crawler", weight: 10, fromWave: 1 },
  { kind: "drifter", weight: 6,  fromWave: 2 },
  { kind: "spitter", weight: 4,  fromWave: 3 },
  { kind: "brute",   weight: 2,  fromWave: 5 },
  { kind: "husk",    weight: 7,  fromWave: 4 },
];

export const EMBER = {
  value: 1,
  radius: 6,
  lifetime: 14,
  magnetSpeed: 420,
  heal: 2,
};

export const SPIT = { speed: 200, radius: 6, damage: 8 };

/** The upgrade choices offered after each wave; pick one of three, effects stack. */
export const UPGRADES = [
  { id: "rapid",   title: "Swift Bolt",   detail: "Fire 25% faster" },
  { id: "power",   title: "Bright Shot",  detail: "Bolts deal +6 damage" },
  { id: "piercing",title: "Piercing Ray", detail: "Bolts pass through one more shade" },
  { id: "speed",   title: "Light Step",   detail: "Move 18% faster" },
  { id: "repair",  title: "Warm Glow",    detail: "Core repairs 25 HP now" },
  { id: "multishot",title:"Split Ray",    detail: "+1 bolt per shot, spread" },
  { id: "shield",  title: "Halo Shield",  detail: "Shades near you are slowed" },
  { id: "magnet",  title: "Ember Lure",   detail: "Embers fly to you from further" },
  { id: "vital",   title: "Second Wick",  detail: "+1 life (max 5)" },
  { id: "scorch",  title: "Scorch Trail", detail: "Slain shades burn their neighbours" },
  { id: "aegis",   title: "Aegis Ward",   detail: "Core takes 15% less damage (stacks)" },
];

export const PALETTE = {
  night: "#0b0a12",
  ground: "#14121f",
  grid: "#1c1930",
  core: "#ffd97a",
  coreGlow: "#ffb347",
  player: "#7fe3ff",
  bolt: "#a5f3ff",
  ember: "#ffbb55",
  crawler: "#b483f5",
  drifter: "#6fa8ff",
  spitter: "#ff7ac2",
  brute: "#ff6a5e",
  husk: "#9d99c4",
  spit: "#b45fd6",
  text: "#f2ecff",
  muted: "#8f8aa8",
  panel: "rgba(16, 13, 28, 0.92)",
  danger: "#e05a5a",
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = "lumenfall.best";
