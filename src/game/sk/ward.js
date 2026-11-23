// Frost Ward (Guard gem): a ring of cold around you for a few seconds. Monsters inside are chilled (slowed, the same chill
// Frost Nova gives bosses) and take cold damage every tick, and you take less damage while it holds (P.wardT, read in
// hurtP). The alternative to Magic Shield: it keeps monsters off you instead of soaking a hit. Milestone: +25% radius.
import * as T from 'three';
import { G, P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { rand } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene } from '../../render/scene.js';
import { decal } from '../../render/assets.js';
import { glows, emit, ringFx, flashFx } from '../../render/fx.js';
import { near } from '../enemies.js';
import { hit, pay } from '../combat.js';

let ring = null, tickT = 0, radius = 0;
const drop = () => { if (ring) { scene.remove(ring); ring = null; } };

export default {
  cast() {
    const W = SK.ward; if (!pay(W.cost)) return false;
    radius = W.radius * S.aoe * (S.mile.ward ? 1.25 : 1);
    P.wardT = W.dur; tickT = 0; P.castAnim = .2; P.castSeq++; P.lastCast = 'ward';
    drop(); ring = new T.Group(); ring.add(decal(0x7fd8ff, radius * 2.2)); scene.add(ring);
    ringFx(P.x, P.z, radius, 0x9fe8ff, .45, .1); flashFx(P.x, .8, P.z, 0x7fd8ff, radius * 1.6, .3);
    for (let i = 0; i < 24; i++) { const a = rand(0, 6.28); emit(glows, P.x + Math.cos(a) * radius * .8, rand(.2, 1.2), P.z + Math.sin(a) * radius * .8, 0, rand(.3, 1), 0, rand(.3, .6), 0xbff0ff); }
    SFX.nova(); return true;
  },
  tick(dt) {
    if (!(P.wardT > 0)) return drop();
    P.wardT -= dt;
    if (P.dead > 0 || P.wardT <= 0) { P.wardT = 0; return drop(); }
    const W = SK.ward;
    ring.position.set(P.x, 0, P.z); ring.scale.setScalar(1 + Math.sin(G.gt * 5) * .03); ring.rotation.y += dt * .6;
    if (Math.random() < dt * 20) { const a = rand(0, 6.28); emit(glows, P.x + Math.cos(a) * radius, .2, P.z + Math.sin(a) * radius, 0, rand(.4, 1.2), 0, rand(.3, .5), 0xbff0ff); }
    near(P.x, P.z, radius, e => { e.chill = Math.max(e.chill, .35); });
    tickT -= dt;
    if (tickT <= 0) { tickT = W.tick; near(P.x, P.z, radius, e => hit(e, W.mult, 'cold', { gem: 'ward', dot: true })); }
  },
  clear() { P.wardT = 0; drop(); },
};
