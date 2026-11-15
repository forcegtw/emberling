// Emberling — entry point. Boots the canvas and game, parses ?shot=/&seed= params.
import { VIEW_W, VIEW_H } from './config.js';
import { Game } from './game.js';

function boot() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  const p = new URLSearchParams(location.search);
  const params = {
    shot: p.get('shot'),
    seed: p.get('seed'),
  };

  new Game(canvas, params);

  // headless hint: report boot success for screenshot verification
  window.__emberlingReady = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
