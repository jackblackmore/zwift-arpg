// Frost Lance: a slow-firing, fast-flying cold lance that pierces a few monsters, hits hard and chills them.
// Level 5 milestone (S.mile.frostlance): pierces 2 more enemies. Split support (S.sk.frostlance.split): a fan of 3 weaker lances.
import * as T from 'three';
import { P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { GEMS, SUPPORTS } from '../../data/gems.js';
import { rand, pick } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene, flashLight } from '../../render/scene.js';
import { glowSprite } from '../../render/assets.js';
import { sparks, glows, emit, flashFx } from '../../render/fx.js';
import { blocked } from '../../world/map.js';
import { near } from '../enemies.js';
import { hit } from '../combat.js';
import { aim } from '../skills.js';

let lances = [];

function cast() {
  const K = SK.frostlance;
  const [ax, az] = aim(), a = Math.atan2(ax - P.x, az - P.z), Sp = SUPPORTS.split, n = S.sk.frostlance.split ? Sp.lances : 1, mult = K.mult * (n > 1 ? Sp.mult : 1);
  for (let i = 0; i < n; i++) {
    const b = a + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Sp.spread, g = new T.Group();
    g.add(glowSprite(0x7fd8ff, 1.3), glowSprite(0xffffff, .5));
    g.position.set(P.x + Math.sin(b) * .8, 1.2, P.z + Math.cos(b) * .8); scene.add(g);
    lances.push({ x: g.position.x, z: g.position.z, dx: Math.sin(b), dz: Math.cos(b), life: K.life, mult, pierce: K.pierce + (S.mile.frostlance ? GEMS.frostlance.mile.pierce : 0), hitS: new Set(), g });
  }
  P.face = a; P.castAnim = .3; P.castSeq++; P.lastCast = 'lance';
  flashFx(P.x + Math.sin(a) * .8, 1.2, P.z + Math.cos(a) * .8, 0x7fd8ff, 2.5, .2); SFX.fire(); return true;
}

function tick(dt) {
  if (!lances.length) return;
  const K = SK.frostlance;
  for (const p of lances) {
    // Step in short increments so a fast lance can't skip a monster or a wall.
    const steps = Math.ceil(K.speed * dt / .4), sd = K.speed * dt / steps;
    for (let i = 0; i < steps && !p.dead; i++) {
      p.x += p.dx * sd; p.z += p.dz * sd;
      if (blocked(p.x, p.z, .15)) { p.dead = true; break; }
      near(p.x, p.z, .5, e => {
        if (p.dead || p.hitS.has(e)) return; p.hitS.add(e);
        hit(e, p.mult, 'cold', { gem: 'frostlance', kx: p.dx, kz: p.dz });
        if (!e.deathT) e.chill = Math.max(e.chill, K.chill * S.freeze);
        flashFx(e.x, 1.1, e.z, 0xbff0ff, 2, .15);
        if (p.pierce-- <= 0) p.dead = true;
      });
    }
    p.life -= dt; if (p.life <= 0) p.dead = true;
    p.g.position.set(p.x, 1.2, p.z);
    for (let i = 0; i < 2; i++) emit(sparks, p.x - p.dx * rand(0, 1.2), 1.2, p.z - p.dz * rand(0, 1.2), rand(-.5, .5), rand(0, 1), rand(-.5, .5), .35, pick([0xbff0ff, 0xffffff, 0x7fd8ff]), 0, 2);
    if (Math.random() < .6) emit(glows, p.x, 1.2, p.z, 0, .2, 0, .25, 0x4fb8ff);
    if (p.dead) { scene.remove(p.g); flashLight(p.x, p.z, 0x7fd8ff, 2, .12); }
  }
  lances = lances.filter(p => !p.dead);
}

function clear() { for (const p of lances) scene.remove(p.g); lances = []; }

export default { cast, tick, clear };
