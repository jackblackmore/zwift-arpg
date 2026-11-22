// Asset gallery: browse every KayKit model and animation we've imported (public/gallery/, made by scripts/prep-gallery.mjs).
// It's a viewer for choosing what to use in the game, so it stands alone and doesn't touch the game's state or input.
import './gallery.css';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CHAR_BRIGHTNESS } from '../data/graphics.js';

const $ = id => document.getElementById(id);
const ROOT = new URL('../', location.href).href; // the site root, where models/ and gallery/ live
const loader = new GLTFLoader();
const cache = {};
const load = f => cache[f] || (cache[f] = new Promise((res, rej) => loader.load(ROOT + f, res, undefined, rej)));
// Same as the game: lighting is tuned for linear output, so show textures as authored.
const linearise = root => root.traverse(o => { if (o.material?.map) { o.material.map.encoding = T.LinearEncoding; o.material.map.needsUpdate = true; } });

// ---- scene ----
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
$('view').appendChild(renderer.domElement);
const scene = new T.Scene(); scene.background = new T.Color(0x14100e);
const cam = new T.PerspectiveCamera(40, 1, .05, 400);
const controls = new OrbitControls(cam, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .12; controls.screenSpacePanning = true;
scene.add(new T.HemisphereLight(0xfff2e0, 0x3a3028, .9));
const sun = new T.DirectionalLight(0xffffff, .75); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun, sun.target);
const ground = new T.Mesh(new T.CircleGeometry(1, 64), new T.MeshLambertMaterial({ color: 0x2a221c })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const stage = new T.Group(); scene.add(stage);
const clock = new T.Clock();
let mixer = null;

// Centre the subject in the part of the screen the panel doesn't cover (right side on desktop, bottom on phones).
const wide = () => innerWidth >= 900;
function resize() {
  const W = innerWidth, H = innerHeight;
  renderer.setSize(W, H); cam.aspect = W / H;
  if (wide()) cam.setViewOffset(W, H, 190, 0, W, H); else cam.setViewOffset(W, H, 0, H * .19, W, H);
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
function frame() { const dt = Math.min(.05, clock.getDelta()); if (mixer) mixer.update(dt); controls.update(); renderer.render(scene, cam); requestAnimationFrame(frame); }
requestAnimationFrame(frame);

// Fit the camera, ground and shadow to whatever is on stage. keep: don't move the camera (e.g. changing clips).
function frameStage(keep) {
  const box = new T.Box3().setFromObject(stage), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  const r = Math.max(size.x, size.z, size.y * .8, .3);
  ground.scale.setScalar(r * 1.6 + 1); ground.position.set(c.x, box.min.y - .001, c.z);
  sun.position.set(c.x - r, c.y + r * 2.5, c.z + r * 1.2); sun.target.position.copy(c);
  const sc = sun.shadow.camera; sc.left = sc.bottom = -r * 1.2; sc.right = sc.top = r * 1.2; sc.near = .1; sc.far = r * 6; sc.updateProjectionMatrix();
  if (keep) return;
  const visW = wide() ? innerWidth - 380 : innerWidth, visH = wide() ? innerHeight : innerHeight * .58;
  const d = r / Math.tan(cam.fov * Math.PI / 360) * Math.max(.75, .62 * innerHeight / Math.min(visW, visH * 1.2));
  controls.target.copy(c); cam.position.set(c.x, c.y + d * .55, c.z + d); cam.near = d / 200; cam.far = d * 20; cam.updateProjectionMatrix();
}
function clearStage() { mixer = null; while (stage.children.length) stage.remove(stage.children[0]); }

// ---- state ----
const st = { tab: 'chars', idx: 0, set: 'anim11', clip: 'Idle_A', speed: 1, props: {}, handR: '', handL: '', group: {}, item: {} };
let IDX = null, R = null; // R: the character on stage { root, acts, bone }
const shown = { name: '' };

// Animation sets that fit a character's rig, and a clip to fall back on when the current one isn't in the set.
const setsFor = ch => Object.keys(IDX.anims).filter(k => IDX.anims[k].rig === ch.rig);
const idleOf = clips => clips.find(c => c === 'Idle' || c === 'Idle_A') || clips[0];
function fitSet() {
  const ch = IDX.chars[st.idx], ok = setsFor(ch);
  if (!ok.includes(st.set)) st.set = ok[0];
  const clips = IDX.anims[st.set].clips; if (!clips.includes(st.clip)) st.clip = idleOf(clips);
}

async function showChar(keepCam) {
  fitSet();
  const ch = IDX.chars[st.idx], lib = IDX.anims[st.set];
  const [g, a] = await Promise.all([load(ch.file), load('gallery/' + lib.file)]);
  if (IDX.chars[st.idx] !== ch) return;
  linearise(g.scene); clearStage();
  const root = SkeletonUtils.clone(g.scene);
  const box = new T.Box3().setFromObject(g.scene); root.scale.setScalar(2 / ((box.max.y - box.min.y) || 2));
  root.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false; o.material = o.material.clone(); if (o.material.name !== 'Glow') o.material.color.multiplyScalar(CHAR_BRIGHTNESS); });
  const bone = n => { let b = null; root.traverse(o => { if (!b && o.name === n) b = o; }); return b; };
  // Props that ship inside the character (spare weapons, shields, hats): only the hat, helmet and cape show by default.
  if (!st.props[ch.name]) st.props[ch.name] = Object.fromEntries(ch.props.map(p => [p, /Hat|Helmet|Cape/.test(p)]));
  for (const p of ch.props) { const n = bone(p); if (n) n.visible = st.props[ch.name][p]; }
  for (const [val, slot] of [[st.handR, 'handslot.r'], [st.handL, 'handslot.l']]) {
    if (!val) continue;
    const [pk, i] = val.split(':'), pg = await load('gallery/' + IDX.packs.find(p => p.id === pk).file);
    linearise(pg.scene); const m = pg.scene.children[+i].clone(); m.traverse(o => { if (o.isMesh) o.castShadow = true; });
    bone(slot)?.add(m);
  }
  stage.add(root);
  mixer = new T.AnimationMixer(root);
  const clip = a.animations.find(c => c.name === st.clip) || a.animations.find(c => c.name === idleOf(lib.clips));
  st.clip = clip.name;
  const act = mixer.clipAction(clip); act.timeScale = st.speed; act.play();
  R = { root, clip };
  shown.name = `${ch.name} · ${clip.name} (${clip.duration.toFixed(2)}s)`;
  frameStage(keepCam); label();
}

