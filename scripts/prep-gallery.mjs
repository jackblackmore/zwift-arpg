// Builds the asset gallery's files in public/gallery/ from the KayKit packs (CC0, by Kay Lousberg).
// The game itself only uses public/models/ (scripts/prep-models.mjs); the gallery is for browsing options.
//
// Usage: put the packs in one folder, then
//   KAYKIT=/path/to/packs node scripts/prep-gallery.mjs
// Cloned from github.com/KayKit-Game-Assets/<name>: KayKit-Character-Pack-Adventures-1.0,
//   KayKit-Character-Pack-Skeletons-1.0, KayKit-Dungeon-Remastered-1.0, KayKit-Halloween-Bits-1.0,
//   KayKit-Medieval-Hexagon-Pack-1.0
// Unzipped from itch.io (kaylousberg.itch.io, free tier), each zip into a folder of its own name:
//   KayKit_Character_Animations_1.1, KayKit_Forest_Nature_Pack_1.0_FREE, KayKit_ResourceBits_1.0_FREE
//
// Output:
//   anims_<set>.glb     every clip of an animation set, rig only (no meshes)
//   char_<name>.glb     characters, meshes only (the Skeletons reuse public/models)
//   pack_<name>.glb                             one file per prop pack; each prop is a top-level node named after its file
//   index.json                                  what the gallery lists
import { prune, dedup } from '@gltf-transform/functions';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { io, kb, dropLoose, animLib, walk, label, mergeModels } from './gltf-lib.mjs';

const SRC = process.env.KAYKIT || '/tmp';
const AD = join(SRC, 'KayKit-Character-Pack-Adventures-1.0/addons/kaykit_character_pack_adventures');
const SK = join(SRC, 'KayKit-Character-Pack-Skeletons-1.0/addons/kaykit_character_pack_skeletons');
const ZIP = n => join(SRC, n, n); // itch.io zips unpack into a folder of the same name
const AN = join(ZIP('KayKit_Character_Animations_1.1'), 'Animations/gltf');
const MQ = join(ZIP('KayKit_Character_Animations_1.1'), 'Mannequin Character/characters');
const OUT = 'public/gallery';
mkdirSync(OUT, { recursive: true });
const index = { anims: {}, chars: [], packs: [] };

// Animation sets. rig says which characters a set fits (every character here is on the medium rig except the large mannequin).
const SETS = [
  ['skeletons', 'Skeletons pack', 'medium', join(SK, 'Characters/gltf/Skeleton_Minion.glb')],
  ['adventurers', 'Adventurers pack', 'medium', join(AD, 'Characters/gltf/Knight.glb')],
  ['anim11', 'Animations 1.1', 'medium', ['General', 'MovementBasic', 'MovementAdvanced', 'CombatMelee', 'CombatRanged', 'Special', 'Tools', 'Simulation'].map(n => join(AN, `Rig_Medium/Rig_Medium_${n}.glb`))],
  ['anim11large', 'Animations 1.1 (large)', 'large', ['General', 'MovementBasic', 'MovementAdvanced', 'CombatMelee', 'Special', 'Simulation'].map(n => join(AN, `Rig_Large/Rig_Large_${n}.glb`))],
];
for (const [id, name, rig, src] of SETS) index.anims[id] = { name, rig, file: `anims_${id}.glb`, clips: await animLib(src, join(OUT, `anims_${id}.glb`)) };

// Characters without clips. Returns the rigid props that ship inside them (spare weapons, hats, capes).
async function bare(src, out) {
  const doc = await io.read(src), root = doc.getRoot();
  for (const a of root.listAnimations()) { for (const c of a.listChannels()) c.dispose(); for (const smp of a.listSamplers()) smp.dispose(); a.dispose(); }
  dropLoose(root);
  await doc.transform(prune(), dedup());
  await io.write(join(OUT, out), doc);
  const props = root.listNodes().filter(n => n.getMesh() && !n.getSkin()).map(n => n.getName());
  console.log(out, kb(join(OUT, out)), props.length ? 'props: ' + props.join(', ') : '');
  return props;
}
for (const n of ['Knight', 'Barbarian', 'Mage', 'Rogue', 'Rogue_Hooded']) {
  const file = `char_${n.toLowerCase()}.glb`;
  index.chars.push({ name: n.replace('_', ' '), file: 'gallery/' + file, rig: 'medium', props: await bare(join(AD, `Characters/gltf/${n}.glb`), file) });
}
for (const n of ['Minion', 'Warrior', 'Rogue', 'Mage']) index.chars.push({ name: 'Skeleton ' + n, file: `models/skel_${n.toLowerCase()}.glb`, rig: 'medium', props: [] });
for (const n of ['Medium', 'Large']) {
  const file = `char_mannequin_${n.toLowerCase()}.glb`;
  index.chars.push({ name: 'Mannequin ' + n, file: 'gallery/' + file, rig: n.toLowerCase(), props: await bare(join(MQ, `Mannequin_${n}.glb`), file) });
}

// Prop packs: every model in the pack, one file per pack.
async function pack(id, name, dir, opts) {
  const file = `pack_${id}.glb`;
  index.packs.push({ id, name, file, items: await mergeModels(walk(dir).sort(), join(OUT, file), opts) });
}
const sub = base => p => relative(base, p).split('/').slice(0, -1).join(' / ');
const first = p => label(p).split('_')[0];
await pack('weapons_adventurers', 'Adventurers gear', join(AD, 'Assets/gltf'));
await pack('weapons_skeletons', 'Skeletons gear', join(SK, 'Assets/gltf'));
await pack('dungeon', 'Dungeon', join(SRC, 'KayKit-Dungeon-Remastered-1.0/addons/kaykit_dungeon_remastered/Assets/gltf'), { group: first });
await pack('halloween', 'Halloween', join(SRC, 'KayKit-Halloween-Bits-1.0/addons/kaykit_halloween_bits/Assets/gltf'), { group: first });
const HX = join(SRC, 'KayKit-Medieval-Hexagon-Pack-1.0/addons/kaykit_medieval_hexagon_pack/Assets/gltf');
await pack('hexagon', 'Medieval Hexagon', HX, { group: sub(HX) });
await pack('forest', 'Forest', join(ZIP('KayKit_Forest_Nature_Pack_1.0_FREE'), 'Assets/gltf'), { group: first });
await pack('resources', 'Resources', join(ZIP('KayKit_ResourceBits_1.0_FREE'), 'Assets/gltf'), { group: first });

writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
console.log('index.json written');
