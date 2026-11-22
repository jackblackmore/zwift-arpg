// Gem bag, five-slot skill bar, support sockets, casting registry, Blood Rite hook, old-save migration, HUD and the bar editor.
export default async function ({ open, check, SEED, SHOT }) {
  // ---------- rules: unlocks, kinds, duplicates, swaps, supports, AP, Blood Rite ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, out = {};
      const onBar = u => Object.values(P.bar).includes(u), socketed = u => Object.values(P.sockets).some(a => a.includes(u));
      const lvlAt = L => { P.lvl = L; D.recalc(); };
      D.start(true); // FRESH_KIT: Fireball in Main, Blink in Evade
      out.fresh = [D.slotSkill('main'), D.slotSkill('evade'), D.slotSkill('flexA'), P.gems.length];
      // unlocks and socket counts at the levels the design lists
      out.unlock = {};
      for (const L of [1, 5, 8, 12, 15, 25, 30, 45]) { lvlAt(L); out.unlock[L] = ['main', 'flexA', 'flexB', 'guard', 'evade'].map(s => (D.slotUnlocked(s) ? 1 : 0) + '/' + D.socketCount(s)).join(' '); }
      // kinds
      lvlAt(12);
      const fb = D.slotGem('main'), nova = D.addGem('nova'), ward = D.addGem('ward'), fl = D.addGem('frostLance'), split = D.addGem('split'), shat = D.addGem('shatter'), pierce = D.addGem('pierce'), ign = D.addGem('ignite'), blink2 = D.addGem('blink');
      out.newGems = P.newGems;
      out.kind = [D.equipGem('main', ward.uid), D.equipGem('guard', nova.uid), D.equipGem('guard', ward.uid), D.equipGem('evade', blink2.uid), D.equipGem('main', split.uid)];
      out.guardWhy = D.equipReason('guard', nova.uid); out.supWhy = D.equipReason('main', split.uid);
      lvlAt(1); out.lockedWhy = D.equipReason('flexA', nova.uid); out.lockedEquip = D.equipGem('flexA', nova.uid); lvlAt(12);
      // levelling past the unlock keeps what is in a slot; going back below it returns the gem to the bag
      D.equipGem('flexA', nova.uid); lvlAt(4); out.kickedOnLevel = !onBar(nova.uid) && P.bar.flexA === null && !onBar(ward.uid); lvlAt(12);
      // duplicates: a second Frost Nova goes to the bag, can't join the bar while the first is on it
      D.equipGem('flexA', nova.uid); const nova2 = D.addGem('nova');
      out.dupBag = P.gems.filter(g => g.id === 'nova').length === 2 && !onBar(nova2.uid);
      out.dupEquip = D.equipGem('flexB', nova2.uid); out.dupWhy = D.equipReason('flexB', nova2.uid);
      // Glass Cannon style override: guard takes attack gems; the guard gem is kicked out
      D.equipGem('guard', ward.uid); S.slotKinds = { guard: ['attack'] }; D.validateBar();
      out.kickWard = P.bar.guard === null && !onBar(ward.uid);
      out.ccEquip = D.equipGem('guard', fl.uid) && P.bar.guard === fl.uid; out.ccAccepts = D.slotAccepts('guard').join();
      S.slotKinds = null; D.validateBar(); out.ccBack = P.bar.guard === null && !onBar(fl.uid) && D.slotAccepts('guard').join();
      D.equipGem('guard', ward.uid);
      // swaps keep level and AP
      Object.assign(fb, { lvl: 4, ap: 7 }); Object.assign(fl, { lvl: 6, ap: 9 }); Object.assign(nova, { lvl: 3, ap: 5 });
      out.toMain = D.equipGem('main', fl.uid); out.mainNow = D.slotSkill('main'); out.fbBag = !onBar(fb.uid) && fb.lvl === 4 && fb.ap === 7;
      D.equipGem('flexB', fb.uid); // Fireball to Flex B: nova stays in Flex A
      out.beforeSwap = [D.slotSkill('flexA'), D.slotSkill('flexB')];
      out.swap = D.equipGem('flexA', fb.uid); out.afterSwap = [D.slotSkill('flexA'), D.slotSkill('flexB')];
      out.swapKeep = [nova.lvl, nova.ap, fb.lvl, fb.ap].join();
      D.equipGem('flexA', nova.uid); D.equipGem('flexB', fb.uid);
      D.equipGem('main', fl.uid);
      // supports: only compatible sockets
      out.socketMain = D.socketGem('main', 0, split.uid);           // Frost Lance is a projectile skill
      out.socketWard = D.socketGem('guard', 0, split.uid);          // Ward has no tags
      out.wardWhy = D.socketReason('guard', 0, split.uid);
      out.shatterFire = D.socketGem('flexB', 0, shat.uid);          // Fireball has no cold tag
      out.shatterNova = D.socketGem('flexA', 0, shat.uid);
      out.sock2 = D.socketGem('main', 1, pierce.uid);               // no second Main socket before L15
      lvlAt(15); out.sock2b = D.socketGem('main', 1, pierce.uid); out.dupSup = D.socketGem('main', 1, D.addGem('split').uid); // a second Split on the same skill
      out.supportsOf = D.supportsOf('frostLance').map(s => s.id).join(); out.noSupports = D.supportsOf('ward').length;
      out.moveSup = D.socketGem('flexB', 0, ign.uid) && D.socketGem('main', 1, ign.uid) === false; // Ignite fits Fireball, not Frost Lance
      out.unsock = D.unsocket('main', 1) && P.sockets.main[1] === null && D.unsocket('main', 1) === false;
      D.socketGem('main', 1, pierce.uid);
      // changing the skill drops supports that no longer fit
      D.equipGem('main', fb.uid); out.keptSplit = P.sockets.main.includes(split.uid) && P.sockets.main.includes(pierce.uid); // Fireball: projectile too
      D.equipGem('flexA', nova.uid); D.equipGem('main', nova.uid); // nova to Main (swap with fb to flexA)
      out.refit = !P.sockets.main.includes(split.uid) && !socketed(split.uid);
      // AP: equipped (bar or socket) full, bag 10%
      for (const g of P.gems) { g.lvl = 1; g.ap = 0; }
      D.equipGem('main', fb.uid); D.socketGem('main', 0, split.uid); D.socketGem('flexA', 0, shat.uid); const arc = D.addGem('arc');
      D.gainAP(10);
      out.ap = { onBar: fb.ap, socketed: split.ap, bagSkill: arc.ap, bagSupport: pierce.ap };
      // Blood Rite: no cooldowns, each cast costs life, refused when it would kill
      lvlAt(15); D.equipGem('flexA', nova.uid); S.bloodRite = .05; P.cd.flexA = 0; P.life = S.maxLife; P.invuln = 99;
      const l0 = P.life; out.rite1 = D.castSlot('flexA'); out.rite2 = D.castSlot('flexA'); out.riteCd = P.cd.flexA; out.riteCost = (l0 - P.life) / S.maxLife;
      P.life = 2; out.riteLow = D.castSlot('flexA'); out.riteLowLife = P.life; S.bloodRite = 0; D.recalc();
      // registry and Main fallbacks
      out.skills = ['fireball', 'nova', 'ward', 'blink'].every(k => D.SKILLS[k] && typeof D.SKILLS[k].cast === 'function');
      D.unequip('main'); out.emptyMain = [D.castSlot('main'), D.mainRange()];
      D.equipGem('main', fb.uid); out.mainRange = D.mainRange();
      // Z / R: flexB casts from ctl.flexB
      lvlAt(12); D.equipGem('flexB', nova.uid); P.cd.flexB = 0; D.ctl.flexB = true; D.sim(1);
      out.flexB = [P.cd.flexB > 0, D.ctl.flexB];
      return out;
    });
    console.log('  gembar rules:', JSON.stringify(r));
    check(r.fresh.join() === 'fireball,blink,,2', `gembar: a fresh character has the temporary kit (${r.fresh})`);
    const U = r.unlock;
    check(U[1] === '1/1 0/0 0/0 0/0 1/1' && U[5] === '1/1 1/1 0/0 0/0 1/1' && U[8] === '1/1 1/1 0/0 1/1 1/1' && U[12] === '1/1 1/1 1/1 1/1 1/1' && U[15] === '1/2 1/1 1/1 1/1 1/1' && U[25] === '1/2 1/2 1/2 1/1 1/1' && U[30] === '1/3 1/2 1/2 1/1 1/1' && U[45] === '1/4 1/2 1/2 1/1 1/1', `gembar: slots and sockets unlock at L1/5/8/12/15/25/30/45 (${JSON.stringify(U)})`);
    check(r.newGems === 8, `gembar: addGem counts new gems for the badge (${r.newGems})`);
    check(r.kind.join() === 'false,false,true,true,false' && /guard gems only/.test(r.guardWhy) && /sockets/.test(r.supWhy), `gembar: kind rules hold (${r.kind}; "${r.guardWhy}")`);
    check(!r.lockedEquip && r.lockedWhy === 'Unlocks at level 5' && r.kickedOnLevel, `gembar: locked slots refuse, and a level drop returns the gem to the bag ("${r.lockedWhy}")`);
    check(r.dupBag && !r.dupEquip && /already on the bar/.test(r.dupWhy), `gembar: duplicates go to the bag and can't join the bar ("${r.dupWhy}")`);
    check(r.kickWard && r.ccEquip && r.ccAccepts === 'attack' && r.ccBack === 'guard', `gembar: S.slotKinds override and validateBar (${r.ccAccepts} / ${r.ccBack})`);
    check(r.toMain && r.mainNow === 'frostLance' && r.fbBag, 'gembar: swapping Fireball for Frost Lance in Main keeps levels and AP');
    check(r.swap && r.beforeSwap.join() === 'nova,fireball' && r.afterSwap.join() === 'fireball,nova' && r.swapKeep === '3,5,4,7', `gembar: Flex A and B swap keeping level and AP (${r.afterSwap}; ${r.swapKeep})`);
    check(r.socketMain && !r.socketWard && /needs a/.test(r.wardWhy) && !r.shatterFire && r.shatterNova, `gembar: supports socket only into compatible slots ("${r.wardWhy}")`);
    check(!r.sock2 && r.sock2b && !r.dupSup && r.supportsOf === 'split,pierce' && r.noSupports === 0, `gembar: second Main socket at L15, no duplicate support, supportsOf (${r.supportsOf})`);
    check(r.moveSup && r.unsock, 'gembar: supports move and unsocket');
    check(r.keptSplit && r.refit, 'gembar: changing the skill keeps fitting supports and returns the rest to the bag');
    check(Math.abs(r.ap.onBar - 10) < 1e-9 && Math.abs(r.ap.socketed - 10) < 1e-9 && Math.abs(r.ap.bagSkill - 1) < 1e-9 && Math.abs(r.ap.bagSupport - 1) < 1e-9, `gembar: socketed supports earn full AP, bag gems 10% (${JSON.stringify(r.ap)})`);
    check(r.rite1 && r.rite2 && r.riteCd === 0 && Math.abs(r.riteCost - .1) < .005 && !r.riteLow && r.riteLowLife === 2, `gembar: Blood Rite casts back to back for life and refuses to kill (cost ${(r.riteCost * 100).toFixed(1)}% for two casts)`);
    check(r.skills && r.emptyMain[0] === false && r.emptyMain[1] === 8 && r.mainRange === 10, `gembar: registry has the four skills; empty Main does nothing and ranges 8 (${r.emptyMain}; fireball ${r.mainRange})`);
    check(r.flexB[0] && !r.flexB[1], 'gembar: ctl.flexB casts the Flex B slot');
    check(errors.length === 0, `gembar: no page errors on rules${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- keys: R and the RIDE-mode Z button cast Flex B ----------
  {
    const { page, errors } = await open('/');
    await page.evaluate(() => { const D = window.__dbg; D.start(true); D.P.lvl = 12; D.recalc(); D.kit({ main: 'fireball', flexB: 'nova' }); D.P.invuln = 1e6; D.G.enemies.length = 0; });
    const cd = () => page.evaluate(() => { const c = window.__dbg.P.cd.flexB; window.__dbg.P.cd.flexB = 0; return c; });
    await page.keyboard.press('r'); await new Promise(r => setTimeout(r, 250));
    const rKey = await cd();
    await page.evaluate(() => window.__dbg.setRide(true));
    await page.keyboard.press('j'); await new Promise(r => setTimeout(r, 250));
    const zKey = await cd();
    await page.evaluate(() => window.__dbg.setRide(false));
    check(rKey > 0, `gembar: the R key casts Flex B (cd ${rKey.toFixed(1)})`);
    check(zKey > 0, `gembar: the Z button (J) casts Flex B in RIDE mode (cd ${zKey.toFixed(1)})`);
    check(errors.length === 0, `gembar: no page errors on keys${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- save round trip and Slice 1 migration ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      // round trip
      D.start(true); P.lvl = 15; D.recalc();
      D.kit({ main: 'fireball', flexA: 'nova', flexB: 'frostLance', guard: 'ward', evade: 'blink', lvl: 3, sup: { main: ['split', 'ignite'] } });
      P.lvl = 15; D.recalc(); D.addGem('arc', 2); P.gems[0].ap = 12.5; D.save();
      const snap = () => JSON.stringify({ g: P.gems, b: P.bar, s: P.sockets });
      const before = snap(); D.start(false); out.round = [before === snap(), P.gems.length, JSON.stringify(D.P.sockets.main)];
      // Slice 1 save: gems keyed by skill id, passives with notables, level 6
      const old = { itemId: 100, lvl: 6, xp: 5, gear: {}, inv: [], pts: 2, passives: { multi: 2, pyre: 3, ignite: 1 },
        gems: { fireball: { lvl: 5, ap: 20 }, nova: { lvl: 2, ap: 3 }, ward: { lvl: 4, ap: 1 }, blink: { lvl: 3, ap: 0 } } };
      localStorage.setItem('wd-arpg-1', JSON.stringify(old)); D.start(false);
      const ofId = id => P.gems.find(g => g.id === id), onBar = id => Object.keys(P.bar).find(k => P.bar[k] && D.slotSkill(k) === id) || null;
      out.mig = { main: D.slotSkill('main'), evade: D.slotSkill('evade'), flexA: D.slotSkill('flexA'), guard: D.slotSkill('guard'), n: P.gems.length,
        fb: [ofId('fireball').lvl, ofId('fireball').ap], blink: ofId('blink').lvl, nova: [ofId('nova').lvl, ofId('nova').ap], ward: [ofId('ward').lvl, onBar('ward')],
        split: [ofId('split').lvl, Object.values(P.sockets).flat().includes(ofId('split').uid)], ignite: ofId('ignite').lvl,
        pass: { ...P.passives }, pts: P.pts, shrine: P.shrines.main };
      D.save(); const mb = snap(); D.start(false); out.migRound = mb === snap();
      // lvl 9: Ward goes to Guard
      localStorage.setItem('wd-arpg-1', JSON.stringify({ ...old, lvl: 9 })); D.start(false); out.guard9 = D.slotSkill('guard');
      // very old save with no gems at all
      const bare = { ...old, lvl: 1 }; delete bare.gems; delete bare.passives; localStorage.setItem('wd-arpg-1', JSON.stringify(bare)); D.start(false);
      out.bare = [P.gems.length, D.slotSkill('main'), D.slotSkill('evade'), P.gems.every(g => g.lvl === 1 && g.ap === 0)];
      return out;
    });
    console.log('  gembar save:', JSON.stringify(r));
    check(r.round[0] && r.round[1] === 8 && JSON.parse(r.round[2]).length === 2, `gembar: save then reload gives identical gems, bar and sockets (${r.round})`);
    const m = r.mig;
    check(m.main === 'fireball' && m.evade === 'blink' && m.flexA === 'nova' && m.guard === null && m.ward[1] === null && m.n === 6, `gembar: migration: Fireball Main, Blink Evade, Nova Flex A, Ward in the bag (${m.main}/${m.evade}/${m.flexA}/${m.guard}, ${m.n} gems)`);
    check(m.fb.join() === '5,20' && m.blink === 3 && m.nova.join() === '2,3' && m.ward[0] === 4, 'gembar: migration keeps gem levels and AP');
    check(m.split[0] === 2 && m.split[1] && m.ignite === 1, `gembar: migration turns Twin Flame x2 into a level 2 Split in Main's socket and Ignite into a support gem (${JSON.stringify(m.split)})`);
    check(m.pass.multi === undefined && m.pass.ignite === undefined && m.pts === 5 && m.shrine === 'fireball', `gembar: old passives dropped, every point refunded to the tree (pts ${m.pts}), Main shrine marked taken`);
    check(r.migRound && r.guard9 === 'ward', `gembar: migrated save round-trips; at level 9 Ward goes to Guard (${r.guard9})`);
    check(r.bare[0] === 4 && r.bare[1] === 'fireball' && r.bare[2] === 'blink' && r.bare[3], `gembar: a save with no gems starts the four at level 1 (${r.bare})`);
    check(errors.length === 0, `gembar: no page errors on save${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }

  // ---------- HUD skill bar and the editor ----------
  {
    const { page, errors } = await open('/');
    // Shared set-up: a character at level 8 with a spread of gems (also used for the screenshots).
    const setup = () => {
      const D = window.__dbg, P = D.P;
      D.start(true); P.lvl = 8; P.xp = 0; D.recalc();
      const nova = D.addGem('nova', 3), ward = D.addGem('ward', 2), split = D.addGem('split', 2);
      D.equipGem('flexA', nova.uid); D.equipGem('guard', ward.uid); D.socketGem('main', 0, split.uid);
      P.gems.find(g => g.id === 'fireball').lvl = 5; P.gems.find(g => g.id === 'fireball').ap = 60; nova.ap = 40; split.ap = 25;
      D.addGem('frostLance', 4).ap = 80; D.addGem('arc'); D.addGem('skeletons', 2); D.addGem('meteor'); D.addGem('pierce', 3); D.addGem('ignite'); D.addGem('shatter', 2); D.addGem('boneArmour');
      P.newGems = 3; D.G.enemies.length = 0; D.hud();
    };
    const hudR = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {}, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
      D.start(true); try { D.hud(); D.hud(); } catch (e) { out.err = e.stack; }
      out.slots = qa('#skills .sk').map(e => e.id).join();
      out.lockedFlexB = q('#sFlexB').classList.contains('locked') && q('#sFlexB .lk em').textContent;
      out.lockedFlexA = q('#sFlexA .lk em').textContent; out.lockedGuard = q('#sGuard .lk em').textContent;
      out.mainIcon = q('#sMain .ic').textContent; out.evadeIcon = q('#sEvade .ic').textContent; out.mainLocked = q('#sMain').classList.contains('locked');
      P.lvl = 5; D.recalc(); D.hud(); out.emptyFlexA = [q('#sFlexA').classList.contains('empty'), q('#sFlexA .ic').textContent];
      out.badgeBefore = q('#gemBadge').style.display;
      D.addGem('nova'); D.hud(); out.badge = [q('#gemBadge').style.display, q('#gemBadge').textContent];
      // tap the empty slot: the editor opens and the game pauses
      q('#sFlexA').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 }));
      out.openedByTap = [q('#mGems').classList.contains('show'), D.G.paused, P.newGems];
      D.openGems(false); out.closed = [q('#mGems').classList.contains('show'), D.G.paused];
      // pips and cooldown sweep
      D.start(true); P.lvl = 25; D.recalc(); const sp = D.addGem('split'), ig = D.addGem('ignite'); D.socketGem('main', 0, sp.uid); D.socketGem('main', 1, ig.uid);
      const nv = D.addGem('nova'); D.equipGem('flexA', nv.uid); D.castSlot('flexA'); D.hud();
      out.pips = [qa('#sMain .pips i').length, qa('#sMain .pips i.on').length, qa('#sFlexA .pips i').length, qa('#sFlexA .pips i.on').length];
      out.sweep = [q('#sFlexA .cd').style.height, q('#sFlexA .n').textContent];
      out.badgeLv = q('#sMain .gem b').textContent;
      return out;
    });
    console.log('  gembar hud:', JSON.stringify(hudR));
    check(hudR.slots === 'sMain,sFlexA,sFlexB,sGuard,sEvade,sFl', `gembar: the HUD has five skill slots and the flask (${hudR.slots})`);
    check(hudR.lockedFlexB === 'L12' && hudR.lockedFlexA === 'L5' && hudR.lockedGuard === 'L8' && !hudR.mainLocked, `gembar: locked slots show their level (${hudR.lockedFlexB}, ${hudR.lockedFlexA}, ${hudR.lockedGuard})`);
    check(hudR.mainIcon === '✹' && hudR.evadeIcon === '➶' && hudR.emptyFlexA[0] && hudR.emptyFlexA[1] === '+', 'gembar: slots show the gem icon from data; an empty unlocked slot shows +');
    check(hudR.badgeBefore === 'none' && hudR.badge[0] === 'block' && hudR.badge[1] === '1', `gembar: the GEMS button badge counts new gems (${hudR.badge})`);
    check(hudR.openedByTap[0] && hudR.openedByTap[1] && hudR.openedByTap[2] === 0 && !hudR.closed[0] && !hudR.closed[1], `gembar: tapping an empty slot opens the editor, pausing, and closing resumes (${hudR.openedByTap}, ${hudR.closed})`);
    check(hudR.pips.join() === '2,2,2,0' && parseFloat(hudR.sweep[0]) > 50 && hudR.sweep[1] !== '' && hudR.badgeLv === 'Lv 1', `gembar: socket pips fill when a support is socketed, cooldown sweep shows (${hudR.pips}; ${hudR.sweep})`);

    // the editor by DOM clicks
    const ed = await page.evaluate(async () => {
      const D = window.__dbg, P = D.P, out = {}, q = s => document.querySelector(s), click = el => el.click(), wait = ms => new Promise(r => setTimeout(r, ms));
      D.start(true); P.lvl = 5; D.recalc(); D.G.enemies.length = 0;
      const nova = D.addGem('nova', 2), split = D.addGem('split'), shat = D.addGem('shatter'), ward = D.addGem('ward');
      D.hud(); out.badgeShown = q('#gemBadge').style.display; click(q('#bGems')); D.hud(); out.open = [q('#mGems').classList.contains('show'), D.G.paused, q('#gemBadge').style.display];
      out.cards = document.querySelectorAll('#gbBag .gcard').length; out.supRound = document.querySelectorAll('#gbBag .gcard.sup').length;
      out.slotCols = document.querySelectorAll('#gbSlots .gslot').length; out.locks = document.querySelectorAll('#gbSlots .gslot.locked').length;
      click(q(`#gbBag .gcard[data-u="${nova.uid}"]`));
      out.detail = q('#gbDetail').textContent; out.dimGuard = q('#gbSlots .gslot[data-slot="guard"]').classList.contains('dim'); out.okFlexA = q('#gbSlots .gslot[data-slot="flexA"]').classList.contains('ok');
      click(q('#gbSlots .gslot[data-slot="main"]')); // Nova into Main replaces Fireball? (valid: attack)
      out.mainNow = D.slotSkill('main'); D.equipGem('main', P.gems[0].uid); D.renderGems(); // put Fireball back
      click(q(`#gbBag .gcard[data-u="${nova.uid}"]`)); click(q('#gbSlots .gslot[data-slot="guard"]'));
      out.guardMsg = q('#gbDetail .gmsg') && q('#gbDetail .gmsg').textContent; out.guardNone = D.slotSkill('guard');
      click(q('#gbSlots .gslot[data-slot="flexB"]')); out.lockMsg = q('#gbDetail .gmsg') && q('#gbDetail .gmsg').textContent;
      click(q('#gbSlots .gslot[data-slot="flexA"]')); out.flexA = D.slotSkill('flexA'); out.selClear = !D.gemUi.sel;
      click(q(`#gbBag .gcard[data-u="${ward.uid}"]`)); click(q('#gbSlots .gslot[data-slot="main"]'));
      out.kindMsg = q('#gbDetail .gmsg') && q('#gbDetail .gmsg').textContent; out.mainKept = D.slotSkill('main');
      click(q(`#gbBag .gcard[data-u="${split.uid}"]`)); click(q('#gbSlots .gsock[data-slot="main"][data-i="0"]')); out.sock = P.sockets.main[0] === split.uid;
      click(q(`#gbBag .gcard[data-u="${shat.uid}"]`)); click(q('#gbSlots .gsock[data-slot="main"][data-i="0"]')); out.shatMsg = q('#gbDetail .gmsg') && q('#gbDetail .gmsg').textContent; out.sockStill = P.sockets.main[0] === split.uid;
      click(q('#gbSlots .gsock[data-slot="flexA"][data-i="0"]')); out.sockNova = P.sockets.flexA[0] === shat.uid;
      // select a placed gem, tap it again: back to the bag
      click(q('#gbSlots .gslot[data-slot="flexA"]')); out.selPlaced = !!D.gemUi.sel; click(q('#gbSlots .gslot[data-slot="flexA"]')); out.sentBack = D.slotSkill('flexA') === null && P.sockets.flexA.every(u => u === null);
      click(q(`#gbBag .gcard[data-u="${nova.uid}"]`)); click(q('#gbSlots .gslot[data-slot="flexA"]'));
      click(q('#gbSlots .gslot[data-slot="flexA"]')); click(q('#gbSlots .gslot[data-slot="main"]')); // swap placed Nova with Fireball
      out.swapped = [D.slotSkill('main'), D.slotSkill('flexA')];
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); out.escClosed = !q('#mGems').classList.contains('show') && !D.G.paused;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })); out.gOpen = q('#mGems').classList.contains('show') && D.G.paused;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })); out.gClose = !q('#mGems').classList.contains('show');
      D.openInv(true); out.invPauses = D.G.paused; D.openInv(false); out.invResumes = !D.G.paused;
      return out;
    });
    console.log('  gembar editor:', JSON.stringify(ed));
    check(ed.open[0] && ed.open[1] && ed.badgeShown === 'block' && ed.open[2] === 'none' && ed.slotCols === 5 && ed.locks === 2, `gembar: the GEMS button opens the editor (paused, badge cleared, 5 slots, 2 locked) (${JSON.stringify(ed.open)})`);
    check(ed.cards === 4 && ed.supRound === 2, `gembar: the bag shows spare gems, supports as round cards (${ed.cards} cards, ${ed.supRound} support)`);
    check(/Frost Nova/.test(ed.detail) && /Level 2/.test(ed.detail) && ed.dimGuard && ed.okFlexA, 'gembar: selecting a gem shows its detail and dims invalid slots');
    check(ed.mainNow === 'nova' && ed.flexA === 'nova' && ed.selClear, 'gembar: tapping a bag gem then a slot equips it');
    check(/Unlocks at level 8/.test(ed.guardMsg) && ed.guardNone === null && /Unlocks at level 12/.test(ed.lockMsg) && /attack gems only/.test(ed.kindMsg) && ed.mainKept === 'fireball', `gembar: invalid targets say why ("${ed.guardMsg}"; "${ed.lockMsg}"; "${ed.kindMsg}")`);
    check(ed.sock && /needs a/.test(ed.shatMsg) && ed.sockStill && ed.sockNova, `gembar: supports socket by tapping, incompatible ones are refused ("${ed.shatMsg}")`);
    check(ed.selPlaced && ed.sentBack, 'gembar: tapping a placed gem selects it, tapping it again sends it to the bag');
    check(ed.swapped.join() === 'nova,fireball', `gembar: a placed gem tapped onto another slot swaps (${ed.swapped})`);
    check(ed.escClosed && ed.gOpen && ed.gClose && ed.invPauses && ed.invResumes, 'gembar: Escape and G close the editor; modals pause generically');
    check(errors.length === 0, `gembar: no page errors on the editor${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);

    if (SHOT) {
      const shot = async name => { await new Promise(r => setTimeout(r, 600)); await page.screenshot({ path: SHOT.replace(/\.png$/, `-${name}.png`) }); };
      await page.evaluate(setup); await page.evaluate(() => { const D = window.__dbg; D.openGems(true); document.querySelector('#gbBag .gcard').click(); });
      await shot('gembag');
      await page.evaluate(() => window.__dbg.openGems(false)); await shot('gembar-hud');
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => window.__dbg && window.__dbg.ready && window.__dbg.ready(), { timeout: 20000 });
      await page.evaluate(setup); await page.evaluate(() => { document.getElementById('mMenu').classList.remove('show'); const D = window.__dbg; D.hud(); D.openGems(true); document.querySelector('#gbBag .gcard').click(); });
      await shot('gembag-phone');
      await page.evaluate(() => window.__dbg.openGems(false)); await shot('gembar-hud-phone');
    }
    await page.close();
  }
}
