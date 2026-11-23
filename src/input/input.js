// Player input layer.
//
// Game code reads only `ctl`. Devices write into it each frame:
//   mx, mz   movement intent, -1..1 in world axes (screen up = -z)
//   aim      [x, z] world point to aim at, or null to auto-aim at the nearest enemy
//   main, flexA, flexB, guard, evade   skill bar buttons: true while held (data/gems.js BAR)
//   tap      { slot: true } latched on each press so a quick tap is never missed (the game clears it)
//   flask    one-shot press (the game clears it)
//   surge    true while the Surge button is held (keyboard and touch; RIDE surges from power instead, see effort)
//   autoAtk  auto-attack on: the melee Main gem swings at awake monsters in reach (the ATTACK toggle, stored per device)
//   auto     autopilot on: the game steers when there's no movement input (RIDE mode)
//   effort   { pw, rel (fraction of FTP), cad } from the bike, or null when not riding
//
// Today's devices are keyboard + mouse and touch (input/devices.js). A Zwift Ride / KICKR
// device goes in later as one more writer of `ctl`, without touching game code.
import { BAR } from '../data/gems.js';
export const ctl = { mx: 0, mz: 0, aim: null, main: false, flexA: false, flexB: false, guard: false, evade: false, tap: {}, flask: false, surge: false, touch: false, autoAtk: true, auto: false, effort: null };

// A device pressed or released a skill bar button.
export function slotInput(slot, down) { ctl[slot] = down; if (down) ctl.tap[slot] = true; }
export function clearHeld() { for (const s of BAR) ctl[s] = false; ctl.tap = {}; ctl.surge = false; }
