// Balance tuning: hero growth, monster rarity, par levels and the targets the balance tools check against.
// Tools: `npm run balance` (instant maths report) and `npm run arena` (real game code, scripted fights). See docs/design-notes.md.

// Hero stats before gear and the passive tree: value at level 1 plus growth per level.
// Base damage comes from skill gems (data/gems.js GEM), not character level, so spell/spellPer stay 0.
// lifeOnHit: life a melee swing gives back per monster it hits, for up to lifeOnHitMax monsters (melee stands in the pack).
export const HERO = {
  life: 120, lifePer: 12, lregen: 1, lifeOnHit: .4, lifeOnHitMax: 3,
  spell: 0, spellPer: 0, crit: .05, ms: 5.4, chains: 3, critMult: 1.75,
};
// The weapon a new character starts with: a plain sword, nothing on it but its implicit.
export const START_WEAPON = { slot: 'weapon', rar: 0, base: 'Rusted Sword', name: 'Rusted Sword', il: 1, impl: 1, mods: [['spell', 5]] };

// Monster rarity multipliers on top of the type's tier values (game/enemies.js spawnEnemy).
// xp: kill XP multiplier.
export const RARITY = {
  magic: { hp: 2, dmg: 1.15, spd: 1.08, xp: 2 },
  rare: { hp: 5, dmg: 1.35, fortified: 1.6, xp: 8 },
};
// Every hit rolls between spread[0] and spread[1] × its average. Dying costs deathXp of the XP needed for your next level.
// After dying you respawn at the map entrance, untouchable for respawnInvuln s.
export const COMBAT = { spread: [.88, 1.12], deathXp: .1, respawnInvuln: 2 };
// Defence (design notes "Defence"; the maths in game/formulas.js defended). Armour cuts a physical hit of d by A / (A + armourK × d),
// at most armourCap: the same armour takes a bigger share off small hits than off big ones (Path of Exile's armour). Resistances
// cut fire, cold, lightning and poison hits by their value, at most resCap each (and can go below zero). Monster damage types are in
// data/monsters.js (DMG_TYPES, MT[].dt, LEAN).
export const DEFENCE = { armourK: 10, armourCap: .9, resCap: .75 };
// Experience to go from level l to l + 1: base × l^exp (the character and every gem use the same curve).
export const XP_CURVE = { base: 65, exp: 1.6 };
// Item level scaling of rolled values: flat affixes +flat per item level above 1, percent affixes +pct per level.
export const ITEM_SCALE = { flat: .22, pct: .07 };
// The bag's "is this an upgrade?" estimate (game/stats.js estimate) and the maths report: extra damage per Arc chain, and how
// many monsters a melee swing hits on average in a clumped pack (by gem; Sweep hits all round, Aftershock adds a half-strength slam).
export const ESTIMATE = { perChain: .3, targets: { sword: 1.9, cleave: 2.4, fstrike: 1.5, slam: 1.8 }, sweep: 1.35 };

