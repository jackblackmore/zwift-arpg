// Enemy telegraphs answered with effort: SURGE, EASE OFF, SPIN, HOLD.
import { S, hero } from '../core/state.js';
import { $, rand } from '../core/util.js';
import { SFX, tone } from '../core/audio.js';
import { ACTS, TELLS } from '../data/combat.js';
import { rider, isSimulated } from '../input/rider.js';
import { panelHeight } from '../render/scene.js';
import { ring, burst, floatText, banner, shake, stop } from '../render/fx.js';
import { step, free } from './movement.js';
import { rel, baseDmg, floorScale } from './stats.js';
import { hitEnemy, killEnemy, hurtHero } from './combat.js';
import { spawnEnemy } from './enemies.js';

export function startTell(e, act) {
  const A = ACTS[act], K = TELLS[A.tell];
  e.tellCd = rand(A.cd[0], A.cd[1]);
  S.curTell = { e, act, kind: A.tell, t: A.dur, max: A.dur, acc: 0, lastSurge: -9, eased: false };
  if (act === 'charge') ring(e.x, e.z, 1.2, 0xff4fd8, A.dur);
  if (act === 'slam') ring(e.x, e.z, e.boss ? 3.4 : 2.6, 0x6fd3ff, A.dur);
  if (act === 'fuse') ring(e.x, e.z, 2.3, 0xff6a00, A.dur);
  if (act === 'heal' || act === 'summon') ring(e.x, e.z, 1.5, 0x5fe39a, A.dur);
  if (act === 'enrage') ring(e.x, e.z, 1.8, 0xffd23f, A.dur);
  floatText(e.x, e.boss ? 4.6 : 2.6, e.z, A.name.toUpperCase(), K.col, 15);
  [0, .12, .24].forEach(dl => tone(A.tell === 'brace' ? 220 : A.tell === 'spin' ? 520 : A.tell === 'hold' ? 330 : 880, .1, 'square', .05, 1, dl));
  // Scripted riders react ~82% of the time, after a short human-ish delay.
  if (isSimulated()) { const ok = Math.random() < .82; S.autoOv = ok ? { kind: A.tell, from: S.time + rand(.15, .45), until: S.time + A.dur + .4 } : null; }
  const P = $('prompt'); P.style.setProperty('--pc', K.col); P.style.display = 'flex'; P.style.bottom = (panelHeight() + 14) + 'px';
  P.querySelector('.pi').textContent = K.icon; P.querySelector('b').textContent = K.title; P.querySelector('span').textContent = `${A.name} · ${K.hint}`;
  P.querySelector('.pa').style.display = K.need ? '' : 'none';
}

export function updateTell(dt) {
  const c = S.curTell, e = c.e, K = TELLS[c.kind], R = rel();
  const P = $('prompt');
  if (e.dead || hero.dead > 0) { if (e.dead && (c.kind === 'spin' || c.kind === 'hold')) floatText(e.x, 2.6, e.z, 'INTERRUPTED!', K.col, 16); endTell(); return; }
  c.t -= dt;
  if (R >= 1.2) c.lastSurge = S.time;
  if (c.kind === 'spin' && rider.cad >= 105) c.acc += dt;
  if (c.kind === 'hold' && R >= .85 && R <= 1.07) c.acc += dt;
  P.querySelector('.pb i').style.width = (c.t / c.max * 100) + '%';
  if (K.need) P.querySelector('.pa i').style.width = Math.min(100, c.acc / K.need * 100) + '%';
  if (K.need && c.acc >= K.need) { resolveTell(true); return; }
  if (c.t <= 0) {
    const ok = c.kind === 'surge' ? S.time - c.lastSurge < .7 : c.kind === 'brace' ? R < .75 : false;
    resolveTell(ok);
  }
}

export function endTell() { S.curTell = null; S.autoOv = null; $('prompt').style.display = 'none'; }

function success(e, text, col) { floatText(hero.x, 2.7, hero.z, text, col, 19); [523, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .06, 1, i * .05)); stop(.08); shake(.25); }

