// A level: one Crypt Halls built on the beat template (data/levels.js).
// newLevel() lays out a route that snakes from the entrance to the guardian's arena, puts the beats in order along it
// and normal packs on the stretches between. Each beat runs idle -> signal -> active -> done:
//   idle    a marker (beacon, glow, light, minimap dot) shows where it is
//   signal  the hero came close: a banner names it; then a short wind-up (telegraph ring) before anything happens
//   active  the challenge (monsters appear, the room seals, a timer runs...)
//   done    payoff (loot via items.js dropItem's boost), the checkpoint moves here, the next beat becomes current
// Beats run in order: G.level.i is the first beat that isn't done. Dying puts the hero back at the last done beat (or the
// entrance) and resets a beat in progress to idle (its monsters despawn) so it can be retried; the guardian returns to full.
import * as T from 'three';
import { endWard } from './skills.js';
import { initSurge } from './surge.js';
import { ctl } from '../input/input.js';
import { G, P, S, shake } from '../core/state.js';
import { LEVEL, BEATS } from '../data/levels.js';
import { SK } from '../data/skills.js';
import { rand, randi, pick, dist, clamp } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene } from '../render/scene.js';
import { GB, GCY, GS, GRING, glowSprite, decal } from '../render/assets.js';
import { burst, ringFx, flashFx, telegraph, banner, toast } from '../render/fx.js';
import { HALF, buildMap, blocked } from '../world/map.js';
import { makePack, spawnEnemy, wake } from './enemies.js';
import { dropItem } from './items.js';
import { save } from './save.js';
import { kill } from './combat.js';

const css = hex => '#' + hex.toString(16).padStart(6, '0');
export const currentBeat = () => G.level && G.level.beats[G.level.i] || null;
export const nextBeat = () => G.level && G.level.beats[G.level.i + 1] || null;

// ---------------------------------------------------------------- layout

// Arc length along a polyline: sets pts[i].s and returns the total.
function arcLen(pts) { let s = 0; pts[0].s = 0; for (let i = 1; i < pts.length; i++) { s += dist(pts[i].x, pts[i].z, pts[i - 1].x, pts[i - 1].z); pts[i].s = s; } return s; }
// The point at arc length s, and the direction of the segment it's on.
function routeAt(pts, s) {
  s = clamp(s, 0, pts[pts.length - 1].s);
  let i = 1; while (i < pts.length - 1 && pts[i].s < s) i++;
  const a = pts[i - 1], b = pts[i], L = (b.s - a.s) || 1, f = (s - a.s) / L;
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, dx: (b.x - a.x) / L, dz: (b.z - a.z) / L };
}

