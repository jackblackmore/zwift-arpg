import { S } from '../core/state.js';
import { $, rand, pick } from '../core/util.js';
import { ELEM } from '../data/combat.js';
import { scene } from '../render/scene.js';
import { lam, box, sph, humanoid, slimeModel, batModel, collectMats } from '../render/models.js';
import { walk } from '../world/map.js';
import { floorScale } from './stats.js';

export const ETYPES = {
  skeleton: { hp: 32, dmg: 6, speed: 2.0, range: 1.25, cd: 1.3, r: .35, gold: 3, make: () => humanoid({ body: 0xd8d0b8, dark: 0xb8ae96, head: 0xe6dfcc, eyes: 0xff3020, weapon: 0x8a8a8a, weaponLen: .6 }) },
  slime:    { hp: 24, dmg: 4, speed: 1.7, range: 1.1, cd: 1.1, r: .4, gold: 2, make: () => slimeModel(0x3fbf4a) },
  imp:      { hp: 18, dmg: 3, speed: 3.3, range: 1.1, cd: .9, r: .3, gold: 3, tells: ['fuse'], label: 'Bomber', make: () => { const m = humanoid({ body: 0xb0302a, dark: 0x5a1612, head: 0xc8402c, eyes: 0xffd000, horns: 0x2a1a10, scale: .75 }); const f = sph(.1, lam(0xff6a00, 0xff4400)); f.position.y = 1.62; m.g.add(f); return m; } },
  archer:   { hp: 22, dmg: 5, speed: 2.0, range: 1.2, cd: 2.0, r: .33, gold: 4, role: 'ranged', bolt: 0xd8c890, make: () => humanoid({ body: 0x3a5a34, dark: 0x22301e, head: 0xe6dfcc, eyes: 0xff3020, weapon: 0x6a4a2a, weaponLen: .5 }) },
  healer:   { hp: 26, dmg: 3, speed: 1.8, range: 1.2, cd: 2.4, r: .33, gold: 6, role: 'ranged', bolt: 0x5fe39a, tells: ['heal'], label: 'Cultist', make: () => humanoid({ body: 0x4a2a6a, dark: 0x2a1640, head: 0x5fe39a, headE: 0x1a6a3a, eyes: 0xffffff }) },
  shield:   { hp: 48, dmg: 6, speed: 1.6, range: 1.25, cd: 1.5, r: .42, gold: 5, shielded: true, label: 'Shield bearer', make: () => { const m = humanoid({ body: 0x6a6a7a, dark: 0x3a3a48, head: 0xd8d0b8, eyes: 0xff3020, helm: true, weapon: 0x8a8a8a, weaponLen: .6 }); const sh = box(.1, .8, .6, lam(0x8a7a50, 0x1a1408)); sh.position.set(-.05, -.25, .12); m.armL.add(sh); return m; } },
  bat:      { hp: 9, dmg: 2, speed: 3.4, range: 1.0, cd: .8, r: .25, gold: 1, make: batModel },
  charger:  { hp: 60, dmg: 9, speed: 1.9, range: 1.3, cd: 1.6, r: .5, gold: 8, tells: ['charge'], label: 'Charger', make: () => humanoid({ body: 0x6a3a22, dark: 0x3a2014, head: 0x7a4a2a, eyes: 0xff6a00, horns: 0xd8d0b8, scale: 1.15 }) },
  brute:    { hp: 150, dmg: 12, speed: 1.6, range: 1.6, cd: 1.6, r: .55, gold: 15, elite: true, tells: ['slam', 'charge', 'enrage'], make: () => humanoid({ body: 0x6a5a3a, dark: 0x3a2e1e, head: 0x7a8a50, eyes: 0xffd23f, weapon: 0x5a5a5a, weaponLen: 1.1, helm: true, scale: 1.45 }) },
  boss:     { hp: 520, dmg: 11, speed: 1.4, range: 2.2, cd: 2.3, r: .9, gold: 80, boss: true, tells: ['slam', 'charge', 'summon'], make: () => humanoid({ body: 0x2a2236, dark: 0x16121e, head: 0x3a2e4a, eyes: 0xff2bd6, weapon: 0xff2bd6, weaponE: 0x6a0050, weaponLen: 1.4, helm: true, horns: 0x111111, shield: 0x3a2e4a, scale: 2.3 }) },
};

export function spawnEnemy(type, x, z, room) {
  const t = ETYPES[type], m = t.make(), fs = floorScale();
  const e = Object.assign({ type, x, z, sx: x, sz: z, room, hp: t.hp * fs, maxHp: t.hp * fs, atkT: rand(.3, 1), swing: 0, walkT: rand(0, 6), active: false, flashT: 0, path: null, repathT: 0, face: 0, stun: 0, buff: null, buffT: 0, dashT: 0, tellCd: rand(2, 4), shootT: rand(1, 2) }, t);
  if (t.boss || t.elite || Math.random() < .45) e.weak = pick(Object.keys(ELEM));
  e.model = m; e.mats = collectMats(m.g); m.g.position.set(x, 0, z); scene.add(m.g);
  if (t.boss) { e.shieldMax = 200 * fs; e.shield = e.shieldMax; e.slamT = 6; e.tele = 0; e.stagger = 0; }
  const bar = document.createElement('div');
  bar.innerHTML = (e.weak ? `<div class="wk" style="color:${ELEM[e.weak].col}">${ELEM[e.weak].icon}</div>` : '') + (t.boss ? '<div class="hpb sh"><i></i></div>' : '') + '<div class="hpb"><i></i></div>';
  if (t.boss) bar.querySelectorAll('.hpb').forEach(b => b.style.width = '90px');
  $('bars').appendChild(bar); e.bar = bar; bar.style.display = 'none';
  S.enemies.push(e); return e;
}

const PACKS = [['skeleton', 'skeleton', 'archer'], ['bat', 'bat', 'bat', 'bat', 'bat', 'skeleton'], ['shield', 'shield', 'healer'], ['imp', 'imp', 'skeleton', 'slime'],
  ['charger', 'bat', 'bat', 'bat'], ['skeleton', 'slime', 'slime', 'archer'], ['shield', 'archer', 'healer', 'skeleton'], ['charger', 'imp', 'archer']];

export function populate(r) {
  const cells = []; for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (walk(x, y)) cells.push([x, y]);
  const spot = () => cells.splice(Math.random() * cells.length | 0, 1)[0];
  const put = t => { if (!cells.length) return; const [x, y] = spot(); spawnEnemy(t, x, y, r); };
  if (r.type === 'combat') { const pk = pick(S.floorN > 1 ? PACKS : PACKS.slice(0, 6)); pk.forEach(put); if (S.floorN > 1) put(pick(['skeleton', 'bat', 'slime', 'archer'])); }
  if (r.type === 'elite') { put('brute'); pick([['healer', 'skeleton'], ['archer', 'bat', 'bat'], ['shield', 'imp']]).forEach(put); }
  if (r.type === 'boss') spawnEnemy('boss', r.cx + 1, r.cy, r);
}
