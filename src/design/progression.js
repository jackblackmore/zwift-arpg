// CHARACTER PROGRESSION: levels, XP, base stats per level, skill levels, passive points.
// Monster XP is in monsters.js (SCALE.xp). The balance report shows the hours this adds up to.

export const LEVEL = {
  cap: 60,
  // XP needed to go from level l to l+1:  round(xp.base × l^xp.exp × (1 + xp.late)^max(0, l - xp.lateFrom))
  // `late` makes the endgame levels a long tail without slowing the campaign (each level past lateFrom costs late% more).
  xp: { base: 22, exp: 2.0, late: .28, lateFrom: 32 },
  // Monsters more than `safe` levels below you give less XP: × max(floor, 1 - per × (gap - safe)).
  // Above you: no bonus (pushing ahead is its own reward through loot).
  xpPenalty: { safe: 4, per: .15, floor: .1 },
  // Dying in an endgame waystone loses this fraction of the XP in the current level (never de-levels).
  deathXpLoss: .05,
};

// Character stats from level alone (before gear and passives).
export const PER_LEVEL = {
  life: { base: 60, per: 12 },    // life = 60 + 12 per level after 1
  mana: { base: 40, per: 5 },
  accuracy: { base: 0, per: 0 },  // spells always hit; kept for a future melee class
};

// Skills level up by use, capped by character level. Gear and passives add on top (skillLevel stat).
export const SKILL_LEVEL = {
  max: 20,                         // from use
  maxWithGear: 25,
  capAtCharLevel: l => Math.min(20, 1 + Math.floor((l - 1) / 3)), // a skill can't out-level you: level 1 → 1, level 31 → 11, level 58 → 20
  // XP a skill needs, as a fraction of the character XP for the level it unlocks at. Using a skill feeds it all
  // kill XP it lands; the par sim assumes your main skill keeps up with the cap.
  xpShare: 1,
  runeSlots: [5, 15],              // skill levels where rune slot 1 and 2 open
};

// Passive points: one per level from 2 up, plus fixed quest rewards (areas.js `rewards.passive`).
export const PASSIVE = {
  perLevel: 1,
  respecGoldPerPoint: lvl => 20 + 6 * lvl,  // refund one node
  fullRespec: { currency: 'emberCore', n: 1 }, // refund everything at the skill shrine
};

// Flask: one life flask, upgraded by act rewards (areas.js `rewards.flask`).
export const FLASK = {
  tiers: [ // heal is a fraction of max life over `dur` seconds
    { name: 'Small Life Flask', heal: .5, dur: 2.5, charges: 3 },
    { name: 'Greater Life Flask', heal: .6, dur: 2.2, charges: 3 },
    { name: 'Grand Life Flask', heal: .7, dur: 2, charges: 4 },
    { name: 'Eternal Life Flask', heal: .8, dur: 1.8, charges: 4 },
  ],
  chargePerKill: .1, chargePerRare: 1, chargePerBoss: 3,
};

// Resistance penalties per act are in areas.js (ACTS[].resPenalty): the gate that makes resist gear matter from Act 2.
