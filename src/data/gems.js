// Gem tuning and the skill bar's slot rules. Gems own a skill's base damage and its behaviour milestones; gear and the tree multiply it.
// Damage = (gem base + flat spell from gear) x skill mult x (1 + increased) x each more x crit.
// P.gems holds gem INSTANCES { uid, id, lvl, ap } (id keys GEMS); the bar and sockets refer to them by uid (see game/gems.js).
export const GEM_CAP = 10; // Tier I level cap
// kind: attack (damaging skill, incl. minion / totem / trap skills) | guard | evade | support.
// tags: projectile area fire cold lightning minion totem trap corpse duration aura melee. A support's tags are the tags it needs
// (any overlap with the skill's tags makes it fit). base1 -> baseCap: base damage at lv1 and at the cap (linear between).
// scale: gentle per-level growth of a non-damage stat (ward absorb, blink range, a support's strength). milestones: behaviour at levels.
// Only Fireball / Frost Nova / Ward / Blink have behaviour today; the rest are definitions the later workstreams implement.
const skill = (name, tags, icon, color, desc, b1 = 10, bc = 30, milestones = []) => ({ name, kind: 'attack', tier: 'I', cap: GEM_CAP, tags, icon, color, base1: b1, baseCap: bc, milestones, desc });
const guard = (name, icon, color, desc) => ({ name, kind: 'guard', tier: 'I', cap: GEM_CAP, tags: [], icon, color, scale: .02, milestones: [], desc });
const support = (name, tags, icon, color, desc) => ({ name, kind: 'support', tier: 'I', cap: GEM_CAP, tags, icon, color, scale: .05, milestones: [], desc });
export const GEMS = {
  fireball: { ...skill('Fireball', ['projectile', 'area', 'fire'], '✹', '#ff8a3c', 'Hurls an exploding fireball at the nearest enemy.'),
    milestones: [{ lvl: 5, key: 'pierce', text: 'pierces an enemy', pierce: 1 }, { lvl: 10, key: 'burn', text: 'leaves burning ground' }] },
  frostLance: skill('Frost Lance', ['projectile', 'cold'], '✦', '#8fe0ff', 'A slow, heavy ice lance with long reach. It picks the toughest target, chills it and hits very hard.', 22, 66,
    [{ lvl: 5, key: 'pierce', text: 'pierces one more enemy', pierce: 1 }, { lvl: 10, key: 'shatter', text: 'frozen enemies take double damage' }]),
  skeletons: skill('Raise Skeletons', ['minion'], '☠', '#d8d0b8', 'Raises skeleton warriors (3 at first) that hunt monsters for 20 s and follow you. They take the hits meant for you.', 10, 30,
    [{ lvl: 5, key: 'bonehard', text: 'skeletons have double life' }, { lvl: 10, key: 'legion', text: 'the army grows to 5', cap: 2 }]),
  nova: skill('Frost Nova', ['area', 'cold'], '❄', '#7fd8ff', 'A ring of frost that damages and freezes everything around you.'),
  flameTotem: skill('Flame Totem', ['totem', 'fire', 'projectile'], '♨', '#ff6a2a', 'Plants a totem that spits fire at nearby enemies.'),
  arc: skill('Arc', ['lightning'], '↯', '#c98bff', 'Chain lightning that jumps between enemies and may shock them.'),
  meteor: skill('Meteor', ['area', 'fire'], '☄', '#ff5a2a', 'Calls a meteor down on a target spot after a short delay.', 16, 48),
  iceTrap: skill('Ice Trap', ['trap', 'cold', 'area'], '✣', '#a8f0ff', 'Lays a trap that bursts in frost when an enemy steps on it.'),
  corpseExplosion: skill('Corpse Explosion', ['corpse', 'area', 'fire'], '✺', '#ff7a5a', 'Detonates a corpse, damaging everything around it.', 14, 42),
  ward: guard('Ward', '◍', '#8fe0ff', 'A shield that absorbs damage for a few seconds.'),
  boneArmour: { ...guard('Bone Armour', '❖', '#e6dcc6', 'Three bone plates circle you; each stops one whole hit for 8 s and hits the attacker back.'),
    milestones: [{ lvl: 5, key: 'thorns', text: 'thorns hit twice as hard' }, { lvl: 10, key: 'ossuary', text: 'five plates', plates: 2 }] },
  decoy: { ...guard('Decoy', '☻', '#ffd23f', 'Drops a decoy for 6 s that every nearby monster attacks instead of you.'),
    milestones: [{ lvl: 5, key: 'burst', text: 'bursts when it ends' }, { lvl: 10, key: 'sturdy', text: 'twice the life' }] },
  blink: { name: 'Blink', kind: 'evade', tier: 'I', cap: GEM_CAP, tags: [], icon: '➶', color: '#b08aff', scale: .02, milestones: [], desc: 'Teleports a short way, away from danger.' },
  split: support('Split', ['projectile'], '⑂', '#ff8a3c', 'Fires extra projectiles in a fan.'),
  pierce: support('Pierce', ['projectile'], '➳', '#ffd23f', 'Projectiles pass through extra enemies.'),
  shatter: support('Shatter', ['cold'], '❅', '#7fd8ff', 'Frozen enemies explode on death.'),
  conduit: support('Conduit', ['lightning'], '⌁', '#c98bff', 'Lightning hits shock and spread.'),
  ignite: support('Ignite', ['fire'], '✸', '#ff5a2a', 'Fire hits set enemies burning.'),
  chainReaction: support('Chain Reaction', ['fire', 'area'], '⚯', '#ff7a3c', 'Enemies killed by this skill may explode.'),
};
// Skills with no gem of their own borrow a gem's base: damage = gem base x frac.
export const GEM_FALLBACK = { burn: { gem: 'fireball', frac: .6 }, none: { gem: 'fireball', frac: 1 } };
// AP needed to go from level l to l+1. Reaching lv5 takes ~580 AP, lv10 ~3400 AP (about 2 and 13 full maps of kills plus riding time).
export const apNeed = l => Math.round(40 * Math.pow(l, 1.35));
export const AP_KILL = { normal: 1, magic: 3, rare: 10, guardian: 50 };
export const AP_PER_SEC = .1; // for riding time
export const UNEQUIPPED_SHARE = .1;

