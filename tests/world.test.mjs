// A Varázsvilág térképe (js/world-map.js): a nevezetességek helye, a sík talaj körülöttük, a vezető fény célja, a mentés.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDMARKS, WORLD_LINES, landmarkById, siteOfCell, makeTerrain, guideGoal, CELL, SITE_FLAT, SITE_BLEND, FIND_R,
  ITEMS, ADVENTURES, adventureAt, cleanAdventure, itemSpots, TRAIL, PICK_R, BIOMES, makeBiomes, mixHex, HOME_R } from '../js/world-map.js';
import { newRewardSession, adventureReward } from '../js/economy.js';
import { ICONS } from '../js/icons.js';
import { openProfiles } from '../js/progress.js';

class FakeStorage {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const SEEDS = [0, 1, 7, 101, 202, 303, 555, 123456789, 2147483646];
const sentences = t => String(t).match(/[^.!?]+[.!?]+/g) || [];
const words = s => s.trim().split(/\s+/).filter(w => /\p{L}/u.test(w)).length;

test('nevezetességek: egyedi azonosító, saját ikon, rövid, kimondható mondatok', () => {
  assert.ok(LANDMARKS.length >= 4);
  assert.equal(new Set(LANDMARKS.map(l => l.id)).size, LANDMARKS.length);
  const lines = [...LANDMARKS.flatMap(l => [l.found, l.way, l.name + '.']), ...Object.values(WORLD_LINES)];
  for (const l of LANDMARKS) { assert.ok(ICONS['lm-' + l.id], 'nincs ikon: ' + l.id); assert.equal(landmarkById(l.id), l); assert.ok(l.found.includes('Megtaláltad')); }
  for (const t of lines) {
    assert.doesNotMatch(t, /[0-9]/, t); assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, t);
    for (const s of sentences(t)) assert.ok(words(s) <= 12, `túl hosszú: ${s}`);
  }
});

test('a világ ugyanabból a magból mindig ugyanaz; más magból más', () => {
  const a = siteOfCell(555, 3, -2), b = siteOfCell(555, 3, -2), c = siteOfCell(556, 3, -2);
  assert.deepEqual(a, b);
  assert.ok(a.x !== c.x || a.z !== c.z);
  const t1 = makeTerrain(555), t2 = makeTerrain(555);
  for (const [x, z] of [[12, 40], [-77, 130], [300, -45]]) assert.equal(t1.heightAt(x, z), t2.heightAt(x, z));
});

test('az első nevezetesség közel van a kezdőhelyhez, és a közelben mind a négy fajta megvan', () => {
  for (const seed of SEEDS) {
    const s0 = siteOfCell(seed, 0, 0), d0 = Math.hypot(s0.x, s0.z);
    assert.ok(d0 >= 36 && d0 <= 42, `mag ${seed}: az első ${d0.toFixed(1)} egységre van`);
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => siteOfCell(seed, a, b));
    assert.equal(new Set(near.map(s => s.type)).size, LANDMARKS.length, `mag ${seed}: a szomszédos cellákban minden fajta`);
    // bármelyik cellából nézve is igaz, és a nevezetesség a saját celláján belül marad (a simító sávval együtt)
    for (let cx = -4; cx <= 4; cx++) for (let cz = -4; cz <= 4; cz++) {
      const s = siteOfCell(seed, cx, cz);
      assert.ok(Math.abs(s.x - cx * CELL) + SITE_FLAT + SITE_BLEND <= CELL / 2 && Math.abs(s.z - cz * CELL) + SITE_FLAT + SITE_BLEND <= CELL / 2, `mag ${seed}, cella ${cx},${cz}: kilóg`);
      const ring = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => siteOfCell(seed, cx + a, cz + b).type);
      assert.equal(new Set(ring).size, LANDMARKS.length);
    }
  }
});

