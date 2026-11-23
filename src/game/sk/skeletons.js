// Raise Skeletons: a minion Main gem. Each cast raises one skeleton (up to a cap set by gem level); at the cap a recast
// replaces the most hurt one if it's badly hurt. Skeletons follow you, chase and hit the nearest awake monster within a leash of you, and come
// back when you move on. Monsters in melee reach swing at them (game/enemies.js meleeTarget), so they can die.
// They live in G.minions, never in G.enemies, so nothing treats them as monsters. Their kills count as yours (hit → kill).
// Map clear removes them; on a new map you raise a fresh army. Tuning: data/skills.js SK.skeletons.
import { G, P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { ANIM, RISE } from '../../data/monsters.js';
import { rand, pick, dist } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene } from '../../render/scene.js';
import { chars, makeChar } from '../../render/characters.js';
import { buildModel } from '../../render/models.js';
import { burst, ringFx, floatT } from '../../render/fx.js';
import { pushOut, los } from '../../world/map.js';
import { near, steer, animE } from '../enemies.js';
import { hit, pay } from '../combat.js';
import { barLevels } from '../gems.js';
import { aim } from '../skills.js';

const K = SK.skeletons;
const lvl = () => barLevels().skeletons || 1;
export const cap = () => { const l = lvl(); return K.cap + K.capAt.filter(a => l >= a).length + (S.mile && S.mile.skeletons ? 1 : 0) + ((S.sk && S.sk.skeletons.army) || 0); };
export const living = () => G.minions.filter(m => !m.deathT);

function raise(x, z) {
  const L = K.look, life = K.life * Math.pow(K.lifeGrow, lvl() - 1), rigged = chars.ready;
  const m = { type: 'skeleton', look: L, x, z, vx: 0, vz: 0, r: K.r, h: K.h, spd: K.spd, hp: life, maxHp: life, face: P.face, walk: 0, moving: false,
    awake: true, atkT: rand(.1, .4), windup: 0, swing: 0, atkSeq: 0, freeze: 0, chill: 0, flash: 0, lastHit: 0, deathT: 0, tgt: null, born: G.gt };
  m.model = rigged ? makeChar(L.kind, K.h, { weapon: L.weapon, tint: L.tint }) : buildModel(K.model);
  m.model.g.position.set(x, 0, z); m.model.g.rotation.y = m.face; scene.add(m.model.g);
  glow(m, 0);
  const R = rigged && RISE[L.rise], clip = R && chars.clips[R.clip];
  if (clip) { m.riseAnim = R; m.rise = clip.duration / R.speed * K.riseT; } // animE plays the rise clip once; no acting until it's done
  m.hurt = d => hurt(m, d);
  G.minions.push(m);
  burst(x, .4, z, 0x7fffc0, 18, 3); ringFx(x, z, 1, 0x7fffc0, .35, .2);
  return m;
}
// Ally tint: a green glow, white while flashing from a hit.
function glow(m, f) { for (const mt of m.model.mats) if (mt.emissive) mt.emissive.setHex(f > 0 ? 0x888888 : K.look.glow); }

export function cast() {
  const alive = living(), full = alive.length >= cap();
  // At the cap a recast replaces the most hurt skeleton, if one is below `replace` of its life; else nothing happens (and it's free).
  const worst = full && alive.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (full && worst.hp > worst.maxHp * K.replace) return false;
  if (!pay(K.cost)) return false;
  if (worst) die(worst, true);
  // Rise between you and what you're aiming at, a little to the side so a pile-up spreads out.
  const [ax, az] = aim(), a = Math.atan2(ax - P.x, az - P.z) + rand(-.7, .7), r = Math.min(K.raiseAt, dist(ax, az, P.x, P.z)) * rand(.7, 1);
  let x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r;
  if (!los(P.x, P.z, x, z)) { x = P.x; z = P.z; }
  raise(x, z);
  P.face = a; P.castAnim = .25; P.castSeq++; P.lastCast = 'skeletons'; SFX.nova();
  return true;
}

function hurt(m, d) {
  if (m.deathT || P.dead > 0) return;
  m.hp -= d; m.flash = .08; m.lastHit = d;
  floatT(m.x, m.h + .2, m.z, Math.round(d), '#8fd8b0', 11);
  if (m.hp <= 0) die(m);
}
function die(m, quiet) {
  if (m.deathT) return;
  m.deathT = .001; m.tgt = null;
  burst(m.x, .8, m.z, 0xd8ffe8, quiet ? 6 : 14, 3);
  if (quiet) { m.deathT = 9; } // replaced: gone at once
}
function remove(m) { scene.remove(m.model.g); m.model.mats.forEach(x => x.dispose()); m.gone = true; }

