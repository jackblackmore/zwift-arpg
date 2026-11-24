// Melee Main attacks: the Sword (the plain starting attack), Ember Cleave, Frost Strike and Thunder Slam (data/gems.js GEMS with `melee`; tuning in data/skills.js SK,
// milestones in GEMS[id].mile, supports in SUPPORTS). One module drives all three from data.
// A swing faces the aim point (game/skills.js aim; the auto-attack in game/gems.js sets it to its target) and lands `windup` s later
// from where you stand then: a cone in front of you (Cleave, Strike) or a circle in front of you (Slam). A connecting swing gives a
// little hit-stop and knockback (small, so monsters stay in reach).
import { G, P, S, shake, stop } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { GEMS, SUPPORTS } from '../../data/gems.js';
import { EXTRA } from '../../data/items.js';
import { HERO } from '../../data/balance.js';
import { rand, pick, dist } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { flashLight } from '../../render/scene.js';
import { sparks, glows, emit, ringFx, flashFx, floatT } from '../../render/fx.js';
import { near } from '../enemies.js';
import { hit, addPatch } from '../combat.js';
import { aim, castArc } from '../skills.js';

const COL = { phys: [0xe8ecf4, 0xffffff, 0xb0b8c8], fire: [0xff8a3c, 0xffd060, 0xff4a10], cold: [0xbff0ff, 0xffffff, 0x7fd8ff], light: [0xe0c8ff, 0xb06bff, 0xffffff] };
const wrap = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
// How fast you swing now (gear, tree, effort and Surge), for the windup.
const rate = () => S.cast * ((P.eff && P.eff.cast) || 1);

// The shape a gem's swing covers, with its milestone and supports: { cone: [reach, half-angle] } or { circle: [ahead, radius] }.
export function shape(id) {
  const K = SK[id], M = S.mile && S.mile[id] ? GEMS[id].mile : {};
  if (id === 'slam') return { circle: [K.reach, K.radius * (M.radius || 1) * S.aoe] };
  const half = S.sk[id].sweep ? Math.PI : K.arc * (M.arc || 1) / 2 * Math.PI / 180;
  return { cone: [K.reach * (M.reach || 1) * Math.sqrt(S.aoe), half] };
}
// Monsters a swing from (x, z) facing angle `a` hits.
export function targets(id, x, z, a) {
  const sh = shape(id), out = [];
  if (sh.circle) { const [ahead, r] = sh.circle, cx = x + Math.sin(a) * ahead, cz = z + Math.cos(a) * ahead; near(cx, cz, r, e => out.push(e)); return { list: out, cx, cz, r }; }
  const [reach, half] = sh.cone;
  near(x, z, reach, e => {
    const d = dist(e.x, e.z, x, z), off = Math.abs(wrap(Math.atan2(e.x - x, e.z - z) - a));
    if (off <= half || d < e.r + P.r + .25 || (off - half < Math.PI / 2 && Math.sin(off - half) * d < e.r)) out.push(e); // in the cone, hugging you, or its body pokes in
  });
  return { list: out, cx: x + Math.sin(a) * reach * .55, cz: z + Math.cos(a) * reach * .55, r: reach, half };
}

export function strike(id) {
  const [ax, az] = aim(), a = Math.atan2(ax - P.x, az - P.z), n = P.atkN = (P.atkN || 0) + 1, tok = P.swingTok;
  P.face = a; P.castAnim = .3; P.castSeq++; P.lastCast = id; SFX.swing();
  G.queue.push({ k: 'later', t: SK[id].windup / rate(), fn: () => { if (P.swingTok === tok) land(id, a, n, 1); } });
  return true;
}
// Raising the shield or rolling drops the swing being wound up (game/sk/guard.js, game/sk/roll.js) and frees the next one.
export function cancelSwing() { P.swingTok = (P.swingTok || 0) + 1; P.castT = 0; P.castAnim = 0; }

