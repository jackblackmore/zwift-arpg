// Passive skill tree data. One point per character level. Broad stats only (never a specific skill).
// Coordinates: x, y in -100..100, (0, 0) is the centre. Negative y is up.
// Regions: core (centre ring), fire (up-left), cold (up-right), lightning (down).
// Node stats are summed into game/stats.js computeStats raw sums (s[stat] += value). Keystones carry `key` instead
// (see KEYSTONES below). Links are undirected and listed on both nodes.
//
// Total ms on the whole tree: 0.21 (must stay at or under 0.30); gear ms adds to it under MS_CAP.

export const TREE_VER = 1; // saved as P.treeV; a save without it is a Slice 1 save and gets its passive points refunded once
export const MS_CAP = .5; // total movement speed bonus (tree + gear) is capped at +50%
// What a respec costs. Today everything is free: refunding a node is free (it must leave the rest connected to the start)
// and "Reset tree" refunds every point for free after a confirm tap. `resetGold` is where a gold price would go if gold existed.
export const RESPEC = { node: 'free', reset: 'free', resetGold: 0, confirmMs: 5000 }; // confirmMs: how long RESET TREE waits for its confirm tap

// Keystone effects, merged into computeStats raw sums. `more`, `lifeMore` and `cdMore` multiply, `slotKinds` merges per slot
// (union of kinds), everything else adds. `bloodRite` is the fraction of max life a cast costs per BLOOD.cdRef seconds of cooldown
// (data/skills.js): 0.08 makes a 6 s cooldown skill (Frost Nova) cost 8% of max life every cast, Ward (12 s) 16%.
export const KEYSTONES = {
  bloodRite: { bloodRite: .08 },
  glassCannon: { more: 1.4, lifeMore: .6, slotKinds: { guard: ['attack'] } },
  fortress: { more: .8, dr: .1, slotKinds: { flexB: ['guard'] } },
  deepReserves: { surgeCap: .5, cdMore: 1.15 },
};

// Stats in words, for the node detail bar and the totals line. v is the summed value.
const pc = v => Math.round(v * 1000) / 10 + '%';
export const STAT_TEXT = {
  lifeF: v => `+${v} maximum life`, lifePct: v => `+${pc(v)} increased maximum life`, lregen: v => `+${Math.round(v * 10) / 10} life regenerated per second`,
  lok: v => `+${v} life on kill`, dmg: v => `+${pc(v)} increased damage`, fire: v => `+${pc(v)} increased fire damage`, cold: v => `+${pc(v)} increased cold damage`,
  light: v => `+${pc(v)} increased lightning damage`, cast: v => `+${pc(v)} increased cast speed`, ms: v => `+${pc(v)} increased movement speed`,
  crit: v => `+${pc(v)} critical strike chance`, aoe: v => `+${pc(v)} increased area of effect`, freeze: v => `+${pc(v)} increased freeze duration`,
  dr: v => `${pc(v)} less damage taken`, cdr: v => `${pc(v)} cooldown reduction`, surgeCap: v => `+${pc(v)} increased Surge capacity`,
};

export const TREE_START = 'heart';

