// Szülői sarok (M8, Node): pihenő-időzítő, kiejtés-javító, haladás-térkép, a pihenő-beállítás mentése.
// node --test tests/parent.test.mjs – a nevek kitalált tesztnevek, a tároló memóriában él.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBreakTimer, REST_MS, BREAK_DEFAULT } from '../js/break-timer.js';
import { cleanFixes, applyFixes, FIX_MAX } from '../js/speech-fix.js';
import { progressMap } from '../js/progress-map.js';
import { SKILL_NAMES, skillName, LEVEL_NAMES } from '../js/content/skill-names.js';
import { POOL } from '../js/content/index.js';
import { ALL_STATIONS } from '../js/curriculum.js';
import { record, ensure } from '../js/scheduler-core.js';
import { openProfiles } from '../js/progress.js';

class FakeStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const MIN = 60000;

test('pihenő: csak a látható játékidő számít, a beállított perc után esedékes, utána elölről', () => {
  let t = 0; const now = () => t; let m = 20;
  const b = createBreakTimer({ now, minutes: () => m });
  assert.equal(b.due(), false, 'indulás előtt nem esedékes');
  b.visible(false); t = 10 * MIN; b.visible(true); t = 30 * MIN; assert.equal(b.elapsed(), 0, 'a kezdőképernyőn töltött idő nem számít');
  t = 0; b.start(); t = 19 * MIN; assert.equal(b.due(), false);
  b.visible(false); t += 3 * MIN; b.visible(true);                 // rövid háttér: nem számít bele, de nem is pihenő
  assert.equal(Math.round(b.elapsed() / MIN), 19);
  t += 1 * MIN; assert.equal(b.due(), true, '20 perc látható játék után');
  b.rested(); assert.equal(b.due(), false); t += 19 * MIN; assert.equal(b.due(), false); t += MIN; assert.equal(b.due(), true, 'pihenő után újra 20 perc');
  b.rested(); t += 10 * MIN; b.visible(false); t += REST_MS; b.visible(true); t += 15 * MIN;
  assert.equal(b.due(), false, 'öt perc a háttérben = pihenő volt, elölről számol');
  m = 0; t += 60 * MIN; assert.equal(b.due(), false, 'kikapcsolva soha');
  assert.equal(BREAK_DEFAULT, 20);
});

test('kiejtés-javító: egész szóra, ékezetes betűkkel is, kis- és nagybetűtől függetlenül; a bevitt szöveg nem minta', () => {
  const fx = [['csillag', 'csil-lag'], ['tyúk', 'tyuuk'], ['a.b', 'X']];
  assert.equal(applyFixes('Csillag ragyog. csillagok', fx), 'csil-lag ragyog. csillagok');
  assert.equal(applyFixes('A tyúk és a tyúkok, kistyúk', fx), 'A tyuuk és a tyúkok, kistyúk');
  assert.equal(applyFixes('aXb a.b', fx), 'aXb X', 'a pont nem joker');
  assert.equal(applyFixes('ő ő!', [['ő', 'öö']]), 'öö öö!');
  const many = Array.from({ length: 50 }, (_, i) => ['szó' + i, 'x']);
  assert.equal(cleanFixes(many).length, FIX_MAX);
  assert.deepEqual(cleanFixes([['  Sün ', ' sü-ün '], ['sün', 'süün'], ['', 'x'], ['123', 'y'], 'rossz', ['<b>', 'x']]), [['sün', 'süün'], ['b', 'x']], 'a jelek kimaradnak');
  assert.equal(cleanFixes([['a'.repeat(80), 'b']])[0][0].length, 30);
  assert.deepEqual(cleanFixes(null), []);
});

test('haladás-térkép: minden állomás és készség szerepel, névvel; a szint és a gyakorlás a mentésből jön', () => {
  const missing = [...new Set(POOL.filter(e => e.skill && !String(e.skill).startsWith('legacy.')).map(e => e.skill))].filter(s => !SKILL_NAMES[s]);
  assert.deepEqual(missing, [], 'készség név nélkül');
  assert.equal(LEVEL_NAMES.length, 5); assert.equal(skillName('ismeretlen.dolog'), 'dolog');
  const st = ensure({ age: 5, done: { szamol: 3 } }), e = POOL.find(x => x.skill === 'szamol.megszamlalas' && x.level === 1), e2 = POOL.find(x => x.skill === 'szamol.ranezes');
  record(st, e, {}, 1000); record(st, e2, { wrong: 2 }, 2000);
  const map = progressMap(st, ALL_STATIONS, POOL);
  assert.equal(map.length, ALL_STATIONS.length);
  const sz = map.find(m => m.id === 'szamol');
  assert.equal(sz.lv, 1); assert.equal(sz.level, 'előkészítő'); assert.equal(sz.done, 3); assert.equal(sz.practiced, 2);
  assert.equal(sz.skills.find(s => s.id === 'szamol.megszamlalas').n, 1);
  assert.equal(sz.skills.find(s => s.id === 'szamol.ranezes').again, 1, 'a nem elsőre megoldott feladat ismétlésre vár');
  const fresh = progressMap({}, ALL_STATIONS, POOL);
  assert.ok(fresh.every(m => m.lv === 0 && m.level === '' && m.practiced === 0), 'üres mentésnél nincs kitalált szint');
});

test('pihenő-beállítás: profilonként mentődik, fájlon át is; hibás érték helyett az alapérték; az újrakezdés megtartja', () => {
  const st = new FakeStorage(), p = openProfiles(st);
  const pid = p.create({ name: 'Teszt Panna', age: 5 }); p.use(pid);
  assert.equal(p.get().breakMin, 20);
  p.set({ breakMin: 30 }); const again = openProfiles(st); again.use(pid); assert.equal(again.get().breakMin, 30, 'újratöltés után is');
  const file = JSON.parse(JSON.stringify(p.exportData()));
  const q = openProfiles(new FakeStorage()); const id = q.importData(file); q.use(id); assert.equal(q.get().breakMin, 30);
  file.profile.breakMin = 999; const id2 = q.importData(file); q.use(id2); assert.equal(q.get().breakMin, 20, 'idegen érték');
  p.reset(); assert.equal(p.get().breakMin, 30, 'az újrakezdés a beállítást megtartja');
  const bad = new FakeStorage({ 'csillagkert:profiles': JSON.stringify({ v: 1, ids: ['p1'], active: 'p1' }), 'csillagkert:p:p1': JSON.stringify({ v2: true, total: 3, breakMin: 'sok' }) });
  assert.equal(openProfiles(bad).get().breakMin, 20);
});
