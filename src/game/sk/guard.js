// Knight's Shield, the starting Guard gem (design notes "Fight mechanics"; tuning SK.block in data/skills.js).
// Hold Guard to block hits from the front: less damage, but each blocked hit fills your posture bar, and a full bar breaks your
// guard (stunned, taking extra damage). Press Guard just before a hit lands to parry: no damage, almost no posture, the attacker
// staggers, and your next swing is a riposte. Raising the shield or rolling cancels the swing you were winding up (the Main gem
// auto-attacks, so you didn't choose to commit to it). Unblockable attacks go through a block and break your guard.
// Shield arts (Magic Shield, Frost Ward; game/sk/arts.js) are Guard gems that keep all of this and change it: SK[art].guard
// overrides the block numbers, and the art's parry() and block() run on a parry or a blocked hit.
// The passive tree (data/tree.js) tunes the numbers (S.fight) and its keystones change the rules (S.ks): Riposte (every parry
// ripostes at once, blocking costs more posture), Bulwark (no slow while blocking, less posture, no parry), Duelist (a longer
// parry window, no block).
import { G, P, S, shake, stop } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { GEMS } from '../../data/gems.js';
import { TELL } from '../../data/graphics.js';
import { dist } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { flashFx, ringFx, floatT, burst } from '../../render/fx.js';
import { barGem } from '../gems.js';
import { cancelSwing } from './strike.js';
import { parried } from '../combat.js';
import { ART } from './arts.js';
import { counter } from './strike.js';
import { TREE_CAP } from '../../data/tree.js';

const wrap = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
const hex = c => '#' + c.toString(16).padStart(6, '0');
// Is the Guard slot's gem the shield?
export const hasShield = () => { const g = barGem('guard'); return !!g && !!GEMS[g.gem].shield; };
// The shield art in Guard (a GEMS id with `art`), or null for the plain Knight's Shield.
export const guardArt = () => { const g = barGem('guard'); return (g && GEMS[g.gem].art) || null; };
// The block numbers in use: SK.block with the art's overrides, then the passive tree's (S.fight, S.ks). noParry: a press only
// blocks (Bulwark); noBlock: holding Guard doesn't block, only the parry window does (Duelist).
export function blockStats() {
  const a = guardArt(), B = { ...SK.block, ...(a && SK[a].guard) }, F = S.fight, K = S.ks || {};
  if (!F) return B;
  B.block = Math.min(TREE_CAP.block, B.block + F.block); B.heavy = Math.min(TREE_CAP.block, B.heavy + F.heavy); B.elem = Math.min(TREE_CAP.block, B.elem + F.heavy);
  B.posture *= (1 - F.posture) * (K.riposte ? 1 + K.riposte.posture : 1) * (K.bulwark ? 1 - K.bulwark.posture : 1);
  B.drain *= F.drain; B.parry *= F.parry * (K.duelist ? 1 + K.duelist.parry : 1); B.riposte *= F.riposte;
  if (K.bulwark) { B.move = 1; B.noParry = true; }
  if (K.duelist) B.noBlock = true;
  return B;
}

// Every tick from updPlayer. down: Guard held; tapped: Guard pressed since last tick.
export function updGuard(dt, down, tapped) {
  const B = blockStats();
  P.parryT -= dt; P.parryCd -= dt; P.riposteT -= dt;
  if (P.broken > 0) { P.broken -= dt; P.blocking = false; P.parryT = 0; return; }
  P.postWait -= dt; if (P.postWait <= 0) P.posture = Math.max(0, P.posture - B.drain * dt);
  if (!hasShield() || P.dead > 0 || P.rollT > 0) { P.blocking = false; return; }
  const was = P.blocking;
  if (tapped && P.parryCd <= 0) { P.parryT = B.parry; P.parryCd = B.parryCd; }
  P.blocking = (down && !B.noBlock) || P.parryT > 0;
  if (P.blocking && !was) { cancelSwing(); P.castSeq++; P.lastCast = 'block'; }
  if (P.blocking) { const t = threat(); if (t) P.face = Math.atan2(t.x - P.x, t.z - P.z); }
}

