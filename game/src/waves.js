// Wave spawning and pacing. Deterministic when given a seeded rng.
import { CONFIG } from './config.js';
import { spawnEnemy } from './entities.js';

export class Waves {
  constructor(rng) {
    this.rng = rng;
    this.wave = 0;
    this.state = 'idle';        // idle | spawning | fighting | done
    this.pending = [];
    this.spawnTimer = 0;
    this.spawnGap = CONFIG.waves.spawnGap;
    this.pauseTimer = 0;
  }

  startNext() {
    this.wave++;
    const budget = Math.round(CONFIG.waves.firstBudget * Math.pow(CONFIG.waves.budgetGrowth, this.wave - 1));
    this.spawnGap = Math.max(CONFIG.waves.spawnGapMin, CONFIG.waves.spawnGap - this.wave * 0.035);
    this.pending = buildQueue(this.rng, this.wave, budget);
    this.state = 'spawning';
    this.spawnTimer = 0;
    return budget;
  }

  update(dt, enemies, onWaveCleared) {
    if (this.state === 'spawning') {
      this.spawnTimer -= dt;
      while (this.spawnTimer <= 0 && this.pending.length > 0) {
        const kind = this.pending.pop();
        enemies.push(spawnEnemy(this.rng, kind, this.wave, scaleFor(this.wave)));
        this.spawnTimer += this.spawnGap;
      }
      if (this.pending.length === 0) this.state = 'fighting';
    } else if (this.state === 'fighting' && enemies.length === 0) {
      this.state = 'done';
      this.pauseTimer = CONFIG.waves.betweenWavePause;
      if (onWaveCleared) onWaveCleared(this.wave);
    } else if (this.state === 'done') {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.startNext();
    }
  }

  // true when the wave cleared and the upgrade pick should be offered
  clearedThisFrame(prevEnemiesLen, enemiesLen) {
    return this.state === 'done' && prevEnemiesLen > 0 && enemiesLen === 0 && this.pauseTimer >= CONFIG.waves.betweenWavePause - 0.02;
  }
}

export function scaleFor(wave) {
  return {
    hp: 1 + (wave - 1) * 0.22,
    speed: 1 + (wave - 1) * 0.045,
  };
}

function buildQueue(rng, wave, budget) {
  // Wisp costs 1, shard 2, brute 5. Brutes join from wave 3, shards from wave 2.
  const picks = [];
  let left = budget;
  const canBrute = wave >= 3, canShard = wave >= 2;
  while (left > 0) {
    const roll = rng();
    if (canBrute && roll < 0.14 && left >= 5) { picks.push('brute'); left -= 5; }
    else if (canShard && roll < 0.48 && left >= 2) { picks.push('shard'); left -= 2; }
    else { picks.push('wisp'); left -= 1; }
  }
  return picks;
}
