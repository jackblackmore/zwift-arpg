// Workstream C2 skills, registered with skills.js registerSkill: Flame Totem (an ally that shoots), Arc (chain lightning), Meteor (delayed
// big hit), Ice Trap (armed, then bursts when stepped on) and Corpse Explosion (detonates a corpse). Tuning is in data/skills.js (SK);
// damage only through combat.hit(e, mult, elem, { sk }); freezes through applyFreeze; delayed things live in the tickers below and are
// dropped when the level changes (each remembers the G.level it was made in).
import * as T from 'three';
import { G, P, S, shake } from '../core/state.js';
import { SK } from '../data/skills.js';
import { rand, pick, dist } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene, flashLight } from '../render/scene.js';
import { glowSprite, GRING, GDISC, GCY } from '../render/assets.js';
import { sparks, glows, emit, ringFx, flashFx, telegraph, burst, toast } from '../render/fx.js';
import { blocked, los } from '../world/map.js';
import { near } from './enemies.js';
import { hit, addPatch } from './combat.js';
import { registerSkill, castArc, aim } from './skills.js';
import { gemBase, gemMile } from './gems.js';
import { addAlly, killAlly } from './allies.js';
import { takeCorpse } from './corpses.js';
import { projCount, pierceCount, applyFreeze } from './supports.js';
import { addTicker } from './tick.js';
import { ctl } from '../input/input.js';
import { dbg } from '../core/dbg.js';

const live = e => !e.deathT && !e.gone;
// The nearest living enemy within r of (x, z) that can be seen from there, else null.
function nearestEnemy(x, z, r) {
  let best = null, bd = r * r;
  for (const e of G.enemies) { if (!live(e)) continue; const d = (e.x - x) ** 2 + (e.z - z) ** 2; if (d < bd && los(x, z, e.x, e.z)) { bd = d; best = e; } }
  return best;
}
// A spot toward (tx, tz) from the hero, at most `max` away, pulled back toward the hero until it is not inside a wall.
function spotToward(tx, tz, max) {
  const d = dist(tx, tz, P.x, P.z) || 1, k = Math.min(1, max / d);
  for (let s = 1; s >= 0; s -= .25) { const x = P.x + (tx - P.x) * k * s, z = P.z + (tz - P.z) * k * s; if (!blocked(x, z, .4)) return [x, z]; }
  return [P.x, P.z];
}
const castPose = kind => { P.castAnim = .2; P.castSeq++; P.lastCast = kind; };
const alive = o => o.lv === G.level; // made in the level that is still running

