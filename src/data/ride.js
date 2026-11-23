// RIDE mode: plays the game with only what a Zwift Ride + KICKR give you (buttons, power, cadence).
// Today power and cadence come from on-screen sliders / keys; later from the KICKR over Bluetooth.
export const RIDE = {
  ftp: 250, startPower: 175, startCad: 88,
  // Movement speed multiplier from %FTP: below `stop` the hero stands still, `full` is normal speed, capped at `max`.
  move: { stop: .3, full: .75, max: 1.25 },
  // Cast speed from power: at `endurance` %FTP and above casts run at 100%; below it they slow, down to `slowest` at `low` %FTP or less.
  power: { endurance: .65, low: .4, slowest: .5 },
  // Surge (data/skills.js SURGE): riding above `from` %FTP surges, partly at first and fully from `full`. Easing off lets the gauge refill.
  surge: { from: .8, full: 1.05 },
  // Cast speed bonus per rpm above `from`, capped.
  cadence: { from: 80, per: .004, max: .15 },
  // Autopilot (Y): walk toward the nearest fight / loot / pack; hold at `keep`, back off inside `kite`.
  autopilot: { engage: 14, keep: 6.5, kite: 3.5, loot: 15 },
  keys: { powerUp: 'w', powerDown: 's', cadUp: 'd', cadDown: 'a', step: 120, cadStep: 40 }, // per second while held
};

// Zwift Ride controls and what they do. `key` is the keyboard stand-in in RIDE mode.
// slot: a skill bar button (held while down; the icon and colour come from the gem in that slot).
// Left hand: D-pad and the left shifter. Right hand: Y/Z/A/B and the right shifter.
// (Layout follows the Zwift Play/Ride button set; adjust once tested on the real controllers.)
export const RIDE_BUTTONS = [
  { id: 'up', side: 'L', at: [1, 0], key: 'arrowup', label: '▲' },
  { id: 'left', side: 'L', at: [0, 1], key: 'arrowleft', label: '◀' },
  { id: 'right', side: 'L', at: [2, 1], key: 'arrowright', label: '▶' },
  { id: 'down', side: 'L', at: [1, 2], key: 'arrowdown', label: '▼' },
  { id: 'lshift', side: 'L', at: [0, 3], key: 'q', label: 'SHIFT −', act: 'flask', icon: '♥', col: '#ff4a5a', wide: 1 },
  // Evade: the left controller's power-up button (top-left of the pad here). Move it once tested on the real controllers.
  { id: 'lpow', side: 'L', at: [0, 0], key: 'u', label: 'PWR', act: 'evade', slot: 1, col: '#ff6a1a' },
  { id: 'Y', side: 'R', at: [1, 0], key: 'i', label: 'Y', act: 'auto', icon: '⟳', col: '#5fe39a' },
  { id: 'Z', side: 'R', at: [0, 1], key: 'j', label: 'Z', act: 'flexB', slot: 1 },
  { id: 'B', side: 'R', at: [2, 1], key: 'l', label: 'B', act: 'flexA', slot: 1 },
  { id: 'A', side: 'R', at: [1, 2], key: 'k', label: 'A', act: 'main', slot: 1 },
  { id: 'rshift', side: 'R', at: [0, 3], key: 'e', label: 'SHIFT +', act: 'guard', slot: 1, wide: 1 },
];