// Nearest awake monster to the minion within the leash around the player.
function findTarget(m) {
  let best = null, bd = 1e9;
  near(P.x, P.z, K.leash, e => { if (!e.awake) return; const d = (e.x - m.x) ** 2 + (e.z - m.z) ** 2; if (d < bd) { bd = d; best = e; } });
  return best;
}
function move(m, tx, tz, spd, dt) { const [dx, dz] = steer(m, tx, tz); m.x += dx * spd * dt; m.z += dz * spd * dt; m.face = Math.atan2(dx, dz); m.walk += dt * spd * 2.6; m.moving = true; }

function updMinion(m, i, n, dt) {
  const M = m.model;
  if (m.deathT) {
    m.deathT += dt;
    if (M.rigged) { if (!m.deathAnim) { m.deathAnim = 1; M.play(pick(ANIM.deaths), { once: true, fade: .08, speed: 1.5 }); } M.mixer.update(dt); }
    else M.g.rotation.x = -Math.min(1, m.deathT * 5) * 1.45;
    if (m.deathT > 1.4) M.g.position.y = -(m.deathT - 1.4) * 1.5;
    if (m.deathT > 2) remove(m);
    return;
  }
  m.moving = false;
  if (m.flash > 0) { m.flash -= dt; glow(m, m.flash); }
  const pd = dist(m.x, m.z, P.x, P.z);
  if (pd > K.warp) { m.x = P.x + rand(-1, 1); m.z = P.z + rand(-1, 1); m.tgt = null; } // left far behind (respawn, stuck): rejoin
  if (m.rise > 0 || P.dead > 0) { m.rise -= dt; pushOut(m); return animE(m, dt); }
  if (m.tgt && (m.tgt.deathT || dist(m.tgt.x, m.tgt.z, P.x, P.z) > K.leash + 2 || pd > K.leash + 2)) m.tgt = null;
  if (!m.tgt || G.gt - (m.seekT || 0) > .5) { m.seekT = G.gt; m.tgt = pd > K.leash + 2 ? null : findTarget(m) || m.tgt; }
  const e = m.tgt, rate = S.cast * ((P.eff && P.eff.cast) || 1);
  if (e) {
    const d = dist(m.x, m.z, e.x, e.z), reach = K.reach + m.r + e.r;
    if (m.windup > 0) {
      m.windup -= dt; m.face = Math.atan2(e.x - m.x, e.z - m.z);
      if (m.windup <= 0) { m.swing = 1; m.atkT = K.atk / rate; if (d < reach + .4) { const dd = d || 1; hit(e, K.mult, 'phys', { gem: 'skeletons', kx: (e.x - m.x) / dd * .4, kz: (e.z - m.z) / dd * .4 }); } }
    } else if (d < reach) { m.face = Math.atan2(e.x - m.x, e.z - m.z); m.atkT -= dt; if (m.atkT <= 0) { m.windup = .28 / rate; m.atkSeq++; } }
    else { m.atkT = Math.min(m.atkT, .25); move(m, e.x, e.z, m.spd, dt); }
  } else {
    // Follow: each skeleton keeps its own spot in a ring behind the player.
    const a = P.face + Math.PI + (i - (n - 1) / 2) * .8, fx = P.x + Math.sin(a) * K.follow, fz = P.z + Math.cos(a) * K.follow;
    const fd = dist(m.x, m.z, fx, fz);
    if (fd > .5) move(m, fx, fz, m.spd * (fd > 5 ? 1.3 : Math.min(1, .4 + fd / 3)), dt);
    else m.face = P.face;
  }
  // Don't stand inside monsters or each other (minions give way; monsters aren't pushed).
  near(m.x, m.z, m.r + .6, o => { const dx = m.x - o.x, dz = m.z - o.z, dd = Math.hypot(dx, dz), mm = m.r + o.r; if (dd < mm && dd > .001) { m.x += dx / dd * (mm - dd); m.z += dz / dd * (mm - dd); } });
  for (const o of G.minions) { if (o === m || o.deathT) continue; const dx = m.x - o.x, dz = m.z - o.z, dd = Math.hypot(dx, dz), mm = m.r + o.r; if (dd < mm && dd > .001) { m.x += dx / dd * (mm - dd) * .5; m.z += dz / dd * (mm - dd) * .5; } }
  pushOut(m); animE(m, dt);
}

export function tick(dt) {
  if (!G.minions.length) return;
  if (!S.gems || !S.gems.skeletons) for (const m of G.minions) die(m, true); // gem taken off the bar: the army crumbles
  const alive = living();
  for (const m of G.minions) updMinion(m, alive.indexOf(m), alive.length, dt);
  G.minions = G.minions.filter(m => !m.gone);
}

export function clear() { for (const m of G.minions) remove(m); G.minions = []; }

export default { cast, tick, clear };