// The hit. n: which swing this is (Frost Strike's milestone, Heart of the Storm). mult: × the damage (Aftershock's echo).
function land(id, a, n, mult, at) {
  if (P.dead > 0) return;
  const K = SK[id], k = S.sk[id], D = GEMS[id], elem = D.elem, M = S.mile && S.mile[id] ? D.mile : null, c = COL[elem];
  const T = at ? { list: [], ...at } : targets(id, P.x, P.z, a);
  if (at) near(at.cx, at.cz, at.r, e => T.list.push(e));
  const freezeNow = id === 'fstrike' && M && n % M.every === 0 && mult === 1;
  // A riposte: the first swing to connect after a parry (data/skills.js SK.block) hits harder (and so staggers more).
  const rip = mult === 1 && !at && T.list.length && P.riposteT > 0 ? P.riposteMul || SK.block.riposte : 1; // the shield art in Guard can change it (SK[art].guard)
  if (rip > 1) { P.riposteT = 0; floatT(P.x, 2.6, P.z, 'RIPOSTE', '#ffd23f', 15); }
  for (const e of T.list) {
    const d = dist(e.x, e.z, P.x, P.z) || 1, dmg = hit(e, K.mult * mult * rip, elem, { gem: id, kx: (e.x - P.x) / d, kz: (e.z - P.z) / d, kb: K.kb });
    if (e.deathT) continue;
    if (k.ignite) { const IG = SUPPORTS.ignite; e.burnT = IG.dur; e.burnDps = Math.max(e.burnDps, dmg * IG.share / IG.dur); }
    if (K.chill) e.chill = Math.max(e.chill, K.chill);
    if (freezeNow) { if (e.type === 'boss') e.chill = Math.max(e.chill, SK.nova.bossChill); else e.freeze = Math.max(e.freeze, M.freeze * S.freeze); }
    if (k.brittle) shock(e, SUPPORTS.brittle.dur, SUPPORTS.brittle.taken);
    if (K.shockChance && Math.random() < K.shockChance) shock(e, SK.arc.shockT, SK.arc.shockMore);
  }
  // Effects: a sweep of sparks along the arc, or a ring where the slam lands.
  if (T.half !== undefined) {
    for (let i = 0; i < 16; i++) {
      const t = a + (i / 15 - .5) * 2 * T.half, rr = T.r * rand(.6, .95), x = P.x + Math.sin(t) * rr, z = P.z + Math.cos(t) * rr;
      emit(sparks, x, rand(.6, 1.3), z, Math.cos(t) * 3, rand(.5, 2), -Math.sin(t) * 3, rand(.2, .35), pick(c), 2, 2);
    }
    flashFx(T.cx, 1, T.cz, c[0], T.r * 1.4, .12);
  } else {
    ringFx(T.cx, T.cz, T.r, c[0], .3, .3); flashFx(T.cx, .5, T.cz, c[1], T.r * 2.2, .2);
    for (let i = 0; i < 26; i++) { const t = rand(0, 6.28), s = rand(3, 8); emit(sparks, T.cx, .3, T.cz, Math.cos(t) * s, rand(1, 4), Math.sin(t) * s, rand(.3, .5), pick(c), 6, 2); }
    flashLight(T.cx, T.cz, c[1], 3, .2); SFX.slam(); shake(.15 * mult);
  }
  if (T.list.length) {
    if (mult === 1) P.life = Math.min(S.maxLife, P.life + S.loh * Math.min(T.list.length, HERO.lifeOnHitMax)); // life on hit
    stop(K.stop * mult); SFX.thud(); if (T.half !== undefined) shake(.04);
    if (k.burnGround) addPatch(T.cx, T.cz, EXTRA.burnGround.r * S.aoe, EXTRA.burnGround.dur, id);
    if (S.storm && mult === 1 && n % EXTRA.storm.every === 0) { const e = T.list[0]; castArc(e.x, e.z, true); }
  }
  for (let i = 0; i < 3; i++) emit(glows, T.cx + rand(-.4, .4), .8, T.cz + rand(-.4, .4), 0, rand(.5, 1.5), 0, rand(.2, .4), c[0], 0, 1);
  if (k.aftershock && !at) { const A = SUPPORTS.aftershock, spot = { cx: T.cx, cz: T.cz, r: T.r }; G.queue.push({ k: 'later', t: A.delay, fn: () => land(id, a, n, A.mult, spot) }); }
}
// Shock-like statuses (Arc's shock, Brittle): the strongest one running wins.
function shock(e, t, more) { e.shockMore = e.shock > 0 ? Math.max(e.shockMore || 0, more) : more; e.shock = Math.max(e.shock, t); }
