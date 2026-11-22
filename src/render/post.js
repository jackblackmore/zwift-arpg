// Post-processing and quality levels.
//   high:   bloom + vignette/grade + soft shadows
//   medium: bloom at half resolution + vignette/grade, no shadows (default on touch devices)
//   low:    plain render (old phones)
import * as T from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { renderer, scene, cam, V, moon } from './scene.js';
import { BLOOM, SHADOW } from '../data/graphics.js';

export const LEVELS = ['low', 'medium', 'high'];
const KEY = 'wd-quality';
let stored = null; try { stored = localStorage.getItem(KEY); } catch (e) {}
export const Q = { level: LEVELS.includes(stored) ? stored : matchMedia('(pointer:coarse)').matches ? 'medium' : 'high' };

// Vignette plus a slight warm, contrasty grade.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, vig: { value: BLOOM.vignette } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      col = (col - 0.5) * 1.08 + 0.5;                 // contrast
      col *= vec3(1.05, 1.0, 0.94);                   // warm
      float d = distance(vUv, vec2(0.5));
      col *= mix(1.0, smoothstep(0.85, 0.25, d), vig); // vignette
      gl_FragColor = vec4(max(col, 0.0), c.a);
    }`,
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new T.Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
composer.addPass(bloom);
composer.addPass(new ShaderPass(GradeShader));

export function applyQuality() {
  const hi = Q.level === 'high';
  renderer.shadowMap.enabled = hi; renderer.shadowMap.type = T.PCFSoftShadowMap;
  moon.castShadow = hi;
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
  resizePost();
  try { localStorage.setItem(KEY, Q.level); } catch (e) {}
}
export function cycleQuality() { Q.level = LEVELS[(LEVELS.indexOf(Q.level) + 1) % LEVELS.length]; applyQuality(); return Q.level; }

addEventListener('resize', () => resizePost());
export function resizePost() {
  const dpr = renderer.getPixelRatio();
  composer.setSize(V.W, V.H);
  // Bloom at reduced resolution keeps it cheap; medium halves it again.
  const k = Q.level === 'high' ? .5 : .25;
  bloom.setSize(Math.max(64, V.W * dpr * k | 0), Math.max(64, V.H * dpr * k | 0));
}

// The moon light casts shadows in a box that follows the player.
moon.shadow.mapSize.set(SHADOW.map, SHADOW.map);
Object.assign(moon.shadow.camera, { left: -SHADOW.box, right: SHADOW.box, top: SHADOW.box, bottom: -SHADOW.box, near: 1, far: 60 });
moon.shadow.bias = -.0015;
scene.add(moon.target);
const MOON = new T.Vector3(-9, 20, 7);
export function render(px, pz) {
  moon.position.set(px + MOON.x, MOON.y, pz + MOON.z); moon.target.position.set(px, 0, pz);
  if (Q.level === 'low') renderer.render(scene, cam); else composer.render();
}
