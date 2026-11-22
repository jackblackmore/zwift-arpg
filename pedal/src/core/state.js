// Shared mutable game state. Modules import these objects and mutate their fields.

export const S = {
  ftp: 250,
  autoMode: 0, // 0 manual, 1 endurance, 2 intervals (see input/rider.js)
  seg: 0, segT: 0,
  time: 0, floorN: 1, gold: 0, started: false,
  enemies: [], effects: [], parts: [], floats: [], arrows: [],
  stairs: null,
  choices: null, choiceT: 0, boonChoice: null, boonQ: 0,
  curTell: null, autoOv: null,
  hitStop: 0, shakeAmt: 0, bannerT: 0, weakFloatT: 0,
  heroModel: null, campLights: [],
  keys: {},
};

export const hero = {
  x: 0, z: 0, hp: 100, face: 0, atkT: 0, swing: 0, walkT: 0, path: null, repathT: 0, goal: null, pow: 170,
  wbal: 18000, wmax: 18000, cleave: 0, over: 0, str: 0, strT: 0, dead: 0, lock: 0, rest: 0,
  gear: { weapon: null, armor: null, relic: null },
  boons: [], potions: 2, pAvg: 170, dieselT: 0, cAvg: 88, metT: 0,
};

const freshRide = () => ({ t: 0, kj: 0, zt: [0, 0, 0, 0, 0, 0, 0], samples: [], acc: 0, accN: 0, kills: 0, bosses: 0, best: null, floors: 0, rooms: 0, goldEarned: 0, peak: 0 });
export const ride = freshRide();
export function resetRide() { Object.assign(ride, freshRide()); }
