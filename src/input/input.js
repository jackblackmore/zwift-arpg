// Player input layer.
//
// Game code reads only `ctl`. Devices write into it each frame:
//   mx, mz   movement intent, -1..1 in world axes (screen up = -z)
//   aim      [x, z] world point to aim at, or null to auto-aim at the nearest enemy
//   fb, arc  held skills (cast repeatedly while true)
//   nova, shield, flask  one-shot presses (the game clears them when it uses them)
//   auto     autopilot on: the game steers when there's no movement input (RIDE mode)
//   effort   { pw, rel (fraction of FTP), cad } from the bike, or null when not riding
//
// Today's devices are keyboard + mouse and touch (input/devices.js). A Zwift Ride / KICKR
// device goes in later as one more writer of `ctl`, without touching game code.
export const ctl = { mx: 0, mz: 0, aim: null, fb: false, arc: false, nova: false, shield: false, flask: false, touch: false, auto: false, effort: null };

export function clearHeld() { ctl.fb = ctl.arc = false; }
