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
import { buildMap, blocked } from './world/map.js';
import { spawnEnemy } from './game/enemies.js';
import { loadDungeon } from './world/dungeon.js';
import { ctl } from './input/input.js';
import { pollInput, initDevices } from './input/devices.js';
import { ride, initRide, setRide, storedRide } from './input/ridesim.js';
import { update } from './game/update.js';
import { recalc } from './game/stats.js';
import { newMap } from './game/maps.js';
import { save, load } from './game/save.js';
import { PASS } from './data/passives.js';
import { START_WEAPON, parLevel, parBar, PAR_GEAR } from './data/balance.js';
import { arena } from './game/arena.js';
import { kill, hurtP } from './game/combat.js';
import { castFireball, castArc, castNova, castDash, castShield } from './game/skills.js';
import { dropItem } from './game/items.js';
import { hud } from './ui/hud.js';
import { initPanels, syncPause, openInv, openPass, toggleInv, togglePass, toggleGems, openGems, openShrine, closeAll, equip } from './ui/panels.js';
import { freshGems, readySlots, takeShrine, shrineDue, refreshShrine, placeGem, addGem } from './game/gems.js';
import { CAST } from './game/casts.js';
import { GEMS, SLOT_DEFS } from './data/gems.js';

function begin(fresh) {
  audio();
  const sv = load();
  if (fresh || !sv) {
    Object.assign(P, { lvl: 1, xp: 0, gear: {}, inv: [], passives: {}, pts: 0, offer: null, newItems: 0, kills: 0 });
    P.gear.weapon = { ...START_WEAPON, id: G.itemId++, mods: START_WEAPON.mods.map(m => [...m]) };
    freshGems(); newMap(1); save();
  } else {
    Object.assign(P, { lvl: sv.lvl, xp: sv.xp, gear: sv.gear || {}, inv: sv.inv || [], passives: Object.fromEntries(Object.entries(sv.passives || {}).filter(([k]) => PASS[k])), pts: sv.pts || 0, offer: null });
    G.itemId = sv.itemId || 100;
    // Saves from before gems have none: treat them as a fresh character for gems (the Main shrine is offered now).
    if (Array.isArray(sv.gems) && sv.gems.length) {
      Object.assign(P, { gems: sv.gems.filter(g => GEMS[g.gem]), bar: {}, cd: {}, shrined: sv.shrined || {} });
      if (!P.gems.some(g => g.gem === 'ward')) delete P.shrined.guard; // saves from before the Frost Ward shrine
      for (const s in sv.bar || {}) if (SLOT_DEFS[s] && P.gems.some(g => g.id === sv.bar[s])) P.bar[s] = sv.bar[s];
      recalc(); readySlots();
    } else freshGems();
    newMap(sv.tier || 1);
  }
  G.started = true; $('mMenu').classList.remove('show'); syncPause();
  if (shrineDue().includes('main')) openShrine('main');
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
initPanels();
initDevices({ toggleInv, togglePass, toggleGems, closeAll });
initRide(); setRide(storedRide());
const modeLabel = () => { $('bMode').textContent = ride.on ? 'MODE: RIDE' : 'MODE: KEYS'; $('bMode').classList.toggle('glow', ride.on); };
modeLabel(); $('bMode').onclick = () => { setRide(!ride.on); modeLabel(); };
$('bMute').onclick = () => { audio(); $('bMute').style.opacity = toggleMute() ? .4 : 1; };
$('bMenu').onclick = () => { $('mMenu').classList.add('show'); $('goCont').style.display = ''; $('goCont').textContent = 'RESUME'; syncPause(); };
$('goNew').onclick = () => begin(true);
$('goCont').onclick = () => { if (G.started && $('goCont').textContent === 'RESUME') { $('mMenu').classList.remove('show'); syncPause(); } else begin(false); };
const sv = load(); if (sv) { $('goCont').style.display = ''; $('goCont').dataset.label = `CONTINUE · LV ${sv.lvl} · MAP ${sv.tier}`; if (!$('goCont').disabled) $('goCont').textContent = $('goCont').dataset.label; }

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  pollInput(dt);
  if (!G.paused) { if (G.hitStop > 0) G.hitStop -= dt; else update(dt); }
  if (G.shrineAsk) { const s = G.shrineAsk; G.shrineAsk = null; openShrine(s); }
  updFx(G.paused ? 0 : dt); draw(dt); hud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testing hooks (used by tests/sim.mjs and handy in the console).
// Build stamp on the home screen (set by vite.config.js; shown in local time).
{ const B = __BUILD__, d = new Date(B.date);
  $('build').textContent = `v${B.version}${B.commit ? ' · ' + B.commit : ''} · built ${d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`; }

window.__dbg = {
  G, P, S, ctl, Q, chars, ride, setRide, scene,
  ready: () => (chars.ready || chars.failed) && G.loaded, cycleQuality, cycleStyle,
  start: fresh => begin(fresh !== false),
  sim: n => { for (let i = 0; i < n; i++) { update(.033); updFx(.033); } },
  enemies: () => G.enemies, packs: () => G.packs, items: () => G.ground,
  arena, parLevel, parBar, parGear: PAR_GEAR, newMap, kill, dropItem, castFireball, castArc, castNova, castDash, castShield, openInv, openPass, openGems, openShrine, equip,
  takeShrine, shrineDue, placeGem, addGem, recalc, save, load, begin, CAST, blocked, spawnEnemy, hurtP,
};
