// Damage, deaths, player damage, burning ground and delayed effects (shatter, bloater blasts).
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
import { dropItem, dropGem } from './items.js';
import { gainXp, xpNeed } from './stats.js';
import { makePortal } from './maps.js';
import * as skel from './sk/skeletons.js';
import { HERO, RARITY, COMBAT } from '../data/balance.js';
import { DROP } from '../data/items.js';
import { BLAST, RARE, STAGGER, ANIM, BOSS, ELITE } from '../data/monsters.js';
import { TELL } from '../data/graphics.js';
import { shieldHit } from './sk/guard.js';
import { SUPPORTS } from '../data/gems.js';
import { tierHp, hitBase } from './formulas.js';

const ECOL = { fire: '#ffb070', cold: '#bff0ff', light: '#e0c8ff' };

// Hit an enemy with `mult` × (gem base + flat damage from gear) of an element. src.gem = the skill gem it came from (sets the base and the skill's `more` from supports),
// src.kx/kz = knockback direction (src.kb scales it), src.stag = × the stagger it fills (the Sword's heavy cut), src.dot = no number/sound, src.by = who gets the kill instead of the gem
// ('minion': a skeleton's hit, so it doesn't count as the gem's kill for Raise Skeletons).
export function hit(e, mult, elem, src = {}) {
  if (e.deathT) return 0;
  wake(e);
  const gem = src.gem || 'cleave', K = S.sk[gem];
  let d = hitBase(S, gem) * mult * (S.dmg + (S[elem] || 0)) * ((K && K.more) || 1) * rand(COMBAT.spread[0], COMBAT.spread[1]);
  const crit = Math.random() < S.crit; if (crit) d *= HERO.critMult;
  if (e.shock > 0) d *= 1 + (e.shockMore || SK.arc.shockMore); // Conduit (Arc's support) marks the shocks it makes
  if (e.stun > 0 && e.stagMax) { // staggered: wide open, and the first hero hit is a finisher
    d *= 1 + STAGGER.taken;
    if (e.finisher && !src.dot && src.by !== 'minion') { e.finisher = false; d *= STAGGER.finisher; finisherFx(e); }
  }
  else if (e.stagMax && !src.dot) { const C = e.channel && BOSS.channel; stagger(e, d / e.maxHp * STAGGER.dmg * (src.stag || 1) * (C ? C.hits * (1 + C.surge * (P.surgeK || 0)) : 1 + STAGGER.surge * (P.surgeK || 0))); } // a channel is easier to break, more so surging
  e.hp -= d; e.flash = .07; e.lastElem = elem; e.lastGem = src.by || gem; e.lastHit = Math.max(e.lastHit || 0, d);
  if (!src.dot) {
    floatT(e.x, e.h + .3, e.z, Math.round(d), crit ? '#ffe060' : ECOL[elem] || '#fff', crit ? 17 : 12);
    if (src.kx !== undefined && e.type !== 'boss') { const k = (crit ? 5 : 3) / (e.rar === 2 ? 3 : 1) * (src.kb ?? 1); e.vx += src.kx * k; e.vz += src.kz * k; }
    SFX.hit(); if (crit) shake(.08);
  }
  if (e.hp <= 0) kill(e);
  return d;
}

// Stagger (data/monsters.js STAGGER): guardians and rares fill a bar (e.stag, 0..1); full means stunned for a few seconds, its
// wind-up or ability cancelled. Normal monsters have no bar: a parry stuns them briefly instead (parried below).
export function stagger(e, amt) {
  if (!e.stagMax || e.stun > 0 || e.deathT) return;
  e.stag = Math.min(1, (e.stag || 0) + amt); e.stagWait = STAGGER.delay;
  if (e.stag < 1) return;
  e.stag = 0; stun(e, STAGGER.stunT); e.finisher = true; P.staggers++;
  floatT(e.x, e.h + .6, e.z, 'STAGGERED', '#ffb040', 18, 1.4); flashFx(e.x, e.h * .6, e.z, TELL.stagger, e.r * 5, .35); burst(e.x, e.h * .7, e.z, TELL.stagger, 30, 5);
  shake(.35); stop(.12); SFX.parry();
}
// A finisher (Sekiro's deathblow) lands: a white flash, a heavy crunch and big text, so it reads as the payoff for breaking it.
function finisherFx(e) {
  P.finishers++;
  floatT(e.x, e.h + 1, e.z, 'FINISHER', '#ffffff', 24, 1.6); flashFx(e.x, e.h * .6, e.z, 0xffffff, e.r * 7, .3);
  burst(e.x, e.h * .7, e.z, 0xfff0c0, 50, 7); burst(e.x, e.h * .7, e.z, TELL.stagger, 30, 4); flashLight(e.x, e.z, 0xfff0d0, 6, .35);
  shake(.6); stop(.2); SFX.finisher();
}
function stun(e, t) {
  if (e.channel) { e.channel = null; P.chanBroken++; floatT(e.x, e.h + 1.4, e.z, 'CHANNEL BROKEN', '#' + TELL.channel.toString(16).padStart(6, '0'), 16, 1.4); } // stagger breaks a channel (BOSS.channel)
  e.stun = t; e.windup = 0; e.cast = null; e.charging = null; e.fuse = 0;
  if (e.model.rigged) { const [n, sp] = ANIM.stun, d = e.model.play(n, { once: true, speed: sp * 3 / Math.max(1, t), fade: .05 }); e.lock = d / (sp * 3 / Math.max(1, t)); }
}
// You parried monster e (game/sk/guard.js): stagger a guardian or rare, stun anything else for a moment.
export function parried(e) {
  if (e.deathT) return;
  if (e.stagMax) stagger(e, (e.type === 'boss' ? STAGGER.parry : STAGGER.parryRare) * (e.channel ? BOSS.channel.parry : 1));
  else stun(e, STAGGER.minorStun);
}

