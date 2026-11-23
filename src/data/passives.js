// Passive skills offered on level up (pick 1 of 3). note: 1 = notable, 2 = keystone (rarer).
// The notables that changed one skill are support gems now (data/gems.js SUPPORTS). fn(s, n) adds n stacks to the raw stat sums in game/stats.js computeStats.
export const PASS = {
  pyre: { n: 'Pyromancy', d: '+15% fire damage', max: 5, c: '#ff8a3c', fn: (s, n) => s.fire += .15 * n },
  rime: { n: 'Rime', d: '+15% cold damage and +15% freeze duration', max: 5, c: '#7fd8ff', fn: (s, n) => { s.cold += .15 * n; s.freeze += .15 * n; } },
  volt: { n: 'Voltaics', d: '+15% lightning damage', max: 5, c: '#c98bff', fn: (s, n) => s.light += .15 * n },
  power: { n: 'Raw Power', d: '+10% damage with all skills', max: 5, c: '#e6dcc6', fn: (s, n) => s.dmg += .1 * n },
  haste: { n: 'Quick Hands', d: '+8% attack and cast speed', max: 5, c: '#ffd23f', fn: (s, n) => s.cast += .08 * n },
  vital: { n: 'Vitality', d: '+20 maximum life and +1 life regenerated per second', max: 5, c: '#ff5a5a', fn: (s, n) => { s.lifeF += 20 * n; s.lregen += n; } },
  mind: { n: 'Second Wind', d: '+15% Surge capacity and the gauge refills 15% faster', max: 5, c: '#ffd23f', fn: (s, n) => { s.surge += .15 * n; s.surgeRe += .15 * n; } },
  swift: { n: 'Fleet Foot', d: '+8% movement speed', max: 3, c: '#5fe39a', fn: (s, n) => s.ms += .08 * n },
  crit: { n: 'Precision', d: '+5% critical strike chance', max: 4, c: '#ffffff', fn: (s, n) => s.crit += .05 * n },
  vast: { n: 'Magnitude', d: '+15% area of effect', max: 4, c: '#ffb070', fn: (s, n) => s.aoe += .15 * n },
  hunger: { n: 'Soul Hunger', d: 'Gain 4 life per kill', max: 3, c: '#ff6a8a', fn: (s, n) => { s.lok += 4 * n; } },
};
