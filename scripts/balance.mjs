// Balance report: instant maths, no browser. Uses the game's own data and formulas (src/game/formulas.js).
// For each map tier at its par character level, with each gear profile, prints kill speeds (without and with Surge),
// danger and XP, and flags anything outside the targets in src/data/balance.js.
// Usage: npm run balance [-- maxTier]   (default 5, the Crypt). MAIN=<gem> picks the Main gem (default PAR_MAIN, the Sword).
// The Main gem at the tier's par gem level (PAR_GEM) with its par support (parSock), nothing else, so it's a floor on real kill speed.
// The passive tree: the par preset for the Main gem (data/balance.js PAR_TREE, parTree), one node per level after the first; TREE=none
// leaves it empty, TREE=<preset> picks another. The fight nodes (posture, parry, riposte, stagger, finisher) don't show here: the arena plays them.
// Melee hits ESTIMATE.targets monsters per swing in a pack (gemDps in formulas.js), one on a rare or the guardian.
import { computeStats, gemDps, monsterStats, gearProfile, xpNeedFor, packCount, rideMove, hitTaken, armourCut, dmgType, ehp, gearValue, parStats, power, powerSteps, eliteStats, eliteRoomHp } from '../src/game/formulas.js';
import { TARGETS, RARITY, ESTIMATE, PAR_MAIN, parLevel, parGem, parSock, PAR_GEAR, GEAR_PROFILES, LEVEL_TIME, parTree, PAR_TREE, PAR_SUPPORT } from '../src/data/balance.js';
import { TREE } from '../src/data/tree.js';
import { RIDE } from '../src/data/ride.js';
import { generateLevel, junctionRooms, tourLen } from '../src/world/gen.js';
import { ROLES } from '../src/data/dungeon.js';
import { seeded } from '../src/core/rng.js';
import { MT, TIER, PACKS, PACK, BOSS, BLAST, RARE, ELITE, DMG_TYPES } from '../src/data/monsters.js';
import { GEMS } from '../src/data/gems.js';
import { SURGE } from '../src/data/skills.js';

const maxTier = Number(process.argv[2]) || 5, MAIN = process.env.MAIN || PAR_MAIN, PRESET = process.env.TREE || PAR_TREE[MAIN] || 'shield';
const treeAt = lvl => PRESET === 'none' ? [] : parTree(lvl, MAIN, PRESET);
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

// The average pack at a tier: members, total HP and its damage per second against you (dps: raw; taken(st): after armour,
// resistances and less damage taken, hit by hit through formulas.js hitTaken, the game's own maths). A bloater counts as
// its damage every 4 s, of its blast's type.
function avgPack(t) {
  const sz = 1 + TIER.packSize * (t - 1); let hp = 0, dps = 0, n = 0, xp = 0; const hits = [];
  for (const tpl of PACKS) for (const [type, c] of tpl) {
    const k = c * sz, m = monsterStats(type, t), every = MT[type].cd || 4, d = m.dmg;
    const dt = MT[type].ai === 'bomb' ? dmgType(BLAST.bloater.dt, t) : m.dt;
    n += k; hp += k * m.hp; xp += k * MT[type].xp; dps += k * (MT[type].cd ? m.dmg / MT[type].cd : m.dmg / 4); hits.push([k / every, d, dt]);
  }
  const L = PACKS.length; return { n: n / L, hp: hp / L, dps: dps / L, xp: xp / L, taken: st => hits.reduce((a, [r, d, dt]) => a + r * hitTaken(st, d, dt), 0) / L };
}