// What to turn the shield toward: the guardian or a rare close by, else the nearest awake monster.
function threat() {
  let best = null, bs = -1e9;
  for (const e of G.enemies) {
    if (e.deathT || !e.awake) continue;
    const d = dist(e.x, e.z, P.x, P.z); if (d > 9) continue;
    const sc = (e.windup > 0 || e.cast ? 50 : 0) + (e.type === 'boss' ? 30 : e.rar === 2 ? 20 : 0) - d * 3;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}

// A hit is about to land on you. d: its damage; o: { from: {x, z} where it comes from, kind: 'hit' | 'heavy' | 'unblockable',
// by: the monster (for a parry's stagger), elem: elemental }. Returns the damage left after the shield and sets o.result.
export function shieldHit(d, o) {
  const B = blockStats(), kind = o.kind || 'hit', art = ART[guardArt()];
  if (P.broken > 0) { o.result = 'broken'; return d * B.brokenMul; }
  if (!P.blocking || !o.from) return d;
  const dd = dist(o.from.x, o.from.z, P.x, P.z), off = Math.abs(wrap(Math.atan2(o.from.x - P.x, o.from.z - P.z) - P.face));
  if (dd > .2 && off > B.arc / 2 * Math.PI / 180) return d; // from the side or behind
  if (B.noBlock && !(kind === 'hit' && P.parryT > 0)) return d; // Duelist: only a parry stops it
  if (kind === 'unblockable') { breakGuard(); o.result = 'broken'; return d; }
  const cost = d / S.maxLife * B.posture;
  if (kind === 'hit' && P.parryT > 0 && !B.noParry) {
    P.posture = Math.min(.99, P.posture + cost * B.parryPosture); P.postWait = B.drainDelay;
    P.parryCd = 0; P.riposteT = B.riposte > 1 ? B.riposteT : 0; P.riposteMul = B.riposte; P.castSeq++; P.lastCast = 'parry'; o.result = 'parry';
    const fx = P.x + Math.sin(P.face) * .7, fz = P.z + Math.cos(P.face) * .7;
    flashFx(fx, 1.2, fz, TELL.parry, 3.2, .25); burst(fx, 1.2, fz, TELL.parry, 18, 6); floatT(P.x, 2.6, P.z, 'PARRY', hex(TELL.parry), 16);
    SFX.parry(); stop(.09); shake(.12);
    if (o.by) parried(o.by);
    if (art) art.parry(o.by);
    if (S.ks && S.ks.riposte && o.by) { const g = barGem('main'); if (g && counter(g.gem, o.by, B.riposte)) P.riposteT = 0; } // Riposte keystone: strike back now
    return 0;
  }
  P.posture += cost; P.postWait = B.drainDelay;
  if (P.posture >= 1) { breakGuard(); o.result = 'broken'; return d; }
  P.castSeq++; P.lastCast = 'blockhit'; o.result = 'block'; SFX.block();
  ringFx(P.x + Math.sin(P.face) * .6, P.z + Math.cos(P.face) * .6, .7, art ? art.col : 0xe8d8a8, .2, .3);
  return d * (1 - (o.elem ? B.elem : kind === 'heavy' ? B.heavy : B.block));
}

export function breakGuard() {
  const B = SK.block;
  P.broken = B.breakT; P.posture = 0; P.blocking = false; P.parryT = 0; P.riposteT = 0; cancelSwing();
  P.castSeq++; P.lastCast = 'broken'; SFX.broken(); shake(.3);
  floatT(P.x, 2.7, P.z, 'GUARD BROKEN', '#ff5050', 15, 1.2); burst(P.x, 1.2, P.z, 0xe8d8a8, 20, 4);
}