// Par character level for each map tier: the level you should be when you start that map.
// Tiers 1–5 are the Crypt's five levels (the region boss comes after); later tiers add `PAR_AFTER` each.
export const PAR = [1, 4, 6, 8, 10];
export const PAR_AFTER = 1.6;
// Par level of the Main gem on each tier (it earns the same XP as the character, from level 1, capped at GEM.cap).
export const PAR_GEM = [1, 4, 6, 8, 10];
export const parGem = t => Math.min(10, t <= PAR_GEM.length ? PAR_GEM[t - 1] : 10);
// The skill bar the tools assume at a tier: the starting bar (Sword, Knight's Shield, Roll), plus Frost Nova in Flex A once it
// unlocks (level 5). While the fight mechanics are tested (build order step 3⅞) the par Main gem is the plain Sword.
export const PAR_MAIN = 'sword';
export const parBar = t => { const l = parLevel(t), g = parGem(t), bar = { main: [PAR_MAIN, g], guard: ['block', g], evade: ['roll', g] }; if (l >= 5) bar.flexA = ['nova', Math.max(1, g - 2)]; return bar; };
// Par supports (step 3): from tier 2 the Main gem has its first support (the guardian of tier 1 always drops a gem, and the
// region pool favours supports for gems you own). PAR_SUPPORT: which one each Main gem gets. parSock(t, mainGem) → { slot: [supportId] }.
export const PAR_SUPPORT = { cleave: 'ignite', fstrike: 'brittle', slam: 'aftershock', arc: 'forked', nova: 'shatter', totem: 'volley', meteor: 'twinmeteor' };
export const PAR_SUPPORT_FROM = 2;
export const parSock = (t, main = PAR_MAIN) => t >= PAR_SUPPORT_FROM && PAR_SUPPORT[main] ? { main: [PAR_SUPPORT[main]] } : {};
// Passive tree presets (data/tree.js): the order a sensible player takes nodes in, one per level after the first. Each node is next to
// the start or to one earlier in its list (npm test checks). The tools take the first treePoints(level) nodes of the par preset for
// the Main gem (PAR_TREE); the keystone presets are for the arena's keystone rows (they reach the keystone at 7 points, level 8).
//   shield: the Sword knight: posture, parry and some damage first, then life, riposte, stagger and finisher.
//   fire / cold / light: an elemental Main gem's region first, then life and the shield basics.
export const TREE_PRESETS = {
  shield: ['steady', 'keen', 'reflex', 'power', 'trigger', 'hardy', 'iron', 'counter', 'hands', 'measure', 'cut', 'headsman', 'sharpen', 'venge', 'poise'],
  fire: ['focus', 'fire1', 'fire2', 'pyro', 'power', 'hardy', 'iron', 'steady', 'reflex', 'vast', 'fire3', 'fire4', 'wildfire', 'keen', 'trigger'],
  cold: ['focus', 'cold1', 'cold2', 'rime', 'power', 'hardy', 'iron', 'steady', 'reflex', 'cold4', 'cold5', 'winter', 'keen', 'trigger', 'measure'],
  light: ['focus', 'light1', 'light2', 'volt', 'precise', 'hardy', 'iron', 'steady', 'reflex', 'arcing', 'light3', 'light4', 'thunder', 'keen', 'trigger'],
  riposte: ['steady', 'counter', 'sharpen', 'venge', 'punish', 'wound', 'riposte', 'keen', 'hardy', 'iron', 'reflex', 'trigger', 'measure'],
  duelist: ['steady', 'reflex', 'trigger', 'measure', 'poise', 'master', 'duelist', 'keen', 'hardy', 'iron', 'counter', 'cut', 'headsman'],
  bulwark: ['steady', 'brace', 'settle', 'wall', 'stout', 'anchor', 'bulwark', 'keen', 'hardy', 'iron', 'hands', 'counter', 'reflex'],
  blood: ['hardy', 'iron', 'hunger', 'pact', 'blood', 'mend', 'keen', 'power', 'steady', 'reflex', 'trigger', 'focus', 'cold1'],
};
export const PAR_TREE = { sword: 'shield', cleave: 'fire', fstrike: 'cold', slam: 'light' };
// The nodes the tools give a hero at a level: the first treePoints(level) of a preset (default: the par preset for the Main gem).
export const parTree = (lvl, main = PAR_MAIN, preset = PAR_TREE[main] || 'shield') => (TREE_PRESETS[preset] || []).slice(0, Math.max(0, lvl - 1));
export const parLevel = t => t <= PAR.length ? PAR[t - 1] : Math.round(PAR[PAR.length - 1] + PAR_AFTER * (t - PAR.length));

// What a balanced fight looks like at par. [low, high]; both tools flag numbers outside these.
export const TARGETS = {
  hitsNormal: [4, 6],     // single-target hits of the par Main gem (PAR_MAIN) to kill a normal zombie (you start a little underpowered); big-hit gems (Thunder Slam) take fewer by design
  packClear: [4, 15],     // seconds to clear a normal pack
  rareKill: [8, 25],     // seconds of single-target hits to kill a rare
  guardian: [45, 100],    // seconds to kill the map's guardian, never surging
  guardianSurge: [35, 85], // the same, spending a full Surge gauge at the start
  faceTank: [4, 14],      // seconds a full pack in melee takes to kill you if you stand still and never Guard
  lootGain: [1.3, 3],     // DPS of a full magic kit over the starter sword at the same level
};

// Gear profiles used by both tools: every slot filled with average rolls of the best affixes for an Ember Cleave build.
//   start: the starter sword only. magic: implicits + 1 good affix per slot (magic items roll 1–2). rare: implicits + 3 good affixes (rares roll 3–5).
//   Implicits bring armour on the helm, chest and boots (data/items.js IMPL). res: one more affix on these slots, a resistance
//   (a magic item's second affix; most players pick up a little resistance by the second map).
export const GEAR_PROFILES = { start: { n: 0 }, magic: { rar: 1, n: 1, res: { boots: 'resPoison', ring: 'resElem' } }, rare: { rar: 2, n: 3, res: { boots: 'resPoison', ring: 'resElem' } } };
export const AFFIX_PRIORITY = ['spell', 'fire', 'dmg', 'cast', 'lifeF', 'crit', 'ms', 'lregen'];
// The gear a player is expected to have at par on each tier (targets are checked against this profile).
export const PAR_GEAR = t => t === 1 ? 'start' : 'magic';

// Level time (`npm run level`, game/levelrun.js, and the estimate in `npm run balance`). A full clear at par is aimed at
// `target` minutes (design notes "Level generation v2"). The par rider: rides at `pace` of FTP (endurance, full walking speed),
// at `cad` rpm, goes to `surge` when the bot wants Surge and to `spike` while the guardian channels (data/ride.js RIDE). The
// estimate's fight time is the balance maths (a floor) times `fightSlack`, because real fights also walk between monsters, wait out
// wind-ups and guard; `walkSlack` is how much longer than the room-to-room tour the autopilot really walks (steering, loot, packs).
// fightSlack and walkSlack are 1 (not calibrated yet: build order step 10, build step 6 tunes them against the measured run).
// measured: the last `npm run level` means per tier (10 seeds, Nov 2026), printed next to the estimate; update it when you re-measure.
export const LEVEL_TIME = { target: [25, 35], pace: .75, cad: 88, surge: 1.05, spike: 1.4, fightSlack: 1, walkSlack: 1, measured: [6.9, 6.6, 7.1, 7.6, 8.6] };
