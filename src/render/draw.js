// Per-frame drawing: hero animation, camera, and the 2D overlay (bars, rare names, loot labels, numbers).
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { RAREAFF } from '../data/monsters.js';
import { RCSS } from '../data/items.js';
import { SK } from '../data/skills.js';
import { ROLES } from '../data/dungeon.js';
import { rand, $ } from '../core/util.js';
import { cam, CAM, V, plight, blight, ctx, scene } from './scene.js';
import { render } from './post.js';
import { glows, emit } from './fx.js';
import { joy } from '../input/devices.js';

const TV = new T.Vector3();
function toScreen(x, y, z) { TV.set(x, y, z).project(cam); return TV.z > 1 ? null : [(TV.x + 1) / 2 * V.W, (1 - TV.y) / 2 * V.H]; }

// Hero clips: a swing or cast plays once (fast) and hands back to run/idle; death holds until respawn. [clip, speed]
const HERO = { sword: ['Melee_1H_Attack_Slice_Diagonal', 2.2], cleave: ['Melee_1H_Attack_Slice_Horizontal', 2.2], fstrike: ['Melee_1H_Attack_Stab', 2.4], slam: ['Melee_2H_Attack_Chop', 1.7], arc: ['Ranged_Magic_Spellcasting', 1.6], nova: ['Ranged_Magic_Raise', 3.2], dash: ['Dodge_Forward', 1.4], shield: ['Ranged_Magic_Raise', 3.2], blink: ['Dodge_Forward', 2.2], ward: ['Ranged_Magic_Summon', 1.8], totem: ['Ranged_Magic_Summon', 1.8], meteor: ['Spellcast_Long', 1.8],
  // Fight mechanics (game/sk/guard.js, game/sk/roll.js). While the shield is up and nothing else plays, Melee_Blocking loops.
  block: ['Melee_Block', 3], blockhit: ['Melee_Block_Hit', 2.4], parry: ['Melee_Block_Attack', 2.6], broken: ['Hit_B', .9] };
const ROLL = { Forward: 'Dodge_Forward', Backward: 'Dodge_Backward', Left: 'Dodge_Left', Right: 'Dodge_Right' };
function animHero(M, dt) {
  M.lock = (M.lock || 0) - dt;
  if (P.dead > 0) { if (M.cur !== 'Death_A') M.play('Death_A', { once: true, fade: .1 }); }
  else if (P.castSeq !== M.seq) {
    M.seq = P.castSeq; const [n, sp] = P.lastCast === 'roll' ? [ROLL[P.rollDir], 2.4] : HERO[P.lastCast] || HERO.sword;
    M.lock = M.play(n, { once: true, speed: sp, fade: .06 }) / sp * (P.lastCast === 'broken' ? 1 : .7);
  }
  else if (M.lock <= 0) { if (P.blocking) M.play('Melee_Blocking', { fade: .08 }); else if (P.moving) M.play('Running_A', { speed: S.ms * ((P.eff && P.eff.move) || 1) / 5 }); else M.play('Idle'); }
  M.mixer.update(dt);
}

// Magic Shield's parry barrier (game/sk/arts.js): a bubble around the hero, fading as it's used up, flaring when a parry adds to it.
const bubble = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: 0x7fb8ff, transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false }));
bubble.scale.set(.95, 1.2, .95); scene.add(bubble);

