// Balance arena: one fight with the real game code and a scripted player, no level run needed.
// Used by `npm run arena` (tests/arena.mjs) and `__dbg.arena(spec)` in the browser console.
//   spec: { tier, lvl, gear: 'start' | 'magic' | 'rare', fight: [[type, count], ...], rar: 0 | 1 | 2 (for the whole group),
//           rare: type (adds one rare), guardian: true, maxT: seconds, bot: 'kite' (default) | 'stand' }
// The bot holds Fireball on the nearest monster, kites when they close in ('stand': never kites, a careless player), casts Frost Nova when crowded,
// raises Magic Shield when monsters close in and drinks flasks under half life. Obstacles are cleared so fights repeat.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { parLevel, PAR_GEAR } from '../data/balance.js';
import { gearProfile } from './formulas.js';
import { recalc } from './stats.js';
import { clearMap } from './maps.js';
import { spawnEnemy, wake } from './enemies.js';
import { update } from './update.js';

const DT = .033;

export function arena(spec) {
  const tier = spec.tier || 1, lvl = spec.lvl || parLevel(tier);
  clearMap(); G.tier = tier; G.packs = []; G.bossSpec = null; G.obst = []; G.layout = null; G.mapKills = 0;
  Object.assign(P, { lvl, passives: {}, gear: gearProfile(spec.gear || PAR_GEAR(tier), tier), dead: 0, invuln: 0, novaCd: 0, shield: 0, shieldT: 0, shieldCd: 0, castT: 0, dashT: 0, flaskT: 0, kills: 0, taken: 0 });
  recalc(); P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max; P.dashCh = S.dashMax;
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
    let near = null, nd = 1e9, crowd = 0;
    for (const e of alive) { const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < nd) { nd = d; near = e; } if (d < SK.nova.radius * S.aoe * .8) crowd++; }
    const dx = (P.x - near.x) / (nd || 1), dz = (P.z - near.z) / (nd || 1);
    if (spec.bot === 'stand') ctl.mx = ctl.mz = 0;
    else if (nd < 4) { ctl.mx = dx * .8 - dz * .6; ctl.mz = dz * .8 + dx * .6; }          // back off at an angle (circle-kite)
    else if (nd > 9) { ctl.mx = -dx; ctl.mz = -dz; } else ctl.mx = ctl.mz = 0;        // close to casting range
    ctl.aim = [near.x, near.z]; ctl.fb = true;
    if (P.mana < SK.fireball.cost) starved += DT;
    if (crowd >= 2 && P.novaCd <= 0 && P.mana >= SK.nova.cost) ctl.nova = true;
    if (P.life < S.maxLife * .5 && P.flask >= 1 && P.flaskT <= 0) ctl.flask = true;
    if (nd < 4 && P.shieldCd <= 0 && P.mana >= SK.shield.cost) { ctl.shield = true; shields++; }
    const fl = P.flask; update(DT); t += DT; if (P.flask < fl - .5) flasks++; lowest = Math.min(lowest, P.life / S.maxLife);
  }
  ctl.fb = false; ctl.mx = ctl.mz = 0; ctl.aim = null;
  const left = G.enemies.filter(e => !e.deathT && foes.includes(e)).length;
  return {
    result: P.dead > 0 ? 'died' : left ? 'timeout' : 'clear', t: Math.round(t * 10) / 10, kills: P.kills,
    taken: Math.round(P.taken), lowest: Math.round(lowest * 100) / 100, flasks, shields, starved: Math.round(starved * 10) / 10,
    lvl, life: S.maxLife,
  };
}