// Decides the route, the beat sites and the clearings. Sets G.start, G.bossSpot, G.clear; returns { beats, route }.
function layout() {
  const R = LEVEL.route, sx = Math.random() < .5 ? 1 : -1, sz = Math.random() < .5 ? 1 : -1, lim = HALF - R.margin;
  const start = { x: -sx * (HALF - 5), z: -sz * (HALF - 5) }, guard = { x: sx * (HALF - 8), z: sz * (HALF - 8) };
  // The snake: switchbacks off the straight line, alternating sides.
  const dx = guard.x - start.x, dz = guard.z - start.z, L0 = Math.hypot(dx, dz), nx = -dz / L0, nz = dx / L0;
  let chain, total = 0, best = null;
  for (let t = 0; t < R.tries && total < R.minLen; t++) {
    const k = randi(R.bends[0], R.bends[1]); let side = Math.random() < .5 ? 1 : -1;
    chain = [{ ...start }];
    for (let i = 1; i <= k; i++) {
      const f = i / (k + 1) + rand(-.03, .03), off = side * rand(R.sway[0], R.sway[1]); side = -side;
      chain.push({ x: clamp(start.x + dx * f + nx * off, -lim, lim), z: clamp(start.z + dz * f + nz * off, -lim, lim) });
    }
    chain.push({ ...guard });
    total = arcLen(chain); if (!best || total > best.total) best = { chain, total };
  }
  ({ chain, total } = best); arcLen(chain);
  // Beat sites at their fraction along the route (pulled in from the walls so rings fit), merged with the bends.
  const beats = LEVEL.template.map((slot, i) => {
    const type = pick(slot.types), D = BEATS[type], p = type === 'guardian' ? guard : routeAt(chain, total * slot.at);
    const m = HALF - 1 - (D.radius || D.clear * .5 + 1);
    return { type, slot: slot.slot, idx: i, x: type === 'guardian' ? p.x : clamp(p.x, -m, m), z: type === 'guardian' ? p.z : clamp(p.z, -m, m), state: 'idle', t: 0, s0: type === 'guardian' ? total : total * slot.at, mats: [] };
  });
  const route = [...chain.slice(0, -1), ...beats.map(b => ({ x: b.x, z: b.z, s: b.s0, beat: b }))].sort((a, b) => a.s - b.s);
  arcLen(route);
  for (const p of route) if (p.beat) p.beat.s = p.s;
  // Clearings: the entrance, each beat site, the guardian's arena and a corridor of points along the route.
  G.start = start; G.bossSpot = { x: guard.x, z: guard.z };
  G.clear = [{ x: start.x, z: start.z, r: LEVEL.start.clear }];
  for (const b of beats) G.clear.push({ x: b.x, z: b.z, r: BEATS[b.type].clear });
  const len = route[route.length - 1].s;
  for (let s = R.spacing; s < len; s += R.spacing) { const p = routeAt(route, s); G.clear.push({ x: p.x, z: p.z, r: R.width }); }
  return { beats, route, start, len };
}

// Normal packs on each stretch of the route, keeping clear of every beat site.
function placePacks(L) {
  const C = LEVEL.packs, sites = [{ x: L.start.x, z: L.start.z, r: LEVEL.start.clear + C.fromSite }, ...L.beats.map(b => { const D = BEATS[b.type]; return { x: b.x, z: b.z, r: Math.max(D.noPacks, D.clear + C.fromSite) }; })];
  const spots = [{ s: 0, r: sites[0].r }, ...L.beats.map((b, i) => ({ s: b.s, r: sites[i + 1].r }))];
  G.packs = [];
  LEVEL.template.forEach((slot, j) => {
    const lo = spots[j].s + spots[j].r, hi = spots[j + 1].s - spots[j + 1].r;
    const n = Math.min(slot.packs, Math.floor((hi - lo) / C.gap) + 1);
    for (let k = 0; k < n; k++) {
      const s = n === 1 ? (lo + hi) / 2 : lo + (hi - lo) * k / (n - 1);
      for (let tries = 0; tries < 16; tries++) {
        const p = routeAt(L.route, s + rand(-2, 2)), off = tries ? rand(-C.lateral, C.lateral) : 0, x = p.x - p.dz * off, z = p.z + p.dx * off;
        if (blocked(x, z, 1.5) || sites.some(c => dist(x, z, c.x, c.z) < c.r) || G.packs.some(q => dist(q.x, q.z, x, z) < C.gap)) continue;
        const pk = makePack(x, z, { size: slot.size, magicChance: slot.size ? 0 : C.magicChance, rareChance: slot.size ? 0 : C.rareChance });
        pk.seg = j; pk.order = s; G.packs.push(pk); break;
      }
    }
  });
  // Top up: free spots anywhere along the route, outside the beat sites, each joining the stretch it falls in.
  const end = spots[spots.length - 1].s;
  for (let tries = 0; tries < 400 && G.packs.length < C.min; tries++) {
    const s = rand(spots[0].r, end - spots[spots.length - 1].r), p = routeAt(L.route, s), off = rand(-C.lateral, C.lateral), x = p.x - p.dz * off, z = p.z + p.dx * off;
    if (blocked(x, z, 1.5) || sites.some(c => dist(x, z, c.x, c.z) < c.r) || G.packs.some(q => dist(q.x, q.z, x, z) < C.gap)) continue;
    const j = Math.max(0, spots.findIndex(sp => sp.s > s) - 1), slot = LEVEL.template[j];
    const pk = makePack(x, z, { size: slot.size, magicChance: slot.size ? 0 : C.magicChance, rareChance: slot.size ? 0 : C.rareChance });
    pk.seg = j; pk.order = s; G.packs.push(pk);
  }
  G.packs.sort((a, b) => a.order - b.order);
}

