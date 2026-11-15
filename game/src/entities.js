// Emberling — player (a flame spirit), frost wisp enemies and bullets.

import { PLAYER, WAVE, ARENA } from './config.js';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.hp = PLAYER.maxHp;
    this.cooldown = 0;
    this.invuln = 0;
    this.flame = 0; // idle animation phase
    // Upgrade stats (upgrades.js raises these)
    this.fireRateMul = 1;
    this.damage = 1;
    this.bulletCount = 1;
    this.speedMul = 1;
    this.pierce = 0;
  }

  radius() { return PLAYER.radius; }

  update(dt, axis, mouse, firing) {
    const sp = PLAYER.speed * this.speedMul;
    this.x = Math.max(ARENA.pad + PLAYER.radius, Math.min(ARENA.w - ARENA.pad - PLAYER.radius, this.x + axis.x * sp * dt));
    this.y = Math.max(ARENA.pad + PLAYER.radius, Math.min(ARENA.h - ARENA.pad - PLAYER.radius, this.y + axis.y * sp * dt));
    this.flame += dt * 6;
    if (this.invuln > 0) this.invuln -= dt;
    this.cooldown -= dt;
    const wantFire = firing || mouse.down;
    if (wantFire && this.cooldown <= 0) {
      this.cooldown = PLAYER.fireCooldown / this.fireRateMul;
      return mouse; // caller turns this into bullets
    }
    return null;
  }

  hit() {
    if (this.invuln > 0) return false;
    this.hp -= 1;
    this.invuln = PLAYER.invulnTime;
    return true;
  }
}

export class Bullet {
  constructor(x, y, angle, damage, pierce) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * PLAYER.bulletSpeed;
    this.vy = Math.sin(angle) * PLAYER.bulletSpeed;
    this.damage = damage;
    this.pierce = pierce;
    this.dead = false;
    this.r = 5;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > ARENA.w + 20 || this.y < -20 || this.y > ARENA.h + 20) this.dead = true;
  }
}

export class Wisp {
  constructor(x, y, wave, kind) {
    this.x = x; this.y = y;
    this.kind = kind; // 'drifter' | 'dart' | 'brute'
    this.r = kind === 'brute' ? 20 : kind === 'dart' ? 10 : 13;
    const kindSpeed = kind === 'dart' ? 1.9 : kind === 'brute' ? 0.6 : 1;
    this.speed = (WAVE.speedBase + WAVE.speedPerWave * wave) * kindSpeed;
    this.hp = WAVE.hpBase + Math.floor(wave / 2) * (kind === 'brute' ? 2 : 1);
    this.maxHp = this.hp;
    this.wobble = Math.random() * Math.PI * 2;
    this.dead = false;
  }

  update(dt, player) {
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.wobble += dt * 3;
    if (this.kind === 'dart') {
      // darts lunge: fast dashes with brief pauses
      const lunge = (Math.sin(this.wobble * 1.5) > 0) ? 1 : 0.15;
      this.x += (dx / d) * this.speed * lunge * dt;
      this.y += (dy / d) * this.speed * lunge * dt;
    } else {
      const drift = Math.cos(this.wobble) * 30;
      this.x += (dx / d) * this.speed * dt - (dy / d) * drift * dt;
      this.y += (dy / d) * this.speed * dt + (dx / d) * drift * dt;
    }
  }
}
