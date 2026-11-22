import './style.css';
import { G, P, S } from './core/state.js';
import { $ } from './core/util.js';
import { audio, toggleMute } from './core/audio.js';
import { scene, cam, CAM, resize } from './render/scene.js';
import * as T from 'three';
import { buildModel } from './render/models.js';
import { chars, loadCharacters, makeChar } from './render/characters.js';
import { glowSprite } from './render/assets.js';
import { Q, applyQuality, cycleQuality, cycleStyle } from './render/post.js';
import { STYLES } from './data/graphics.js';
import { updFx } from './render/fx.js';
import { draw } from './render/draw.js';
import { buildMap } from './world/map.js';
import { loadDungeon } from './world/dungeon.js';
import { ctl } from './input/input.js';
import { pollInput, initDevices } from './input/devices.js';
import { ride, initRide, setRide, storedRide, pollRide } from './input/ridesim.js';
import { update, effortMods } from './game/update.js';
import { autopilotRanges } from './game/autopilot.js';
import { initSurge } from './game/surge.js';
import { SK } from './data/skills.js';
import { recalc } from './game/stats.js';
import { newLevel, levelGoal, currentBeat, startBeat } from './game/level.js';
import { LEVEL } from './data/levels.js';
import { save, load } from './game/save.js';
import { initCharacter } from './game/character.js';
import { startRun } from './game/waypoint.js';
import { dbg } from './core/dbg.js';
import { kill, hit, hurtP } from './game/combat.js';
import { castSlot, castFireball, castNova, castWard, castBlink, mainTarget, mainRange, endWard } from './game/skills.js';
import { spawnEnemy } from './game/enemies.js';
import { blocked, los } from './world/map.js';
import { dropItem } from './game/items.js';
import { SLOT_ORDER } from './data/gems.js';
import { gainAP, gemBase, gemHas } from './game/gems.js';
import { hud } from './ui/hud.js';
import { initGemBag, toggleGems } from './ui/gembag.js';
import { initPanels, syncPause, openInv, openPass, toggleInv, togglePass, closeAll, equip } from './ui/panels.js';

// Fresh skill state: no cooldowns, no ward (the gems and bar come from initCharacter).
function resetSkills() { endWard(); P.cd = Object.fromEntries(SLOT_ORDER.map(k => [k, 0])); }

// Start (fresh) or continue a character: restore it (game/character.js), then enter the world (game/waypoint.js).
function begin(fresh) {
  audio(); resetSkills(); initSurge(ride.ftp);
  const sv = fresh ? null : load();
  initCharacter(sv); recalc(); startRun(sv);
  G.started = true; $('mMenu').classList.remove('show'); syncPause();
}

// ---- boot ----
// Primitive hero until the KayKit models arrive (or if they fail to load).
G.heroM = buildModel({ col: 0x2a3a6a, head: 0xd9b08c, eye: 0x1a1a1a, h: 1.8 }, { staff: 1, hood: 1 }); scene.add(G.heroM.g);
function rigHero() {
  const M = makeChar('hero', 1.95);
  // A glowing orb on the staff tip (blooms nicely). The staff ships inside the mage model.
  M.g.traverse(o => {
    if (o.name !== '2H_Staff' || !o.isMesh || M.orb) return;
    o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox, sz = new T.Vector3(); b.getSize(sz);
    const tip = new T.Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    const ax = sz.x > sz.y && sz.x > sz.z ? 'x' : sz.y > sz.z ? 'y' : 'z'; tip[ax] = b.max[ax];
    M.orb = glowSprite(0x7fd8ff, .55); M.orb.position.copy(tip); M.orb.scale.setScalar(.55); o.add(M.orb);
    M.orb.scale.divideScalar(o.getWorldScale(new T.Vector3()).x || 1);
  });
  scene.remove(G.heroM.g); G.heroM = M; scene.add(M.g);
}
const menuBtns = ['goNew', 'goCont'].map($);
menuBtns.forEach(b => { b.disabled = true; b.dataset.label = b.textContent; b.textContent = 'LOADING…'; });
Promise.all([loadCharacters(), loadDungeon()]).then(([ok]) => {
  if (ok) rigHero();
  if (!G.started) buildMap(); // swap the placeholder map behind the menu for the dungeon
  applyQuality();
  menuBtns.forEach(b => { b.disabled = false; b.textContent = b.dataset.label; });
  G.loaded = true;
});
$('bFx').textContent = 'FX: ' + Q.level.toUpperCase();
$('bFx').onclick = () => { $('bFx').textContent = 'FX: ' + cycleQuality().toUpperCase(); };
$('bLook').textContent = 'LOOK: ' + STYLES[Q.style].name.toUpperCase();
$('bLook').onclick = () => { $('bLook').textContent = 'LOOK: ' + cycleStyle().toUpperCase(); };
recalc(); resize(); buildMap(); P.x = G.start.x; P.z = G.start.z; cam.position.set(P.x + CAM.x, CAM.y, P.z + CAM.z);
initPanels(); initGemBag();
initDevices({ toggleInv, togglePass, toggleGems, closeAll });
initRide(); setRide(storedRide());
const modeLabel = () => { $('bMode').textContent = ride.on ? 'MODE: RIDE' : 'MODE: KEYS'; $('bMode').classList.toggle('glow', ride.on); };
modeLabel(); $('bMode').onclick = () => { setRide(!ride.on); modeLabel(); };
$('bMute').onclick = () => { audio(); $('bMute').style.opacity = toggleMute() ? .4 : 1; };
$('bMenu').onclick = () => { $('mMenu').classList.add('show'); $('goCont').style.display = ''; $('goCont').textContent = 'RESUME'; syncPause(); };
$('goNew').onclick = () => begin(true);
$('goCont').onclick = () => { if (G.started && $('goCont').textContent === 'RESUME') { $('mMenu').classList.remove('show'); syncPause(); } else begin(false); };
const sv = load(); if (sv) { $('goCont').style.display = ''; $('goCont').dataset.label = `CONTINUE · LV ${sv.lvl} · ${LEVEL.name.toUpperCase()} · ${sv.clears ?? Math.max(0, (sv.tier || 1) - 1)} CLEARED`; if (!$('goCont').disabled) $('goCont').textContent = $('goCont').dataset.label; }

let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; // never negative: the first rAF timestamp can predate script start
  pollInput(dt);
  if (!G.paused) { if (G.hitStop > 0) G.hitStop -= dt; else update(dt); }
  updFx(G.paused ? 0 : dt); draw(dt); hud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testing hooks (used by tests/sim.mjs and handy in the console).
window.__dbg = Object.assign(dbg, {
  G, P, S, SK, ctl, Q, chars, ride, setRide, effortMods, pollRide, autopilotRanges, surge: () => P.surge,
  ready: () => (chars.ready || chars.failed) && G.loaded, cycleQuality, cycleStyle,
  start: fresh => begin(fresh !== false), hurt: d => hurtP(d), hud: () => { hud(.1); hud(.1); },
  sim: n => { for (let i = 0; i < n; i++) { update(.033); updFx(.033); } },
  enemies: () => G.enemies, packs: () => G.packs, items: () => G.ground,
  newLevel, level: () => G.level, levelGoal, beat: currentBeat, startBeat, hit, kill, save, dropItem, spawnEnemy, blocked, los, recalc, hurtP, castSlot, castFireball, castNova, castWard, castBlink, mainTarget, mainRange, gainAP, gems: () => P.gems, gemBase, gemHas, openInv, openPass, equip,
});
