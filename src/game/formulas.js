// Pure balance maths: hero stats, item roll scaling, monster scaling, expected damage.
// Imports only data, so the game, `npm run balance` (Node) and the arena all share one set of formulas.
import { PASS } from '../data/passives.js';
import { HERO, RARITY, START_WEAPON, GEAR_PROFILES, AFFIX_PRIORITY } from '../data/balance.js';
import { MT, TIER, PACK } from '../data/monsters.js';
import { SLOTS, BASES, IMPL, AFF } from '../data/items.js';

// Item level scaling of rolled values (flat and percent affixes).
export const flatScale = il => 1 + .22 * (il - 1), pctScale = il => 1 + .07 * (il - 1);

export function computeStats(gear, passives = {}, lvl = 1) {
  const s = { lifeF: 0, lifePct: 0, manaF: 0, lregen: 0, mregen: 0, dmg: 0, fire: 0, cold: 0, light: 0, cast: 0, ms: 0, crit: 0, aoe: 0, proj: 0, chains: 0, lok: 0, mok: 0, spell: 0, pierce: 0, dashCh: 0, freeze: 0, dr: 0 };
  for (const k in gear) { const it = gear[k]; if (it) for (const [st, v] of it.mods) s[st] = (s[st] || 0) + v; }
  for (const id in passives) if (PASS[id]) PASS[id].fn(s, passives[id]);
  const H = HERO, l = lvl - 1;
  return {
    maxLife: Math.max(20, Math.round((H.life + H.lifePer * l + s.lifeF) * (1 + s.lifePct))), maxMana: Math.round(H.mana + H.manaPer * l + s.manaF),
    lregen: H.lregen + s.lregen, mregen: H.mregen + s.mregen, base: H.spell + H.spellPer * l + s.spell, dmg: 1 + s.dmg, fire: s.fire, cold: s.cold, light: s.light,
    cast: 1 + s.cast, ms: H.ms * (1 + s.ms), crit: H.crit + s.crit, aoe: 1 + s.aoe, proj: 1 + s.proj, chains: H.chains + s.chains, lok: s.lok, mok: s.mok, pierce: s.pierce,
    dashMax: 1 + s.dashCh, freeze: 1 + s.freeze, dr: Math.min(.6, s.dr), blood: !!s.blood, ignite: !!s.ignite, shatter: !!s.shatter, conduit: !!s.conduit, chainboom: !!s.chainboom,
    burnGround: !!s.burnGround, storm: !!s.storm, autoNova: !!s.autoNova,
  };
}

// Average hit of a skill (mult × base spell damage of an element), crits included.
export const avgHit = (st, mult, elem) => st.base * mult * (st.dmg + (st[elem] || 0)) * (1 + st.crit * (HERO.critMult - 1));

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