// ---- the skill bar ----
// accepts: gem kinds the slot takes (S.slotKinds can override per slot). unlock: character level. sockets: [level, count] steps.
export const SLOT_ORDER = ['main', 'flexA', 'flexB', 'guard', 'evade'];
export const BAR_SLOTS = {
  main: { name: 'Main', accepts: ['attack'], unlock: 1, sockets: [[1, 1], [15, 2], [30, 3], [45, 4]], key: 'LMB' },
  flexA: { name: 'Flex A', accepts: ['attack'], unlock: 5, sockets: [[5, 1], [25, 2]], key: 'Q' },
  flexB: { name: 'Flex B', accepts: ['attack'], unlock: 12, sockets: [[12, 1], [25, 2]], key: 'R' },
  guard: { name: 'Guard', accepts: ['guard'], unlock: 8, sockets: [[8, 1]], key: 'E' },
  evade: { name: 'Evade', accepts: ['evade'], unlock: 1, sockets: [[1, 1]], key: 'SPACE' },
};
// The Slice 1 loadout, for dbg.kit() with no argument.
export const SLICE1_KIT = { main: 'fireball', flexA: 'nova', guard: 'ward', evade: 'blink', lvl: 1 };
// Slice 1 notable passives that became support gems (old saves convert them; see game/character.js).
export const NOTABLE_TO_SUPPORT = { multi: 'split', pierce: 'pierce', ignite: 'ignite', shatter: 'shatter', inferno: 'chainReaction' };