// ---------------------------------------------------------------- level lifecycle

function teardown() {
  for (const e of G.enemies) { scene.remove(e.model.g); e.model.mats.forEach(m => m.dispose()); }
  G.enemies = [];
  [...G.proj, ...G.eproj, ...G.patches, ...G.ground].forEach(o => scene.remove(o.g));
  G.proj = []; G.eproj = []; G.patches = []; G.ground = [];
  G.effects.forEach(f => scene.remove(f.mesh)); G.effects = []; G.queue = []; G.floats = [];
  if (G.portal) { scene.remove(G.portal.g); G.portal = null; }
  if (G.level) for (const b of G.level.beats) { dropWall(b); dropMarker(b); }
}

// Builds a fresh Crypt Halls (a new layout, route, packs and random slot picks every time). clears: levels cleared so far.
export function newLevel(clears = G.level ? G.level.clears : 0) {
  teardown();
  const L = layout();
  G.level = { name: LEVEL.name, beats: L.beats, i: 0, cleared: false, clears, route: L.route, cp: { x: L.start.x, z: L.start.z }, len: L.len };
  G.depth = LEVEL.depth; G.mapKills = 0;
  buildMap();
  placePacks(L);
  for (const b of L.beats) buildMarker(b);
  P.x = G.start.x; P.z = G.start.z; P.dead = 0; P.life = S.maxLife; P.flask = SK.flask.max; P.invuln = 1;
  for (const k in P.cd) P.cd[k] = 0; endWard(); initSurge(ctl.effort ? ctl.effort.ftp : undefined); // fresh cooldowns, ward and Surge each visit
  banner(LEVEL.name.toUpperCase(), '#c8a25a', clears ? `${clears} cleared · follow the route, beats lie ahead` : 'Follow the route · beats lie ahead');
  return G.level;
}

function makePortal(x, z) {
  const g = new T.Group();
  const tor = new T.Mesh(new T.TorusGeometry(1.1, .12, 8, 36), new T.MeshBasicMaterial({ color: 0xb06bff })); tor.position.y = 1.3; g.add(tor);
  const inner = glowSprite(0x9a5aff, 2.6); inner.position.y = 1.3; g.add(inner); g.add(decal(0xb06bff, 5));
  g.position.set(x, 0, z); scene.add(g); G.portal = { x, z, g, tor };
}

// After death: back to the last checkpoint at full health. A beat in progress resets so it can be retried.
export function respawn() {
  const L = G.level, cp = L ? L.cp : G.start;
  P.x = cp.x; P.z = cp.z; P.life = S.maxLife; P.flask = SK.flask.max; P.invuln = 2; endWard();
  G.eproj.forEach(o => scene.remove(o.g)); G.eproj = [];
  if (L) { L.grace = LEVEL.respawnGrace; for (const b of L.beats) if (b.state === 'signal' || b.state === 'active') resetBeat(b); }
}

// Debug and tests: skip ahead. Beats before i count as done, the hero stands at beat i's site, and it triggers on its own.
export function startBeat(i) {
  const L = G.level, b = L && L.beats[i]; if (!b) return null;
  L.beats.forEach((o, k) => {
    if (k < i) { if (o.state !== 'done') { resetBeat(o); o.state = 'done'; markDone(o); } }
    else if (o.state !== 'idle') resetBeat(o);
  });
  L.i = i; L.grace = 0; L.cp = i ? { x: L.beats[i - 1].x, z: L.beats[i - 1].z } : { ...G.start };
  P.x = b.x; P.z = b.z; P.dead = 0; return b;
}

