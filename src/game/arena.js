// Balance arena: one fight with the real game code and a scripted player, no level run needed.
// Used by `npm run arena` (tests/arena.mjs) and `__dbg.arena(spec)` in the browser console.
//   spec: { tier, lvl, gear: 'start' | 'magic' | 'rare', fight: [[type, count], ...], rar: 0 | 1 | 2 (for the whole group),
//           rare: type (adds one rare), guardian: true, maxT: seconds, bot: 'smart' (default) | 'perfect' | 'careless',
//           bar: { slot: [gemId, level] } (default: parBar(tier) in data/balance.js), main: gemId (swap the Main gem, same level),
//           sock: { slot: [supportId, ...] } (default: parSock(tier, Main gem); {} for none), surge: false (never surge),
//           guard: gemId (swap the Guard gem, same level, e.g. a shield art) }
// The bot uses whatever is on the bar. With a melee Main gem it walks into reach of its target (guardian and rares first, then the
// nearest) and lets the auto-attack swing; a held ranged gem is held on the target from casting range. It taps press gems (Main or
// Flex) when enough monsters are in reach (SK[...].bot), drinks flasks under half life, and surges against rares, guardians and
// crowds of four or more. It never steps out of anything: like the autopilot, it stands in reach, so defence is all timing
// (design notes "Fight mechanics"). With the Knight's Shield and Roll it plays the timing game at a reaction skill (SKILL below):
// it decides once per threat whether it reacts in time. Against a guardian it keeps some Surge back and surges through its channels. A swing it sees coming: parry (else block, else nothing). A heavy (slam,
// a rare's heavy swing, bloater, burning pulse): roll just before it lands (else block). An unblockable (charge, volatile blast): roll (else nothing).
// Bolts and arrows flying at it: block. 'careless' never Guards or Evades. The shield arts (Magic Shield, Frost Ward; spec.guard
// swaps one into Guard) are played the same way: they change what the block and parry do, not when to press. A Guard gem that
// isn't a shield would be cast when a hit is coming. Obstacles are cleared so fights repeat.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { FIGHT, BLAST, RARE, BOSS } from '../data/monsters.js';
import { parLevel, PAR_GEAR, parBar, parSock } from '../data/balance.js';
import { GEMS, BAR } from '../data/gems.js';
import { addGem, barGem, readySlots, socketGem, meleeReach } from './gems.js';
import { gearProfile } from './formulas.js';
import { recalc } from './stats.js';
import { clearMap } from './maps.js';
import { spawnEnemy, wake } from './enemies.js';
import { update } from './update.js';

const DT = .033;
// Reaction skill: the chance it answers each kind of threat in time. smart is a good rider; perfect never misses. brace: a swing
// it will parry is braced for with a held block until the parry moment (a good rider hedges; a perfect one keeps swinging).
const SKILL = { smart: { parry: .7, roll: .9, bolt: .85, brace: true }, perfect: { parry: 1, roll: 1, bolt: 1, brace: false } };
const SAVE = 10; // seconds of Surge it keeps back for a guardian's channels