// Props: one item on its own, or a whole group laid out in rows at true scale.
async function showPack(keepCam) {
  const pk = IDX.packs.find(p => p.id === st.tab), g = await load('gallery/' + pk.file);
  if (st.tab !== pk.id) return;
  linearise(g.scene); clearStage(); R = null;
  const grp = st.group[pk.id] || '', item = st.item[pk.id];
  const list = item != null ? [item] : pk.items.map((it, i) => i).filter(i => !grp || pk.items[i].group === grp);
  const objs = list.map(i => { const m = g.scene.children[i].clone(); m.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); return m; });
  const boxes = objs.map(o => new T.Box3().setFromObject(o));
  const gap = .4, area = boxes.reduce((s, b) => { const z = b.getSize(new T.Vector3()); return s + (z.x + gap) * (z.z + gap); }, 0), rowW = Math.sqrt(area) * 1.2;
  let x = 0, z = 0, depth = 0;
  objs.forEach((o, k) => {
    const b = boxes[k], s = b.getSize(new T.Vector3());
    if (x > 0 && x + s.x > rowW) { x = 0; z += depth + gap; depth = 0; }
    o.position.set(x - b.min.x, -b.min.y, z - b.min.z); stage.add(o);
    x += s.x + gap; depth = Math.max(depth, s.z);
  });
  shown.name = item != null ? pk.items[item].name : `${pk.name}${grp ? ' · ' + grp : ''} · ${list.length} models`;
  frameStage(keepCam); label();
}

// ---- UI ----
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const chip = (act, val, text, on) => `<button class="chip${on ? ' on' : ''}" data-a="${act}" data-v="${esc(val)}">${esc(text)}</button>`;
const sec = (title, body) => `<section><h4>${title}</h4><div class="chips">${body}</div></section>`;
function label() { $('label').textContent = shown.name; }

