// Emberling — game state machine and simulation. States: title | play | upgrade | end.

import { W, H, SCORE } from './config.js';
import { Player, Bullet } from './entities.js';
import { WaveDirector } from './waves.js';
import { rollOffers } from './upgrades.js';
import { sfx } from './sound.js';
import { Particles, FloatTexts, ScreenShake } from './effects.js';

export class Game {
  constructor(input) {
    this.input = input;
    this.mouse = input.mouse;
    this.state = 'title';
    this.time = 0;
    this.bestScore = Number(localStorage.getItem('emberling-best') || 0);

    this.particles = new Particles();
    this.texts = new FloatTexts();
    this.shake = new ScreenShake();
    this.director = new WaveDirector(this);

    this.player = new Player(W / 2, H / 2);
    this.bullets = [];
    this.wisps = [];
    this.wave = 1;
    this.bannerTimer = 0;
    this.score = 0;
    this.combo = 0;
    this.offers = [];
  }

  startRun() {
    this.player = new Player(W / 2, H / 2);
    this.bullets = [];
    this.wisps = [];
    this.score = 0;
    this.combo = 0;
    this.state = 'play';
    this.director.beginWave(1);
    this.bannerTimer = 1.4;
    sfx.start();
  }

  completeWave() {
    this.score += SCORE.perWaveClear;
    this.texts.add(this.player.x, this.player.y - 30, `+${SCORE.perWaveClear}`, '#7ce38b');
    this.offers = rollOffers(this.player);
    this.state = 'upgrade';
    sfx.waveClear();
  }

  pickUpgrade(i) {
    const offer = this.offers[i];
    if (!offer) return;
    offer.apply(this.player);
    this.texts.add(this.player.x, this.player.y - 30, offer.name, '#ffe9b0');
    this.offers = [];
    this.state = 'play';
    this.director.beginWave(this.wave + 1);
    this.bannerTimer = 1.4;
    sfx.upgrade();
  }

  shoot(aim) {
    const p = this.player;
    const base = Math.atan2(aim.y - p.y, aim.x - p.x);
    const spread = 0.14;
    for (let i = 0; i < p.bulletCount; i++) {
      const angle = base + (i - (p.bulletCount - 1) / 2) * spread;
      this.bullets.push(new Bullet(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20, angle, p.damage, p.pierce));
    }
    this.shake.trigger(1.2);
    sfx.shoot();
  }

  killWisp(w) {
    w.dead = true;
    this.combo += 1;
    const gained = SCORE.perWisp + SCORE.comboStep * (this.combo - 1);
    this.score += gained;
    this.texts.add(w.x, w.y, `+${gained}`, '#ffe9b0');
    this.particles.burst(w.x, w.y, '#7fd8ff', w.kind === 'brute' ? 26 : 14, 200);
    this.shake.trigger(w.kind === 'brute' ? 5 : 2);
    sfx.wispDies();
  }

  update(dt) {
    this.time += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    this.particles.update(dt);
    this.texts.update(dt);
    this.shake.update(dt);

    if (this.state === 'title') {
      if (this.input.takeStart() || this.input.takeFire()) this.startRun();
      return;
    }
    if (this.state === 'end') {
      if (this.input.takeStart() || this.input.takeFire()) this.startRun();
      return;
    }
    if (this.state === 'upgrade') {
      const c = this.input.takeChoice();
      if (c >= 0) this.pickUpgrade(c);
      return;
    }

    // --- play ---
    const aim = this.player.update(dt, this.input.moveAxis(), this.mouse, this.input.firing());
    if (aim) this.shoot(aim);

    for (const b of this.bullets) b.update(dt);
    for (const w of this.wisps) w.update(dt, this.player);

    // bullets vs wisps
    for (const b of this.bullets) {
      for (const w of this.wisps) {
        if (w.dead || b.dead) continue;
        if (Math.hypot(b.x - w.x, b.y - w.y) < b.r + w.r) {
          w.hp -= b.damage;
          this.particles.burst(b.x, b.y, '#c8f2ff', 5, 100, 0.25);
          if (w.hp <= 0) this.killWisp(w);
          if (b.pierce > 0) b.pierce -= 1;
          else b.dead = true;
        }
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    this.wisps = this.wisps.filter(w => !w.dead);

    // wisps vs player
    for (const w of this.wisps) {
      if (Math.hypot(w.x - this.player.x, w.y - this.player.y) < w.r + this.player.radius()) {
        if (this.player.hit()) {
          this.combo = 0;
          this.particles.burst(this.player.x, this.player.y, '#ff5b6a', 20, 220);
          this.shake.trigger(10);
          this.texts.add(this.player.x, this.player.y - 30, 'OUCH', '#ff5b6a');
          sfx.playerHurt();
          w.hp = 0;
          w.dead = true;
          if (this.player.hp <= 0) this.endRun();
        }
      }
    }
    this.wisps = this.wisps.filter(w => !w.dead);

    this.director.update(dt);
  }

  endRun() {
    this.state = 'end';
    this.shake.trigger(16);
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('emberling-best', String(this.bestScore));
    }
    sfx.gameOver();
  }

  get enemiesLeft() {
    return this.wisps.length + this.director.spawnQueue.length;
  }
}
