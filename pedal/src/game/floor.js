import * as T from 'three';
import { S, hero } from '../core/state.js';
import { pick } from '../core/util.js';
import { scene } from '../render/scene.js';
import { lam, box, markerSprite } from '../render/models.js';
import { M, idx, bfs, genLayout } from '../world/map.js';
import { WB, buildWorld, revealRoom } from '../world/build.js';
import { endTell } from './tells.js';

export function newFloor() {
  S.enemies.forEach(e => { scene.remove(e.model.g); e.bar.remove(); }); S.enemies = [];
  S.arrows.forEach(a => scene.remove(a.m)); S.arrows = []; if (S.curTell) endTell();
  S.effects.forEach(f => scene.remove(f.mesh)); S.effects = [];
  S.campLights.forEach(l => scene.remove(l)); S.campLights = [];
  if (S.stairs) { scene.remove(S.stairs); S.stairs = null; }
  WB.cut = []; genLayout(); buildWorld();
  const { rooms } = M, world = WB.world;
  // start = room nearest to a corner, boss = farthest by walking distance
  let si = 0; rooms.forEach((r, i) => { if (r.cx + r.cy < rooms[si].cx + rooms[si].cy) si = i; });
  const d = bfs(rooms[si].cx, rooms[si].cy);
  let bi = si; rooms.forEach((r, i) => { if (d[idx(r.cx, r.cy)] > d[idx(rooms[bi].cx, rooms[bi].cy)]) bi = i; });
  const rest = ['elite', 'treasure', 'campfire', 'combat', 'combat'];
  while (rest.length < rooms.length - 2) rest.push(pick(['combat', 'combat', 'elite', 'treasure', 'campfire']));
  rest.sort(() => Math.random() - .5);
  rooms.forEach((r, i) => {
    r.type = i === si ? 'start' : i === bi ? 'boss' : rest.pop();
    r.entered = false; r.done = r.type === 'start'; r.populated = false;
    r.marker = markerSprite(r.type); r.marker.position.set(r.cx, 2.4, r.cy); r.marker.visible = false; world.add(r.marker);
    if (r.type === 'treasure') {
      const g = new T.Group(); const base = box(.8, .45, .55, lam(0x6a4220)); base.position.y = .22; g.add(base);
      const lid = new T.Group(); lid.position.set(0, .45, -.27); const lm = box(.8, .18, .55, lam(0x7a4c24)); lm.position.set(0, .09, .27); lid.add(lm); g.add(lid);
      const trim = box(.84, .06, .59, lam(0xc9a040, 0x332200)); trim.position.y = .45; g.add(trim);
      g.position.set(r.cx, 0, r.cy); world.add(g); r.chest = { g, lid };
    }
    if (r.type === 'campfire') {
      const g = new T.Group();
      for (let k = 0; k < 3; k++) { const l = box(.7, .1, .12, lam(0x4a2e18)); l.rotation.y = k * 1.05; l.position.y = .06; g.add(l); }
      const fl = new T.Mesh(new T.ConeGeometry(.22, .6, 8), new T.MeshBasicMaterial({ color: 0xff8a2a })); fl.position.y = .38; g.add(fl);
      const fl2 = new T.Mesh(new T.ConeGeometry(.12, .4, 8), new T.MeshBasicMaterial({ color: 0xffe08a })); fl2.position.y = .32; g.add(fl2);
      g.position.set(r.cx, 0, r.cy); world.add(g); r.fire = { g, fl, fl2 };
      const L = new T.PointLight(0xff7a2a, 1.4, 7, 1.6); L.position.set(r.cx, 1.2, r.cy); scene.add(L); S.campLights.push(L);
    }
  });
  const s = rooms[si];
  hero.x = s.cx; hero.z = s.cy; hero.path = null; hero.goal = null; S.choices = null;
  s.entered = true; revealRoom(s); s.marker.visible = true;
  S.heroModel.g.position.set(hero.x, 0, hero.z);
}
