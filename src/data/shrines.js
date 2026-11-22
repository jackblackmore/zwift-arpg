// Shrines (game/shrines.js, ui/shrine.js): four, once per character, only in the Crypt. Each offers 1 of 3 gems for one bar slot.
// lvl: character level needed. offer: gem ids. bonus: extra gems granted with the pick ({ slot: gemId }). flex: the gem starts at
// Main gem level - 2 (min 1); the others start at level 1. color: the shrine's glow and the card accent. banner: what the arrival says.
export const SHRINES = {
  main: { lvl: 1, name: 'Shrine of Power', slot: 'main', color: 0xffb040, offer: ['fireball', 'frostLance', 'skeletons'], bonus: { evade: 'blink' }, banner: 'Choose your first skill', pick: 'Choose your Main skill' },
  flexA: { lvl: 5, name: 'Shrine of the Second Art', slot: 'flexA', color: 0x7fd8ff, offer: ['flameTotem', 'nova', 'arc'], flex: true, banner: 'Choose a Flex skill (Flex A)', pick: 'Choose your Flex A skill' },
  guard: { lvl: 8, name: 'Shrine of Warding', slot: 'guard', color: 0x7dffc0, offer: ['ward', 'boneArmour', 'decoy'], banner: 'Choose a Guard skill', pick: 'Choose your Guard skill' },
  flexB: { lvl: 12, name: 'Shrine of the Third Art', slot: 'flexB', color: 0xc98bff, offer: ['meteor', 'iceTrap', 'corpseExplosion'], flex: true, banner: 'Choose a Flex skill (Flex B)', pick: 'Choose your Flex B skill' },
};
export const SHRINE_ORDER = ['main', 'flexA', 'guard', 'flexB']; // the order they come up in (by level)
// dist: how far from the entrance along the route the first shrine stands (a second one at the same entrance stands `gap` further to the side).
// trigger: how close the hero must come to open it. FLEX_DROP: levels below Main that a Flex shrine gem starts.
export const SHRINE_AT = { dist: 4.5, gap: 3, trigger: 2.2 };
export const FLEX_DROP = 2;
// What each shrine skill feels like to play (one line on the card).
export const FEELS = {
  fireball: 'Aim and fire. Things burn.',
  frostLance: 'Pick a target, one huge shot. Fragile.',
  skeletons: 'The army fights. You stand back.',
  flameTotem: 'Plant it and let it spit fire.',
  nova: 'Wade in, freeze the crowd.',
  arc: 'Lightning leaps from enemy to enemy.',
  ward: 'Soak a pool of damage for a few seconds.',
  boneArmour: 'Plates that stop whole hits and sting back.',
  decoy: 'Drag the pack onto a dummy, then run or fight.',
  meteor: 'Call down a big hit on a chosen spot.',
  iceTrap: 'Lay it, lure them over it, freeze them.',
  corpseExplosion: 'Blow up the bodies you leave behind.',
};
