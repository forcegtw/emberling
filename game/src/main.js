// Emberling — boot: canvas, loop, deterministic screenshot mode (?shot=title|play|upgrade|end).

import { W, H } from './config.js';
import { Bullet } from './entities.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const game = new Game(input);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

// Deterministic screenshot states: seed the RNG and fast-forward into a fixed scene.
function prepareShot(mode) {
  const SEED = Number(params.get('seed') || 7) || 7;
  let s = SEED;
  Math.random = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;

  if (mode === 'title') {
    game.state = 'title';
    return;
  }
  game.startRun();
  if (mode === 'play') {
    // fast-forward a few seconds so wisps are on screen mid-fight
    for (let i = 0; i < 240; i++) game.update(1 / 60);
    game.score = 1240;
    game.combo = 6;
    // a few embers in flight toward the nearest wisp, for a lively capture
    const target = game.wisps[0];
    if (target) {
      const p = game.player;
      const angle = Math.atan2(target.y - p.y, target.x - p.x);
      for (let i = 1; i <= 3; i++) {
        game.bullets.push(new Bullet(p.x + Math.cos(angle) * 40 * i, p.y + Math.sin(angle) * 40 * i, angle, p.damage, p.pierce));
      }
    }
    game.state = 'play';
    return;
  }
  if (mode === 'upgrade') {
    for (let i = 0; i < 240; i++) game.update(1 / 60);
    game.completeWave();
    return;
  }
  if (mode === 'end') {
    game.player.hp = 0;
    game.score = 2480;
    game.wave = 7;
    game.endRun();
  }
}

if (shot) prepareShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