function resolveTell(ok) {
  const c = S.curTell, e = c.e, fs = floorScale(), K = TELLS[c.kind];
  endTell();
  switch (c.act) {
    case 'charge': {
      e.dashT = .3; e.dashX = hero.x; e.dashZ = hero.z; e.swing = 1;
      if (ok) {
        success(e, 'DODGED!', K.col);
        const dx = hero.x - e.x, dz = hero.z - e.z, d = Math.hypot(dx, dz) || 1; step(hero, -dz / d * .9, dx / d * .9);
        setTimeout(() => { if (!e.dead) { e.stun = 2.2; hitEnemy(e, baseDmg() * 3, true); floatText(e.x, 2.2, e.z, 'COUNTER', '#ffffff', 15); } }, 260);
      } else { setTimeout(() => { if (!e.dead && Math.hypot(hero.x - e.x, hero.z - e.z) < 2.2) { hurtHero(e.dmg * 2.4 * fs); shake(.5); } }, 260); }
      break;
    }
    case 'fuse': {
      ring(e.x, e.z, 2.3, 0xff6a00, .5, false); burst(e.x, .6, e.z, 0xff6a00, 40, 6); burst(e.x, .6, e.z, 0xffd23f, 20, 4); SFX.slam(); shake(.6);
      if (ok) { success(e, 'ESCAPED!', K.col); const dx = hero.x - e.x, dz = hero.z - e.z, d = Math.hypot(dx, dz) || 1; step(hero, dx / d * 1.3, dz / d * 1.3); }
      else if (Math.hypot(hero.x - e.x, hero.z - e.z) < 2.4) hurtHero(22 * fs);
      for (const o of S.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.z - e.z) < 2.3) { o.hp -= 45 * fs; floatText(o.x, 2, o.z, Math.round(45 * fs), '#ff8a3c', 14); if (o.hp <= 0) killEnemy(o); }
      killEnemy(e);
      break;
    }
    case 'slam': {
      const r = e.boss ? 3.6 : 2.8;
      ring(e.x, e.z, r, 0x6fd3ff, .5, false); burst(e.x, .3, e.z, e.boss ? 0xff2bd6 : 0xb8a080, 40, 6); SFX.slam(); shake(e.boss ? 1 : .6); stop(.12); e.swing = 1;
      if (Math.hypot(hero.x - e.x, hero.z - e.z) < r) { hurtHero((e.boss ? 30 : 20) * fs * (ok ? .2 : 1)); if (ok) success(e, 'BRACED!', K.col); }
      break;
    }
    case 'heal': {
      if (ok) { success(e, 'INTERRUPTED!', K.col); e.stun = 2.5; }
      else { for (const o of S.enemies) if (!o.dead && o.room === e.room) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .45); ring(o.x, o.z, .9, 0x5fe39a, .6); floatText(o.x, 2.2, o.z, 'HEALED', '#5fe39a', 12); } }
      break;
    }
    case 'summon': {
      if (ok) { success(e, 'INTERRUPTED!', K.col); e.stun = 2.5; }
      else { banner('THE SWARM', '#c98bff', 'Cleave makes short work of bats'); for (let i = 0; i < 4; i++) { const a = i * 1.57; const x = e.x + Math.cos(a) * 1.6, z = e.z + Math.sin(a) * 1.6; if (free(x, z, .25)) { const b = spawnEnemy('bat', x, z, e.room); b.active = true; } } }
      break;
    }
    case 'enrage': {
      if (ok) { success(e, 'OUTLASTED!', K.col); e.buff = 'exhausted'; e.buffT = 7; floatText(e.x, 2.8, e.z, 'EXHAUSTED', '#ffd23f', 14); }
      else { e.buff = 'frenzy'; e.buffT = 6; floatText(e.x, 2.8, e.z, 'FRENZIED', '#ff5a4a', 15); ring(e.x, e.z, 1.4, 0xff5a4a, .6); }
      break;
    }
  }
}
