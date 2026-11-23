// Meteor (Flex, press): marks the aim point; after a short delay a meteor lands for a big fire hit and leaves burning ground.
// Milestone (gem level 5): +30% radius. Twin Meteor support: a second, weaker meteor beside the first.
import * as T from 'three';
import { P, S, shake } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { GEMS, SUPPORTS } from '../../data/gems.js';
import { dist, rand, pick } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene, flashLight } from '../../render/scene.js';
import { glowSprite } from '../../render/assets.js';
import { emit, sparks, glows, ringFx, flashFx, telegraph } from '../../render/fx.js';
import { near } from '../enemies.js';
import { hit, addPatch } from '../combat.js';
import { aim } from '../skills.js';

let falling = []; // { x, z, r, t, g }
const rockGeo = new T.DodecahedronGeometry(.6, 0), rockMat = new T.MeshLambertMaterial({ color: 0x3a2a22, emissive: 0xff4a10 });

function cast() {
  const K = SK.meteor;
  let [x, z] = aim(); const d = dist(x, z, P.x, P.z) || 1;
  if (d > K.range) { x = P.x + (x - P.x) / d * K.range; z = P.z + (z - P.z) / d * K.range; }
  const r = K.radius * S.aoe * (S.mile.meteor ? GEMS.meteor.mile.radius : 1);
  drop(x, z, r, K.delay, K.mult);
  // Twin Meteor support: a second, weaker one a little later, beside the first (away from you, so it lands among them).
  if (S.sk.meteor.twin) { const W = SUPPORTS.twinmeteor, a = Math.atan2(x - P.x, z - P.z) + rand(-1.2, 1.2); drop(x + Math.sin(a) * r * W.off, z + Math.cos(a) * r * W.off, r, K.delay + W.delay, K.mult * W.mult); }
  P.face = Math.atan2(x - P.x, z - P.z); P.castAnim = .4; P.castSeq++; P.lastCast = 'meteor';
  SFX.nova(); return true;
}

function drop(x, z, r, t, mult) {
  telegraph(x, z, r, t, 0xff7a20);
  const g = new T.Group(); g.add(glowSprite(0xff5a10, 2.6), glowSprite(0xffe0a0, 1.1), new T.Mesh(rockGeo, rockMat));
  g.position.set(x - 4, 16, z - 2); scene.add(g);
  falling.push({ x, z, r, t, max: t, mult, g });
}

function land(m) {
  const K = SK.meteor;
  scene.remove(m.g);
  near(m.x, m.z, m.r, e => {
    const dd = dist(e.x, e.z, m.x, m.z) || 1;
    const d = hit(e, m.mult, 'fire', { gem: 'meteor', kx: (e.x - m.x) / dd, kz: (e.z - m.z) / dd });
    const IG = SUPPORTS.ignite; if (S.sk.meteor.ignite && !e.deathT) { e.burnT = IG.dur; e.burnDps = Math.max(e.burnDps, d * IG.share / IG.dur); }
  });
  addPatch(m.x, m.z, m.r * .85, K.burn, 'meteor');
  flashFx(m.x, 1, m.z, 0xff7a2a, m.r * 2.8, .35); flashFx(m.x, 1, m.z, 0xffe0a0, m.r * 1.3, .2); ringFx(m.x, m.z, m.r, 0xff8a3c, .4, .3); ringFx(m.x, m.z, m.r * .6, 0xffe0a0, .3, .2);
  for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), s = rand(3, 9); emit(sparks, m.x, 1, m.z, Math.cos(a) * s, rand(2, 8), Math.sin(a) * s, rand(.4, .9), pick([0xff8a3c, 0xffd060, 0xff4a10]), 9, 2); }
  for (let i = 0; i < 8; i++) emit(glows, m.x + rand(-1, 1), .8, m.z + rand(-1, 1), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(.4, .8), 0xff5a10, 0, 2);
  flashLight(m.x, m.z, 0xff7a2a, 5, .4); SFX.boom(); shake(.2);
}

function tick(dt) {
  if (!falling.length) return;
  const K = SK.meteor;
  for (const m of falling) {
    m.t -= dt; const k = Math.max(0, Math.min(1, m.t / K.delay));
    m.g.position.set(m.x - 4 * k, .8 + 15 * k * k, m.z - 2 * k);
    if (m.t <= 0) { m.dead = true; land(m); }
  }
  falling = falling.filter(m => !m.dead);
}

function clear() { for (const m of falling) scene.remove(m.g); falling = []; }

export default { cast, tick, clear };
