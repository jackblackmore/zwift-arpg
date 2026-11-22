// Turns the grid into meshes, and handles fog-of-war reveal and wall cutaway.
import * as T from 'three';
import { hero } from '../core/state.js';
import { rand, randi } from '../core/util.js';
import { scene } from '../render/scene.js';
import { lam, box, sph } from '../render/models.js';
import { MAP, idx, M, walk } from './map.js';

export const WB = {
  world: new T.Group(), floorIM: null, wallIM: null, floorCells: [], wallCells: [],
  floorIndexOf: null, wallIndexOf: null, props: [], torches: [], cut: [], cutT: 0,
};
scene.add(WB.world);
const M4 = new T.Matrix4(), ZERO = new T.Matrix4().makeScale(0, 0, 0);

export function buildWorld() {
  scene.remove(WB.world); WB.world = new T.Group(); scene.add(WB.world);
  const world = WB.world, floorCells = WB.floorCells = [], wallCells = WB.wallCells = [];
  const floorIndexOf = WB.floorIndexOf = new Int32Array(MAP * MAP).fill(-1);
  const wallIndexOf = WB.wallIndexOf = new Int32Array(MAP * MAP).fill(-1);
  const { grid, roomOf, pillars, rooms } = M;
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    if (grid[idx(x, y)]) { floorIndexOf[idx(x, y)] = floorCells.length; floorCells.push([x, y]); }
    else {
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (walk(x + dx, y + dy)) near = true;
      if (near && !pillars.some(([px, py]) => px === x && py === y)) { wallIndexOf[idx(x, y)] = wallCells.length; wallCells.push([x, y]); }
    }
  }
  const floorIM = WB.floorIM = new T.InstancedMesh(new T.BoxGeometry(.98, .2, .98), new T.MeshLambertMaterial({ color: 0xffffff }), floorCells.length);
  const wallIM = WB.wallIM = new T.InstancedMesh(new T.BoxGeometry(1, .8, 1), new T.MeshLambertMaterial({ color: 0xffffff }), wallCells.length);
  const c = new T.Color();
  floorCells.forEach(([x, y], i) => {
    floorIM.setMatrixAt(i, ZERO);
    const corridor = roomOf[idx(x, y)] < 0, v = rand(.85, 1.05);
    c.setRGB(.24 * v, .21 * v, .27 * v); if (corridor) c.multiplyScalar(.8); if ((x + y) % 2) c.multiplyScalar(.93);
    floorIM.setColorAt(i, c);
  });
  wallCells.forEach(([x, y], i) => { wallIM.setMatrixAt(i, ZERO); const v = rand(.8, 1.05); c.setRGB(.36 * v, .31 * v, .38 * v); wallIM.setColorAt(i, c); });
  world.add(floorIM, wallIM);
  M.revealed = new Uint8Array(MAP * MAP);
  const props = WB.props = [], torches = WB.torches = [];
  const stone = lam(0x4a4052), cap = lam(0x5a4f62);
  for (const [x, y] of pillars) {
    const g = new T.Group(); const cy = new T.Mesh(new T.CylinderGeometry(.26, .3, 1.5, 10), stone); cy.position.y = .75; g.add(cy);
    const b = box(.7, .16, .7, cap); b.position.y = .08; g.add(b); const t = box(.66, .14, .66, cap); t.position.y = 1.52; g.add(t);
    g.position.set(x, 0, y); world.add(g); props.push({ m: g, x, y });
  }
  const boneM = lam(0xcfc6b0), rubM = lam(0x3a3240);
  for (const r of rooms) {
    // wall torches on the far walls (visible to the camera)
    const spots = [];
    for (let x = r.x; x < r.x + r.w; x++) if (wallIndexOf[idx(x, r.y - 1)] >= 0 && x % 3 === 1) spots.push([x, r.y - 1, 0, .45]);
    for (let y = r.y; y < r.y + r.h; y++) if (wallIndexOf[idx(r.x - 1, y)] >= 0 && y % 3 === 1) spots.push([r.x - 1, y, .45, 0]);
    spots.sort(() => Math.random() - .5).slice(0, 3).forEach(([x, y, ox, oz]) => {
      const g = new T.Group(); const br = box(.08, .3, .08, lam(0x2a2018)); br.position.y = .95; g.add(br);
      const fl = new T.Mesh(new T.ConeGeometry(.09, .26, 6), new T.MeshBasicMaterial({ color: 0xffa040 })); fl.position.y = 1.22; g.add(fl);
      g.position.set(x + ox, 0, y + oz); world.add(g); props.push({ m: g, x, y }); torches.push(fl);
    });
    // floor debris
    for (let k = randi(0, 3); k > 0; k--) {
      const x = randi(r.x, r.x + r.w - 1), y = randi(r.y, r.y + r.h - 1); if (!walk(x, y)) continue;
      const g = new T.Group();
      if (Math.random() < .6) { for (let j = 0; j < 3; j++) { const b = box(.32, .05, .05, boneM); b.position.set(rand(-.25, .25), .03, rand(-.25, .25)); b.rotation.y = rand(0, 3); g.add(b); } const sk = sph(.09, boneM); sk.position.set(rand(-.2, .2), .08, rand(-.2, .2)); g.add(sk); }
      else for (let j = 0; j < 4; j++) { const b = box(rand(.1, .22), rand(.06, .14), rand(.1, .22), rubM); b.position.set(rand(-.35, .35), .05, rand(-.35, .35)); b.rotation.y = rand(0, 3); g.add(b); }
      g.position.set(x, 0, y); world.add(g); props.push({ m: g, x, y });
    }
  }
}

