// Raising the dead (Bone Gardens; numbers in data/monsters.js RAISE). Normal monsters leave a corpse where they fall (a dark mark on
// the floor, G.corpses); a necromancer (MT.necro, its brain is in game/enemies.js) channels over the corpses near it and they get
// up again, and the high necromancer's channel raises every corpse round it (GUARDIANS.lich, ability kind 'revive'). Killing the
// necromancer first, or hitting it while it raises, is the answer: kill order. A raised monster leaves no corpse, gives no XP and
// drops nothing, so a pack can't be farmed.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { RAISE } from '../data/monsters.js';
import { TELL } from '../data/graphics.js';
import { scene } from '../render/scene.js';
import { aura, GRING } from '../render/assets.js';
import { glows, emit, burst, addFx } from '../render/fx.js';
import { rand } from '../core/util.js';
import { spawnEnemy, wake } from './enemies.js';


// kill() calls this for every death: a normal monster of RAISE.types that wasn't raised itself leaves a corpse.
export function addCorpse(e) {
  if (e.raised || e.rar === 2 || e.type === 'boss' || !RAISE.types.includes(e.type)) return;
  const g = aura(0x14200e, 1.7, .6); g.position.x = e.x; g.position.z = e.z; scene.add(g);
  G.corpses.push({ type: e.type, x: e.x, z: e.z, t: RAISE.keep, g });
}
const drop = c => { c.gone = true; scene.remove(c.g); };
export function updCorpses(dt) {
  for (const c of G.corpses) { c.t -= dt; if (c.t <= 0) drop(c); }
  G.corpses = G.corpses.filter(c => !c.gone);
}
export function clearCorpses() { G.corpses.forEach(drop); G.corpses = []; }

// The corpses within r of (x, z) not already being raised (or raised by tok), nearest first, at most n.
export function corpsesNear(x, z, r, n = 99, tok) {
  return G.corpses.filter(c => !c.gone && (!c.claim || c.claim === tok) && Math.hypot(c.x - x, c.z - z) < r).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).slice(0, n);
}
// A green ring on a corpse while it's being raised (by, the raiser; tok, its raise): it fades out if the raise is broken.
export function markCorpse(c, by, tok, t) {
  c.claim = tok;
  const m = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: TELL.raise, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2; m.position.set(c.x, .08, c.z);
  addFx(m, t, k => {
    const on = by.raising === tok || (by.channel && by.channel.tok === tok);
    if (!on) { m.visible = false; if (c.claim === tok) c.claim = null; return; }
    const s = .5 + .5 * (1 - k); m.scale.set(s, s, 1); m.material.opacity = .5 + .4 * Math.sin(G.gt * 14);
    if (Math.random() < .3) emit(glows, c.x + rand(-.3, .3), .2, c.z + rand(-.3, .3), 0, rand(1, 2.5), 0, .5, TELL.raise);
  });
}
// The corpse gets up: its monster again, awake, with RAISE.hp of its life, rising from the floor for RAISE.rise s.
export function raiseCorpse(c, by) {
  if (c.gone) return null;
  drop(c);
  const r = spawnEnemy(c.type, c.x, c.z, null, 0);
  r.raised = true; r.xp = 0; r.hp = r.maxHp * RAISE.hp; r.summoner = by; G.mapTotal++; P.raised = (P.raised || 0) + 1;
  if (r.look) r.look = { ...r.look, rise: 'floor' };
  wake(r); if (!(r.rise > 0)) r.rise = RAISE.rise; // rigged: its rise clip; primitive: a moment to get up
  burst(c.x, .4, c.z, TELL.raise, 18, 3);
  return r;
}