function tabs() {
  const t = [['chars', 'Characters'], ...IDX.packs.map(p => [p.id, p.name])];
  $('tabs').innerHTML = t.map(([id, n]) => chip('tab', id, n, st.tab === id)).join('');
}
function panel() {
  let h = '';
  if (st.tab === 'chars') {
    fitSet();
    const ch = IDX.chars[st.idx], lib = IDX.anims[st.set];
    h += sec('Character', IDX.chars.map((c, i) => chip('char', i, c.name, i === st.idx)).join(''));
    h += sec('Animation set', setsFor(ch).map(k => chip('set', k, `${IDX.anims[k].name} (${IDX.anims[k].clips.length})`, st.set === k)).join('') +
      [.25, .5, 1, 1.5].map(s => chip('speed', s, s + '×', st.speed === s)).join(''));
    h += sec('Animation', lib.clips.map(c => chip('clip', c, c.replace(/_/g, ' '), c === st.clip)).join(''));
    if (ch.props.length) h += sec('Built-in props', ch.props.map(p => chip('prop', p, p.replace(/_/g, ' '), st.props[ch.name]?.[p])).join(''));
    const gear = IDX.packs.filter(p => p.id.startsWith('weapons'));
    const opts = cur => '<option value="">(nothing)</option>' + gear.map(p => `<optgroup label="${esc(p.name)}">${p.items.map((it, i) => `<option value="${p.id}:${i}"${cur === p.id + ':' + i ? ' selected' : ''}>${esc(it.name)}</option>`).join('')}</optgroup>`).join('');
    h += `<section><h4>Hold</h4><div class="chips"><label>Right hand <select data-a="handR">${opts(st.handR)}</select></label><label>Left hand <select data-a="handL">${opts(st.handL)}</select></label></div></section>`;
  } else {
    const pk = IDX.packs.find(p => p.id === st.tab), grp = st.group[pk.id] || '', item = st.item[pk.id];
    const groups = [...new Set(pk.items.map(i => i.group).filter(Boolean))];
    if (groups.length > 1) h += sec('Group', chip('group', '', 'All', !grp) + groups.map(g => chip('group', g, g, g === grp)).join(''));
    h += sec('Models · tap one to look at it alone', chip('item', '', 'Show all', item == null) +
      pk.items.map((it, i) => [it, i]).filter(([it]) => !grp || it.group === grp).map(([it, i]) => chip('item', i, it.name.replace(/_/g, ' '), i === item)).join(''));
  }
  $('panel').innerHTML = h;
}
async function show(keepCam) {
  $('status').style.display = ''; $('status').textContent = 'LOADING…';
  try { await (st.tab === 'chars' ? showChar(keepCam) : showPack(keepCam)); $('status').style.display = 'none'; }
  catch (e) { $('status').textContent = 'Failed to load: ' + (e?.message || e); console.error(e); }
}
function act(a, v) {
  const ch = IDX.chars[st.idx];
  if (a === 'tab') { st.tab = v; tabs(); panel(); return show(); }
  if (a === 'char') { st.idx = +v; panel(); return show(true); }
  if (a === 'set') { st.set = v; fitSet(); panel(); return show(true); }
  if (a === 'speed') { st.speed = +v; panel(); if (mixer && R) mixer.existingAction(R.clip).timeScale = st.speed; return; }
  if (a === 'clip') { st.clip = v; panel(); return show(true); }
  if (a === 'prop') { st.props[ch.name][v] = !st.props[ch.name][v]; panel(); return show(true); }
  if (a === 'handR' || a === 'handL') { st[a] = v; return show(true); }
  if (a === 'group') { st.group[st.tab] = v; st.item[st.tab] = null; panel(); return show(); }
  if (a === 'item') { st.item[st.tab] = v === '' ? null : +v; panel(); return show(); }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && b.tagName === 'BUTTON') act(b.dataset.a, b.dataset.v); });
document.addEventListener('change', e => { const s = e.target.closest('select[data-a]'); if (s) act(s.dataset.a, s.value); });

// ---- boot ----
const boot = fetch(ROOT + 'gallery/index.json').then(r => r.json()).then(async j => { IDX = j; tabs(); panel(); await show(); });

// Testing hooks (tests/sim.mjs).
window.__gal = {
  st, act, boot, idx: () => IDX, shown,
  ready: () => !!IDX && $('status').style.display === 'none',
  onStage: () => { let meshes = 0; stage.traverse(o => { if (o.isMesh) meshes++; }); return { top: stage.children.length, meshes, playing: !!mixer }; },
};
