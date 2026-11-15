// Blessings offered between waves. Pick 1 of 3.
export const BLESSINGS = [
  {
    id: 'firerate', name: 'Quickspark', icon: '⚡',
    desc: '+18% fire rate',
    apply(p) { p.fireRate *= 1.18; },
  },
  {
    id: 'twin', name: 'Twin Spark', icon: '🔥',
    desc: 'Split every shot into two',
    apply(p) { if (p.twin) { p.fireRate *= 1.2; } else { p.twin = true; } },
  },
  {
    id: 'damage', name: 'Ember Wrath', icon: '☄️',
    desc: '+30% bullet damage',
    apply(p) { p.damage *= 1.3; },
  },
  {
    id: 'speed', name: 'Cinder Steps', icon: '💨',
    desc: '+15% move speed',
    apply(p) { p.speedMult *= 1.15; },
  },
  {
    id: 'pierce', name: 'Piercing Heat', icon: '➹',
    desc: 'Bullets pierce +1 foe',
    apply(p) { p.pierce += 1; },
  },
  {
    id: 'heal', name: 'Rekindle', icon: '❤',
    desc: 'Restore 2 ember hearts',
    apply(p) { p.hp = Math.min(p.maxHp, p.hp + 2); },
  },
];

// Deterministic pick of 3 distinct offers given an rng.
export function rollOffers(rng, takenCounts) {
  const pool = BLESSINGS.filter((b) => !(b.id === 'twin' && (takenCounts.twin || 0) >= 3));
  const offers = [];
  const bag = pool.slice();
  while (offers.length < 3 && bag.length > 0) {
    const i = Math.floor(rng() * bag.length);
    offers.push(bag.splice(i, 1)[0]);
  }
  return offers;
}
