// Emberling — the renderer. Everything is drawn in code on one canvas: arena, entities, HUD, menus.

import { W, H, ARENA, PALETTE as C } from './config.js';

function drawArena(ctx, time) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // slow-scrolling frost grid
  ctx.strokeStyle = C.bgGrid;
  ctx.lineWidth = 1;
  const step = 64;
  const off = (time * 8) % step;
  ctx.beginPath();
  for (let x = -step + off; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -step + off; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // arena border
  ctx.strokeStyle = C.arenaEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(ARENA.pad, ARENA.pad, ARENA.w - ARENA.pad * 2, ARENA.h - ARENA.pad * 2);
}

function drawPlayer(ctx, p) {
  const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
  if (blink) return;
  const flick = Math.sin(p.flame) * 2;
  // aura
  ctx.fillStyle = 'rgba(255,157,60,0.18)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26 + flick, 0, Math.PI * 2);
  ctx.fill();
  // outer flame
  ctx.fillStyle = C.ember;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius() + 3 + flick, 0, Math.PI * 2);
  ctx.fill();
  // core
  ctx.fillStyle = C.emberCore;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius() - 4, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = C.bg;
  ctx.fillRect(p.x - 5, p.y - 3, 3, 5);
  ctx.fillRect(p.x + 2, p.y - 3, 3, 5);
}

