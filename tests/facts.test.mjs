// Ténytáblák (tény-állomások) ellenőrzése: node --test tests/facts.test.mjs
// A közös kapukat (≥ 250 önálló feladat, pontosan egy jó válasz, kimondható mondatok, minden eltérítő máshol helyes)
// a generated.test.mjs futtatja; itt a táblák saját szabályai vannak.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACT_TABLES } from '../js/content/facts/index.js';
import { THINGS, ANIMALS } from '../js/content/banks.js';
import { CATS } from '../js/content/okos.js';
import { factOf } from '../js/content/facts/kit.js';

const DIGIT = /[0-9]/, EMOJI = /\p{Extended_Pictographic}/u;
const words = s => s.split(/\s+/).filter(Boolean).length;
function spoken(txt, where) {
  assert.ok(typeof txt === 'string' && txt.trim(), `üres mondat: ${where}`);
  assert.ok(!DIGIT.test(txt) && !EMOJI.test(txt), `számjegy vagy emoji: "${txt}" (${where})`);
  for (const s of txt.split(/[.!?:]+/).map(x => x.trim()).filter(Boolean)) assert.ok(words(s) <= 12, `túl hosszú mondat: "${s}" (${where})`);
}

test('ténytáblák: azonosítók, legfeljebb két kérdés tényenként, ismert készség és szint', () => {
  for (const { station, skills, facts } of FACT_TABLES) {
    const ids = new Set();
    for (const f of facts) {
      const where = `${station}:${f.id}`;
      assert.ok(/^[a-z0-9-]+$/.test(f.id), `rossz azonosító: ${where}`);
      assert.ok(!ids.has(f.id), `ismétlődő azonosító: ${where}`); ids.add(f.id);
      assert.ok(skills[f.sk], `ismeretlen készség: ${where} (${f.sk})`);
      assert.ok(f.sk.startsWith(station + '.'), `más állomás készsége: ${where}`);
      assert.ok(f.q.length >= 1 && f.q.length <= 2, `${f.q.length} kérdés: ${where}`);
      for (const q of f.q) { const lv = q.lv || f.lv; assert.ok(Number.isInteger(lv) && lv >= 1 && lv <= 5, `rossz szint: ${where}`); }
    }
    for (const sk of Object.keys(skills)) assert.ok(facts.some(f => f.sk === sk), `üres készség: ${sk}`);
  }
});

test('ténytáblák: a tény egy rövid, teljes, kimondható mondat; a kérdés és a segítség is kimondható', () => {
  const sentence = (txt, where) => {
    assert.ok(!txt.includes('{'), `kitöltetlen hely a tényben: "${txt}" (${where})`);
    assert.ok(txt.length <= 70, `hosszú tény (${txt.length} betű): "${txt}" (${where})`);
    assert.ok(/^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(txt) && /[.!]$/.test(txt), `nem teljes mondat: "${txt}" (${where})`);
    spoken(txt, where);
  };
  for (const { station, skills, facts } of FACT_TABLES) {
    for (const s of Object.values(skills)) spoken(s.hint, `${station}: segítség`);
    for (const f of facts) {
      const where = `${station}:${f.id}`;
      // a ténymondat minden jó válasszal kitöltve (a {A} helyén a választott jó válasz áll)
      for (const q of f.q) {
        if (q.kind === 'order') { assert.ok(!(q.f || f.f).includes('{A}'), `sorba rakósnál nincs választott válasz: ${where}`); sentence(q.f || f.f, where); }
        else for (const n of q.a) sentence(factOf(f, q, n), where);
      }
      for (const q of f.q) { spoken(q.ask, where); if (q.hint) spoken(q.hint, where); if (q.kind === 'order') for (const st of q.steps) spoken(st.name, where); }
    }
  }
});

test('ténytáblák: a válaszok a bankból jönnek, a jó és a vitatható válasz külön, és marad elég eltérítő', () => {
  for (const { station, banks, facts } of FACT_TABLES) for (const f of facts) for (const q of f.q) {
    if (q.kind === 'order') { assert.ok(q.steps.length >= 3 && new Set(q.steps.map(s => s.t)).size === q.steps.length, `rossz sor: ${station}:${f.id}`); continue; }
    const where = `${station}:${f.id} "${q.ask}"`, bank = banks[q.bank];
    assert.ok(bank, `ismeretlen bank: ${where}`);
    assert.ok(q.a.length >= 1, `nincs jó válasz: ${where}`);
    for (const n of [...q.a, ...q.x]) assert.ok(bank[n], `nincs a bankban: ${n} (${where})`);
    for (const n of q.a) assert.ok(!q.x.includes(n), `jó és vitatható is: ${n} (${where})`);
    const bad = Object.keys(bank).filter(n => !q.a.includes(n) && !q.x.includes(n));
    assert.ok(bad.length >= 2, `kevesebb mint két eltérítő: ${where}`);
    // a kérdés képe nem lehet maga a jó válasz (akkor csak párosítani kellene)
    if (q.show && !q.sil) for (const n of q.a) assert.notEqual(bank[n].e, q.show, `a kérdés képe a jó válasz: ${where}`);
  }
});

test('ténytáblák: a bankokban minden képnek egy neve van, ugyanaz, mint a többi feladatban', () => {
  const name = new Map(), add = (e, n, where) => { if (!e || e.startsWith('<')) return; if (name.has(e)) assert.equal(name.get(e)[0], n, `${e}: "${name.get(e)[0]}" (${name.get(e)[1]}) és "${n}" (${where})`); else name.set(e, [n, where]); };
  for (const t of THINGS) add(t.e, t.n, 'számolós tárgyak');
  for (const a of ANIMALS) add(a.e, a.n, 'állatok');
  for (const c of Object.values(CATS)) for (const x of c.items) add(x.e, x.n, `kategória: ${c.one}`);
  for (const { station, banks } of FACT_TABLES) for (const [b, bank] of Object.entries(banks)) {
    const faces = Object.values(bank).map(x => x.e ?? 'n' + x.num);
    assert.equal(new Set(faces).size, faces.length, `ismétlődő kép a bankban: ${station}.${b}`);
    for (const x of Object.values(bank)) { add(x.e, x.n, `${station}.${b}`); spoken(x.said, `${station}.${b}.${x.n}`); }
  }
});
