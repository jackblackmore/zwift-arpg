// Pure balance maths: hero stats, item roll scaling, monster scaling, expected damage.
// Imports only data, so the game, `npm run balance` (Node) and the arena all share one set of formulas.
import { TREE, TREE_START, TREE_CAP } from '../data/tree.js';
import { HERO, RARITY, START_WEAPON, GEAR_PROFILES, XP_CURVE, ITEM_SCALE, ESTIMATE, DEFENCE, PAR_MAIN, PAR_GEAR, parLevel, parGem, parSock, parTree } from '../data/balance.js';
import { MT, TIER, PACK, LEAN, DMG_TYPES, RARE, BLAST, BOSS, ELITE } from '../data/monsters.js';
import { SLOTS, BASE, BASES, IMPL_FIXED, AFF, AFFBY, EXTRA } from '../data/items.js';
import { GEMS, GEM, SUPPORTS, supFits, FEED } from '../data/gems.js';
import { SURGE, SK } from '../data/skills.js';
import { RIDE } from '../data/ride.js';

// Item level scaling of rolled values (flat and percent affixes).
export const flatScale = il => 1 + ITEM_SCALE.flat * (il - 1), pctScale = il => 1 + ITEM_SCALE.pct * (il - 1);

// Base damage of a skill gem at a level (before flat spell damage from gear). plus: levels from gear, which go past the cap.
export const gemBase = (lvl = 1, plus = 0) => GEM.base * Math.pow(GEM.grow, Math.min(GEM.cap, lvl) + plus - 1);
// Level 5 milestones (data/gems.js GEMS[id].mile): `add` goes into that gem's own copy of the raw stat sums; the skill's own
// code reads the other fields when S.mile[gemId] is true (that gem is on the bar at its milestone level).
const MILE_LVL = 5;

