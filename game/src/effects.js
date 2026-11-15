// Particle / floating-text effects, all canvas-drawn.
export class Effects {
  constructor() { this.parts = []; this.texts = []; this.rings = []; }

  burst(x, y, hue, count = 14, speed = 160, life = 0.6, size = 3) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.9);
      this.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.7), maxLife: life,
        size: size * (0.6 + Math.random() * 0.9), hue: hue + (Math.random() * 30 - 15),
      });
    }
  }

  ring(x, y, hue, maxR = 60, life = 0.35) {
    this.rings.push({ x, y, r: 4, maxR, life, maxLife: life, hue });
  }

  text(x, y, str, color = '#ffd27a', size = 15) {
    this.texts.push({ x, y, str, color, size, life: 0.9, maxLife: 0.9 });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r = r.maxR * (1 - r.life / r.maxLife);
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y -= 34 * dt; t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = `hsl(${p.hue}, 95%, ${55 + a * 25}%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.7;
      ctx.strokeStyle = `hsl(${r.hue}, 90%, 65%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = `bold ${t.size}px monospace`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.restore();
  }

  clear() { this.parts.length = 0; this.rings.length = 0; this.texts.length = 0; }
}
