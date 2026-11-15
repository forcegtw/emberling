// tips.js — short gameplay hints rotated onto the title screen under the lore line.
export const TIPS = [
  "Move with WASD or the arrow keys; aim with the mouse and hold to fire.",
  "Space or a click starts a run; pressing it again relights the lantern after a loss.",
  "Between waves, pick one of three blessings — you cannot take them all.",
  "Gather fallen embers quickly: they fade, and each one is worth score and strength.",
  "Never let shades crowd the lantern core; your life is its glass, not your feet.",
  "Press M any time to silence the dark, or P to pause and catch your breath.",
];

// Return tip line n (wrapping the index so any n is safe).
export function tipLine(n) {
  return TIPS[((n % TIPS.length) + TIPS.length) % TIPS.length];
}
