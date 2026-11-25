// Balance arena: one fight with the real game code and a scripted player, no level run needed.
// Used by `npm run arena` (tests/arena.mjs) and `__dbg.arena(spec)` in the browser console.
//   spec: { tier, lvl, gear: 'start' | 'magic' | 'rare', fight: [[type, count], ...], rar: 0 | 1 | 2 (for the whole group),
//           rare: type (adds one rare), guardian: true, maxT: seconds, bot: 'smart' (default) | 'perfect' | 'careless',
//           bar: { slot: [gemId, level] } (default: parBar(tier) in data/balance.js), main: gemId (swap the Main gem, same level),
//           sock: { slot: [supportId, ...] } (default: parSock(tier, Main gem); {} for none), surge: false (never surge),
//           guard: gemId (swap the Guard gem, same level, e.g. a shield art),
//           tree: a TREE_PRESETS name (default: the par preset for the Main gem, PAR_TREE) or false (no tree points),
//           elite: type (an elite room's elite and its minions, data/monsters.js ELITE, grown per tier like the game's),
//           unique: a data/items.js UNIQ id (worn in its slot instead of the par item), gemUnder: n (every bar gem n levels under par) }
// The hero's tree is the first treePoints(level) nodes of that preset (data/balance.js parTree), like a sensible player's.
// The bot uses whatever is on the bar. With a melee Main gem it walks into reach of its target (guardian and rares first, then the
// nearest) and lets the auto-attack swing; a held ranged gem is held on the target from casting range. It taps press gems (Main or
// Flex) when enough monsters are in reach (SK[...].bot), drinks flasks under half life, and surges against rares, guardians and
// crowds of four or more. It never steps out of anything: like the autopilot, it stands in reach, so defence is all timing
// (design notes "Fight mechanics"). With the Knight's Shield and Roll it plays the timing game at a reaction skill (SKILL in game/bot.js):
// it decides once per threat whether it reacts in time. Against a guardian it keeps some Surge back and surges through its channels. A swing it sees coming: parry (else block, else nothing). A heavy (slam,
// a rare's heavy swing, bloater, burning pulse): roll just before it lands (else block). An unblockable (charge, volatile blast): roll (else nothing).
// Bolts and arrows flying at it: block. 'careless' never Guards or Evades. The shield arts (Magic Shield, Frost Ward; spec.guard
// swaps one into Guard) are played the same way: they change what the block and parry do, not when to press. A Guard gem that
// isn't a shield would be cast when a hit is coming. Obstacles are cleared so fights repeat.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { parLevel, PAR_GEAR, parBar, parSock, parTree } from '../data/balance.js';
import { ELITE, TIER } from '../data/monsters.js';
import { makeUnique } from './items.js';
import { BAR } from '../data/gems.js';
import { addGem, barGem, readySlots, socketGem, meleeReach } from './gems.js';
import { gearProfile } from './formulas.js';
import { recalc } from './stats.js';
import { clearMap } from './maps.js';
import { spawnEnemy, wake } from './enemies.js';
import { update } from './update.js';
import { makeBot, wantSurge, botTaps, botDefend } from './bot.js';

const DT = .033;
// The scripted player at a tier's par level, gear, bar and supports (or what spec asks for), full life, Surge and flasks.
export function parHero(spec, tier, lvl) {
  Object.assign(P, { lvl, tree: [], treeNew: [], gear: gearProfile(spec.gear || PAR_GEAR(tier), tier), dead: 0, invuln: 0, shield: 0, shieldT: 0, castT: 0,
    blocking: false, parryT: 0, parryCd: 0, posture: 0, broken: 0, riposteT: 0, rollT: 0, apPause: 0, flaskT: 0, kills: 0, staggers: 0, finishers: 0, chans: 0, chanBroken: 0, taken: 0, takenBy: {}, takenType: {}, gems: [], bar: {}, sock: {}, cd: {}, shrined: { main: 1, flexA: 1, flexB: 1, guard: 1, evade: 1 } });
  if (spec.unique) { const u = makeUnique(spec.unique, tier); P.gear[u.slot] = u; }
  const bar = { ...(spec.bar || parBar(tier)) };
  if (spec.gemUnder) for (const s of Object.keys(bar)) bar[s] = [bar[s][0], Math.max(1, bar[s][1] - spec.gemUnder)];
  if (spec.main && bar.main) { bar.main = [spec.main, bar.main[1]]; for (const s of BAR) if (s !== 'main' && bar[s] && bar[s][0] === spec.main) delete bar[s]; }
  if (spec.guard && bar.guard) bar.guard = [spec.guard, bar.guard[1]];
  for (const [slot, [gem, gl]] of Object.entries(bar)) P.bar[slot] = addGem(gem, gl).id;
  for (const [slot, sups] of Object.entries(spec.sock || parSock(tier, bar.main && bar.main[0]))) for (const sup of sups) socketGem(addGem(sup).id, slot);
  P.tree = spec.tree === false ? [] : parTree(lvl, bar.main && bar.main[0], spec.tree || undefined);
  recalc(); readySlots(); P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false; P.surgeWait = 0; P.flask = SK.flask.max;
}

