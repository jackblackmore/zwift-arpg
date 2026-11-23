// Primitive low-poly models. Each enemy gets its own body/head materials so it can flash and freeze.
import * as T from 'three';
import { GB, GS, GC, GCY, GPLANE, eyeMat, glowSprite } from './assets.js';
import { rand } from '../core/util.js';

export function buildModel(o, extra = {}) {
  const g = new T.Group(), bm = new T.MeshLambertMaterial({ color: o.col }), hm = new T.MeshLambertMaterial({ color: o.head || o.col });
  const part = (geo, mat, sx, sy, sz, x, y, z, par = g) => { const m = new T.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); par.add(m); return m; };
  const R = { g, mats: [bm, hm] };
  if (o.blob) {
    R.body = part(GS, bm, .62, .55, .62, 0, .62, 0);
    for (let i = 0; i < 5; i++) part(GS, hm, .14, .14, .14, rand(-.45, .45), rand(.5, 1.05), rand(-.45, .45));
    for (const s of [-1, 1]) part(GS, eyeMat(o.eye), .06, .06, .06, s * .16, .85, .55);
  } else {
    R.torso = part(GB, bm, .5, .62, .32, 0, .98, 0);
    part(GS, hm, .19, .19, .19, 0, 1.46, 0);
    for (const s of [-1, 1]) part(GB, eyeMat(o.eye), .05, .04, .02, s * .07, 1.49, .17);
    const limb = (x, y, w, h) => { const p = new T.Group(); p.position.set(x, y, 0); g.add(p); part(GB, bm, w, h, w, 0, -h / 2, 0, p); return p; };
    R.armL = limb(-.33, 1.24, .14, .56); R.armR = limb(.33, 1.24, .14, .56); R.legL = limb(-.13, .68, .18, .68); R.legR = limb(.13, .68, .18, .68);
    if (o.horns) for (const s of [-1, 1]) { const h = part(GC, eyeMat(0x1a1418), .06, .32, .06, s * .14, 1.68, 0); h.rotation.z = -s * .5; }
    if (o.bow) { const b = part(GB, eyeMat(0x5a3a1a), .04, .7, .04, 0, -.5, .1, R.armL); b.rotation.x = .3; }
    if (extra.staff) {
      const s = part(GCY, eyeMat(0x5a3a22), .035, 1.5, .035, 0, -.5, .15, R.armR); s.rotation.x = Math.PI / 2 - .2;
      const orb = glowSprite(0x7fd8ff, .55); orb.position.set(0, -.62, .85); R.armR.add(orb); R.orb = orb;
    }
    if (extra.sword) { const b = part(GB, eyeMat(0xc8ccd4), .05, .9, .03, 0, -.75, .1, R.armR); b.rotation.x = .25; }
    if (extra.shield) { const sh = part(GCY, eyeMat(0x7a5a2a), .3, .05, .3, -.08, -.4, .05, R.armL); sh.rotation.z = Math.PI / 2; }
    if (extra.hood) {
      part(GC, bm, .21, .32, .21, 0, 1.68, -.02);
      const c = new T.Mesh(GPLANE, new T.MeshLambertMaterial({ color: 0x7a1a20, side: T.DoubleSide })); c.scale.set(.5, .85, 1); c.position.set(0, .82, -.18); c.rotation.x = .12; g.add(c);
    }
  }
  g.scale.setScalar(o.scale || 1);
  R.mats.forEach(m => { m.userData.c = m.color.getHex(); });
  return R;
}
