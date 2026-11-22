import './style.css';
import { S, hero, ride } from './core/state.js';
import { scene, resize } from './render/scene.js';
import { humanoid } from './render/models.js';
import { draw } from './render/draw.js';
import { M } from './world/map.js';
import { update } from './game/update.js';
import { newFloor } from './game/floor.js';
import { setAuto } from './input/rider.js';
import { hud, renderGear } from './ui/hud.js';
import { showSummary, rideMetrics } from './ui/summary.js';
import { initControls, startGame } from './ui/controls.js';

S.heroModel = humanoid({ body: 0x7d8fb8, dark: 0x2a2f45, head: 0xd9b08c, weapon: 0xcfe8ff, weaponE: 0x00aaff, helm: true, shield: 0x5a3a2a, cape: 0x8a1f2b });
scene.add(S.heroModel.g);
resize();
renderGear();
initControls();
setAuto(1);
newFloor();

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (S.hitStop > 0) S.hitStop -= dt; else update(dt);
  draw(dt); hud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testing hooks (used by tests/sim.mjs and handy in the console).
window.__dbg = {
  S, hero, ride,
  rooms: () => M.rooms, enemies: () => S.enemies, floor: () => S.floorN,
  sim: n => { for (let i = 0; i < n; i++) update(.05); },
  start: mode => startGame(mode),
  metrics: rideMetrics,
  summary: showSummary, tell: () => S.curTell,
};