export function draw(dt) {
  const { W, H } = V, gt = G.gt;
  // hero
  const M = G.heroM; M.g.visible = P.dead <= 0; M.g.position.set(P.x, P.moving ? Math.abs(Math.cos(P.walkT)) * .05 : 0, P.z);
  const dr = ((P.face - M.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; M.g.rotation.y += dr * Math.min(1, dt * 16);
  if (M.rigged) animHero(M, G.paused ? 0 : dt);
  else { const w = P.moving ? Math.sin(P.walkT) : 0; M.legL.rotation.x = w * .7; M.legR.rotation.x = -w * .7; M.armL.rotation.x = P.blocking ? -1.4 : -w * .5; M.armR.rotation.x = P.castAnim > 0 ? -1.5 : w * .4; }
  bubble.visible = P.shield > 0 && P.dead <= 0;
  if (P.barrierFx > 0) P.barrierFx -= dt;
  if (bubble.visible) {
    const f = Math.max(0, P.barrierFx || 0) * 2; bubble.position.set(P.x, 1, P.z); bubble.scale.set(.95 + f * .25, 1.2 + f * .3, .95 + f * .25);
    bubble.material.opacity = .1 + .2 * Math.min(1, P.shield / (S.maxLife * SK.shield.cap)) + Math.sin(gt * 8) * .03 + f * .25;
  }
  plight.position.set(P.x, 3, P.z);
  G.torches.forEach((t, i) => { const f = (t.s || 1.4) * (1 + Math.sin(gt * 11 + i) * .11 + Math.sin(gt * 23 + i * 3) * .06); t.f.scale.set(f, f * 1.15, 1); });
  const boss = G.bossSpec && G.bossSpec.e;
  if (G.portal) {
    const pt = G.portal; pt.tor.rotation.y += dt * 1.5; blight.position.set(pt.x, 2, pt.z); blight.intensity = 2 + Math.sin(gt * 4) * .5;
    if (Math.random() < .5) emit(glows, pt.x + rand(-1, 1), rand(.3, 2.3), pt.z + rand(-.3, .3), 0, rand(.5, 1.5), 0, .6, 0xb06bff);
  } else if (boss && !boss.deathT && boss.awake) { blight.position.set(boss.x, 4, boss.z); blight.intensity = 1.2; }
  else blight.intensity = 0;
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
    if (e.deathT || e.type === 'boss' || !(e.hp < e.maxHp || e.rar)) continue;
    const s = toScreen(e.x, e.h + .25, e.z); if (!s || s[0] < -50 || s[0] > W + 50 || s[1] < -50 || s[1] > H + 50) continue;
    const bw = e.elite ? 84 : e.rar === 2 ? 60 : e.rar === 1 ? 38 : 28;
    ctx.fillStyle = '#000c'; ctx.fillRect(s[0] - bw / 2 - 1, s[1] - 1, bw + 2, 6);
    ctx.fillStyle = e.freeze > 0 ? '#7fd8ff' : '#c02020'; ctx.fillRect(s[0] - bw / 2, s[1], bw * Math.max(0, e.hp / e.maxHp), 4);
    if (e.stagMax) { // stagger bar (game/combat.js stagger): fills toward a stun; flashes while staggered
      ctx.fillStyle = '#000c'; ctx.fillRect(s[0] - bw / 2 - 1, s[1] + 5, bw + 2, 4);
      ctx.fillStyle = e.stun > 0 ? (Math.sin(G.gt * 20) > 0 ? '#fff' : '#ffb040') : '#ffb040'; ctx.fillRect(s[0] - bw / 2, s[1] + 6, bw * (e.stun > 0 ? 1 : e.stag), 2);
    }
    if (e.rar === 2) {
      ctx.font = `800 ${e.elite ? 15 : 13}px Cinzel, serif`; ctx.fillStyle = e.elite ? '#ff9a5a' : '#ffd23f'; ctx.fillText(e.elite ? '☠ ' + e.name : e.name, s[0], s[1] - 18);
      ctx.font = '400 10px JetBrains Mono, monospace'; ctx.fillStyle = '#c8b070'; ctx.fillText(e.aff.map(a => RAREAFF[a]).join(' · '), s[0], s[1] - 7);
    }
  }
  // Your posture (game/sk/guard.js): a bar over the hero while it isn't empty, red when nearly full, and while guard broken.
  if (P.dead <= 0 && (P.posture > .01 || P.broken > 0)) {
    const s = toScreen(P.x, 2.35, P.z);
    if (s) {
      const k = P.broken > 0 ? 1 : P.posture, w = 54;
      ctx.fillStyle = '#000c'; ctx.fillRect(s[0] - w / 2 - 1, s[1] - 1, w + 2, 6);
      ctx.fillStyle = P.broken > 0 ? (Math.sin(G.gt * 20) > 0 ? '#ff3030' : '#fff') : k > .7 ? '#ff5030' : '#e8d8a8'; ctx.fillRect(s[0] - w / 2 * k, s[1], w * k, 4); // fills from the middle out, Sekiro style
    }
  }
  for (const m of G.minions) { // minion life bars (green), only once hurt
    if (m.deathT || m.hp >= m.maxHp) continue;
    const s = toScreen(m.x, m.h + .2, m.z); if (!s) continue;
    ctx.fillStyle = '#000c'; ctx.fillRect(s[0] - 13, s[1] - 1, 26, 5); ctx.fillStyle = '#5ad890'; ctx.fillRect(s[0] - 12, s[1], 24 * Math.max(0, m.hp / m.maxHp), 3);
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
    ctx.fillStyle = '#000000d0'; ctx.fillRect(x, y, tw, 16); ctx.strokeStyle = d.it.col || RCSS[d.it.rar]; ctx.lineWidth = d.it.rar >= 2 ? 1.5 : 1; ctx.strokeRect(x + .5, y + .5, tw - 1, 15);
    ctx.fillStyle = d.it.col || RCSS[d.it.rar]; ctx.fillText(d.it.name, x + tw / 2, y + 8.5);
  }
  // Route choice (game/route.js): a sign at each exit's doorway (world/gen.js room.doors) saying what kind of room is behind it
  // (data/dungeon.js ROLES, in the role's colour; a cleared way greyed with a ✓), the chosen one in gold, and a countdown
  // while the autopilot waits. A doorway off screen keeps its sign at the screen edge, pointing the way.
  if (G.jn && P.dead <= 0) {
    const J = G.jn;
    const h = toScreen(P.x, 1, P.z);
    J.opts.forEach((o, i) => {
      if (!h) return;
      const d = o.door, top = toScreen(d.x, 2.6, d.z), foot = toScreen(d.x, 0, d.z); if (!top) return;
      let vx = top[0] - h[0], vy = top[1] - h[1]; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
      const arrow = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? '▶' : '◀') : (vy < 0 ? '▲' : '▼');
      const on = i === J.sel, txt = `${arrow} ${o.label}`; ctx.font = `800 ${on ? 15 : 13}px Cinzel, serif`;
      const ink = on ? '#ffd23f' : o.done ? '#7a746a' : (ROLES[o.role] || ROLES.combat).col; // a cleared way greyed; else the role's colour
      const w = ctx.measureText(txt).width + 18;
      const x = Math.max(4, Math.min(W - w - 4, top[0] - w / 2)), y = Math.max(150, Math.min(H - 150, top[1] - 30));
      // a gold mark on the threshold, and a line up to the sign
      if (foot && foot[0] > 0 && foot[0] < W && foot[1] > 0 && foot[1] < H) {
        ctx.strokeStyle = on ? '#ffd23fcc' : o.done ? '#7a746a55' : '#c8b89066'; ctx.lineWidth = on ? 2 : 1; ctx.beginPath(); ctx.moveTo(foot[0], foot[1]); ctx.lineTo(Math.max(x, Math.min(x + w, foot[0])), y + 26); ctx.stroke();
        ctx.fillStyle = on ? '#ffd23f' : o.done ? '#7a746a' : '#c8b890'; ctx.beginPath(); ctx.moveTo(foot[0], foot[1] - 6); ctx.lineTo(foot[0] + 8, foot[1]); ctx.lineTo(foot[0], foot[1] + 6); ctx.lineTo(foot[0] - 8, foot[1]); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = o.done && !on ? .7 : 1;
      ctx.fillStyle = on ? '#2a1f08ee' : '#000000b0'; ctx.fillRect(x, y, w, 26); ctx.strokeStyle = on ? '#ffd23f' : o.done ? '#4a463e' : '#6a5a40'; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(x + .5, y + .5, w - 1, 25);
      ctx.fillStyle = ink; ctx.fillText(txt, x + w / 2, y + 13.5); ctx.globalAlpha = 1;
    });
    const msg = J.mode === 'wait' ? `CHOOSE YOUR WAY · tap the D-pad · ${Math.ceil(J.t)}` : `${J.opts[J.sel].label.toUpperCase()}${J.picked ? '' : ' (default)'} · tap the D-pad to change`;
    ctx.font = '800 15px Cinzel, serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(msg, W / 2, 125); ctx.fillStyle = '#ffd23f'; ctx.fillText(msg, W / 2, 125);
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