// ---------------------------------------------------------------- the goal for the autopilot

// Where to head next: the next unfinished pack on the current stretch, then the next beat, then the guardian, then the portal.
export function levelGoal() {
  const L = G.level; if (!L) return null;
  if (L.cleared) return G.portal ? { x: G.portal.x, z: G.portal.z, kind: 'portal', r: .8 } : null;
  const b = L.beats[L.i]; if (!b) return null;
  if (b.state === 'idle') {
    let best = null;
    for (const p of G.packs) if (p.seg === L.i && (!p.spawned || p.list.some(e => !e.deathT)) && (!best || p.order < best.order)) best = p;
    if (best) return { x: best.x, z: best.z, kind: 'pack', r: 3 };
  }
  return { x: b.x, z: b.z, kind: b.type === 'guardian' ? 'guardian' : 'beat', r: 1.2 };
}

// ---------------------------------------------------------------- per-tick

export function updLevel(dt) {
  const L = G.level; if (!L) return;
  if (L.grace > 0) L.grace -= dt;
  if (P.dead <= 0) {
    const b = L.beats[L.i]; if (b) updBeat(b, dt);
    if (G.portal && dist(P.x, P.z, G.portal.x, G.portal.z) < 1.3) { const c = L.clears + 1; save(c); newLevel(c); return; }
  }
  for (const b of L.beats) visuals(b, dt);
}

function updBeat(b, dt) {
  const D = BEATS[b.type], d = dist(P.x, P.z, b.x, b.z);
  if (b.state === 'idle') { if (d < D.signal && !(G.level.grace > 0)) enterSignal(b, D); }
  else if (b.state === 'signal') {
    if (b.t > 0) { b.t -= dt; if (b.t <= 0) activate(b, D); }
    else if (!D.trigger || d < D.trigger) { b.t = D.windup; b.windT = G.gt; windup(b, D); }
  } else if (b.state === 'active') { if (H[b.type].upd(b, D, dt)) finish(b, D); }
}

function enterSignal(b, D) {
  b.state = 'signal'; b.signalT = G.gt; b.t = 0; b.banner = D.title;
  banner(D.title, css(D.color), D.sub); SFX.roar(); flashFx(b.x, 1.5, b.z, D.color, 7, .8);
}
function windup(b, D) {
  telegraph(b.x, b.z, D.radius || D.clear * .8, D.windup, D.color); ringFx(b.x, b.z, (D.radius || D.clear) * 1.1, D.color, D.windup, .3);
  if (b.type === 'ambush' || b.type === 'survival') shake(.25);
}
function activate(b, D) { b.state = 'active'; b.activeT = G.gt; H[b.type].start(b, D); }

function finish(b, D) {
  const L = G.level;
  b.state = 'done'; b.doneT = G.gt; L.cp = { x: b.x, z: b.z };
  const i = L.beats.findIndex(o => o.state !== 'done'); L.i = i < 0 ? L.beats.length : i;
  const lt = D.loot; if (lt) for (let k = 0; k < lt.n; k++) dropItem(b.x + rand(-1, 1), b.z + rand(-1, 1), k === 0 && lt.first ? lt.first : lt.boost);
  banner(D.done[0], css(D.color), D.done[1]); flashFx(b.x, 1.5, b.z, D.color, 8, .8);
  dropWall(b); markDone(b);
}

// Called from combat.kill(). The guardian's death clears the level.
export function onKill(e) {
  if (!e.guardian || !e.beat || e.beat.state === 'done') return;
  const L = G.level; finish(e.beat, BEATS.guardian);
  L.cleared = true; makePortal(e.beat.x - 2, e.beat.z + 2); shake(1);
}

