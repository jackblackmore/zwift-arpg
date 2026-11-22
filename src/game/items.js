// Item generation, ground drops and pickup.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { SLOTS, BASES, IMPL, AFF, AFFBY, EXTRA, UNIQ, RAREN1, RAREN2, RCOL, DROP, RETIRED } from '../data/items.js';
import { rand, randi, pick } from '../core/util.js';
import { scene } from '../render/scene.js';
import { GB, GCY, decal } from '../render/assets.js';
import { toast } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { save } from './save.js';
import { blocked } from '../world/map.js';
import { GEMS } from '../data/gems.js';
import { GEM_DROP, poolOf } from '../data/supports.js';
import { addGem } from './gems.js';

const flatScale = il => 1 + .22 * (il - 1), pctScale = il => 1 + .07 * (il - 1);
function rollVal(a, il) {
  const v = rand(a.a, a.b) * (a.pct ? pctScale(il) : flatScale(il));
  return a.int ? Math.max(1, Math.round(a.a === a.b ? a.a : v)) : a.pct ? Math.round(v * 100) / 100 : a.dec ? Math.round(v * 10) / 10 : Math.round(v);
}
export function rollItem(il, boost = 0) {
  const r = Math.random(); let rar = r < DROP.uniqueBase + boost * .4 ? 3 : r < DROP.rareBase + boost ? 2 : 1;
  const slot = pick(SLOTS);
  if (rar === 3) {
    const u = pick(UNIQ.filter(u => u.slot === slot));
    return { id: G.itemId++, slot, rar: 3, name: u.name, base: u.base, uid: u.id, il, fl: u.fl, mods: u.mods.map(([st, v]) => [st, (st === 'spell' || st === 'lifeF') ? Math.round(v * flatScale(il)) : v]) };
  }
  const [ist, iv] = IMPL[slot];
  const it = { id: G.itemId++, slot, rar, base: pick(BASES[slot]), il, mods: [[ist, ist === 'ms' || ist === 'dmg' || ist === 'cdr' ? iv : Math.round(iv * flatScale(il))]], impl: 1 };
  const pool = AFF.filter(a => !a.slots || a.slots.includes(slot)).sort(() => Math.random() - .5);
  const n = rar === 1 ? randi(1, 2) : randi(3, 5);
  for (const a of pool) { if (it.mods.length - 1 >= n) break; if (a.rare && Math.random() < (rar === 2 ? .4 : .85)) continue; it.mods.push([a.st, rollVal(a, il)]); }
  it.name = rar === 2 ? pick(RAREN1) + ' ' + pick(RAREN2) : `${AFFBY[it.mods[1][0]].mp} ${it.base}`;
  return it;
}
export function modText(st, v) {
  if (RETIRED.has(st)) return '';
  const a = AFFBY[st] || EXTRA[st]; if (!a) return st;
  if (a.flag) return a.t;
  const val = a.pct ? (a.sign && v > 0 ? '+' : '') + Math.round(v * 100) : a.dec ? v.toFixed(1) : v;
  return a.t.replace('#', val);
}
// Old saves: drop mods that no longer exist (a retired implicit becomes a small cooldown reduction).
export function cleanItem(it) {
  if (!it || !it.mods) return it;
  it.mods = it.mods.flatMap(([st, v], i) => !RETIRED.has(st) ? [[st, v]] : i === 0 && it.impl ? [['cdr', .04]] : []);
  return it;
}
export function dropItem(x, z, boost) {
  const it = rollItem(G.depth, boost), g = new T.Group();
  const m = new T.Mesh(GB, new T.MeshLambertMaterial({ color: RCOL[it.rar], emissive: RCOL[it.rar], emissiveIntensity: .35 })); m.scale.set(.32, .14, .42); g.add(m);
  if (it.rar >= 2) {
    const beam = new T.Mesh(GCY, new T.MeshBasicMaterial({ color: RCOL[it.rar], transparent: true, opacity: it.rar === 3 ? .5 : .3, blending: T.AdditiveBlending, depthWrite: false }));
    const w = it.rar === 3 ? .16 : .09; beam.scale.set(w, 9, w); beam.position.y = 4.5; g.add(beam); g.add(decal(RCOL[it.rar], it.rar === 3 ? 3 : 1.8));
  }
  const a = rand(0, 6.28), s = rand(.8, 2.2);
  const d = { it, x, z, y: .4, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 5, g, t: 0, landed: false };
  g.position.set(x, .4, z); scene.add(g); G.ground.push(d);
  if (it.rar >= 2) SFX.loot(it.rar);
  return d;
}
// A gem lying on the ground: d.gem = { id, lvl } (d.it is a stub so the item-only readers, the minimap and the beam, keep working). With no id
// it rolls one from the region pool (data/supports.js); lvl defaults to the Crypt number. Picking it up never needs bag space.
export function dropGem(x, z, id, lvl) {
  if (!id) { const pool = poolOf(); let r = Math.random() * Object.values(pool).reduce((a, b) => a + b, 0); for (const k in pool) if ((r -= pool[k]) < 0) { id = k; break; } id = id || Object.keys(pool)[0]; }
  lvl = lvl || Math.max(1, Math.round((G.crypt || 1) * GEM_DROP.gemLvlPerCrypt));
  const def = GEMS[id], col = new T.Color(def.color), g = new T.Group();
  const label = `◆ ${def.name}${def.kind === 'support' ? ' (support)' : ''}`;
  const m = new T.Mesh(GEMGEO, new T.MeshBasicMaterial({ color: col })); m.scale.set(.2, .3, .2); m.position.y = .2; g.add(m);
  const beam = new T.Mesh(GCY, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }));
  beam.scale.set(.09, 7, .09); beam.position.y = 3.5; g.add(beam); g.add(decal(col.getHex(), 1.6));
  const a = rand(0, 6.28), s = rand(.8, 2.2);
  const d = { it: { name: label, rar: 2, gem: true }, gem: { id, lvl }, col: def.color, x, z, y: .4, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 5, g, t: 0, landed: false };
  g.position.set(x, .4, z); scene.add(g); G.ground.push(d); SFX.loot(2);
  return d;
}
const GEMGEO = new T.OctahedronGeometry(1);
export function pickUp(d) {
  if (d.gem) { addGem(d.gem.id, d.gem.lvl); scene.remove(d.g); d.gone = true; save(); return; }
  if (P.inv.length >= DROP.bagSize) { if (!d.full) { toast('<span style="color:#ff6a5a">Bag is full</span> · press I to clear space'); d.full = 1; } return; }
  P.inv.push(d.it); P.newItems++; scene.remove(d.g); d.gone = true;
  toast(`<span class="r${d.it.rar}">${d.it.name}</span>`); if (d.it.rar < 2) SFX.loot(1);
  save();
}
export function updItems(dt) {
  for (const d of G.ground) {
    if (d.landed) continue;
    d.vy -= 16 * dt; d.x += d.vx * dt; d.z += d.vz * dt; d.y += d.vy * dt;
    if (blocked(d.x, d.z, .2)) { d.vx *= -.4; d.vz *= -.4; d.x += d.vx * dt * 2; d.z += d.vz * dt * 2; }
    if (d.y <= .08) { d.y = .08; d.landed = true; }
    d.g.position.set(d.x, d.y, d.z); d.g.children[0].rotation.y += dt * 8;
  }
  G.ground = G.ground.filter(d => !d.gone);
}
