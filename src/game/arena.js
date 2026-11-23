// Balance arena: one fight with the real game code and a scripted player, no level run needed.
// Used by `npm run arena` (tests/arena.mjs) and `__dbg.arena(spec)` in the browser console.
//   spec: { tier, lvl, gear: 'start' | 'magic' | 'rare', fight: [[type, count], ...], rar: 0 | 1 | 2 (for the whole group),
//           rare: type (adds one rare), guardian: true, maxT: seconds, bot: 'kite' (default) | 'stand',
//           bar: { slot: [gemId, level] } (default: parBar(tier) in data/balance.js), main: gemId (swap the Main gem, same level),
//           sock: { slot: [supportId, ...] } (default: parSock(tier, Main gem); {} for none) }
// The bot uses whatever is on the bar: holds a held Main gem on the nearest monster, kites when they close in ('stand': never kites,
// a careless player), taps press gems (Main or Flex) when enough monsters are in reach (SK[...].bot), raises the Guard gem when
// monsters close in, evades when one is on top of it and life is low, and drinks flasks under half life. Obstacles are cleared so fights repeat.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { parLevel, PAR_GEAR, parBar, parSock } from '../data/balance.js';
import { GEMS, BAR } from '../data/gems.js';
import { addGem, barGem, readySlots, socketGem } from './gems.js';
import { gearProfile } from './formulas.js';
import { recalc } from './stats.js';
import { clearMap } from './maps.js';
import { spawnEnemy, wake } from './enemies.js';
import { update } from './update.js';

const DT = .033;

export function arena(spec) {
  const tier = spec.tier || 1, lvl = spec.lvl || parLevel(tier);
  clearMap(); G.tier = tier; G.packs = []; G.bossSpec = null; G.obst = []; G.layout = null; G.mapKills = 0;
  Object.assign(P, { lvl, passives: {}, gear: gearProfile(spec.gear || PAR_GEAR(tier), tier), dead: 0, invuln: 0, shield: 0, shieldT: 0, castT: 0, flaskT: 0, kills: 0, taken: 0, gems: [], bar: {}, sock: {}, cd: {}, shrined: { main: 1, flexA: 1, flexB: 1, guard: 1, evade: 1 } });
  const bar = { ...(spec.bar || parBar(tier)) };
  if (spec.main && bar.main) { bar.main = [spec.main, bar.main[1]]; for (const s of BAR) if (s !== 'main' && bar[s] && bar[s][0] === spec.main) delete bar[s]; }
  for (const [slot, [gem, gl]] of Object.entries(bar)) P.bar[slot] = addGem(gem, gl).id;
  for (const [slot, sups] of Object.entries(spec.sock || parSock(tier, bar.main && bar.main[0]))) for (const sup of sups) socketGem(addGem(sup).id, slot);
  recalc(); readySlots(); P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max;
  const main = barGem('main'), mainD = main && GEMS[main.gem];
  // Press gems in attack slots: when to tap them (an enemy count within reach, from SK[...].bot).
  const reach = K => (K.bot && K.bot.range) || (K.radius ? K.radius * S.aoe * .8 : K.range) || 9;
  const attacks = BAR.filter(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'attack' && !GEMS[g.gem].held; });
  const guardSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'guard'; });
  const evadeSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'evade'; });
  const ready = s => { const st = P.cd[s], K = SK[GEMS[barGem(s).gem].sk]; return st.cd <= 0 && (!K.charges || st.ch >= 1) && P.mana >= K.cost; };
  P.x = -8; P.z = 0; // about where a pack wakes in a room
  const pack = { x: 0, z: 0, awake: false, list: [], mem: [] }, foes = [];
  (spec.fight || []).forEach(([t, n], j) => { for (let i = 0; i < n; i++) foes.push(spawnEnemy(t, Math.cos(i * 1.3 + j) * 1.8, Math.sin(i * 1.3 + j) * 1.8, pack, spec.rar || 0)); });
  if (spec.rare) foes.push(spawnEnemy(spec.rare, 1, 0, pack, 2));
  if (spec.guardian) { const b = spawnEnemy('boss', 2, 0, null, 0); b.abilT = 3; b.rot = 0; foes.push(b); }
  foes.forEach(wake);
  const maxT = spec.maxT || 180;
  let t = 0, starved = 0, flasks = 0, shields = 0, lowest = 1;
  while (t < maxT) {
    const alive = G.enemies.filter(e => !e.deathT);
    if (!foes.some(e => !e.deathT)) break;
    if (P.dead > 0) break;
    // nearest monster and how crowded it is
    let near = null, nd = 1e9;
    for (const e of alive) { const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < nd) { nd = d; near = e; } }
    const within = r => alive.reduce((n, e) => n + (Math.hypot(e.x - P.x, e.z - P.z) < r ? 1 : 0), 0);
    const dx = (P.x - near.x) / (nd || 1), dz = (P.z - near.z) / (nd || 1);
    if (spec.bot === 'stand') ctl.mx = ctl.mz = 0;
    else if (nd < 4) { ctl.mx = dx * .8 - dz * .6; ctl.mz = dz * .8 + dx * .6; }          // back off at an angle (circle-kite)
    else if (nd > 9) { ctl.mx = -dx; ctl.mz = -dz; } else ctl.mx = ctl.mz = 0;        // close to casting range
    ctl.aim = [near.x, near.z];
    if (mainD && mainD.held) ctl.main = true;
    if (mainD && P.mana < SK[mainD.sk].cost) starved += DT;
    for (const s of attacks) {
      const K = SK[GEMS[barGem(s).gem].sk], need = s === 'main' ? 1 : (K.bot && K.bot.crowd) || 1;
      if (ready(s) && within(reach(K) * (K.radius && barGem(s).gem === 'nova' ? S.sk.nova.novaR : 1)) >= need) ctl.tap[s] = true;
    }
    if (P.life < S.maxLife * .5 && P.flask >= 1 && P.flaskT <= 0) ctl.flask = true;
    if (guardSlot && nd < 4 && ready(guardSlot)) { ctl.tap[guardSlot] = true; shields++; }
    if (evadeSlot && nd < 2 && P.life < S.maxLife * .6 && ready(evadeSlot)) ctl.tap[evadeSlot] = true;
    const fl = P.flask; update(DT); t += DT; if (P.flask < fl - .5) flasks++; lowest = Math.min(lowest, P.life / S.maxLife);
  }
  ctl.main = false; ctl.tap = {}; ctl.mx = ctl.mz = 0; ctl.aim = null;
  const left = G.enemies.filter(e => !e.deathT && foes.includes(e)).length;
  return {
    result: P.dead > 0 ? 'died' : left ? 'timeout' : 'clear', t: Math.round(t * 10) / 10, kills: P.kills,
    taken: Math.round(P.taken), lowest: Math.round(lowest * 100) / 100, flasks, shields, starved: Math.round(starved * 10) / 10,
    lvl, life: S.maxLife, bar: BAR.filter(s => barGem(s)).map(s => barGem(s).gem + barGem(s).lvl).join(' '), sup: Object.values(S.sk).flatMap(k => k.sup).join(' '),
  };
}