// Takes a beat back to idle: its monsters despawn, walls drop, the marker resets.
function resetBeat(b) {
  for (const e of G.enemies) if (e.beat === b) { scene.remove(e.model.g); e.model.mats.forEach(m => m.dispose()); e.gone = true; }
  G.enemies = G.enemies.filter(e => !e.gone);
  dropWall(b);
  b.state = 'idle'; b.t = 0; b.timer = 0; b.wave = 0; b.guard = null; b.locked = false; b.open = 0;
  if (b.lid) b.lid.rotation.x = 0;
  if (b.vis) { b.vis.beam.visible = b.vis.glow.visible = b.vis.pad.visible = true; if (b.vis.ring) b.vis.ring.material.color.setHex(BEATS[b.type].color); }
}

// ---------------------------------------------------------------- what each beat does when it goes active

const alive = b => G.enemies.filter(e => e.beat === b && !e.deathT);
const hold = (b, r) => { const d = dist(P.x, P.z, b.x, b.z); if (d > r) { P.x = b.x + (P.x - b.x) / d * r; P.z = b.z + (P.z - b.z) / d * r; } };

// A monster for beat b near (x, z): awake, chasing, counted by the beat.
function spawnAt(b, type, x, z, rar = 0) {
  let px = x, pz = z;
  for (let k = 0; k < 14 && blocked(px, pz, .5); k++) { px = x + rand(-2, 2); pz = z + rand(-2, 2); }
  const e = spawnEnemy(type, px, pz, null, rar); e.awake = true; e.beat = b;
  burst(px, .4, pz, BEATS[b.type].color, 10, 3); return e;
}
// A group of [type, count] pairs scattered within `rad` of (cx, cz).
function spawnGroup(b, list, cx, cz, rad, rar = 0) {
  for (const [t, n] of list) for (let i = 0; i < n; i++) { const a = rand(0, 6.283), r = rand(.4, 1) * rad; spawnAt(b, t, cx + Math.cos(a) * r, cz + Math.sin(a) * r, rar); }
}
const announceRares = rares => banner(rares.map(e => e.name).join(' & '), '#ffd23f', rares.map(e => e.aff.map(a => a[0].toUpperCase() + a.slice(1)).join(' · ')).join('  |  '));

function eliteStart(b, D) {
  const n = D.rares.length, rares = D.rares.map((types, k) => spawnAt(b, pick(types), b.x + (n > 1 ? (k ? 2.5 : -2.5) : 0), b.z, 2));
  spawnGroup(b, D.minions, b.x, b.z, D.minionRadius); announceRares(rares); SFX.roar();
}

const H = {
  treasure: {
    start(b, D) { b.locked = true; spawnGroup(b, D.guards, b.x, b.z, D.guardRadius, D.magic ? 1 : 0); },
    upd(b) { if (alive(b).length) return false; b.locked = false; b.open = 1; burst(b.x, 1, b.z, 0xffd23f, 40, 5); return true; },
  },
  gamble: {
    start(b, D) { spawnGroup(b, D.pack, b.x, b.z, D.packRadius, D.magic ? 1 : 0); if (D.rare) spawnAt(b, D.rare, b.x, b.z, 2); SFX.roar(); burst(b.x, .6, b.z, 0xff2020, 30, 5); },
    upd(b) { return !alive(b).length; },
  },
  elite: { start: eliteStart, upd: b => !alive(b).length },
  doubleElite: { start: eliteStart, upd: b => !alive(b).length },
  breather: {
    start(b, D) { P.flask = SK.flask.max; b.t2 = D.restore; burst(b.x, .8, b.z, D.color, 30, 4); },
    upd(b, D, dt) { P.life = Math.min(S.maxLife, P.life + S.maxLife / D.restore * dt); b.t2 -= dt; return b.t2 <= 0; },
  },
  ambush: {
    start(b, D) { b.waves = D.waves.length; b.wave = 0; b.gapT = 0; seal(b, D); sendWave(b, D); },
    upd(b, D, dt) {
      hold(b, D.radius - .6);
      if (alive(b).length) return false;
      if (b.wave < b.waves) { b.gapT -= dt; if (b.gapT <= 0) sendWave(b, D); return false; }
      return true;
    },
  },
  survival: {
    start(b, D) { b.timer = D.duration; b.waveT = 1.5; b.elapsed = 0; b.inside = true; SFX.slam(); },
    upd(b, D, dt) {
      b.inside = dist(P.x, P.z, b.x, b.z) < D.radius; // leaving the circle pauses the timer
      if (b.inside) { b.timer -= dt; b.elapsed += dt; }
      b.waveT -= dt;
      if (b.waveT <= 0) { b.waveT = D.waveGap; if (alive(b).length < D.maxAlive) survivalWave(b, D); }
      if (b.timer > 0) return false;
      b.timer = 0;
      for (const e of alive(b)) collapse(e);
      return true;
    },
  },
  release: {
    start(b) { b.open = 1; b.t2 = .8; burst(b.x, 1, b.z, 0xffe08a, 40, 5); },
    upd(b, D, dt) { b.t2 -= dt; return b.t2 <= 0; },
  },
  guardian: {
    start(b) {
      const e = spawnEnemy('guardian', b.x, b.z, null, 0); e.beat = b; e.abilT = 3; e.rot = 0; b.guard = e; wake(e);
      shake(.5); flashFx(b.x, 1.5, b.z, 0xff2bd6, 9, .8);
    },
    upd: () => false, // its death (combat.kill -> onKill) finishes the beat
  },
};

