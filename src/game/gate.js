// Fog gates (Dark Souls): a misty barrier across the doorways of the guardian's arena and of elite rooms. It hangs faintly in the
// doorway until the fight starts; once you're inside the room and its guardian or elite is awake it thickens and seals (its
// gaps' cells become wall, so nothing walks, paths or sees through), and it opens only when that foe dies (for good) or you die
// (it reopens and the guardian or elite resets, game/maps.js respawn). The autopilot treats a sealed gate as a commitment (game/autopilot.js). Numbers and which rooms
// get one: GATE in data/dungeon.js. The look (mist texture, layers, fade) is tuned here.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { GATE } from '../data/dungeon.js';
import { doorCells, roomAt } from '../world/gen.js';
import { glowSprite, glowTex } from '../render/assets.js';
import { SFX } from '../core/audio.js';
import { burst } from '../render/fx.js';

// The look's randomness has its own little generator, so building a gate doesn't shift the game's Math.random sequence (seeded tests).
let vs = 7; const vr = () => (vs = (vs * 16807) % 2147483647) / 2147483647;
let mistTex = null;
function mist() {
  if (mistTex) return mistTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  // Soft vertical wisps, thick at the floor and thinning upward, fading at the sides; the texture scrolls (see updGate).
  for (let k = 0; k < 70; k++) {
    const px = vr() * 128, w = 6 + vr() * 18, a = .05 + vr() * .12, g = x.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, `rgba(235,240,255,${a * 1.6})`); g.addColorStop(.55, `rgba(220,228,255,${a})`); g.addColorStop(1, 'rgba(220,228,255,0)');
    x.fillStyle = g; for (const o of [-128, 0, 128]) x.fillRect(px - w / 2 + o, 0, w, 128); // wrapped, so it tiles across
  }
  mistTex = new T.CanvasTexture(c); mistTex.wrapS = T.RepeatWrapping; return mistTex;
}

