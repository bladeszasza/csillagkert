// „Az én unikornisom": az öltöztető leírása (js/avatar.js), a 3D unikornis (js/three/characters.js), a háttér-rajz
// (js/avatar-svg.js) és a Sparkhorn-futásnak átadott színek. Minden választható elemnek látszania kell, és a
// legnehezebb öltözet is beleférjen a kert háromszög-keretébe.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { TABS, GROUPS, DEFAULT, MAX_STICKERS, normalizeDress, resolveAvatar, sparkPalette, SPARK_KEY } from '../js/avatar.js';
import { dressSvg, backdropSvg } from '../js/avatar-svg.js';
import { makeCharacter, measureCharacter, createCharacterBatch } from '../js/three/characters.js';
import { CATALOG } from '../js/gifts.js';

const LOOKS_2D = new Set(['bg', 'stickers']);                    // ezek a háttérben látszanak, nem az unikornison
const signature = cfg => {
  const g = makeCharacter('unicorn', cfg); g.updateMatrixWorld(true);
  return g.userData.parts.map(p => {
    const m = new THREE.Matrix4().multiplyMatrices(p.node.matrixWorld, p.m);
    return `${p.prim}:${p.color.getHexString()}:${m.elements.map(x => x.toFixed(3)).join(',')}`;
  }).sort().join('|');
};
const withItem = (key, id) => key === 'stickers' ? { ...DEFAULT, stickers: [id] } : { ...DEFAULT, [key]: id };
// alapformánként a háromszögek száma, abból, amit a kert példányosított rajzolója ténylegesen használ
const TRIS = (() => {
  const b = createCharacterBatch(new THREE.Scene());
  const t = b.meshes.map(m => (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3);
  b.dispose(); return t;
})();
const tris = g => g.userData.parts.reduce((s, p) => s + TRIS[p.prim], 0);
const HEX = /^#[0-9a-f]{6}$/;

test('a mentett ruha rendbetétele: ismeretlen érték helyett alap, a meg nem nyert ajándék lekerül', () => {
  for (const bad of [null, undefined, 7, 'korona', [], { body: 'c99', head: 'kalap', stickers: 'star' }]) assert.deepEqual(normalizeDress(bad), DEFAULT);
  assert.equal(normalizeDress({ head: 'crown' }).head, 'crown', 'tulajdonos-ellenőrzés nélkül marad');
  assert.equal(normalizeDress({ head: 'crown' }, () => false).head, 'none', 'nem nyerte meg: lekerül');
  assert.equal(normalizeDress({ head: 'crown' }, id => id === 'head:crown').head, 'crown');
  assert.equal(normalizeDress({ head: 'flowers' }, () => false).head, 'flowers', 'a kezdettől szabad elem marad');
  const dressGifts = CATALOG.filter(g => g.kind === 'dress');
  assert.ok(dressGifts.length >= 10);
  for (const g of dressGifts) {
    const [key, id] = g.id.split(':');
    assert.ok(GROUPS.find(x => x.key === key)?.items.some(i => i.id === id), `az ajándék az öltöztetőben is megvan: ${g.id}`);
    assert.equal(normalizeDress({ [key]: id }, () => false)[key], DEFAULT[key], `meg nem nyert: ${g.id}`);
  }
  const st = normalizeDress({ stickers: ['star', 'star', 'heart', 'nope', 'flower', 'moon', 'rain'] }).stickers;
  assert.deepEqual(st, ['heart', 'flower', 'moon', 'rain']);
  assert.equal(st.length, MAX_STICKERS);
});

test('minden választható elem látszik: az unikornison, vagy (háttér, matrica) a háttérképen', () => {
  const base = signature(DEFAULT), bg0 = backdropSvg(DEFAULT);
  let n = 0;
  for (const t of TABS) for (const g of t.groups) for (const it of g.items) {
    const cfg = withItem(g.key, it.id);
    if (g.key !== 'stickers' && it.id === DEFAULT[g.key]) continue;
    n++;
    if (LOOKS_2D.has(g.key)) {
      assert.notEqual(backdropSvg(cfg), bg0, `${g.key}:${it.id} a háttéren`);
      assert.equal(signature(cfg), base, `${g.key}:${it.id} nem változtatja az unikornist`);
    } else assert.notEqual(signature(cfg), base, `${g.key}:${it.id} látszik az unikornison`);
  }
  assert.ok(n >= 40, `elemek: ${n}`);
});

test('az unikornis mérete: minden elemmel a talaján áll, és elfér az öltöztető és a kert keretében', () => {
  for (const g of GROUPS) for (const it of g.items) {
    const m = measureCharacter(makeCharacter('unicorn', withItem(g.key, it.id)));
    assert.ok(Math.abs(m.bottom) < 0.03, `${g.key}:${it.id} talaj: ${m.bottom.toFixed(3)}`);
    assert.ok(m.height > 2 && m.height < 2.5, `${g.key}:${it.id} magasság: ${m.height.toFixed(2)}`);
    assert.ok(m.width < 1.6, `${g.key}:${it.id} szélesség: ${m.width.toFixed(2)}`);
  }
});

test('a legnehezebb öltözet is a keretben marad (alkatrész és háromszög)', () => {
  // csoportonként a legtöbb alkatrészt adó elem
  const heavy = { ...DEFAULT };
  for (const g of GROUPS) {
    if (LOOKS_2D.has(g.key)) continue;
    let best = null, bestN = -1;
    for (const it of g.items) { const n = makeCharacter('unicorn', withItem(g.key, it.id)).userData.parts.length; if (n > bestN) { bestN = n; best = it.id; } }
    heavy[g.key] = best;
  }
  const gh = makeCharacter('unicorn', heavy), g0 = makeCharacter('unicorn');
  assert.ok(g0.userData.parts.length <= 40, `alap: ${g0.userData.parts.length}`);
  assert.ok(gh.userData.parts.length <= 120, `legnehezebb: ${gh.userData.parts.length} (${JSON.stringify(heavy)})`);
  // a kert saját kerete 250 ezer háromszög; a saját unikornis ebből legfeljebb kb. 5% (mérve: alap kb. 5,3 ezer, legnehezebb kb. 9,3 ezer)
  assert.ok(tris(gh) <= 12000, `háromszög: ${tris(gh)}`);
  const m = measureCharacter(gh);
  assert.ok(m.height < 2.5 && Math.abs(m.bottom) < 0.03, JSON.stringify(m));
});

test('a 3D építő kész színeket kap; a sötét testen világos a szem és a mosoly', () => {
  const a = resolveAvatar({ body: 'c7', mane: 'rainbow', horn: 'rainbow' });
  assert.equal(a.dark, true);
  assert.equal(a.mane.length, 6); assert.equal(a.horn.length, 6);
  for (const c of [a.body, a.hoof, a.patternColor, ...a.mane, ...a.horn]) assert.match(c, HEX);
  const b = resolveAvatar({});
  assert.equal(b.dark, false); assert.equal(b.mane.length, 2); assert.equal(b.horn.length, 1);
  assert.notEqual(signature({ body: 'c7' }).length, 0);
});

test('a Sparkhorn-futás színei: csak színek, név és más adat nélkül', () => {
  assert.equal(SPARK_KEY, 'csillagkert_avatar');
  for (const cfg of [{}, DEFAULT, { body: 'c7', mane: 'rainbow', horn: 'rainbow' }, { body: 'c3', mane: 'c4', horn: 'ice' }, { name: 'Teszt Elek' }]) {
    const p = sparkPalette(cfg);
    assert.deepEqual(Object.keys(p).sort(), ['body', 'ears', 'eyes', 'horn', 'legs', 'mane', 'tail', 'v']);
    assert.equal(p.v, 1);
    for (const k of ['body', 'legs', 'horn', 'tail', 'ears', 'eyes']) assert.match(p[k], HEX, k);
    assert.equal(p.mane.length, 5); p.mane.forEach(c => assert.match(c, HEX));
    assert.ok(!JSON.stringify(p).includes('Teszt'));
  }
  assert.equal(new Set(sparkPalette({ mane: 'rainbow' }).mane).size, 5, 'a szivárványsörény öt színű');
});

test('a 2D rajz (ajándék-pillanat, háttér): ép SVG minden elemmel', () => {
  for (const g of GROUPS) for (const it of g.items) {
    const cfg = withItem(g.key, it.id);
    for (const svg of [dressSvg(cfg), backdropSvg(cfg)]) {
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), `${g.key}:${it.id}`);
      assert.ok(!/undefined|NaN|null/.test(svg), `${g.key}:${it.id}: hiányzó érték az SVG-ben`);
    }
  }
});

test('Barátom: a saját unikornis mondatai magyarosak (névelő, tárgyeset)', async () => {
  const { withArt, FRIEND_ACC } = await import('../js/hu.js');
  assert.equal(`Simogasd meg ${withArt(FRIEND_ACC.unikornis)}!`, 'Simogasd meg az unikornist!');
  assert.equal(`${withArt('unikornis', true)} nagyon boldog!`, 'Az unikornis nagyon boldog!');
  assert.equal(`${withArt('cica', true)} nagyon boldog!`, 'A cica nagyon boldog!');
});
