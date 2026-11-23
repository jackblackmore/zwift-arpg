// Balance tuning: hero growth, monster rarity, par levels and the targets the balance tools check against.
// Tools: `npm run balance` (instant maths report) and `npm run arena` (real game code, scripted fights). See docs/design-notes.md.

// Hero stats before gear and passives: value at level 1 plus growth per level.
// Base damage comes from skill gems (data/gems.js GEM), not character level, so spell/spellPer stay 0.
export const HERO = {
  life: 90, lifePer: 10, mana: 60, manaPer: 4, lregen: 1, mregen: 7,
  spell: 0, spellPer: 0, crit: .05, ms: 5.4, chains: 3, critMult: 1.75,
};
// The weapon a new character starts with: a plain staff, nothing on it but its implicit.
export const START_WEAPON = { slot: 'weapon', rar: 0, base: 'Ashwood Staff', name: 'Ashwood Staff', il: 1, impl: 1, mods: [['spell', 5]] };

// Monster rarity multipliers on top of the type's tier values (game/enemies.js spawnEnemy).
export const RARITY = {
  magic: { hp: 2, dmg: 1.15, spd: 1.08 },
  rare: { hp: 5, dmg: 1.35, fortified: 1.6 },
};

// Par character level for each map tier: the level you should be when you start that map.
// Tiers 1–5 are the Crypt's five levels (the region boss comes after); later tiers add `PAR_AFTER` each.
export const PAR = [1, 4, 7, 10, 12];
export const PAR_AFTER = 1.6;
// Par level of the Main gem on each tier (it earns the same XP as the character, from level 1, capped at GEM.cap).
export const PAR_GEM = [1, 4, 7, 9, 10];
export const parGem = t => Math.min(10, t <= PAR_GEM.length ? PAR_GEM[t - 1] : 10);
// The skill bar the tools assume at a tier: Fireball main, Magic Shield guard, Frost Nova in Flex A once it unlocks (level 5).
export const parBar = t => { const l = parLevel(t), g = parGem(t), bar = { main: ['fireball', g], guard: ['shield', g] }; if (l >= 5) bar.flexA = ['nova', Math.max(1, g - 2)]; if (l >= 8) bar.evade = ['dash', Math.max(1, g - 3)]; return bar; };
// Par supports (step 3): from tier 2 the Main gem has its first support (the guardian of tier 1 always drops a gem, and the
// region pool favours supports for gems you own). PAR_SUPPORT: which one each Main gem gets. parSock(t, mainGem) → { slot: [supportId] }.
export const PAR_SUPPORT = { fireball: 'twin', frostlance: 'split', skeletons: 'army', arc: 'forked', nova: 'shatter', totem: 'volley', meteor: 'twinmeteor' };
export const PAR_SUPPORT_FROM = 2;
export const parSock = (t, main = 'fireball') => t >= PAR_SUPPORT_FROM && PAR_SUPPORT[main] ? { main: [PAR_SUPPORT[main]] } : {};
export const parLevel = t => t <= PAR.length ? PAR[t - 1] : Math.round(PAR[PAR.length - 1] + PAR_AFTER * (t - PAR.length));

// What a balanced fight looks like at par. [low, high]; both tools flag numbers outside these.
export const TARGETS = {
  hitsNormal: [3, 5],     // single-target Fireball hits to kill a normal zombie (starter or magic gear)
  packClear: [4, 15],     // seconds to clear a normal pack
  rareKill: [8, 25],     // seconds of single-target fire to kill a rare
  guardian: [45, 100],    // seconds to kill the map's guardian
  faceTank: [4, 14],      // seconds a full pack in melee takes to kill you if you stand still
  uptime: [.4, .75],      // share of max Fireball cast rate that mana sustains
  lootGain: [1.3, 3],     // DPS of a full magic kit over the starter staff at the same level
};

// Gear profiles used by both tools: every slot filled with average rolls of the best affixes for a Fireball build.
//   start: the starter staff only. magic: implicit + 1 good affix per slot (magic items roll 1–2). rare: implicit + 3 good affixes (rares roll 3–5).
export const GEAR_PROFILES = { start: { n: 0 }, magic: { rar: 1, n: 1 }, rare: { rar: 2, n: 3 } };
export const AFFIX_PRIORITY = ['spell', 'fire', 'dmg', 'cast', 'lifeF', 'mregen', 'crit', 'ms', 'manaF', 'lregen'];
// The gear a player is expected to have at par on each tier (targets are checked against this profile).
export const PAR_GEAR = t => t === 1 ? 'start' : 'magic';
// Fireball explosions hit several monsters in a clumped pack; the maths report assumes this many on average.
export const AOE_TARGETS = 2;
