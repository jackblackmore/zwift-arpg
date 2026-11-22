// THE MATHS. Pure functions over the design data: no DOM, no three.js, so the game and the balance sim share them.
// If a rule changes here, it changes in the game and in the report together.
import { STATS, BASE, ELEMENTS } from './stats.js';
import { LEVEL, PER_LEVEL } from './progression.js';
import { SCALE, RARITY as MRARITY, RARE_MODS } from './monsters.js';

// A value growing by a fixed fraction per level: base × (1 + growth)^(L-1).
export const grow = (c, L) => c.base * (1 + c.growth) ** (L - 1);

// ---------- Levels ----------
export const xpNeed = l => { const x = LEVEL.xp; return Math.round(x.base * l ** x.exp * (1 + x.late) ** Math.max(0, l - x.lateFrom)); };
export function xpMult(playerLvl, monsterLvl) {
  const gap = playerLvl - monsterLvl, p = LEVEL.xpPenalty;
  return gap <= p.safe ? 1 : Math.max(p.floor, 1 - p.per * (gap - p.safe));
}

// ---------- Affix tiers ----------
// Tier list for an affix, best first: [{ tier, ilvl, min, max }].
export function affixTiers(a) {
  const out = [];
  for (let k = 0; k < a.tiers; k++) {
    const f = a.tiers === 1 ? 1 : k / (a.tiers - 1); // 0 = lowest tier, 1 = top
    const r = v => a.int || a.lo[0] >= 1 ? Math.round(v) : Math.round(v * 100) / 100; // flat stats whole, percentages to 1%
    out.push({ tier: a.tiers - k, ilvl: Math.round(a.from + (a.to - a.from) * f), min: r(a.lo[0] + (a.hi[0] - a.lo[0]) * f), max: r(a.lo[1] + (a.hi[1] - a.lo[1]) * f) });
  }
  return out.reverse();
}
// Tiers that can roll at an item level (best first).
export const tiersAt = (a, ilvl) => affixTiers(a).filter(t => t.ilvl <= ilvl);

// ---------- Summing mods ----------
// mods: list of [statId, value]. Returns totals by stat id: flat/inc/count summed, 'more' multiplied, flags OR'd.
export function sumMods(mods) {
  const t = {};
  for (const [id, v] of mods) {
    const d = STATS[id]; if (!d) throw new Error('Unknown stat ' + id);
    if (d.expands) { for (const e of d.expands) t[e] = (t[e] || 0) + v; continue; }
    if (d.kind === 'more') t[id] = (t[id] ?? 1) * (d.less ? 1 - v : 1 + v);
    else if (d.kind === 'flag') t[id] = 1;
    else t[id] = (t[id] || 0) + v;
  }
  return t;
}
const g = (t, id) => t[id] || 0;

// ---------- Player ----------
// Defensive and resource numbers for a character of level `lvl` with summed mods `t`. resPenalty: act penalty (negative).
export function playerStats(t, lvl, resPenalty = 0) {
  const life = (PER_LEVEL.life.base + PER_LEVEL.life.per * (lvl - 1) + g(t, 'life')) * (1 + g(t, 'lifeInc'));
  const mana = (PER_LEVEL.mana.base + PER_LEVEL.mana.per * (lvl - 1) + g(t, 'mana')) * (1 + g(t, 'manaInc'));
  const maxRes = BASE.maxRes + g(t, 'maxRes'), res = {};
  for (const e of [...ELEMENTS, 'chaos']) {
    const raw = g(t, e + 'Res') + (e === 'chaos' ? 0 : resPenalty);
    res[e] = Math.min(maxRes, raw); res[e + 'Raw'] = raw;
  }
  return {
    life, mana, res, maxRes,
    armour: g(t, 'armour') * (1 + g(t, 'armourInc')),
    evasion: g(t, 'evasion') * (1 + g(t, 'evasionInc')),
    block: Math.min(STATS.block.cap, g(t, 'block')),
    lessTaken: t.dmgTakenLess ?? 1,
    lifeRegen: g(t, 'lifeRegen') + life * g(t, 'lifeRegenPct'),
    manaRegen: (BASE.manaRegen + mana * BASE.manaRegenPct) * (1 + g(t, 'manaRegenInc')),
    ms: BASE.moveSpeed * (1 + g(t, 'ms')),
    lifeOnKill: g(t, 'lifeOnKill'), manaOnKill: g(t, 'manaOnKill'),
    rarity: g(t, 'rarity'), quantity: g(t, 'quantity'),
  };
}

