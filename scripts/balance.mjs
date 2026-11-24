// Balance report: instant maths, no browser. Uses the game's own data and formulas (src/game/formulas.js).
// For each map tier at its par character level, with each gear profile, prints kill speeds (without and with Surge),
// danger and XP, and flags anything outside the targets in src/data/balance.js.
// Usage: npm run balance [-- maxTier]   (default 5, the Crypt). MAIN=<gem> picks the Main gem (default PAR_MAIN, the Sword).
// The Main gem at the tier's par gem level (PAR_GEM) with its par support (parSock), nothing else, so it's a floor on real kill speed.
// Melee hits ESTIMATE.targets monsters per swing in a pack (gemDps in formulas.js), one on a rare or the guardian.
import { computeStats, gemDps, monsterStats, gearProfile, xpNeedFor, packCount, rideMove } from '../src/game/formulas.js';
import { TARGETS, RARITY, ESTIMATE, PAR_MAIN, parLevel, parGem, parSock, PAR_GEAR, GEAR_PROFILES, LEVEL_TIME } from '../src/data/balance.js';
import { RIDE } from '../src/data/ride.js';
import { generateLevel, junctionRooms, tourLen } from '../src/world/gen.js';
import { ROLES } from '../src/data/dungeon.js';
import { seeded } from '../src/core/rng.js';
import { MT, TIER, PACKS, PACK } from '../src/data/monsters.js';
import { GEMS } from '../src/data/gems.js';
import { SURGE } from '../src/data/skills.js';

const maxTier = Number(process.argv[2]) || 5, MAIN = process.env.MAIN || PAR_MAIN;
if (!GEMS[MAIN]) { console.error('Unknown gem ' + MAIN); process.exit(1); }

// Seconds to land n hits at `rate` per second. Skills cost nothing, so it's swing rate only. surge: spend a full Surge gauge
// first (SURGE.bonus faster for surgeMax seconds), then the normal rate; the gauge doesn't refill during the fight.
function hitTime(n, rate, st, surge = false) {
  if (!surge) return n / rate;
  const fs = rate * (1 + SURGE.bonus), n0 = fs * st.surgeMax;
  return n <= n0 ? n / fs : st.surgeMax + (n - n0) / rate;
}
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
const levelEst = [];
console.log(`Watt Dungeon balance report · ${GEMS[MAIN].n} only · ${GEMS[MAIN].melee ? ESTIMATE.targets[MAIN] + ' targets per swing in a pack' : 'single target'} · targets in src/data/balance.js`);
console.log('  ↑ above target  ↓ below target  (checked on the par gear row, marked *)\n');
// The level track: a character that full-clears every map from map 1 (XP carried over), to compare with the par levels.
const track = { lv: 1, xp: 0 };
for (let t = 1; t <= maxTier; t++) {
  const atStart = track.lv + track.xp / xpNeedFor(track.lv);
  const lvl = parLevel(t), gl = parGem(t), gems = { [MAIN]: gl }, socks = { [MAIN]: (parSock(t, MAIN).main || []) }, pack = avgPack(t), boss = monsterStats('boss', t);
  const z = monsterStats('zombie', t), rare = monsterStats('zombie', t, 2);
  const xpMap = packCount(t) * pack.xp * (1 + TIER.xp * (t - 1)) * (1 + PACK.magicChance * (RARITY.magic.xp - 1)) + packCount(t) * PACK.rareChance * MT.zombie.xp * RARITY.rare.xp + MT.boss.xp;
  let lv = lvl, xp = xpMap; while (xp >= xpNeedFor(lv)) { xp -= xpNeedFor(lv); lv++; }
  track.xp += xpMap; while (track.xp >= xpNeedFor(track.lv)) { track.xp -= xpNeedFor(track.lv); track.lv++; }
  console.log(`Tier ${t} · par level ${lvl} · ${GEMS[MAIN].n} gem ${gl}${socks[MAIN].length ? ' + ' + socks[MAIN].join(', ') : ''} · zombie ${fmt(z.hp, 0)} hp · pack ~${fmt(pack.n)} monsters ${fmt(pack.hp, 0)} hp · rare ${fmt(rare.hp, 0)} hp · guardian ${fmt(boss.hp, 0)} hp · map XP takes you to level ${fmt(lv + xp / xpNeedFor(lv))} · full clears from map 1 arrive at level ${fmt(atStart)}`);
  console.log('  gear   │ hit  │ zombie hits │ pack clear │ rare kill │ guardian │ surging  │ face-tank │ vs starter');
  const startDps = gemDps(computeStats(gearProfile('start'), {}, lvl, gems, socks), MAIN).dps;
  for (const kind of Object.keys(GEAR_PROFILES)) {
    const st = computeStats(gearProfile(kind, t), {}, lvl, gems, socks), G = gemDps(st, MAIN), hit = G.one;
    const hits = z.hp / hit;
    const clear = hitTime(pack.hp / G.pack, G.rate, st), rk = hitTime(rare.hp / hit, G.rate, st), gk = hitTime(boss.hp / hit, G.rate, st), gs = hitTime(boss.hp / hit, G.rate, st, true);
    const tank = st.maxLife / pack.dps, gain = G.dps / startDps;
    if (PAR_GEAR(t) === kind) levelEst[t] = { st, clear: hitTime(pack.hp * (1 + PACK.magicChance * (RARITY.magic.hp - 1)) / G.pack, G.rate, st), rk, gs };
    const par = PAR_GEAR(t) === kind, chk = (v, k) => { if (!par || (k === 'hitsNormal' && MAIN !== PAR_MAIN)) return ' '; const f = flag(v, TARGETS[k]); if (f !== ' ') warn++; return f; };
    console.log(`  ${(kind + (par ? '*' : ' ')).padEnd(7)}│ ${fmt(hit).padStart(4)} │ ${fmt(hits).padStart(9)} ${chk(hits, 'hitsNormal')} │ ${fmt(clear).padStart(8)}s${chk(clear, 'packClear')}│ ${fmt(rk).padStart(7)}s${chk(rk, 'rareKill')}│ ${fmt(gk, 0).padStart(6)}s${chk(gk, 'guardian')}│ ${fmt(gs, 0).padStart(6)}s ${chk(gs, 'guardianSurge')}│ ${fmt(tank).padStart(7)}s${chk(tank, 'faceTank')}│ ×${fmt(gain, 2)}${kind === 'magic' && t === 1 ? flag(gain, TARGETS.lootGain) : ''}`);
  }
  console.log('');
}
console.log(warn ? `${warn} par numbers outside target.` : 'All par numbers inside target.');

