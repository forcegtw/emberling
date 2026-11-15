// Emberling — upgrade choices offered between waves. Each run picks 3, player takes 1.

export const UPGRADES = [
  {
    id: 'rapid', name: 'Quickflame', desc: 'Fire 30% faster',
    apply(p) { p.fireRateMul *= 1.3; },
  },
  {
    id: 'spread', name: 'Twin Spark', desc: '+1 ember per shot',
    apply(p) { p.bulletCount += 1; },
  },
  {
    id: 'power', name: 'Hot Core', desc: 'Embers deal +1 damage',
    apply(p) { p.damage += 1; },
  },
  {
    id: 'swift', name: 'Rising Heat', desc: 'Move 20% faster',
    apply(p) { p.speedMul *= 1.2; },
  },
  {
    id: 'pierce', name: 'Burning Through', desc: 'Embers pierce 1 extra wisp',
    apply(p) { p.pierce += 1; },
  },
  {
    id: 'heal', name: 'Rekindle', desc: 'Recover 1 health',
    apply(p) { p.hp = Math.min(5, p.hp + 1); },
  },
];

// Pick three distinct offers, guaranteeing Rekindle shows up when hurt.
export function rollOffers(player, rng = Math.random) {
  const pool = UPGRADES.filter(u => u.id !== 'heal');
  const offers = [];
  if (player.hp < 3 && rng() < 0.45) offers.push(UPGRADES.find(u => u.id === 'heal'));
  while (offers.length < 3) {
    const u = pool[Math.floor(rng() * pool.length)];
    if (!offers.some(o => o.id === u.id)) offers.push(u);
  }
  return offers;
}
