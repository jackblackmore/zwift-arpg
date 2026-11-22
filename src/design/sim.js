// THE PAR SIMULATION. Plays the whole game as the par player (targets.js PAR): builds their character at each zone
// from the design data, fights each zone's monsters on paper, and adds up time, XP and loot.
// scripts/balance.mjs turns the result into docs/BALANCE.md. Everything here is averages: no randomness.
import { SLOTS, slotType, BASES, AFFIXES, RARITY as IRARITY, UNIQUES } from './items.js';
import { SKILLS, RUNES } from './skills.js';
import { WINGS, NOTABLES, KEYSTONES } from './passives.js';
import { LEVEL, SKILL_LEVEL } from './progression.js';
import { FAMILIES, RARITY as MRARITY, RARE_MODS, BOSSES } from './monsters.js';
import { ACTS, WAYSTONES, PLAY_ORDER, waystoneAL } from './areas.js';
import { ITEM_DROPS, ITEM_RARITY, MATERIAL_DROPS, SIDE_ROOMS, GOLD, RUNE_DROPS } from './loot.js';
import { PAR } from './targets.js';
import { xpNeed, xpMult, tiersAt, sumMods, playerStats, skillHit, monsterAt, damageTaken, hitsToDie } from './formulas.js';

const avg = ([a, b]) => (a + b) / 2;
const band = al => PAR.gear.filter(b => b.al <= al).at(-1);

// ---------- Par gear ----------
// The par item for a slot at area level `al`: best preferred base, plus `affixes` affixes from the loadout.
export function parItem(slot, al) {
  const b = band(al), ilvl = Math.max(1, al - b.lag), type = slotType(slot);
  const bases = BASES[type].filter(x => x[1] <= ilvl);
  const pref = PAR.basePref[slot] || PAR.basePref[type];
  const base = bases.filter(x => x[2].some(([id]) => id === pref)).at(-1) || bases.at(-1);
  if (!base) return null;
  const rar = b.affixes <= 2 ? 'magic' : 'rare', lim = IRARITY[rar];
  const mods = [...base[2]], picked = [];
  let pre = 0, suf = 0;
  for (const id of PAR.loadout[type]) {
    if (picked.length >= b.affixes) break;
    const a = AFFIXES[id]; if (!a || !a.slots.includes(type) || (a.rareOnly && rar !== 'rare')) continue;
    if (a.pre && pre >= lim.prefix[1]) continue; if (a.suf && suf >= lim.suffix[1]) continue;
    const tiers = tiersAt(a, ilvl); if (!tiers.length) continue;
    const t = tiers[Math.min(tiers.length - 1, b.tierBehind)];
    const v = (t.min + t.max) / 2 * b.quality * (a.slotMult?.[type] || 1);
    mods.push([id, a.int ? Math.max(1, Math.round(v)) : v]); picked.push(id); a.pre ? pre++ : suf++;
  }
  return { slot, base: base[0], ilvl, rar, mods, affixes: picked };
}
// Slots open by zone index (SLOTS.unlock is a zone id like 'act1.vault', or 'start').
function openSlots(zonesDone) {
  return Object.keys(SLOTS).filter(s => SLOTS[s].unlock === 'start' || zonesDone.has(SLOTS[s].unlock));
}

// ---------- Par passives ----------
// Nodes the par player has with `pts` points, following PAR.passives.
export function parPassives(pts) {
  const taken = new Map(), out = []; // key wing.path → nodes taken
  for (const step of PAR.passives) {
    const [wp, n] = step.split(':'), [wing, pi] = wp.split('.');
    const path = WINGS[wing].paths[+pi], want = n ? +n : path.length;
    let have = taken.get(wp) || 0;
    while (have < want && out.length < pts) {
      const node = path[have++];
      out.push(node === 's' ? { wing, small: 1, mods: WINGS[wing].small } : { wing, id: node, ...(NOTABLES[node] || KEYSTONES[node]) });
    }
    taken.set(wp, have);
    if (out.length >= pts) break;
  }
  return out;
}