// ---------- Skills ----------
// One cast of `skill` at skill level `sl` with summed mods `t` (gear + passives + runes for this skill).
// monsterRes: the target's resistances { fire: .3, ... }. Returns per-type damage, hit, crit, casts/s and DPS.
export function skillHit(skill, sl, t, monsterRes = {}) {
  const mult = (1 + skill.growth) ** (sl - 1), types = {};
  const added = { phys: g(t, 'spellPhys'), fire: g(t, 'spellFire'), cold: g(t, 'spellCold'), light: g(t, 'spellLight') };
  const more = t.dmgMore ?? 1, pen = g(t, 'pen');
  let hit = 0;
  for (const type of ['phys', ...ELEMENTS]) {
    const base = (skill.dmg[type] || 0) * mult + (added[type] || 0) * skill.eff;
    if (!base) continue;
    let inc = g(t, 'dmgInc');
    for (const [id, d] of Object.entries(STATS)) {
      if (d.of !== 'damage' || d.kind !== 'inc' || id === 'dmgInc') continue;
      if (d.tag && !skill.tags.includes(d.tag)) continue;
      if (d.types && !d.types.includes(type)) continue;
      inc += g(t, id);
    }
    const res = Math.max(-.5, (monsterRes[type] || 0) - (type === 'phys' ? 0 : pen));
    types[type] = base * (1 + inc) * more * (1 - res);
    hit += types[type];
  }
  const critChance = t.noCrit ? 0 : Math.min(1, skill.crit * (1 + g(t, 'critInc')));
  const critMulti = BASE.critMulti + g(t, 'critMulti');
  const critFactor = 1 + critChance * (critMulti - 1);
  const casts = (1 / skill.cast) * (1 + g(t, 'castInc'));
  const castsCd = skill.cd ? Math.min(casts, 1 / skill.cd) : casts;
  // Ignite: the strongest ignite applies, 90% of the fire part over 4s, kept up if you re-apply often enough.
  const ign = Math.min(1, g(t, 'igniteChance') * castsCd * 4) * (types.fire || 0) * .9 / 4 * (1 + g(t, 'ailmentInc'));
  const shockUp = Math.min(1, g(t, 'shockChance') * castsCd * 3), shock = 1 + .2 * shockUp;
  const dps = (hit * critFactor * castsCd + ign) * shock;
  const cost = skill.cost * (1 + skill.costGrowth) ** (sl - 1) * (1 + g(t, 'manaCostInc'));
  return { types, hit, critChance, critMulti, critFactor, casts: castsCd, dps, cost, manaPerSec: cost * castsCd };
}

// ---------- Monsters ----------
// A monster of archetype `arch` at level L with rarity `rar` (and optional list of rare mod ids, and waystone multipliers wm).
export function monsterAt(arch, L, rar = 'normal', mods = [], wm = {}) {
  const r = MRARITY[rar];
  let life = grow(SCALE.life, L) * arch.life * r.life * (wm.life || 1);
  let dmg = grow(SCALE.dmg, L) * arch.dmg * r.dmg * (wm.dmg || 1);
  let rate = (arch.cd ? 1 / arch.cd : SCALE.attackRate);
  const type = { ...arch.type };
  for (const id of mods) {
    const m = RARE_MODS[id];
    life *= (m.life || 1) * (m.lifeEquiv || 1) / (m.dmgTaken || 1);
    dmg *= m.dmg || 1; rate *= m.attackRate || 1;
    for (const [k, v] of Object.entries(m.addDmg || {})) type[k] = (type[k] || 0) + v;
  }
  const hit = {}; for (const [k, v] of Object.entries(type)) hit[k] = dmg * v;
  return { life, hit, rate, xp: grow(SCALE.xp, L) * (arch.xp || 1) * r.xp, accuracy: grow(SCALE.accuracy, L), attack: ['melee', 'ranged', 'blocker', 'leaper'].includes(arch.ai) };
}

// ---------- Taking hits ----------
// Damage the player takes from one hit { phys, fire, ... } given playerStats `ps`.
export function damageTaken(hit, ps) {
  let total = 0;
  for (const [type, v] of Object.entries(hit)) {
    if (type === 'phys') total += v * (1 - Math.min(BASE.armourCap, ps.armour / (ps.armour + BASE.armourK * v || 1)));
    else total += v * (1 - (ps.res[type] || 0));
  }
  return total * ps.lessTaken;
}
export const evadeChance = (ps, accuracy) => Math.min(BASE.evadeCap, ps.evasion / (ps.evasion + BASE.evadeK * accuracy || 1));
// How many of this monster's swings it takes to kill you (counting evasion and block as swings that miss).
export function hitsToDie(mon, ps) {
  const per = damageTaken(mon.hit, ps), avoid = (mon.attack ? evadeChance(ps, mon.accuracy) : 0);
  const land = (1 - avoid) * (1 - ps.block);
  return ps.life / (per * land || 1e-9);
}
