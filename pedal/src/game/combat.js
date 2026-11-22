import * as T from 'three';
import { S, hero, ride } from '../core/state.js';
import { rand } from '../core/util.js';
import { SFX, tone } from '../core/audio.js';
import { ELEM, elemOf } from '../data/combat.js';
import { scene } from '../render/scene.js';
import { lam } from '../render/models.js';
import { burst, ring, bolt, floatText, banner, shake, stop } from '../render/fx.js';
import { M } from '../world/map.js';
import { step } from './movement.js';
import { addGold, maxHp, defense, rel, critChance, baseDmg, floorScale, has } from './stats.js';
import { giveLoot } from './loot.js';
import { queueBoon } from './boons.js';
import { hideChoice } from './choices.js';
import { endTell } from './tells.js';

export function hitEnemy(e, amount, crit) {
  if (e.dead) return;
  let a = amount;
  const el = elemOf(rel());
  if (e.weak === el) { a *= 2; if (S.time - S.weakFloatT > .6) { S.weakFloatT = S.time; floatText(e.x, e.boss ? 4.2 : 2.4, e.z, ELEM[el].icon + ' WEAK', ELEM[el].col, 13); } }
  if (e.stun > 0) a *= 1.5;
  if (e.buff === 'exhausted') a *= 1.6;
  if (e.shielded && !crit && e.stun <= 0) { a *= .3; if (Math.random() < .3) floatText(e.x, 2.2, e.z, 'BLOCK', '#9aa0b0', 11); }
  if (e.boss) {
    if (e.stagger > 0) a *= 1.5;
    else if (e.shield > 0) {
      const s = crit ? a : a * .4; e.shield -= s;
      floatText(e.x, 3.6, e.z, Math.round(s), crit ? '#ffffff' : '#6fd3ff', crit ? 17 : 12);
      e.flashT = .08; burst(e.x, 2, e.z, 0x6fd3ff, crit ? 8 : 2);
      if (crit) { SFX.crit(); stop(.035); } else SFX.hit();
      if (e.shield <= 0) { e.shield = 0; e.stagger = 7; shake(.5); stop(.12); SFX.kill(); banner('SHIELD BROKEN', '#6fd3ff', 'The Warden is staggered: pile on damage'); ring(e.x, e.z, 3, 0x6fd3ff, .6); burst(e.x, 2, e.z, 0x6fd3ff, 40, 5); }
      return;
    }
  }
  e.hp -= a; e.flashT = .08;
  if (crit) { SFX.crit(); stop(.035); shake(.12); } else SFX.hit();
  if (!e.boss) { const dx = e.x - hero.x, dz = e.z - hero.z, d = Math.hypot(dx, dz) || 1, k = (crit ? .32 : .14) / (e.elite ? 2 : 1); step(e, dx / d * k, dz / d * k); }
  floatText(e.x, e.boss ? 3.6 : 1.9, e.z, (crit ? 'CRIT ' : '') + Math.round(a), crit ? '#ffffff' : '#ffcf8a', crit ? 17 : 12);
  burst(e.x, 1, e.z, crit ? 0xffffff : ELEM[el].hex, crit ? 8 : 3);
  if (e.hp <= 0) killEnemy(e);
}

export function killEnemy(e) {
  e.dead = true; scene.remove(e.model.g); e.bar.remove();
  SFX.kill(); stop(e.boss ? .25 : .05); shake(e.boss ? .9 : e.elite ? .35 : .12); ride.kills++; if (e.boss) ride.bosses++;
  burst(e.x, .8, e.z, e.type === 'slime' ? 0x3fbf4a : 0xd8d0b8, e.boss ? 80 : 18, e.boss ? 6 : 3);
  const g = addGold(e.gold * floorScale() * rand(.8, 1.3)); SFX.coin();
  floatText(e.x, 1.4, e.z, `+${g}g`, '#ffd23f', 11);
  const r = e.room;
  if (!S.enemies.some(o => !o.dead && o.room === r)) {
    r.done = true; ride.rooms++;
    if (r.type === 'elite') { banner('ELITE SLAIN', '#ffd23f', 'Loot dropped'); giveLoot(.25); queueBoon(.9); }
    else if (r.type === 'boss') {
      banner('THE WARDEN FALLS', '#ff4fd8', 'Take the stairs down');
      giveLoot(.45); giveLoot(.3); queueBoon(1.2);
      const stairs = S.stairs = new T.Group();
      const s1 = new T.Mesh(new T.CylinderGeometry(.9, .9, .1, 24), lam(0x101018, 0x2a1050)); s1.position.y = .02; stairs.add(s1);
      const rg = new T.Mesh(new T.TorusGeometry(.95, .06, 8, 32), new T.MeshBasicMaterial({ color: 0xb06bff })); rg.rotation.x = Math.PI / 2; rg.position.y = .1; stairs.add(rg);
      stairs.position.set(r.cx, 0, r.cy); scene.add(stairs);
    } else if (r.type === 'combat') { if (Math.random() < .45) giveLoot(0); }
  }
}