// ================================================================ Flame Totem
const totemMat = new T.MeshLambertMaterial({ color: 0x5a463a, emissive: 0x2a0c04 });
function totemModel() {
  const g = new T.Group(), body = new T.Mesh(GCY, totemMat); body.scale.set(.32, 1.3, .32); body.position.y = .65; g.add(body);
  const cap = new T.Mesh(GCY, totemMat); cap.scale.set(.46, .22, .46); cap.position.y = 1.4; g.add(cap);
  const fire = glowSprite(0xff6a1a, 1.5), core = glowSprite(0xffe0a0, .6); fire.position.y = core.position.y = 1.85; g.add(fire, core);
  return { g, fire }; // shared geometry and sprite materials: nothing to dispose
}
const bolts = [];
function fireBolt(a, e) {
  const K = SK.flameTotem, n = 1 + projCount('flameTotem'), base = Math.atan2(e.x - a.x, e.z - a.z);
  for (let i = 0; i < n; i++) {
    const ang = base + (i - (n - 1) / 2) * .22, g = new T.Group(); g.add(glowSprite(0xff6a1a, .8), glowSprite(0xffe0a0, .32));
    g.position.set(a.x, 1.8, a.z); scene.add(g);
    bolts.push({ x: a.x, z: a.z, dx: Math.sin(ang), dz: Math.cos(ang), life: K.boltLife, pierce: pierceCount('flameTotem'), hitS: new Set(), g, lv: G.level });
  }
  SFX.fire();
}
function totemUpd(a, dt) {
  const K = SK.flameTotem;
  a.fireT -= dt; if (a.model) a.model.fire.scale.setScalar(1.4 + Math.sin(G.gt * 14 + a.x) * .15);
  if (Math.random() < dt * 10) emit(glows, a.x, 1.9, a.z, rand(-.3, .3), rand(.5, 1.2), rand(-.3, .3), .4, 0xff5a10);
  if (a.fireT > 0) return;
  const e = nearestEnemy(a.x, a.z, K.range); if (!e) return;
  a.fireT = K.rate; fireBolt(a, e);
}
function castTotem() {
  const K = SK.flameTotem, [ax, az] = aim(), [x, z] = spotToward(ax, az, K.plant), max = 1 + gemMile('flameTotem', 'totems', 'totems');
  const mine = G.allies.filter(a => a.kind === 'totem' && a.sk === 'flameTotem' && !a.gone);
  while (mine.length >= max) killAlly(mine.shift()); // the oldest crumbles when over the limit
  const m = totemModel(); m.g.position.set(x, 0, z);
  addAlly({ kind: 'totem', sk: 'flameTotem', x, z, r: K.r, hp: S.maxLife * K.hpFrac, maxHp: S.maxLife * K.hpFrac, t: K.life, taunt: 0, model: m, upd: totemUpd, fireT: .2 });
  castPose('cast'); ringFx(x, z, 1.6, 0xff6a2a, .4, .2); flashFx(x, 1, z, 0xff8a3c, 3, .3); flashLight(x, z, 0xff7a2a, 3, .3); SFX.boom();
  burst(x, .3, z, 0xff8a3c, 14, 3); return true;
}
addTicker(dt => {
  for (const p of bolts) {
    p.x += p.dx * SK.flameTotem.speed * dt; p.z += p.dz * SK.flameTotem.speed * dt; p.life -= dt; p.g.position.set(p.x, 1.4, p.z);
    emit(sparks, p.x, 1.4, p.z, rand(-.5, .5), rand(0, 1), rand(-.5, .5), .25, pick([0xff8a3c, 0xffc060]), 0, 2);
    let dead = p.life <= 0 || blocked(p.x, p.z, .1) || !alive(p);
    if (!dead) near(p.x, p.z, .4, e => {
      if (dead || p.hitS.has(e)) return; p.hitS.add(e);
      hit(e, SK.flameTotem.mult, 'fire', { kx: p.dx, kz: p.dz, sk: 'flameTotem' });
      emit(sparks, p.x, 1.3, p.z, 0, 2, 0, .3, 0xffc060, 4, 1);
      if (p.pierce > 0) p.pierce--; else dead = true;
    });
    if (dead) { p.dead = true; scene.remove(p.g); }
  }
  for (let i = bolts.length - 1; i >= 0; i--) if (bolts[i].dead) bolts.splice(i, 1);
});
registerSkill('flameTotem', { cast: castTotem, range: () => SK.flameTotem.range });

// ================================================================ Arc
// The chain itself is castArc in skills.js (shared with Heart of the Storm's free arcs); this is the button. Fails with nothing in range.
registerSkill('arc', {
  cast() {
    if (!nearestEnemy(P.x, P.z, SK.arc.range)) return false;
    P.face = Math.atan2((aim()[0] - P.x), (aim()[1] - P.z)); castPose('shoot'); return castArc(P.x, P.z, false);
  },
  range: () => SK.arc.range,
});

