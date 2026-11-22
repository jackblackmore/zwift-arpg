// Shrines: the Ride 1 shrine at Crypt 1's entrance (a fresh character has no gems), the choice modal, Flex gems starting at Main - 2,
// guard / Flex B shrines, shrines waiting for the next entrance, two pending ones in turn, save/reload, and screenshots.
export default async function ({ open, check, SEED, SHOT }) {
  const { page, errors } = await open('/');
  const r = await page.evaluate(async () => {
    const D = window.__dbg, P = D.P, G = D.G, out = {}, q = s => document.querySelector(s);
    const modal = () => q('#mShrine').classList.contains('show');
    const toShrine = () => { const s = D.shrines().find(s => !s.taken); P.x = s.x - 1; P.z = s.z; P.invuln = 1e9; D.sim(3); return s; };
    const cards = () => [...document.querySelectorAll('#shList .sc')].map(c => c.dataset.id);
    // ---- the Ride 1 shrine ----
    D.start(true); P.invuln = 1e9;
    out.bare = [P.gems.length, Object.keys(P.shrines).length, P.bar.main];
    const s0 = D.shrines()[0];
    out.s0 = s0 && { slot: s0.slot, offer: s0.offer.join(), dEntrance: Math.hypot(s0.x - G.start.x, s0.z - G.start.z), blocked: D.blocked(s0.x, s0.z, .5), inScene: !!s0.g.parent };
    out.closedAtStart = !modal();
    D.sim(30); out.stillClosed = !modal(); // standing at the entrance, a few units away: not yet
    toShrine();
    out.open = [modal(), G.paused, q('#mShrine').hasAttribute('data-sticky'), cards().join(), document.querySelectorAll('#shList .sc .gi').length, document.querySelectorAll('#shList .sc .f').length];
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); out.escKeeps = modal();
    q('#shList .sc[data-id="frostLance"]').click();
    out.picked = { main: D.slotSkill('main'), evade: D.slotSkill('evade'), shrine: P.shrines.main, lvls: P.gems.map(g => g.id + ':' + g.lvl).join(), closed: !modal(), paused: G.paused, taken: D.shrines()[0].taken, gone: !D.shrines()[0].g, left: D.shrines().filter(s => !s.taken).length };
    D.sim(30); out.noReopen = !modal();
    // ---- taken shrines don't come back; none mid-level ----
    D.newLevel(2); out.lv2 = D.shrines().length;
    P.lvl = 5; D.recalc(); out.midLevel = D.shrines().length; // the requirement is met mid-level: it waits
    D.newLevel(2); out.nextEntrance = D.shrines().map(s => s.slot + ':' + s.offer.join('|'));
    // ---- Flex A: starts at Main gem level - 2 ----
    D.slotGem('main').lvl = 6;
    toShrine(); out.flexCards = cards().join();
    q('#shList .sc[data-id="nova"]').click();
    out.flexA = [D.slotSkill('flexA'), D.slotGem('flexA').lvl, P.shrines.flexA, D.slotGem('main').lvl];
    // ---- Guard (L8): level 1, not Main - 2 ----
    P.lvl = 8; D.recalc(); D.newLevel(3); const gs = D.shrines().map(s => s.slot);
    toShrine(); out.guardCards = cards().join();
    q('#shList .sc[data-id="decoy"]').click();
    out.guard = [gs.join(), D.slotSkill('guard'), D.slotGem('guard').lvl, P.shrines.guard];
    // ---- Flex B (L12) with Main at 2: level 1 ----
    P.lvl = 12; D.recalc(); D.slotGem('main').lvl = 2; D.newLevel(4); const bs = D.shrines().map(s => s.slot);
    toShrine(); out.flexBCards = cards().join();
    q('#shList .sc[data-id="meteor"]').click();
    out.flexB = [bs.join(), D.slotSkill('flexB'), D.slotGem('flexB').lvl, P.shrines.flexB];
    D.newLevel(5); out.allDone = D.shrines().length;
    // ---- save and reload: nothing is offered again ----
    D.save(); const keep = JSON.stringify(P.shrines); D.start(false);
    out.reload = [JSON.stringify(P.shrines) === keep, Object.keys(P.shrines).length, D.slotSkill('main'), D.slotSkill('flexA'), D.slotSkill('guard'), D.slotSkill('flexB')];
    D.enterLevel(1); out.reloadShrines = D.shrines().length; D.newLevel(3); out.reloadShrines3 = D.shrines().length;
    // ---- two pending at once: the first shows, the next appears right away once it is taken ----
    D.start(true); P.invuln = 1e9; D.pickShrine(0); P.lvl = 12; D.recalc(); D.newLevel(1);
    const order = [], pos = [];
    for (let k = 0; k < 4; k++) { const s = D.shrines().find(s => !s.taken); if (!s) break; order.push(s.slot); pos.push([s.x, s.z]); out['pend' + k] = D.shrines().filter(s => !s.taken).length; D.pickShrine(1); }
    out.order = order.join(); out.pendAfter = D.shrines().filter(s => !s.taken).length; out.apart = pos.length > 1 && Math.hypot(pos[0][0] - pos[1][0], pos[0][1] - pos[1][1]);
    out.allFour = Object.keys(P.shrines).sort().join();
    // ---- the shrine is the one pending when a slot is already filled: the gem goes to the bag ----
    D.start(true); P.invuln = 1e9; D.pickShrine(0); const m = D.slotGem('main'); P.lvl = 5; D.recalc(); D.equipGem('flexA', D.addGem('arc').uid); D.newLevel(1); D.pickShrine('nova');
    out.filled = [D.slotSkill('flexA'), P.gems.filter(g => g.id === 'nova').length, P.shrines.flexA, !!m];
    return out;
  });
  console.log('  c1 shrines:', JSON.stringify(r));
  check(r.bare[0] === 0 && r.bare[1] === 0 && r.bare[2] === null, `shrines: a fresh character has no gems and no shrines taken (${r.bare})`);
  check(r.s0 && r.s0.slot === 'main' && r.s0.offer === 'fireball,frostLance,skeletons' && r.s0.dEntrance > 3 && r.s0.dEntrance < 7 && !r.s0.blocked && r.s0.inScene, `shrines: the main shrine stands at the Crypt 1 entrance, in the clearing, offering Fireball / Frost Lance / Raise Skeletons (${JSON.stringify(r.s0)})`);
  check(r.closedAtStart && r.stillClosed, 'shrines: the choice does not open until the hero walks up to the shrine');
  check(r.open[0] && r.open[1] && r.open[2] && r.open[3] === 'fireball,frostLance,skeletons' && r.open[4] === 3 && r.open[5] === 3, `shrines: walking up opens a sticky modal with 3 cards, pausing (${r.open})`);
  check(r.escKeeps, 'shrines: Escape cannot dismiss the choice');
  check(r.picked.main === 'frostLance' && r.picked.evade === 'blink' && r.picked.shrine === 'frostLance' && r.picked.lvls === 'frostLance:1,blink:1' && r.picked.closed && !r.picked.paused && r.picked.taken && r.picked.gone && r.picked.left === 0, `shrines: picking Frost Lance equips it in Main and Blink in Evade, closes, resumes (${JSON.stringify(r.picked)})`);
  check(r.noReopen && r.lv2 === 0, `shrines: a taken shrine does not return (new level offers ${r.lv2})`);
  check(r.midLevel === 0 && r.nextEntrance.length === 1 && r.nextEntrance[0] === 'flexA:flameTotem|nova|arc', `shrines: Flex A (level 5) waits for the next entrance, offering Flame Totem / Frost Nova / Arc (${r.midLevel}; ${r.nextEntrance})`);
  check(r.flexCards === 'flameTotem,nova,arc' && r.flexA[0] === 'nova' && r.flexA[1] === 4 && r.flexA[2] === 'nova' && r.flexA[3] === 6, `shrines: the Flex A gem starts at Main level - 2 (Main 6 -> ${r.flexA})`);
  check(r.guard[0] === 'guard' && r.guardCards === 'ward,boneArmour,decoy' && r.guard[1] === 'decoy' && r.guard[2] === 1 && r.guard[3] === 'decoy', `shrines: the Guard shrine (level 8) starts its gem at level 1, not Main - 2 (${r.guard})`);
  check(r.flexB[0] === 'flexB' && r.flexBCards === 'meteor,iceTrap,corpseExplosion' && r.flexB[1] === 'meteor' && r.flexB[2] === 1 && r.flexB[3] === 'meteor', `shrines: the Flex B shrine (level 12) with Main at 2 starts at level 1 (${r.flexB})`);
  check(r.allDone === 0, 'shrines: with all four taken nothing is offered');
  check(r.reload[0] && r.reload[1] === 4 && r.reload.slice(2).join() === 'frostLance,nova,decoy,meteor' && r.reloadShrines === 0 && r.reloadShrines3 === 0, `shrines: they survive save and reload, with no re-offer (${r.reload}, ${r.reloadShrines}, ${r.reloadShrines3})`);
  check(r.order === 'flexA,guard,flexB' && r.pend0 === 1 && r.pend1 === 1 && r.pend2 === 1 && r.pendAfter === 0 && r.allFour === 'flexA,flexB,guard,main', `shrines: with three pending one shows at a time, the next right after (${r.order}, ${r.pend0}${r.pend1}${r.pend2})`);
  check(r.filled[0] === 'arc' && r.filled[1] === 1 && r.filled[2] === 'nova', `shrines: a gem for an already filled slot goes to the bag (${r.filled})`);
  check(errors.length === 0, `shrines: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);

  if (SHOT) {
    const shot = async (name, ms = 2500) => { await new Promise(r => setTimeout(r, ms)); await page.screenshot({ path: SHOT.replace(/\.png$/, `-${name}.png`) }); };
    const fresh = hero => page.evaluate(h => { const D = window.__dbg, P = D.P; document.getElementById('mMenu').classList.remove('show'); D.setRide(false); D.start(true); P.invuln = 1e9; const s = D.shrines()[0]; if (h) { P.x = s.x - 1; P.z = s.z; D.sim(3); } else D.sim(2); D.hud(); D.hud(); }, hero);
    await fresh(false); await shot('shrine-world', 6000); // the altar and its beam at the entrance
    await fresh(true); await shot('shrine'); // 1100x700
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__dbg && window.__dbg.ready && window.__dbg.ready(), { timeout: 20000 });
    await fresh(true); await shot('shrine-phone');
    await page.evaluate(() => { const D = window.__dbg, P = D.P; D.pickShrine(0); P.lvl = 5; D.recalc(); D.slotGem('main').lvl = 5; D.newLevel(1); const s = D.shrines()[0]; P.x = s.x - 1; P.z = s.z; D.sim(3); });
    await shot('shrine-phone-flex');
  }
  await page.close();
}