let warn = 0;
const levelEst = [], defRows = [];
console.log(`Watt Dungeon balance report · ${GEMS[MAIN].n} only · tree preset ${PRESET} · ${GEMS[MAIN].melee ? ESTIMATE.targets[MAIN] + ' targets per swing in a pack' : 'single target'} · targets in src/data/balance.js`);
console.log('  ↑ above target  ↓ below target  (checked on the par gear row, marked *)\n');
// The level track: a character that full-clears every map from map 1 (XP carried over), to compare with the par levels.
const track = { lv: 1, xp: 0 }, treeRows = [];
for (let t = 1; t <= maxTier; t++) {
  const atStart = track.lv + track.xp / xpNeedFor(track.lv);
  const lvl = parLevel(t), gl = parGem(t), gems = { [MAIN]: gl }, socks = { [MAIN]: (parSock(t, MAIN).main || []) }, pack = avgPack(t), boss = monsterStats('boss', t);
  const z = monsterStats('zombie', t), rare = monsterStats('zombie', t, 2);
  const xpMap = packCount(t) * pack.xp * (1 + TIER.xp * (t - 1)) * (1 + PACK.magicChance * (RARITY.magic.xp - 1)) + packCount(t) * PACK.rareChance * MT.zombie.xp * RARITY.rare.xp + MT.boss.xp;
  let lv = lvl, xp = xpMap; while (xp >= xpNeedFor(lv)) { xp -= xpNeedFor(lv); lv++; }
  track.xp += xpMap; while (track.xp >= xpNeedFor(track.lv)) { track.xp -= xpNeedFor(track.lv); track.lv++; }
  console.log(`Tier ${t} · par level ${lvl} · ${GEMS[MAIN].n} gem ${gl}${socks[MAIN].length ? ' + ' + socks[MAIN].join(', ') : ''} · zombie ${fmt(z.hp, 0)} hp · pack ~${fmt(pack.n)} monsters ${fmt(pack.hp, 0)} hp · rare ${fmt(rare.hp, 0)} hp · guardian ${fmt(boss.hp, 0)} hp · map XP takes you to level ${fmt(lv + xp / xpNeedFor(lv))} · full clears from map 1 arrive at level ${fmt(atStart)}`);
  const tree = treeAt(lvl);
  console.log('  gear   │ hit  │ zombie hits │ pack clear │ rare kill │ guardian │ surging  │ face-tank │ vs starter');
  const startDps = gemDps(computeStats(gearProfile('start'), tree, lvl, gems, socks), MAIN).dps;
  for (const kind of Object.keys(GEAR_PROFILES)) {
    const st = computeStats(gearProfile(kind, t), tree, lvl, gems, socks), G = gemDps(st, MAIN), hit = G.one;
    if (PAR_GEAR(t) === kind) { const st0 = computeStats(gearProfile(kind, t), [], lvl, gems, socks); treeRows[t] = { lvl, tree, dps: G.dps / gemDps(st0, MAIN).dps, life: st.maxLife - st0.maxLife, life0: st0.maxLife, surge: st.surgeMax / st0.surgeMax - 1, f: st.fight }; }
    const hits = z.hp / hit;
    const clear = hitTime(pack.hp / G.pack, G.rate, st), rk = hitTime(rare.hp / hit, G.rate, st), gk = hitTime(boss.hp / hit, G.rate, st), gs = hitTime(boss.hp / hit, G.rate, st, true);
    const tank = st.maxLife / pack.taken(st), gain = G.dps / startDps;
    if (PAR_GEAR(t) === kind) levelEst[t] = { st, clear: hitTime(pack.hp * (1 + PACK.magicChance * (RARITY.magic.hp - 1)) / G.pack, G.rate, st), rk, gs };
    const par = PAR_GEAR(t) === kind, chk = (v, k) => { if (!par || (k === 'hitsNormal' && MAIN !== PAR_MAIN)) return ' '; const f = flag(v, TARGETS[k]); if (f !== ' ') warn++; return f; };
    console.log(`  ${(kind + (par ? '*' : ' ')).padEnd(7)}│ ${fmt(hit).padStart(4)} │ ${fmt(hits).padStart(9)} ${chk(hits, 'hitsNormal')} │ ${fmt(clear).padStart(8)}s${chk(clear, 'packClear')}│ ${fmt(rk).padStart(7)}s${chk(rk, 'rareKill')}│ ${fmt(gk, 0).padStart(6)}s${chk(gk, 'guardian')}│ ${fmt(gs, 0).padStart(6)}s ${chk(gs, 'guardianSurge')}│ ${fmt(tank).padStart(7)}s${chk(tank, 'faceTank')}│ ×${fmt(gain, 2)}${kind === 'magic' && t === 1 ? flag(gain, TARGETS.lootGain) : ''}`);
  }
  // Defence on the par gear (data/balance.js DEFENCE, GEAR_PROFILES): armour, resistances, and how much of each kind of hit gets through.
  { const st = computeStats(gearProfile(PAR_GEAR(t), t), tree, lvl, gems, socks), zr = monsterStats('zombie', t, 2), pc = v => fmt(v * 100, 0) + '%', cut = (d, dt = 'phys') => pc(1 - hitTaken(st, d, dt) / d);
    defRows[t] = { armour: st.armour, res: st.res, zombie: 1 - hitTaken(st, z.dmg, z.dt) / z.dmg };
    console.log(`  defence (${PAR_GEAR(t)}): armour ${st.armour} · resist fire ${pc(st.res.fire)} cold ${pc(st.res.cold)} lightning ${pc(st.res.light)} poison ${pc(st.res.poison)} · cut off a zombie hit (${fmt(z.dmg)}) ${cut(z.dmg, z.dt)}, a rare's heavy (${fmt(zr.dmg * RARE.heavy.dmg, 0)}) ${cut(zr.dmg * RARE.heavy.dmg)}, the guardian's swing (${fmt(boss.dmg, 0)}) ${cut(boss.dmg)}, slam (${fmt(boss.dmg * BOSS.slamDmg, 0)}) ${cut(boss.dmg * BOSS.slamDmg, dmgType(BOSS.dt.slam, t))}, poison bolt ${cut(boss.dmg * BOSS.novaDmg, dmgType(BOSS.dt.nova, t))}, bloater blast ${cut(monsterStats('bloater', t).dmg * BLAST.bloater.dmg, dmgType(BLAST.bloater.dt, t))}`); }
  console.log('');
}
console.log(warn ? `${warn} par numbers outside target.` : 'All par numbers inside target.');

