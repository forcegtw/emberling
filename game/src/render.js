// All drawing: arena, ember, entities, HUD, and full-screen states.
import { VIEW_W, VIEW_H } from './config.js';

export function drawArena(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0b1020');
  g.addColorStop(1, '#141a2e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // frost lattice floor
  ctx.strokeStyle = 'rgba(120,170,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke(); }
  for (let y = 0; y <= VIEW_H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke(); }
  // drifting frost motes
  for (let i = 0; i < 40; i++) {
    const x = ((i * 97 + t * (8 + i % 5 * 3)) % (VIEW_W + 40)) - 20;
    const y = ((i * 61 + t * 12) % (VIEW_H + 40)) - 20;
    ctx.fillStyle = `rgba(160,200,255,${0.04 + (i % 4) * 0.02})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlayer(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // aim reticle beam
  ctx.rotate(p.aim);
  ctx.strokeStyle = 'rgba(255,150,60,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.radius + 4, 0);
  ctx.lineTo(p.radius + 26, 0);
  ctx.stroke();
  ctx.rotate(-p.aim);
  // flicker aura
  const flick = 0.8 + Math.sin(t * 20) * 0.1;
  if (p.invuln > 0 && Math.floor(t * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius * 1.9 * flick);
  g.addColorStop(0, 'rgba(255,230,160,0.95)');
  g.addColorStop(0.5, 'rgba(255,120,40,0.6)');
  g.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 1.9 * flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawBullets(ctx, bullets) {
  for (const b of bullets) {
    const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius * 2.2);
    g.addColorStop(0, '#fff3c0');
    g.addColorStop(0.4, '#ffb050');
    g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawEnemies(ctx, enemies, t) {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const wob = 1 + Math.sin(t * 6 + e.wobble) * 0.08;
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, e.radius * 1.8);
    g.addColorStop(0, `hsla(${e.hue},90%,80%,0.95)`);
    g.addColorStop(0.55, `hsla(${e.hue},85%,60%,0.6)`);
    g.addColorStop(1, `hsla(${e.hue},85%,45%,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 1.8 * wob, 0, Math.PI * 2);
    ctx.fill();
    if (e.kind === 'shard') {
      ctx.rotate(e.wobble * 0.5);
      ctx.fillStyle = `hsl(${e.hue},90%,72%)`;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const px = Math.cos(a) * e.radius, py = Math.sin(a) * e.radius;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = `hsl(${e.hue},80%,74%)`;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * wob, 0, Math.PI * 2);
      ctx.fill();
      if (e.kind === 'brute') {
        ctx.strokeStyle = `hsla(${e.hue},90%,85%,0.8)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
    // hp pips
    if (e.hp < e.maxHp) {
      const w = e.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w, 3);
      ctx.fillStyle = `hsl(${e.hue},90%,70%)`;
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w * (e.hp / e.maxHp), 3);
    }
  }
}

export function drawHud(ctx, state) {
  // hearts
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px monospace';
  for (let i = 0; i < state.player.maxHp; i++) {
    ctx.fillStyle = i < Math.floor(state.player.hp) ? '#ff9d45' : 'rgba(255,255,255,0.15)';
    ctx.fillText(i < Math.floor(state.player.hp) ? '●' : '○', 18 + i * 22, 30);
  }
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText(`WAVE ${state.waves.wave}`, 18, 58);
  ctx.fillText(`SCORE ${state.score}`, 18, 80);
  if (state.combo.mult > 1) {
    ctx.fillStyle = '#ffd27a';
    ctx.fillText(`x${state.combo.mult.toFixed(1)} COMBO`, 18, 102);
  }
  // wave countdown
  if (state.waves.state === 'done') {
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#9fc4ff';
    ctx.fillText(`Wave ${state.waves.wave} cleared`, VIEW_W / 2, 130);
  }
  // mute hint
  ctx.textAlign = 'right';
  ctx.font = '13px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(state.sound.muted ? 'muted (m)' : 'sound on (m)', VIEW_W - 18, 26);
}

export function drawTitle(ctx, t) {
  drawArena(ctx, t);
  const cy = VIEW_H / 2 - 60;
  const flick = 1 + Math.sin(t * 3) * 0.02;
  ctx.save();
  ctx.translate(VIEW_W / 2, cy);
  ctx.scale(flick, flick);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 200);
  g.addColorStop(0, 'rgba(255,200,90,0.9)');
  g.addColorStop(0.5, 'rgba(255,100,30,0.35)');
  g.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.font = 'bold 72px monospace';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText('EMBERLING', VIEW_W / 2, cy + 10);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#9fc4ff';
  ctx.fillText('A flame spirit against the frost wisps', VIEW_W / 2, cy + 56);
  const pulse = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = `rgba(255,230,170,${pulse})`;
  ctx.fillText('CLICK TO IGNITE', VIEW_W / 2, cy + 130);
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('WASD move · mouse aim · hold click to shoot · M mute', VIEW_W / 2, cy + 170);
}

export function drawUpgrade(ctx, offers, t, hoverIdx) {
  drawArena(ctx, t);
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px monospace';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText('CHOOSE A BLESSING', VIEW_W / 2, 150);
  ctx.font = '15px monospace';
  ctx.fillStyle = '#9fc4ff';
  ctx.fillText('press 1 / 2 / 3 or click', VIEW_W / 2, 185);
  const cw = 280, ch = 220, gap = 40;
  const x0 = VIEW_W / 2 - (cw * 3 + gap * 2) / 2;
  offers.forEach((o, i) => {
    const x = x0 + i * (cw + gap), y = 260;
    const lift = hoverIdx === i ? -8 : 0;
    ctx.fillStyle = hoverIdx === i ? 'rgba(60,45,25,0.92)' : 'rgba(25,32,52,0.92)';
    ctx.strokeStyle = hoverIdx === i ? '#ffd27a' : 'rgba(140,180,255,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y + lift, cw, ch, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '44px monospace';
    ctx.fillText(o.icon, x + cw / 2, y + lift + 62);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffd27a';
    ctx.fillText(o.name, x + cw / 2, y + lift + 110);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText(o.desc, x + cw / 2, y + lift + 145);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`[${i + 1}]`, x + cw / 2, y + lift + 190);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawEnd(ctx, state, t) {
  drawArena(ctx, t);
  ctx.textAlign = 'center';
  ctx.font = 'bold 58px monospace';
  ctx.fillStyle = '#ff9d45';
  ctx.fillText('THE FLAME FADES', VIEW_W / 2, VIEW_H / 2 - 90);
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W / 2, VIEW_H / 2 - 30);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#9fc4ff';
  ctx.fillText(`survived ${state.waves.wave} waves`, VIEW_W / 2, VIEW_H / 2 + 5);
  ctx.font = 'bold 20px monospace';
  const pulse = 0.55 + Math.sin(t * 4) * 0.45;
  ctx.fillStyle = `rgba(255,230,170,${pulse})`;
  ctx.fillText('CLICK TO REKINDLE', VIEW_W / 2, VIEW_H / 2 + 70);
}
