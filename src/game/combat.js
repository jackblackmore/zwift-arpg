// Damage, deaths, player damage, explosions, burning ground and delayed effects (shatter, bloater blasts).
import * as T from 'three';
import { G, P, S, shake, stop } from '../core/state.js';
import { TIER } from '../data/monsters.js';
import { SK } from '../data/skills.js';
import { rand, pick, dist, $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene, flashLight } from '../render/scene.js';
import { decal } from '../render/assets.js';
import { sparks, glows, emit, burst, ringFx, flashFx, floatT, banner } from '../render/fx.js';
import { near, wake, spawnEnemy } from './enemies.js';
import { dropItem } from './items.js';
import { gainXp, xpNeed } from './stats.js';
import { makePortal } from './maps.js';
import { castArc } from './skills.js';

const ECOL = { fire: '#ffb070', cold: '#bff0ff', light: '#e0c8ff' };

// Hit an enemy with `mult` × base spell damage of an element. src.kx/kz = knockback direction, src.dot = no number/sound.
export function hit(e, mult, elem, src = {}) {
  if (e.deathT) return 0;
  wake(e);
  let d = S.base * mult * (S.dmg + (S[elem] || 0)) * rand(.88, 1.12);
  const crit = Math.random() < S.crit; if (crit) d *= 1.75;
  if (e.shock > 0) d *= S.conduit ? 1.35 : 1.2;
  e.hp -= d; e.flash = .07; e.lastElem = elem; e.lastHit = Math.max(e.lastHit || 0, d);
  if (!src.dot) {
    floatT(e.x, e.h + .3, e.z, Math.round(d), crit ? '#ffe060' : ECOL[elem] || '#fff', crit ? 17 : 12);
    if (src.kx !== undefined && e.type !== 'boss') { const k = (crit ? 5 : 3) / (e.rar === 2 ? 3 : 1); e.vx += src.kx * k; e.vz += src.kz * k; }
    SFX.hit(); if (crit) shake(.08);
  }
  if (e.hp <= 0) kill(e);
  return d;
}

export function kill(e) {
  if (e.deathT) return;
  e.deathT = .001; G.mapKills++; P.kills++;
  SFX.kill();
  const col = e.freeze > 0 ? 0xbff0ff : e.type === 'bloater' ? 0x9ad060 : e.type === 'boss' ? 0xff4fd8 : 0x9a2a1a;
  burst(e.x, 1, e.z, col, e.type === 'boss' ? 120 : e.rar === 2 ? 40 : 12, e.type === 'boss' ? 9 : 4);
  if (e.aura) e.aura.visible = false; if (e.fireAura) e.fireAura.visible = false;
  gainXp(e.xp * (e.rar === 2 ? 8 : e.rar === 1 ? 2 : 1) * (1 + TIER.xp * (G.tier - 1)));
  P.life = Math.min(S.maxLife, P.life + S.lok); P.mana = Math.min(S.maxMana, P.mana + S.mok);
  P.flask = Math.min(SK.flask.max, P.flask + (e.rar === 2 ? SK.flask.perRare : SK.flask.perKill));
  if (e.rar === 2) { dropItem(e.x, e.z, .15); if (Math.random() < .5) dropItem(e.x, e.z, .1); stop(.06); shake(.3); }
  else if (e.type !== 'boss' && Math.random() < (e.rar === 1 ? .1 : .04)) dropItem(e.x, e.z, 0);
  if (S.shatter && e.freeze > 0) G.queue.push({ k: 'shatter', x: e.x, z: e.z, hp: e.maxHp });
  if (S.chainboom && e.lastElem === 'fire' && Math.random() < .3) G.queue.push({ k: 'boom', x: e.x, z: e.z });
  if (e.type === 'bloater' || e.aff.includes('volatile')) G.queue.push({ k: 'bloat', x: e.x, z: e.z, t: e.type === 'bloater' ? .15 : .9, dmg: e.dmg * (e.type === 'bloater' ? .7 : 1.2), small: e.type !== 'bloater' });
  if (e.aff.includes('splitting')) for (let i = 0; i < 3; i++) { const r = spawnEnemy('runner', e.x + rand(-1, 1), e.z + rand(-1, 1), null, 1); r.awake = true; G.mapTotal++; }
  if (e.type === 'boss') {
    banner('THE WARDEN FALLS', '#ff4fd8', 'A portal opens · step through for a harder map'); shake(1); stop(.3); $('bossbar').style.display = 'none';
    for (let i = 0; i < 5; i++) setTimeout(() => dropItem(e.x, e.z, i === 0 ? .6 : .25), i * 120);
    makePortal(e.x - 2, e.z + 2);
  }
}