test('a nevezetesség körül sík a talaj, és a széle simán olvad a dombokba (nincs lépcső)', () => {
  for (const seed of SEEDS) {
    const t = makeTerrain(seed);
    for (const [cx, cz] of [[0, 0], [1, 0], [-2, 3]]) {
      const s = t.siteAt(cx * CELL, cz * CELL);
      for (let a = 0; a < 6.28; a += 0.4) for (const r of [0, 2, 5, SITE_FLAT - 0.01]) {
        assert.ok(Math.abs(t.heightAt(s.x + Math.sin(a) * r, s.z + Math.cos(a) * r) - s.y) < 1e-9, `mag ${seed}: nem sík ${r} egységnél`);
      }
      // a sáv mentén kis lépésekben nincs ugrás
      for (let a = 0; a < 6.28; a += 0.7) {
        let prev = t.heightAt(s.x, s.z);
        for (let r = 0.25; r <= SITE_FLAT + SITE_BLEND + 3; r += 0.25) {
          const h = t.heightAt(s.x + Math.sin(a) * r, s.z + Math.cos(a) * r);
          assert.ok(Math.abs(h - prev) < 0.45, `mag ${seed}: lépcső ${r} egységnél (${(h - prev).toFixed(2)})`);
          prev = h;
        }
      }
    }
    assert.ok(Math.abs(t.heightAt(0, 0)) < 1e-9, 'a kezdőpont sík marad');
  }
});

test('a vezető fény a legközelebbi még meg nem talált fajtához visz; ha mind megvan, akkor is van célja', () => {
  for (const seed of SEEDS) {
    const t = makeTerrain(seed), found = new Set();
    let x = 0, z = 0, walked = 0;
    for (let i = 0; i < LANDMARKS.length; i++) {
      const g = guideGoal(t, x, z, found);
      assert.ok(g && !found.has(g.type), `mag ${seed}: a cél új fajta`);
      const d = Math.hypot(g.x - x, g.z - z);
      assert.ok(d < 2.2 * CELL, `mag ${seed}: a következő ${d.toFixed(0)} egységre van`);
      walked += d; x = g.x; z = g.z; found.add(g.type);
    }
    assert.ok(walked < 480, `mag ${seed}: mind a négy megtalálható ${walked.toFixed(0)} egység futással`);   // kb. egy perc futás
    const g = guideGoal(t, x, z, found);
    assert.ok(g && Math.hypot(g.x - x, g.z - z) > FIND_R, 'minden megvan: a fény egy másik nevezetességhez visz');
  }
});

test('a gyerek világa és a megtalált nevezetességek a profiljában maradnak (a fájlba mentésen át is)', () => {
  const st = new FakeStorage(), p = openProfiles(st);
  assert.equal(p.get().world, null);
  const w = p.world(); assert.ok(Number.isInteger(w.seed) && w.seed >= 0);
  assert.equal(p.world().seed, w.seed, 'a mag nem változik');
  p.foundLandmark('kut'); p.foundLandmark('kut'); p.foundLandmark('fa');
  const again = openProfiles(st).get().world;
  assert.equal(again.seed, w.seed); assert.deepEqual(again.found, ['kut', 'fa']);
  assert.ok(p.use(p.importData(p.exportData())));
  assert.deepEqual(p.get().world, { seed: w.seed, found: ['kut', 'fa'], adv: { i: 0, n: 0 } });
  const bad = p.exportData(); bad.profile.world = { seed: 'x', found: ['<b>'] };
  assert.ok(p.use(p.importData(bad))); assert.equal(p.get().world, null);
  const odd = p.exportData(); odd.profile.world = { seed: -5, found: ['kut', '<x>', 'kut', 9] };
  assert.ok(p.use(p.importData(odd))); assert.deepEqual(p.get().world, { seed: 0, found: ['kut'], adv: { i: 0, n: 0 } });
  p.reset(); assert.equal(p.get().world, null, 'újrakezdéskor új világ jön');
});

// --- kalandok és gyűjthető dolgok (M7, 2. szelet) ---
const CH = 30;   // a chunk oldala a játékban (js/rewards/openworld.js)

test('kalandok: minden dolognak saját ikonja van, a mondatok rövidek és kimondhatók', () => {
  assert.equal(new Set(ITEMS.map(i => i.id)).size, ITEMS.length);
  for (const i of ITEMS) assert.ok(ICONS['it-' + i.id], 'nincs ikon: ' + i.id);
  for (const a of ADVENTURES) {
    assert.ok(ITEMS.some(i => i.id === a.item), a.item);
    assert.ok(a.need >= 10 && a.need <= 18, 'a pöttyök elférnek (legfeljebb három sor)');
    for (const t of [a.intro, a.done]) {
      assert.doesNotMatch(t, /[0-9]/, t); assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, t);
      for (const s of sentences(t)) assert.ok(words(s) <= 12, `túl hosszú: ${s}`);
    }
    assert.match(a.done, /Megvan/);
  }
  assert.equal(adventureAt(ADVENTURES.length).item, ADVENTURES[0].item, 'körbe jár');
});