// Item level and tier (the sawtooth in the design notes "Balance"): gear drops at the map's tier as its item level, so a new map's
// drops should beat the kit you brought. For each tier at par (level, gems, tree): the par magic kit from the tier before against
// this tier's, and a rare kit against a magic one. DPS is the Main gem's pack DPS; effective life is max life over the share of a
// typical map's hits that armour and resistances let through (formulas.js ehp, ESTIMATE.threat); value is the bag's upgrade score.
console.log('\nGear by item level, at each tier\'s par · DPS, effective life (ehp) and the bag\'s value (formulas.js gearValue, upgrade above ' + ESTIMATE.value.upgrade + ')');
console.log('  tier │ ehp (magic) │ magic kit from tier t−1 → t: DPS · ehp · value │ rare kit over magic: DPS · ehp · value');
for (let t = 1; t <= maxTier; t++) {
  const lvl = parLevel(t), gems = { [MAIN]: parGem(t) }, socks = { [MAIN]: parSock(t, MAIN).main || [] }, tree = treeAt(lvl), sl = { main: MAIN };
  const at = (kind, il) => computeStats(gearProfile(kind, il), tree, lvl, gems, socks, sl);
  const m = at('magic', t), r = at('rare', t), p = t > 1 ? at('magic', t - 1) : null, x = (a, b) => '×' + fmt(a / b, 2);
  const row = (a, b) => `${x(gemDps(a, MAIN).packDps, gemDps(b, MAIN).packDps)} · ${x(ehp(a, t), ehp(b, t))} · ${fmt(gearValue(a, b, MAIN, t), 2)}`;
  console.log(`  ${String(t).padStart(4)} │ ${fmt(ehp(m, t), 0).padStart(5)} (${m.maxLife} life) │ ${(p ? row(m, p) : '–').padEnd(45)} │ ${row(r, m)}`);
}

// What the tree preset gives at par (on the par gear), against the same hero with no points spent. Power per point should be modest.
console.log(`\nPassive tree at par · preset ${PRESET} · against no points spent`);
console.log('  tier │ lvl │ pts │ DPS   │ life      │ Surge │ parry window │ riposte │ stagger │ finisher │ posture │ nodes');
for (let t = 1; t <= maxTier; t++) {
  const r = treeRows[t]; if (!r) continue; const p = v => (v >= 0 ? '+' : '') + fmt(v * 100, 0) + '%';
  console.log(`  ${String(t).padStart(4)} │ ${String(r.lvl).padStart(3)} │ ${String(r.tree.length).padStart(3)} │ ×${fmt(r.dps, 2)} │ +${fmt(r.life, 0).padStart(3)} (${p(r.life / r.life0).padStart(4)}) │ ${p(r.surge).padStart(5)} │ ${p(r.f.parry - 1).padStart(12)} │ ${p(r.f.riposte - 1).padStart(7)} │ ${p(r.f.stagger - 1).padStart(7)} │ ${p(r.f.finisher - 1).padStart(8)} │ ${('-' + fmt(r.f.posture * 100, 0) + '%').padStart(7)} │ ${r.tree.map(id => TREE[id].n).join(', ')}`);
}

// Effective life against each damage type at par (formulas.js ehp and hitTaken; design notes "Defence"): max life over the share of
// one hit of that type that reaches your life, for a zombie's swing and a rare's heavy (physical: armour cuts small hits more), and a
// hit of each other type; 'map mix' is the bag's effective life (ESTIMATE.threat). The second line per tier is the wrong kit
// (GEAR_PROFILES.wrong: fire resistance where the poison was).
console.log('\nEffective life at par, by damage type (life ÷ share of a hit that gets through)');
console.log('  tier │ gear  │ life │ armour │ phys: swing · heavy │ fire │ cold │ light │ poison │ map mix');
for (let t = 1; t <= maxTier; t++) for (const kind of t > 1 ? [PAR_GEAR(t), 'wrong'] : [PAR_GEAR(t)]) {
  const st = parStats(t, MAIN, { gear: kind, tree: treeAt(parLevel(t)) }), z = monsterStats('zombie', t), hv = monsterStats('zombie', t, 2).dmg * RARE.heavy.dmg;
  const e = (d, dt) => fmt(st.maxLife * d / hitTaken(st, d, dt), 0).padStart(4);
  console.log(`  ${String(t).padStart(4)} │ ${kind.padEnd(5)} │ ${String(st.maxLife).padStart(4)} │ ${String(st.armour).padStart(6)} │       ${e(z.dmg)} · ${e(hv)}  │ ${e(z.dmg, 'fire')} │ ${e(z.dmg, 'cold')} │  ${e(z.dmg, 'light')} │   ${e(z.dmg, 'poison')} │ ${fmt(ehp(st, t), 0).padStart(5)}`);
}

