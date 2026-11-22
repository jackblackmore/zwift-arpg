// Per-frame drawing: hero animation, camera, and the 2D overlay (bars, rare names, loot labels, numbers).
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { RAREAFF } from '../data/monsters.js';
import { RCSS } from '../data/items.js';
import { rand, $ } from '../core/util.js';
import { cam, CAM, V, plight, blight, ctx } from './scene.js';
import { render } from './post.js';
import { glows, emit } from './fx.js';
import { joy } from '../input/devices.js';
import { levelLight } from '../game/level.js';

const TV = new T.Vector3();
function toScreen(x, y, z) { TV.set(x, y, z).project(cam); return TV.z > 1 ? null : [(TV.x + 1) / 2 * V.W, (1 - TV.y) / 2 * V.H]; }

// Hero clips: a cast plays once (fast) and hands back to run/idle; death holds until respawn.
const HERO = { shoot: ['Ranged_Magic_Shoot', 2], arc: ['Ranged_Magic_Spellcasting', 1.6], nova: ['Ranged_Magic_Raise', 3.2], dash: ['Dodge_Forward', 1.4] };
function animHero(M, dt) {
  M.lock = (M.lock || 0) - dt;
  if (P.dead > 0) { if (M.cur !== 'Death_A') M.play('Death_A', { once: true, fade: .1 }); }
  else if (P.castSeq !== M.seq) { M.seq = P.castSeq; const [n, sp] = HERO[P.lastCast] || HERO.shoot; M.lock = M.play(n, { once: true, speed: sp, fade: .06 }) / sp * .7; }
  else if (M.lock <= 0) { if (P.moving) M.play('Running_A', { speed: S.ms * ((P.eff && P.eff.move) || 1) / 5 }); else M.play('Idle'); }
  M.mixer.update(dt);
}

