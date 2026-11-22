// Primitive placeholder models. Swap for animated low-poly packs later.
import * as T from 'three';
import { ROOM } from '../data/combat.js';

export const lam = (color, emissive = 0) => new T.MeshLambertMaterial({ color, emissive });
export const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
export const sph = (r, m) => new T.Mesh(new T.SphereGeometry(r, 12, 10), m);

export function humanoid(o) {
  const g = new T.Group(), body = lam(o.body), dark = lam(o.dark), head = lam(o.head, o.headE || 0);
  const torso = box(.48, .55, .3, body); torso.position.y = .86; g.add(torso);
  const hd = sph(.17, head); hd.position.y = 1.29; g.add(hd);
  if (o.eyes) { const em = lam(0x000000, o.eyes); for (const s of [-1, 1]) { const e = box(.05, .04, .02, em); e.position.set(s * .06, 1.31, .16); g.add(e); } }
  if (o.helm) { const h = new T.Mesh(new T.CylinderGeometry(.19, .2, .14, 10), body); h.position.y = 1.38; g.add(h); }
  if (o.horns) { const hm = lam(o.horns); for (const s of [-1, 1]) { const h = new T.Mesh(new T.ConeGeometry(.05, .25, 6), hm); h.position.set(s * .13, 1.47, 0); h.rotation.z = -s * .4; g.add(h); } }
  const leg = s => { const p = new T.Group(); p.position.set(s * .13, .58, 0); const l = box(.16, .5, .18, dark); l.position.y = -.25; p.add(l); g.add(p); return p; };
  const arm = s => { const p = new T.Group(); p.position.set(s * .33, 1.07, 0); const a = box(.13, .48, .14, body); a.position.y = -.22; p.add(a); g.add(p); return p; };
  const legL = leg(-1), legR = leg(1), armL = arm(-1), armR = arm(1);
  let blade = null;
  if (o.weapon) {
    const hilt = new T.Group(); hilt.position.y = -.46; hilt.rotation.x = Math.PI / 2; armR.add(hilt);
    blade = box(.07, .08, o.weaponLen || .85, lam(o.weapon, o.weaponE || 0)); blade.position.z = (o.weaponLen || .85) / 2; hilt.add(blade);
    const guard = box(.26, .06, .06, lam(0x9a8a60)); hilt.add(guard);
  }
  if (o.shield) { const s = box(.08, .42, .34, lam(o.shield)); s.position.set(-.08, -.3, .05); armL.add(s); }
  if (o.cape) { const c = new T.Mesh(new T.PlaneGeometry(.46, .75), new T.MeshLambertMaterial({ color: o.cape, side: T.DoubleSide })); c.position.set(0, .78, -.17); c.rotation.x = .12; g.add(c); }
  g.scale.setScalar(o.scale || 1);
  return { g, legL, legR, armL, armR, torso, blade };
}
export function slimeModel(col) {
  const g = new T.Group();
  const m = new T.Mesh(new T.SphereGeometry(.42, 16, 12), new T.MeshLambertMaterial({ color: col, emissive: 0x0c3a12, transparent: true, opacity: .88 }));
  m.position.y = .33; g.add(m);
  const em = lam(0x000000, 0xffffff); for (const s of [-1, 1]) { const e = sph(.05, em); e.position.set(s * .12, .45, .34); g.add(e); }
  return { g, body: m };
}
export function batModel() {
  const g = new T.Group(), m = lam(0x2a1a3a), em = lam(0x000000, 0xff3050);
  const b = sph(.17, m); b.position.y = 1.1; g.add(b);
  const wing = s => { const p = new T.Group(); p.position.set(s * .12, 1.12, 0); const w = box(.4, .03, .22, m); w.position.x = s * .2; p.add(w); g.add(p); return p; };
  const wingL = wing(-1), wingR = wing(1);
  for (const s of [-1, 1]) { const e = sph(.03, em); e.position.set(s * .06, 1.14, .15); g.add(e); }
  return { g, wingL, wingR };
}
export function collectMats(g) {
  const mats = [];
  g.traverse(o => { if (o.material && !mats.includes(o.material)) { o.material = o.material.clone(); mats.push(o.material); } });
  mats.forEach(m => m.userData.e = m.emissive ? m.emissive.getHex() : 0);
  return mats;
}
export function flash(ent, on) { for (const m of ent.mats) if (m.emissive) m.emissive.setHex(on ? 0x884444 : m.userData.e); }

export function markerSprite(type) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const col = ROOM[type].col;
  x.fillStyle = '#0b0910dd'; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.fill();
  x.lineWidth = 7; x.strokeStyle = col; x.stroke();
  x.fillStyle = col; x.font = '700 58px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ROOM[type].glyph, 64, 68);
  const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true }));
  s.scale.set(1.1, 1.1, 1); s.renderOrder = 10; return s;
}
