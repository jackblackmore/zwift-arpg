// One simulation tick. Called at a fixed-ish dt by the main loop and by __dbg.sim().
import { S, hero, ride } from '../core/state.js';
import { $, clamp } from '../core/util.js';
import { zoneOf } from '../data/zones.js';
import { rider, updateRider } from '../input/rider.js';
import { scene } from '../render/scene.js';
import { banner, floatText, burst, shake } from '../render/fx.js';
import { M, idx, walk, astar } from '../world/map.js';
import { WB, revealAround, revealRoom, cutaway } from '../world/build.js';
import { has, maxHp, rel, exhausted, critChance, atkRate, baseDmg, addGold, floorScale } from './stats.js';
import { moveTo, followPath, step, los } from './movement.js';
import { hitEnemy, hurtHero, respawn, cleave, overload, shoot } from './combat.js';
import { giveLoot } from './loot.js';
import { queueBoon, offerBoon } from './boons.js';
import { goalSpot, makeChoices, autoPick, choose } from './choices.js';
import { startTell, updateTell } from './tells.js';
import { ACTS } from '../data/combat.js';
import { populate } from './enemies.js';
import { newFloor } from './floor.js';

export function update(dt) {
  S.time += dt;
  S.ftp = clamp(+$('ftp').value || 250, 100, 500);
  const ftp = S.ftp, time = S.time;

  // --- rider input (manual, scripted, later Bluetooth) ---
  updateRider(dt);
  let target = rider.sprintHeld ? Math.max(rider.pw, ftp * 1.75) : rider.pw;
  if (exhausted()) target = Math.min(target, ftp * 1.0);
  hero.pow += (target - hero.pow) * Math.min(1, dt * 4);
  const R = rel(), zi = zoneOf(R), cad = rider.cad;

  // --- energy systems ---
  if (hero.pow > ftp) hero.wbal -= (hero.pow - ftp) * dt * (has('spark') ? 1.3 : 1);
  else hero.wbal += (ftp - hero.pow) * dt * (hero.goal && hero.goal.type === 'campfire' && hero.rest > 0 ? 1.2 : .6);
  if (hero.wbal <= 0 && hero.wbal + (hero.pow - ftp) * dt > 0) banner('EXHAUSTED', '#ff9a3c', 'W′ empty · ease below FTP to recover');
  hero.wbal = clamp(hero.wbal, 0, hero.wmax);
  hero.cleave = Math.min(1, hero.cleave + hero.pow * dt / 1500 * (has('ember') ? 1.6 : 1));
  // boon trackers
  hero.pAvg += (hero.pow - hero.pAvg) * Math.min(1, dt / 20);
  if (Math.abs(hero.pow - hero.pAvg) < hero.pAvg * .1 + 8) hero.dieselT += dt; else hero.dieselT = 0;
  hero.cAvg += (cad - hero.cAvg) * Math.min(1, dt / 8);
  if (Math.abs(cad - hero.cAvg) < 4) hero.metT += dt; else hero.metT = 0;
  if (has('wind') && R < .65 && hero.dead <= 0) hero.hp = Math.min(maxHp(), hero.hp + 3 * dt);
  // ride stats
  if (S.started) {
    ride.t += dt; ride.kj += hero.pow * dt / 1000; ride.zt[zi] += dt; ride.acc += hero.pow * dt; ride.accN += dt;
    if (ride.accN >= 1) { const v = ride.acc / ride.accN; ride.samples.push(v); ride.acc = 0; ride.accN = 0; ride.peak = Math.max(ride.peak, v); }
  }
  if (!exhausted()) hero.over = Math.min(1, hero.over + Math.max(0, hero.pow - ftp) * dt / 1500);
  if (zi === 3) { hero.strT += dt; if (hero.strT >= 4) { hero.strT = 0; if (hero.str < 10) { hero.str++; floatText(hero.x, 2.1, hero.z, '+STR', '#ffd23f', 13); } } }
  else { hero.strT -= dt * .5; if (hero.strT < -10) { hero.strT = 0; hero.str = Math.max(0, hero.str - 1); } }

  // --- hero ---
  const spd = 2.2 + 1.5 * clamp(R, 0, 1.4);
  if (hero.dead > 0) { hero.dead -= dt; if (hero.dead <= 0) respawn(); }
  else {
    const cell = M.roomOf[idx(Math.round(hero.x), Math.round(hero.z))];
    if (cell >= 0) { const r = M.rooms[cell]; if (!r.entered) enterRoom(r); }
    const foes = S.enemies.filter(e => !e.dead && e.active);
    hero.atkT -= dt;
    if (foes.length) {
      hero.needRepath = true;
      let t = foes[0], best = 1e9, bs = 1e9;
      for (const e of foes) {
        const d = Math.hypot(e.x - hero.x, e.z - hero.z);
        const sc = d - (e.type === 'healer' ? 2.5 : 0) - (S.curTell && S.curTell.e === e && S.curTell.kind === 'spin' ? 5 : 0) - (e.role === 'ranged' ? .8 : 0);
        if (sc < bs) { bs = sc; best = d; t = e; }
      }
      const reach = 1.05 + t.r;
      if (best > reach) moveTo(hero, t.x, t.z, spd, dt);
      else {
        hero.face = Math.atan2(t.x - hero.x, t.z - hero.z);
        if (hero.atkT <= 0) { hero.atkT = 1 / atkRate(); hero.swing = 1; const c = Math.random() < critChance(); hitEnemy(t, baseDmg() * (c ? 2 : 1), c); }
        if (hero.over >= 1) { hero.over = 0; overload(t, foes); }
      }
      if (hero.cleave >= 1 && foes.some(e => Math.hypot(e.x - hero.x, e.z - hero.z) < 2.6)) { hero.cleave = 0; cleave(foes); }
    } else if (hero.goal) {
      const g = hero.goal;
      if (hero.needRepath) { hero.needRepath = false; const [gx, gz] = goalSpot(g); hero.path = astar(Math.round(hero.x), Math.round(hero.z), gx, gz) || []; }
      if (followPath(dt, spd)) {
        if (g.type === 'treasure') {
          hero.face = Math.atan2(1, 0);
          hero.lock += dt * clamp((cad - 75) / 25, .12, 1.6) / 7;
          if (hero.lock >= 1) {
            g.done = true; ride.rooms++; g.chest.lid.rotation.x = -1.9; burst(g.cx, .8, g.cy, 0xffd23f, 30); banner('VAULT OPENED', '#5fe39a', '');
            giveLoot(.15); if (Math.random() < .5) queueBoon(.9);
            const gg = addGold(20 * S.floorN); shake(.2); floatText(g.cx, 1.5, g.cy, `+${gg}g`, '#ffd23f'); hero.goal = null;
          }
        } else if (g.type === 'campfire') {
          hero.face = Math.atan2(1, 0);
          hero.rest += dt;
          const easy = R < .7;
          hero.hp = Math.min(maxHp(), hero.hp + (easy ? 14 : 4) * dt);
          if (hero.rest > 4 && hero.hp >= maxHp() - .5) { g.done = true; ride.rooms++; hero.potions = 3; hero.goal = null; floatText(hero.x, 2.1, hero.z, 'RESTED', '#ff8a4a', 15); }
        } else if (g.done) hero.goal = null;
      }
      if (hero.goal && hero.goal.done && hero.goal.type !== 'campfire' && hero.goal.type !== 'treasure') hero.goal = null;
      if (!hero.goal) hero.path = null;
    } else if (S.stairs) {
      if (!hero.path || hero.needRepath) { hero.needRepath = false; hero.path = astar(Math.round(hero.x), Math.round(hero.z), S.stairs.position.x, S.stairs.position.z) || []; }
      if (followPath(dt, spd)) { S.floorN++; ride.floors++; hero.potions = Math.min(3, hero.potions + 1); banner('FLOOR ' + S.floorN, '#e8b960', 'The dungeon grows stronger'); newFloor(); }
    } else if (S.boonChoice) { S.choiceT -= dt; if (S.choiceT <= 0) choose(Math.random() < .5 ? 0 : 1); }
    else if (!S.choices) makeChoices();
    else { S.choiceT -= dt; if (S.choiceT <= 0) choose(autoPick()); }
    if (!foes.length && hero.hp < maxHp()) hero.hp = Math.min(maxHp(), hero.hp + .8 * dt);
  }
  if (hero.swing > 0) hero.swing = Math.max(0, hero.swing - dt * 4);

  // --- tells ---
  if (S.curTell) updateTell(dt);
  // --- projectiles ---
  for (const a of S.arrows) {
    a.x += a.vx * dt; a.z += a.vz * dt; a.life -= dt; a.m.position.set(a.x, 1, a.z);
    if (!walk(Math.round(a.x), Math.round(a.z)) || a.life <= 0) a.dead = true;
    else if (hero.dead <= 0 && Math.hypot(a.x - hero.x, a.z - hero.z) < .45) { a.dead = true; hurtHero(a.dmg); }
    if (a.dead) scene.remove(a.m);
  }
  S.arrows = S.arrows.filter(a => !a.dead);
  // --- enemies ---
  updateEnemies(dt);

  // --- fx ---
  for (const p of S.parts) {
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vy -= 9 * dt;
    if (p.m.position.y < .05) { p.m.position.y = .05; p.vy *= -.3; p.vx *= .6; p.vz *= .6; }
    p.life -= dt; p.m.material.opacity = clamp(p.life / p.max * 1.5, 0, 1); if (p.life <= 0) scene.remove(p.m);
  }
  S.parts = S.parts.filter(p => p.life > 0);
  for (const f of S.effects) { f.life -= dt; f.upd(f, Math.max(0, f.life / f.max)); if (f.life <= 0) scene.remove(f.mesh); }
  S.effects = S.effects.filter(f => f.life > 0);
  if (S.bannerT > 0) { S.bannerT -= dt; if (S.bannerT <= 0) $('banner').style.opacity = 0; }
  revealAround(hero.x, hero.z, 5.5);
  WB.cutT -= dt; if (WB.cutT <= 0) { WB.cutT = .1; cutaway(); }
  if (S.boonQ > 0) { S.boonQ -= dt; if (S.boonQ <= 0) offerBoon(); }
}