// Derived stats from gear, the passive tree (allocated node ids, data/tree.js), character level, the gems on the skill bar
// ({ gemId: level }) and their supports ({ gemId: [supportId, ...] }, only supports that fit). st.gems[id] is each bar gem's base
// damage; skills not on the bar (free casts from uniques) use level 1.
// st.sk[gemId] holds each skill's own behaviour stats (chains, flags from supports, `more` damage):
// gear and the tree feed every skill, a milestone or support only its own gem. Every skill gem has an entry.
// st.fight: the tree's shield and timing numbers (game/sk/guard.js, roll.js, combat.js); st.ks: keystones taken (id → its numbers).
// slots ({ slot: gemId }, the bar): which gem gets gear's +gem levels (gemMain, gemFlex); st.gemPlus[id] is what gear adds to a gem
// (on top of its own level, past the cap too) and st.gemLv[id] the level it counts as (base damage and milestones).
// Rule mods from uniques (data/items.js EXTRA flags) are true/false on st (st.storm, st.parryNova, ...).
export function computeStats(gear, tree = [], lvl = 1, gems = {}, socks = {}, slots = {}) {
  const s = { lifeF: 0, lifePct: 0, lregen: 0, surge: 0, surgeRe: 0, dmg: 0, fire: 0, cold: 0, light: 0, cast: 0, ms: 0, crit: 0, aoe: 0, chains: 0, lok: 0, spell: 0, dashCh: 0, shieldPct: 0, freeze: 0, dr: 0, novaR: 0,
    ch: 0, dur: 0, more: 1, flask: 0, block: 0, heavy: 0, posture: 0, drain: 0, parry: 0, riposte: 0, stagger: 0, finisher: 0, evadeInv: 0, evadeCh: 0,
    armour: 0, armourPct: 0, resFire: 0, resCold: 0, resLight: 0, resPoison: 0, resElem: 0, resAll: 0 };
  for (const k in gear) { const it = gear[k]; if (it) for (const [st, v] of it.mods) s[st] = (s[st] || 0) + v; }
  const ks = {}, plus = {};
  for (const [sl, id] of Object.entries(slots)) if (id && gems[id] !== undefined) plus[id] = Math.max(plus[id] || 0, sl === 'main' ? s.gemMain || 0 : sl === 'flexA' || sl === 'flexB' ? s.gemFlex || 0 : 0);
  const gemLv = Object.fromEntries(Object.entries(gems).map(([id, g]) => [id, Math.min(GEM.cap, g) + (plus[id] || 0)]));
  for (const id of tree) { const N = TREE[id]; if (!N) continue; if (N.kind === 'key') ks[id] = N.v; else N.fn(s, N.v); }
  const H = HERO, l = lvl - 1, sk = {};
  // Defence: armour (flat from gear × increased from the tree) and a resistance per damage type (DEFENCE.resCap at most; resRaw uncapped).
  const resRaw = { fire: s.resFire + s.resElem + s.resAll, cold: s.resCold + s.resElem + s.resAll, light: s.resLight + s.resElem + s.resAll, poison: s.resPoison + s.resAll };
  const res = Object.fromEntries(Object.entries(resRaw).map(([k, v]) => [k, Math.min(DEFENCE.resCap, v)]));
  for (const id in GEMS) {
    const t = { ...s };
    const M = GEMS[id].mile; if (gemLv[id] >= MILE_LVL && M && M.add) for (const k in M.add) t[k] += M.add[k];
    for (const sup of socks[id] || []) if (supFits(sup, id)) SUPPORTS[sup].fn(t, SUPPORTS[sup]);
    sk[id] = {
      chains: H.chains + t.chains, novaR: 1 + t.novaR, shieldMul: 1 + t.shieldPct, ch: t.ch + (id === 'dash' ? t.dashCh : 0) + (GEMS[id].kind === 'evade' ? t.evadeCh : 0),
      dur: 1 + t.dur, more: t.more, ignite: !!t.ignite, shatter: !!t.shatter, conduit: !!t.conduit, volley: !!t.volley, twin: !!t.twin,
      sweep: !!t.sweep, brittle: !!t.brittle, aftershock: !!t.aftershock, raise: !!t.raise,
      burnGround: !!GEMS[id].melee && !!t.burnGround, sup: (socks[id] || []).filter(x => supFits(x, id)),
    };
  }
  return {
    maxLife: Math.max(20, Math.round((H.life + H.lifePer * l + s.lifeF) * (1 + s.lifePct))), surgeMax: SURGE.max * (1 + s.surge), surgeRe: SURGE.refill * (1 + s.surgeRe),
    lregen: H.lregen + s.lregen, spell: H.spell + H.spellPer * l + s.spell, gems: Object.fromEntries(Object.entries(gems).map(([id, g]) => [id, gemBase(g, plus[id] || 0)])), gemLv, gemPlus: plus, mile: Object.fromEntries(Object.entries(gemLv).filter(([, g]) => g >= MILE_LVL).map(([id]) => [id, true])), dmg: 1 + s.dmg, fire: s.fire, cold: s.cold, light: s.light,
    cast: 1 + s.cast, ms: H.ms * (1 + s.ms), crit: H.crit + s.crit, aoe: 1 + s.aoe, lok: s.lok, loh: H.lifeOnHit + (s.loh || 0), sk,
    armour: Math.round(s.armour * (1 + s.armourPct)), res, resRaw,
    freeze: 1 + s.freeze, dr: Math.min(.6, s.dr), flask: 1 + s.flask, ks, sockMain: s.sockMain || 0,
    ...Object.fromEntries(Object.keys(EXTRA).filter(k => EXTRA[k].flag).map(k => [k, !!s[k]])),
    fight: { block: s.block, heavy: s.heavy, posture: Math.min(TREE_CAP.posture, s.posture), drain: 1 + s.drain, parry: 1 + s.parry, riposte: 1 + s.riposte,
      stagger: 1 + s.stagger, finisher: 1 + s.finisher, evadeInv: 1 + s.evadeInv },
  };
}