// ---------- The par character ----------
export function parCharacter({ lvl, al, zonesDone = new Set(), questPts = 0, resPenalty = 0 }) {
  const gear = openSlots(zonesDone).map(s => parItem(s, al)).filter(Boolean);
  const passives = parPassives(lvl - 1 + questPts);
  const skill = SKILLS[PAR.mainSkill];
  const slCap = SKILL_LEVEL.capAtCharLevel(lvl);
  const runes = SKILL_LEVEL.runeSlots.map((at, i) => slCap >= at ? PAR.runes[i] : null).filter(Boolean).filter(r => RUNES[r].for.some(t => skill.tags.includes(t)));
  const mods = [...gear.flatMap(i => i.mods), ...passives.flatMap(p => p.mods)];
  const tAll = sumMods(mods), tSkill = sumMods([...mods, ...runes.flatMap(r => RUNES[r].mods)]);
  const sl = Math.min(SKILL_LEVEL.maxWithGear, slCap + (tAll.skillLevel || 0));
  const ps = playerStats(tAll, lvl, resPenalty);
  const clear = runes.reduce((m, r) => m * RUNES[r].clear, 1) * (1 + .25 * (tSkill.proj || 0));
  const single = runes.reduce((m, r) => m * RUNES[r].single, 1) * (1 + .3 * (tSkill.proj || 0) * skill.single);
  return { lvl, al, gear, passives, runes, skill, sl, t: tSkill, ps, clear, single, hit: res => skillHit(skill, sl, tSkill, res) };
}

// ---------- One zone ----------
// Monster composition of a zone: list of { arch, rar, n, mods }.
function composition(zone, familyArchs, wm = {}) {
  const mix = Object.entries(zone.mix), wsum = mix.reduce((s, [, w]) => s + w, 0), out = [];
  const packs = zone.rooms * zone.packs, size = avg(zone.size) * (wm.packSize || 1);
  const rareMods = Object.keys(RARE_MODS).filter(m => !RARE_MODS[m].fromLevel || RARE_MODS[m].fromLevel <= zone.al);
  const nMods = 1 + Object.entries(MRARITY.rare.modsFromLevel).filter(([, al]) => zone.al >= al).length;
  for (const [id, w] of mix) {
    const arch = familyArchs[id], f = w / wsum;
    out.push({ id, arch, rar: 'normal', n: packs * (1 - zone.magic) * size * f, pack: size });
    out.push({ id, arch, rar: 'magic', n: packs * zone.magic * avg(MRARITY.magic.packSize) * f, pack: avg(MRARITY.magic.packSize) });
    out.push({ id, arch, rar: 'rare', n: (zone.rares + (wm.rares || 0)) * f, pack: 1, mods: rareMods, nMods });
    out.push({ id, arch, rar: 'normal', n: (zone.rares + (wm.rares || 0)) * avg(MRARITY.rare.minions) * f, pack: avg(MRARITY.rare.minions) });
  }
  return out;
}
// Average rare: every mod's effect weighted equally, nMods of them.
function rareMon(arch, L, mods, nMods, wm) {
  const ms = mods.map(m => monsterAt(arch, L, 'rare', [m], wm)), k = nMods;
  const base = monsterAt(arch, L, 'rare', [], wm), mean = f => ms.reduce((s, m) => s + f(m), 0) / ms.length;
  const r = x => base[x] * (mean(m => m[x] / base[x]) ** k);
  const hit = {}; for (const m of ms) for (const [t, v] of Object.entries(m.hit)) hit[t] = (hit[t] || 0) + v / ms.length;
  const hb = Object.values(base.hit).reduce((a, b) => a + b, 0), hm = Object.values(hit).reduce((a, b) => a + b, 0);
  for (const t of Object.keys(hit)) hit[t] *= (hm / hb) ** (k - 1);
  return { ...base, life: r('life'), rate: r('rate'), hit };
}

