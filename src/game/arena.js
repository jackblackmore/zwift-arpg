// Balance arena: one fight with the real game code and a scripted player, no level run needed.
// Used by `npm run arena` (tests/arena.mjs) and `__dbg.arena(spec)` in the browser console.
//   spec: { tier, lvl, gear: 'start' | 'magic' | 'rare', fight: [[type, count], ...], rar: 0 | 1 | 2 (for the whole group),
//           rare: type (adds one rare), guardian: true, maxT: seconds, bot: 'smart' (default) | 'careless',
//           bar: { slot: [gemId, level] } (default: parBar(tier) in data/balance.js), main: gemId (swap the Main gem, same level),
//           sock: { slot: [supportId, ...] } (default: parSock(tier, Main gem); {} for none), surge: false (never surge) }
// The bot uses whatever is on the bar. With a melee Main gem it walks into reach of its target (guardian and rares first, then the
// nearest) and lets the auto-attack swing; a held ranged gem is held on the target from casting range. It taps press gems (Main or
// Flex) when enough monsters are in reach (SK[...].bot), drinks flasks under half life, and surges against rares, guardians and
// crowds of four or more. 'smart' (default) also plays the timing game: Guard when a hit is coming (a monster in reach winding up,
// the guardian's slam on you) or life drops under 70%, step out of the guardian's slam, and Evade when it can't step out in time or
// is low and surrounded. 'careless' never Guards, Evades or steps out. Obstacles are cleared so fights repeat.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { parLevel, PAR_GEAR, parBar, parSock } from '../data/balance.js';
import { GEMS, BAR } from '../data/gems.js';
import { addGem, barGem, readySlots, socketGem, meleeReach } from './gems.js';
import { gearProfile } from './formulas.js';
import { recalc } from './stats.js';
import { clearMap } from './maps.js';
import { spawnEnemy, wake } from './enemies.js';
import { update } from './update.js';

const DT = .033;