// Time to kill with each Main gem build at par (its par support, PAR_SUPPORT, and tree preset, PAR_TREE; never surging; the maths
// floor, single target on rares, elites and the guardian, ESTIMATE.targets per swing in a pack). ± is against the Sword.
// The elite is an elite room's elite (ELITE: a rare × hp); 'elite room' adds its minions. The arena plays these fights for real.
const BUILDS = Object.keys(GEMS).filter(id => GEMS[id].melee && GEMS[id].kind === 'attack');
console.log('\nTime to kill at par, each Main gem build (never surging; ± against the Sword)');
console.log('  tier │ build        │ support    │ zombie hits │ pack clear │ rare kill │ elite      │ elite room │ guardian');
for (let t = 1; t <= maxTier; t++) {
  const z = monsterStats('zombie', t), pack = avgPack(t), rare = monsterStats('zombie', t, 2), el = eliteStats('zombie', t), boss = monsterStats('boss', t);
  let base = null;
  for (const id of BUILDS) {
    const st = parStats(t, id), G = gemDps(st, id), sec = hp => hp / G.one / G.rate, packT = pack.hp / G.pack / G.rate, roomT = sec(el.hp) + eliteRoomHp(t) / G.pack / G.rate;
    const v = { hits: z.hp / G.one, pack: packT, rare: sec(rare.hp), elite: sec(el.hp), room: roomT, boss: sec(boss.hp) }; if (!base) base = v;
    const c = k => id === BUILDS[0] ? '     ' : ((v[k] / base[k] - 1 >= 0 ? '+' : '') + fmt((v[k] / base[k] - 1) * 100, 0) + '%').padStart(5);
    console.log(`  ${String(t).padStart(4)} │ ${GEMS[id].n.padEnd(12)} │ ${(parSock(t, id).main || ['–']).join(', ').padEnd(10)} │ ${fmt(v.hits).padStart(5)} ${c('hits')} │ ${fmt(v.pack).padStart(4)}s ${c('pack')}│ ${fmt(v.rare).padStart(4)}s${c('rare')}│ ${fmt(v.elite).padStart(4)}s ${c('elite')}│ ${fmt(v.room).padStart(4)}s ${c('room')}│ ${fmt(v.boss, 0).padStart(4)}s ${c('boss')}`);
  }
}

// Power per system (formulas.js powerSteps): how much stronger one drop, one gem level, one tree point or one character level makes
// the par hero, as power = pack DPS × effective life. Each system should matter (TARGETS.power, checked on the Sword's row).
console.log(`\nPower per system at par · power = pack DPS × effective life · ${GEMS[MAIN].n} · targets per step in src/data/balance.js TARGETS.power`);
console.log('  tier │ magic drop (vs plain) │ new-tier drop │ gem level │ tree point │ char level (life) │ whole kit vs starter │ all gem levels │ whole tree');
for (let t = 1; t <= maxTier; t++) {
  const P = powerSteps(t, MAIN), pc = (v, k) => { const s = ('+' + fmt((v - 1) * 100, 1) + '%').padStart(6); if (!k || MAIN !== PAR_MAIN || (k !== 'drop' && t === 1)) return s + ' '; const f = flag(v - 1, TARGETS.power[k]); if (f !== ' ') warn++; return s + f; };
  const st = parStats(t, MAIN), lvl = parLevel(t), kit = power(st, MAIN, t) / power(parStats(t, MAIN, { gear: 'start' }), MAIN, t), gems = power(st, MAIN, t) / power(parStats(t, MAIN, { gem: 1 }), MAIN, t), tree = power(st, MAIN, t) / power(parStats(t, MAIN, { tree: [] }), MAIN, t);
  console.log(`  ${String(t).padStart(4)} │ ${pc(P.drop, 'drop').padStart(21)} │ ${pc(P.tierDrop).padStart(13)} │ ${pc(P.gemLevel, 'gemLevel').padStart(9)} │ ${pc(P.treePoint, 'treePoint').padStart(10)} │ ${pc(P.charLevel).padStart(17)} │ ${('×' + fmt(kit, 2)).padStart(20)} │ ${('×' + fmt(gems, 2)).padStart(14)} │ ${('×' + fmt(tree, 2)).padStart(10)}`);
}
console.log(warn ? `${warn} par numbers outside target (all tables).` : 'All par numbers inside target (all tables).');

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