export function simZone(zone, ch, opts = {}) {
  const wm = opts.wm || {}, L = zone.al, fam = opts.family;
  const comp = composition(zone, fam, wm);
  let fightSec = 0, xp = 0, kills = 0, life = 0, manaKill = 0;
  const rows = {};
  for (const c of comp) {
    if (!c.n) continue;
    const mon = c.rar === 'rare' ? rareMon(c.arch, L, c.mods, c.nMods, wm) : monsterAt(c.arch, L, c.rar, [], wm);
    const res = { ...(c.arch.res || {}) }; if (wm.res) for (const k of ['fire', 'cold', 'light']) res[k] = (res[k] || 0) + wm.res;
    const h = ch.hit(res);
    const hits = Math.min(c.pack, ch.skill.targets * ch.clear);
    const sec = c.rar === 'rare' ? mon.life / (h.dps * ch.single) : mon.life / (h.dps * Math.max(1, hits));
    fightSec += sec * c.n;
    xp += mon.xp * c.n; kills += c.n; life += mon.life * c.n;
    const key = c.rar; (rows[key] ||= { n: 0, ttk: 0, life: 0, hits: 0, hitsW: 0 });
    rows[key].n += c.n; rows[key].ttk += mon.life / (h.dps * ch.single) * c.n; rows[key].life += mon.life * c.n;
    rows[key].hits += hitsToDie(mon, ch.ps) * c.n;
  }
  for (const r of Object.values(rows)) { r.ttk /= r.n; r.life /= r.n; r.hits /= r.n; }
  fightSec /= PAR.uptime;
  // Boss
  let boss = null;
  if (zone.boss) {
    const B = BOSSES[zone.boss], arch = { life: B.life, dmg: B.dmg, xp: B.xp, type: { phys: 1 }, ai: 'melee', res: B.res };
    const mon = monsterAt(arch, L, 'unique', [], wm), h = ch.hit(B.res || {});
    const ttk = mon.life / (h.dps * ch.single) / PAR.bossUptime;
    const big = Object.values(B.abilities).filter(a => a.x).sort((a, b) => b.x - a.x)[0];
    const bigHit = {}; for (const [t, v] of Object.entries(big.type || { phys: 1 })) bigHit[t] = Object.values(mon.hit).reduce((a, b) => a + b, 0) * big.x * v;
    boss = { name: B.name, life: mon.life, ttk, hitsBig: ch.ps.life / damageTaken(bigHit, ch.ps), xp: mon.xp, drops: B.drops };
    fightSec += ttk; xp += mon.xp; kills++;
  }
  const walkSec = (zone.rooms * PAR.travel.room + zone.sideRooms * PAR.travel.sideRoom) * (6.2 / ch.ps.ms) + PAR.travel.zone;
  const minutes = (fightSec + walkSec) / 60;
  // Mana sustain while fighting.
  const h0 = ch.hit({}), killsPerSec = kills / Math.max(1, fightSec * PAR.uptime);
  const sustain = (ch.ps.manaRegen + ch.ps.manaOnKill * killsPerSec) / (h0.manaPerSec * PAR.uptime);
  return { zone, minutes, xp, kills, rows, boss, sustain, dps: h0.dps, hit: h0.hit, loot: zoneLoot(zone, comp, ch, wm, boss) };
}

// ---------- Loot for a zone (expected counts) ----------
function rarityDist(w, rarityStat) {
  const m = 1 + rarityStat, ws = { normal: w.normal, magic: w.magic * m, rare: w.rare * m, unique: w.unique * m };
  const s = Object.values(ws).reduce((a, b) => a + b, 0); return Object.fromEntries(Object.entries(ws).map(([k, v]) => [k, v / s]));
}
function zoneLoot(zone, comp, ch, wm, boss) {
  const q = 1 + ch.ps.quantity + (wm.quantity || 0), rarity = ch.ps.rarity + (wm.rarity || 0);
  const items = { normal: 0, magic: 0, rare: 0, unique: 0 };
  const add = (n, w) => { const d = rarityDist(w, rarity); for (const k in items) items[k] += n * d[k]; };
  let mats = 0, gold = 0, runes = 0, monsters = 0;
  for (const c of comp) {
    monsters += c.n;
    if (c.rar === 'rare') { add(c.n * (ITEM_DROPS.rare.chance + ITEM_DROPS.rare.extra) * q, ITEM_RARITY.fromRare); mats += c.n * MATERIAL_DROPS.chance * MATERIAL_DROPS.rareMult * q; runes += c.n * RUNE_DROPS.perRare; }
    else { add(c.n * ITEM_DROPS[c.rar].chance * q, ITEM_RARITY.base); mats += c.n * MATERIAL_DROPS.chance * q; }
    gold += c.n * GOLD.chance * GOLD.amount(zone.al);
  }
  const sw = Object.values(SIDE_ROOMS).reduce((s, r) => s + r.w, 0), chests = zone.sideRooms * SIDE_ROOMS.chest.w / sw;
  add(chests * avg(SIDE_ROOMS.chest.items), ITEM_RARITY.fromRare); mats += chests * avg(SIDE_ROOMS.chest.materials); runes += chests * RUNE_DROPS.perChest;
  if (boss) { add(boss.drops.items, ITEM_RARITY.fromBoss); items.rare = Math.max(items.rare, boss.drops.rareMin); mats += MATERIAL_DROPS.bossRolls; runes += RUNE_DROPS.perBoss; items.unique += (boss.drops.uniques || []).length * .5; }
  const total = Object.values(items).reduce((a, b) => a + b, 0);
  return { items, total, mats, gold, runes, monsters };
}

