// Keyboard + mouse input. Arrow keys mirror WASD; click/hold to shoot.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = 640;
    this.mouseY = 360;
    this.mouseDown = false;
    this.clicked = false;   // consumed once per frame
    this.anyKey = false;    // consumed once per frame (start / restart)
    this._pickChoice = -1;  // 1/2/3 key consumed by upgrade screen

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      this.anyKey = true;
      if (k >= '1' && k <= '3') this._pickChoice = parseInt(k, 10) - 1;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouseDown = true; });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseDown = false; });
    canvas.addEventListener('click', () => { this.clicked = true; this.anyKey = true; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  axis() {
    let dx = 0, dy = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (dx && dy) { const s = Math.SQRT1_2; dx *= s; dy *= s; }
    return { dx, dy };
  }

  shooting() { return this.mouseDown; }
  consumeClick() { const c = this.clicked; this.clicked = false; return c; }
  consumeKey() { const a = this.anyKey; this.anyKey = false; return a; }
  consumeChoice() { const c = this._pickChoice; this._pickChoice = -1; return c; }
}