// A gate for each room whose kind or role is in GATE.rooms (the guardian's arena, elite rooms), across every doorway it has.
// Called by newMap, after the packs (an elite gate's foe is its room's elite). G.gate is the guardian's.
export function initGate() {
  G.gates = []; G.gate = null; const L = G.layout; if (!L) return;
  for (const room of L.rooms) {
    if (!(GATE.rooms.includes(room.kind) || GATE.rooms.includes(room.role)) || !room.doors.length) continue;
    const g = { room: room.id, kind: room.kind === 'boss' ? 'boss' : 'elite', parts: room.doors.map(d => mistDoor(L, room, d)), shut: false, done: false, a: 0, e: null };
    Object.assign(g, { door: g.parts[0].door, n: g.parts[0].n, cells: g.parts.flatMap(p => p.cells) });
    G.gates.push(g); if (g.kind === 'boss') G.gate = g;
  }
}
// The mist across one doorway.
function mistDoor(L, room, door) {
  const cells = doorCells(L, room, door), [nx, nz] = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[door.side];
  const h = door.side === 's' ? 1.9 : 3.1; // the camera looks from the south: a gate on a south wall stays low, like the walls there
  const grp = new T.Group(), layers = [];
  for (const [k, off] of [[0, .3], [1, .65]]) {
    const tex = mist().clone(); tex.needsUpdate = true; tex.repeat.set(1.5 + k * .4, 1);
    const mat = new T.MeshBasicMaterial({ map: tex, color: k ? 0xb8c4dc : 0xd8dee8, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
    const m = new T.Mesh(new T.PlaneGeometry(door.w + .4, h), mat);
    m.position.set(nx * L.cell * off, h / 2, nz * L.cell * off); if (nx) m.rotation.y = Math.PI / 2;
    grp.add(m); layers.push({ m, mat, tex, k });
  }
  const glow = glowSprite(0x8898c0, door.w * .9); glow.position.set(nx * L.cell * .5, .8, nz * L.cell * .5); glow.material = glow.material.clone(); glow.material.opacity = 0; grp.add(glow);
  // Drifting puffs fill the gap: they face the camera, so a gate on a side wall (seen edge-on) still reads as a wall of mist.
  const puffMat = new T.SpriteMaterial({ map: glowTex, color: 0xc4ccdc, transparent: true, depthWrite: false, opacity: 0 }), puffs = [];
  for (let k = 0; k < 14; k++) {
    const sp = glowSprite(0xdde6ff, 1); sp.material = puffMat; const t = (k / 13 - .5) * door.w * .95, d = vr();
    const base = { x: nz ? t : nx * L.cell * (.15 + d * .7), z: nx ? t : nz * L.cell * (.15 + d * .7), y: .4 + vr() * (h - .9), s: 1.6 + vr() * 1.4, ph: vr() * 6 };
    sp.position.set(base.x, base.y, base.z); grp.add(sp); puffs.push({ sp, ...base });
  }
  grp.position.set(door.x, 0, door.z); G.world.add(grp);
  return { door, cells, n: [nx, nz], grp, layers, glow, puffs, puffMat };
}

function setCells(g, v) { const L = G.layout; for (const [i, j] of g.cells) L.grid[j * L.n + i] = v; L.fields = null; } // path fields are cached per layout (world/map.js)
function seal(g) { g.shut = true; setCells(g, 0); SFX.dash(); for (const p of g.parts) burst(p.door.x, 1.2, p.door.z, 0xdde6ff, 30, 4); }
function open(g, done) { if (g.shut) setCells(g, 1); g.shut = false; if (done && !g.done) { g.done = true; SFX.nova(); for (const p of g.parts) burst(p.door.x, 1.2, p.door.z, 0xdde6ff, 40, 5); } }

// What the gate holds you in with: the guardian, or the elite room's elite (once its pack has spawned).
export function gateFoe(g) {
  if (g.kind === 'boss') return G.bossSpec && G.bossSpec.e;
  return g.e || (g.e = G.enemies.find(e => e.elite && e.pack && e.pack.room === g.room)) || null;
}
// Is the hero far enough into the gate's room to be committed, past every doorway (and the foe in there too, so it can't be shut out)?
function inside(g, foe) {
  const L = G.layout, r = roomAt(L, P.x, P.z), b = roomAt(L, foe.x, foe.z); if (!r || r.id !== g.room || !b || b.id !== g.room) return false;
  return g.parts.every(p => -((P.x - p.door.x) * p.n[0] + (P.z - p.door.z) * p.n[1]) > GATE.inside);
}

export function updGate(dt) { for (const g of G.gates) updOne(g, dt); }
function updOne(g, dt) {
  const foe = gateFoe(g), fight = foe && foe.awake && !foe.deathT;
  if (foe && foe.deathT) open(g, true);
  else if (g.shut && (P.dead > 0 || !fight)) open(g, false);
  else if (!g.shut && !g.done && fight && P.dead <= 0 && inside(g, foe)) seal(g);
  // Look: faint while it waits, thick while sealed, gone once the fight is won.
  const want = g.done ? 0 : g.shut ? 1 : .35; g.a += (want - g.a) * Math.min(1, dt * 3);
  for (const p of g.parts) {
    p.grp.visible = g.a > .01; if (!p.grp.visible) continue;
    for (const L of p.layers) { L.mat.opacity = g.a * (L.k ? .45 : .6); L.tex.offset.x += dt * (L.k ? -.05 : .08); L.tex.offset.y = Math.sin(G.gt * .7 + L.k) * .03; }
    p.glow.material.opacity = g.a * (.22 + .08 * Math.sin(G.gt * 2.3));
    p.puffMat.opacity = g.a * .4;
    for (const q of p.puffs) { const t = G.gt * .6 + q.ph; q.sp.position.y = q.y + Math.sin(t) * .25; q.sp.scale.setScalar(q.s * (1 + .15 * Math.sin(t * 1.3))); }
  }
}