// Survival: waves arrive from outside the circle.
function survivalWave(b, D) {
  const W = D.wave, n = Math.min(W.max, W.base + Math.floor(b.elapsed / 30) * W.perThirty);
  const tot = D.mix.reduce((a, [, w]) => a + w, 0);
  for (let i = 0; i < n; i++) {
    let r = Math.random() * tot, type = D.mix[0][0]; for (const [t, w] of D.mix) if ((r -= w) <= 0) { type = t; break; }
    const a = rand(0, 6.283), rr = D.radius + rand(2.5, 5);
    spawnAt(b, type, b.x + Math.cos(a) * rr, b.z + Math.sin(a) * rr);
  }
}
// Ambush: a wave bursts out of the coffins ringed inside the room.
function sendWave(b, D) {
  const wave = D.waves[b.wave++]; b.gapT = D.waveGap;
  const spots = Array.from({ length: D.coffins }, (_, k) => { const a = k / D.coffins * 6.283 + (b.coffinRot || 0); return [b.x + Math.cos(a) * D.radius * .65, b.z + Math.sin(a) * D.radius * .65]; });
  for (const [t, n] of wave) for (let i = 0; i < n; i++) { const [x, z] = pick(spots); spawnAt(b, t, x + rand(-.8, .8), z + rand(-.8, .8)); }
  for (const [x, z] of spots) { burst(x, .4, z, 0x6a4a28, 12, 4); burst(x, .6, z, D.color, 8, 3); }
  SFX.slam(); shake(.3); toast(`Ambush · wave ${b.wave}/${b.waves}`);
}
// A beat's leftovers fall without drops, xp or blasts (combat.kill honours noLoot).
function collapse(e) { e.noLoot = true; kill(e); }

// ---------------------------------------------------------------- world markers

function mat(b, color, emissive = 0) { const m = new T.MeshLambertMaterial({ color, emissive }); b.mats.push(m); return m; }
function basic(b, o) { const m = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o }); b.mats.push(m); return m; }

