// lore.js — whispered fragments shown one at a time on the title screen.
// Each line is a self-contained piece of Lumenfall's dark-fantasy backstory.
export const LORE = [
  "The last lantern was lit by hands nobody remembers, against a dark nobody names.",
  "Shades are not creatures; they are the echoes of everyone the light failed to reach.",
  "Every ember you gather is a word of a prayer the world forgot how to speak.",
  "The lantern core burns lowest at the hour when the drowned begin to sing.",
  "Warden: the light does not hate the dark. It simply refuses to become it.",
  "They say the glass of the lantern was blown from a fallen star's own breath.",
  "When a wave breaks and the field is still, count the shadows. There is always one more.",
  "The night is patient. It has outlasted every keeper before you, and it counts on outlasting you.",
];

// Return lore line n (wrapping the index so any n is safe).
export function loreLine(n) {
  return LORE[((n % LORE.length) + LORE.length) % LORE.length];
}
