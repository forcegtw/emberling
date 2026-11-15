// The rules of Lumenfall, with no drawing and no sound: entities, waves, upgrades, collisions.
// step() advances the simulation one fixed step and returns a bitmask of events for main.js.
import {
  CORE, EMBER, FIELD, LIVES, PALETTE, PLAYER, SHADE, SPIT, STEP, UPGRADES, WAVE, WAVE_MIX,
} from "./config.js";
import { randomRange, weightedPick } from "./random.js";

export const EVENT_WAVE_START = 1;
export const EVENT_WAVE_CLEAR = 2;
export const EVENT_CORE_HIT = 4;
export const EVENT_PLAYER_HIT = 8;
export const EVENT_SHOT_FIRED = 16;
export const EVENT_SHADE_SLAIN = 32;
export const EVENT_EMBER_PICKED = 64;
export const EVENT_UPGRADE_READY = 128;
export const EVENT_GAME_OVER = 256;
export const EVENT_SPIT_FIRED = 512;

const DIAG = Math.SQRT1_2; // normalises a diagonal move so no direction is faster

/** Squared distance between two points - avoids a sqrt for radius overlap tests. */
function distSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function emptyState() {
  return {
    wave: 0,
    score: 0,
    embers: 0,          // currency: embers banked
    lives: LIVES,
    coreHp: CORE.hpMax,
    player: { x: CORE.x, y: CORE.y + 120, aimX: CORE.x + 200, aimY: CORE.y },
    fireCooldown: 0,
    invulnerable: 0,
    shots: [],          // player bolts
    spits: [],          // shade projectiles
    shades: [],
    droppedEmbers: [],
    effects: [],        // transient visuals: hit bursts, sparks
    stats: {
      fireInterval: PLAYER.fireInterval,
      bulletDamage: PLAYER.bulletDamage,
      piercing: 0,
      moveSpeed: PLAYER.speed,
      multishot: 1,
      shield: false,
      magnet: PLAYER.pickRadius,
      scorch: 0,
      coreArmor: 0,     // stacking damage reduction on the core, 0.15 per pick
    },
    spawnTimer: 0,
    toSpawn: 0,
    aliveThisWave: 0,
    intermission: 0,
    announce: 0,
    upgradesOffered: null,
    upgradeCount: 0,
    coreFlash: 0,
    shake: 0,
  };
}