export function arena(spec) {
  const tier = spec.tier || 1, lvl = spec.lvl || parLevel(tier);
  clearMap(); G.tier = tier; G.packs = []; G.bossSpec = null; G.obst = []; G.layout = null; G.mapKills = 0;
  Object.assign(P, { lvl, passives: {}, gear: gearProfile(spec.gear || PAR_GEAR(tier), tier), dead: 0, invuln: 0, shield: 0, shieldT: 0, castT: 0,
    blocking: false, parryT: 0, parryCd: 0, posture: 0, broken: 0, riposteT: 0, rollT: 0, apPause: 0, flaskT: 0, kills: 0, staggers: 0, finishers: 0, chans: 0, chanBroken: 0, taken: 0, takenBy: {}, gems: [], bar: {}, sock: {}, cd: {}, shrined: { main: 1, flexA: 1, flexB: 1, guard: 1, evade: 1 } });
  const bar = { ...(spec.bar || parBar(tier)) };
  if (spec.main && bar.main) { bar.main = [spec.main, bar.main[1]]; for (const s of BAR) if (s !== 'main' && bar[s] && bar[s][0] === spec.main) delete bar[s]; }
  if (spec.guard && bar.guard) bar.guard = [spec.guard, bar.guard[1]];
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
  const melee = mainD && mainD.melee, careless = spec.bot === 'careless', skill = SKILL[spec.bot] || SKILL.smart;
  const shieldGuard = guardSlot && GEMS[barGem(guardSlot).gem].shield;
  let t = 0, surged = 0, flasks = 0, shields = 0, evades = 0, lowest = 1, seq = P.castSeq;
  const n = { parry: 0, blockhit: 0, broken: 0, roll: 0 };
  // One decision per threat (a monster's swing, a guardian ability, a bolt, a blast): does it react in time?
  const seen = new WeakMap(), react = (o, key, p) => { let m = seen.get(o); if (!m) seen.set(o, m = {}); if (!(key in m)) m[key] = Math.random() < p ? 'ok' : Math.random() < .5 ? 'block' : 'miss'; return m[key]; };
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
    ctl.autoAtk = true;
    ctl.aim = [focus.x, focus.z];
    if (mainD && mainD.held) ctl.main = !melee && fd < 10;
    // Surge (unless spec.surge === false) against a rare or guardian, or when four or more monsters are close. Against a guardian it
    // keeps SAVE s of the gauge for its channels, and surges through every channel to break it (BOSS.channel).
    const chan = alive.some(e => e.channel), boss0 = alive.some(e => e.type === 'boss');
    ctl.surge = spec.surge !== false && (chan || ((alive.some(e => e.rar === 2) || boss0 || within(9) >= 4) && !(boss0 && P.surge < SAVE)));
    if (P.surgeK > 0) surged += DT;
    for (const s of attacks) {
      const K = SK[GEMS[barGem(s).gem].sk], need = s === 'main' ? 1 : (K.bot && K.bot.crowd) || 1;
      if (ready(s) && within(reach(K) * (K.radius && barGem(s).gem === 'nova' ? S.sk.nova.novaR : 1)) >= need) ctl.tap[s] = true;
    }
    if (P.life < S.maxLife * .5 && P.flask >= 1 && P.flaskT <= 0) ctl.flask = true;
    ctl.guard = false;
    if (!careless) {
      const boss = alive.find(e => e.type === 'boss'), bc = boss && boss.cast;
      const swingAt = alive.filter(e => e.windup > 0 && e.ai !== 'ranged' && dd(e) < e.range + e.r + P.r + FIGHT.reach + .3);
      const inSlam = bc && bc.kind === 'slam' && Math.hypot(P.x - bc.x, P.z - bc.z) < bc.r + P.r;
      if (shieldGuard) {
        let hold = false, tap = false, roll = false;
        const B = SK.block, rollIn = SK.roll.invuln * .6;
        // Heavies: roll as they land, else block.
        const heavy = (o, key, left) => { const r = react(o, key, skill.roll); if (r === 'ok') { if (left <= rollIn) roll = true; } else if (r === 'block') hold = true; };
        // Swings: parry just before they land, else hold the block (or eat it). A rare's heavy swing is a heavy.
        for (const e of swingAt) { if (e.heavy) { heavy(e, 'swing' + e.atkSeq, e.windup); continue; } const r = react(e, 'swing' + e.atkSeq, skill.parry); if (r === 'ok') { if (e.windup <= B.parry * .7) tap = true; else hold = hold || (skill.brace && e.windup < B.parry * 2); } else if (r === 'block') hold = true; }
        if (inSlam) heavy(bc, 'slam', bc.t);
        if (bc && bc.kind === 'charge') { const r = react(bc, 'charge', skill.roll); if (r === 'ok' && bc.t <= .12) roll = true; }
        if (bc && bc.kind === 'burst' && Math.hypot(P.x - boss.x, P.z - boss.z) < BOSS.channel.burst.r + P.r && react(bc, 'burst', skill.roll) === 'ok' && bc.t <= rollIn) roll = true;
        for (const e of alive) {
          if (e.fuse > 0 && dd(e) < BLAST.bloater.r + P.r) heavy(e, 'fuse', e.fuse);
          if (e.fireAura && dd(e) < RARE.burning.r + P.r && e.auraT < RARE.burning.windup) heavy(e, 'pulse' + Math.floor(t / RARE.burning.every), e.auraT);
        }
        for (const q of G.queue) if (q.k === 'bloat' && Math.hypot(P.x - q.x, P.z - q.z) < q.r + P.r) { if (q.kind === 'unblockable') { if (react(q, 'blast', skill.roll) === 'ok' && q.t <= rollIn) roll = true; } else heavy(q, 'blast', q.t); }
        // Bolts and arrows flying at it: block them.
        for (const p of G.eproj) { const dx = P.x - p.x, dz = P.z - p.z, dl = Math.hypot(dx, dz); if (dl < 3.5 && (p.vx * dx + p.vz * dz) > 0 && react(p, 'bolt', skill.bolt) === 'ok') hold = true; }
        if (roll && evadeSlot && ready(evadeSlot)) { ctl.tap[evadeSlot] = true; evades++; }
        else { if (tap) ctl.tap[guardSlot] = true; ctl.guard = hold || tap; }
      } else {
        const coming = swingAt.length || (inSlam && bc.t < .5);
        if (guardSlot && ready(guardSlot) && P.shield <= 0 && (coming || (P.life < S.maxLife * .7 && nd < 3))) { ctl.tap[guardSlot] = true; shields++; }
        if (evadeSlot && ready(evadeSlot) && inSlam && bc.t < .25) { ctl.tap[evadeSlot] = true; evades++; }
      }
    }
    const fl = P.flask; update(DT); t += DT; if (P.flask < fl - .5) flasks++; lowest = Math.min(lowest, P.life / S.maxLife);
    if (P.castSeq !== seq) { seq = P.castSeq; if (P.lastCast in n) n[P.lastCast]++; }
  }
  ctl.main = false; ctl.guard = false; ctl.surge = false; ctl.tap = {}; ctl.autoAtk = true; ctl.mx = ctl.mz = 0; ctl.aim = null;
  const left = G.enemies.filter(e => !e.deathT && foes.includes(e)).length;
  return {
    result: P.dead > 0 ? 'died' : left ? 'timeout' : 'clear', t: Math.round(t * 10) / 10, kills: P.kills,
    taken: Math.round(P.taken), takenBy: Object.fromEntries(Object.entries(P.takenBy).map(([k, v]) => [k, Math.round(v)])), lowest: Math.round(lowest * 100) / 100, flasks, shields, evades, parries: n.parry, blocks: n.blockhit, breaks: n.broken, rolls: n.roll, staggers: P.staggers, finishers: P.finishers, chans: P.chans, chanBroken: P.chanBroken, surged: Math.round(surged * 10) / 10,
    lvl, life: S.maxLife, bar: BAR.filter(s => barGem(s)).map(s => barGem(s).gem + barGem(s).lvl).join(' '), sup: Object.values(S.sk).flatMap(k => k.sup).join(' '),
  };
}