// Level time estimate: a full clear at par (data/balance.js LEVEL_TIME), from the layouts (200 seeds, the map viewer's 1–200) and
// the maths above: the walk through every room / walking speed at the par pace, + packs × the average pack's clear time (magic packs
// included) + rare packs × the rare's kill time + the guardian (a full Surge gauge) + junction stops × the wait (data/ride.js).
// Fight times are the maths floor above; `npm run level` measures a real one (game/levelrun.js; its last means are LEVEL_TIME.measured).
// Not counted in par numbers outside target: levels are short of the target until build order step 10 tunes them.
{
  const N = 200; let tour = 0, jn = 0; const roles = {};
  for (let k = 1; k <= N; k++) { const L = generateLevel({}, seeded(k)); tour += tourLen(L) / N; jn += junctionRooms(L).length / N; for (const r of L.rooms) roles[r.role] = (roles[r.role] || 0) + 1 / N; }
  const E = LEVEL_TIME, m = x => fmt(x / 60).padStart(5);
  console.log(`\nLevel time, full clear at par (estimate; npm run level measures it) · ${fmt(tour, 0)} units of rooms and corridors, ${fmt(jn)} junctions, mean of ${N} layouts · minutes`);
  console.log('  tier │  walk │ packs │ rares │ guard │ junc  │ total │ measured │ target ' + E.target.join('–'));
  for (let t = 1; t <= maxTier; t++) {
    const e = levelEst[t]; if (!e) continue;
    const walk = tour / (e.st.ms * rideMove(E.pace)) * E.walkSlack, packs = packCount(t) * e.clear * E.fightSlack, rares = packCount(t) * PACK.rareChance * e.rk * E.fightSlack;
    const guard = e.gs * E.fightSlack, junc = jn * RIDE.junction.wait, total = walk + packs + rares + guard + junc, f = flag(total / 60, E.target);
    const ms = E.measured[t - 1];
    console.log(`  ${String(t).padStart(4)} │ ${m(walk)} │ ${m(packs)} │ ${m(rares)} │ ${m(guard)} │ ${m(junc)} │ ${m(total)} ${f} │ ${ms ? fmt(ms).padStart(5) + ' ' + flag(ms, E.target) : '    –  '}  │`);
  }
  // Room roles (world/gen.js, data/dungeon.js ROLES and RHYTHM): how many of each a level has, and their first-guess time estimates
  // (ROLES[].est, seconds of content beyond walking) added up, for the time budget (build order step 10, step 6) to calibrate.
  const est = Object.entries(roles).reduce((a, [k, n]) => a + n * ROLES[k].est, 0);
  console.log(`  room roles per level: ${Object.entries(ROLES).filter(([k]) => roles[k]).map(([k, R]) => `${R.icon} ${R.name.toLowerCase()} ${fmt(roles[k])}`).join(' · ')} · role estimates add up to ${fmt(est / 60)} min (first guesses, not yet calibrated)`);
}