export function kill(e) {
  if (e.deathT) return;
  e.deathT = .001; G.mapKills++; P.kills++;
  SFX.kill();
  const col = e.freeze > 0 ? 0xbff0ff : e.type === 'bloater' ? 0x9ad060 : e.type === 'boss' ? 0xff4fd8 : 0x9a2a1a;
  burst(e.x, 1, e.z, col, e.type === 'boss' ? 120 : e.rar === 2 ? 40 : 12, e.type === 'boss' ? 9 : 4);
  if (e.aura) e.aura.visible = false; if (e.fireAura) e.fireAura.visible = false;
  gainXp(e.xp * (e.rar === 2 ? RARITY.rare.xp * (e.elite ? ELITE.xp : 1) : e.rar === 1 ? RARITY.magic.xp : 1) * (1 + TIER.xp * (G.tier - 1)));
  P.life = Math.min(S.maxLife, P.life + S.lok);
  P.flask = Math.min(SK.flask.max, P.flask + (e.rar === 2 ? SK.flask.perRare : SK.flask.perKill));
  if (e.elite) { // an elite room's elite: more and better items than a rare, and no gem (gem drops are the owner's call)
    const D = DROP.elite; stop(.1); shake(.5); banner(e.name.toUpperCase() + ' FALLS', '#ff7a3a', 'The fog lifts');
    for (let i = 0; i < D.n; i++) G.queue.push({ k: 'later', t: i * D.gap, fn: () => dropItem(e.x, e.z, i === 0 ? D.first : D.rest) });
  } else if (e.rar === 2) { const D = DROP.rare; dropItem(e.x, e.z, D.boost); if (Math.random() < D.second) dropItem(e.x, e.z, D.boost2); if (Math.random() < DROP.gem) dropGem(e.x, e.z); stop(.06); shake(.3); }
  else if (e.type !== 'boss' && Math.random() < (e.rar === 1 ? DROP.magic : DROP.normal)) dropItem(e.x, e.z, 0);
  if (e.shatter && e.freeze > 0) G.queue.push({ k: 'shatter', x: e.x, z: e.z, hp: e.maxHp }); // frozen by a Frost Nova with Shatter
  if (S.sk[e.lastGem] && S.sk[e.lastGem].raise) skel.onKill(e); // Raise Skeletons support on the skill that killed it
  // Death blasts: a bloater only when its fuse ran out (killing it first defuses it); a volatile rare always.
  if ((e.type === 'bloater' && e.fused) || e.aff.includes('volatile')) { const B = e.type === 'bloater' ? BLAST.bloater : BLAST.volatile; G.queue.push({ k: 'bloat', x: e.x, z: e.z, t: B.delay, dmg: e.dmg * B.dmg, r: B.r, kind: B.kind }); }
  if (e.aff.includes('splitting')) for (let i = 0; i < RARE.splitting.n; i++) { const r = spawnEnemy(RARE.splitting.type, e.x + rand(-1, 1), e.z + rand(-1, 1), null, 1); r.awake = true; G.mapTotal++; }
  if (e.type === 'boss') {
    banner('THE WARDEN FALLS', '#ff4fd8', 'A portal opens · step through for a harder map'); shake(1); stop(.3); $('bossbar').style.display = 'none';
    for (let i = 0; i < DROP.boss.n; i++) G.queue.push({ k: 'later', t: i * DROP.boss.gap, fn: () => dropItem(e.x, e.z, i === 0 ? DROP.boss.first : DROP.boss.rest) });
    dropGem(e.x, e.z); // guardians always drop a gem
    makePortal(e.x - 2, e.z + 2);
  }
}

