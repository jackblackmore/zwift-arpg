// Full-level run: the RIDE autopilot plays a whole generated level, entrance to guardian killed, with the arena bot's hands
// (game/bot.js: parry, block, roll, flasks, Surge at a reaction skill) at the tier's par level, gear, bar and supports. It rides
// at the par effort (data/balance.js LEVEL_TIME: endurance pace, harder when it surges) and never picks a way at a junction, so
// the default (clear everything) runs and every junction costs the full wait. Used by `npm run level` (tests/level.mjs) and
// `__dbg.levelRun(spec)` in the browser console (it replaces the current map and character, and picking up loot saves).
//   spec: { tier, seed (layout seed, like ?seed=: the map viewer's seed + tier − 1; 0 = random), bot: 'smart' | 'perfect' |
//           'careless', maxMin: give up after this many game minutes }
// Every tick of game time goes in one bucket: fight (a monster the autopilot would engage is near), guardian (the same, with the
// guardian awake), junction (stopped at a junction waiting for a pick), loot (walking to a drop), walk (walking anywhere else),
// dead (waiting to respawn) or idle (standing with nothing to do: shouldn't happen). hitstop: the real time big hits freeze the game
// for, on top (the total includes it).
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { RIDE } from '../data/ride.js';
import { parLevel, LEVEL_TIME } from '../data/balance.js';
import { dist } from '../core/util.js';
import { los } from '../world/map.js';
import { parHero } from './arena.js';
import { newMap } from './maps.js';
import { update } from './update.js';
import { updFx } from '../render/fx.js';
import { resetAutopilot } from './autopilot.js';
import { makeBot, wantSurge, botTaps, botDefend } from './bot.js';

const DT = .033;

export function levelRun(spec = {}) {
  const tier = spec.tier || 1, lvl = parLevel(tier), L = LEVEL_TIME, A = RIDE.autopilot, maxT = (spec.maxMin || 90) * 60;
  const seed0 = G.devSeed, save0 = G.saveT; G.devSeed = spec.seed || 0; G.saveT = 1e9; // don't overwrite the player's save
  G.tier = tier; parHero({}, tier, lvl); P.xp = 0; P.kills = 0; P.inv = []; P.newItems = 0;
  newMap(tier); G.devSeed = seed0; G.hitStop = 0; Object.assign(P, { face: 0, moveX: 0, moveZ: 1, castAnim: 0, walkT: 0, atkN: 0, swingTok: 0, postWait: 0 }); resetAutopilot(); // a run doesn't inherit the last one's swing count or sidestep
  const bot = makeBot(spec.bot), Lay = G.layout;
  const b = { walk: 0, loot: 0, fight: 0, guardian: 0, junction: 0, dead: 0, idle: 0, hitstop: 0 };
  const n = { parry: 0, blockhit: 0, broken: 0, roll: 0 };
  let t = 0, deaths = 0, junctions = 0, surged = 0, lowest = 1, seq = P.castSeq, jn = null, walked = 0, lx = P.x, lz = P.z;
  Object.assign(ctl, { auto: true, autoAtk: true, mx: 0, mz: 0, aim: null, tapDir: null, guard: false, main: false, surge: false, tap: {} });
  const boss = () => G.bossSpec && G.bossSpec.e;
  // Stuck: no kill for `STALL` s of game time (an autopilot bug, not slow play): stop and say where.
  let lastKill = 0, kills = 0, stuck = null; const STALL = 180;
  while (t < maxT && !(boss() && boss().deathT)) {
    if (P.kills !== kills) { kills = P.kills; lastKill = t; }
    if (t - lastKill > STALL) { const pk = G.packs.filter(p => !p.spawned || p.list.some(e => !e.deathT)).sort((a, c) => dist(a.x, a.z, P.x, P.z) - dist(c.x, c.z, P.x, P.z))[0]; stuck = { x: Math.round(P.x), z: Math.round(P.z), goal: G.goal && G.goal.to, pack: pk && { x: Math.round(pk.x), z: Math.round(pk.z), room: pk.room, spawned: pk.spawned, alive: pk.list.filter(e => !e.deathT).map(e => [e.type, Math.round(e.x), Math.round(e.z), e.awake]) } }; break; }
    // What the autopilot would fight: living monsters within its engage range that are awake or in sight.
    const near = G.enemies.filter(e => !e.deathT && dist(e.x, e.z, P.x, P.z) < A.engage && (e.awake || los(P.x, P.z, e.x, e.z)));
    const surge = P.dead <= 0 && wantSurge(near);
    ctl.effort = { pw: 0, rel: surge ? (near.some(e => e.channel) ? L.spike : L.surge) : L.pace, cad: L.cad };
    ctl.effort.pw = ctl.effort.rel * RIDE.ftp;
    ctl.tap = {}; ctl.flask = false;
    if (P.dead <= 0) { botTaps(bot, near); botDefend(bot, near, t); } else ctl.guard = false;
    const dead = P.dead > 0, fl = P.flask;
    update(DT); updFx(DT); t += DT;
    // Hit-stop freezes the game for a moment on big hits (main.js skips updates meanwhile): real time, counted on top.
    if (G.hitStop > 0) { b.hitstop += G.hitStop; G.hitStop = 0; }
    if (P.flask < fl - .5) bot.flasks++;
    if (!dead && P.dead > 0) deaths++;
    if (P.surgeK > 0) surged += DT;
    if (P.castSeq !== seq) { seq = P.castSeq; if (P.lastCast in n) n[P.lastCast]++; }
    if (P.dead <= 0) lowest = Math.min(lowest, P.life / S.maxLife);
    const step = Math.hypot(P.x - lx, P.z - lz); if (step < 3) walked += step; lx = P.x; lz = P.z; // (not the respawn jump)
    if (G.jn && G.jn !== jn) { jn = G.jn; junctions++; }
    const k = dead ? 'dead' : near.length ? (near.some(e => e.type === 'boss' && e.awake) ? 'guardian' : 'fight')
      : G.jn && G.jn.mode === 'wait' ? 'junction'
      : !P.moving ? 'idle' : G.ground.some(d => d.landed && !d.gone && dist(d.x, d.z, P.x, P.z) < A.loot) ? 'loot' : 'walk';
    b[k] += DT;
  }
  Object.assign(ctl, { auto: false, effort: null, guard: false, main: false, surge: false, tap: {}, mx: 0, mz: 0 });
  G.saveT = save0;
  const m = x => Math.round(x / 60 * 100) / 100, packs = G.packs.length, leftP = G.packs.filter(p => !p.spawned || p.list.some(e => !e.deathT)), left = leftP.length;
  return {
    result: boss() && boss().deathT ? 'clear' : stuck ? 'stuck' : 'timeout', stuck, tier, lvl, endLvl: P.lvl, seed: spec.seed || 0, min: m(t + b.hitstop), split: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, m(v)])),
    deaths, junctions, packs, packsLeft: left, rooms: Lay.rooms.length, routeLen: Math.round(Lay.routeLen), walked: Math.round(walked), kills: P.kills,
    taken: Math.round(P.taken), lowest: Math.round(lowest * 100) / 100, flasks: bot.flasks, parries: n.parry, blocks: n.blockhit, rolls: n.roll, breaks: n.broken,
    surged: m(surged), items: P.inv.length, leftAt: leftP.map(p => ({ x: Math.round(p.x), z: Math.round(p.z), rank: p.rank, room: p.room, spawned: p.spawned, bossD: Math.round(dist(p.x, p.z, G.bossSpot.x, G.bossSpot.z)) })),
  };
}
