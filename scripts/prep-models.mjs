// Builds the trimmed models in public/models/ from the KayKit packs (CC0, by Kay Lousberg).
// The source packs are large (95 animations per character), so this keeps only what the game uses.
//
// Usage: clone the packs somewhere, then
//   KAYKIT=/path/to/clones node scripts/prep-models.mjs
// where /path/to/clones contains:
//   KayKit-Character-Pack-Skeletons-1.0, KayKit-Character-Pack-Adventures-1.0
//   (github.com/KayKit-Game-Assets/<name>)
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.env.KAYKIT || '/tmp';
const SK = join(SRC, 'KayKit-Character-Pack-Skeletons-1.0/addons/kaykit_character_pack_skeletons');
const AD = join(SRC, 'KayKit-Character-Pack-Adventures-1.0/addons/kaykit_character_pack_adventures');
const OUT = 'public/models';
mkdirSync(OUT, { recursive: true });
const io = new NodeIO();

// Clips the game plays (see src/render/characters.js).
const ENEMY_CLIPS = ['Idle', 'Running_A', 'Walking_A', '1H_Melee_Attack_Chop', '2H_Melee_Attack_Chop', '2H_Melee_Attack_Spin', '2H_Ranged_Shoot', 'Spellcast_Shoot', 'Spellcast_Raise', 'Hit_A', 'Death_A', 'Death_B', 'Cheer'];
const HERO_CLIPS = ['Idle', 'Running_A', 'Spellcast_Shoot', 'Spellcast_Raise', 'Spellcast_Long', 'Hit_A', 'Death_A', 'Dodge_Forward', 'Cheer'];

async function build(src, out, { keep = [], hide = [] } = {}) {
  const doc = await io.read(src), root = doc.getRoot();
  for (const a of root.listAnimations()) {
    if (keep.includes(a.getName())) continue;
    for (const c of a.listChannels()) c.dispose();
    for (const smp of a.listSamplers()) smp.dispose();
    a.dispose();
  }
  // Clips we keep may still share accessors with dropped ones; anything left unreferenced goes.
  for (const acc of root.listAccessors()) if (acc.listParents().every(p => p === root)) acc.dispose();
  for (const n of root.listNodes()) if (hide.includes(n.getName())) n.dispose();
  await doc.transform(prune(), dedup());
  await io.write(join(OUT, out), doc);
  console.log(out, root.listAnimations().map(a => a.getName()).join(', ') || '(no clips)');
}

// The minion carries the shared enemy clips; the other skeletons share its rig, so they ship without clips.
await build(join(SK, 'Characters/gltf/Skeleton_Minion.glb'), 'skel_minion.glb', { keep: ENEMY_CLIPS });
for (const n of ['Warrior', 'Rogue', 'Mage']) await build(join(SK, `Characters/gltf/Skeleton_${n}.glb`), `skel_${n.toLowerCase()}.glb`);
for (const w of ['Blade', 'Axe', 'Crossbow', 'Shield_Large_A', 'Staff']) await build(join(SK, `Assets/gltf/Skeleton_${w}.gltf`), `w_${w.toLowerCase()}.glb`);
// Hero: the Adventurers mage, keeping the staff and hat, dropping the spellbooks and wand.
await build(join(AD, 'Characters/gltf/Mage.glb'), 'hero_mage.glb', { keep: HERO_CLIPS, hide: ['Spellbook', 'Spellbook_open', '1H_Wand'] });