function drawWisp(ctx, w) {
  const pale = w.hp / w.maxHp;
  ctx.fillStyle = w.kind === 'brute' ? C.frostDeep : w.kind === 'dart' ? C.shard : C.frost;
  ctx.globalAlpha = 0.55 + 0.45 * pale;
  // spiky frost body
  ctx.beginPath();
  const spikes = w.kind === 'brute' ? 8 : 6;
  for (let i = 0; i <= spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + w.wobble;
    const r = i % 2 === 0 ? w.r : w.r * 0.62;
    const px = w.x + Math.cos(a) * r, py = w.y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // cold eye
  ctx.fillStyle = '#eafcff';
  ctx.beginPath();
  ctx.arc(w.x, w.y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (w.maxHp > 1 && w.hp < w.maxHp) {
    ctx.fillStyle = C.danger;
    ctx.fillRect(w.x - w.r, w.y - w.r - 8, w.r * 2 * pale, 3);
  }
}

function drawBullet(ctx, b) {
  ctx.fillStyle = C.emberCore;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.ember;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAimLine(ctx, player, mouse) {
  const dx = mouse.x - player.x, dy = mouse.y - player.y;
  const d = Math.hypot(dx, dy) || 1;
  ctx.strokeStyle = 'rgba(255,157,60,0.25)';
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(player.x + (dx / d) * 22, player.y + (dy / d) * 22);
  ctx.lineTo(player.x + (dx / d) * 120, player.y + (dy / d) * 120);
  ctx.stroke();
  ctx.setLineDash([]);
  // reticle at the cursor
  ctx.strokeStyle = 'rgba(255,233,176,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
  ctx.moveTo(mouse.x - 14, mouse.y);
  ctx.lineTo(mouse.x - 5, mouse.y);
  ctx.moveTo(mouse.x + 5, mouse.y);
  ctx.lineTo(mouse.x + 14, mouse.y);
  ctx.stroke();
}

function drawWaveBanner(ctx, game) {
  if (game.bannerTimer <= 0) return;
  const a = Math.min(1, game.bannerTimer / 0.4);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.frost;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.wave}`, W / 2, 150);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawHUD(ctx, game) {
  const { player, wave, score, combo, enemiesLeft } = game;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = C.text;
  ctx.textAlign = 'left';
  ctx.fillText(`WAVE ${wave}`, 32, 40);
  ctx.fillText(`SCORE ${score}`, 32, 68);

  ctx.textAlign = 'right';
  ctx.fillText(`WISPS ${enemiesLeft}`, W - 32, 40);
  if (combo > 1) {
    ctx.fillStyle = C.ember;
    ctx.fillText(`COMBO x${combo}`, W - 32, 68);
  }

  // health as flame hearts
  ctx.textAlign = 'left';
  for (let i = 0; i < 5; i++) {
    const hx = W / 2 - 62 + i * 26;
    ctx.beginPath();
    const filled = i < player.hp;
    ctx.fillStyle = filled ? C.ember : '#2a2130';
    // little flame shape
    ctx.moveTo(hx, 28);
    ctx.quadraticCurveTo(hx - 8, 40, hx, 52);
    ctx.quadraticCurveTo(hx + 8, 40, hx, 28);
    ctx.fill();
  }
}

function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(10,14,26,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ember;
  ctx.font = 'bold 84px system-ui, sans-serif';
  const wob = Math.sin(time * 2) * 4;
  ctx.fillText('EMBERLING', W / 2, 240 + wob);
  ctx.fillStyle = C.frost;
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('a flame against the frost', W / 2, 290);
  ctx.fillStyle = C.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      Mouse — aim      Hold click — shoot', W / 2, 420);
  ctx.fillText('Survive the waves. Between waves, choose one of three blessings.', W / 2, 456);
  ctx.fillStyle = Math.sin(time * 4) > 0 ? C.emberCore : C.dim;
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('Press SPACE or click to begin', W / 2, 560);
  ctx.textAlign = 'left';
}

function drawUpgradeChoice(ctx, offers, time) {
  ctx.fillStyle = 'rgba(10,14,26,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.emberCore;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('Wave cleared — choose a blessing', W / 2, 200);

  const cw = 300, ch = 220, gap = 40;
  const x0 = W / 2 - (cw * 3 + gap * 2) / 2;
  offers.forEach((u, i) => {
    const x = x0 + i * (cw + gap);
    const y = 270;
    const hover = Math.sin(time * 3 + i) * 3;
    ctx.fillStyle = '#141b30';
    ctx.strokeStyle = C.ember;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y + hover, cw, ch);
    ctx.strokeRect(x, y + hover, cw, ch);
    ctx.fillStyle = C.dim;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(String(i + 1), x + cw / 2, y + hover + 44);
    ctx.fillStyle = C.ember;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(u.name, x + cw / 2, y + hover + 100);
    ctx.fillStyle = C.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(u.desc, x + cw / 2, y + hover + 140);
  });
  ctx.fillStyle = C.dim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press 1, 2 or 3', W / 2, 560);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, game) {
  ctx.fillStyle = 'rgba(10,14,26,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.danger;
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText('THE FLAME FADES', W / 2, 260);
  ctx.fillStyle = C.text;
  ctx.font = '30px system-ui, sans-serif';
  ctx.fillText(`You fell on wave ${game.wave} with ${game.score} points`, W / 2, 340);
  ctx.fillText(`Best run: ${game.bestScore} points`, W / 2, 386);
  ctx.fillStyle = Math.sin(game.time * 4) > 0 ? C.emberCore : C.dim;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Press SPACE or click to rekindle', W / 2, 500);
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  ctx.save();
  const sh = game.shake.offset();
  ctx.translate(sh.x, sh.y);
  drawArena(ctx, game.time);

  drawAimLine(ctx, game.player, game.mouse);
  for (const b of game.bullets) drawBullet(ctx, b);
  for (const w of game.wisps) drawWisp(ctx, w);
  drawPlayer(ctx, game.player);
  game.particles.draw(ctx);
  game.texts.draw(ctx);
  ctx.restore();

  drawHUD(ctx, game);
  drawWaveBanner(ctx, game);

  if (game.state === 'title') drawTitle(ctx, game.time);
  if (game.state === 'upgrade') drawUpgradeChoice(ctx, game.offers, game.time);
  if (game.state === 'end') drawEnd(ctx, game);
}
