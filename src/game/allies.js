// Player-side units: minions, totems, decoys. G.allies holds plain objects (see the contract):
//   { kind, x, z, r, hp, maxHp, t (seconds left, Infinity = no limit), taunt (0..1), tauntR, sk (owning skill id),
//     model (optional { g, mats }), upd(a, dt) (optional per-kind behaviour), onDeath(a) (optional), gone }
// addAlly() registers one; updAllies() ticks them, expires and removes them; monsters pick targets with enemyTarget()
// and hurt them with hurtTarget() (which forwards to combat.hurtP for the hero). Allies are cleared on newLevel (level.js teardown).
import { G, P, S } from '../core/state.js';
import { ALLY } from '../data/allies.js';
import { dist } from '../core/util.js';
import { scene } from '../render/scene.js';
import { floatT, burst, ringFx } from '../render/fx.js';
import { hurtP, kill } from './combat.js';
import { SFX } from '../core/audio.js';
import { SK } from '../data/skills.js';
import { wake } from './enemies.js';
import { dbg } from '../core/dbg.js';

export function addAlly(a) {
  const o = { r: .4, hp: 1, maxHp: 1, t: Infinity, taunt: 0, tauntR: 0, ...a };
  if (o.model && o.model.g && !o.model.g.parent) scene.add(o.model.g);
  G.allies.push(o); return o;
}
export const liveAllies = () => G.allies.filter(a => !a.gone && a.hp > 0);

function removeAlly(a) {
  a.gone = true;
  if (a.model) { scene.remove(a.model.g); (a.model.mats || []).forEach(m => m.dispose && m.dispose()); }
}
export function killAlly(a) { if (a.gone) return; if (a.onDeath) a.onDeath(a); burst(a.x, .8, a.z, 0xd8d0b8, 14, 3); removeAlly(a); }

// Damage to an ally (monster hits, arrows). Never below zero; dies at zero.
export function hurtAlly(a, d) {
  if (a.gone || a.hp <= 0) return;
  a.hp -= d; a.flash = .1; floatT(a.x, 1.8, a.z, Math.round(d), '#d0a0a0', 11);
  if (a.hp <= 0) killAlly(a);
}
// Damage to a monster that skips the gem formula (thorns, a decoy's burst): d is final. Wakes it, shows a number, kills at zero.
export function rawHit(e, d, col = '#fff') {
  if (e.deathT || e.gone) return;
  wake(e); e.hp -= d; e.flash = .07; e.lastHit = Math.max(e.lastHit || 0, d); floatT(e.x, (e.h || 1.6) + .3, e.z, Math.round(d), col, 13);
  if (e.hp <= 0) kill(e);
}

// Bone Armour (game/minions.js casts it): `n` plates each stop one whole hit on the hero, `t` seconds left, `thorn` damage dealt back as a
// multiple of the blocked hit. hurtHero is the way a monster's hit reaches the hero, so the plates need no change in combat.hurtP.
// (Poison pools and burning auras tick through hurtP directly and ignore the plates, which only stop attacks.)
export const BONE = { n: 0, t: 0, thorn: 0, onBlock: null };
export function hurtHero(d, src) {
  if (P.dead > 0 || P.invuln > 0) return;
  if (BONE.n > 0 && BONE.t > 0) {
    BONE.n--; if (BONE.onBlock) BONE.onBlock(); floatT(P.x, 2.3, P.z, 'BLOCK', '#e6dcc6', 13); SFX.hit(); ringFx(P.x, P.z, 1.6, 0xe6dcc6, .25, .4); burst(P.x, 1, P.z, 0xe6dcc6, 8, 3);
    if (src && !src.deathT && !src.gone && src.hp > 0) { // thorns: a share of the hit, boosted like any damage, goes back at the attacker
      const th = Math.max(d * BONE.thorn, SK.boneArmour.minThorn * Math.max(1, S.spell)) * (1 + S.inc) * S.more;
      rawHit(src, th, '#e6dcc6');
    }
    return;
  }
  hurtP(d);
}
// A monster's hit lands on whatever it targeted: the hero or an ally. src: the attacker (for Bone Armour's thorns).
export function hurtTarget(t, d, src) { if (t === P) hurtHero(d, src); else hurtAlly(t, d); }

// The first live ally overlapping the circle (enemy arrows).
export function allyHitBy(x, z, r) { for (const a of G.allies) if (!a.gone && a.hp > 0 && dist(a.x, a.z, x, z) < a.r + r) return a; return null; }

// What monster e fights: a taunting ally in range wins; else an ally clearly closer than the hero; else the hero.
// Re-decided every ALLY.retarget seconds (cached on e.tgt) so packs don't jitter between targets.
export function enemyTarget(e, dt) {
  e.tgtT = (e.tgtT || 0) - dt;
  if (e.tgt && e.tgt !== P && (e.tgt.gone || e.tgt.hp <= 0)) e.tgt = null;
  if (e.tgt && e.tgtT > 0) return e.tgt;
  e.tgtT = ALLY.retarget;
  const dP = P.dead > 0 ? Infinity : dist(e.x, e.z, P.x, P.z);
  let best = null, bt = -1, bd = Infinity;
  for (const a of G.allies) {
    if (a.gone || a.hp <= 0) continue;
    const d = dist(e.x, e.z, a.x, a.z);
    if (a.taunt > 0 && d < a.tauntR) { if (a.taunt > bt || (a.taunt === bt && d < bd)) { best = a; bt = a.taunt; bd = d; } }
    else if (bt < 0 && d < ALLY.aggro && d + ALLY.margin < dP && d < bd) { best = a; bd = d; }
  }
  return e.tgt = best || P;
}

export function updAllies(dt) {
  for (const a of G.allies) {
    if (a.gone) continue;
    a.t -= dt; if (a.flash > 0) a.flash -= dt;
    if (a.t <= 0) { killAlly(a); continue; }
    if (a.upd) a.upd(a, dt);
    if (a.model && !a.gone) a.model.g.position.set(a.x, a.model.g.position.y, a.z);
  }
  G.allies = G.allies.filter(a => !a.gone);
}

Object.assign(dbg, { allies: () => G.allies, addAlly, hurtAlly, enemyTarget, hurtHero, BONE });
