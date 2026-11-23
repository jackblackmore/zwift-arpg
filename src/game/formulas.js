// Pure balance maths: hero stats, item roll scaling, monster scaling, expected damage.
// Imports only data, so the game, `npm run balance` (Node) and the arena all share one set of formulas.
import { PASS } from '../data/passives.js';
import { HERO, RARITY, START_WEAPON, GEAR_PROFILES, AFFIX_PRIORITY } from '../data/balance.js';
import { MT, TIER, PACK } from '../data/monsters.js';
import { SLOTS, BASES, IMPL, AFF } from '../data/items.js';
import { GEMS, GEM, SUPPORTS, supFits, FEED } from '../data/gems.js';

// Item level scaling of rolled values (flat and percent affixes).
export const flatScale = il => 1 + .22 * (il - 1), pctScale = il => 1 + .07 * (il - 1);

// Base damage of a skill gem at a level (before flat spell damage from gear).
export const gemBase = (lvl = 1) => GEM.base * Math.pow(GEM.grow, Math.min(GEM.cap, lvl) - 1);
// Level 5 milestones, added to that gem's own copy of the raw stat sums. Newer gems skip this table and
// read S.mile[gemId] (true when that gem is on the bar at its milestone level) in their own code.
const MILESTONES = { fireball: s => s.pierce += 1, arc: s => s.chains += 2, nova: s => s.novaR += .25, shield: s => s.shieldPct += .25, dash: s => s.dashCh += 1 };

// Derived stats from gear, passives, character level, the gems on the skill bar ({ gemId: level }) and their supports
// ({ gemId: [supportId, ...] }, only supports that fit). st.gems[id] is each bar gem's base damage; skills not on the bar
// (free casts from uniques) use level 1.
// st.sk[gemId] holds each skill's own behaviour stats (projectiles, chains, pierce, flags from supports, `more` damage):
// gear and passives feed every skill, a milestone or support only its own gem. Every skill gem has an entry.
export function computeStats(gear, passives = {}, lvl = 1, gems = {}, socks = {}) {
  const s = { lifeF: 0, lifePct: 0, manaF: 0, lregen: 0, mregen: 0, dmg: 0, fire: 0, cold: 0, light: 0, cast: 0, ms: 0, crit: 0, aoe: 0, proj: 0, chains: 0, lok: 0, mok: 0, spell: 0, pierce: 0, dashCh: 0, shieldPct: 0, freeze: 0, dr: 0, novaR: 0,
    ch: 0, army: 0, dur: 0, more: 1 };
  for (const k in gear) { const it = gear[k]; if (it) for (const [st, v] of it.mods) s[st] = (s[st] || 0) + v; }
  for (const id in passives) if (PASS[id]) PASS[id].fn(s, passives[id]);
  const H = HERO, l = lvl - 1, sk = {};
  for (const id in GEMS) {
    const t = { ...s };
    if (gems[id] >= 5 && MILESTONES[id]) MILESTONES[id](t);
    for (const sup of socks[id] || []) if (supFits(sup, id)) SUPPORTS[sup].fn(t);
    sk[id] = {
      proj: 1 + t.proj, pierce: t.pierce, chains: H.chains + t.chains, novaR: 1 + t.novaR, shieldMul: 1 + t.shieldPct, ch: t.ch + (id === 'dash' ? t.dashCh : 0),
      army: t.army, dur: 1 + t.dur, more: t.more, ignite: !!t.ignite, shatter: !!t.shatter, conduit: !!t.conduit, chainboom: !!t.chainboom, split: !!t.split, volley: !!t.volley, twin: !!t.twin,
      burnGround: id === 'fireball' && !!t.burnGround, sup: (socks[id] || []).filter(x => supFits(x, id)),
    };
  }
  return {
    maxLife: Math.max(20, Math.round((H.life + H.lifePer * l + s.lifeF) * (1 + s.lifePct))), maxMana: Math.round(H.mana + H.manaPer * l + s.manaF),
    lregen: H.lregen + s.lregen, mregen: H.mregen + s.mregen, spell: H.spell + H.spellPer * l + s.spell, gems: Object.fromEntries(Object.entries(gems).map(([id, g]) => [id, gemBase(g)])), mile: Object.fromEntries(Object.entries(gems).filter(([, g]) => g >= 5).map(([id]) => [id, true])), dmg: 1 + s.dmg, fire: s.fire, cold: s.cold, light: s.light,
    cast: 1 + s.cast, ms: H.ms * (1 + s.ms), crit: H.crit + s.crit, aoe: 1 + s.aoe, lok: s.lok, mok: s.mok, sk,
    freeze: 1 + s.freeze, dr: Math.min(.6, s.dr), blood: !!s.blood, storm: !!s.storm, autoNova: !!s.autoNova,
  };
}

