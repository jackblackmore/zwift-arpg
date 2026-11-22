// Item generation, ground drops and pickup.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { SLOTS, BASES, IMPL, AFF, AFFBY, EXTRA, UNIQ, RAREN1, RAREN2, RCOL, DROP } from '../data/items.js';
import { rand, randi, pick } from '../core/util.js';
import { scene } from '../render/scene.js';
import { GB, GCY, decal } from '../render/assets.js';
import { toast } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { save } from './save.js';
import { flatScale, pctScale } from './formulas.js';
import { blocked } from '../world/map.js';

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
  const it = { id: G.itemId++, slot, rar, base: pick(BASES[slot]), il, mods: [[ist, ist === 'ms' || ist === 'dmg' ? iv : Math.round(iv * flatScale(il))]], impl: 1 };
  const pool = AFF.filter(a => !a.slots || a.slots.includes(slot)).sort(() => Math.random() - .5);
  const n = rar === 1 ? randi(1, 2) : randi(3, 5);
  for (const a of pool) { if (it.mods.length - 1 >= n) break; if (a.rare && Math.random() < (rar === 2 ? .4 : .85)) continue; it.mods.push([a.st, rollVal(a, il)]); }
  it.name = rar === 2 ? pick(RAREN1) + ' ' + pick(RAREN2) : `${AFFBY[it.mods[1][0]].mp} ${it.base}`;
  return it;
}
export function modText(st, v) {
  const a = AFFBY[st] || EXTRA[st]; if (!a) return st;
  if (a.flag) return a.t;
  const val = a.pct ? (a.sign && v > 0 ? '+' : '') + Math.round(v * 100) : a.dec ? v.toFixed(1) : v;
  return a.t.replace('#', val);
}
export function dropItem(x, z, boost) {
  const it = rollItem(G.tier, boost), g = new T.Group();
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
export function pickUp(d) {
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
