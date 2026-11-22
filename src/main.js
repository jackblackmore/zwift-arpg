import './style.css';
import { G, P, S } from './core/state.js';
import { $ } from './core/util.js';
import { audio, toggleMute } from './core/audio.js';
import { scene, cam, CAM, resize } from './render/scene.js';
import { buildModel } from './render/models.js';
import { updFx } from './render/fx.js';
import { draw } from './render/draw.js';
import { buildMap } from './world/map.js';
import { ctl } from './input/input.js';
import { pollInput, initDevices } from './input/devices.js';
import { update } from './game/update.js';
import { recalc } from './game/stats.js';
import { newMap } from './game/maps.js';
import { save, load } from './game/save.js';
import { kill } from './game/combat.js';
import { castFireball, castArc, castNova, castDash } from './game/skills.js';
import { dropItem } from './game/items.js';
import { hud } from './ui/hud.js';
import { initPanels, syncPause, openInv, openPass, toggleInv, togglePass, closeAll, equip } from './ui/panels.js';

function begin(fresh) {
  audio();
  const sv = load();
  if (fresh || !sv) {
    Object.assign(P, { lvl: 1, xp: 0, gear: {}, inv: [], passives: {}, pts: 0, offer: null, newItems: 0, kills: 0 });
    P.gear.weapon = { id: G.itemId++, slot: 'weapon', rar: 1, base: 'Ashwood Staff', name: 'Smouldering Ashwood Staff', il: 1, impl: 1, mods: [['spell', 5], ['fire', .12]] };
    recalc(); newMap(1); save();
  } else {
    Object.assign(P, { lvl: sv.lvl, xp: sv.xp, gear: sv.gear || {}, inv: sv.inv || [], passives: sv.passives || {}, pts: sv.pts || 0, offer: null });
    G.itemId = sv.itemId || 100; recalc(); newMap(sv.tier || 1);
  }
  G.started = true; $('mMenu').classList.remove('show'); syncPause();
}

// ---- boot ----
G.heroM = buildModel({ col: 0x2a3a6a, head: 0xd9b08c, eye: 0x1a1a1a, h: 1.8 }, { staff: 1, hood: 1 }); scene.add(G.heroM.g);
recalc(); resize(); buildMap(); P.x = G.start.x; P.z = G.start.z; cam.position.set(P.x + CAM.x, CAM.y, P.z + CAM.z);
initPanels();
initDevices({ toggleInv, togglePass, closeAll });
$('bMute').onclick = () => { audio(); $('bMute').style.opacity = toggleMute() ? .4 : 1; };
$('bMenu').onclick = () => { $('mMenu').classList.add('show'); $('goCont').style.display = ''; $('goCont').textContent = 'RESUME'; syncPause(); };
$('goNew').onclick = () => begin(true);
$('goCont').onclick = () => { if (G.started && $('goCont').textContent === 'RESUME') { $('mMenu').classList.remove('show'); syncPause(); } else begin(false); };
const sv = load(); if (sv) { $('goCont').style.display = ''; $('goCont').textContent = `CONTINUE · LV ${sv.lvl} · MAP ${sv.tier}`; }

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  pollInput();
  if (!G.paused) { if (G.hitStop > 0) G.hitStop -= dt; else update(dt); }
  updFx(G.paused ? 0 : dt); draw(dt); hud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testing hooks (used by tests/sim.mjs and handy in the console).
window.__dbg = {
  G, P, S, ctl,
  start: fresh => begin(fresh !== false),
  sim: n => { for (let i = 0; i < n; i++) { update(.033); updFx(.033); } },
  enemies: () => G.enemies, packs: () => G.packs, items: () => G.ground,
  newMap, kill, dropItem, castFireball, castArc, castNova, castDash, openInv, openPass, equip,
};
