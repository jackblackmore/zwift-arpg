import './style.css';
import { G, P, S } from './core/state.js';
import { $ } from './core/util.js';
import { audio, toggleMute } from './core/audio.js';
import { scene, cam, CAM, resize } from './render/scene.js';
import { buildModel } from './render/models.js';
import { chars, loadCharacters, makeChar } from './render/characters.js';
import { Q, applyQuality, cycleQuality, cycleStyle } from './render/post.js';
import { STYLES, TELL } from './data/graphics.js';
import { updFx } from './render/fx.js';
import { draw, snapCam } from './render/draw.js';
import { buildMap, blocked, los } from './world/map.js';
import { spawnEnemy } from './game/enemies.js';
import { loadDungeon, dun } from './world/dungeon.js';
import { ctl } from './input/input.js';
import { pollInput, initDevices } from './input/devices.js';
import { ride, initRide, setRide, storedRide } from './input/ridesim.js';
import { update } from './game/update.js';
import { recalc } from './game/stats.js';
import { newMap } from './game/maps.js';
import { save, load } from './game/save.js';
// Dev: ?seed=N plays the level layouts the map viewer (/maps/) shows for that seed.
try { G.devSeed = parseInt(new URLSearchParams(location.search).get('seed'), 10) || 0; } catch (e) {}
import { TREE } from './data/tree.js';
import { SK } from './data/skills.js';
import { STAGGER, BOSS, GUARDIANS, RARE } from './data/monsters.js';
import { LEVELS, POOLS } from './data/dungeon.js';
import { poolAt } from './game/pools.js';
import { steer, startAbility } from './game/enemies.js';
import { autopilot } from './game/autopilot.js';
import { levelOf } from './game/formulas.js';
import { START_WEAPON, parLevel, parBar, PAR_GEAR } from './data/balance.js';
import { arena } from './game/arena.js';
import { levelRun } from './game/levelrun.js';
import { kill, hurtP, hit, processQueue } from './game/combat.js';
import { UNIQ } from './data/items.js';
import { castArc, castNova, castDash, aim } from './game/skills.js';
import { frostRings } from './game/sk/arts.js';
import { strike, targets } from './game/sk/strike.js';
import { dropItem, dropGem, pickUp, rollItem } from './game/items.js';
import * as skel from './game/sk/skeletons.js';
import { hud } from './ui/hud.js';
import { isUpgrade } from './ui/panels.js';
import { initPanels, syncPause, openInv, openPass, toggleInv, togglePass, toggleGems, openGems, openShrine, closeAll, equip } from './ui/panels.js';
import { CAST } from './game/casts.js';
import { xpNeedFor, hitTaken } from './game/formulas.js';
import { routeTarget, resetRoute, options as routeOptions } from './game/route.js';
import { gateFoe } from './game/gate.js';
import { freshGems, readySlots, takeShrine, shrineDue, refreshShrine, placeGem, addGem, socketGem, unsocket, feedGem, feedPreview, sockCount, autoTarget, meleeReach } from './game/gems.js';
import { GEMS, SUPPORTS } from './data/gems.js';
import { setAutoAtk } from './input/devices.js';
import * as treeApi from './game/tree.js';
import { blockStats } from './game/sk/guard.js';

function begin(fresh) {
  audio();
  const sv = load();
  if (fresh || !sv) {
    Object.assign(P, { lvl: 1, xp: 0, gear: {}, inv: [], tree: [], treeNew: [], newItems: 0, kills: 0 });
    P.gear.weapon = { ...START_WEAPON, id: G.itemId++, mods: START_WEAPON.mods.map(m => [...m]) };
    freshGems(); newMap(1); save();
  } else {
    Object.assign(P, { lvl: sv.lvl, xp: sv.xp, gear: sv.gear || {}, inv: sv.inv || [], tree: sv.tree || [], treeNew: [], newGems: 0 });
    G.itemId = sv.itemId || 100;
    Object.assign(P, { gems: sv.gems || [], bar: sv.bar || {}, sock: sv.sock || {}, cd: {}, shrined: sv.shrined || {} });
    recalc(); readySlots();
    newMap(sv.tier || 1);
  }
  G.started = true; $('mMenu').classList.remove('show'); syncPause();
}

// ---- boot ----
// Primitive hero until the KayKit models arrive (or if they fail to load).
G.heroM = buildModel({ col: 0x6a7a8a, head: 0xd9b08c, eye: 0x1a1a1a, h: 1.8 }, { sword: 1, shield: 1 }); scene.add(G.heroM.g);
// The knight (sword and round shield ship inside the model, see scripts/prep-models.mjs).
function rigHero() { const M = makeChar('hero', 1.95); scene.remove(G.heroM.g); G.heroM = M; scene.add(M.g); }
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
  G, P, S, SK, STAGGER, BOSS, GUARDIANS, LEVELS, POOLS, levelOf, poolAt, steer, autopilot, bossDo: (e, key) => startAbility(e, key, e.gd.abil[key] || e.gd.channel[key]), RARE, TELL, rollItem, ctl, Q, chars, dun, ride, setRide, scene,
  ready: () => (chars.ready || chars.failed) && G.loaded, cycleQuality, cycleStyle,
  start: fresh => begin(fresh !== false),
  sim: n => { for (let i = 0; i < n; i++) { update(.033); updFx(.033); } },
  enemies: () => G.enemies, packs: () => G.packs, items: () => G.ground,
  arena, levelRun, parLevel, parBar, parGear: PAR_GEAR, newMap, kill, dropItem, strike, targets, aim, autoTarget, meleeReach, setAutoAtk, castArc, castNova, castDash, openInv, openPass, openGems, openShrine, equip,
  xpNeedFor, routeTarget, resetRoute, routeOptions, gateFoe, takeShrine, shrineDue, placeGem, addGem, socketGem, unsocket, feedGem, feedPreview, sockCount, dropGem, pickUp, TREE, tree: treeApi, blockStats, GEMS, SUPPORTS, recalc, save, load, begin, CAST, blocked, los, snapCam, spawnEnemy, hurtP, hitTaken, cast: id => CAST[id] ? CAST[id]() : false, frostRings, UNIQ, isUpgrade, hit, processQueue,
  skel, minions: () => G.minions, // Raise Skeletons support: skel.raise(x, z, gem), skel.cap(), skel.living()
};
