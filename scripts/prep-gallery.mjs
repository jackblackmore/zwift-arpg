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
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup, resample, mergeDocuments, unpartition } from '@gltf-transform/functions';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

const SRC = process.env.KAYKIT || '/tmp';
const AD = join(SRC, 'KayKit-Character-Pack-Adventures-1.0/addons/kaykit_character_pack_adventures');
const SK = join(SRC, 'KayKit-Character-Pack-Skeletons-1.0/addons/kaykit_character_pack_skeletons');
const ZIP = n => join(SRC, n, n); // itch.io zips unpack into a folder of the same name
const AN = join(ZIP('KayKit_Character_Animations_1.1'), 'Animations/gltf');
const MQ = join(ZIP('KayKit_Character_Animations_1.1'), 'Mannequin Character/characters');
const OUT = 'public/gallery';
mkdirSync(OUT, { recursive: true });
const io = new NodeIO();
const index = { anims: {}, chars: [], packs: [] };
const kb = f => Math.round(statSync(join(OUT, f)).size / 1024) + ' KB';

// Copy every clip of one file into another with the same rig, retargeted to its nodes by name.
function copyClips(doc, src, have) {
  const root = doc.getRoot(), buf = root.listBuffers()[0];
  const nodes = new Map(root.listNodes().map(n => [n.getName(), n]));
  const acc = a => doc.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setBuffer(buf);
  for (const a of src.getRoot().listAnimations()) {
    if (have.has(a.getName())) continue; have.add(a.getName());
    const anim = doc.createAnimation(a.getName());
    for (const c of a.listChannels()) {
      const node = nodes.get(c.getTargetNode()?.getName()); if (!node) continue;
      const sm = c.getSampler(), s2 = doc.createAnimationSampler().setInput(acc(sm.getInput())).setOutput(acc(sm.getOutput())).setInterpolation(sm.getInterpolation());
      anim.addSampler(s2).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(c.getTargetPath()).setSampler(s2));
    }
  }
}
// Every clip, no meshes: the rig's nodes stay so three.js can bind the tracks by bone name.
async function animLib(srcs, out) {
  srcs = [].concat(srcs);
  const doc = await io.read(srcs[0]), root = doc.getRoot(), have = new Set(root.listAnimations().map(a => a.getName()));
  for (const f of srcs.slice(1)) copyClips(doc, await io.read(f), have);
  for (const n of root.listNodes()) if (n.getMesh()) { n.getMesh().dispose(); n.setMesh(null); n.setSkin(null); }
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample(), prune({ keepLeaves: true }), dedup());
  await io.write(join(OUT, out), doc);
  const names = root.listAnimations().map(a => a.getName());
  console.log(out, names.length, 'clips', kb(out));
  return names;
}
// Sets: rig says which characters a set fits (every character here is on the medium rig except the large mannequin).
const SETS = [
  ['skeletons', 'Skeletons pack', 'medium', join(SK, 'Characters/gltf/Skeleton_Minion.glb')],
  ['adventurers', 'Adventurers pack', 'medium', join(AD, 'Characters/gltf/Knight.glb')],
  ['anim11', 'Animations 1.1', 'medium', ['General', 'MovementBasic', 'MovementAdvanced', 'CombatMelee', 'CombatRanged', 'Special', 'Tools', 'Simulation'].map(n => join(AN, `Rig_Medium/Rig_Medium_${n}.glb`))],
  ['anim11large', 'Animations 1.1 (large)', 'large', ['General', 'MovementBasic', 'MovementAdvanced', 'CombatMelee', 'Special', 'Simulation'].map(n => join(AN, `Rig_Large/Rig_Large_${n}.glb`))],
];
for (const [id, name, rig, src] of SETS) index.anims[id] = { name, rig, file: `anims_${id}.glb`, clips: await animLib(src, `anims_${id}.glb`) };

// Clips we drop may leave accessors behind that nothing references; prune() keeps those, so remove them here.
const dropLoose = root => { for (const acc of root.listAccessors()) if (acc.listParents().every(p => p === root)) acc.dispose(); };

// Characters without clips.
async function bare(src, out) {
  const doc = await io.read(src), root = doc.getRoot();
  for (const a of root.listAnimations()) { for (const c of a.listChannels()) c.dispose(); for (const smp of a.listSamplers()) smp.dispose(); a.dispose(); }
  dropLoose(root);
  await doc.transform(prune(), dedup());
  await io.write(join(OUT, out), doc);
  const props = root.listNodes().filter(n => n.getMesh() && !n.getSkin()).map(n => n.getName());
  console.log(out, kb(out), props.length ? 'props: ' + props.join(', ') : '');
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

// Merge many small models into one file, one named top-level node per source file.
const MODEL = /\.(gltf|glb)$/;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : MODEL.test(f) ? [p] : []; });
const label = p => basename(p).replace(/(\.gltf)?\.glb$|\.gltf$/, '');
async function pack(id, name, dir, { filter = () => true, group = () => '' } = {}) {
  const files = walk(dir).filter(filter).sort();
  const doc = await io.read(files[0]), root = doc.getRoot();
  const scene = root.listScenes()[0];
  const wrap = (sc, p) => {
    const n = doc.createNode(label(p)).setExtras({ group: group(p) });
    for (const c of sc.listChildren()) { sc.removeChild(c); n.addChild(c); }
    return n;
  };
  const items = [];
  const first = wrap(scene, files[0]); scene.addChild(first); items.push({ name: first.getName(), group: group(files[0]) });
  for (const p of files.slice(1)) {
    mergeDocuments(doc, await io.read(p));
    for (const s of root.listScenes().filter(s => s !== scene)) { const n = wrap(s, p); scene.addChild(n); items.push({ name: n.getName(), group: group(p) }); s.dispose(); }
  }
  for (const a of root.listAnimations()) a.dispose();
  dropLoose(root);
  await doc.transform(prune(), dedup(), unpartition());
  const out = `pack_${id}.glb`;
  await io.write(join(OUT, out), doc);
  console.log(out, items.length, 'models', kb(out));
  index.packs.push({ id, name, file: out, items });
}
const sub = base => p => relative(base, p).split('/').slice(0, -1).join(' / ');
await pack('weapons_adventurers', 'Adventurers gear', join(AD, 'Assets/gltf'));
await pack('weapons_skeletons', 'Skeletons gear', join(SK, 'Assets/gltf'));
const DG = join(SRC, 'KayKit-Dungeon-Remastered-1.0/addons/kaykit_dungeon_remastered/Assets/gltf');
const dgroup = p => { const n = label(p); return n.split('_')[0]; };
await pack('dungeon', 'Dungeon', DG, { group: dgroup });
await pack('halloween', 'Halloween', join(SRC, 'KayKit-Halloween-Bits-1.0/addons/kaykit_halloween_bits/Assets/gltf'), { group: dgroup });
const HX = join(SRC, 'KayKit-Medieval-Hexagon-Pack-1.0/addons/kaykit_medieval_hexagon_pack/Assets/gltf');
await pack('hexagon', 'Medieval Hexagon', HX, { group: sub(HX) });
await pack('forest', 'Forest', join(ZIP('KayKit_Forest_Nature_Pack_1.0_FREE'), 'Assets/gltf'), { group: dgroup });
await pack('resources', 'Resources', join(ZIP('KayKit_ResourceBits_1.0_FREE'), 'Assets/gltf'), { group: dgroup });

writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
console.log('index.json written');
