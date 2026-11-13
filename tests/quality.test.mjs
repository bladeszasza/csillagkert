// Automatikus minőség (js/three/look.js): mikor és mennyit csökken a felbontás. Tiszta függvény, böngésző nélkül.
// A képkocka-időt egy egyszerű modell adja: fix rész (pl. háromszögek) + a pixelek számával arányos rész.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepQuality, startQuality, Q } from '../js/three/look.js';

const run = (s, ms, frames) => { for (let i = 0; i < frames; i++) s = stepQuality(s, ms); return s; };
// másodpercekig fut egy modell szerint; ratios: milyen felbontásokon járt
function sim(s, model, seconds) {
  const ratios = [s.ratio];
  for (let t = 0; t < seconds * 1000;) { const dt = model(s.ratio); s = stepQuality(s, dt); t += dt; if (s.ratio !== ratios.at(-1)) ratios.push(s.ratio); }
  return { s, ratios };
}
const pixelBound = (fix, perPx) => r => fix + perPx * r * r;      // a felbontás csökkentése segít

test('a kezdő felbontás: a kijelző pixelaránya, a jelenet plafonjáig', () => {
  assert.equal(startQuality(2, 2).ratio, 2);
  assert.equal(startQuality(3, 2).ratio, 2);
  assert.equal(startQuality(2, 1.5).ratio, 1.5);
  assert.equal(startQuality(1, 2).ratio, 1);
  assert.equal(startQuality(undefined, 2).ratio, 1);
});

test('folyamatos 60 fps mellett soha nem csökken', () => {
  const s = run(startQuality(2, 2), 16.7, 60 * 120);
  assert.equal(s.ratio, 2); assert.equal(s.drops, 0);
});

test('ha a felbontás a szűk keresztmetszet: lépcsőnként csökken, amíg a képkocka 20 ms alá nem kerül', () => {
  const { s, ratios } = sim(startQuality(2, 2), pixelBound(8, 7), 60);   // 36 ms → 29 → 24 → 19 ms
  assert.deepEqual(ratios, [2, 1.75, 1.5, 1.25]);
  assert.equal(s.locked, false);
});

test('az első lépcső csak kb. 3 mp tartós akadozás után jön', () => {
  let s = startQuality(2, 2);
  s = run(s, 30, Math.floor(Q.hold / 30) - 5);
  assert.equal(s.ratio, 2, 'még nem lépett');
  s = run(s, 30, 40);
  assert.equal(s.ratio, 1.75);
});

test('ha a lépcső nem segít (a lassúság oka nem a felbontás): visszalép, és többé nem nyúl hozzá', () => {
  const { s, ratios } = sim(startQuality(2, 2), () => 33, 120);         // pl. 30 fps-es energiatakarékos mód
  assert.deepEqual(ratios, [2, 1.75, 2]);
  assert.equal(s.locked, true);
  assert.equal(run(s, 45, 6000).ratio, 2);
});

test('a kiugró képkockák (rejtett lap, elakadás) nem számítanak', () => {
  let s = run(startQuality(2, 2), 1500, 200);       // percekig „akad" (pl. háttérben volt a lap)
  assert.equal(s.ratio, 2);
  s = run(s, Q.spike + 1, 500);
  assert.equal(s.ratio, 2);
  s = run(s, 0, 100); s = run(s, NaN, 100);
  assert.equal(s.ratio, 2);
});

test('rövid lassulás (1 mp) után nem lép', () => {
  let s = startQuality(2, 2);
  s = run(s, 40, 25); s = run(s, 16.7, 600);
  assert.equal(s.ratio, 2);
});

test('az iPad-felbontás lépcsői 2 → 1,75 → 1,5 → 1,25 → 1, és 1 alá nem megy', () => {
  const { s, ratios } = sim(startQuality(2, 2), pixelBound(10, 12), 120);   // 1-es felbontáson is 22 ms
  assert.deepEqual(ratios, [2, 1.75, 1.5, 1.25, 1]);
  assert.equal(s.drops, 4); assert.equal(s.ratio, 1);
});

test('1-es kijelzőn (asztali gép) nincs mit csökkenteni', () => {
  assert.equal(run(startQuality(1, 2), 45, 6000).drops, 0);
  assert.equal(run(startQuality(1, 2), 45, 6000).ratio, 1);
});
