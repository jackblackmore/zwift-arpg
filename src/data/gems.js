// Skill gem tuning. Gems own a skill's base damage and its behaviour milestones; gear and the tree multiply it.
// Damage = (gem base + flat spell from gear) x skill mult x (1 + increased) x each more x crit.
export const GEM_CAP = 10; // Tier I level cap
// base1 -> baseCap: base damage at lv1 and at the cap (linear between). scale: gentle per-level growth of a non-damage stat (ward absorb, blink range).
export const GEMS = {
  fireball: {
    name: 'Fireball', kind: 'attack', tier: 'I', cap: GEM_CAP, base1: 10, baseCap: 30,
    milestones: [{ lvl: 5, key: 'pierce', text: 'pierces an enemy', pierce: 1 }, { lvl: 10, key: 'burn', text: 'leaves burning ground' }],
  },
  nova: { name: 'Frost Nova', kind: 'attack', tier: 'I', cap: GEM_CAP, base1: 10, baseCap: 30, milestones: [] },
  ward: { name: 'Ward', kind: 'guard', tier: 'I', cap: GEM_CAP, scale: .02, milestones: [] },
  blink: { name: 'Blink', kind: 'evade', tier: 'I', cap: GEM_CAP, scale: .02, milestones: [] },
};
// Skills with no gem of their own borrow a gem's base: damage = gem base x frac.
export const GEM_FALLBACK = { burn: { gem: 'fireball', frac: .6 }, arc: { gem: 'fireball', frac: 1 }, none: { gem: 'fireball', frac: 1 } };
// AP needed to go from level l to l+1. Reaching lv5 takes ~580 AP, lv10 ~3400 AP (about 2 and 13 full maps of kills plus riding time).
export const apNeed = l => Math.round(40 * Math.pow(l, 1.35));
export const AP_KILL = { normal: 1, magic: 3, rare: 10, guardian: 50 };
export const AP_PER_SEC = .1; // for riding time
export const UNEQUIPPED_SHARE = .1;
