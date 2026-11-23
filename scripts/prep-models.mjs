// Builds the trimmed models in public/models/ from the KayKit packs (CC0, by Kay Lousberg).
// The source packs are large (95 animations per character), so this keeps only what the game uses.
//
// Usage: put the packs in one folder, then
//   KAYKIT=/path/to/packs node scripts/prep-models.mjs
// Cloned from github.com/KayKit-Game-Assets/<name>: KayKit-Character-Pack-Skeletons-1.0,
//   KayKit-Character-Pack-Adventures-1.0, KayKit-Dungeon-Remastered-1.0, KayKit-Halloween-Bits-1.0
// Unzipped from kaylousberg.itch.io (free tier) into a folder of its own name: KayKit_Character_Animations_1.1
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { walk, label, mergeModels, animLib, HERO_HIDE } from './gltf-lib.mjs';

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
// Hero: the Adventurers knight with a sword and round shield. (scripts/prep-hero.mjs rebuilds it from the gallery copy without the packs.)
await build(join(AD, 'Characters/gltf/Knight.glb'), 'hero_knight.glb', { keep: HERO_CLIPS, hide: HERO_HIDE });

// Newer clips from Character Animations 1.1 (same rig). They add to, and where names match replace, the clips above.
// Played by src/game/enemies.js and src/render/draw.js.
const AN = join(SRC, 'KayKit_Character_Animations_1.1/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium');
const NEW_CLIPS = [
  'Skeletons_Inactive_Floor_Pose', 'Skeletons_Inactive_Standing_Pose', 'Skeletons_Awaken_Floor', 'Skeletons_Awaken_Standing',
  'Skeletons_Taunt', 'Skeletons_Death', 'Skeletons_Walking', 'Skeletons_Idle', 'Hit_A', 'Hit_B', 'Death_A', 'Death_B',
  'Melee_1H_Attack_Chop', 'Melee_1H_Attack_Slice_Diagonal', 'Melee_1H_Attack_Slice_Horizontal', 'Melee_1H_Attack_Stab',
  'Melee_Unarmed_Attack_Punch_A', 'Melee_Unarmed_Attack_Kick', 'Melee_2H_Attack_Chop', 'Melee_2H_Attack_Slice', 'Melee_2H_Attack_Spin', 'Melee_2H_Idle',
  'Ranged_2H_Shoot', 'Ranged_Magic_Shoot', 'Ranged_Magic_Raise', 'Ranged_Magic_Summon', 'Ranged_Magic_Spellcasting', 'Dodge_Forward',
  'Melee_Block', 'Melee_Blocking', 'Melee_Block_Hit', 'Melee_Block_Attack', 'Dodge_Backward', 'Dodge_Left', 'Dodge_Right', 'Lie_Down', 'Lie_StandUp',
];
await animLib(['General', 'MovementAdvanced', 'CombatMelee', 'CombatRanged', 'Special'].map(n => join(AN, `Rig_Medium_${n}.glb`)), join(OUT, 'anims_new.glb'), { keep: NEW_CLIPS });

// Dungeon dressing (src/world/dungeon.js): Dungeon Remastered pieces plus bones and graves from Halloween Bits.
const DG = join(SRC, 'KayKit-Dungeon-Remastered-1.0/addons/kaykit_dungeon_remastered/Assets/gltf');
const HW = join(SRC, 'KayKit-Halloween-Bits-1.0/addons/kaykit_halloween_bits/Assets/gltf');
const DUNGEON = ['floor_tile_large', 'wall', 'wall_cracked', 'wall_arched', 'wall_broken', 'wall_pillar',
  'pillar', 'pillar_decorated', 'column', 'barrier_column', 'banner_red', 'banner_patternA_red', 'banner_patternC_brown', 'banner_shield_white', 'torch_mounted',
  'barrel_large', 'barrel_small_stack', 'box_large', 'box_stacked', 'crates_stacked', 'keg', 'rubble_large', 'rubble_half', 'chest', 'coin_stack_small', 'candle_triple', 'candle_lit', 'sword_shield_broken'];
const HALLOWEEN = ['bone_A', 'bone_B', 'bone_C', 'skull', 'ribcage', 'gravestone', 'post_skull', 'coffin'];
const pick = (dir, names) => { const all = walk(dir); return names.map(n => { const f = all.find(p => label(p) === n); if (!f) throw new Error('missing ' + n); return f; }); };
await mergeModels([...pick(DG, DUNGEON), ...pick(HW, HALLOWEEN)], join(OUT, 'dungeon.glb'));
