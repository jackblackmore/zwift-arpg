// Balance tuning: hero growth, monster rarity, par levels and the targets the balance tools check against.
// Tools: `npm run balance` (instant maths report) and `npm run arena` (real game code, scripted fights). See docs/design-notes.md.

// Hero stats before gear and passives: value at level 1 plus growth per level.
// Base damage comes from skill gems (data/gems.js GEM), not character level, so spell/spellPer stay 0.
// lifeOnHit: life a melee swing gives back per monster it hits, for up to lifeOnHitMax monsters (melee stands in the pack).
export const HERO = {
  life: 120, lifePer: 12, lregen: 1, lifeOnHit: 1, lifeOnHitMax: 3,
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
// Experience to go from level l to l + 1: base × l^exp (the character and every gem use the same curve).
export const XP_CURVE = { base: 40, exp: 1.55 };
// Item level scaling of rolled values: flat affixes +flat per item level above 1, percent affixes +pct per level.
export const ITEM_SCALE = { flat: .22, pct: .07 };
// The bag's "is this an upgrade?" estimate (game/stats.js estimate) and the maths report: extra damage per Arc chain, and how
// many monsters a melee swing hits on average in a clumped pack (by gem; Sweep hits all round, Aftershock adds a half-strength slam).
export const ESTIMATE = { perChain: .3, targets: { cleave: 2.4, fstrike: 1.5, slam: 1.8 }, sweep: 1.35 };

// Par character level for each map tier: the level you should be when you start that map.
// Tiers 1–5 are the Crypt's five levels (the region boss comes after); later tiers add `PAR_AFTER` each.
export const PAR = [1, 4, 7, 10, 12];
export const PAR_AFTER = 1.6;
// Par level of the Main gem on each tier (it earns the same XP as the character, from level 1, capped at GEM.cap).
export const PAR_GEM = [1, 4, 7, 9, 10];
export const parGem = t => Math.min(10, t <= PAR_GEM.length ? PAR_GEM[t - 1] : 10);
// The skill bar the tools assume at a tier: Ember Cleave main, Magic Shield guard, Frost Nova in Flex A once it unlocks (level 5).
export const PAR_MAIN = 'cleave';
export const parBar = t => { const l = parLevel(t), g = parGem(t), bar = { main: [PAR_MAIN, g], guard: ['shield', g] }; if (l >= 5) bar.flexA = ['nova', Math.max(1, g - 2)]; if (l >= 8) bar.evade = ['dash', Math.max(1, g - 3)]; return bar; };
// Par supports (step 3): from tier 2 the Main gem has its first support (the guardian of tier 1 always drops a gem, and the
// region pool favours supports for gems you own). PAR_SUPPORT: which one each Main gem gets. parSock(t, mainGem) → { slot: [supportId] }.
export const PAR_SUPPORT = { cleave: 'ignite', fstrike: 'brittle', slam: 'aftershock', arc: 'forked', nova: 'shatter', totem: 'volley', meteor: 'twinmeteor' };
export const PAR_SUPPORT_FROM = 2;
export const parSock = (t, main = PAR_MAIN) => t >= PAR_SUPPORT_FROM && PAR_SUPPORT[main] ? { main: [PAR_SUPPORT[main]] } : {};
export const parLevel = t => t <= PAR.length ? PAR[t - 1] : Math.round(PAR[PAR.length - 1] + PAR_AFTER * (t - PAR.length));

// What a balanced fight looks like at par. [low, high]; both tools flag numbers outside these.
export const TARGETS = {
  hitsNormal: [3, 5],     // single-target hits of the par Main gem (PAR_MAIN) to kill a normal zombie; big-hit gems (Thunder Slam) take fewer by design
  packClear: [4, 15],     // seconds to clear a normal pack
  rareKill: [8, 25],     // seconds of single-target hits to kill a rare
  guardian: [45, 100],    // seconds to kill the map's guardian, never surging
  guardianSurge: [35, 85], // the same, spending a full Surge gauge at the start
  faceTank: [4, 14],      // seconds a full pack in melee takes to kill you if you stand still and never Guard
  lootGain: [1.3, 3],     // DPS of a full magic kit over the starter sword at the same level
};

// Gear profiles used by both tools: every slot filled with average rolls of the best affixes for an Ember Cleave build.
//   start: the starter sword only. magic: implicit + 1 good affix per slot (magic items roll 1–2). rare: implicit + 3 good affixes (rares roll 3–5).
export const GEAR_PROFILES = { start: { n: 0 }, magic: { rar: 1, n: 1 }, rare: { rar: 2, n: 3 } };
export const AFFIX_PRIORITY = ['spell', 'fire', 'dmg', 'cast', 'lifeF', 'crit', 'ms', 'lregen'];
// The gear a player is expected to have at par on each tier (targets are checked against this profile).
export const PAR_GEAR = t => t === 1 ? 'start' : 'magic';
