// RIDE mode: plays the game with only what a Zwift Ride + KICKR give you (buttons, power, cadence).
// Today power and cadence come from on-screen sliders / keys; later from the KICKR over Bluetooth.
export const RIDE = {
  ftp: 250, startPower: 175, startCad: 88,
  // Movement speed multiplier from %FTP: below `stop` the hero stands still, `full` is normal speed, capped at `max`.
  move: { stop: .3, full: .75, max: 1.25 },
  // Autopilot (Y): walk toward the nearest fight / loot / pack; hold at `keep`, back off inside `kite`.
  autopilot: { engage: 14, keep: 6.5, kite: 3.5, loot: 15 },
  keys: { powerUp: 'w', powerDown: 's', cadUp: 'd', cadDown: 'a', step: 120, cadStep: 40 }, // per second while held
};

// Zwift Ride controls and what they do. `key` is the keyboard stand-in in RIDE mode.
// Left hand: D-pad and the left shifter. Right hand: Y/Z/A/B and the right shifter. Main has no button: it auto-attacks.
// (Layout follows the Zwift Play/Ride button set; adjust once tested on the real controllers.)
export const RIDE_BUTTONS = [
  { id: 'up', side: 'L', at: [1, 0], key: 'arrowup', label: '▲' },
  { id: 'left', side: 'L', at: [0, 1], key: 'arrowleft', label: '◀' },
  { id: 'right', side: 'L', at: [2, 1], key: 'arrowright', label: '▶' },
  { id: 'down', side: 'L', at: [1, 2], key: 'arrowdown', label: '▼' },
  { id: 'lshift', side: 'L', at: [0, 3], key: 'q', label: 'SHIFT −', act: 'flask', icon: '♥', col: '#ff4a5a', wide: 1 },
  { id: 'Y', side: 'R', at: [1, 0], key: 'i', label: 'Y', act: 'auto', icon: '⟳', col: '#5fe39a' },
  { id: 'Z', side: 'R', at: [0, 1], key: 'j', label: 'Z', act: null }, // spare (Flex B later)
  { id: 'B', side: 'R', at: [2, 1], key: 'l', label: 'B', act: 'guard', icon: '◍', col: '#8fe0ff' },
  { id: 'A', side: 'R', at: [1, 2], key: 'k', label: 'A', act: 'flexA', icon: '❄', col: '#7fd8ff' },
  { id: 'rshift', side: 'R', at: [0, 3], key: 'e', label: 'SHIFT +', act: 'evade', icon: '➶', col: '#b08aff', wide: 1 },
];
