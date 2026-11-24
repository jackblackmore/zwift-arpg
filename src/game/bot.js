// The scripted player's hands: the reaction skill the balance arena (game/arena.js) and the full-level run (game/levelrun.js)
// share. It decides once per threat whether it reacts in time (SKILL), then parries, blocks, rolls, taps press gems, drinks
// flasks and surges like a rider would. Movement is the caller's: the arena walks into reach, the level run uses the autopilot.
// A swing it sees coming: parry (else block, else nothing). A heavy (slam, a rare's heavy swing, bloater, burning pulse): roll
// just before it lands (else block). An unblockable (charge, volatile blast): roll (else nothing). Bolts and arrows flying at it:
// block. 'careless' never Guards or Evades. A Guard gem that isn't a shield is cast when a hit is coming.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { SK } from '../data/skills.js';
import { FIGHT, BLAST, RARE, BOSS } from '../data/monsters.js';
import { GEMS, BAR } from '../data/gems.js';
import { barGem } from './gems.js';

// Reaction skill: the chance it answers each kind of threat in time. smart is a good rider; perfect never misses. brace: a swing
// it will parry is braced for with a held block until the parry moment (a good rider hedges; a perfect one keeps swinging).
export const SKILL = { smart: { parry: .7, roll: .9, bolt: .85, brace: true }, perfect: { parry: 1, roll: 1, bolt: 1, brace: false } };
export const SAVE = 10; // seconds of Surge it keeps back for a guardian's channels

// A bot for the gems on the bar now. kind: 'smart' (default) | 'perfect' | 'careless'.
export function makeBot(kind) {
  const main = barGem('main'), mainD = main && GEMS[main.gem];
  const attacks = BAR.filter(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'attack' && !GEMS[g.gem].held; });
  const guardSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'guard'; });
  const evadeSlot = BAR.find(s => { const g = barGem(s); return g && GEMS[g.gem].kind === 'evade'; });
  const ready = s => { const st = P.cd[s], K = SK[GEMS[barGem(s).gem].sk]; return st.cd <= 0 && (!K.charges || st.ch >= 1); };
  const seen = new WeakMap();
  return {
    main, mainD, attacks, guardSlot, evadeSlot, ready, careless: kind === 'careless', skill: SKILL[kind] || SKILL.smart,
    shieldGuard: guardSlot && GEMS[barGem(guardSlot).gem].shield, flasks: 0, shields: 0, evades: 0,
    // One decision per threat (a monster's swing, a guardian ability, a bolt, a blast): does it react in time?
    react(o, key, p) { let m = seen.get(o); if (!m) seen.set(o, m = {}); if (!(key in m)) m[key] = Math.random() < p ? 'ok' : Math.random() < .5 ? 'block' : 'miss'; return m[key]; },
  };
}

const dd = e => Math.hypot(e.x - P.x, e.z - P.z);
const within = (alive, r) => alive.reduce((n, e) => n + (dd(e) < r ? 1 : 0), 0);

// Does it want to surge? Against a rare or guardian, or when four or more monsters are close. Against a guardian it keeps SAVE s
// of the gauge for its channels, and surges through every channel to break it (BOSS.channel).
export function wantSurge(alive) {
  const chan = alive.some(e => e.channel), boss0 = alive.some(e => e.type === 'boss');
  return chan || ((alive.some(e => e.rar === 2) || boss0 || within(alive, 9) >= 4) && !(boss0 && P.surge < SAVE));
}

// Press gems in attack slots: tap them when enough monsters are within reach (SK[...].bot); a flask under half life.
export function botTaps(bot, alive) {
  const reach = K => (K.bot && K.bot.range) || (K.radius ? K.radius * S.aoe * .8 : K.range) || 9;
  for (const s of bot.attacks) {
    const K = SK[GEMS[barGem(s).gem].sk], need = s === 'main' ? 1 : (K.bot && K.bot.crowd) || 1;
    if (bot.ready(s) && within(alive, reach(K) * (K.radius && barGem(s).gem === 'nova' ? S.sk.nova.novaR : 1)) >= need) ctl.tap[s] = true;
  }
  if (P.life < S.maxLife * .5 && P.flask >= 1 && P.flaskT <= 0) ctl.flask = true;
}

// Guard and Evade for this tick, at the bot's reaction skill. t: seconds into the fight (for burning pulses).
export function botDefend(bot, alive, t) {
  ctl.guard = false;
  if (bot.careless) return;
  const { skill, react, guardSlot, evadeSlot, ready } = bot;
  let nd = 1e9; for (const e of alive) nd = Math.min(nd, dd(e));
  const boss = alive.find(e => e.type === 'boss'), bc = boss && boss.cast;
  const swingAt = alive.filter(e => e.windup > 0 && e.ai !== 'ranged' && dd(e) < e.range + e.r + P.r + FIGHT.reach + .3);
  const inSlam = bc && bc.kind === 'slam' && Math.hypot(P.x - bc.x, P.z - bc.z) < bc.r + P.r;
  if (bot.shieldGuard) {
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
    if (roll && evadeSlot && ready(evadeSlot)) { ctl.tap[evadeSlot] = true; bot.evades++; }
    else { if (tap) ctl.tap[guardSlot] = true; ctl.guard = hold || tap; }
  } else {
    const coming = swingAt.length || (inSlam && bc.t < .5);
    if (guardSlot && ready(guardSlot) && P.shield <= 0 && (coming || (P.life < S.maxLife * .7 && nd < 3))) { ctl.tap[guardSlot] = true; bot.shields++; }
    if (evadeSlot && ready(evadeSlot) && inSlam && bc.t < .25) { ctl.tap[evadeSlot] = true; bot.evades++; }
  }
}
