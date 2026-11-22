// Builds the asset gallery's files in public/gallery/ from the KayKit packs (CC0, by Kay Lousberg).
// The game itself only uses public/models/ (scripts/prep-models.mjs); the gallery is for browsing options.
//
// Usage: clone the packs (github.com/KayKit-Game-Assets/<name>) into one folder, then
//   KAYKIT=/path/to/clones node scripts/prep-gallery.mjs
// Packs: KayKit-Character-Pack-Adventures-1.0, KayKit-Character-Pack-Skeletons-1.0,
//   KayKit-Dungeon-Remastered-1.0, KayKit-Halloween-Bits-1.0, KayKit-Medieval-Hexagon-Pack-1.0
//
// Output:
//   anims_skeletons.glb, anims_adventurers.glb  every clip from each pack, rig only (no meshes)
//   char_<name>.glb                             Adventurers characters, meshes only (Skeletons reuse public/models)
//   pack_<name>.glb                             one file per prop pack; each prop is a top-level node named after its file
//   index.json                                  what the gallery lists
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup, resample, mergeDocuments, unpartition } from '@gltf-transform/functions';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

const SRC = process.env.KAYKIT || '/tmp';
const AD = join(SRC, 'KayKit-Character-Pack-Adventures-1.0/addons/kaykit_character_pack_adventures');
const SK = join(SRC, 'KayKit-Character-Pack-Skeletons-1.0/addons/kaykit_character_pack_skeletons');
const OUT = 'public/gallery';
mkdirSync(OUT, { recursive: true });
const io = new NodeIO();
const index = { anims: {}, chars: [], packs: [] };
const kb = f => Math.round(statSync(join(OUT, f)).size / 1024) + ' KB';

// Every clip, no meshes: the rig's nodes stay so three.js can bind the tracks by bone name.
async function animLib(src, out) {
  const doc = await io.read(src), root = doc.getRoot();
  for (const n of root.listNodes()) if (n.getMesh()) { n.getMesh().dispose(); n.setMesh(null); n.setSkin(null); }
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample(), prune({ keepLeaves: true }), dedup());
  await io.write(join(OUT, out), doc);
  const names = root.listAnimations().map(a => a.getName());
  console.log(out, names.length, 'clips', kb(out));
  return names;
}
index.anims.skeletons = { file: 'anims_skeletons.glb', clips: await animLib(join(SK, 'Characters/gltf/Skeleton_Minion.glb'), 'anims_skeletons.glb') };
index.anims.adventurers = { file: 'anims_adventurers.glb', clips: await animLib(join(AD, 'Characters/gltf/Knight.glb'), 'anims_adventurers.glb') };

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
  index.chars.push({ name: n.replace('_', ' '), file: 'gallery/' + file, anims: 'adventurers', props: await bare(join(AD, `Characters/gltf/${n}.glb`), file) });
}
for (const n of ['Minion', 'Warrior', 'Rogue', 'Mage']) index.chars.push({ name: 'Skeleton ' + n, file: `models/skel_${n.toLowerCase()}.glb`, anims: 'skeletons', props: [] });

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

writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
console.log('index.json written');
