// The four shrine-tier skills that play unlike Fireball (tuning in data/skills.js C1 block, looks in data/allies.js):
//   Frost Lance   a slow, long, very heavy lance at the toughest target in range; it chills and pierces. Sniper: pick targets.
//   Raise Skeletons  a self-refilling army of melee allies that hunt monsters and soak hits. Summoner: you stay back.
//   Bone Armour   plates that each stop one whole hit and sting the attacker (the absorb lives in allies.js hurtHero).
//   Decoy         a dummy every monster in range attacks instead of you; it may burst when it ends.
// All four register in the skills registry (skills.js) and work in any slot that accepts their kind.
import * as T from 'three';
import { G, P, S, shake } from '../core/state.js';
import { SK } from '../data/skills.js';
import { SKEL } from '../data/allies.js';
import { ctl } from '../input/input.js';
import { rand, pick, dist } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene, flashLight } from '../render/scene.js';
import { GB, GCY, GS, GRING, glowSprite, aura } from '../render/assets.js';
import { sparks, glows, emit, ringFx, flashFx, burst } from '../render/fx.js';
import { buildModel } from '../render/models.js';
import { chars, makeChar } from '../render/characters.js';
import { blocked, los, pushOut } from '../world/map.js';
import { near, steer } from './enemies.js';
import { hit } from './combat.js';
import { gemHas, gemMile, gemScale } from './gems.js';
import { projCount, pierceCount } from './supports.js';
import { registerSkill, aim } from './skills.js';
import { addAlly, killAlly, BONE, rawHit } from './allies.js';
import { addTicker } from './tick.js';
import { levelHooks } from './level.js';
import { dbg } from '../core/dbg.js';

// ================================================================ Frost Lance
const lances = []; // lances in flight: { x, z, dx, dz, left, pierce, hitS, g }

// The enemy with the most life left within range and in sight (the sniper picks targets: elites and bosses first, naturally).
function lanceTarget() {
  const R = SK.frostLance.range; let best = null, bh = -1;
  for (const e of G.enemies) {
    if (e.deathT || e.gone || e.hp <= bh) continue;
    if (dist(e.x, e.z, P.x, P.z) > R || !los(P.x, P.z, e.x, e.z)) continue;
    best = e; bh = e.hp;
  }
  return best;
}
const LANCE_MAT = new T.MeshBasicMaterial({ color: 0xd8f6ff }), LANCE_TIP = new T.ConeGeometry(.16, .5, 6);
function lanceMesh(a) { // a long ice spear: shaft, tip and a glow, pointing along its flight
  const g = new T.Group();
  const shaft = new T.Mesh(GCY, LANCE_MAT); shaft.scale.set(.07, 1.3, .07); shaft.rotation.x = Math.PI / 2; g.add(shaft);
  const tip = new T.Mesh(LANCE_TIP, LANCE_MAT); tip.rotation.x = Math.PI / 2; tip.position.z = .85; g.add(tip);
  g.add(glowSprite(0x8fe0ff, 1.6), glowSprite(0xffffff, .55)); g.rotation.y = a; return g;
}
export function castLance(ax, az) {
  const F = SK.frostLance;
  if (ax === undefined) [ax, az] = aim();
  const base = Math.atan2(ax - P.x, az - P.z), n = Math.ceil(S.proj - 1e-9) + projCount('frostLance');
  const pierce = S.pierce + pierceCount('frostLance') + gemMile('frostLance', 'pierce', 'pierce');
  P.face = base; P.castAnim = .14; P.castSeq++; P.lastCast = 'shoot';
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * F.spread, g = lanceMesh(a);
    g.position.set(P.x + Math.sin(a) * .8, 1.2, P.z + Math.cos(a) * .8); scene.add(g);
    lances.push({ x: g.position.x, z: g.position.z, dx: Math.sin(a), dz: Math.cos(a), left: F.life, pierce, hitS: new Set(), g });
  }
  flashFx(P.x + Math.sin(base) * .9, 1.2, P.z + Math.cos(base) * .9, 0xbff0ff, 2.2, .15); SFX.arc(); return true;
}
// Main: holding ctl.main fires toward the aim point, otherwise it auto-fires at the toughest enemy in range. castSlot paces it.
function lanceMain() {
  if (ctl.main && ctl.aim) return castLance(ctl.aim[0], ctl.aim[1]);
  const e = lanceTarget(); if (e) return castLance(e.x, e.z);
  return ctl.main ? castLance(...aim()) : false;
}
function lanceHit(p, e) {
  const F = SK.frostLance; p.hitS.add(e);
  const m = F.mult * (e.freeze > 0 && gemHas('frostLance', 'shatter') ? F.frozenMult : 1);
  hit(e, m, 'cold', { kx: p.dx, kz: p.dz, sk: 'frostLance' });
  if (!e.deathT) e.chill = Math.max(e.chill || 0, F.chill); // half speed for a while
  flashFx(e.x, 1.1, e.z, 0xbff0ff, 3, .22); ringFx(e.x, e.z, 1.6, 0x9fe8ff, .3, .2); shake(.06);
  for (let i = 0; i < 14; i++) emit(sparks, e.x, 1.1, e.z, rand(-4, 4) + p.dx * 3, rand(0, 4), rand(-4, 4) + p.dz * 3, rand(.3, .55), pick([0xbff0ff, 0xffffff, 0x7fd8ff]), 6, 2);
  if (p.pierce > 0) p.pierce--; else p.dead = true;
}
function updLances(dt) {
  const F = SK.frostLance;
  for (const p of lances) {
    const steps = Math.max(1, Math.ceil(F.speed * dt / .4)), h = dt / steps;
    for (let k = 0; k < steps && !p.dead; k++) {
      p.x += p.dx * F.speed * h; p.z += p.dz * F.speed * h;
      if (blocked(p.x, p.z, .1)) { p.dead = true; break; }
      let tgt = null; near(p.x, p.z, F.hitR, e => { if (!tgt && !p.hitS.has(e)) tgt = e; });
      if (tgt) lanceHit(p, tgt);
    }
    p.left -= dt; if (p.left <= 0) p.dead = true;
    p.g.position.set(p.x, 1.2, p.z);
    emit(sparks, p.x, 1.2, p.z, rand(-.5, .5), rand(0, 1), rand(-.5, .5), .35, pick([0xbff0ff, 0xffffff]), 0, 2);
    emit(glows, p.x - p.dx * .6, 1.2, p.z - p.dz * .6, 0, .2, 0, .25, 0x7fd8ff);
    if (p.dead) scene.remove(p.g);
  }
  for (let i = lances.length - 1; i >= 0; i--) if (lances[i].dead) lances.splice(i, 1);
}
addTicker(updLances);
registerSkill('frostLance', { cast: () => { const e = lanceTarget(); return e ? castLance(e.x, e.z) : castLance(...aim()); }, main: lanceMain, range: () => SK.frostLance.range });

