// Emberling — input: WASD/arrows to move, mouse to aim and shoot, number keys pick upgrades.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 640, y: 360, down: false };
    this.choiceIndex = -1;   // set when 1/2/3 pressed during an upgrade choice
    this.firePressed = false; // consumed by the game loop
    this.startPressed = false;

    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'Digit1') this.choiceIndex = 0;
      if (e.code === 'Digit2') this.choiceIndex = 1;
      if (e.code === 'Digit3') this.choiceIndex = 2;
      if (e.code === 'Space') this.startPressed = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { this.mouse.down = true; this.firePressed = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

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