// ---- the passive tree's graph (data/tree.js): links go both ways; the start node is always held ----
export const TREE_ADJ = (() => { const a = {}; for (const id in TREE) a[id] = a[id] || new Set(); for (const id in TREE) for (const l of TREE[id].links) { a[id].add(l); (a[l] = a[l] || new Set()).add(id); } return a; })();
// Is every node in `list` joined to the start through nodes in the list?
export function treeConnected(list) {
  const have = new Set(list), seen = new Set([TREE_START]), q = [TREE_START];
  while (q.length) for (const n of TREE_ADJ[q.pop()]) if (have.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
  return list.every(id => seen.has(id));
}
// Can `id` be taken next (a neighbour is held) / given back (the rest stays joined to the start)?
export const treeCanTake = (list, id) => !!TREE[id] && id !== TREE_START && !list.includes(id) && [...TREE_ADJ[id]].some(n => n === TREE_START || list.includes(n));
export const treeCanDrop = (list, id) => list.includes(id) && treeConnected(list.filter(x => x !== id));
// Tree points at a character level: one per level after the first.
export const treePoints = lvl => Math.max(0, lvl - 1);

// Base of a hit from a gem: the gem's base damage plus flat spell damage from gear.
export const hitBase = (st, gem) => (st.gems[gem] ?? gemBase(1)) + st.spell;
// Average hit of a skill (mult × base of an element), crits included.
// `more` from the skill's supports multiplies it.
export const avgHit = (st, mult, elem, gem = 'cleave') => hitBase(st, gem) * mult * (st.dmg + (st[elem] || 0)) * (1 + st.crit * (HERO.critMult - 1)) * ((st.sk && st.sk[gem] && st.sk[gem].more) || 1);

// A gem's hits per second (cast speed only; effort and Surge on top) and damage per swing on one target and on a clumped pack.
// Melee: ESTIMATE.targets monsters per swing (Sweep hits more); Aftershock adds its echo; Ignite adds its burn. Used by the bag
// estimate (game/stats.js) and the maths report (scripts/balance.mjs).
export function gemDps(st, id) {
  const D = GEMS[id], K = SK[D.sk], k = st.sk[id], rate = D.held ? st.cast / K.cast : 1 / K.cd;
  let one = avgHit(st, K.mult || 1, D.elem, id), n = 1;
  if (D.melee) {
    n = ESTIMATE.targets[id] * (k.sweep ? ESTIMATE.sweep : 1);
    if (k.aftershock) one *= 1 + SUPPORTS.aftershock.mult;
    if (k.brittle) one *= 1 + SUPPORTS.brittle.taken * .5; // about half its hits land on an already-brittle target
    const M = D.mile; if (st.mile && st.mile[id] && M.every && M.mult) one *= 1 + (M.mult - 1) / M.every; // the Sword's heavy cut
  } else if (id === 'arc') n = 1 + k.chains * ESTIMATE.perChain;
  if (k.ignite) one *= 1 + SUPPORTS.ignite.share;
  return { rate, one, pack: one * n, dps: one * rate, packDps: one * n * rate };
}

// Monster life and damage multipliers at a map tier.
export const tierHp = t => t <= TIER.hp.length ? TIER.hp[t - 1] : TIER.hp[TIER.hp.length - 1] + TIER.hpAfter * (t - TIER.hp.length);
export const tierDmg = t => t <= TIER.dmg.length ? TIER.dmg[t - 1] : TIER.dmg[TIER.dmg.length - 1] + TIER.dmgAfter * (t - TIER.dmg.length);

// Monster stats at a map tier and rarity (0 normal, 1 magic, 2 rare; affixes handled by the spawner). dt: its attacks' damage type.
export function monsterStats(type, tier, rar = 0) {
  const b = MT[type], R = rar === 2 ? RARITY.rare : rar === 1 ? RARITY.magic : { hp: 1, dmg: 1, spd: 1 };
  return { hp: b.hp * tierHp(tier) * R.hp, dmg: b.dmg * tierDmg(tier) * R.dmg, spd: b.spd * (R.spd || 1), dt: dmgType(b.dt, tier) };
}

// ---- Defence (design notes "Defence"; numbers in data/balance.js DEFENCE, monster types in data/monsters.js) ----
// A hit's damage type is a type id (DMG_TYPES: phys, fire, cold, light, poison) or a mix { type: share } whose shares add to 1.
export const typeMix = (t = 'phys') => typeof t === 'string' ? { [t]: 1 } : t;
// The biggest share of a mix (what the hit counts as: its colour, and whether a block treats it as elemental).
export const mainType = t => { const m = typeMix(t); let best = 'phys', b = -1; for (const k in m) if (m[k] > b) { b = m[k]; best = k; } return best; };
export const isElem = t => { const k = mainType(t); return k === 'fire' || k === 'cold' || k === 'light'; };
// The damage type of an attack whose own type is `base` (default physical) on map tier t: the region's lean (LEAN) turns a share
// of physical attacks into its element; typed attacks keep their type.
export const leanAt = t => (LEAN.find(L => t >= L.tiers[0] && t <= L.tiers[1]) || {}).mix || {};
export function dmgType(base = 'phys', tier = 1) {
  if (base !== 'phys') return base;
  const L = leanAt(tier), ks = Object.keys(L).filter(k => DMG_TYPES[k] && L[k] > 0); if (!ks.length) return 'phys';
  const mix = { phys: 1 }; for (const k of ks) { mix[k] = L[k]; mix.phys -= L[k]; } return mix;
}
// Armour's cut of a physical hit of d: A / (A + armourK × d), at most armourCap. Bigger hits are cut less.
export const armourCut = (A, d) => A > 0 && d > 0 ? Math.min(DEFENCE.armourCap, A / (A + DEFENCE.armourK * d)) : 0;
// What's left of a hit of d (type t, see typeMix) after armour and resistances. Each part of a mix is cut on its own: the physical
// part by armour (judged on that part's size as it arrives), the rest by the matching resistance. In the game (game/combat.js hurtP)
// the shield comes first (parry, block or a broken guard, its posture from the full hit), then this share of what the shield let
// through (armour still judged on the full hit, so blocking a big hit doesn't make armour better against it), then less damage
// taken (dr), then Magic Shield's barrier, then life.
export function defended(st, d, t = 'phys') {
  const m = typeMix(t); let out = 0;
  for (const k in m) { const part = d * m[k]; out += k === 'phys' ? part * (1 - armourCut(st.armour || 0, part)) : part * (1 - ((st.res && st.res[k]) || 0)); }
  return out;
}
// Damage a hit of d (type t) does to your life when nothing blocks it and no barrier is up: armour and resistances, then less damage taken.
export const hitTaken = (st, d, t = 'phys') => defended(st, d, t) * (1 - (st.dr || 0));

// The implicit mods of a base at an item level (data/items.js BASE). A slot name instead of a base gives that slot's first base.
export const implMods = (base, il = 1) => (BASE[base] || BASE[BASES[base][0]]).impl.map(([st, v]) => [st, IMPL_FIXED.includes(st) ? v : Math.round(v * flatScale(il))]);
// An affix's value at an item level: `at` 0 is its lowest roll, 1 its highest, .5 the average (the tools' par gear).
export function affixValue(st, il = 1, at = .5) {
  const a = AFFBY[st], v = (a.a + (a.b - a.a) * at) * (a.pct ? pctScale(il) : flatScale(il));
  return a.int ? Math.max(1, Math.round(a.a === a.b ? a.a : v)) : a.pct ? Math.round(v * 100) / 100 : a.dec ? Math.round(v * 10) / 10 : Math.round(v);
}

// A deterministic kit for the balance tools (data/balance.js GEAR_PROFILES): each slot is its profile's base with its implicits,
// plus the profile's affixes at average rolls.
export function gearProfile(kind, il = 1) {
  const P = GEAR_PROFILES[kind]; if (!P) throw new Error('unknown gear profile ' + kind);
  if (!P.affixes) return { weapon: { ...START_WEAPON, mods: START_WEAPON.mods.map(m => [...m]) } };
  const gear = {};
  for (const slot of SLOTS) {
    const base = (P.base && P.base[slot]) || BASES[slot][0], mods = implMods(base, il), impl = mods.length;
    for (const st of P.affixes[slot] || []) mods.push([st, affixValue(st, il)]);
    gear[slot] = { slot, rar: P.rar, base, name: `${kind} ${slot}`, il, impl, mods };
  }
  return gear;
}

// Effective life (the bag's upgrade check and the maths report): max life divided by the share of damage that gets through
// armour and resistances, over a typical spread of the hits that reach your life on map tier t (ESTIMATE.threat in
// data/balance.js: each entry a monster attack, its damage type at that tier and its weight in what you take). So a
// resistance only counts for the share of damage of its type, and armour counts more against small hits than big ones.
// atk: which attack of the monster (none: its normal hit; heavy: a rare's heavy swing; slam, nova: the guardian's; blast: a bloater's
// death blast; burning: a burning rare's pulse).
const ATK = { heavy: [() => RARE.heavy.dmg, null], slam: [() => BOSS.slamDmg, () => BOSS.dt.slam], nova: [() => BOSS.novaDmg, () => BOSS.dt.nova], blast: [() => BLAST.bloater.dmg, () => BLAST.bloater.dt] };
export function threatMix(t = 1) {
  return ESTIMATE.threat.map(T => {
    if (T.atk === 'burning') return { d: RARE.burning.dmg * tierDmg(t), dt: dmgType(RARE.burning.dt, t), w: T.w };
    const m = monsterStats(T.mon, t, T.rar || 0), A = ATK[T.atk];
    return { d: m.dmg * (A ? A[0]() : 1), dt: A && A[1] ? dmgType(A[1](), t) : m.dt, w: T.w };
  });
}
export function ehp(st, t = 1) {
  let raw = 0, got = 0;
  for (const h of threatMix(t)) { raw += h.w; got += h.w * hitTaken(st, h.d, h.dt) / h.d; }
  return st.maxLife * raw / Math.max(1e-6, got);
}
// How much better stats st is than st0 for a hero on tier t, as one number (1 = the same): the Main gem's pack DPS and effective
// life multiplied together, each to its weight (ESTIMATE.value), and move speed a little. The bag marks an item an upgrade above
// ESTIMATE.value.upgrade. main: the Main gem's id.
export function gearValue(st, st0, main, t = 1) {
  const V = ESTIMATE.value, d = gemDps(st, main).packDps / gemDps(st0, main).packDps, e = ehp(st, t) / ehp(st0, t), m = st.ms / st0.ms;
  return Math.pow(d, V.dps) * Math.pow(e, V.ehp) * Math.pow(m, V.ms);
}

// ---- The par hero and power per system (npm run balance, npm test; design notes "Balance") ----
// Stats of the par hero on tier t with Main gem `main` (its par gem level, support and tree preset, data/balance.js), unless o says
// otherwise: o.lvl (character level), o.gem (Main gem level), o.gear (a GEAR_PROFILES name or a gear object), o.tree (node list),
// o.socks (false: no support).
export function parStats(t, main = PAR_MAIN, o = {}) {
  const lvl = o.lvl ?? parLevel(t), gear = typeof o.gear === 'object' ? o.gear : gearProfile(o.gear || PAR_GEAR(t), t);
  return computeStats(gear, o.tree ?? parTree(lvl, main), lvl, { [main]: o.gem ?? parGem(t) }, { [main]: o.socks === false ? [] : parSock(t, main).main || [] }, { main });
}
// One number for how strong a hero is on tier t: the Main gem's pack DPS × effective life (ehp), each to its ESTIMATE.value weight.
// Ratios of it (power(a) / power(b)) say how much a drop, a gem level or a tree point is worth.
export const power = (st, main, t) => Math.pow(gemDps(st, main).packDps, ESTIMATE.value.dps) * Math.pow(ehp(st, t), ESTIMATE.value.ehp);
// An elite (data/monsters.js ELITE) of `type` on tier t: a rare's stats × the elite's multipliers. Its fortified affix is left out
// (like the report's rare); minions in eliteRoomHp.
export function eliteStats(type, t) { const m = monsterStats(type, t, 2); return { ...m, hp: m.hp * ELITE.hp, dmg: m.dmg * ELITE.dmg }; }
export function eliteRoomHp(t) { const sz = 1 + TIER.packSize * (t - 1); return ELITE.minions.reduce((a, [ty, c]) => a + Math.round(c * sz) * monsterStats(ty, t).hp * (1 + ELITE.magic * (RARITY.magic.hp - 1)), 0); }
// What each system adds at tier t's par (Main gem `main`), as power ratios (1.05 = 5% stronger):
//   drop: one magic item at this tier's item level in place of a plain one (implicits only), the mean over slots;
//   tierDrop: one item from this tier's par kit in place of last tier's, the mean over slots (the sawtooth, one drop at a time);
//   gemLevel: the Main gem's last level (par gem level against one less; level 2 against 1 on tier 1);
//   treePoint: one point of the par preset (the mean per point of the preset's nodes at this level; 1 when there are none);
//   charLevel: one character level's life alone (the tree point it brings is treePoint).
export function powerSteps(t, main = PAR_MAIN) {
  const st = parStats(t, main), p0 = power(st, main, t), lvl = parLevel(t), kit = gearProfile('magic', t), plain = gearProfile('magic', t), last = gearProfile('magic', Math.max(1, t - 1));
  for (const sl in plain) plain[sl] = { ...plain[sl], mods: plain[sl].mods.slice(0, plain[sl].impl) };
  const pk = g => power(parStats(t, main, { gear: g }), main, t), slots = Object.keys(kit), mk = (base, sl, it) => ({ ...base, [sl]: it });
  const drop = slots.reduce((a, sl) => a + pk(mk(plain, sl, kit[sl])) / pk(plain), 0) / slots.length;
  const tierDrop = t > 1 ? slots.reduce((a, sl) => a + pk(mk(last, sl, kit[sl])) / pk(last), 0) / slots.length : 1;
  const g = Math.max(2, parGem(t)), gemLevel = power(parStats(t, main, { gem: g, gear: kit }), main, t) / power(parStats(t, main, { gem: g - 1, gear: kit }), main, t);
  const tree = parTree(lvl, main), none = power(parStats(t, main, { tree: [], gear: kit }), main, t), full = power(parStats(t, main, { gear: kit }), main, t);
  const treePoint = tree.length ? Math.pow(full / none, 1 / tree.length) : 1;
  const charLevel = ehp(parStats(t, main, { gear: kit, lvl: lvl + 1, tree }), t) / ehp(parStats(t, main, { gear: kit, tree }), t);
  return { p0, drop, tierDrop, gemLevel, treePoint, charLevel };
}

// Experience needed to go from level l to l + 1, and packs placed on a map of tier t.
export const xpNeedFor = l => Math.round(XP_CURVE.base * Math.pow(l, XP_CURVE.exp));
export const packCount = t => Math.min(PACK.count[2], PACK.count[0] + PACK.count[1] * t);

// Gem XP (AP): everything a gem has earned, from level 1. Feeding moves a share of it (data/gems.js FEED).
export const gemTotalXp = g => { let n = g.xp || 0; for (let l = 1; l < g.lvl; l++) n += xpNeedFor(l); return n; };
// Share of the fed gem's XP that reaches the target: same gem, same kind, or anything else; a maxed gem fed into the same gem gives more.
export function feedShare(food, into, cap = GEM.cap) {
  const a = GEMS[food.gem] || SUPPORTS[food.gem], b = GEMS[into.gem] || SUPPORTS[into.gem];
  const base = food.gem === into.gem ? FEED.same : a.kind === b.kind ? FEED.kind : FEED.other;
  return base + (food.gem === into.gem && food.lvl >= cap ? FEED.mastery : 0);
}

// RIDE mode: walking speed multiplier at `rel` of FTP (data/ride.js RIDE.move): nothing below `stop`, full at `full`, capped.
export const rideMove = rel => { const M = RIDE.move; return rel < M.stop ? 0 : rel < M.full ? (rel - M.stop) / (M.full - M.stop) : Math.min(M.max, 1 + (rel - M.full) * .5); };
