import * as T from 'three';
import { S, hero } from '../core/state.js';
import { $, rand } from '../core/util.js';
import { ELEM, elemOf } from '../data/combat.js';
import { renderer, scene, cam, CAMOFF, torch } from './scene.js';
import { toScreen } from './fx.js';
import { M, idx } from '../world/map.js';
import { WB } from '../world/build.js';
import { rel } from '../game/stats.js';

function animHumanoid(m, ent, moving, swing) {
  const w = moving ? Math.sin(ent.walkT) : 0;
  m.legL.rotation.x = w * .6; m.legR.rotation.x = -w * .6;
  m.armL.rotation.x = -w * .4;
  m.armR.rotation.x = swing > 0 ? -2.3 + (1 - swing) * 3.0 : w * .4;
  m.g.position.y = moving ? Math.abs(Math.cos(ent.walkT)) * .05 : 0;
}

const lastPos = new Map();
export function draw(dt) {
  const { time } = S, { revealed, rooms } = M;
  // hero
  const hm = S.heroModel;
  hm.g.visible = hero.dead <= 0;
  const hp = lastPos.get(hero) || [hero.x, hero.z], moved = Math.hypot(hero.x - hp[0], hero.z - hp[1]) > .001; lastPos.set(hero, [hero.x, hero.z]);
  hm.g.position.x = hero.x; hm.g.position.z = hero.z;
  hm.g.rotation.y += ((hero.face - hm.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 12);
  animHumanoid(hm, hero, moved, hero.swing);
  const zc = new T.Color(ELEM[elemOf(rel())].col);
  hm.blade.material.emissive.copy(zc).multiplyScalar(.9);
  torch.position.set(hero.x, 2.3, hero.z);
  // enemies
  for (const e of S.enemies) {
    const m = e.model, lp = lastPos.get(e) || [e.x, e.z], mv = Math.hypot(e.x - lp[0], e.z - lp[1]) > .001; lastPos.set(e, [e.x, e.z]);
    m.g.position.x = e.x; m.g.position.z = e.z;
    m.g.rotation.y += ((e.face - m.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 8);
    if (e.type === 'bat') { const f = Math.sin(time * 22 + e.sx) * .7; m.wingL.rotation.z = f; m.wingR.rotation.z = -f; m.g.position.y = Math.sin(time * 4 + e.sz) * .12; }
    else if (e.type === 'slime') { const s = 1 + Math.sin(time * 6 + e.sx) * .08; m.body.scale.set(1 / s, s, 1 / s); m.g.position.y = mv ? Math.abs(Math.sin(e.walkT)) * .15 : 0; }
    else animHumanoid(m, e, mv, e.swing);
    if ((e.boss && e.stagger > 0) || e.stun > 0) m.g.rotation.z = Math.sin(time * 10) * .08; else m.g.rotation.z = 0;
    if (e.buff === 'frenzy' && !e.flashT) for (const mt of e.mats) if (mt.emissive) mt.emissive.setHex(Math.sin(time * 12) > 0 ? 0x661010 : mt.userData.e);
    if (S.curTell && S.curTell.e === e && Math.sin(time * 18) > 0) for (const mt of e.mats) if (mt.emissive) mt.emissive.setHex(0x443344);
    const on = e.active && revealed[idx(Math.round(e.x), Math.round(e.z))];
    m.g.visible = !!revealed[idx(Math.round(e.x), Math.round(e.z))];
    if (on) {
      const [sx, sy] = toScreen(e.x, e.boss ? 4.4 : (e.elite ? 2.6 : e.type === 'bat' ? 1.5 : 1.85), e.z);
      e.bar.style.display = ''; e.bar.style.left = sx + 'px'; e.bar.style.top = sy + 'px';
      const bs = e.bar.querySelectorAll('i');
      if (e.boss) { bs[0].style.width = (e.stagger > 0 ? 0 : e.shield / e.shieldMax * 100) + '%'; bs[1].style.width = (e.hp / e.maxHp * 100) + '%'; }
      else bs[0].style.width = (e.hp / e.maxHp * 100) + '%';
    } else e.bar.style.display = 'none';
  }
  // props
  for (const r of rooms) {
    const rv = !!revealed[idx(r.cx, r.cy)];
    if (r.chest) r.chest.g.visible = rv;
    if (r.fire) r.fire.g.visible = rv;
    if (r.fire) { const f = 1 + Math.sin(time * 13 + r.cx) * .12 + Math.sin(time * 7) * .08; r.fire.fl.scale.set(1, f, 1); r.fire.fl2.scale.set(1, 2 - f, 1); }
    if (r.entered && !r.done && r.populated && r.type !== 'treasure' && r.type !== 'campfire') r.marker.visible = !S.enemies.some(e => e.room === r && e.active && !e.dead);
    else if (r.entered || (S.choices && S.choices.some(c => c.r === r))) r.marker.visible = true;
    if (r.marker.visible) r.marker.position.y = 2.4 + Math.sin(time * 2 + r.cx) * .1;
  }
  for (const p of WB.props) p.m.visible = !!revealed[idx(p.x, p.y)];
  WB.torches.forEach((t, i) => { const f = 1 + Math.sin(time * 15 + i * 2) * .15; t.scale.set(1, f, 1); });
  S.campLights.forEach((L, i) => L.intensity = revealed[idx(Math.round(L.position.x), Math.round(L.position.z))] ? 1.3 + Math.sin(time * 11 + i) * .2 : 0);
  if (S.stairs) S.stairs.children[1].scale.setScalar(1 + Math.sin(time * 4) * .06);
  // choice tags
  const tags = $('tags'); tags.innerHTML = '';
  if (S.choices) S.choices.forEach((c, i) => { const [sx, sy] = toScreen(c.r.cx, 3.3, c.r.cy); const d = document.createElement('div'); d.innerHTML = `<div class="tag">${i + 1}</div>`; d.style.left = sx + 'px'; d.style.top = sy + 'px'; tags.appendChild(d); });
  // floating text
  for (const f of S.floats) { f.life -= dt; f.y += dt * 1.1; const [sx, sy] = toScreen(f.x, f.y, f.z); f.d.style.left = sx + 'px'; f.d.style.top = sy + 'px'; f.d.style.opacity = Math.min(1, f.life / f.max * 2); if (f.life <= 0) f.d.remove(); }
  S.floats = S.floats.filter(f => f.life > 0);
  // camera
  const tx = hero.x + CAMOFF.x, tz = hero.z + CAMOFF.z;
  cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 5); cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 5); cam.position.y = CAMOFF.y;
  cam.lookAt(cam.position.x - CAMOFF.x, 0, cam.position.z - CAMOFF.z);
  if (S.shakeAmt > .01) { cam.position.x += rand(-S.shakeAmt, S.shakeAmt) * .4; cam.position.z += rand(-S.shakeAmt, S.shakeAmt) * .4; S.shakeAmt *= Math.exp(-9 * dt); }
  renderer.render(scene, cam);
}
