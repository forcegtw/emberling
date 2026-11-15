// All drawing: a single canvas, the fixed 1280x720 logical stage scaled to the window.
// One draw(state, screen, best) call paints whichever screen is active: title, play,
// paused, upgrade choice, or game over. Every shape is drawn in code - no image assets.
import { CORE, FIELD, FONT, PALETTE, PLAYER, SHADE, WAVE } from "./config.js";

export const SCREEN_TITLE = "title";
export const SCREEN_PLAY = "play";
export const SCREEN_PAUSED = "paused";
export const SCREEN_UPGRADE = "upgrade";
export const SCREEN_OVER = "over";

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  fit();
  window.addEventListener("resize", fit);

  /** Round a rectangle's path (canvas lacks roundRect on older builds). */
  function panel(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function text(str, x, y, size, color, align, weight) {
    ctx.fillStyle = color;
    ctx.font = `${weight ?? 600} ${size}px ${FONT}`;
    ctx.textAlign = align ?? "center";
    ctx.textBaseline = "middle";
    ctx.fillText(str, x, y);
  }

  /** The dark ground with its faint concentric wards around the core. */
  function drawGround(time) {
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    for (let r = 60; r <= 600; r += 60) {
      ctx.beginPath();
      ctx.arc(CORE.x, CORE.y, r + Math.sin(time * 0.8 + r) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Soft radial glow behind the core.
    const glow = ctx.createRadialGradient(CORE.x, CORE.y, 10, CORE.x, CORE.y, 260);
    glow.addColorStop(0, "rgba(255, 200, 110, 0.16)");
    glow.addColorStop(1, "rgba(255, 200, 110, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawCore(state, time) {
    const pulse = 1 + Math.sin(time * 2.4) * 0.05;
    const hurt = state.coreFlash > 0;
    // Outer flame ring.
    ctx.strokeStyle = hurt ? PALETTE.danger : PALETTE.coreGlow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(CORE.x, CORE.y, CORE.radius + 10 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    // Lantern body.
    ctx.fillStyle = hurt ? "#ff9a7a" : PALETTE.core;
    ctx.beginPath();
    ctx.arc(CORE.x, CORE.y, CORE.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    // The flame inside.
    ctx.fillStyle = "#fff6dc";
    ctx.beginPath();
    const flicker = Math.sin(time * 9) * 3;
    ctx.ellipse(CORE.x, CORE.y - 4 + flicker, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer(state, time) {
    const p = state.player;
    const angle = Math.atan2(p.aimY - p.y, p.aimX - p.x);
    const blink = state.invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
    if (blink) return;
    // Aim line.
    ctx.strokeStyle = "rgba(165, 243, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(angle) * 18, p.y + Math.sin(angle) * 18);
    ctx.lineTo(p.x + Math.cos(angle) * 60, p.y + Math.sin(angle) * 60);
    ctx.stroke();
    // Body: a small wisp with a direction nub.
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(angle) * 8, p.y + Math.sin(angle) * 8, 5, 0, Math.PI * 2);
    ctx.fill();
    // Halo shield, when bought.
    if (state.stats.shield) {
      ctx.strokeStyle = "rgba(127, 227, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEntities(state, time) {
    for (const ember of state.droppedEmbers) {
      const bob = Math.sin(time * 4 + ember.x) * 2;
      const fade = ember.age > 10 ? Math.max(0.2, 1 - (ember.age - 10) / 4) : 1;
      ctx.globalAlpha = fade;
      ctx.fillStyle = PALETTE.ember;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y + bob, EMBER_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const spit of state.spits) {
      ctx.fillStyle = PALETTE.spit;
      ctx.beginPath();
      ctx.arc(spit.x, spit.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const shot of state.shots) {
      ctx.strokeStyle = PALETTE.bolt;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.x - shot.vx * 0.02, shot.y - shot.vy * 0.02);
      ctx.stroke();
    }
    for (const shade of state.shades) {
      const spec = SHADE[shade.kind];
      const r = spec.radius;
      const color = shade.hitFlash > 0 ? "#ffffff" : PALETTE[spec.color];
      ctx.fillStyle = color;
      ctx.beginPath();
      if (shade.kind === "brute") {
        // Brute: a heavy hexagon.
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * Math.PI * 2 + shade.x * 0.01;
          const px = shade.x + Math.cos(a) * r;
          const py = shade.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        // Others: a wobbling blob.
        const wobble = shade.kind === "husk" ? 0.22 : 0.12;
        for (let i = 0; i <= 10; i += 1) {
          const a = (i / 10) * Math.PI * 2;
          const rr = r * (1 + Math.sin(a * 3 + time * 6 + shade.y * 0.02) * wobble);
          const px = shade.x + Math.cos(a) * rr;
          const py = shade.y + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }
      ctx.fill();
      // Two dark eyes so each shade reads as a creature.
      ctx.fillStyle = "rgba(8, 6, 16, 0.85)";
      const ea = Math.atan2(CORE.y - shade.y, CORE.x - shade.x);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(shade.x + Math.cos(ea + side * 0.5) * r * 0.45, shade.y + Math.sin(ea + side * 0.5) * r * 0.45, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      // Small hp bar for anything not full.
      if (shade.hp < shade.hpMax) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(shade.x - r, shade.y - r - 10, r * 2, 4);
        ctx.fillStyle = PALETTE.danger;
        ctx.fillRect(shade.x - r, shade.y - r - 10, r * 2 * (shade.hp / shade.hpMax), 4);
      }
    }
    for (const fx of state.effects) {
      const t = fx.age / fx.life;
      ctx.globalAlpha = 1 - t;
      if (fx.kind === "burst" || fx.kind === "burnring") {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 6 + t * (fx.kind === "burnring" ? 90 : 26), 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === "spark") {
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 5 * (1 - t) + 1, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.kind === "muzzle") {
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 7 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(state, time) {
    // Top bar: wave, score, embers, lives.
    panel(16, 16, 500, 66, 12, PALETTE.panel);
    text(`WAVE ${state.wave}`, 44, 38, 20, PALETTE.core, "left", 800);
    text(`${state.score}`, 44, 62, 17, PALETTE.text, "left", 700);
    text(`◆ ${state.embers}`, 230, 38, 18, PALETTE.ember, "left", 700);
    text(`✦ ${state.lives} lives`, 230, 62, 16, PALETTE.player, "left", 600);
    // Core health bar.
    text("LANTERN", 330, 34, 13, PALETTE.muted, "left");
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(330, 44, 150, 12);
    const hpFrac = state.coreHp / CORE.hpMax;
    ctx.fillStyle = hpFrac > 0.35 ? PALETTE.core : PALETTE.danger;
    ctx.fillRect(330, 44, 150 * hpFrac, 12);
    // Mute hint.
    text("M: sound", FIELD.width - 24, 30, 13, PALETTE.muted, "right");
    text("P: pause", FIELD.width - 24, 52, 13, PALETTE.muted, "right");
    // Wave announcement, mid-screen.
    if (state.announce > 0) {
      ctx.globalAlpha = Math.min(1, state.announce / 0.6);
      text(`WAVE ${state.wave}`, FIELD.width / 2, 190, 54, PALETTE.core, "center", 800);
      ctx.globalAlpha = 1;
    }
    // Wave progress: shades left this wave, under the top bar.
    const left = state.aliveThisWave + state.toSpawn;
    text(`${left} shade${left === 1 ? "" : "s"} remain`, 44, 96, 15, PALETTE.muted, "left");
    text("hold click to fire", FIELD.width - 24, 74, 13, PALETTE.muted, "right");
    // Ember purse.
    if (time % 1 < 2) { /* purse shown top bar; nothing extra */ }
  }

  function drawUpgradeChoice(state) {
    ctx.fillStyle = "rgba(8, 6, 16, 0.72)";
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(`WAVE ${state.wave} CLEARED`, FIELD.width / 2, 150, 44, PALETTE.core, "center", 800);
    text("Choose a blessing for your light", FIELD.width / 2, 200, 20, PALETTE.text);
    const offers = state.upgradesOffered ?? [];
    for (let i = 0; i < offers.length; i += 1) {
      const x = FIELD.width / 2 + (i - 1) * 300;
      const y = 330;
      const w = 260; const h = 170;
      const hovered = false;
      panel(x - w / 2, y - h / 2, w, h, 14, PALETTE.panel, PALETTE.grid);
      text(`${i + 1}`, x, y - 58, 15, PALETTE.muted, "center", 700);
      text(offers[i].title, x, y - 22, 24, PALETTE.player, "center", 800);
      text(offers[i].detail, x, y + 22, 16, PALETTE.text);
      text(`press ${i + 1}`, x, y + 60, 13, PALETTE.muted);
    }
    text(`Next wave in ${Math.ceil(state.intermission)}s`, FIELD.width / 2, 560, 16, PALETTE.muted);
  }

  function drawTitle(time, best) {
    ctx.fillStyle = "rgba(8, 6, 16, 0.55)";
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text("LUMENFALL", FIELD.width / 2, 200, 84, PALETTE.core, "center", 800);
    text("The shades come for the last lantern. Keep it burning.", FIELD.width / 2, 268, 20, PALETTE.text);
    text("WASD / arrows  move      Mouse  aim      Hold click / W  fire", FIELD.width / 2, 330, 17, PALETTE.muted);
    const pulse = 0.7 + Math.sin(time * 3) * 0.3;
    ctx.globalAlpha = pulse;
    text("CLICK OR PRESS SPACE TO BEGIN", FIELD.width / 2, 420, 24, PALETTE.player, "center", 800);
    ctx.globalAlpha = 1;
    if (best > 0) text(`Best score: ${best}`, FIELD.width / 2, 480, 18, PALETTE.ember);
    text("Defend the lantern. Gather embers. Choose your blessings between waves.", FIELD.width / 2, 640, 15, PALETTE.muted);
  }

  function drawOver(state, best) {
    ctx.fillStyle = "rgba(8, 6, 16, 0.8)";
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text("THE LANTERN IS OUT", FIELD.width / 2, 190, 56, PALETTE.danger, "center", 800);
    text(`Score  ${state.score}`, FIELD.width / 2, 280, 34, PALETTE.text, "center", 700);
    text(`Waves survived  ${Math.max(0, state.wave - 1)}`, FIELD.width / 2, 330, 20, PALETTE.muted);
    text(`Embers gathered  ${state.embers}`, FIELD.width / 2, 362, 20, PALETTE.muted);
    text(`Blessings taken  ${state.upgradeCount}`, FIELD.width / 2, 394, 20, PALETTE.muted);
    if (state.score >= best && state.score > 0) text("NEW BEST!", FIELD.width / 2, 440, 24, PALETTE.ember, "center", 800);
    else text(`Best  ${best}`, FIELD.width / 2, 440, 20, PALETTE.ember);
    ctx.globalAlpha = 0.7 + Math.sin(performance.now() / 300) * 0.3;
    text("CLICK OR PRESS SPACE TO RELIGHT THE LANTERN", FIELD.width / 2, 510, 22, PALETTE.player, "center", 800);
    ctx.globalAlpha = 1;
  }

  const EMBER_SIZE = 6;

  let clock = 0;

  return {
    /** Paint one frame of the named screen. */
    draw(state, screen, best) {
      const dpr = window.devicePixelRatio || 1;
      const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height) / dpr;
      const offX = (window.innerWidth - FIELD.width * scale) / 2;
      const offY = (window.innerHeight - FIELD.height * scale) / 2;
      clock += 1 / 60;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PALETTE.night;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      // Screen shake during hits.
      const shake = state.shake > 0 ? state.shake : 0;
      ctx.translate((offX + (Math.random() - 0.5) * shake) * dpr, (offY + (Math.random() - 0.5) * shake) * dpr);
      ctx.scale(scale * dpr, scale * dpr);
      ctx.beginPath();
      ctx.rect(0, 0, FIELD.width, FIELD.height);
      ctx.clip();

      drawGround(clock);
      drawCore(state, clock);
      drawEntities(state, clock);
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_UPGRADE) {
        drawPlayer(state, clock);
        drawHud(state, clock);
      }
      if (screen === SCREEN_UPGRADE) drawUpgradeChoice(state);
      if (screen === SCREEN_TITLE) drawTitle(clock, best);
      if (screen === SCREEN_OVER) drawOver(state, best);
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = "rgba(8, 6, 16, 0.6)";
        ctx.fillRect(0, 0, FIELD.width, FIELD.height);
        text("PAUSED", FIELD.width / 2, FIELD.height / 2 - 20, 48, PALETTE.text, "center", 800);
        text("P or Esc resumes", FIELD.width / 2, FIELD.height / 2 + 30, 18, PALETTE.muted);
      }
      ctx.restore();
    },
  };
}