// ---------- The whole game ----------
export function simGame() {
  let lvl = 1, xp = 0, sec = 0, questPts = 0;
  const zonesDone = new Set(), out = { zones: [], maps: [], milestones: {}, acts: {} };
  const gain = (amount, monsterLvl) => {
    // Feed XP in small chunks so the level penalty updates as you level.
    const chunks = 8; for (let i = 0; i < chunks && lvl < LEVEL.cap; i++) {
      xp += amount / chunks * xpMult(lvl, monsterLvl);
      while (lvl < LEVEL.cap && xp >= xpNeed(lvl)) { xp -= xpNeed(lvl); lvl++; if (lvl === 50) out.milestones.level50 = sec / 3600; }
    }
    if (lvl >= LEVEL.cap && out.milestones.level60 == null) out.milestones.level60 = sec / 3600;
  };
  let resPenalty = 0, uniquesAct = 0;
  for (const act of ACTS) {
    const fam = FAMILIES[act.family]; uniquesAct = 0; resPenalty = act.resPenalty;
    for (const zone of act.zones) {
      const ch = parCharacter({ lvl, al: zone.al, zonesDone, questPts, resPenalty });
      const r = simZone(zone, ch, { family: fam });
      const lvlIn = lvl; sec += r.minutes * 60; gain(r.xp, zone.al);
      zonesDone.add(act.id + '.' + zone.id); if (zone.boss) zonesDone.add(act.id + '.boss');
      questPts += zone.rewards?.passive || 0; uniquesAct += r.loot.items.unique;
      out.zones.push({ ...r, act: act.id, lvlIn, lvlOut: lvl, hours: sec / 3600, ch, resPenalty });
    }
    out.acts[act.id] = { lvl, hours: sec / 3600, uniques: uniquesAct };
  }
  // Endgame
  const allArchs = {}; const mix = {};
  for (const fam of Object.values(FAMILIES)) for (const [id, a] of Object.entries(fam)) if (typeof a === 'object') { allArchs[fam.name + id] = a; mix[fam.name + id] = 1; }
  const tiers = PLAY_ORDER.runsPerTier.map((n, i) => ({ t: i + 1, n }));
  let maps = 0;
  const runMap = t => {
    const zone = { id: 'T' + t, name: 'Waystone T' + t, al: waystoneAL(t), mix, sideRooms: WAYSTONES.layout.sideRooms, ...WAYSTONES.layout };
    const ch = parCharacter({ lvl, al: zone.al, zonesDone, questPts, resPenalty: resPenalty + PAR.waystone.res });
    const r = simZone(zone, ch, { family: allArchs, wm: PAR.waystone });
    const lvlIn = lvl; sec += r.minutes * 60; gain(r.xp, zone.al); maps++;
    return { ...r, t, lvlIn, lvlOut: lvl, hours: sec / 3600, ch };
  };
  for (const { t, n } of tiers) { let first; for (let i = 0; i < n; i++) { const r = runMap(t); first ||= r; first.last = r; } out.maps.push({ ...first, runs: n, lvlOut: first.last.lvlOut, hoursOut: first.last.hours }); }
  while (lvl < LEVEL.cap && maps < 2000) runMap(PLAY_ORDER.farmTier);
  out.farmMaps = maps - tiers.reduce((s, x) => s + x.n, 0);
  out.final = { lvl, hours: sec / 3600, maps };
  return out;
}
