// Balance report: instant maths, no browser. Uses the game's own data and formulas (src/game/formulas.js).
// For each map tier at its par character level, with each gear profile, prints kill speeds (without and with Surge),
// danger and XP, and flags anything outside the targets in src/data/balance.js.
// Usage: npm run balance [-- maxTier]   (default 5, the Crypt). Fireball in Main at the tier's par gem level (PAR_GEM) with its par support
// (parSock; Twin Flame's extra projectile is counted as landing ESTIMATE.extraProj of the time, like the bag's estimate), nothing else, so it's a floor on real kill speed.
import { computeStats, avgHit, monsterStats, gearProfile, xpNeedFor, packCount } from '../src/game/formulas.js';
import { TARGETS, RARITY, ESTIMATE, parLevel, parGem, parSock, PAR_GEAR, AOE_TARGETS, GEAR_PROFILES } from '../src/data/balance.js';
import { MT, TIER, PACKS, PACK } from '../src/data/monsters.js';
import { SK, SURGE } from '../src/data/skills.js';

const maxTier = Number(process.argv[2]) || 5, F = SK.fireball;

// Seconds to land n Fireballs. Skills cost nothing, so it's cast rate only. surge: spend a full Surge gauge first
// (SURGE.bonus faster for surgeMax seconds), then cast at the normal rate; the gauge doesn't refill during the fight.
function castTime(n, st, surge = false) {
  const f = st.cast / F.cast; if (!surge) return n / f;
  const fs = f * (1 + SURGE.bonus), n0 = fs * st.surgeMax;
  return n <= n0 ? n / fs : st.surgeMax + (n - n0) / f;
}
// Fireballs per cast that land, on average: the first always, extras (Twin Flame) ESTIMATE.extraProj of the time.
const projLand = st => 1 + (st.sk.fireball.proj - 1) * ESTIMATE.extraProj;
const flag = (v, [lo, hi]) => v < lo ? '↓' : v > hi ? '↑' : ' ';
const fmt = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);

// The average pack at a tier: members, total HP and melee DPS against you.
function avgPack(t) {
  const sz = 1 + TIER.packSize * (t - 1); let hp = 0, dps = 0, n = 0, xp = 0;
  for (const tpl of PACKS) for (const [type, c] of tpl) {
    const k = c * sz, m = monsterStats(type, t);
    n += k; hp += k * m.hp; xp += k * MT[type].xp; dps += k * (MT[type].cd ? m.dmg / MT[type].cd : m.dmg / 4);
  }
  const L = PACKS.length; return { n: n / L, hp: hp / L, dps: dps / L, xp: xp / L };
}

let warn = 0;
console.log(`Watt Dungeon balance report · Fireball only · ${AOE_TARGETS} targets per explosion · targets in src/data/balance.js`);
console.log('  ↑ above target  ↓ below target  (checked on the par gear row, marked *)\n');
for (let t = 1; t <= maxTier; t++) {
  const lvl = parLevel(t), gl = parGem(t), gems = { fireball: gl }, socks = { fireball: (parSock(t).main || []) }, pack = avgPack(t), boss = monsterStats('boss', t);
  const z = monsterStats('zombie', t), rare = monsterStats('zombie', t, 2);
  const xpMap = packCount(t) * pack.xp * (1 + TIER.xp * (t - 1)) * (1 + PACK.magicChance * (RARITY.magic.xp - 1)) + packCount(t) * PACK.rareChance * MT.zombie.xp * RARITY.rare.xp + MT.boss.xp;
  let lv = lvl, xp = xpMap; while (xp >= xpNeedFor(lv)) { xp -= xpNeedFor(lv); lv++; }
  console.log(`Tier ${t} · par level ${lvl} · Fireball gem ${gl}${socks.fireball.length ? ' + ' + socks.fireball.join(', ') : ''} · zombie ${fmt(z.hp, 0)} hp · pack ~${fmt(pack.n)} monsters ${fmt(pack.hp, 0)} hp · rare ${fmt(rare.hp, 0)} hp · guardian ${fmt(boss.hp, 0)} hp · map XP takes you to level ${fmt(lv + xp / xpNeedFor(lv))}`);
  console.log('  gear   │ hit  │ zombie hits │ pack clear │ rare kill │ guardian │ surging  │ face-tank │ vs starter');
  const startDps = (() => { const st = computeStats(gearProfile('start'), {}, lvl, gems, socks); return avgHit(st, 1, 'fire') * projLand(st) * st.cast / F.cast; })();
  for (const kind of Object.keys(GEAR_PROFILES)) {
    const st = computeStats(gearProfile(kind, t), {}, lvl, gems, socks), hit = avgHit(st, 1, 'fire') * projLand(st);
    const hits = z.hp / hit;
    const clear = castTime(pack.hp / (hit * AOE_TARGETS), st), rk = castTime(rare.hp / hit, st), gk = castTime(boss.hp / hit, st), gs = castTime(boss.hp / hit, st, true);
    const tank = st.maxLife / pack.dps, gain = hit * st.cast / F.cast / startDps;
    const par = PAR_GEAR(t) === kind, chk = (v, k) => { if (!par) return ' '; const f = flag(v, TARGETS[k]); if (f !== ' ') warn++; return f; };
    console.log(`  ${(kind + (par ? '*' : ' ')).padEnd(7)}│ ${fmt(hit).padStart(4)} │ ${fmt(hits).padStart(9)} ${chk(hits, 'hitsNormal')} │ ${fmt(clear).padStart(8)}s${chk(clear, 'packClear')}│ ${fmt(rk).padStart(7)}s${chk(rk, 'rareKill')}│ ${fmt(gk, 0).padStart(6)}s${chk(gk, 'guardian')}│ ${fmt(gs, 0).padStart(6)}s ${chk(gs, 'guardianSurge')}│ ${fmt(tank).padStart(7)}s${chk(tank, 'faceTank')}│ ×${fmt(gain, 2)}${kind === 'magic' && t === 1 ? flag(gain, TARGETS.lootGain) : ''}`);
  }
  console.log('');
}
console.log(warn ? `${warn} par numbers outside target.` : 'All par numbers inside target.');