test('a kaland mentett állása megbízhatatlan adatból is rendbe jön', () => {
  assert.deepEqual(cleanAdventure(null), { i: 0, n: 0 });
  assert.deepEqual(cleanAdventure({ i: '2', n: 5 }), { i: 2, n: 5 });
  assert.deepEqual(cleanAdventure({ i: -4, n: -1 }), { i: 0, n: 0 });
  assert.deepEqual(cleanAdventure({ i: 0, n: 999 }), { i: 0, n: ADVENTURES[0].need });
  assert.deepEqual(cleanAdventure({ i: 'x', n: null }), { i: 0, n: 0 });
  assert.deepEqual(cleanAdventure({ i: 1e12, n: 3 }), { i: 9999, n: 3 });
});

test('a gyűjthető dolgok helye a magból jön, és a kezdőhelytől nyom vezet az első nevezetesség felé', () => {
  for (const seed of SEEDS) {
    assert.deepEqual(itemSpots(seed, 2, -3, CH), itemSpots(seed, 2, -3, CH));
    const s0 = siteOfCell(seed, 0, 0), keys = new Set(), trail = [];
    for (let cx = -6; cx <= 6; cx++) for (let cz = -6; cz <= 6; cz++) for (const it of itemSpots(seed, cx, cz, CH)) {
      assert.ok(!keys.has(it.key), 'egyedi kulcs'); keys.add(it.key);
      assert.equal(Math.floor((it.x + CH / 2) / CH), cx); assert.equal(Math.floor((it.z + CH / 2) / CH), cz);   // a saját chunkjában
      assert.ok(Math.hypot(it.x, it.z) > 6, 'a kezdőhely szabad');
      if (it.key.startsWith('nyom')) trail.push(it);
    }
    assert.equal(trail.length, TRAIL.length, `mag ${seed}: a nyom megvan`);
    for (const it of trail) assert.ok(Math.abs(it.x * s0.z - it.z * s0.x) / Math.hypot(s0.x, s0.z) < 1e-6 && it.x * s0.x + it.z * s0.z > 0, 'a nyom az első nevezetesség felé mutat');
  }
});

test('egy kaland nagyjából egy jutalomkörnyi futás (nem túl rövid, nem végtelen)', () => {
  // mohó "gyerek": mindig a legközelebbi látható (40 egységen belüli) dolog felé fut; ha nem lát semmit, egyenesen fut tovább
  const WALK = 7.5, need = adventureAt(0).need;
  for (const seed of SEEDS) {
    const got = new Set(); let x = 0, z = 0, walked = 0, steps = 0;
    while (got.size < need && steps++ < 5000) {
      const cx = Math.floor((x + CH / 2) / CH), cz = Math.floor((z + CH / 2) / CH);
      let best = null, bd = 40;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const it of itemSpots(seed, cx + a, cz + b, CH)) {
        const d = Math.hypot(it.x - x, it.z - z); if (!got.has(it.key) && d < bd) { bd = d; best = it; }
      }
      if (best) { walked += Math.max(0, bd - PICK_R); x = best.x; z = best.z; got.add(best.key); }
      else { x += 6; z -= 8; walked += 10; }
    }
    const secs = walked / WALK;
    assert.equal(got.size, need, `mag ${seed}: nem gyűlt össze`);
    assert.ok(secs > 40 && secs < 240, `mag ${seed}: az első kaland ${secs.toFixed(0)} mp célzott futás`);
  }
});

test('kész kaland: egy ajándék a közös létráról, körönként legfeljebb egy; az állás a profilban marad', () => {
  const st = new FakeStorage(), p = openProfiles(st);
  p.world();
  const need = adventureAt(0).need, sess = newRewardSession();
  assert.equal(p.adventureDone(sess), null, 'még nincs kész');
  for (let k = 0; k < need + 3; k++) p.pickItem();
  assert.equal(p.get().world.adv.n, need, 'nem szalad túl');
  assert.deepEqual(openProfiles(st).get().world.adv, { i: 0, n: need }, 'minden darab azonnal mentve');
  const owned0 = p.get().owned.length, gold0 = p.get().gold, g = p.adventureDone(sess);
  assert.ok(g && g.id, 'ajándék jár');
  assert.equal(p.get().owned.length + p.get().gold, owned0 + gold0 + 1, 'egy új dolog a ruhatárban vagy a kertben');
  assert.deepEqual(p.get().world.adv, { i: 1, n: 0 }, 'jön a következő kaland');
  assert.equal(p.adventureDone(sess), null, 'kétszer nem fizet');
  for (let k = 0; k < adventureAt(1).need; k++) p.pickItem();
  assert.equal(p.adventureDone(sess), null, 'ugyanabban a körben a második kaland ajándéka vár');
  assert.equal(p.get().world.adv.n, adventureAt(1).need, 'a kész kaland megmarad a következő körre');
  assert.ok(p.adventureDone(newRewardSession()), 'a következő körben megjön');
  const s2 = newRewardSession(); assert.ok(adventureReward(p.get(), s2)); assert.equal(adventureReward(p.get(), s2), null);
  assert.ok(p.use(p.importData(p.exportData())));
  assert.deepEqual(p.get().world.adv, { i: 2, n: 0 });
  const bad = p.exportData(); bad.profile.world.adv = { i: 'x', n: 77 };
  assert.ok(p.use(p.importData(bad))); assert.deepEqual(p.get().world.adv, { i: 0, n: adventureAt(0).need });
});

