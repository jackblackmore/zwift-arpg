// Workstream E: the passive tree. Allocation rules, refunds and reset, one point per level, stat sums, the movement speed cap, Surge capacity,
// the four keystones (Blood Rite, Glass Cannon, Fortress, Deep Reserves), old-save refund, save round trip and the tree panel.
// Screenshots with SHOT: -tree.png (desktop) and -tree-phone.png (390x844 touch).
export default async function ({ open, check, SEED, SHOT }) {
  // Shared page helpers: a hero at level L with the given points, and allocation along a path of node ids.
  const HELPERS = () => {
    const D = window.__dbg, P = D.P;
    window.E = {
      hero(L, pts) { D.start(true); P.lvl = L; P.pts = pts; P.tree = {}; D.recalc(); P.invuln = 1e9; D.G.enemies.length = 0; },
      path(ids) { return ids.map(id => D.treeAlloc(id)); },
    };
  };
  const PATH = {
    bloodRite: ['core9', 'core10', 'core11', 'F1', 'F2', 'F3', 'F4', 'F5', 'bloodRite'],
    glassCannon: ['core5', 'L1', 'L2', 'L3', 'L4', 'L5', 'glassCannon'],
    fortress: ['core13', 'core14', 'core15', 'C1', 'C2', 'C3', 'C4', 'C5', 'fortress'],
    deepReserves: ['core5', 'core4', 'core3', 'S1', 'S2', 'overflow'],
  };

  // ---------- rules ----------
  {
    const { page, errors } = await open('/');
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, out = {};
      E.hero(1, 0);
      out.noPts = D.treeAlloc('core1'); out.noPtsWhy = D.treeAllocReason('core1');
      // one point per level
      D.gainXp(D.xpNeed(1)); D.gainXp(D.xpNeed(2)); out.lvl = P.lvl; out.pts = P.pts;
      E.hero(20, 19);
      const base = S.maxLife;
      out.notAdj = D.treeAlloc('F2'); out.notAdjWhy = D.treeAllocReason('F2');
      out.core1 = D.treeAlloc('core1'); out.ptsAfter = P.pts; out.life = [base, S.maxLife];
      out.again = D.treeAlloc('core1');
      // a fire node raises S.fire by exactly its value
      const f0 = S.fire; E.path(['core9', 'core10', 'core11', 'F1']); out.fire = [f0, S.fire];
      // refund a leaf, then refuse a node others depend on
      out.leafRefund = D.treeRefund('F1'); out.afterLeaf = [S.fire, P.pts, !!P.tree.F1];
      D.treeAlloc('F1'); const snap = JSON.stringify(P.tree), pts = P.pts;
      out.cutWhy = D.treeRefundReason('core10'); out.cut = D.treeRefund('core10'); out.cutSame = JSON.stringify(P.tree) === snap && P.pts === pts;
      out.startRefund = D.treeRefund('heart');
      // reset refunds everything
      D.treeReset(); out.reset = [P.pts, Object.keys(P.tree).join(), S.fire];
      // movement speed: tree + gear is capped at +50%
      E.hero(20, 19); D.treeAlloc('core5'); out.msTree = S.ms / 5.4 - 1;
      P.gear.boots = { id: 9001, slot: 'boots', rar: 3, base: 'x', name: 'Test Boots', il: 1, mods: [['ms', .6]] }; D.recalc(); out.msCap = S.ms / 5.4 - 1;
      delete P.gear.boots; D.recalc(); out.msBack = S.ms / 5.4 - 1;
      // the tree never names a skill: no node mentions a skill id
      out.skillIds = Object.values(D.TREE).some(n => /fireball|nova|ward|blink|arc|lance|meteor|totem/i.test(JSON.stringify(n.stats)));
      return out;
    });
    console.log('  tree rules:', JSON.stringify(r));
    check(r.lvl === 3 && r.pts === 2, `tree: one point per level (level ${r.lvl}, points ${r.pts})`);
    check(!r.noPts && /point/i.test(r.noPtsWhy), `tree: nothing without a free point (${r.noPtsWhy})`);
    check(!r.notAdj && /connected/i.test(r.notAdjWhy), `tree: only nodes next to an allocated one (${r.notAdjWhy})`);
    check(r.core1 && r.ptsAfter === 18 && !r.again, `tree: allocating costs a point and cannot repeat (points ${r.ptsAfter})`);
    check(r.life[1] === r.life[0] + 12 && true, `tree: a life node adds its value (${r.life})`);
    check(Math.abs(r.fire[1] - r.fire[0] - .08) < 1e-9, `tree: allocating a fire node raises fire damage by its value (${r.fire})`);
    check(r.leafRefund && r.afterLeaf[0] === r.fire[0] && !r.afterLeaf[2] && r.afterLeaf[1] === 19 - 5 + 1, `tree: refunding a leaf gives the point back and removes its stats (${r.afterLeaf})`);
    check(!r.cut && r.cutSame && /depend/i.test(r.cutWhy) && !r.startRefund, `tree: a node that others hang from cannot be refunded (${r.cutWhy})`);
    check(r.reset[0] === 19 && r.reset[1] === 'heart' && r.reset[2] === r.fire[0], `tree: reset refunds every point (${r.reset})`);
    check(Math.abs(r.msTree - .04) < 1e-9 && Math.abs(r.msCap - .5) < 1e-9 && Math.abs(r.msBack - .04) < 1e-9, `tree: movement speed from tree and gear is capped at +50% (${r.msTree} ${r.msCap} ${r.msBack})`);
    check(!r.skillIds, 'tree: no node names a skill');
    check(errors.length === 0, `tree: no page errors on rules${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- keystones ----------
  {
    const { page, errors } = await open('/');
    await page.evaluate(HELPERS);
    const PATHS = JSON.stringify(PATH);
    const r = await page.evaluate(PATHS => {
      const D = window.__dbg, P = D.P, S = D.S, out = {}, PATH = JSON.parse(PATHS), onBar = u => Object.values(P.bar).includes(u);
      // Blood Rite
      E.hero(15, 50); D.kit({ main: 'fireball', flexA: 'nova' }); P.lvl = 15; D.recalc();
      out.riteOk = E.path(PATH.bloodRite).every(Boolean); out.rite = S.bloodRite;
      P.cd.flexA = 0; P.life = S.maxLife; const l0 = P.life;
      out.c1 = D.castSlot('flexA'); out.c2 = D.castSlot('flexA'); out.cd = P.cd.flexA; out.cost = (l0 - P.life) / S.maxLife / 2;
      P.life = 2; out.low = D.castSlot('flexA'); out.lowLife = P.life;
      D.treeRefund('bloodRite'); out.riteGone = S.bloodRite; P.life = S.maxLife; P.cd.flexA = 0; D.castSlot('flexA'); out.cdBack = P.cd.flexA;
      // Glass Cannon
      E.hero(15, 50); D.kit({ main: 'fireball', flexA: 'nova', guard: 'ward' }); P.lvl = 15; D.recalc();
      const lance = D.addGem('frostLance'), ward = P.gems.find(g => g.id === 'ward'), life0 = S.maxLife, more0 = S.more;
      out.gcBefore = D.equipGem('guard', lance.uid);
      out.gcOk = E.path(PATH.glassCannon).every(Boolean);
      out.gcKick = P.bar.guard === null && !onBar(ward.uid) && P.gems.includes(ward);
      out.gcEquip = D.equipGem('guard', lance.uid) && P.bar.guard === lance.uid; out.gcWard = D.equipGem('guard', ward.uid);
      out.gcStats = [life0, S.maxLife, more0, S.more];
      D.treeRefund('glassCannon'); out.gcBack = [P.bar.guard, S.more, S.maxLife === life0 - 0 || S.maxLife]; out.gcLanceBag = !onBar(lance.uid);
      out.gcWardAgain = D.equipGem('guard', ward.uid);
      // Fortress
      E.hero(15, 50); D.kit({ main: 'fireball' }); P.lvl = 15; D.recalc();
      const w2 = D.addGem('ward'); out.fBefore = D.equipGem('flexB', w2.uid);
      out.fOk = E.path(PATH.fortress).every(Boolean); const cold = S.cold;
      out.fEquip = D.equipGem('flexB', w2.uid) && P.bar.flexB === w2.uid; out.fStats = [S.dr, S.more];
      D.treeRefund('fortress'); out.fBack = [P.bar.flexB, S.dr, S.more];
      // Deep Reserves: bigger gauge (RIDE), slower cooldowns
      E.hero(15, 50); D.kit({ main: 'fireball', flexA: 'nova' }); P.lvl = 15; D.recalc(); D.setRide(true); D.pollRide(.03); D.G.enemies.length = 0;
      const max0 = P.surge.max; P.surge.v = max0 / 2; P.cd.flexA = 0; D.castSlot('flexA'); const cd0 = P.cd.flexA;
      out.drOk = E.path(PATH.deepReserves).every(Boolean); out.surgeCap = S.surgeCap; for (let i = 0; i < 3; i++) { D.pollRide(.03); D.sim(1); }
      out.gauge = [max0, P.surge.max, P.surge.v / P.surge.max];
      P.cd.flexA = 0; D.castSlot('flexA'); out.cdRatio = P.cd.flexA / cd0;
      D.treeRefund('overflow'); for (let i = 0; i < 3; i++) { D.pollRide(.03); D.sim(1); } out.gaugeBack = [P.surge.max / max0, S.cdMore];
      D.setRide(false);
      return out;
    }, PATHS);
    console.log('  tree keystones:', JSON.stringify(r));
    check(r.riteOk && r.rite > 0 && r.rite <= .15, `keystone: Blood Rite sets S.bloodRite (${r.rite})`);
    check(r.c1 && r.c2 && r.cd === 0 && Math.abs(r.cost - r.rite) < .005, `keystone: Blood Rite casts Flex A back to back with no cooldown, each costing ${(r.rite * 100).toFixed(0)}% life (cost ${(r.cost * 100).toFixed(1)}%)`);
    check(!r.low && r.lowLife === 2, 'keystone: Blood Rite refuses a cast that would kill');
    check(r.riteGone === 0 && r.cdBack > 5, `keystone: unallocating Blood Rite brings the cooldown back (${r.cdBack})`);
    check(!r.gcBefore && r.gcOk && r.gcKick, 'keystone: Glass Cannon sends the guard gem back to the bag');
    check(r.gcEquip && !r.gcWard, 'keystone: Glass Cannon lets an attack gem into Guard (and not a guard gem)');
    check(r.gcStats[3] === 1.4 && r.gcStats[1] < r.gcStats[0] * .65 && r.gcStats[1] > r.gcStats[0] * .55, `keystone: Glass Cannon raises damage (${r.gcStats[2]} to ${r.gcStats[3]}) and drops max life (${r.gcStats[0]} to ${r.gcStats[1]})`);
    check(r.gcBack[0] === null && r.gcBack[1] === 1 && r.gcLanceBag && r.gcWardAgain, 'keystone: unallocating Glass Cannon restores the slot (the attack gem goes to the bag)');
    check(!r.fBefore && r.fOk && r.fEquip && Math.abs(r.fStats[0] - .1) < 1e-9 && Math.abs(r.fStats[1] - .8) < 1e-9, `keystone: Fortress turns Flex B into a guard slot, 10% less damage taken, 20% less damage (${r.fStats})`);
    check(r.fBack[0] === null && r.fBack[1] === 0 && r.fBack[2] === 1, 'keystone: unallocating Fortress restores Flex B');
    check(r.drOk && r.gauge[1] > r.gauge[0] * 1.5 && Math.abs(r.gauge[2] - .5) < .01, `keystone: Deep Reserves enlarges the Surge gauge keeping the fill (${r.gauge})`);
    check(Math.abs(r.cdRatio - 1.15) < .001, `keystone: Deep Reserves makes cooldowns 15% slower (x${r.cdRatio})`);
    check(Math.abs(r.gaugeBack[0] - 1.06) < .001 && r.gaugeBack[1] === 1, `keystone: unallocating Deep Reserves shrinks the gauge back (${r.gaugeBack})`);
    check(errors.length === 0, `tree: no page errors on keystones${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- old saves, save round trip ----------
  {
    const { page, errors } = await open('/');
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {}, toasts = () => document.getElementById('toasts').textContent;
      const old = { itemId: 100, lvl: 6, xp: 0, gear: {}, inv: [], pts: 0, passives: { pyre: 3, vital: 2 }, gems: { fireball: { lvl: 2, ap: 0 }, blink: { lvl: 1, ap: 0 } } };
      localStorage.setItem('wd-arpg-1', JSON.stringify(old)); document.getElementById('toasts').innerHTML = ''; D.start(false);
      out.old = [P.pts, Object.keys(P.tree).join(), Object.keys(P.passives).length, P.treeV]; out.toast = /Passives reset: 5 points to spend in the new tree/.test(toasts());
      D.save(); document.getElementById('toasts').innerHTML = ''; D.start(false);
      out.again = [P.pts, /Passives reset/.test(toasts())];
      E.path(['core1', 'core2']); out.spent = P.pts; D.save(); const before = JSON.stringify(P.tree);
      D.start(false); out.round = [JSON.stringify(P.tree) === before, P.pts, D.S.cdr, JSON.parse(localStorage.getItem('wd-arpg-1')).passives];
      // a Slice 2 save with a nonsense node and a disconnected one: unknown dropped, disconnected refunded
      const sv = JSON.parse(localStorage.getItem('wd-arpg-1')); sv.tree = { heart: 1, core1: 1, bogus: 1, F3: 1 }; sv.pts = 0; localStorage.setItem('wd-arpg-1', JSON.stringify(sv)); D.start(false);
      out.clean = [Object.keys(P.tree).sort().join(), P.pts];
      // a fresh character is not treated as an old save
      D.start(true); P.lvl = 4; P.pts = 3; D.save(); document.getElementById('toasts').innerHTML = ''; D.start(false); out.fresh = [P.pts, /Passives reset/.test(toasts())];
      return out;
    });
    console.log('  tree save:', JSON.stringify(r));
    check(r.old[0] === 5 && r.old[1] === 'heart' && r.old[2] === 0, `tree: an old save at level 6 gets all 5 points back and an empty tree (${r.old})`);
    check(r.toast, 'tree: the old-save refund shows its toast');
    check(r.again[0] === 5 && !r.again[1], `tree: the refund happens once (${r.again})`);
    check(r.round[0] && r.round[1] === 3 && Math.abs(r.round[2] - .03) < 1e-9 && r.round[3] == null, `tree: save and reload keeps the tree and points (${JSON.stringify(r.round)})`);
    check(r.clean[0] === 'core1,heart' && r.clean[1] === 2, `tree: loading drops unknown and disconnected nodes and refunds them (${r.clean})`);
    check(r.fresh[0] === 3 && !r.fresh[1], `tree: a new character's save is not refunded on load (${r.fresh})`);
    check(errors.length === 0, `tree: no page errors on saves${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- the panel: open, tap, allocate, reset; wheel zoom; screenshots ----------
  {
    const { page, errors } = await open('/');
    await page.evaluate(HELPERS);
    const nodeXY = id => page.evaluate(id => { const D = window.__dbg, n = D.TREE[id], v = D.treeView(), r = document.getElementById('treeSvg').getBoundingClientRect(); return [r.left + n.x * v.k + v.x, r.top + n.y * v.k + v.y]; }, id);
    const sel = () => page.evaluate(() => window.__dbg.treeSel());
    const state = () => page.evaluate(() => ({ pts: window.__dbg.P.pts, tree: Object.keys(window.__dbg.P.tree).length }));
    await page.evaluate(() => { E.hero(30, 25); window.__dbg.openPass(); });
    const o = await page.evaluate(() => ({ shown: document.getElementById('mPass').classList.contains('show'), paused: window.__dbg.G.paused, nodes: document.querySelectorAll('#treeG circle, #treeG polygon').length, rings: document.querySelectorAll('#treeG .ring').length, sub: document.getElementById('treePts').textContent, fit: window.__dbg.treeView() }));
    check(o.shown && o.paused && o.nodes >= 68 && o.rings === 4 && /25 to spend/.test(o.sub), `tree panel: opens paused with 68 nodes, 4 glowing next to the start (${o.nodes} shapes, ${o.rings} rings, "${o.sub}")`);
    // tap a node with the mouse, then press ALLOCATE
    let [x, y] = await nodeXY('core1'); await page.mouse.click(x, y);
    check(await sel() === 'core1', 'tree panel: tapping a node selects it');
    check(await page.evaluate(() => /12 maximum life/.test(document.getElementById('treeSel').textContent)), 'tree panel: the detail bar describes the node in words');
    await page.click('#tAlloc'); let st = await state();
    check(st.pts === 24 && st.tree === 1, `tree panel: ALLOCATE spends a point (${st.pts} left)`);
    // not adjacent: allocate disabled, with a reason
    [x, y] = await nodeXY('core8'); await page.mouse.click(x, y);
    check(await page.evaluate(() => document.getElementById('tAlloc').disabled && /Not connected/.test(document.getElementById('treeSel').textContent)), 'tree panel: a node out of reach has ALLOCATE disabled and says why');
    // drag pans, wheel zooms
    const v0 = await page.evaluate(() => window.__dbg.treeView()); await page.mouse.move(300, 300); await page.mouse.down(); await page.mouse.move(340, 330, { steps: 4 }); await page.mouse.up();
    const v1 = await page.evaluate(() => window.__dbg.treeView());
    check(Math.abs(v1.x - v0.x - 40) < 2 && Math.abs(v1.y - v0.y - 30) < 2 && await sel() === 'core8', `tree panel: dragging pans the view and is not a tap (${v1.x - v0.x},${v1.y - v0.y})`);
    await page.mouse.move(500, 300); await page.mouse.wheel({ deltaY: -400 }); const v2 = await page.evaluate(() => window.__dbg.treeView());
    check(v2.k > v1.k * 1.3, `tree panel: the wheel zooms (${v1.k.toFixed(2)} to ${v2.k.toFixed(2)})`);
    // refund through the bar, reset with a confirm tap
    await page.evaluate(() => window.__dbg.treeFit()); [x, y] = await nodeXY('core1'); await page.mouse.click(x, y); await page.click('#tRefund'); st = await state();
    check(st.pts === 25 && st.tree === 0, `tree panel: REFUND gives the point back (${st.pts})`);
    await page.evaluate(() => { window.__dbg.treeAlloc('core1'); window.__dbg.treeAlloc('core2'); window.__dbg.treeRender(); });
    const rs = await page.evaluate(() => { const b = document.getElementById('treeReset'), P = window.__dbg.P, o = {}; b.click(); o.asked = b.textContent; o.mid = Object.keys(P.tree).length; b.click(); o.pts = P.pts; o.tree = Object.keys(P.tree).length; return o; });
    check(/CONFIRM/.test(rs.asked) && rs.mid === 2, 'tree panel: RESET TREE asks to confirm first');
    check(rs.pts === 25 && rs.tree === 1, `tree panel: confirming refunds everything (${rs.pts})`);
    // the P key toggles it; Escape closes it
    await page.keyboard.press('Escape'); await page.keyboard.press('p');
    check(await page.evaluate(() => document.getElementById('mPass').classList.contains('show')), 'tree panel: the P key opens it');
    await page.keyboard.press('Escape');
    check(!(await page.evaluate(() => document.getElementById('mPass').classList.contains('show'))), 'tree panel: Escape closes it');
    if (SHOT) {
      await page.evaluate(() => { const D = window.__dbg; E.hero(30, 29); E.path(['core9', 'core10', 'core11', 'F1', 'F2', 'F3', 'F4', 'F5', 'FA1', 'FA2', 'core1', 'core2', 'core3', 'core4', 'core5', 'L1', 'L2', 'L3']); D.openPass(); D.treeSelect('bloodRite'); });
      await new Promise(r => setTimeout(r, 600)); await page.screenshot({ path: SHOT.replace(/\.png$/, '-tree.png') });
      // phone: touch viewport, tap a node and ALLOCATE with real touches
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await page.reload({ waitUntil: 'load' }); // a mobile viewport needs a fresh page
      await page.waitForFunction(() => window.__dbg && window.__dbg.ready && window.__dbg.ready(), { timeout: 20000 });
      await page.evaluate(HELPERS);
      await page.evaluate(() => { const D = window.__dbg; document.getElementById('mMenu').classList.remove('show'); E.hero(30, 29); E.path(['core9', 'core10', 'core11', 'F1', 'F2', 'F3', 'F4', 'F5', 'FA1', 'FA2', 'core1', 'core2', 'core3', 'core4', 'core5', 'L1', 'L2', 'L3']); D.openPass(); D.treeSelect(null); });
      await new Promise(r => setTimeout(r, 500));
      const before = await state(); [x, y] = await nodeXY('bloodRite'); await page.touchscreen.tap(x, y);
      const tapped = await sel(); const btn = await page.$('#tAlloc'); const box = btn && await btn.boundingBox();
      if (tapped === 'bloodRite' && box) { await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); }
      const after = await state();
      check(tapped === 'bloodRite' && box && box.height >= 40 && after.pts === before.pts - 1, `tree phone: a touch tap selects a node and the ALLOCATE button (${box && Math.round(box.height)}px tall) allocates (${before.pts} to ${after.pts}, tapped ${tapped})`);
      await page.evaluate(() => window.__dbg.treeSelect('glassCannon'));
      await new Promise(r => setTimeout(r, 500)); await page.screenshot({ path: SHOT.replace(/\.png$/, '-tree-phone.png') });
    }
    check(errors.length === 0, `tree: no page errors in the panel${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }
}