// src: what hit you (a monster type, 'slam', 'nova', 'arrow', 'blast', 'aura', 'charge', 'burst'), tallied after shields in P.takenBy for the arena.
// o: { from: {x, z} where it comes from, kind: 'hit' (parry or block) | 'heavy' (block for less, or roll) | 'unblockable' (roll),
// by: the monster, for a parry's stagger }. The Knight's Shield (game/sk/guard.js) takes it first. Returns what happened:
// 'miss' (dead or untouchable, e.g. rolling), 'parry', 'block', 'broken' or 'hit'.
export function hurtP(d, src = '?', o = {}) {
  if (P.dead > 0 || P.invuln > 0) return 'miss';
  d = shieldHit(d, o); if (o.result === 'parry') return 'parry';
  if (o.by && o.by.stagMax && o.result !== 'block' && !(o.by.stun > 0)) o.by.stag = Math.max(0, (o.by.stag || 0) - STAGGER.recover); // it landed one: it steadies
  d *= 1 - S.dr;
  if (P.shield > 0) { // Magic Shield's parry barrier (game/sk/arts.js)
    const a = Math.min(P.shield, d); P.shield -= a; d -= a; floatT(P.x, 2.4, P.z, Math.round(a), '#9fc8ff', 12); if (d <= 0) return o.result || 'hit'; }
  P.life -= d; P.taken = (P.taken || 0) + d; if (P.takenBy) P.takenBy[src] = (P.takenBy[src] || 0) + d;
  floatT(P.x, 2.1, P.z, Math.round(d), '#ff5050', 13); G.vign = Math.min(.9, G.vign + .35); SFX.hurt();
  if (P.life <= 0) {
    P.life = 0; P.dead = 2.6; banner('YOU HAVE DIED', '#ff3030', 'Respawning at the map entrance');
    burst(P.x, 1, P.z, 0xff2020, 50, 5); P.xp = Math.max(0, P.xp - xpNeed(P.lvl) * COMBAT.deathXp);
  }
  return o.result || 'hit';
}

export function addPatch(x, z, r, t, gem) { const g = new T.Group(); g.add(decal(0xff4a10, r * 2.6)); g.position.set(x, 0, z); scene.add(g); G.patches.push({ x, z, r, t, max: t, tick: 0, g, gem }); }
export function updPatches(dt) {
  for (const f of G.patches) {
    f.t -= dt; f.tick -= dt; f.g.scale.setScalar(.6 + .4 * Math.min(1, f.t / f.max * 3));
    if (Math.random() < dt * 18) emit(glows, f.x + rand(-f.r, f.r) * .7, .3, f.z + rand(-f.r, f.r) * .7, 0, rand(1, 2.5), 0, rand(.3, .6), pick([0xff5a10, 0xff8a20]));
    if (f.tick <= 0) { f.tick = SK.burn.tick; near(f.x, f.z, f.r, e => { hit(e, SK.burn.mult, 'fire', { gem: f.gem, dot: 1 }); }); }
    if (f.t <= 0) { f.dead = true; scene.remove(f.g); }
  }
  G.patches = G.patches.filter(f => !f.dead);
}

// Deferred effects run next frame (avoids deep recursion when chain reactions cascade).
export function processQueue(dt) {
  for (const q of G.queue) {
    if (q.t > 0) { q.t -= dt; continue; }
    q.done = true;
    if (q.k === 'later') q.fn(); // anything delayed in game time (guardian nova waves, guardian loot)
    if (q.k === 'shatter') {
      const SH = SUPPORTS.shatter, r = SH.radius * S.aoe;
      near(q.x, q.z, r, e => { e.hp -= q.hp * SH.pct; floatT(e.x, e.h, e.z, Math.round(q.hp * SH.pct), '#bff0ff', 12); if (e.type !== 'boss') { e.freeze = Math.max(e.freeze, SH.freeze); e.shatter = true; } if (e.hp <= 0) kill(e); });
      ringFx(q.x, q.z, r, 0xbff0ff, .3, .3); burst(q.x, .8, q.z, 0xbff0ff, 24, 6);
    }
    if (q.k === 'bloat') {
      const r = q.r;
      ringFx(q.x, q.z, r, 0x9ad060, .35, .5); flashFx(q.x, .8, q.z, 0x9ad060, r * 2.5, .3); burst(q.x, .6, q.z, 0x9ad060, 30, 6); burst(q.x, .6, q.z, 0x5a8a20, 15, 4); SFX.boom(); shake(.15);
      if (dist(P.x, P.z, q.x, q.z) < r + P.r) hurtP(q.dmg, 'blast', { from: q, kind: q.kind });
      near(q.x, q.z, r, e => { e.hp -= BLAST.vsMonsters * tierHp(G.tier); if (e.hp <= 0) kill(e); });
    }
  }
  G.queue = G.queue.filter(q => !q.done);
}
