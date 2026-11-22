// Checks that every id the design files point at exists (stats, skills, zones, recipes, uniques...).
// Returns a list of problems; scripts/balance.mjs fails `npm test` if there are any.
import { STATS } from './stats.js';
import { SLOTS, BASES, AFFIXES, UNIQUES } from './items.js';
import { SKILLS, RUNES } from './skills.js';
import { WINGS, NOTABLES, KEYSTONES } from './passives.js';
import { FAMILIES, BOSSES, RARE_MODS } from './monsters.js';
import { ACTS, BIOMES } from './areas.js';
import { CURRENCY, RECIPES, WAYSTONE_MODS } from './crafting.js';
import { MATERIAL_DROPS, SALVAGE } from './loot.js';
import { PAR } from './targets.js';

export function validate() {
  const errs = [], err = m => errs.push(m);
  const mods = (where, list) => { for (const [id] of list || []) if (!STATS[id]) err(`${where}: unknown stat "${id}"`); };
  // Places: 'start', 'actN', 'actN.boss', 'actN.<zone>', 'actN.sideRooms', 'waystone', 'waystone.tN', 'pinnacle', 'any'.
  const zoneIds = new Set(['start', 'any', 'waystone', 'pinnacle', 'waystones']);
  for (const a of ACTS) { zoneIds.add(a.id); zoneIds.add(a.id + '.boss'); zoneIds.add(a.id + '.sideRooms'); for (const z of a.zones) zoneIds.add(a.id + '.' + z.id); }
  for (let t = 1; t <= 10; t++) zoneIds.add('waystone.t' + t);
  const place = (where, id) => { if (id && !zoneIds.has(id)) err(`${where}: unknown place "${id}"`); };

  for (const [s, d] of Object.entries(SLOTS)) place('SLOTS.' + s, d.unlock);
  for (const [s, list] of Object.entries(BASES)) for (const b of list) mods(`BASES.${s}.${b[0]}`, b[2]);
  for (const [id, a] of Object.entries(AFFIXES)) {
    if (!STATS[id]) err(`AFFIXES.${id}: not a stat`);
    if (!a.pre === !a.suf) err(`AFFIXES.${id}: needs exactly one of pre / suf`);
    for (const s of a.slots) if (!BASES[s]) err(`AFFIXES.${id}: unknown slot type "${s}"`);
  }
  for (const [id, u] of Object.entries(UNIQUES)) {
    mods('UNIQUES.' + id, u.mods); place('UNIQUES.' + id, u.source);
    const type = SLOTS[u.slot]?.type || u.slot; if (!BASES[type]?.some(b => b[0] === u.base)) err(`UNIQUES.${id}: base "${u.base}" isn't a ${u.slot} base`);
  }
  for (const [id, s] of Object.entries(SKILLS)) place('SKILLS.' + id, s.unlock);
  for (const [id, r] of Object.entries(RUNES)) mods('RUNES.' + id, r.mods);
  for (const [w, wing] of Object.entries(WINGS)) {
    mods(`WINGS.${w}.small`, wing.small);
    for (const p of wing.paths) for (const n of p) if (n !== 's' && !NOTABLES[n] && !KEYSTONES[n]) err(`WINGS.${w}: unknown node "${n}"`);
  }
  for (const [id, n] of Object.entries({ ...NOTABLES, ...KEYSTONES })) mods('passive ' + id, n.mods);
  for (const a of ACTS) {
    const fam = FAMILIES[a.family]; if (!fam) { err(`${a.id}: unknown family "${a.family}"`); continue; }
    for (const z of a.zones) {
      const w = `${a.id}.${z.id}`;
      for (const m of Object.keys(z.mix)) if (typeof fam[m] !== 'object') err(`${w}: "${m}" isn't in family ${a.family}`);
      if (z.boss && !BOSSES[z.boss]) err(`${w}: unknown boss "${z.boss}"`);
      if (!BIOMES[z.biome]) err(`${w}: unknown biome "${z.biome}"`);
      const r = z.rewards || {};
      if (r.skill && !SKILLS[r.skill]) err(`${w}: reward skill "${r.skill}" doesn't exist`);
      if (r.recipe && !RECIPES[r.recipe]) err(`${w}: reward recipe "${r.recipe}" doesn't exist`);
      if (r.skill && SKILLS[r.skill] && SKILLS[r.skill].unlock !== w && SKILLS[r.skill].unlock !== a.id + '.boss') err(`${w}: rewards ${r.skill} but SKILLS.${r.skill}.unlock is "${SKILLS[r.skill].unlock}"`);
    }
  }
  for (const [id, b] of Object.entries(BOSSES)) {
    for (const u of b.drops?.uniques || []) if (!UNIQUES[u]) err(`BOSSES.${id}: unknown unique "${u}"`);
    for (const r of b.drops?.recipes || []) if (!RECIPES[r]) err(`BOSSES.${id}: unknown recipe "${r}"`);
  }
  for (const [id, r] of Object.entries(RECIPES)) {
    mods('RECIPES.' + id, [r.mod]); place('RECIPES.' + id, r.source);
    for (const c of Object.keys(r.cost)) if (!CURRENCY[c]) err(`RECIPES.${id}: unknown currency "${c}"`);
  }
  for (const c of Object.keys(MATERIAL_DROPS.weights)) if (!CURRENCY[c]) err(`MATERIAL_DROPS: unknown currency "${c}"`);
  for (const [r, s] of Object.entries(SALVAGE)) for (const c of Object.keys(s)) if (!CURRENCY[c]) err(`SALVAGE.${r}: unknown currency "${c}"`);
  for (const [id, m] of Object.entries(RARE_MODS)) if (!m.name) err(`RARE_MODS.${id}: needs a name`);
  for (const [id, m] of Object.entries(WAYSTONE_MODS)) if (!m.pre === !m.suf) err(`WAYSTONE_MODS.${id}: needs exactly one of pre / suf`);
  // Par
  if (!SKILLS[PAR.mainSkill]) err(`PAR.mainSkill "${PAR.mainSkill}" doesn't exist`);
  for (const r of PAR.runes) if (!RUNES[r]) err(`PAR.runes: unknown rune "${r}"`);
  for (const step of PAR.passives) { const [wp] = step.split(':'), [w, p] = wp.split('.'); if (!WINGS[w]?.paths[+p]) err(`PAR.passives: no path "${wp}"`); }
  for (const [t, list] of Object.entries(PAR.loadout)) for (const id of list) if (!AFFIXES[id]) err(`PAR.loadout.${t}: unknown affix "${id}"`);
  return errs;
}
