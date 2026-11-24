// Shield arts: Guard gems that keep the Knight's Shield's block and parry and change what they do (design notes "Fight
// mechanics", build order step 3⅞ part 2 item 4). Numbers in SK.shield and SK.ward (data/skills.js), support and milestone
// numbers in data/gems.js. game/sk/guard.js applies SK[art].guard to the block and calls parry() and col here.
//   Magic Shield: a parry wraps you in a barrier (P.shield, absorbed in hurtP after the block; the bubble in render/draw.js).
//   Frost Ward: a parry chills the attacker and leaves a frost ring on the ground that chills and bites what's inside.
// Everything drawn here is primitives (decals, rings, particles), so it works without the KayKit models.
import * as T from 'three';
import { G, P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { GEMS } from '../../data/gems.js';
import { rand } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene } from '../../render/scene.js';
import { decal } from '../../render/assets.js';
import { glows, sparks, emit, ringFx, flashFx, floatT, burst } from '../../render/fx.js';
import { near } from '../enemies.js';
import { hit } from '../combat.js';

const BARRIER = 0x7fb8ff, FROST = 0x9fe8ff;

// Frost Ward's rings on the ground: { x, z, r, t, max, tick, g }.
let rings = [];
const dropRing = f => scene.remove(f.g);

export const ART = {
  shield: {
    col: BARRIER,
    // A parry adds a barrier, up to the cap; the timer restarts.
    parry() {
      const H = SK.shield, mul = S.sk.shield.shieldMul, cap = S.maxLife * H.cap * mul, was = P.shield || 0;
      P.shield = Math.min(cap, was + S.maxLife * H.barrier * mul); P.shieldT = H.dur; P.barrierFx = .5;
      const add = Math.round(P.shield - was);
      floatT(P.x, 3.1, P.z, add > 0 ? `BARRIER +${add}` : 'BARRIER FULL', '#9fc8ff', 14);
      ringFx(P.x, P.z, 1.3, BARRIER, .35, .1); flashFx(P.x, 1, P.z, BARRIER, 3, .25);
      for (let i = 0; i < 18; i++) { const a = rand(0, 6.28); emit(glows, P.x + Math.cos(a) * .9, rand(.2, 1.8), P.z + Math.sin(a) * .9, 0, rand(.3, 1), 0, rand(.3, .6), 0x9fc8ff); }
    },
  },
  ward: {
    col: FROST,
    // A parry chills the attacker and drops a frost ring where you stand.
    parry(by) {
      const W = SK.ward, k = S.sk.ward.dur, r = W.radius * S.aoe * (S.mile.ward ? GEMS.ward.mile.radius : 1);
      if (by && !by.deathT) { by.chill = Math.max(by.chill || 0, W.chill * k); floatT(by.x, by.h + .4, by.z, 'CHILLED', '#bff0ff', 13); burst(by.x, by.h * .6, by.z, FROST, 16, 4); }
      while (rings.length >= W.rings) dropRing(rings.shift());
      const g = new T.Group(); g.add(decal(0x7fd8ff, r * 2.2)); g.position.set(P.x, 0, P.z); scene.add(g);
      rings.push({ x: P.x, z: P.z, r, t: W.dur * k, max: W.dur * k, tick: 0, g });
      ringFx(P.x, P.z, r, FROST, .45, .1); flashFx(P.x, .8, P.z, 0x7fd8ff, r * 1.6, .3);
      for (let i = 0; i < 20; i++) { const a = rand(0, 6.28); emit(sparks, P.x, rand(.2, .8), P.z, Math.cos(a) * rand(3, 6), rand(0, 1.5), Math.sin(a) * rand(3, 6), rand(.3, .45), 0xbff0ff, 2, 3); }
      SFX.nova();
    },
  },
};

// Every tick (game/casts.js TICK): the barrier fades on its own timer in game/update.js; the frost rings chill and bite here.
function tick(dt) {
  const W = SK.ward;
  for (const f of rings) {
    f.t -= dt; f.tick -= dt;
    f.g.scale.setScalar(.7 + .3 * Math.min(1, f.t / f.max * 3)); f.g.rotation.y += dt * .6;
    if (Math.random() < dt * 16) { const a = rand(0, 6.28); emit(glows, f.x + Math.cos(a) * f.r, .2, f.z + Math.sin(a) * f.r, 0, rand(.4, 1.2), 0, rand(.3, .5), 0xbff0ff); }
    near(f.x, f.z, f.r, e => { e.chill = Math.max(e.chill, W.ringChill); });
    if (f.tick <= 0) { f.tick = W.tick; near(f.x, f.z, f.r, e => hit(e, W.mult, 'cold', { gem: 'ward', dot: true })); }
    if (f.t <= 0) { f.dead = true; dropRing(f); }
  }
  if (rings.some(f => f.dead)) rings = rings.filter(f => !f.dead);
}
function clear() { rings.forEach(dropRing); rings = []; }
// For tests and the debug console.
export const frostRings = () => rings;

export default { tick, clear };
