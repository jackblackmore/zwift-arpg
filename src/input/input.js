// Player input layer.
//
// Game code reads only `ctl`. Devices write into it each frame:
//   mx, mz   movement intent, -1..1 in world axes (screen up = -z)
//   aim      [x, z] world point to aim at, or null when the device has none (touch, RIDE)
//   main     held: fire Main manually toward `aim`. Main auto-attacks whether or not this is held
//   flexA, flexB, guard, evade, flask  one-shot presses (the game clears them when it uses them)
//   auto     autopilot on: the game steers when there's no movement input (RIDE mode)
//   effort   { pw, rel (fraction of FTP), cad } from the bike, or null when not riding
//
// Today's devices are keyboard + mouse and touch (input/devices.js). A Zwift Ride / KICKR
// device goes in later as one more writer of `ctl`, without touching game code.
export const ctl = { mx: 0, mz: 0, aim: null, main: false, flexA: false, flexB: false, guard: false, evade: false, flask: false, touch: false, auto: false, effort: null };

export function clearHeld() { ctl.main = false; }
