// Tartalom-ellenőrzés (Node): futtatás a repó gyökeréből: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, STATIONS, stationOf, idOf, BASE_ITEMS, FEED_ITEMS } from '../js/curriculum.js';
import { art, withArt, artLetter, ACC_NUM, numAttr, fromNum } from '../js/hu.js';

const flat = CURRICULUM.flatMap(i => (i.type === 'seq' ? [i, ...i.steps] : [i]));
const picks = flat.filter(i => i.type === 'pick'), orders = flat.filter(i => i.type === 'order');

test('minden feladatnak egyedi azonosítója van', () => {
  const seen = new Map();
  for (const it of CURRICULUM) { const id = idOf(it); assert.ok(id, 'üres azonosító'); assert.ok(!seen.has(id), `ismétlődő azonosító: ${id}`); seen.set(id, it); }
  assert.equal(seen.size, BASE_ITEMS.length + FEED_ITEMS.length);
});

test('minden feladat egy létező állomáshoz tartozik, és minden állomáson van feladat', () => {
  const ids = new Set(STATIONS.map(s => s.id));
  for (const it of CURRICULUM) assert.ok(ids.has(stationOf(it)), `ismeretlen állomás: ${stationOf(it)}`);
  for (const s of STATIONS) assert.ok(CURRICULUM.some(i => stationOf(i) === s.id), `üres állomás: ${s.id}`);
});

test('választós feladat: pontosan egy helyes válasz, nincs ismétlődő válasz, van tény', () => {
  for (const p of picks) {
    assert.equal(p.options.filter(o => o.ok).length, 1, `nem egy helyes válasz: ${p.prompt}`);
    const names = p.options.map(o => o.name || o.t);
    assert.equal(new Set(names).size, names.length, `ismétlődő válasz: ${p.prompt}`);
    assert.ok(p.fact, `hiányzó tény: ${p.prompt}`);
  }
});

test('sorba rendezés: van tény, és a kártyák nem árulják el számjeggyel a sorrendet', () => {
  for (const o of orders) {
    assert.ok(o.fact, `hiányzó tény: ${o.prompt}`);
    for (const s of o.steps) assert.ok(!/[0-9]️?⃣/.test(s.t), `számjegyes kártya: ${o.prompt}`);
  }
});

test('a kimondott kérdésekben nincs matematikai jel', () => {
  for (const it of flat) for (const txt of [it.say, it.fact].filter(Boolean)) assert.ok(!/[×÷]/.test(txt), `jel a szövegben: ${txt}`);
});

test('rosszul besorolt feladatok a helyükön vannak', () => {
  const where = prompt => stationOf(flat.find(i => i.prompt === prompt));
  assert.equal(where('Mivel látunk?'), 'test');
  assert.equal(where('Mivel szagolunk?'), 'test');
  assert.equal(where('Esik az eső. Mit viszünk magunkkal?'), 'vilag');
  assert.equal(where('Piros a lámpa. Mit csinálsz?'), 'vilag');
  assert.equal(where('Hogyan mosunk fogat? Koppints sorrendben!'), 'egeszseg');
});

test('zene: Kodály-sorrend (szó–mi-vel kezd), minden mód ismert', () => {
  const music = CURRICULUM.filter(i => i.type === 'music');
  const firstLearn = music.find(i => i.mode === 'learn');
  assert.deepEqual(firstLearn.notes, ['szo', 'mi']);
  for (const m of music) assert.ok(['learn', 'highlow', 'loud', 'same', 'updown'].includes(m.mode), `ismeretlen mód: ${m.mode}`);
});

test('magyar nyelvtani segédek', () => {
  assert.equal(art('alma'), 'az'); assert.equal(art('körte'), 'a'); assert.equal(withArt('őz', true), 'Az őz');
  assert.equal(artLetter('M'), 'az'); assert.equal(artLetter('K'), 'a');
  assert.equal(ACC_NUM[3], 'hármat'); assert.equal(numAttr('tizenkettő'), 'tizenkét');
  const from = { öt: 'ötből', hat: 'hatból', három: 'háromból', tíz: 'tízből', nyolc: 'nyolcból', kilenc: 'kilencből', kettő: 'kettőből', húsz: 'húszból', tizenhét: 'tizenhétből', egy: 'egyből' };
  for (const [w, exp] of Object.entries(from)) assert.equal(fromNum(w), exp);
});