// ================================================================ Raise Skeletons
export const skeletons = () => G.allies.filter(a => a.kind === 'skeleton' && !a.gone && a.hp > 0);
export const skeletonCap = () => SK.skeletons.cap + gemMile('skeletons', 'legion', 'cap');

function skeletonModel() {
  const K = SK.skeletons;
  const M = chars.ready ? makeChar('warrior', K.height, { weapon: SKEL.weapon, tint: SKEL.tint })
    : buildModel({ col: SKEL.body, head: SKEL.head, eye: SKEL.glow, h: K.height });
  M.g.add(aura(SKEL.glow, 2.6, .32)); // a green pool under its feet marks it as yours
  M.mats.forEach(m => { if (m.emissive) m.emissive.setHex(0x0c2a22); });
  return M;
}
// Raise one skeleton near the hero (in front, off the rocks). Returns it.
export function raiseSkeleton() {
  const K = SK.skeletons, hp = S.maxLife * K.hp * (gemHas('skeletons', 'bonehard') ? K.hpMile : 1);
  let x = P.x, z = P.z;
  for (let k = 0; k < 12; k++) { const a = P.face + rand(-1.6, 1.6), r = rand(1.2, 2.2); x = P.x + Math.sin(a) * r; z = P.z + Math.cos(a) * r; if (!blocked(x, z, K.r)) break; }
  const M = skeletonModel(), R = SKEL.rise, clip = M.rigged && chars.clips[R.clip];
  const a = addAlly({ kind: 'skeleton', x, z, r: K.r, hp, maxHp: hp, t: K.life, sk: 'skeletons', model: M, upd: updSkeleton, face: P.face, atkT: .4, walk: rand(0, 6), atkSeq: 0, windup: 0, swing: 0, rise: K.rise, riseAnim: !!clip });
  if (clip) a.rise = Math.max(K.rise, clip.duration / R.speed * .85);
  M.g.position.set(x, 0, z); M.g.rotation.y = a.face;
  ringFx(x, z, 1.6, SKEL.glow, .5, .1); flashFx(x, .8, z, SKEL.glow, 2.6, .4); burst(x, .3, z, 0xd8d0b8, 14, 3); flashLight(x, z, SKEL.glow, 2, .3); SFX.kill();
  return a;
}
// Main: one raise per paced shot while below the cap (so the army refills itself). Flex: raises up to the cap at once.
function raiseMain() { if (skeletons().length >= skeletonCap()) return false; P.castSeq++; P.lastCast = 'shoot'; P.castAnim = .1; raiseSkeleton(); return true; }
function raiseFlex() {
  const n = skeletonCap() - skeletons().length; if (n <= 0) return false;
  P.castAnim = .3; P.castSeq++; P.lastCast = 'nova'; for (let i = 0; i < n; i++) raiseSkeleton(); return true;
}
registerSkill('skeletons', { cast: raiseFlex, main: raiseMain, range: () => SK.skeletons.range });

