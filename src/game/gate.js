// Fog gates (Dark Souls): a misty barrier across the guardian arena's doorway. It hangs faintly in the doorway until the fight
// starts; once you're inside the arena and the guardian is awake it thickens and seals (its gap's cells become wall, so nothing
// walks, paths or sees through), and it opens only when the guardian dies (for good) or you die (it reopens and the guardian
// resets, game/maps.js respawn). The autopilot treats a sealed gate as a commitment (game/autopilot.js). Numbers and which rooms
// get one: GATE in data/dungeon.js. The look (mist texture, layers, fade) is tuned here.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { GATE } from '../data/dungeon.js';
import { doorCells, roomAt } from '../world/gen.js';
import { glowSprite, glowTex } from '../render/assets.js';
import { SFX } from '../core/audio.js';
import { burst } from '../render/fx.js';

let mistTex = null;
function mist() {
  if (mistTex) return mistTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  // Soft vertical wisps, thick at the floor and thinning upward, fading at the sides; the texture scrolls (see updGate).
  for (let k = 0; k < 70; k++) {
    const px = Math.random() * 128, w = 6 + Math.random() * 18, a = .05 + Math.random() * .12, g = x.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, `rgba(235,240,255,${a * 1.6})`); g.addColorStop(.55, `rgba(220,228,255,${a})`); g.addColorStop(1, 'rgba(220,228,255,0)');
    x.fillStyle = g; for (const o of [-128, 0, 128]) x.fillRect(px - w / 2 + o, 0, w, 128); // wrapped, so it tiles across
  }
  mistTex = new T.CanvasTexture(c); mistTex.wrapS = T.RepeatWrapping; return mistTex;
}

// A gate for each room of a kind in GATE.rooms (today the guardian's arena, which has one door). Called by newMap.
export function initGate() {
  G.gate = null; const L = G.layout; if (!L) return;
  const room = L.rooms.find(r => GATE.rooms.includes(r.kind)); if (!room || !room.doors.length) return;
  const door = room.doors[0], cells = doorCells(L, room, door), [nx, nz] = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[door.side];
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
    const sp = glowSprite(0xdde6ff, 1); sp.material = puffMat; const t = (k / 13 - .5) * door.w * .95, d = Math.random();
    const base = { x: nz ? t : nx * L.cell * (.15 + d * .7), z: nx ? t : nz * L.cell * (.15 + d * .7), y: .4 + Math.random() * (h - .9), s: 1.6 + Math.random() * 1.4, ph: Math.random() * 6 };
    sp.position.set(base.x, base.y, base.z); grp.add(sp); puffs.push({ sp, ...base });
  }
  grp.position.set(door.x, 0, door.z); G.world.add(grp);
  G.gate = { room: room.id, door, cells, shut: false, done: false, a: 0, grp, layers, glow, puffs, puffMat, n: [nx, nz] };
}

function setCells(g, v) { const L = G.layout; for (const [i, j] of g.cells) L.grid[j * L.n + i] = v; L.fields = null; } // path fields are cached per layout (world/map.js)
function seal(g) { g.shut = true; setCells(g, 0); SFX.dash(); burst(g.door.x, 1.2, g.door.z, 0xdde6ff, 30, 4); }
function open(g, done) { if (g.shut) setCells(g, 1); g.shut = false; if (done && !g.done) { g.done = true; SFX.nova(); burst(g.door.x, 1.2, g.door.z, 0xdde6ff, 40, 5); } }

// Is the hero far enough into the gate's room to be committed?
function inside(g) {
  const L = G.layout, r = roomAt(L, P.x, P.z); if (!r || r.id !== g.room) return false;
  return -((P.x - g.door.x) * g.n[0] + (P.z - g.door.z) * g.n[1]) > GATE.inside;
}

export function updGate(dt) {
  const g = G.gate; if (!g) return;
  const boss = G.bossSpec && G.bossSpec.e, fight = boss && boss.awake && !boss.deathT;
  if (boss && boss.deathT) open(g, true);
  else if (g.shut && (P.dead > 0 || !fight)) open(g, false);
  else if (!g.shut && !g.done && fight && P.dead <= 0 && inside(g)) seal(g);
  // Look: faint while it waits, thick while sealed, gone once the guardian is dead.
  const want = g.done ? 0 : g.shut ? 1 : .35; g.a += (want - g.a) * Math.min(1, dt * 3);
  g.grp.visible = g.a > .01;
  for (const L of g.layers) { L.mat.opacity = g.a * (L.k ? .45 : .6); L.tex.offset.x += dt * (L.k ? -.05 : .08); L.tex.offset.y = Math.sin(G.gt * .7 + L.k) * .03; }
  g.glow.material.opacity = g.a * (.22 + .08 * Math.sin(G.gt * 2.3));
  g.puffMat.opacity = g.a * .4;
  for (const p of g.puffs) { const t = G.gt * .6 + p.ph; p.sp.position.y = p.y + Math.sin(t) * .25; p.sp.scale.setScalar(p.s * (1 + .15 * Math.sin(t * 1.3))); }
}