export function arena(spec) {
  const tier = spec.tier || 1, lvl = spec.lvl || parLevel(tier);
  clearMap(); G.tier = tier; G.packs = []; G.bossSpec = null; G.obst = []; G.layout = null; G.mapKills = 0;
  parHero(spec, tier, lvl);
  const bot = makeBot(spec.bot), main = bot.main, mainD = bot.mainD;
  P.x = -8; P.z = 0; // about where a pack wakes in a room
  const pack = { x: 0, z: 0, awake: false, list: [], mem: [] }, foes = [];
  (spec.fight || []).forEach(([t, n], j) => { for (let i = 0; i < n; i++) foes.push(spawnEnemy(t, Math.cos(i * 1.3 + j) * 1.8, Math.sin(i * 1.3 + j) * 1.8, pack, spec.rar || 0)); });
  if (spec.rare) foes.push(spawnEnemy(spec.rare, 1, 0, pack, 2));
  if (spec.elite) { // an elite room: its minions (magic at ELITE.magic odds) round the elite, like game/enemies.js makePack
    const ep = { ...pack, elite: true }, sz = 1 + TIER.packSize * (tier - 1), mag = Math.random() < ELITE.magic ? 1 : 0; let i = 0;
    for (const [t, c] of ELITE.minions) for (let k = 0; k < Math.round(c * sz); k++, i++) foes.push(spawnEnemy(t, Math.cos(i * 1.3) * 1.8, Math.sin(i * 1.3) * 1.8, ep, mag));
    foes.push(spawnEnemy(spec.elite, 1, 0, ep, 2));
  }
  if (spec.guardian) { const b = spawnEnemy('boss', 2, 0, null, 0); b.abilT = 3; b.rot = 0; foes.push(b); }
  foes.forEach(wake);
  const maxT = spec.maxT || 180;
  const melee = mainD && mainD.melee;
  let t = 0, surged = 0, lowest = 1, seq = P.castSeq;
  const n = { parry: 0, blockhit: 0, broken: 0, roll: 0 };
  ctl.autoAtk = true;
  while (t < maxT) {
    const alive = G.enemies.filter(e => !e.deathT);
    if (!foes.some(e => !e.deathT)) break;
    if (P.dead > 0) break;
    // nearest monster, the one to fight (guardian, rares, then nearest) and how crowded it is
    const dd = e => Math.hypot(e.x - P.x, e.z - P.z);
    let near = null, nd = 1e9;
    for (const e of alive) { const d = dd(e); if (d < nd) { nd = d; near = e; } }
    const focus = alive.find(e => e.type === 'boss') || alive.find(e => e.rar === 2 && dd(e) < 6) || near, fd = dd(focus);
    const want = melee ? meleeReach(main.gem) * .75 + focus.r : 9;
    ctl.mx = ctl.mz = 0;
    if (fd > want) { ctl.mx = (focus.x - P.x) / fd; ctl.mz = (focus.z - P.z) / fd; }
    ctl.autoAtk = true;
    ctl.aim = [focus.x, focus.z];
    if (mainD && mainD.held) ctl.main = !melee && fd < 10;
    ctl.surge = spec.surge !== false && wantSurge(alive);
    if (P.surgeK > 0) surged += DT;
    botTaps(bot, alive);
    botDefend(bot, alive, t);
    const fl = P.flask; update(DT); t += DT; if (P.flask < fl - .5) bot.flasks++; lowest = Math.min(lowest, P.life / S.maxLife);
    if (P.castSeq !== seq) { seq = P.castSeq; if (P.lastCast in n) n[P.lastCast]++; }
  }
  ctl.main = false; ctl.guard = false; ctl.surge = false; ctl.tap = {}; ctl.autoAtk = true; ctl.mx = ctl.mz = 0; ctl.aim = null;
  const left = G.enemies.filter(e => !e.deathT && foes.includes(e)).length;
  return {
    result: P.dead > 0 ? 'died' : left ? 'timeout' : 'clear', t: Math.round(t * 10) / 10, kills: P.kills,
    taken: Math.round(P.taken), takenBy: Object.fromEntries(Object.entries(P.takenBy).map(([k, v]) => [k, Math.round(v)])), takenType: Object.fromEntries(Object.entries(P.takenType).map(([k, v]) => [k, Math.round(v)])), lowest: Math.round(lowest * 100) / 100, flasks: bot.flasks, shields: bot.shields, evades: bot.evades, parries: n.parry, blocks: n.blockhit, breaks: n.broken, rolls: n.roll, staggers: P.staggers, finishers: P.finishers, chans: P.chans, chanBroken: P.chanBroken, surged: Math.round(surged * 10) / 10,
    lvl, life: S.maxLife, bar: BAR.filter(s => barGem(s)).map(s => barGem(s).gem + barGem(s).lvl).join(' '), sup: Object.values(S.sk).flatMap(k => k.sup).join(' '),
  };
}