// ================================================================ Meteor
const meteors = [];
// The enemy in range with the most other enemies within packR of it (ties: nearest to the hero), as a point; null if none.
function densestSpot() {
  const K = SK.meteor; let best = null, bn = 0, bd = 1e9;
  for (const e of G.enemies) {
    if (!live(e) || dist(e.x, e.z, P.x, P.z) > K.range) continue;
    let n = 0; for (const o of G.enemies) if (live(o) && dist(o.x, o.z, e.x, e.z) <= K.packR) n++;
    const d = dist(e.x, e.z, P.x, P.z); if (n > bn || (n === bn && d < bd)) { bn = n; bd = d; best = e; }
  }
  return best && [best.x, best.z];
}
function castMeteor() {
  const K = SK.meteor; let spot = ctl_aim();
  if (spot) spot = spotToward(spot[0], spot[1], K.range); else spot = densestSpot();
  if (!spot) return false;
  const r = K.radius * S.aoe, g = new T.Group(); g.add(glowSprite(0xff5a1a, 3.2), glowSprite(0xffe0a0, 1.3)); g.position.set(spot[0], 16, spot[1]); scene.add(g);
  telegraph(spot[0], spot[1], r, K.delay, 0xff5a1a);
  meteors.push({ x: spot[0], z: spot[1], t: K.delay, g, lv: G.level }); castPose('cast'); SFX.fire(); return true;
}
// ctl.aim only when the player is aiming (aim() would also fall back to the nearest enemy).
const ctl_aim = () => ctl.aim || null;
function impact(m) {
  const K = SK.meteor, r = K.radius * S.aoe, { x, z } = m;
  near(x, z, r, e => { const d = dist(e.x, e.z, x, z) || 1; hit(e, K.mult, 'fire', { kx: (e.x - x) / d, kz: (e.z - z) / d, sk: 'meteor' }); });
  flashFx(x, 1, z, 0xff7a2a, r * 3, .35); flashFx(x, 1, z, 0xffe0a0, r * 1.4, .2); ringFx(x, z, r, 0xff8a3c, .35, .3); ringFx(x, z, r * .6, 0xffe0a0, .25, .2);
  for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), s = rand(3, 9); emit(sparks, x, 1, z, Math.cos(a) * s, rand(2, 7), Math.sin(a) * s, rand(.4, .9), pick([0xff8a3c, 0xffd060, 0xff4a10]), 8, 2); }
  flashLight(x, z, 0xff7a2a, 5, .4); SFX.boom(); shake(.18);
  addPatch(x, z, r * K.patch, K.patchT);
}
addTicker(dt => {
  for (const m of meteors) {
    m.t -= dt;
    if (!alive(m)) { m.dead = true; scene.remove(m.g); continue; }
    const k = Math.max(0, m.t / SK.meteor.delay); m.g.position.y = .8 + 15 * k * k; m.g.rotation.y += dt;
    emit(sparks, m.x, m.g.position.y, m.z, rand(-.5, .5), rand(0, 2), rand(-.5, .5), .3, 0xff8a3c, 0, 2);
    if (m.t <= 0) { m.dead = true; scene.remove(m.g); impact(m); }
  }
  for (let i = meteors.length - 1; i >= 0; i--) if (meteors[i].dead) meteors.splice(i, 1);
});
registerSkill('meteor', { cast: castMeteor, range: () => SK.meteor.range });

// ================================================================ Ice Trap
const traps = [];
function trapModel() {
  const g = new T.Group(), disc = new T.Mesh(GDISC, new T.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: .15, depthWrite: false, blending: T.AdditiveBlending }));
  const ring = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: .5, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
  for (const m of [disc, ring]) { m.rotation.x = -Math.PI / 2; m.position.y = .06; m.scale.setScalar(SK.iceTrap.trigger); g.add(m); }
  const spike = new T.Mesh(new T.ConeGeometry(.25, .7, 5), new T.MeshLambertMaterial({ color: 0xbff0ff, emissive: 0x2a6a8a })); spike.position.y = .35; g.add(spike);
  return { g, disc, ring, spike };
}
function dropTrap(t) { t.dead = true; scene.remove(t.m.g); t.m.disc.material.dispose(); t.m.ring.material.dispose(); t.m.spike.geometry.dispose(); t.m.spike.material.dispose(); }
function castTrap() {
  const K = SK.iceTrap, a = ctl_aim() || (nearestEnemy(P.x, P.z, K.range) ? [nearestEnemy(P.x, P.z, K.range).x, nearestEnemy(P.x, P.z, K.range).z] : aim());
  const [x, z] = spotToward(a[0], a[1], K.range);
  const mine = traps.filter(t => !t.dead && alive(t));
  while (mine.length >= K.max) dropTrap(mine.shift()); // the oldest is sprung without bursting
  const m = trapModel(); m.g.position.set(x, 0, z); scene.add(m.g);
  traps.push({ x, z, armT: K.arm, t: K.life, m, lv: G.level }); castPose('cast'); SFX.dash(); ringFx(x, z, 1.2, 0x9fe8ff, .3, .3); return true;
}
function burstTrap(t) {
  const K = SK.iceTrap, r = K.radius * S.aoe, { x, z } = t;
  near(x, z, r, e => { const d = dist(e.x, e.z, x, z) || 1; hit(e, K.mult, 'cold', { kx: (e.x - x) / d, kz: (e.z - z) / d, sk: 'iceTrap' }); applyFreeze(e, K.freeze * S.freeze, 'iceTrap'); });
  ringFx(x, z, r, 0x9fe8ff, .45, .1); ringFx(x, z, r * .7, 0xffffff, .3, .1); flashFx(x, .6, z, 0x7fd8ff, r * 2.2, .35);
  for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), s = rand(4, 9) * S.aoe; emit(sparks, x, rand(.2, 1), z, Math.cos(a) * s, rand(0, 3), Math.sin(a) * s, rand(.35, .5), pick([0xbff0ff, 0xffffff, 0x7fd8ff]), 2, 3); }
  flashLight(x, z, 0x7fd8ff, 4, .35); SFX.nova(); shake(.08); dropTrap(t);
}
addTicker(dt => {
  for (const t of traps) {
    if (t.dead) continue;
    if (!alive(t)) { dropTrap(t); continue; }
    t.t -= dt; t.armT -= dt;
    const armed = t.armT <= 0, p = armed ? .5 + .3 * Math.sin(G.gt * 6) : .15;
    t.m.ring.material.opacity = p; t.m.disc.material.opacity = armed ? .22 : .08; t.m.spike.position.y = armed ? .35 : .35 * Math.max(.1, 1 - t.armT / SK.iceTrap.arm);
    if (t.t <= 0) { dropTrap(t); continue; }
    if (!armed) continue;
    let trig = false; near(t.x, t.z, SK.iceTrap.trigger, () => { trig = true; });
    if (trig) burstTrap(t);
  }
  for (let i = traps.length - 1; i >= 0; i--) if (traps[i].dead) traps.splice(i, 1);
});
registerSkill('iceTrap', { cast: castTrap, range: () => SK.iceTrap.range });

