// Emberling — input, rewritten fresh: WASD/arrows move, mouse aims and fires,
// digit keys pick upgrade choices, Space starts. The game polls the take* methods.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 640, y: 360, down: false };
    this.choiceIndex = -1;    // set by Digit1/2/3 during an upgrade choice
    this.firePressed = false; // one-shot, consumed via takeFire()
    this.startPressed = false;

    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Digit1') this.choiceIndex = 0;
      if (e.code === 'Digit2') this.choiceIndex = 1;
      if (e.code === 'Digit3') this.choiceIndex = 2;
      if (e.code === 'Space') this.startPressed = true;
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    // Map pointer coords into canvas space, accounting for CSS scaling.
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { this.mouse.down = true; this.firePressed = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // Normalized movement axis (diagonals scaled to length 1).
  moveAxis() {
    let x = 0, y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  firing() { return this.mouse.down; }
  takeChoice() { const c = this.choiceIndex; this.choiceIndex = -1; return c; }
  takeFire() { const f = this.firePressed; this.firePressed = false; return f; }
  takeStart() { const s = this.startPressed; this.startPressed = false; return s; }
}
