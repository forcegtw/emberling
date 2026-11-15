// Entity state and per-frame physics/collision. Pure data + update logic.
import { CONFIG, VIEW_W, VIEW_H, clamp } from './config.js';

export function makePlayer() {
  const p = CONFIG.player;
  return {
    x: VIEW_W / 2, y: VIEW_H / 2 + 60,
    vx: 0, vy: 0,
    radius: p.radius, hp: p.hp, maxHp: p.maxHp,
    invuln: 0, sinceHit: 0,
    aim: 0,
    cooldown: 0,
    // upgrade-driven stats
    fireRate: 1, damage: 1, speedMult: 1,
    pierce: 0, twin: false,
  };
}

export function updatePlayer(pl, input, dt, bullets, sound) {
  const { dx, dy } = input.axis();
  const spd = CONFIG.player.speed * pl.speedMult;
  pl.x = clamp(pl.x + dx * spd * dt, pl.radius, VIEW_W - pl.radius);
  pl.y = clamp(pl.y + dy * spd * dt, pl.radius, VIEW_H - pl.radius);
  pl.aim = Math.atan2(input.mouseY - pl.y, input.mouseX - pl.x);
  pl.invuln = Math.max(0, pl.invuln - dt);
  pl.sinceHit += dt;
  if (pl.sinceHit > CONFIG.player.regenDelay && pl.hp < pl.maxHp) {
    pl.hp = Math.min(pl.maxHp, pl.hp + CONFIG.player.regenRate * dt);
  }
  pl.cooldown -= dt;
  if (input.shooting() && pl.cooldown <= 0) {
    pl.cooldown = CONFIG.bullet.cooldown / pl.fireRate;
    fire(pl, bullets);
    sound.shoot();
  }
}

function fire(pl, bullets) {
  const angles = pl.twin ? [-0.09, 0.09] : [0];
  for (const off of angles) {
    const a = pl.aim + off;
    bullets.push({
      x: pl.x + Math.cos(a) * (pl.radius + 6),
      y: pl.y + Math.sin(a) * (pl.radius + 6),
      vx: Math.cos(a) * CONFIG.bullet.speed,
      vy: Math.sin(a) * CONFIG.bullet.speed,
      radius: CONFIG.bullet.radius,
      life: CONFIG.bullet.life,
      damage: CONFIG.bullet.damage * pl.damage,
      pierce: pl.pierce,
    });
  }
}

export function updateBullets(bullets, dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > VIEW_W + 20 || b.y < -20 || b.y > VIEW_H + 20) {
      bullets.splice(i, 1);
    }
  }
}

// Spawn an enemy just outside the arena edge, aiming roughly at the center.
export function spawnEnemy(rng, kind, wave, scale) {
  const base = CONFIG.enemies[kind];
  const side = Math.floor(rng() * 4);
  let x, y;
  if (side === 0) { x = rng() * VIEW_W; y = -30; }
  else if (side === 1) { x = VIEW_W + 30; y = rng() * VIEW_H; }
  else if (side === 2) { x = rng() * VIEW_W; y = VIEW_H + 30; }
  else { x = -30; y = rng() * VIEW_H; }
  const a = Math.atan2(VIEW_H / 2 - y, VIEW_W / 2 - x) + (rng() - 0.5) * 0.6;
  return {
    kind,
    x, y,
    vx: Math.cos(a) * base.speed * scale.speed,
    vy: Math.sin(a) * base.speed * scale.speed,
    radius: base.radius,
    hp: base.hp * scale.hp,
    maxHp: base.hp * scale.hp,
    damage: base.damage,
    score: base.score,
    wobble: rng() * Math.PI * 2,
    hue: kind === 'wisp' ? 195 : kind === 'shard' ? 260 : 340,
  };
}

export function updateEnemies(enemies, dt, player) {
  for (const e of enemies) {
    e.wobble += dt * 3;
    // gentle homing wobble toward the player
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    const spd = Math.hypot(e.vx, e.vy) || 1;
    const wob = Math.sin(e.wobble) * 0.5;
    e.vx = Math.cos(a + wob) * spd;
    e.vy = Math.sin(a + wob) * spd;
    e.x += e.vx * dt; e.y += e.vy * dt;
  }
}

export function bulletHits(bullets, enemies, effects, sound, combo) {
  const killed = [];
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      const dx = b.x - e.x, dy = b.y - e.y;
      const rr = b.radius + e.radius;
      if (dx * dx + dy * dy <= rr * rr) {
        e.hp -= b.damage;
        effects.burst(b.x, b.y, e.hue, 5, 110, 0.3, 2);
        sound.hit();
        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          combo.onKill(e);
          effects.burst(e.x, e.y, e.hue, 18, 200, 0.7, 3.5);
          effects.ring(e.x, e.y, e.hue, 46, 0.3);
          killed.push(e);
          break;
        }
        if (b.pierce > 0) { b.pierce--; } else { bullets.splice(bi, 1); break; }
      }
    }
  }
  return killed;
}

export function playerHits(enemies, player, effects, sound) {
  let hurt = false;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = e.x - player.x, dy = e.y - player.y;
    const rr = e.radius + player.radius;
    if (dx * dx + dy * dy <= rr * rr) {
      if (player.invuln <= 0) {
        player.hp -= e.damage;
        player.invuln = CONFIG.player.invulnTime;
        player.sinceHit = 0;
        hurt = true;
        effects.burst(player.x, player.y, 20, 16, 180, 0.5, 3);
      }
      effects.burst(e.x, e.y, e.hue, 10, 140, 0.4, 2.5);
      enemies.splice(i, 1);
    }
  }
  if (hurt) sound.hurt();
  return hurt;
}
