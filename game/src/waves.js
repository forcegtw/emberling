// Emberling — wave director: spawns wisps, tracks progress, and opens upgrade choices.

import { WAVE, ARENA } from './config.js';
import { Wisp } from './entities.js';

export class WaveDirector {
  constructor(game) {
    this.game = game;
    this.spawnQueue = [];
    this.spawnTimer = 0;
  }

  beginWave(n) {
    this.game.wave = n;
    const total = WAVE.baseEnemies + WAVE.growth * (n - 1);
    this.spawnQueue = [];
    for (let i = 0; i < total; i++) {
      const roll = Math.random();
      const kind = n >= 3 && roll < 0.2 ? 'brute' : n >= 2 && roll < 0.45 ? 'dart' : 'drifter';
      this.spawnQueue.push(kind);
    }
    this.spawnTimer = 0.5;
  }

  update(dt) {
    const g = this.game;
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = WAVE.spawnInterval;
        const kind = this.spawnQueue.pop();
        g.wisps.push(this.spawnAtEdge(kind));
      }
    } else if (g.wisps.length === 0 && g.state === 'play') {
      g.completeWave();
    }
  }

  // Wisps enter from a random edge point outside the arena, then walk in.
  spawnAtEdge(kind) {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = ARENA.pad + Math.random() * (ARENA.w - ARENA.pad * 2); y = -30; }
    else if (side === 1) { x = ARENA.w + 30; y = ARENA.pad + Math.random() * (ARENA.h - ARENA.pad * 2); }
    else if (side === 2) { x = ARENA.pad + Math.random() * (ARENA.w - ARENA.pad * 2); y = ARENA.h + 30; }
    else { x = -30; y = ARENA.pad + Math.random() * (ARENA.h - ARENA.pad * 2); }
    const w = new Wisp(x, y, this.game.wave, kind);
    w.inside = false;
    return w;
  }
}