// --- élőhelyek (M7, 3. szelet) ---
test('élőhelyek: teljes színpaletták, rövid, kimondható mondatok', () => {
  assert.equal(new Set(BIOMES.map(b => b.id)).size, BIOMES.length);
  assert.equal(BIOMES[0].id, 'ret', 'az első az otthoni rét');
  const hex = v => Number.isInteger(v) && v >= 0 && v <= 0xffffff;
  for (const b of BIOMES) {
    assert.ok(b.ground.length === 4 && b.crowns.length === 4 && b.flowers.length === 6, b.id);
    for (const v of [...b.ground, ...b.crowns, ...b.flowers, b.rock, b.puddle, b.sky]) assert.ok(hex(v), b.id);
    assert.ok(['lepke', 'feny', 'level', 'szikra', 'ho'].includes(b.mote) && b.sounds.length >= 1, b.id);
    assert.doesNotMatch(b.line, /[0-9]/); assert.ok(b.line.startsWith(b.name + '!'), b.line);
    for (const s of sentences(b.line)) assert.ok(words(s) <= 12, `túl hosszú: ${s}`);
  }
});

test('élőhelyek: a magból jönnek, otthon mindig rét van, és mindegyik elég nagy részt kap', () => {
  const tot = Object.fromEntries(BIOMES.map(b => [b.id, 0])); let n = 0;
  for (const seed of SEEDS) {
    const A = makeBiomes(seed), B = makeBiomes(seed), W = [];
    for (const [x, z] of [[300, -120], [-640, 410], [55, 900]]) assert.deepEqual(A.weights(x, z), B.weights(x, z));
    for (let a = 0; a < 6.28; a += 0.2) for (const r of [0, 20, 45, HOME_R - 1]) assert.equal(A.biomeAt(Math.sin(a) * r, Math.cos(a) * r).id, 'ret', `mag ${seed}: otthon nem rét (${r})`);
    A.weights(123, 456, W); assert.ok(Math.abs(W.reduce((s, v) => s + v, 0) - 1) < 1e-9, 'a súlyok összege egy');
    let near = Infinity;
    for (let x = -1200; x <= 1200; x += 24) for (let z = -1200; z <= 1200; z += 24) {
      const r = Math.hypot(x, z); if (r < 100) continue;
      const id = A.biomeAt(x, z).id; tot[id]++; n++; if (id !== 'ret') near = Math.min(near, r);
    }
    assert.ok(near < 200, `mag ${seed}: az első más táj ${near.toFixed(0)} egységre`);
  }
  for (const b of BIOMES) assert.ok(tot[b.id] / n > 0.1, `${b.id}: csak ${(100 * tot[b.id] / n).toFixed(0)}%`);
});

test('élőhelyek: a határon a színek simán olvadnak (nincs éles vonal a talajon)', () => {
  const ch = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  for (const seed of [0, 101, 555]) {
    const A = makeBiomes(seed), W = [];
    let worst = 0;
    for (let a = 0; a < 6.28; a += 0.9) {
      let prev = null;
      for (let r = 80; r < 700; r += 0.5) {   // fél egység: kb. egy talaj-rácspont távolsága
        const c = ch(mixHex(A.weights(Math.sin(a) * r, Math.cos(a) * r, W), b => b.ground[0]));
        if (prev) worst = Math.max(worst, ...c.map((v, i) => Math.abs(v - prev[i])));
        prev = c;
      }
    }
    assert.ok(worst < 24, `mag ${seed}: a legnagyobb ugrás ${worst} (0–255)`);
  }
});