export function arena(spec) {
  const tier = spec.tier || 1, lvl = spec.lvl || parLevel(tier);
  clearMap(); G.tier = tier; G.packs = []; G.bossSpec = null; G.obst = []; G.layout = null; G.mapKills = 0;
  Object.assign(P, { lvl, passives: {}, gear: gearProfile(spec.gear || PAR_GEAR(tier), tier), dead: 0, invuln: 0, shield: 0, shieldT: 0, castT: 0, flaskT: 0, kills: 0, taken: 0, takenBy: {}, gems: [], bar: {}, sock: {}, cd: {}, shrined: { main: 1, flexA: 1, flexB: 1, guard: 1, evade: 1 } });
  const bar = { ...(spec.bar || parBar(tier)) };
  if (spec.main && bar.main) { bar.main = [spec.main, bar.main[1]]; for (const s of BAR) if (s !== 'main' && bar[s] && bar[s][0] === spec.main) delete bar[s]; }
  for (const [slot, [gem, gl]] of Object.entries(bar)) P.bar[slot] = addGem(gem, gl).id;
  for (const [slot, sups] of Object.entries(spec.sock || parSock(tier, bar.main && bar.main[0]))) for (const sup of sups) socketGem(addGem(sup).id, slot);
  recalc(); readySlots(); P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false; P.surgeWait = 0; P.flask = SK.flask.max;
  const main = barGem('main'), mainD = main && GEMS[main.gem];
  // Press gems in attack slots: when to tap them (an enemy count within reach, from SK[...].bot).
  const reach = K => (K.bot && K.bot.range) || (K.radius ? K.radius * S.aoe * .8 : K.range) || 9;
  const attacks = BAR.filter(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'attack' && !GEMS[g.gem].held; });
  const guardSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'guard'; });
  const evadeSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'evade'; });
  const ready = s => { const st = P.cd[s], K = SK[GEMS[barGem(s).gem].sk]; return st.cd <= 0 && (!K.charges || st.ch >= 1); };
  P.x = -8; P.z = 0; // about where a pack wakes in a room
  const pack = { x: 0, z: 0, awake: false, list: [], mem: [] }, foes = [];
  (spec.fight || []).forEach(([t, n], j) => { for (let i = 0; i < n; i++) foes.push(spawnEnemy(t, Math.cos(i * 1.3 + j) * 1.8, Math.sin(i * 1.3 + j) * 1.8, pack, spec.rar || 0)); });
  if (spec.rare) foes.push(spawnEnemy(spec.rare, 1, 0, pack, 2));
  if (spec.guardian) { const b = spawnEnemy('boss', 2, 0, null, 0); b.abilT = 3; b.rot = 0; foes.push(b); }
  foes.forEach(wake);
  const maxT = spec.maxT || 180;
  const melee = mainD && mainD.melee, careless = spec.bot === 'careless';
  let t = 0, surged = 0, flasks = 0, shields = 0, evades = 0, lowest = 1;
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
    const within = r => alive.reduce((n, e) => n + (dd(e) < r ? 1 : 0), 0);
    const want = melee ? meleeReach(main.gem) * .75 + focus.r : 9;
    ctl.mx = ctl.mz = 0;
    if (fd > want) { ctl.mx = (focus.x - P.x) / fd; ctl.mz = (focus.z - P.z) / fd; }
    // The guardian's slam lands where you stood when it started: a smart bot steps out, or evades if it's late.
    const boss = alive.find(e => e.type === 'boss'), slam = boss && boss.cast && boss.cast.kind === 'slam' ? boss.cast : null;
    const inSlam = slam && Math.hypot(P.x - slam.x, P.z - slam.z) < slam.r + P.r + .3;
    ctl.autoAtk = true;
    if (inSlam && !careless) { // out of the circle, away from its centre (or from the guardian if standing on the centre), sideways
      const sd = Math.hypot(P.x - slam.x, P.z - slam.z), o = sd > .3 ? slam : boss, od = Math.hypot(P.x - o.x, P.z - o.z) || 1;
      const ax = (P.x - o.x) / od, az = (P.z - o.z) / od; ctl.mx = ax * .6 - az * .8; ctl.mz = az * .6 + ax * .8; ctl.autoAtk = false;
    }
    ctl.aim = [focus.x, focus.z];
    if (mainD && mainD.held) ctl.main = !melee && fd < 10;
    // Surge (unless spec.surge === false) against a rare or guardian, or when four or more monsters are close.
    ctl.surge = spec.surge !== false && (alive.some(e => e.rar === 2 || e.type === 'boss') || within(9) >= 4);
    if (P.surgeK > 0) surged += DT;
    for (const s of attacks) {
      const K = SK[GEMS[barGem(s).gem].sk], need = s === 'main' ? 1 : (K.bot && K.bot.crowd) || 1;
      if (ready(s) && within(reach(K) * (K.radius && barGem(s).gem === 'nova' ? S.sk.nova.novaR : 1)) >= need) ctl.tap[s] = true;
    }
    if (P.life < S.maxLife * .5 && P.flask >= 1 && P.flaskT <= 0) ctl.flask = true;
    if (!careless) {
      const coming = alive.some(e => e.windup > 0 && dd(e) < e.r + (e.range || 1) + 1.2) || (inSlam && slam.t < .5);
      if (guardSlot && ready(guardSlot) && P.shield <= 0 && (coming || (P.life < S.maxLife * .7 && nd < 3))) { ctl.tap[guardSlot] = true; shields++; }
      if (evadeSlot && ready(evadeSlot) && ((inSlam && slam.t < .25) || (P.life < S.maxLife * .4 && within(2.5) >= 3))) {
        const from = inSlam ? slam : near, ad = Math.hypot(P.x - from.x, P.z - from.z) || 1; // dash away from the danger
        ctl.aim = [P.x + (P.x - from.x) / ad * 6, P.z + (P.z - from.z) / ad * 6]; ctl.tap[evadeSlot] = true; evades++;
      }
    }
    const fl = P.flask; update(DT); t += DT; if (P.flask < fl - .5) flasks++; lowest = Math.min(lowest, P.life / S.maxLife);
  }
  ctl.main = false; ctl.surge = false; ctl.tap = {}; ctl.autoAtk = true; ctl.mx = ctl.mz = 0; ctl.aim = null;
  const left = G.enemies.filter(e => !e.deathT && foes.includes(e)).length;
  return {
    result: P.dead > 0 ? 'died' : left ? 'timeout' : 'clear', t: Math.round(t * 10) / 10, kills: P.kills,
    taken: Math.round(P.taken), takenBy: Object.fromEntries(Object.entries(P.takenBy).map(([k, v]) => [k, Math.round(v)])), lowest: Math.round(lowest * 100) / 100, flasks, shields, evades, surged: Math.round(surged * 10) / 10,
    lvl, life: S.maxLife, bar: BAR.filter(s => barGem(s)).map(s => barGem(s).gem + barGem(s).lvl).join(' '), sup: Object.values(S.sk).flatMap(k => k.sup).join(' '),
  };
}