// ================================================================ Corpse Explosion
let noCorpseT = -1e9;
// The nearest corpse around the aim point (when aiming) or within range of the hero; removes it from the world.
function claimCorpse() {
  const K = SK.corpseExplosion, a = ctl_aim();
  return (a && takeCorpse(a[0], a[1], K.aimR)) || takeCorpse(P.x, P.z, K.range);
}
function detonate(c) {
  const K = SK.corpseExplosion, r = K.radius * S.aoe, { x, z } = c;
  const mult = K.mult + K.frac * c.maxHp / (gemBase('corpseExplosion') + S.spell); // a share of the corpse's life on top of the gem's damage
  near(x, z, r, e => { const d = dist(e.x, e.z, x, z) || 1; hit(e, mult, 'fire', { kx: (e.x - x) / d, kz: (e.z - z) / d, sk: 'corpseExplosion' }); });
  flashFx(x, 1, z, 0xc83a2a, r * 2.4, .3); flashFx(x, 1, z, 0xffb090, r, .15); ringFx(x, z, r, 0xff6a4a, .35, .2);
  for (let i = 0; i < 30; i++) { const a = rand(0, 6.28), s = rand(2, 7); emit(sparks, x, .6, z, Math.cos(a) * s, rand(1, 5), Math.sin(a) * s, rand(.3, .7), pick([0xc83a2a, 0xff7a5a, 0xe8dcc0]), 8, 2); }
  flashLight(x, z, 0xff5a3a, 3.5, .25); SFX.boom(); shake(.1);
}
function castCorpse() {
  let n = 0; const max = 1 + gemMile('corpseExplosion', 'corpses', 'corpses');
  for (let i = 0; i < max; i++) { const c = claimCorpse(); if (!c) break; detonate(c); n++; }
  if (!n) { if (G.gt - noCorpseT > 1.5) { noCorpseT = G.gt; toast('No corpse nearby'); } return false; }
  castPose('cast'); return true;
}
registerSkill('corpseExplosion', {
  cast: castCorpse,
  // In Main: only when a corpse lies within reach (the default would also need a target, and would nag on every failure).
  main() { const K = SK.corpseExplosion; return G.corpses.some(c => dist(c.x, c.z, P.x, P.z) <= K.range) && castCorpse(); },
  range: () => SK.corpseExplosion.range,
});

Object.assign(dbg, { castArc, spellState: () => ({ bolts: bolts.length, meteors: meteors.length, traps: traps.filter(t => !t.dead).length, trapList: traps.filter(t => !t.dead).map(t => ({ x: t.x, z: t.z, armed: t.armT <= 0 })), meteorList: meteors.map(m => ({ x: m.x, z: m.z, t: m.t })) }) });