// Base of a hit from a gem: the gem's base damage plus flat spell damage from gear.
export const hitBase = (st, gem) => (st.gems[gem] ?? gemBase(1)) + st.spell;
// Average hit of a skill (mult × base of an element), crits included.
// `more` from the skill's supports multiplies it.
export const avgHit = (st, mult, elem, gem = 'fireball') => hitBase(st, gem) * mult * (st.dmg + (st[elem] || 0)) * (1 + st.crit * (HERO.critMult - 1)) * ((st.sk && st.sk[gem] && st.sk[gem].more) || 1);

// Monster life multiplier at a map tier.
export const tierHp = t => t <= TIER.hp.length ? TIER.hp[t - 1] : TIER.hp[TIER.hp.length - 1] + TIER.hpAfter * (t - TIER.hp.length);

// Monster stats at a map tier and rarity (0 normal, 1 magic, 2 rare; affixes handled by the spawner).
export function monsterStats(type, tier, rar = 0) {
  const b = MT[type], R = rar === 2 ? RARITY.rare : rar === 1 ? RARITY.magic : { hp: 1, dmg: 1, spd: 1 };
  return { hp: b.hp * tierHp(tier) * R.hp, dmg: b.dmg * (1 + TIER.dmg * (tier - 1)) * R.dmg, spd: b.spd * (R.spd || 1) };
}

// A deterministic kit for the balance tools: every slot with average rolls of the best affixes (data/balance.js).
export function gearProfile(kind, il = 1) {
  const P = GEAR_PROFILES[kind]; if (!P) throw new Error('unknown gear profile ' + kind);
  if (!P.n) return { weapon: { ...START_WEAPON, mods: START_WEAPON.mods.map(m => [...m]) } };
  const gear = {};
  for (const slot of SLOTS) {
    const [ist, iv] = IMPL[slot], mods = [[ist, ist === 'ms' || ist === 'dmg' ? iv : Math.round(iv * flatScale(il))]];
    for (const st of AFFIX_PRIORITY) {
      if (mods.length > P.n) break;
      const a = AFF.find(x => x.st === st); if (!a || (a.slots && !a.slots.includes(slot))) continue;
      const v = (a.a + a.b) / 2 * (a.pct ? pctScale(il) : flatScale(il));
      mods.push([st, a.pct ? Math.round(v * 100) / 100 : a.dec ? Math.round(v * 10) / 10 : Math.round(v)]);
    }
    gear[slot] = { slot, rar: P.rar, base: BASES[slot][0], name: `${kind} ${slot}`, il, mods };
  }
  return gear;
}

// Experience needed to go from level l to l + 1, and packs placed on a map of tier t.
export const xpNeedFor = l => Math.round(40 * Math.pow(l, 1.55));
export const packCount = t => Math.min(PACK.count[2], PACK.count[0] + PACK.count[1] * t);

// Gem XP (AP): everything a gem has earned, from level 1. Feeding moves a share of it (data/gems.js FEED).
export const gemTotalXp = g => { let n = g.xp || 0; for (let l = 1; l < g.lvl; l++) n += xpNeedFor(l); return n; };
// Share of the fed gem's XP that reaches the target: same gem, same kind, or anything else; a maxed gem fed into the same gem gives more.
export function feedShare(food, into, cap = GEM.cap) {
  const a = GEMS[food.gem] || SUPPORTS[food.gem], b = GEMS[into.gem] || SUPPORTS[into.gem];
  const base = food.gem === into.gem ? FEED.same : a.kind === b.kind ? FEED.kind : FEED.other;
  return base + (food.gem === into.gem && food.lvl >= cap ? FEED.mastery : 0);
}
