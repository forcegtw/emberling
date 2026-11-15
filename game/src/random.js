// A small deterministic PRNG (mulberry32) so a ?seed=N URL gives the same game every time:
// wave composition, spawn placement and ember drops all draw from it.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform float in [lo, hi) from an rng. */
export function randomRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

/** Pick one entry of `list` by its numeric `weight`, using an rng. */
export function weightedPick(rng, list) {
  let total = 0;
  for (const item of list) total += item.weight;
  let roll = rng() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}
