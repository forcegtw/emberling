// Keyboard and mouse: WASD or arrows to move, the mouse to aim, buttons to fire and confirm.
// Actions are edges (pressed this frame) collected in a bitmask; held keys read as a direction.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_UPGRADE_1 = 4;
export const ACTION_UPGRADE_2 = 8;
export const ACTION_UPGRADE_3 = 16;

export function createInput(canvas) {
  const held = new Set();
  const edges = [];
  let mouseX = 640;
  let mouseY = 300;
  let mouseDown = false;

  const MOVE_KEYS = {
    KeyW: "up", ArrowUp: "up",
    KeyS: "down", ArrowDown: "down",
    KeyA: "left", ArrowLeft: "left",
    KeyD: "right", ArrowRight: "right",
  };
  const EDGE_KEYS = {
    Space: ACTION_CONFIRM,
    Enter: ACTION_CONFIRM,
    Digit1: ACTION_UPGRADE_1,
    Digit2: ACTION_UPGRADE_2,
    Digit3: ACTION_UPGRADE_3,
  };
  const PAUSE_KEYS = ["KeyP", "Escape"];

  function onKey(event, down) {
    if (MOVE_KEYS[event.code] || EDGE_KEYS[event.code] || PAUSE_KEYS.includes(event.code)) {
      event.preventDefault();
    }
    if (down && event.repeat) return;
    if (down) {
      if (MOVE_KEYS[event.code]) held.add(MOVE_KEYS[event.code]);
      if (EDGE_KEYS[event.code]) edges.push(EDGE_KEYS[event.code]);
      if (PAUSE_KEYS.includes(event.code)) edges.push(ACTION_PAUSE);
      if (EDGE_KEYS[event.code] || MOVE_KEYS[event.code]) window.__playerActed = true;
    } else {
      held.delete(MOVE_KEYS[event.code]);
    }
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    mouseY = ((event.clientY - rect.top) / rect.height) * 720;
    window.__playerActed = true;
  }

  function onMouseDown(event) {
    if (event.button === 0) {
      mouseDown = true;
      edges.push(ACTION_CONFIRM);
      window.__playerActed = true;
    }
  }
  function onMouseUp(event) {
    if (event.button === 0) mouseDown = false;
  }

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);

  return {
    /** Normalised move direction (-1..1 on each axis). */
    direction() {
      return {
        x: (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0),
        y: (held.has("down") ? 1 : 0) - (held.has("up") ? 1 : 0),
      };
    },
    aim() {
      return { x: mouseX, y: mouseY };
    },
    firing() {
      // The trigger is the mouse alone: every movement key must stay a pure movement key.
      return mouseDown;
    },
    /** Consume and return the edge-triggered actions since the last call. */
    takeActions() {
      let mask = 0;
      for (const action of edges) mask |= action;
      edges.length = 0;
      return mask;
    },
  };
}
