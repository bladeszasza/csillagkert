// A Varázsvilág térképe (js/world-map.js): a nevezetességek helye, a sík talaj körülöttük, a vezető fény célja, a mentés.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDMARKS, WORLD_LINES, landmarkById, siteOfCell, makeTerrain, guideGoal, CELL, SITE_FLAT, SITE_BLEND, FIND_R } from '../js/world-map.js';
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
  assert.deepEqual(p.get().world, { seed: w.seed, found: ['kut', 'fa'] });
  const bad = p.exportData(); bad.profile.world = { seed: 'x', found: ['<b>'] };
  assert.ok(p.use(p.importData(bad))); assert.equal(p.get().world, null);
  const odd = p.exportData(); odd.profile.world = { seed: -5, found: ['kut', '<x>', 'kut', 9] };
  assert.ok(p.use(p.importData(odd))); assert.deepEqual(p.get().world, { seed: 0, found: ['kut'] });
  p.reset(); assert.equal(p.get().world, null, 'újrakezdéskor új világ jön');
});
