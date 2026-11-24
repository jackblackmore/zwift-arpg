// Pure balance maths: hero stats, item roll scaling, monster scaling, expected damage.
// Imports only data, so the game, `npm run balance` (Node) and the arena all share one set of formulas.
import { TREE, TREE_START, TREE_CAP } from '../data/tree.js';
import { HERO, RARITY, START_WEAPON, GEAR_PROFILES, AFFIX_PRIORITY, XP_CURVE, ITEM_SCALE, ESTIMATE, DEFENCE } from '../data/balance.js';
import { MT, TIER, PACK, LEAN, DMG_TYPES } from '../data/monsters.js';
import { SLOTS, BASES, IMPL, IMPL_FIXED, AFF } from '../data/items.js';
import { GEMS, GEM, SUPPORTS, supFits, FEED } from '../data/gems.js';
import { SURGE, SK } from '../data/skills.js';
import { RIDE } from '../data/ride.js';

// Item level scaling of rolled values (flat and percent affixes).
export const flatScale = il => 1 + ITEM_SCALE.flat * (il - 1), pctScale = il => 1 + ITEM_SCALE.pct * (il - 1);

// Base damage of a skill gem at a level (before flat spell damage from gear).
export const gemBase = (lvl = 1) => GEM.base * Math.pow(GEM.grow, Math.min(GEM.cap, lvl) - 1);
// Level 5 milestones (data/gems.js GEMS[id].mile): `add` goes into that gem's own copy of the raw stat sums; the skill's own
// code reads the other fields when S.mile[gemId] is true (that gem is on the bar at its milestone level).
const MILE_LVL = 5;

// Derived stats from gear, the passive tree (allocated node ids, data/tree.js), character level, the gems on the skill bar
// ({ gemId: level }) and their supports ({ gemId: [supportId, ...] }, only supports that fit). st.gems[id] is each bar gem's base
// damage; skills not on the bar (free casts from uniques) use level 1.
// st.sk[gemId] holds each skill's own behaviour stats (chains, flags from supports, `more` damage):
// gear and the tree feed every skill, a milestone or support only its own gem. Every skill gem has an entry.
// st.fight: the tree's shield and timing numbers (game/sk/guard.js, roll.js, combat.js); st.ks: keystones taken (id → its numbers).
export function computeStats(gear, tree = [], lvl = 1, gems = {}, socks = {}) {
  const s = { lifeF: 0, lifePct: 0, lregen: 0, surge: 0, surgeRe: 0, dmg: 0, fire: 0, cold: 0, light: 0, cast: 0, ms: 0, crit: 0, aoe: 0, chains: 0, lok: 0, spell: 0, dashCh: 0, shieldPct: 0, freeze: 0, dr: 0, novaR: 0,
    ch: 0, dur: 0, more: 1, flask: 0, block: 0, heavy: 0, posture: 0, drain: 0, parry: 0, riposte: 0, stagger: 0, finisher: 0, evadeInv: 0, evadeCh: 0,
    armour: 0, armourPct: 0, resFire: 0, resCold: 0, resLight: 0, resPoison: 0, resElem: 0, resAll: 0 };
  for (const k in gear) { const it = gear[k]; if (it) for (const [st, v] of it.mods) s[st] = (s[st] || 0) + v; }
  const ks = {};
  for (const id of tree) { const N = TREE[id]; if (!N) continue; if (N.kind === 'key') ks[id] = N.v; else N.fn(s, N.v); }
  const H = HERO, l = lvl - 1, sk = {};
  // Defence: armour (flat from gear × increased from the tree) and a resistance per damage type (DEFENCE.resCap at most; resRaw uncapped).
  const resRaw = { fire: s.resFire + s.resElem + s.resAll, cold: s.resCold + s.resElem + s.resAll, light: s.resLight + s.resElem + s.resAll, poison: s.resPoison + s.resAll };
  const res = Object.fromEntries(Object.entries(resRaw).map(([k, v]) => [k, Math.min(DEFENCE.resCap, v)]));
  for (const id in GEMS) {
    const t = { ...s };
    const M = GEMS[id].mile; if (gems[id] >= MILE_LVL && M && M.add) for (const k in M.add) t[k] += M.add[k];
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
    lregen: H.lregen + s.lregen, spell: H.spell + H.spellPer * l + s.spell, gems: Object.fromEntries(Object.entries(gems).map(([id, g]) => [id, gemBase(g)])), mile: Object.fromEntries(Object.entries(gems).filter(([, g]) => g >= MILE_LVL).map(([id]) => [id, true])), dmg: 1 + s.dmg, fire: s.fire, cold: s.cold, light: s.light,
    cast: 1 + s.cast, ms: H.ms * (1 + s.ms), crit: H.crit + s.crit, aoe: 1 + s.aoe, lok: s.lok, loh: H.lifeOnHit + (s.loh || 0), sk,
    armour: Math.round(s.armour * (1 + s.armourPct)), res, resRaw,
    freeze: 1 + s.freeze, dr: Math.min(.6, s.dr), storm: !!s.storm, autoNova: !!s.autoNova, flask: 1 + s.flask, ks,
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

// The implicit mods of a slot's base at an item level (data/items.js IMPL).
export const implMods = (slot, il = 1) => IMPL[slot].map(([st, v]) => [st, IMPL_FIXED.includes(st) ? v : Math.round(v * flatScale(il))]);

// A deterministic kit for the balance tools: every slot with average rolls of the best affixes (data/balance.js).
export function gearProfile(kind, il = 1) {
  const P = GEAR_PROFILES[kind]; if (!P) throw new Error('unknown gear profile ' + kind);
  if (!P.n) return { weapon: { ...START_WEAPON, mods: START_WEAPON.mods.map(m => [...m]) } };
  const gear = {};
  const avg = (st, il) => { const a = AFF.find(x => x.st === st), v = (a.a + a.b) / 2 * (a.pct ? pctScale(il) : flatScale(il)); return [st, a.pct ? Math.round(v * 100) / 100 : a.dec ? Math.round(v * 10) / 10 : Math.round(v)]; };
  for (const slot of SLOTS) {
    const mods = implMods(slot, il), impl = mods.length;
    for (const st of AFFIX_PRIORITY) {
      if (mods.length - impl >= P.n) break;
      const a = AFF.find(x => x.st === st); if (!a || (a.slots && !a.slots.includes(slot))) continue;
      mods.push(avg(st, il));
    }
    if (P.res && P.res[slot]) mods.push(avg(P.res[slot], il)); // a resistance on top (GEAR_PROFILES res)
    gear[slot] = { slot, rar: P.rar, base: BASES[slot][0], name: `${kind} ${slot}`, il, impl, mods };
  }
  return gear;
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