export function draw(dt) {
  const { W, H } = V, gt = G.gt;
  // hero
  const M = G.heroM; M.g.visible = P.dead <= 0; M.g.position.set(P.x, P.moving ? Math.abs(Math.cos(P.walkT)) * .05 : 0, P.z);
  const dr = ((P.face - M.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; M.g.rotation.y += dr * Math.min(1, dt * 16);
  if (M.rigged) animHero(M, G.paused ? 0 : dt);
  else { const w = P.moving ? Math.sin(P.walkT) : 0; M.legL.rotation.x = w * .7; M.legR.rotation.x = -w * .7; M.armL.rotation.x = -w * .5; M.armR.rotation.x = P.castAnim > 0 ? -1.5 : w * .4; }
  if (M.orb) M.orb.scale.setScalar(.55 + (P.castAnim > 0 ? .4 : 0) + Math.sin(gt * 5) * .05);
  plight.position.set(P.x, 3, P.z);
  G.torches.forEach((t, i) => { const f = (t.s || 1.4) * (1 + Math.sin(gt * 11 + i) * .11 + Math.sin(gt * 23 + i * 3) * .06); t.f.scale.set(f, f * 1.15, 1); });
  if (G.portal) {
    const pt = G.portal; pt.tor.rotation.y += dt * 1.5;
    if (Math.random() < .5) emit(glows, pt.x + rand(-1, 1), rand(.3, 2.3), pt.z + rand(-.3, .3), 0, rand(.5, 1.5), 0, .6, 0xb06bff);
  }
  const lt = levelLight(); // the one story light: portal, awake guardian, else the next beat
  if (lt) { blight.position.set(lt.x, lt.y, lt.z); blight.color.setHex(lt.col); blight.intensity = lt.i ? lt.i + Math.sin(gt * 4) * .25 : 0; } else blight.intensity = 0;
  for (const d of G.ground) if (d.g.children[1]) d.g.children[1].material.opacity = (d.it.rar === 3 ? .45 : .25) + Math.sin(gt * 3) * .08;
  // camera
  const k = V.camMul, cx = P.x + CAM.x * k, cz = P.z + CAM.z * k;
  cam.position.x += (cx - cam.position.x) * Math.min(1, dt * 6); cam.position.z += (cz - cam.position.z) * Math.min(1, dt * 6); cam.position.y = CAM.y * k;
  cam.lookAt(cam.position.x - CAM.x * k, 0, cam.position.z - CAM.z * k);
  if (G.shakeA > .01) { cam.position.x += rand(-G.shakeA, G.shakeA) * .5; cam.position.y += rand(-G.shakeA, G.shakeA) * .5; G.shakeA *= Math.exp(-10 * dt); }
  render(P.x, P.z);

  // ---- overlay ----
  ctx.clearRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const e of G.enemies) {
    if (e.deathT || e.ai === 'boss' || !(e.hp < e.maxHp || e.rar)) continue;
    const s = toScreen(e.x, e.h + .25, e.z); if (!s || s[0] < -50 || s[0] > W + 50 || s[1] < -50 || s[1] > H + 50) continue;
    const bw = e.rar === 2 ? 60 : e.rar === 1 ? 38 : 28;
    ctx.fillStyle = '#000c'; ctx.fillRect(s[0] - bw / 2 - 1, s[1] - 1, bw + 2, 6);
    ctx.fillStyle = e.freeze > 0 ? '#7fd8ff' : '#c02020'; ctx.fillRect(s[0] - bw / 2, s[1], bw * Math.max(0, e.hp / e.maxHp), 4);
    if (e.rar === 2) {
      ctx.font = '800 13px Cinzel, serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText(e.name, s[0], s[1] - 18);
      ctx.font = '400 10px JetBrains Mono, monospace'; ctx.fillStyle = '#c8b070'; ctx.fillText(e.aff.map(a => RAREAFF[a]).join(' · '), s[0], s[1] - 7);
    }
  }
  // loot labels, stacked so they don't overlap; their rects are clickable (input/devices.js)
  G.labelRects = []; ctx.font = '700 11px JetBrains Mono, monospace';
  const labs = [];
  for (const d of G.ground) { if (!d.landed) continue; const s = toScreen(d.x, .3, d.z); if (s) labs.push([s, d]); }
  labs.sort((a, b) => a[0][1] - b[0][1]);
  const placed = [];
  for (const [s, d] of labs) {
    const tw = ctx.measureText(d.it.name).width + 12; const x = s[0] - tw / 2; let y = s[1] - 24;
    for (let k2 = 0; k2 < 6; k2++) { if (placed.some(r => x < r[0] + r[2] && x + tw > r[0] && y < r[1] + r[3] && y + 16 > r[1])) y -= 18; else break; }
    placed.push([x, y, tw, 16]); G.labelRects.push([x, y, tw, 16, d]);
    ctx.fillStyle = '#000000d0'; ctx.fillRect(x, y, tw, 16); ctx.strokeStyle = RCSS[d.it.rar]; ctx.lineWidth = d.it.rar >= 2 ? 1.5 : 1; ctx.strokeRect(x + .5, y + .5, tw - 1, 15);
    ctx.fillStyle = RCSS[d.it.rar]; ctx.fillText(d.it.name, x + tw / 2, y + 8.5);
  }
  for (const f of G.floats) {
    const s = toScreen(f.x, f.y, f.z); if (!s) continue;
    ctx.globalAlpha = Math.min(1, f.life / f.max * 2.2); ctx.font = `800 ${f.size}px Cinzel, serif`; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(f.txt, s[0], s[1]); ctx.fillStyle = f.col; ctx.fillText(f.txt, s[0], s[1]);
  }
  ctx.globalAlpha = 1;
  const J = $('joy');
  if (joy.on) { J.style.display = 'block'; J.style.left = joy.bx + 'px'; J.style.top = joy.by + 'px'; J.firstChild.style.transform = `translate(${joy.x * 32}px,${joy.y * 32}px)`; }
  else J.style.display = 'none';
}