// Flatten walls between the camera and the hero so the hero stays visible.
export function cutaway() {
  const { wallIM, wallCells, wallIndexOf } = WB, { revealed } = M;
  for (const i of WB.cut) { const [x, y] = wallCells[i]; if (revealed[idx(x, y)]) { M4.makeTranslation(x, .4, y); wallIM.setMatrixAt(i, M4); } }
  WB.cut = [];
  const hx = Math.round(hero.x), hz = Math.round(hero.z);
  for (let dy = -2; dy <= 7; dy++) for (let dx = -2; dx <= 7; dx++) {
    const along = dx + dy, perp = Math.abs(dx - dy);
    if (along < 1 || along > 8 || perp > 3) continue;
    const x = hx + dx, y = hz + dy; if (x < 0 || y < 0 || x >= MAP || y >= MAP) continue;
    const i = wallIndexOf[idx(x, y)];
    if (i >= 0 && revealed[idx(x, y)]) { M4.makeScale(1, .12, 1); M4.setPosition(x, .05, y); wallIM.setMatrixAt(i, M4); WB.cut.push(i); }
  }
  wallIM.instanceMatrix.needsUpdate = true;
}
function revealCell(x, y) {
  const { revealed } = M;
  if (x < 0 || y < 0 || x >= MAP || y >= MAP || revealed[idx(x, y)]) return false;
  revealed[idx(x, y)] = 1;
  const fi = WB.floorIndexOf[idx(x, y)], wi = WB.wallIndexOf[idx(x, y)];
  if (fi >= 0) { M4.makeTranslation(x, -.1, y); WB.floorIM.setMatrixAt(fi, M4); }
  if (wi >= 0) { M4.makeTranslation(x, .4, y); WB.wallIM.setMatrixAt(wi, M4); }
  return true;
}
export function revealAround(cx, cz, r) {
  let ch = false;
  for (let y = Math.floor(cz - r); y <= cz + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++)
    if ((x - cx) ** 2 + (y - cz) ** 2 <= r * r) ch = revealCell(x, y) || ch;
  if (ch) { WB.floorIM.instanceMatrix.needsUpdate = true; WB.wallIM.instanceMatrix.needsUpdate = true; }
}
export function revealRoom(r) {
  for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) revealCell(x, y);
  WB.floorIM.instanceMatrix.needsUpdate = true; WB.wallIM.instanceMatrix.needsUpdate = true;
}