export const TREE = {
  heart: { x: 0, y: 0, name: 'Heart of the Crypt', kind: 'start', region: 'core', stats: {}, links: ['core1', 'core5', 'core9', 'core13'] },

  // Core ring, radius 28: a cycle of 16 nodes
  core1: { x: 28, y: 0, name: 'Vitality', kind: 'small', region: 'core', stats: { lifeF: 12 }, links: ['heart', 'core2', 'core16'] },
  core2: { x: 26, y: 11, name: 'Cooldown', kind: 'small', region: 'core', stats: { cdr: 0.03 }, links: ['core1', 'core3'] },
  core3: { x: 20, y: 20, name: 'Life Regen', kind: 'small', region: 'core', stats: { lregen: 0.6 }, links: ['core2', 'core4', 'S1'] },
  core4: { x: 11, y: 26, name: 'Life', kind: 'small', region: 'core', stats: { lifePct: 0.04 }, links: ['core3', 'core5'] },
  core5: { x: 0, y: 28, name: 'Swiftness', kind: 'small', region: 'core', stats: { ms: 0.04 }, links: ['core4', 'core6', 'heart', 'L1'] },
  core6: { x: -11, y: 26, name: 'Reach', kind: 'small', region: 'core', stats: { aoe: 0.04 }, links: ['core5', 'core7'] },
  core7: { x: -20, y: 20, name: 'Vitality', kind: 'small', region: 'core', stats: { lifeF: 12 }, links: ['core6', 'core8'] },
  core8: { x: -26, y: 11, name: 'Second Wind', kind: 'notable', region: 'core', stats: { surgeCap: 0.15, ms: 0.04 }, links: ['core7', 'core9'] },
  core9: { x: -28, y: 0, name: 'Lifeblood', kind: 'small', region: 'core', stats: { lok: 2 }, links: ['core8', 'core10', 'heart'] },
  core10: { x: -26, y: -11, name: 'Life', kind: 'small', region: 'core', stats: { lifePct: 0.04 }, links: ['core9', 'core11'] },
  core11: { x: -20, y: -20, name: 'Bulwark', kind: 'small', region: 'core', stats: { surgeCap: 0.06 }, links: ['core10', 'core12', 'F1'] },
  core12: { x: -11, y: -26, name: 'Cooldown', kind: 'small', region: 'core', stats: { cdr: 0.03 }, links: ['core11', 'core13'] },
  core13: { x: 0, y: -28, name: 'Iron Constitution', kind: 'notable', region: 'core', stats: { lifePct: 0.10, lregen: 1 }, links: ['core12', 'core14', 'heart'] },
  core14: { x: 11, y: -26, name: 'Life Regen', kind: 'small', region: 'core', stats: { lregen: 0.6 }, links: ['core13', 'core15'] },
  core15: { x: 20, y: -20, name: 'Vitality', kind: 'small', region: 'core', stats: { lifeF: 12 }, links: ['core14', 'core16', 'C1'] },
  core16: { x: 26, y: -11, name: 'Patient Mind', kind: 'notable', region: 'core', stats: { cdr: 0.06, aoe: 0.06 }, links: ['core15', 'core1'] },

  // Overflow spoke, bottom-right between cold and lightning
  S1: { x: 32, y: 24, name: 'Reserve', kind: 'small', region: 'core', stats: { surgeCap: 0.06 }, links: ['core3', 'S2'] },
  S2: { x: 40, y: 36, name: 'Life', kind: 'small', region: 'core', stats: { lifePct: 0.04 }, links: ['S1', 'overflow'] },
  overflow: {
    x: 46, y: 46, name: 'Deep Reserves', kind: 'keystone', region: 'core', stats: {}, key: 'deepReserves',
    desc: 'The Surge gauge holds 50% more, but cooldowns are 15% slower.',
    links: ['S2'],
  },

  // Fire region, up-left. Spine F1 to bloodRite along the diagonal.
  F1: { x: -27, y: -27, name: 'Ember', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['core11', 'F2'] },
  F2: { x: -36, y: -36, name: 'Fire Damage', kind: 'small', region: 'fire', stats: { dmg: 0.05 }, links: ['F1', 'F3', 'FA1', 'FD1'] },
  F3: { x: -45, y: -45, name: "Pyromancer's Focus", kind: 'notable', region: 'fire', stats: { fire: 0.20, dmg: 0.05 }, links: ['F2', 'F4', 'FB1'] },
  F4: { x: -54, y: -54, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['F3', 'F5', 'FC1'] },
  F5: { x: -61, y: -61, name: 'Crit', kind: 'small', region: 'fire', stats: { crit: 0.015 }, links: ['F4', 'bloodRite'] },
  bloodRite: {
    x: -68, y: -68, name: 'Blood Rite', kind: 'keystone', region: 'fire', stats: {}, key: 'bloodRite',
    desc: 'Your skills have no cooldowns, but every cast costs life.',
    links: ['F5'],
  },
  // Branch A, left
  FA1: { x: -44, y: -30, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['F2', 'FA2'] },
  FA2: { x: -53, y: -27, name: 'Kindling', kind: 'notable', region: 'fire', stats: { fire: 0.12, cast: 0.05 }, links: ['FA1', 'FA3'] },
  FA3: { x: -62, y: -30, name: 'Cast', kind: 'small', region: 'fire', stats: { cast: 0.03 }, links: ['FA2'] },
  // Branch B, up
  FB1: { x: -44, y: -56, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['F3', 'FB2'] },
  FB2: { x: -35, y: -62, name: 'Area', kind: 'small', region: 'fire', stats: { aoe: 0.04 }, links: ['FB1', 'FB3'] },
  FB3: { x: -26, y: -70, name: 'Wildfire', kind: 'notable', region: 'fire', stats: { fire: 0.12, aoe: 0.10 }, links: ['FB2'] },
  // Branch C, far left
  FC1: { x: -64, y: -48, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['F4', 'FC2'] },
  FC2: { x: -73, y: -44, name: 'Fire Damage', kind: 'small', region: 'fire', stats: { dmg: 0.05 }, links: ['FC1'] },
  // Branch D, up-centre
  FD1: { x: -30, y: -44, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['F2', 'FD2'] },
  FD2: { x: -22, y: -54, name: 'Fire', kind: 'small', region: 'fire', stats: { fire: 0.08 }, links: ['FD1'] },

  // Cold region, up-right. Mirror of the fire layout.
  C1: { x: 27, y: -27, name: 'Cold', kind: 'small', region: 'cold', stats: { cold: 0.08 }, links: ['core15', 'C2'] },
  C2: { x: 36, y: -36, name: 'Freeze', kind: 'small', region: 'cold', stats: { freeze: 0.08 }, links: ['C1', 'C3', 'CA1', 'CD1'] },
  C3: { x: 45, y: -45, name: 'Deep Freeze', kind: 'notable', region: 'cold', stats: { cold: 0.18, freeze: 0.15 }, links: ['C2', 'C4', 'CB1'] },
  C4: { x: 54, y: -54, name: 'Cold', kind: 'small', region: 'cold', stats: { cold: 0.08 }, links: ['C3', 'C5', 'CC1'] },
  C5: { x: 61, y: -61, name: 'Life', kind: 'small', region: 'cold', stats: { lifeF: 8 }, links: ['C4', 'fortress'] },
  fortress: {
    x: 68, y: -68, name: 'Fortress', kind: 'keystone', region: 'cold', stats: {}, key: 'fortress',
    desc: 'Flex B becomes a second Guard slot and you take 10% less damage, but you deal 20% less damage.',
    links: ['C5'],
  },
  // Branch A, right
  CA1: { x: 44, y: -30, name: 'Cold', kind: 'small', region: 'cold', stats: { cold: 0.08 }, links: ['C2', 'CA2'] },
  CA2: { x: 53, y: -27, name: "Winter's Embrace", kind: 'notable', region: 'cold', stats: { cold: 0.10, lifePct: 0.06 }, links: ['CA1', 'CA3'] },
  CA3: { x: 62, y: -30, name: 'Freeze', kind: 'small', region: 'cold', stats: { freeze: 0.08 }, links: ['CA2'] },
  // Branch B, up
  CB1: { x: 44, y: -56, name: 'Frost Guard', kind: 'small', region: 'cold', stats: { dr: 0.01 }, links: ['C3', 'CB2'] },
  CB2: { x: 35, y: -62, name: 'Cold Damage', kind: 'small', region: 'cold', stats: { dmg: 0.05 }, links: ['CB1', 'CB3'] },
  CB3: { x: 26, y: -70, name: 'Glacial Mind', kind: 'notable', region: 'cold', stats: { cold: 0.12, cdr: 0.04 }, links: ['CB2'] },
  // Branch C, far right
  CC1: { x: 64, y: -48, name: 'Cold', kind: 'small', region: 'cold', stats: { cold: 0.08 }, links: ['C4', 'CC2'] },
  CC2: { x: 73, y: -44, name: 'Life', kind: 'small', region: 'cold', stats: { lifeF: 8 }, links: ['CC1'] },
  // Branch D, up-centre
  CD1: { x: 30, y: -44, name: 'Cold', kind: 'small', region: 'cold', stats: { cold: 0.08 }, links: ['C2', 'CD2'] },
  CD2: { x: 22, y: -54, name: 'Cold Damage', kind: 'small', region: 'cold', stats: { dmg: 0.05 }, links: ['CD1'] },

  // Lightning region, down. Spine L1 to glassCannon along x = 0.
  L1: { x: 0, y: 38, name: 'Lightning', kind: 'small', region: 'lightning', stats: { light: 0.08 }, links: ['core5', 'L2', 'LR1'] },
  L2: { x: 0, y: 48, name: 'Cast', kind: 'small', region: 'lightning', stats: { cast: 0.03 }, links: ['L1', 'L3', 'LA1'] },
  L3: { x: 0, y: 58, name: 'Storm Caller', kind: 'notable', region: 'lightning', stats: { light: 0.20, crit: 0.02 }, links: ['L2', 'L4', 'LB1'] },
  L4: { x: 0, y: 68, name: 'Crit', kind: 'small', region: 'lightning', stats: { crit: 0.02 }, links: ['L3', 'L5', 'LC1'] },
  L5: { x: 0, y: 78, name: 'Lightning', kind: 'small', region: 'lightning', stats: { light: 0.08 }, links: ['L4', 'glassCannon'] },
  glassCannon: {
    x: 0, y: 88, name: 'Glass Cannon', kind: 'keystone', region: 'lightning', stats: {}, key: 'glassCannon',
    desc: 'The Guard slot becomes an attack slot and you deal 40% more damage, but you have 40% less maximum life.',
    links: ['L5'],
  },
  // Branch A, left
  LA1: { x: -10, y: 50, name: 'Swiftness', kind: 'small', region: 'lightning', stats: { ms: 0.03 }, links: ['L2', 'LA2'] },
  LA2: { x: -19, y: 54, name: 'Quickening', kind: 'notable', region: 'lightning', stats: { cast: 0.08, ms: 0.04 }, links: ['LA1', 'LA3'] },
  LA3: { x: -28, y: 58, name: 'Lightning', kind: 'small', region: 'lightning', stats: { light: 0.08 }, links: ['LA2'] },
  // Branch B, right
  LB1: { x: 10, y: 62, name: 'Damage', kind: 'small', region: 'lightning', stats: { dmg: 0.05 }, links: ['L3', 'LB2'] },
  LB2: { x: 20, y: 70, name: 'Lightning', kind: 'small', region: 'lightning', stats: { light: 0.08 }, links: ['LB1', 'LB3'] },
  LB3: { x: 30, y: 78, name: 'Swiftness', kind: 'small', region: 'lightning', stats: { ms: 0.03 }, links: ['LB2', 'LB4'] },
  LB4: { x: 40, y: 84, name: 'Cast', kind: 'small', region: 'lightning', stats: { cast: 0.03 }, links: ['LB3'] },
  // Branch C, down-left
  LC1: { x: -10, y: 76, name: 'Swiftness', kind: 'small', region: 'lightning', stats: { ms: 0.03 }, links: ['L4', 'LC2'] },
  LC2: { x: -20, y: 82, name: 'Static Mind', kind: 'notable', region: 'lightning', stats: { light: 0.12, crit: 0.03 }, links: ['LC1'] },
  // Branch D, short right
  LR1: { x: 12, y: 36, name: 'Damage', kind: 'small', region: 'lightning', stats: { dmg: 0.05 }, links: ['L1'] },
};