export function hurtHero(n) {
  if (hero.dead > 0) return;
  const d = n * (1 - defense());
  hero.hp -= d; floatText(hero.x, 1.9, hero.z, '-' + Math.round(d), '#ff5a5a', 13); SFX.hurt(); shake(.15);
  if (hero.hp > 0 && hero.hp < maxHp() * .35 && hero.potions > 0) { hero.potions--; hero.hp = Math.min(maxHp(), hero.hp + maxHp() * .6); floatText(hero.x, 2.4, hero.z, 'POTION', '#ff6a8a', 15); burst(hero.x, 1, hero.z, 0xff4a6a, 16, 2); tone(660, .25, 'sine', .07, 1.6); }
  if (hero.hp <= 0) {
    hero.hp = 0; hero.dead = 3;
    const lost = Math.floor(S.gold * .25); S.gold -= lost;
    banner('YOU FELL', '#ff5a5a', `Lost ${lost} gold · respawning at the entrance`);
    burst(hero.x, 1, hero.z, 0xff3a3a, 30);
  }
}

export function respawn() {
  const s = M.rooms.find(r => r.type === 'start');
  hero.x = s.cx; hero.z = s.cy; hero.hp = maxHp(); hero.path = null; hero.goal = null; S.choices = null; hideChoice();
  if (S.curTell) endTell(); S.arrows.forEach(a => scene.remove(a.m)); S.arrows = [];
  for (const e of S.enemies) if (!e.dead) { e.buff = null; e.stun = 0; e.dashT = 0; e.active = false; e.x = e.sx; e.z = e.sz; e.hp = e.maxHp; if (e.boss) { e.shield = e.shieldMax; e.tele = 0; e.stagger = 0; } e.room.entered = false; }
}

export function cleave(foes) {
  ring(hero.x, hero.z, 2.6, 0xe8b960, .45); hero.swing = 1; SFX.cleave(); shake(.2);
  floatText(hero.x, 2.4, hero.z, 'CLEAVE', '#e8b960', 14);
  for (const e of foes) if (Math.hypot(e.x - hero.x, e.z - hero.z) < 2.6) { const c = Math.random() < critChance(); hitEnemy(e, baseDmg() * 2.6 * (c ? 2 : 1), c); }
}

export function overload(t, foes) {
  floatText(hero.x, 2.6, hero.z, 'OVERLOAD', '#b06bff', 16); SFX.overload(); stop(.08); shake(.4);
  bolt(t.x, 9, t.z, t.x, .5, t.z, 0xd9b0ff); ring(t.x, t.z, 1.6, 0xb06bff, .5);
  hitEnemy(t, baseDmg() * 6, true);
  let prev = t;
  foes.filter(e => e !== t && !e.dead).slice(0, has('chain') ? 4 : 2).forEach(e => { bolt(prev.x, 1, prev.z, e.x, 1, e.z, 0xb06bff); hitEnemy(e, baseDmg() * 3, true); prev = e; });
}

export function shoot(e) {
  const dx = hero.x - e.x, dz = hero.z - e.z, d = Math.hypot(dx, dz) || 1, sp = 7;
  const m = new T.Mesh(new T.BoxGeometry(.06, .06, .45), new T.MeshBasicMaterial({ color: e.bolt })); m.rotation.y = Math.atan2(dx, dz);
  scene.add(m); S.arrows.push({ m, x: e.x, z: e.z, vx: dx / d * sp, vz: dz / d * sp, life: 2.5, dmg: e.dmg * floorScale() });
  tone(e.type === 'healer' ? 700 : 420, .08, 'triangle', .03, 1.6);
}