// The monster a skeleton should fight: the nearest one within `engage` of it, as long as the hero is within `leash` of that monster.
function skeletonTarget(a) {
  const K = SK.skeletons; let best = null, bd = K.engage;
  for (const e of G.enemies) {
    if (e.deathT || e.gone) continue;
    const d = dist(e.x, e.z, a.x, a.z); if (d < bd && dist(e.x, e.z, P.x, P.z) < K.leash) { bd = d; best = e; }
  }
  return best;
}
function walkTo(a, tx, tz, spd, dt) { const [dx, dz] = steer(a, tx, tz); a.x += dx * spd * dt; a.z += dz * spd * dt; a.face = Math.atan2(dx, dz); a.walk += dt * spd * 2.6; a.moving = true; }
function updSkeleton(a, dt) {
  const K = SK.skeletons; a.moving = false;
  if (a.rise > 0) { a.rise -= dt; return animSkeleton(a, dt); }
  if (dist(a.x, a.z, P.x, P.z) > K.warp) { a.x = P.x + rand(-1.5, 1.5); a.z = P.z + rand(-1.5, 1.5); burst(a.x, .5, a.z, SKEL.glow, 10, 3); } // lost: rejoin the hero
  a.tgtT = (a.tgtT || 0) - dt;
  if (!a.tgt || a.tgt.deathT || a.tgt.gone || a.tgtT <= 0) { a.tgtT = .3; if (a.windup <= 0) a.tgt = skeletonTarget(a); }
  const t = a.tgt;
  if (t && !t.deathT && !t.gone) {
    const td = dist(a.x, a.z, t.x, t.z), reach = K.reach + a.r + t.r;
    if (a.windup > 0) {
      a.windup -= dt; a.face = Math.atan2(t.x - a.x, t.z - a.z);
      if (a.windup <= 0) {
        a.swing = 1; a.atkT = K.swing;
        if (dist(a.x, a.z, t.x, t.z) < reach + .45) { const d = dist(a.x, a.z, t.x, t.z) || 1; hit(t, K.mult, 'phys', { kx: (t.x - a.x) / d, kz: (t.z - a.z) / d, sk: 'skeletons' }); }
      }
    } else if (td < reach) { a.face = Math.atan2(t.x - a.x, t.z - a.z); a.atkT -= dt; if (a.atkT <= 0) { a.windup = .25; a.atkSeq++; } }
    else walkTo(a, t.x, t.z, K.spd, dt);
  } else { // no fight: keep station round the hero, hurrying when left behind
    const mine = skeletons(), i = mine.indexOf(a), ang = (i + .5) / Math.max(1, mine.length) * Math.PI * 2 + 1, px = P.x + Math.cos(ang) * K.follow, pz = P.z + Math.sin(ang) * K.follow;
    const d = dist(a.x, a.z, px, pz); if (d > .7) walkTo(a, px, pz, K.spd * (1 + Math.min(1.2, d / 8)), dt);
  }
  for (const o of G.allies) if (o !== a && o.kind === 'skeleton' && !o.gone) { const dx = a.x - o.x, dz = a.z - o.z, dd = Math.hypot(dx, dz), m = a.r + o.r; if (dd < m && dd > .001) { a.x += dx / dd * (m - dd) * .5; a.z += dz / dd * (m - dd) * .5; } }
  pushOut(a); animSkeleton(a, dt);
}
// Clips for the rigged skeleton (rise, strike, walk, idle) or limb swings for the primitive one; a hit makes it flash.
function animSkeleton(a, dt) {
  const M = a.model, flash = a.flash > 0;
  const dr = ((a.face - M.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; M.g.rotation.y += dr * Math.min(1, dt * 10);
  for (const m of M.mats) if (m.emissive) m.emissive.setHex(flash ? 0x888888 : 0x0c2a22);
  if (M.rigged) {
    a.lock = (a.lock || 0) - dt;
    const once = ([n, sp], fade = .1) => { const d = M.play(n, { once: true, speed: sp, fade }); a.lock = d / sp * .85; };
    if (a.riseAnim) { a.riseAnim = false; once([SKEL.rise.clip, SKEL.rise.speed], .05); }
    else if (a.windup > 0 && a.swingAnim !== a.atkSeq) { a.swingAnim = a.atkSeq; once(pick(SKEL.attacks)); }
    else if (a.lock <= 0) { if (a.moving) M.play(SKEL.walk, { speed: Math.min(1.8, Math.max(.7, SK.skeletons.spd / 2.6)) }); else M.play(SKEL.idle); }
    M.mixer.update(dt);
  } else {
    const w = a.moving ? Math.sin(a.walk) : 0; if (a.swing > 0) a.swing = Math.max(0, a.swing - dt * 4);
    M.legL.rotation.x = w * .7; M.legR.rotation.x = -w * .7;
    M.armR.rotation.x = a.windup > 0 ? -2.6 : a.swing > 0 ? -2.6 + (1 - a.swing) * 3.2 : w * .5; M.armL.rotation.x = -w * .5;
    M.g.position.y = a.moving ? Math.abs(Math.cos(a.walk)) * .06 : 0;
  }
}

// ================================================================ Bone Armour
const bone = { g: null, plates: [], mat: null };
function endBone() {
  BONE.n = 0; BONE.t = 0; BONE.onBlock = null;
  if (bone.g) { scene.remove(bone.g); bone.mat.dispose(); bone.g = null; bone.plates = []; }
}
export function castBoneArmour() {
  const K = SK.boneArmour; endBone();
  const n = K.plates + gemMile('boneArmour', 'ossuary', 'plates');
  BONE.n = BONE.max = n; BONE.t = K.dur; BONE.thorn = K.thorn * (gemHas('boneArmour', 'thorns') ? K.thornMile : 1) * gemScale('boneArmour');
  bone.g = new T.Group(); bone.mat = new T.MeshLambertMaterial({ color: 0xe6dcc6, emissive: 0x3a3426 });
  for (let i = 0; i < n; i++) { const p = new T.Mesh(GB, bone.mat); p.scale.set(.55, .85, .12); p.castShadow = true; bone.g.add(p); bone.plates.push(p); }
  scene.add(bone.g);
  BONE.onBlock = () => { const p = bone.plates[BONE.n]; if (p) { p.visible = false; burst(P.x + p.position.x, 1.1, P.z + p.position.z, 0xe6dcc6, 12, 4); } }; // BONE.n already dropped
  P.castAnim = .3; P.castSeq++; P.lastCast = 'ward';
  ringFx(P.x, P.z, 2, 0xe6dcc6, .4, .3); flashFx(P.x, 1, P.z, 0xe6dcc6, 3.4, .3); flashLight(P.x, P.z, 0xe6dcc6, 3, .3); SFX.nova();
  for (let i = 0; i < 14; i++) emit(glows, P.x + rand(-.6, .6), rand(.2, 1.8), P.z + rand(-.6, .6), 0, rand(.5, 2), 0, rand(.4, .7), 0xe6dcc6);
  return true;
}
addTicker(dt => {
  if (!bone.g) return;
  BONE.t -= dt;
  if (BONE.t <= 0 || BONE.n <= 0 || P.dead > 0) { if (BONE.n > 0) burst(P.x, 1, P.z, 0xe6dcc6, 10, 3); endBone(); return; }
  const K = SK.boneArmour, fade = Math.min(1, BONE.t * 2), live = bone.plates.length;
  bone.plates.forEach((p, i) => {
    const a = G.gt * K.spin + i / live * Math.PI * 2;
    p.position.set(Math.sin(a) * K.orbit, 1.05 + Math.sin(G.gt * 3 + i) * .06, Math.cos(a) * K.orbit); p.rotation.y = a; p.scale.set(.55 * fade, .85 * fade, .12 * fade);
  });
  bone.g.position.set(P.x, 0, P.z);
});
registerSkill('boneArmour', { cast: castBoneArmour });

// ================================================================ Decoy
const decoys = () => G.allies.filter(a => a.kind === 'decoy' && !a.gone);
function decoyModel() { // a straw dummy on a post with a sack head and a gold glow
  const g = new T.Group(), straw = new T.MeshLambertMaterial({ color: 0xc8a04a, emissive: 0x302000 }), wood = new T.MeshLambertMaterial({ color: 0x5a3a22 });
  const part = (geo, m, sx, sy, sz, x, y, z) => { const o = new T.Mesh(geo, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  part(GCY, wood, .07, 1.6, .07, 0, .8, 0); part(GB, wood, 1.1, .08, .08, 0, 1.2, 0); part(GCY, straw, .3, .7, .3, 0, 1.0, 0); part(GS, straw, .22, .22, .22, 0, 1.62, 0);
  for (const s of [-1, 1]) part(GS, straw, .1, .1, .1, s * .55, 1.2, 0);
  const glow = glowSprite(0xffd23f, 2.2); glow.position.y = 1.2; g.add(glow); g.add(aura(0xffd23f, 2.2, .35));
  const ring = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: .22, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .06; ring.scale.set(SK.decoy.tauntR, SK.decoy.tauntR, 1); g.add(ring);
  return { g, mats: [straw, wood, ring.material], glow, ring };
}
export function castDecoy() {
  const K = SK.decoy; for (const d of decoys()) { d.burst = false; killAlly(d); } // one at a time
  let tx = null, tz = null, bd = K.packRange;
  for (const e of G.enemies) { if (e.deathT || !e.awake) continue; const d = dist(e.x, e.z, P.x, P.z); if (d < bd) { bd = d; tx = e.x; tz = e.z; } }
  const ang = tx === null ? P.face : Math.atan2(tx - P.x, tz - P.z); let x = P.x, z = P.z;
  for (const r of [K.forward, K.forward * .6, 0]) { x = P.x + Math.sin(ang) * r; z = P.z + Math.cos(ang) * r; if (!blocked(x, z, K.r)) break; }
  const hp = S.maxLife * K.hp * (gemHas('decoy', 'sturdy') ? K.hpMile : 1), M = decoyModel();
  M.g.position.set(x, 0, z);
  addAlly({ kind: 'decoy', x, z, r: K.r, hp, maxHp: hp, t: K.dur, taunt: 1, tauntR: K.tauntR, sk: 'decoy', model: M, upd: updDecoy, onDeath: decoyEnd, burst: gemHas('decoy', 'burst') });
  P.castAnim = .3; P.castSeq++; P.lastCast = 'ward';
  ringFx(x, z, K.tauntR * .6, 0xffd23f, .5, .2); flashFx(x, 1.2, z, 0xffd23f, 3.4, .3); flashLight(x, z, 0xffd23f, 3, .3); burst(x, .6, z, 0xffd23f, 16, 3); SFX.dash();
  return true;
}
function updDecoy(a, dt) {
  const M = a.model, k = 1 + Math.sin(G.gt * 5) * .08, low = a.t < 1.2 && Math.sin(G.gt * 24) > 0;
  M.glow.scale.set(2.2 * k, 2.2 * k, 1); M.g.rotation.z = a.flash > 0 ? Math.sin(G.gt * 60) * .12 : 0; M.ring.rotation.z += dt * .3; M.g.visible = !low;
}
// When it ends (killed or expired), a decoy with the lv5 milestone bursts: a share of its max life as damage to everything near.
function decoyEnd(a) {
  const K = SK.decoy; ringFx(a.x, a.z, K.burstR, 0xffd23f, .35, .2);
  if (!a.burst) return;
  const r = K.burstR * S.aoe, d = a.maxHp * K.burstF * (1 + S.inc) * S.more;
  near(a.x, a.z, r, e => rawHit(e, d * rand(.9, 1.1), '#ffd23f'));
  flashFx(a.x, 1, a.z, 0xffd23f, r * 2.4, .3); ringFx(a.x, a.z, r, 0xffe080, .4, .3); burst(a.x, 1, a.z, 0xffd23f, 30, 6); SFX.boom(); shake(.1);
}
registerSkill('decoy', { cast: castDecoy });

// Allies and effects are cleared with the level (level.js teardown); the lances are ours.
levelHooks.start.push(() => { for (const p of lances) scene.remove(p.g); lances.length = 0; endBone(); });
Object.assign(dbg, { castLance, raiseSkeleton, skeletons, skeletonCap, castBoneArmour, castDecoy, lances: () => lances });
