// Game state machine and the core update loop.
import { CONFIG, VIEW_W, makeRng } from './config.js';
import { Sound } from './sound.js';
import { Effects } from './effects.js';
import { Input } from './input.js';
import * as E from './entities.js';
import { Waves } from './waves.js';
import { rollOffers } from './upgrades.js';
import * as R from './render.js';

const CARD_W = 280, CARD_H = 220, CARD_GAP = 40;

function cardRect(i) {
  const x0 = VIEW_W / 2 - (CARD_W * 3 + CARD_GAP * 2) / 2;
  return { x: x0 + i * (CARD_W + CARD_GAP), y: 260, w: CARD_W, h: CARD_H };
}

export class Game {
  constructor(canvas, params = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new Sound();
    this.input = new Input(canvas);
    this.effects = new Effects();
    this.seed = params.seed != null && !isNaN(Number(params.seed)) ? Number(params.seed) : CONFIG.seedDefault;
    this.shotMode = params.shot || null;   // title|play|upgrade|end
    this.reset();
    this.time = 0;

    if (this.shotMode) {
      this.sound.muted = true;
      this.applyShotState();
    }

    this._loop = this.loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  reset() {
    this.rng = makeRng(this.seed ^ 0x9e3779b9);
    this.player = E.makePlayer();
    this.bullets = [];
    this.enemies = [];
    this.waves = new Waves(this.rng);
    this.score = 0;
    this.combo = { count: 0, mult: 1, timer: 0 };
    this.state = 'title';
    this.offers = [];
    this.takenCounts = {};
    this.effects.clear();
  }

  comboOnKill(e) {
    this.combo.count++;
    this.combo.timer = CONFIG.combo.window;
    this.combo.mult = Math.min(CONFIG.combo.maxMult, 1 + this.combo.count * CONFIG.combo.perKill);
    const gained = Math.round(e.score * this.combo.mult);
    this.score += gained;
    this.effects.text(e.x, e.y - e.radius - 14, `+${gained}`, '#ffd27a', 14);
    this.sound.kill(this.combo.count);
  }

  startRun() {
    this.reset();
    this.state = 'play';
    this.sound.init();
    this.sound.resume();
    this.sound.waveStart();
    this.waves.startNext();
  }

  applyShotState() {
    // Force a specific visual state deterministically for screenshots.
    if (this.shotMode === 'title') {
      this.state = 'title';
      this.time = 1.5;
      return;
    }
    this.startRun();
    const dt = 1 / 60;
    for (let i = 0; i < 240; i++) this.step(dt);   // fast-forward 4s of combat
    if (this.shotMode === 'upgrade') {
      this.enemies.length = 0;
      this.beginUpgradePick();
    } else if (this.shotMode === 'end') {
      this.player.hp = 0;
      this.state = 'end';
    }
    this.time = 4;
  }

  beginUpgradePick() {
    this.offers = rollOffers(this.rng, this.takenCounts);
    this.state = 'upgrade';
  }

  pickOffer(i) {
    const o = this.offers[i];
    if (!o) return;
    o.apply(this.player);
    this.takenCounts[o.id] = (this.takenCounts[o.id] || 0) + 1;
    this.effects.text(VIEW_W / 2, VIEW_H / 2 - 40, o.name.toUpperCase(), '#ffd27a', 26);
    this.sound.pick();
    this.offers = [];
    this.state = 'play';
    this.waves.state = 'done';
    this.waves.pauseTimer = 0.6;
    this.sound.waveStart();
  }

  clickedCard() {
    for (let i = 0; i < 3; i++) {
      const r = cardRect(i);
      if (this.input.mouseX >= r.x && this.input.mouseX <= r.x + r.w && this.input.mouseY >= r.y && this.input.mouseY <= r.y + r.h) return i;
    }
    return -1;
  }

  step(dt) {
    this.time += dt;

    if (this.state === 'title') return;

    if (this.state === 'upgrade') {
      const c = this.input.consumeChoice();
      if (c >= 0) this.pickOffer(c);
      else if (this.input.consumeClick()) {
        const i = this.clickedCard();
        if (i >= 0) this.pickOffer(i);
      }
      this.effects.update(dt);
      return;
    }

    if (this.state === 'play') {
      E.updatePlayer(this.player, this.input, dt, this.bullets, this.sound);
      E.updateBullets(this.bullets, dt);
      E.updateEnemies(this.enemies, dt, this.player);
      E.bulletHits(this.bullets, this.enemies, this.effects, this.sound, this);
      E.playerHits(this.enemies, this.player, this.effects, this.sound);
      this.waves.update(dt, this.enemies);
      if (this.combo.timer > 0) {
        this.combo.timer -= dt;
        if (this.combo.timer <= 0) { this.combo.count = 0; this.combo.mult = 1; }
      }
      this.effects.update(dt);
      if (this.player.hp <= 0) {
        this.state = 'end';
        this.sound.gameover();
      } else if (this.enemies.length === 0 && this.waves.state === 'done' && this.waves.pauseTimer <= 0) {
        this.beginUpgradePick();
      }
      return;
    }

    if (this.state === 'end') {
      E.updateBullets(this.bullets, dt);
      this.effects.update(dt);
    }
  }

  handleTransitions() {
    if (this.state === 'title') {
      if (this.input.consumeClick() || this.input.consumeKey()) this.startRun();
    } else if (this.state === 'end') {
      if (this.input.consumeClick() || this.input.consumeKey()) this.reset();
    }
    if (this.input.keys.has('m')) {
      this.input.keys.delete('m');
      this.sound.toggleMute();
    }
  }

  hoverIdx() {
    return this.state === 'upgrade' ? this.clickedCard() : -1;
  }

  draw() {
    const ctx = this.ctx;
    const t = this.time;
    R.drawArena(ctx, t);
    if (this.state === 'title') {
      R.drawTitle(ctx, t);
    } else if (this.state === 'upgrade') {
      R.drawUpgrade(ctx, this.offers, t, this.hoverIdx());
      this.effects.draw(ctx);
    } else if (this.state === 'end') {
      R.drawEnd(ctx, this, t);
      this.effects.draw(ctx);
    } else {
      R.drawEnemies(ctx, this.enemies, t);
      R.drawBullets(ctx, this.bullets);
      R.drawPlayer(ctx, this.player, t);
      this.effects.draw(ctx);
      R.drawHud(ctx, this);
    }
  }

  loop() {
    if (!this.shotMode) {
      this.handleTransitions();
      this.step(1 / 60);
    }
    this.draw();
    requestAnimationFrame(this._loop);
  }
}
