// Emberling — particle bursts, floating score text, screen shake and hit flashes.

export class Particles {
  constructor() { this.list = []; }

  burst(x, y, color, count = 12, speed = 160, life = 0.5) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life, maxLife: life, color, size: 2 + Math.random() * 3,
      });
    }
  }

  trail(x, y, color, size = 3) {
    this.list.push({
      x, y,
      vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
      life: 0.3, maxLife: 0.3, color, size,
    });
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    this.list = this.list.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class FloatTexts {
  constructor() { this.list = []; }

  add(x, y, text, color = '#fff', life = 0.8) {
    this.list.push({ x, y, text, color, life, maxLife: life });
  }

  update(dt) {
    for (const t of this.list) { t.y -= 40 * dt; t.life -= dt; }
    this.list = this.list.filter(t => t.life > 0);
  }

  draw(ctx) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.list) {
      ctx.globalAlpha = Math.min(1, t.life / t.maxLife * 1.5);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

// Screen shake: an offset the renderer applies to the whole scene.
export class ScreenShake {
  constructor() { this.amount = 0; }

  trigger(amount) { this.amount = Math.min(18, this.amount + amount); }

  update(dt) {
    if (this.amount > 0) this.amount = Math.max(0, this.amount - dt * 30);
  }

  offset() {
    if (this.amount <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.amount,
      y: (Math.random() - 0.5) * 2 * this.amount,
    };
  }
}