function updateEnemies(dt) {
  for (const e of S.enemies) {
    if (e.dead) continue;
    if (e.flashT > 0) { e.flashT -= dt; flashEnemy(e); }
    if (!e.active || hero.dead > 0) continue;
    if (e.swing > 0) e.swing = Math.max(0, e.swing - dt * 3);
    if (e.buffT > 0) { e.buffT -= dt; if (e.buffT <= 0) e.buff = null; }
    if (e.stun > 0) { e.stun -= dt; continue; }
    if (e.dashT > 0) { e.dashT -= dt; const dx = e.dashX - e.x, dz = e.dashZ - e.z, dd = Math.hypot(dx, dz); if (dd > .6) step(e, dx / dd * Math.min(dd - .6, 11 * dt), dz / dd * Math.min(dd - .6, 11 * dt), .3); continue; }
    const d = Math.hypot(hero.x - e.x, hero.z - e.z);
    if (e.boss && e.stagger > 0) { e.stagger -= dt; if (e.stagger <= 0) { e.shield = e.shieldMax; banner('SHIELD RESTORED', '#6fd3ff', 'Crits break it fastest'); } continue; }
    if (S.curTell && S.curTell.e === e && S.curTell.kind !== 'hold') { e.face = Math.atan2(hero.x - e.x, hero.z - e.z); continue; }
    if (e.tells) {
      e.tellCd -= dt;
      if (!S.curTell && e.tellCd <= 0) { const act = e.tells.find(a => ACTS[a].cond(e, d) && (a !== 'fuse' || e.tellCd > -50)); if (act) { startTell(e, act); continue; } }
    }
    const fr = e.buff === 'frenzy', ex = e.buff === 'exhausted';
    if (e.role === 'ranged') {
      if (d < 3.2) { const k = e.speed * dt / (d || 1); step(e, (e.x - hero.x) * k, (e.z - hero.z) * k); e.walkT += dt * 5; e.face = Math.atan2(hero.x - e.x, hero.z - e.z); }
      else if (d > 6 || !los(e.x, e.z, hero.x, hero.z)) moveTo(e, hero.x, hero.z, e.speed, dt);
      else {
        e.face = Math.atan2(hero.x - e.x, hero.z - e.z); e.shootT -= dt;
        if (e.shootT <= 0) { e.shootT = e.cd; e.swing = 1; shoot(e); }
      }
    } else if (d > e.range + .1) moveTo(e, hero.x, hero.z, e.speed * (fr ? 1.4 : 1) * (ex ? .6 : 1), dt);
    else { e.face = Math.atan2(hero.x - e.x, hero.z - e.z); e.atkT -= dt; if (e.atkT <= 0) { e.atkT = e.cd * (fr ? .45 : 1) * (ex ? 1.6 : 1); e.swing = 1; hurtHero(e.dmg * floorScale() * (fr ? 1.3 : 1)); } }
    // separation
    for (const o of S.enemies) if (o !== e && !o.dead) { const dx = e.x - o.x, dz = e.z - o.z, dd = Math.hypot(dx, dz), m = e.r + o.r; if (dd < m && dd > .01) step(e, dx / dd * (m - dd) * .5, dz / dd * (m - dd) * .5); }
  }
  S.enemies = S.enemies.filter(e => !e.dead);
}

function flashEnemy(e) { for (const m of e.mats) if (m.emissive) m.emissive.setHex(e.flashT > 0 ? 0x884444 : m.userData.e); }

export function enterRoom(r) {
  r.entered = true; revealRoom(r); r.marker.visible = true;
  if (!r.populated) { r.populated = true; populate(r); }
  const es = S.enemies.filter(e => !e.dead && e.room === r);
  es.forEach(e => e.active = true);
  if (r.type === 'boss' && es.length) banner('THE WARDEN', '#ff4fd8', 'Crits crack its shield · ease off to brace slams');
  else if (r.type === 'elite' && es.length) banner('ELITE LAIR', '#ffd23f', 'Sweet spot builds Strength');
  else if (r.type === 'treasure') banner('TREASURE VAULT', '#5fe39a', 'Spin 100+ rpm to pick the lock');
  else if (r.type === 'campfire') banner('CAMPFIRE', '#ff8a4a', 'Easy spinning heals faster');
}
