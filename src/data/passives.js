// Passive skills offered on level up (pick 1 of 3). note: 1 = notable, 2 = keystone (rarer).
// fn(s, n) adds n stacks to the raw stat sums in game/stats.js computeStats.
export const PASS = {
  pyre: { n: 'Pyromancy', d: '+15% fire damage', max: 5, c: '#ff8a3c', fn: (s, n) => s.fire += .15 * n },
  rime: { n: 'Rime', d: '+15% cold damage and +15% freeze duration', max: 5, c: '#7fd8ff', fn: (s, n) => { s.cold += .15 * n; s.freeze += .15 * n; } },
  volt: { n: 'Voltaics', d: '+15% lightning damage', max: 5, c: '#c98bff', fn: (s, n) => s.light += .15 * n },
  power: { n: 'Raw Power', d: '+10% damage with all skills', max: 5, c: '#e6dcc6', fn: (s, n) => s.dmg += .1 * n },
  haste: { n: 'Quick Hands', d: '+8% cast speed', max: 5, c: '#ffd23f', fn: (s, n) => s.cast += .08 * n },
  vital: { n: 'Vitality', d: '+20 maximum life and +1 life regenerated per second', max: 5, c: '#ff5a5a', fn: (s, n) => { s.lifeF += 20 * n; s.lregen += n; } },
  mind: { n: 'Clarity', d: '+6% cooldown reduction', max: 5, c: '#6a9aff', fn: (s, n) => s.cdr += .06 * n },
  swift: { n: 'Fleet Foot', d: '+8% movement speed', max: 3, c: '#5fe39a', fn: (s, n) => s.ms += .08 * n },
  crit: { n: 'Precision', d: '+5% critical strike chance', max: 4, c: '#ffffff', fn: (s, n) => s.crit += .05 * n },
  vast: { n: 'Magnitude', d: '+15% area of effect', max: 4, c: '#ffb070', fn: (s, n) => s.aoe += .15 * n },
  hunger: { n: 'Soul Hunger', d: 'Gain 3 life per kill', max: 3, c: '#ff6a8a', fn: (s, n) => s.lok += 3 * n },
  multi: { n: 'Twin Flame', d: 'Fireball fires +1 projectile', max: 2, note: 1, c: '#ff8a3c', fn: (s, n) => s.proj += n },
  pierce: { n: 'Searing Lance', d: 'Fireball pierces +1 enemy before exploding', max: 2, note: 1, c: '#ff8a3c', fn: (s, n) => s.pierce += n },
  ignite: { n: 'Ignite', d: 'Fireball explosions burn enemies for 60% of the hit over 3s', max: 1, note: 1, c: '#ff5a2a', fn: s => s.ignite = 1 },
  shatter: { n: 'Shatter', d: 'Frozen enemies explode on death, freezing and damaging foes nearby', max: 1, note: 1, c: '#7fd8ff', fn: s => s.shatter = 1 },
  inferno: { n: 'Chain Reaction', d: 'Enemies killed by fire have a 30% chance to explode', max: 1, note: 1, c: '#ff5a2a', fn: s => s.chainboom = 1 },
};