export function createWorld(rng) {
  const state = emptyState();

  function beginWave(number) {
    state.wave = number;
    // Gentle onboarding, steep late game: near-flat for waves 1-4, then compounding.
    const early = Math.max(0, number - 4);
    state.toSpawn = WAVE.enemiesPerWaveBase
      + Math.min(number - 1, 3) * WAVE.enemiesPerWavePerWave
      + Math.round(early * early * WAVE.enemiesPerWaveLateGrowth);
    state.aliveThisWave = 0;
    state.spawnTimer = 0.6;
    state.announce = WAVE.announceSeconds;
    const mix = WAVE_MIX.filter((entry) => number >= entry.fromWave);
    state.waveMix = mix;
  }

  function spawnShade() {
    const pick = weightedPick(rng, state.waveMix);
    const spec = SHADE[pick.kind];
    // Spawn just outside the arena edge, on a random side, away from the very corners.
    const side = Math.floor(rng() * 4);
    const t = randomRange(rng, 0.08, 0.92);
    let x; let y;
    if (side === 0) { x = FIELD.width * t; y = -40; }
    else if (side === 1) { x = FIELD.width + 40; y = FIELD.height * t; }
    else if (side === 2) { x = FIELD.width * t; y = FIELD.height + 40; }
    else { x = -40; y = FIELD.height * t; }
    // Waves toughen shades: each wave compounds hp and speed growth.
    const growth = 1 + (state.wave - 1) * WAVE.shadeGrowthPerWave;
    state.shades.push({
      kind: pick.kind,
      x, y,
      hp: spec.hp * growth,
      hpMax: spec.hp * growth,
      speed: spec.speed * (1 + (state.wave - 1) * WAVE.shadeSpeedGrowthPerWave),
      slow: 0,           // seconds of halo-slow remaining
      hitFlash: 0,
      burn: 0,
      burnTick: 0,
    });
    state.toSpawn -= 1;
    state.aliveThisWave += 1;
  }

  function killShade(index) {
    const shade = state.shades[index];
    state.score += SHADE[shade.kind].score;
    // Embers drop: most shades one, brutes three.
    const count = shade.kind === "brute" ? 3 : 1;
    for (let i = 0; i < count; i += 1) {
      state.droppedEmbers.push({
        x: shade.x + randomRange(rng, -10, 10),
        y: shade.y + randomRange(rng, -10, 10),
        age: 0,
      });
    }
    if (state.stats.scorch > 0) {
      for (const other of state.shades) {
        if (other === shade) continue;
        if (distSq(other.x, other.y, shade.x, shade.y) < 130 * 130) {
          other.burn = Math.max(other.burn, state.stats.scorch);
        }
      }
      state.effects.push({ kind: "burnring", x: shade.x, y: shade.y, age: 0, life: 0.4 });
    }
    state.effects.push({ kind: "burst", x: shade.x, y: shade.y, age: 0, life: 0.35, color: PALETTE[SHADE[shade.kind].color] });
    state.shades.splice(index, 1);
    state.aliveThisWave -= 1;
  }

  function fireShot(aimX, aimY) {
    const player = state.player;
    const dx = aimX - player.x;
    const dy = aimY - player.y;
    const angle = Math.atan2(dy, dx);
    const shots = state.stats.multishot;
    for (let i = 0; i < shots; i += 1) {
      const spread = shots === 1 ? 0 : (i - (shots - 1) / 2) * 0.14;
      const a = angle + spread;
      state.shots.push({
        x: player.x + Math.cos(a) * 16,
        y: player.y + Math.sin(a) * 16,
        vx: Math.cos(a) * PLAYER.bulletSpeed,
        vy: Math.sin(a) * PLAYER.bulletSpeed,
        pierce: state.stats.piercing,
      });
    }
    state.fireCooldown = state.stats.fireInterval;
    state.effects.push({ kind: "muzzle", x: player.x + Math.cos(angle) * 18, y: player.y + Math.sin(angle) * 18, age: 0, life: 0.12, color: PALETTE.bolt });
    return EVENT_SHOT_FIRED;
  }

  function hurtCore(damage) {
    const dealt = Math.max(1, Math.round(damage * (1 - state.stats.coreArmor)));
    state.coreHp = Math.max(0, state.coreHp - dealt);
    state.coreFlash = CORE.hitFlashSeconds;
    state.shake = Math.min(14, state.shake + 6);
    if (state.coreHp <= 0) {
      state.lives -= 1;
      state.coreHp = state.lives > 0 ? CORE.hpMax : 0;
      state.shades.length = 0;
      state.spits.length = 0;
      state.shots.length = 0;
      if (state.lives <= 0) return EVENT_CORE_HIT | EVENT_GAME_OVER;
      return EVENT_CORE_HIT;
    }
    return EVENT_CORE_HIT;
  }

  /** Apply a chosen upgrade id to the live state (exposed on the world below). */
  function applyUpgrade(id) {
    const s = state.stats;
    switch (id) {
      case "rapid": s.fireInterval *= 0.75; break;
      case "power": s.bulletDamage += 6; break;
      case "piercing": s.piercing += 1; break;
      case "speed": s.moveSpeed *= 1.18; break;
      case "repair": state.coreHp = Math.min(CORE.hpMax, state.coreHp + 25); break;
      case "multishot": s.multishot += 1; break;
      case "shield": s.shield = true; break;
      case "magnet": s.magnet += 90; break;
      case "vital": state.lives = Math.min(5, state.lives + 1); break;
      case "scorch": s.scorch += 1.6; break;
      case "aegis": s.coreArmor = Math.min(0.6, s.coreArmor + 0.15); break;
      default: break;
    }
    state.upgradeCount += 1;
    state.upgradesOffered = null;
    beginWave(state.wave + 1);
  }

  function offerUpgrades() {
    // Three distinct random upgrades from the list.
    const pool = UPGRADES.filter((u) => u.id !== "vital" || state.lives < 5);
    const chosen = [];
    while (chosen.length < 3 && pool.length > 0) {
      const index = Math.floor(rng() * pool.length);
      chosen.push(pool.splice(index, 1)[0]);
    }
    state.upgradesOffered = chosen;
    state.intermission = WAVE.intermission;
  }

  return {
    state,

    applyUpgrade,

    reset() {
      Object.assign(state, emptyState());
      state.player = emptyState().player;
      beginWave(1);
    },

    /** One fixed step. moveX/moveY in {-1,0,1}; firing true when the player holds the trigger. */
    step(moveX, moveY, firing, aimX, aimY) {
      let events = 0;
      const s = state.stats;

      // Announcements and intermission timers tick down always.
      if (state.announce > 0) state.announce -= STEP;
      if (state.coreFlash > 0) state.coreFlash -= STEP;
      if (state.shake > 0) state.shake = Math.max(0, state.shake - STEP * 30);

      // --- player movement ---
      const player = state.player;
      const len = Math.hypot(moveX, moveY) || 1;
      player.x += (moveX / len) * s.moveSpeed * STEP * (Math.abs(moveX) + Math.abs(moveY) > 1 ? DIAG : 1);
      player.y += (moveY / len) * s.moveSpeed * STEP * (Math.abs(moveX) + Math.abs(moveY) > 1 ? DIAG : 1);
      player.x = Math.max(20, Math.min(FIELD.width - 20, player.x));
      player.y = Math.max(20, Math.min(FIELD.height - 20, player.y));
      player.aimX = aimX;
      player.aimY = aimY;
      if (state.invulnerable > 0) state.invulnerable -= STEP;
      state.fireCooldown -= STEP;

      // --- firing ---
      if (firing && state.fireCooldown <= 0 && state.lives > 0) events |= fireShot(aimX, aimY);

      // --- wave flow ---
      if (state.upgradesOffered) {
        // Intermission: wait for the pick (or run out the clock, which takes the first).
        state.intermission -= STEP;
        if (state.intermission <= 0) {
          applyUpgrade(state.upgradesOffered[0].id);
        }
      } else if (state.toSpawn > 0) {
        state.spawnTimer -= STEP;
        if (state.spawnTimer <= 0) {
          spawnShade();
          const interval = Math.max(WAVE.spawnIntervalMin,
            WAVE.spawnIntervalStart * Math.pow(WAVE.spawnIntervalPerWave, state.wave - 1));
          state.spawnTimer = interval * randomRange(rng, 0.7, 1.3);
        }
      } else if (state.aliveThisWave === 0 && state.shades.length === 0) {
        events |= EVENT_WAVE_CLEAR;
        state.score += 25 * state.wave; // clear bonus
        offerUpgrades();
        events |= EVENT_UPGRADE_READY;
      }

      // --- shades act ---
      for (let i = state.shades.length - 1; i >= 0; i -= 1) {
        const shade = state.shades[i];
        if (shade.hitFlash > 0) shade.hitFlash -= STEP;
        if (shade.slow > 0) shade.slow -= STEP;
        // Scorch burn ticks.
        if (shade.burn > 0) {
          shade.burnTick += STEP;
          if (shade.burnTick >= 0.5) {
            shade.burnTick = 0;
            shade.hp -= shade.burn * 8;
            shade.hitFlash = 0.15;
            if (shade.hp <= 0) { killShade(i); continue; }
          }
        }
        // Move toward the lantern core (not the player): the core is the prize.
        const dx = CORE.x - shade.x;
        const dy = CORE.y - shade.y;
        const dist = Math.hypot(dx, dy);
        const speedFactor = shade.slow > 0 ? 0.45 : 1;
        const stepSize = shade.speed * speedFactor * STEP;
        shade.x += (dx / dist) * stepSize;
        shade.y += (dy / dist) * stepSize;
        // Contact with the core: damage and die.
        if (dist <= CORE.radius + SHADE[shade.kind].radius + 4) {
          events |= hurtCore(SHADE[shade.kind].damage);
          state.effects.push({ kind: "burst", x: shade.x, y: shade.y, age: 0, life: 0.4, color: PALETTE.coreGlow });
          state.shades.splice(i, 1);
          state.aliveThisWave -= 1;
          continue;
        }
        // Contact with the player: shove and hurt the player's ember purse slightly? No: brief core
        // knockback for the shade and a small screen nudge, so bodies never sit on the player.
        const pdx = shade.x - player.x; const pdy = shade.y - player.y;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist < SHADE[shade.kind].radius + PLAYER.radius && pdist > 0.01) {
          const push = (SHADE[shade.kind].radius + PLAYER.radius - pdist) * 0.5;
          shade.x += (pdx / pdist) * push;
          shade.y += (pdy / pdist) * push;
        }
        // Spitters lob a bolt at the core on a cadence.
        if (shade.kind === "spitter" && dist > 220 && rng() < STEP / 2.4) {
          const a = Math.atan2(CORE.y - shade.y, CORE.x - shade.x);
          state.spits.push({ x: shade.x, y: shade.y, vx: Math.cos(a) * SPIT.speed, vy: Math.sin(a) * SPIT.speed });
          events |= EVENT_SPIT_FIRED;
        }
      }

      // --- player bolts ---
      for (let i = state.shots.length - 1; i >= 0; i -= 1) {
        const shot = state.shots[i];
        shot.x += shot.vx * STEP;
        shot.y += shot.vy * STEP;
        if (shot.x < -30 || shot.x > FIELD.width + 30 || shot.y < -30 || shot.y > FIELD.height + 30) {
          state.shots.splice(i, 1);
          continue;
        }
        for (let j = state.shades.length - 1; j >= 0; j -= 1) {
          const shade = state.shades[j];
          if (distSq(shade.x, shade.y, shot.x, shot.y) < (SHADE[shade.kind].radius + PLAYER.bulletRadius) ** 2) {
            shade.hp -= s.bulletDamage;
            shade.hitFlash = 0.12;
            state.effects.push({ kind: "spark", x: shot.x, y: shot.y, age: 0, life: 0.2, color: PALETTE.bolt });
            if (shade.hp <= 0) { killShade(j); events |= EVENT_SHADE_SLAIN; }
            if (shot.pierce > 0) shot.pierce -= 1;
            else { state.shots.splice(i, 1); break; }
          }
        }
      }

      // --- shade spit ---
      for (let i = state.spits.length - 1; i >= 0; i -= 1) {
        const spit = state.spits[i];
        spit.x += spit.vx * STEP;
        spit.y += spit.vy * STEP;
        const dx = spit.x - CORE.x; const dy = spit.y - CORE.y;
        if (dx * dx + dy * dy < (CORE.radius + SPIT.radius) ** 2) {
          events |= hurtCore(SPIT.damage);
          state.spits.splice(i, 1);
          continue;
        }
        if (distSq(spit.x, spit.y, player.x, player.y) < (PLAYER.radius + SPIT.radius) ** 2) {
          state.spits.splice(i, 1);
          state.shake = Math.min(10, state.shake + 4);
          continue;
        }
        if (spit.x < -40 || spit.x > FIELD.width + 40 || spit.y < -40 || spit.y > FIELD.height + 40) {
          state.spits.splice(i, 1);
        }
      }

      // --- embers ---
      for (let i = state.droppedEmbers.length - 1; i >= 0; i -= 1) {
        const ember = state.droppedEmbers[i];
        ember.age += STEP;
        const dx = player.x - ember.x; const dy = player.y - ember.y;
        const dist = Math.hypot(dx, dy);
        if (dist < s.magnet) {
          ember.x += (dx / dist) * EMBER.magnetSpeed * STEP;
          ember.y += (dy / dist) * EMBER.magnetSpeed * STEP;
        }
        if (dist < PLAYER.radius + EMBER.radius) {
          state.embers += EMBER.value;
          state.score += 5;
          events |= EVENT_EMBER_PICKED;
          state.effects.push({ kind: "spark", x: ember.x, y: ember.y, age: 0, life: 0.25, color: PALETTE.ember });
          state.droppedEmbers.splice(i, 1);
          continue;
        }
        if (ember.age > EMBER.lifetime) state.droppedEmbers.splice(i, 1);
      }

      // --- effect decay ---
      for (let i = state.effects.length - 1; i >= 0; i -= 1) {
        state.effects[i].age += STEP;
        if (state.effects[i].age >= state.effects[i].life) state.effects.splice(i, 1);
      }

      return events;
    },
  };
}
