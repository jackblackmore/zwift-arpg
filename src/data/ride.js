// RIDE mode: plays the game with only what a Zwift Ride + KICKR give you (buttons, power, cadence).
// Today power and cadence come from on-screen sliders / keys; later from the KICKR over Bluetooth.
export const RIDE = {
  ftp: 250, startPower: 175, startCad: 88,
  // Pedalling is a GATE for movement, not a speed dial. Below `stopW` watts the hero stands still; above that but
  // under `fullAt` (fraction of FTP) it is a slow walk (`walk` x normal speed); from `fullAt` up it is a fixed 1x, no bonus.
  move: { stopW: 1, walk: .35, fullAt: .35 },
  // Power sets Main's attack rate. `curve` is [fraction of FTP, attack rate] points, linearly interpolated, flat past
  // the last point. Endurance (.65-.70) = 1.0. Below it Main slows. Above it rises, but only while the Surge gauge has charge;
  // an empty gauge clamps the attack rate to 1.
  atk: { curve: [[0, .35], [.4, .5], [.65, 1], [.7, 1], [1.3, 1.8]] },
  // Surge gauge (modelled on W'). The same for everyone: max joules = k x FTP, so it scales with FTP and never with the rider.
  // Drains by (power - drainFrom x FTP) per second above `drainFrom` (just over endurance); refills below `refillBelow`
  // (just under endurance) at (refillBelow x FTP - power) x `refill` + `base` x FTP per second. Nothing removes the limit.
  // With k 22.5: 45 s at 120% FTP, 37 s at 130%, 28 s at 150%. Refill ~2 min of easy riding at 50% FTP, ~35 s at 0 W.
  surge: { k: 22.5, drainFrom: .7, refillBelow: .65, refill: .9, base: .04 },
  // Autopilot (Y): walk toward the nearest fight / loot / pack; hold at `keepF` x Main's range, back off inside `kiteF` x range.
  autopilot: { engage: 14, keepF: .75, kiteF: .35, loot: 15 },
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