function buildMarker(b) {
  const D = BEATS[b.type], g = new T.Group(); g.position.set(b.x, 0, b.z);
  const box = (w, h, d, m, x, y, z, parent = g) => { const o = new T.Mesh(GB, m); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const cyl = (rx, h, m, x, y, z) => { const o = new T.Mesh(GCY, m); o.scale.set(rx, h, rx); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  // beacon: a beam of light, a glow and a pad on the floor
  const beam = new T.Mesh(GCY, basic(b, { color: D.color, opacity: .3, blending: T.AdditiveBlending })); beam.scale.set(.13, 9, .13); beam.position.y = 4.5; g.add(beam);
  const glow = glowSprite(D.color, 1.8); glow.position.y = 2.3; g.add(glow);
  const pad = decal(D.color, D.clear * 1.3); g.add(pad);
  b.vis = { beam, glow, pad };
  const chest = k => {
    const wood = mat(b, 0x6a4222), gold = mat(b, 0xd8a838, 0x302000);
    box(1.1 * k, .55 * k, .7 * k, wood, 0, .28 * k, 0); box(1.14 * k, .1 * k, .74 * k, gold, 0, .4 * k, 0);
    const lid = new T.Group(); lid.position.set(0, .55 * k, -.35 * k); g.add(lid); box(1.1 * k, .25 * k, .7 * k, wood, 0, .12 * k, .35 * k, lid); box(1.14 * k, .08 * k, .74 * k, gold, 0, .12 * k, .35 * k, lid); b.lid = lid;
  };
  const ring = (r, o = .55) => { const m = new T.Mesh(GRING, basic(b, { color: D.color, opacity: o, side: T.DoubleSide, blending: T.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.y = .07; m.scale.set(r, r, 1); g.add(m); b.vis.ring = m; };
  if (b.type === 'treasure') chest(1.2);
  else if (b.type === 'release') chest(1);
  else if (b.type === 'gamble') {
    const stone = mat(b, 0x3a3038), blood = mat(b, 0x8a1a1a, 0x401010);
    box(2.2, .5, 1.4, stone, 0, .25, 0); box(1.8, .22, 1.05, blood, 0, .6, 0);
    for (const [x, z] of [[-1, -.6], [1, -.6], [-1, .6], [1, .6]]) { const s = new T.Mesh(GS, mat(b, 0xcfc6ae)); s.scale.setScalar(.16); s.position.set(x, .62, z); g.add(s); }
    const f = glowSprite(0xff2020, 1.8); f.position.y = 1.15; g.add(f); ring(2.2, .45);
  } else if (b.type === 'breather') {
    const stone = mat(b, 0x4a4048);
    cyl(1.5, .5, stone, 0, .25, 0); cyl(.28, 1.3, stone, 0, .9, 0);
    const water = new T.Mesh(GCY, basic(b, { color: 0x50c8ff, opacity: .85 })); water.scale.set(1.28, .08, 1.28); water.position.y = .48; g.add(water);
    const f = glowSprite(0x50c8ff, 2.2); f.position.y = 1.7; g.add(f); ring(3.2, .35);
  } else if (b.type === 'elite' || b.type === 'doubleElite') {
    ring(D.clear * .7, .5); const f = glowSprite(0xffd23f, 1.6); f.position.y = 2.4; g.add(f);
    const bone = mat(b, 0xcfc6ae); for (let k = 0; k < 4; k++) { const a = k * 1.571 + .4; cyl(.07, 1.6, bone, Math.cos(a) * D.clear * .7, .8, Math.sin(a) * D.clear * .7); const s = new T.Mesh(GS, bone); s.scale.setScalar(.22); s.position.set(Math.cos(a) * D.clear * .7, 1.7, Math.sin(a) * D.clear * .7); g.add(s); }
  } else if (b.type === 'ambush') {
    ring(D.radius, .22); b.coffinRot = rand(0, 6.283);
    const wood = mat(b, 0x2c1c12), trim = mat(b, 0x6a4a28);
    for (let k = 0; k < D.coffins; k++) {
      const a = k / D.coffins * 6.283 + b.coffinRot, c = new T.Group(); c.position.set(Math.cos(a) * D.radius * .65, 0, Math.sin(a) * D.radius * .65); c.rotation.y = -a + 1.571; g.add(c);
      box(.9, .35, 2, wood, 0, .18, 0, c); box(.95, .08, 2.05, trim, 0, .38, 0, c);
    }
  } else if (b.type === 'survival') ring(D.radius, .35);
  else if (b.type === 'guardian') ring(3, .4);
  scene.add(g); b.g = g;
}
function dropMarker(b) { if (b.g) { scene.remove(b.g); b.g = null; } b.mats.forEach(m => m.dispose()); b.mats = []; }
function markDone(b) { if (b.vis) b.vis.beam.visible = b.vis.glow.visible = b.vis.pad.visible = false; if (b.vis && b.vis.ring) b.vis.ring.material.opacity = .12; }

// Ambush: a ring of glowing posts and a curtain that rises when the room seals.
function seal(b, D) {
  const g = new T.Group(), R = D.radius, mats = [], geos = []; g.position.set(b.x, 0, b.z);
  const post = new T.MeshLambertMaterial({ color: 0x3a1a4a, emissive: D.color, emissiveIntensity: .8 }); mats.push(post);
  for (let k = 0; k < D.posts; k++) {
    const a = k / D.posts * 6.283, x = Math.cos(a) * R, z = Math.sin(a) * R;
    const p = new T.Mesh(GCY, post); p.scale.set(.16, 2.4, .16); p.position.set(x, 1.2, z); g.add(p);
    const f = glowSprite(D.color, 1.5); f.position.set(x, 2.6, z); g.add(f);
  }
  const floor = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: D.color, transparent: true, opacity: .4, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); floor.rotation.x = -Math.PI / 2; floor.position.y = .08; floor.scale.set(R, R, 1); g.add(floor); mats.push(floor.material);
  const cg = new T.CylinderGeometry(R, R, 2.8, 48, 1, true); geos.push(cg);
  const cm = new T.MeshBasicMaterial({ color: D.color, transparent: true, opacity: .13, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }); mats.push(cm);
  const curtain = new T.Mesh(cg, cm); curtain.position.y = 1.4; g.add(curtain);
  g.scale.y = .01; scene.add(g); b.wall = { g, mats, geos, t: 0 };
  SFX.slam(); shake(.5); ringFx(b.x, b.z, R, D.color, .5, .3);
}
function dropWall(b) {
  const w = b.wall; if (!w) return;
  scene.remove(w.g); w.mats.forEach(m => m.dispose()); w.geos.forEach(o => o.dispose()); b.wall = null;
}

// Per-frame pulses: the beacons breathe, the next beat is brighter, the ambush wall rises, the survival ring warns.
function visuals(b, dt) {
  const D = BEATS[b.type], V = b.vis, L = G.level, next = L.beats[L.i] === b;
  if (V && b.state !== 'done') {
    const k = 1 + Math.sin(G.gt * 3 + b.idx) * .12;
    V.glow.scale.set(1.8 * k, 1.8 * k, 1); V.beam.material.opacity = (next ? .42 : .16) + Math.sin(G.gt * 2.4 + b.idx) * .06;
    V.beam.scale.x = V.beam.scale.z = next ? .15 : .08;
    if (V.ring) V.ring.material.opacity = b.state === 'active' ? .5 : next ? .4 : .16;
    if (b.type === 'survival' && b.state === 'active') V.ring.material.color.setHex(b.inside ? D.color : 0xff3030);
  }
  if (b.wall) { const w = b.wall; w.t = Math.min(1, w.t + dt * 2.5); w.g.scale.y = Math.max(.01, w.t); }
  if (b.lid) b.lid.rotation.x += ((b.open ? -1.9 : 0) - b.lid.rotation.x) * Math.min(1, dt * 6);
}

// The one scene light that follows the story: the portal, the awake guardian, else the next beat.
export function levelLight() {
  const L = G.level; if (!L) return null;
  if (G.portal) return { x: G.portal.x, y: 2, z: G.portal.z, col: 0xb06bff, i: 2 };
  const g = G.enemies.find(e => e.guardian && !e.deathT && e.awake); if (g) return { x: g.x, y: 4, z: g.z, col: 0xff3ad0, i: 1.2 };
  const b = L.beats[L.i]; if (!b) return null;
  return { x: b.x, y: 2.6, z: b.z, col: BEATS[b.type].color, i: b.state === 'done' ? 0 : .9 };
}
