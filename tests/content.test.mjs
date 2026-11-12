// Tartalom-ellenőrzés (Node): futtatás a repó gyökeréből: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, STATIONS, stationOf, idOf, BASE_ITEMS, FEED_ITEMS } from '../js/curriculum.js';
import { art, withArt, artLetter, ACC_NUM, numAttr, fromNum } from '../js/hu.js';
import { FRIENDS, FOODS, MEALS, friendById, friendsFor, flowerSpot, MAX_FLOWERS, FEED_SPOT } from '../js/friends.js';
import { progress } from '../js/progress.js';

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

test('etetés: csak a kert 3D lakóit etetjük, a jó étel igaz, a rossz étel biztosan téves', () => {
  const keys = new Set();
  MEALS.forEach(([kind, good, ...wrong], i) => {
    const f = friendById(kind);
    assert.ok(f, `ismeretlen állat: ${kind}`);
    assert.ok(f.eats.includes(good), `${f.name} nem eszik ilyet: ${good}`);
    assert.ok(wrong.length >= 2, `legalább három válasz kell: ${kind} ${good}`);
    for (const w of wrong) assert.ok(!f.eats.includes(w) && !f.maybe.includes(w), `védhető "rossz" válasz: ${f.name} – ${w}`);
    for (const x of [good, ...wrong]) { assert.ok(FOODS[x]?.acc, `hiányzó tárgyeset: ${x}`); assert.ok(FOODS[x].t || FOODS[x].svg, `hiányzó kép: ${x}`); }
    assert.equal(new Set([good, ...wrong]).size, wrong.length + 1, `ismétlődő étel: ${kind} ${good}`);
    if (i > 0) assert.notEqual(MEALS[i - 1][0], kind, 'egymás után ugyanaz az állat éhes');
    const key = `${kind}|${good}`; assert.ok(!keys.has(key), `ismétlődő tény: ${key}`); keys.add(key);
  });
  // minden rossz válaszként használt étel legalább egyszer jó válasz is (ne lehessen kizárással megtanulni)
  const goods = new Set(MEALS.map(m => m[1]));
  for (const w of new Set(MEALS.flatMap(m => m.slice(2)))) assert.ok(goods.has(w), `soha nem helyes étel: ${w}`);
  // a feladatsorban az etetésnek saját kulcsa van (állat + jó étel), és minden barátot lehet etetni
  assert.deepEqual(FEED_ITEMS.map(idOf), MEALS.map(m => `feed-${m[0]}-${m[1]}`));
  for (const f of FRIENDS) assert.ok(MEALS.some(m => m[0] === f.id), `nincs etetős feladata: ${f.name}`);
});

test('kert: a barátok a csillagokkal érkeznek, etetéssel hamarabb is', () => {
  assert.deepEqual(friendsFor(0), ['cat']);
  assert.deepEqual(friendsFor(3), ['cat', 'bunny']);
  assert.deepEqual(friendsFor(10), ['cat', 'bunny', 'dog']);
  assert.deepEqual(friendsFor(29), ['cat', 'bunny', 'dog', 'fox']);
  assert.deepEqual(friendsFor(60), ['cat', 'bunny', 'dog', 'fox', 'bear', 'panda']);
  assert.deepEqual(friendsFor(0, ['panda']), ['cat', 'panda']);
});

test('kert: a virágok nem ülnek egymásra, a barátok zugában és az etetőhely előtt nincs virág', () => {
  const pts = Array.from({ length: MAX_FLOWERS }, (_, i) => flowerSpot(i));
  assert.equal(new Set(pts.map(p => `${p.x.toFixed(3)},${p.z.toFixed(3)}`)).size, MAX_FLOWERS);
  for (let i = 0; i < 200; i++) for (let j = 0; j < i; j++) assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z) > 0.6, `túl közeli virágok: ${i}, ${j}`);
  for (const p of pts) {
    for (const f of FRIENDS) assert.ok(Math.hypot(p.x - f.home[0], p.z - f.home[1]) > 1.3, `virág ${f.name} zugában`);
    assert.ok(!(Math.abs(p.x - FEED_SPOT[0]) < 1.7 && p.z > 2.3), 'virág az etetőhely előtt');
    assert.ok(Math.hypot(p.x, p.z) < 13, 'virág a kerten kívül');
  }
});

test('mentés: régi mentésben nincs "friends" mező – üresről indul, bővíthető, újrakezdéskor törlődik', () => {
  assert.deepEqual(progress.get().friends, []);
  progress.addFriend('panda'); progress.addFriend('panda'); progress.addFriend('fox');
  assert.deepEqual(progress.get().friends, ['panda', 'fox']);
  progress.reset();
  assert.deepEqual(progress.get().friends, []);
});