export function hurtP(d) {
  if (P.dead > 0 || P.invuln > 0) return;
  d *= 1 - S.dr; P.life -= d;
  floatT(P.x, 2.1, P.z, Math.round(d), '#ff5050', 13); G.vign = Math.min(.9, G.vign + .35); SFX.hurt();
  if (P.life <= 0) {
    P.life = 0; P.dead = 2.6; banner('YOU HAVE DIED', '#ff3030', 'Respawning at the map entrance');
    burst(P.x, 1, P.z, 0xff2020, 50, 5); P.xp = Math.max(0, P.xp - xpNeed(P.lvl) * .1);
  }
}

// Spend mana (or life with Blood Magic). Returns false if the player can't afford it.
export function pay(cost) {
  if (S.blood) { if (P.life <= cost + 1) return false; P.life -= cost; return true; }
  if (P.mana < cost) return false; P.mana -= cost; return true;
}

export function explode(x, z, mult = 1, storm = false, small = false) {
  const r = (small ? 1.4 : SK.fireball.radius) * S.aoe;
  near(x, z, r, e => {
    const dd = dist(e.x, e.z, x, z) || 1;
    const d = hit(e, mult, 'fire', { kx: (e.x - x) / dd, kz: (e.z - z) / dd });
    if (S.ignite && !e.deathT) { e.burnT = 3; e.burnDps = Math.max(e.burnDps, d * .2); }
  });
  flashFx(x, 1, z, 0xff7a2a, r * 2.4, .28); flashFx(x, 1, z, 0xffe0a0, r * 1.1, .15); ringFx(x, z, r, 0xff8a3c, .3, .4);
  for (let i = 0; i < 22; i++) { const a = rand(0, 6.28), s = rand(2, 7); emit(sparks, x, 1, z, Math.cos(a) * s, rand(1, 5), Math.sin(a) * s, rand(.3, .7), pick([0xff8a3c, 0xffd060, 0xff4a10]), 8, 2); }
  for (let i = 0; i < 5; i++) emit(glows, x + rand(-.5, .5), .8, z + rand(-.5, .5), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(.3, .6), 0xff5a10, 0, 2);
  flashLight(x, z, 0xff7a2a, 3.5, .25); SFX.boom(); shake(.05);
  if (S.burnGround) addPatch(x, z, r * .8, 2.5);
  if (storm) castArc(x, z, true);
}

export function addPatch(x, z, r, t) { const g = new T.Group(); g.add(decal(0xff4a10, r * 2.6)); g.position.set(x, 0, z); scene.add(g); G.patches.push({ x, z, r, t, max: t, tick: 0, g }); }
export function updPatches(dt) {
  for (const f of G.patches) {
    f.t -= dt; f.tick -= dt; f.g.scale.setScalar(.6 + .4 * Math.min(1, f.t / f.max * 3));
    if (Math.random() < dt * 18) emit(glows, f.x + rand(-f.r, f.r) * .7, .3, f.z + rand(-f.r, f.r) * .7, 0, rand(1, 2.5), 0, rand(.3, .6), pick([0xff5a10, 0xff8a20]));
    if (f.tick <= 0) { f.tick = SK.burn.tick; near(f.x, f.z, f.r, e => { hit(e, SK.burn.mult, 'fire', { dot: 1 }); }); }
    if (f.t <= 0) { f.dead = true; scene.remove(f.g); }
  }
  G.patches = G.patches.filter(f => !f.dead);
}

// Deferred effects run next frame (avoids deep recursion when chain reactions cascade).
export function processQueue(dt) {
  for (const q of G.queue) {
    if (q.t > 0) { q.t -= dt; continue; }
    q.done = true;
    if (q.k === 'shatter') {
      const r = 2.4 * S.aoe;
      near(q.x, q.z, r, e => { e.hp -= q.hp * .3; floatT(e.x, e.h, e.z, Math.round(q.hp * .3), '#bff0ff', 12); if (e.type !== 'boss') e.freeze = Math.max(e.freeze, .9); if (e.hp <= 0) kill(e); });
      ringFx(q.x, q.z, r, 0xbff0ff, .3, .3); burst(q.x, .8, q.z, 0xbff0ff, 24, 6);
    }
    if (q.k === 'boom') explode(q.x, q.z, .6, false, true);
    if (q.k === 'bloat') {
      const r = q.small ? 2.6 : 2.2;
      ringFx(q.x, q.z, r, 0x9ad060, .35, .5); flashFx(q.x, .8, q.z, 0x9ad060, r * 2.5, .3); burst(q.x, .6, q.z, 0x9ad060, 30, 6); burst(q.x, .6, q.z, 0x5a8a20, 15, 4); SFX.boom(); shake(.15);
      if (dist(P.x, P.z, q.x, q.z) < r + P.r) hurtP(q.dmg);
      near(q.x, q.z, r, e => { e.hp -= 20 * (1 + TIER.hp * (G.tier - 1)); if (e.hp <= 0) kill(e); });
    }
  }
  G.queue = G.queue.filter(q => !q.done);
}
