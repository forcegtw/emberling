// boot.js — title-screen flavor overlay. Loaded alongside main.js; it only touches
// the DOM, never the game loop. One lore line and one gameplay tip are shown at a
// time and rotated on an interval until the run begins, then hidden.
import { loreLine } from "./lore.js";
import { tipLine } from "./tips.js";

const ROTATE_MS = 6000;

function buildOverlay() {
  const box = document.createElement("div");
  box.id = "lore-overlay";
  box.style.cssText =
    "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);" +
    "max-width:640px;text-align:center;color:#9a92c4;font:italic 14px/1.5 Georgia,serif;" +
    "text-shadow:0 0 8px #000;pointer-events:none;user-select:none;";
  const lore = document.createElement("div");
  const tip = document.createElement("div");
  tip.style.cssText = "margin-top:6px;color:#6f6890;font-style:normal;font-size:12px;";
  box.append(lore, tip);
  document.body.append(box);
  return { box, lore, tip };
}

function run() {
  const overlay = buildOverlay();
  let n = Math.floor(Math.random() * 8);
  const show = () => {
    overlay.lore.textContent = loreLine(n);
    overlay.tip.textContent = "Tip: " + tipLine(n * 2 + 1);
    n += 1;
  };
  show();
  const timer = window.setInterval(show, ROTATE_MS);
  // Once the player confirms start, the canvas takes over; fade the overlay away.
  window.addEventListener("keydown", hide, { once: true });
  window.addEventListener("pointerdown", hide, { once: true });
  function hide() {
    window.clearInterval(timer);
    overlay.box.remove();
  }
}

run();
