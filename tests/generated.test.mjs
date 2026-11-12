// Minőség-kapuk a generált állomásokra (Node): node --test tests/
// Minden sablon minden célját több maggal felépítjük, és ellenőrizzük azt, amit a gyerek lát és hall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, GENERATED, targetsOf, build, entries } from '../js/content/engine.js';
import { rng } from '../js/content/rng.js';
import { pickSpeech, resetLines } from '../js/lines.js';
import { STATIONS } from '../js/curriculum.js';
import { NOTES } from '../js/notes.js';
import { simulate, solve as robotSolve, compress } from '../js/robot-path.js';

const SEEDS = [1, 2, 3];
const answerOf = o => o.n ?? (o.name || o.key);
// A kimondott mondat: nincs benne számjegy, matematikai jel vagy emoji; egy mondat legfeljebb 12 szó
const DIGIT = /[0-9]/, SIGN = /[+×÷=<>−]| - /, EMOJI = /\p{Extended_Pictographic}/u;
function spoken(txt, where) {
  assert.ok(typeof txt === 'string' && txt.trim(), `üres mondat: ${where}`);
  assert.ok(!DIGIT.test(txt), `számjegy a beszédben: "${txt}" (${where})`);
  assert.ok(!SIGN.test(txt), `jel a beszédben: "${txt}" (${where})`);
  assert.ok(!EMOJI.test(txt), `emoji a beszédben: "${txt}" (${where})`);
  for (const s of txt.split(/[.!?]+/).map(x => x.trim()).filter(Boolean)) assert.ok(s.split(/\s+/).length <= 12, `túl hosszú mondat (${s.split(/\s+/).length} szó): "${s}" (${where})`);
}

test('legalább 250 önálló feladat minden generált állomáson, mind az öt szinten', () => {
  for (const st of GENERATED) {
    const list = entries().filter(e => e.station === st);
    const ids = new Set(list.map(e => e.id));
    assert.equal(ids.size, list.length, `ismétlődő azonosító: ${st}`);
    assert.ok(ids.size >= 250, `${st}: csak ${ids.size} önálló feladat`);
    for (let lv = 1; lv <= 5; lv++) assert.ok(list.filter(e => e.level === lv).length >= 10, `${st}: kevés feladat a(z) ${lv}. szinten`);
    const skills = new Set(list.map(e => e.skill));
    assert.ok(skills.size >= 6 && skills.size <= 12, `${st}: ${skills.size} készség (6–12 kell)`);
  }
});

test('minden sablon ismert állomáshoz tartozik, és a kulcsai egyediek', () => {
  const known = new Set(STATIONS.map(s => s.id));
  for (const t of TEMPLATES) {
    assert.ok(known.has(t.station), `ismeretlen állomás: ${t.id}`);
    assert.ok(/^[a-z0-9._-]+$/.test(t.skill), `rossz készség-azonosító: ${t.skill}`);
    const keys = targetsOf(t).map(x => x.key);
    assert.equal(new Set(keys).size, keys.length, `ismétlődő kulcs: ${t.id}`);
    for (const x of targetsOf(t)) assert.ok(x.level >= 1 && x.level <= 5, `rossz szint: ${x.id}`);
  }
});

test('minden feladat megoldható: a független megoldó ugyanazt a választ találja, mint ami helyesnek van jelölve', () => {
  for (const t of TEMPLATES) for (const x of targetsOf(t)) for (const seed of SEEDS) {
    const it = build(x.id, rng(`${x.id}#${seed}`)), where = `${x.id} (mag ${seed})`;
    assert.equal(it.id, x.id); assert.equal(it.station, t.station);
    const ans = t.solve(it);
    if (it.type === 'pick') {
      assert.ok(it.options.length >= 3, `kevesebb mint három válasz: ${where}`);
      const ok = it.options.filter(o => o.ok);
      assert.equal(ok.length, 1, `nem pontosan egy helyes válasz: ${where}`);
      assert.equal(answerOf(ok[0]), ans, `a megoldó mást talált: ${where}`);
      const faces = it.options.map(o => (o.n !== undefined ? 'n' + o.n : o.t)), names = it.options.map(answerOf);
      assert.equal(new Set(faces).size, faces.length, `ismétlődő kép: ${where}`);
      assert.equal(new Set(names).size, names.length, `ismétlődő név: ${where}`);
      assert.ok(it.fact && it.hint, `hiányzó tény vagy segítség: ${where}`);
      for (const o of it.options) if (!o.ok) assert.ok(o.said, `tévedésnél nincs tanító mondat: ${where}`);
      // hallásos feladat: minden hang ismert, és amit a gyerek választ, az a hallottból dől el (a megoldó a hangsort nézi)
      if (it.sound) for (const e of [...it.sound.events, ...(it.sound.again || []), ...(it.intro?.steps || []).flatMap(s => s.events)]) assert.ok(e.rest || e.clap || NOTES[e.n], `ismeretlen hang: ${where}`);
      if (it.fixed) assert.ok(it.sound, `kötött sorrend csak hallásos feladatnál: ${where}`);
    } else if (it.type === 'count') {
      assert.ok(Number.isInteger(it.n) && it.n >= 1 && it.n <= 20, where); assert.equal(ans, it.n);
    } else if (it.type === 'math') {
      const res = it.op === '+' ? it.a + it.b : it.a - it.b;
      assert.ok(res >= 0 && res <= 20 && it.a <= 20 && it.b >= 1, `tartományon kívül: ${where}`); assert.equal(ans, res);
    } else if (it.type === 'memory') {
      assert.ok(it.pairs >= 3 && it.pairs <= 6 && it.deck.length === it.pairs, `rossz pakli: ${where}`);
      assert.equal(new Set(it.deck.map(c => c.e)).size, it.pairs, `ismétlődő kártya: ${where}`);
      assert.equal(new Set(it.deck.map(c => c.n)).size, it.pairs, `ismétlődő név: ${where}`);
      for (const c of it.deck) spoken(`Pár: két ${c.n}!`, where);
    } else if (it.type === 'clap') {
      // a megoldó a szó magánhangzóit számolja (magyarul egy szótag = egy magánhangzó), a feladat a szótagokat tapsoltatja
      const w = it.word;
      assert.ok(w && w.t && w.name && Array.isArray(w.parts), `hiányos szó: ${where}`);
      assert.equal(w.parts.join(''), w.name, `a szótagok nem adják ki a szót: ${where}`);
      assert.equal(w.parts.length, ans, `a szótagszám nem a magánhangzók száma: ${where}`);
      for (const p of w.parts) assert.equal((p.match(/[aáeéiíoóöőuúüű]/g) || []).length, 1, `egy szótagban egy magánhangzó kell: ${where}`);
      assert.ok(w.parts.length <= 6, where);
      spoken(`${w.parts.join(', ')}. ${w.name}! Két szótag.`, where); spoken(`Tapsold el a szót: ${w.name}!`, where); spoken(`Most te jössz: ${w.name}!`, where);
    } else if (it.type === 'echo') {
      assert.ok(Array.isArray(it.melody) && it.melody.length >= 2 && it.melody.length <= 5, `rossz dallamhossz: ${where}`);
      assert.ok(it.bells.length >= 2 && it.bells.length <= 5 && new Set(it.bells).size === it.bells.length, `rossz harangsor: ${where}`);
      for (const n of it.melody) assert.ok(it.bells.includes(n) && NOTES[n], `a dallam hangja nincs a harangok közt: ${where}`);
      assert.ok(new Set(it.melody).size >= 2, `egyhangú dallam: ${where}`);
      assert.equal(ans, it.melody.join('.'), where);
      spoken(`Igen! Pont így szólt: ${it.melody.map(n => NOTES[n].name).join(', ')}.`, where);
    } else if (it.type === 'algo') {
      // robotpálya: a megoldás elér a csillagig; a segítség (amit a feladat-modul a 2. és 3. tévedésnél mutat) elfér a helyeken;
      // ismétléses feladat ismétlés nélkül nem férne el; a hibás program tényleg hibás, egy lépés javítja, és ütközésnél épp
      // a megjelölt (ütköző) lépés kivétele a javítás
      const inb = ([x, y]) => x >= 0 && y >= 0 && x < it.w && y < it.h, same = (a, b) => a[0] === b[0] && a[1] === b[1];
      assert.ok(it.w <= 6 && it.h <= 5 && inb(it.start) && inb(it.goal) && !same(it.start, it.goal), `rossz pálya: ${where}`);
      for (const c of it.walls) assert.ok(inb(c) && !same(c, it.start) && !same(c, it.goal), `rossz virág: ${where}`);
      assert.ok(Array.isArray(ans) && simulate(it, ans).ok, `a megoldás nem ér a csillaghoz: ${where}`);
      const help = robotSolve(it);
      assert.ok(help && compress(help, !!it.loops).length <= it.max, `a segítség nem fér el: ${where}`);
      if (it.loops) assert.ok(help.length > it.max, `ismétlés nélkül is elférne: ${where}`);
      else assert.ok(ans.length <= it.max, `a megoldás nem fér el: ${where}`);
      if (it.prefill?.length) {
        const f = simulate(it, it.prefill);
        assert.ok(!f.ok && it.prefill.length <= it.max, `a hibás program nem hibás: ${where}`);
        assert.equal(Math.abs(it.prefill.length - ans.length), 1, `nem egy lépés a javítás: ${where}`);
        if (f.why !== 'short') assert.ok(simulate(it, it.prefill.filter((_, i) => i !== f.step)).ok, `nem a megjelölt lépés a hibás: ${where}`);
      }
      spoken(it.say, where);
    } else assert.fail(`ismeretlen feladattípus: ${it.type} (${where})`);
  }
});

test('Rozi minden mondata kimondható: nincs számjegy, jel, emoji, és rövidek a mondatok', () => {
  resetLines();
  for (const t of TEMPLATES) for (const x of targetsOf(t)) {
    const it = build(x.id, rng(x.id));
    if (it.type === 'algo') { spoken(it.say, x.id); continue; }
    if (it.type !== 'pick') continue;
    const sp = pickSpeech(it);
    if (it.memo) spoken(it.memo.say, x.id);
    for (const st of it.intro?.steps || []) spoken(st.say, x.id);
    spoken(sp.question, x.id); spoken(sp.right(0), x.id); spoken(sp.right(2), x.id);
    for (const o of it.options.filter(o => !o.ok)) for (const n of [1, 2, 3]) spoken(sp.wrong(o, n), x.id);
  }
});

test('a helyes válasz helye nem árulkodó: a helyes válasz minden helyen előfordul', () => {
  // a válaszok számától függően (3 harang, 5 harang…) külön számolunk; minden helynek legalább a várt fele kell
  // (ahol egy helyre ötnél kevesebb minta jutna, ott a kis szám miatt nem döntünk)
  for (const t of TEMPLATES) {
    const groups = new Map();
    for (const x of targetsOf(t)) for (const seed of SEEDS) {
      const it = build(x.id, rng(`${x.id}@${seed}`)); if (it.type !== 'pick') continue;
      const n = it.options.length, pos = groups.get(n) || new Map(), i = it.options.findIndex(o => o.ok);
      pos.set(i, (pos.get(i) || 0) + 1); groups.set(n, pos);
    }
    for (const [n, pos] of groups) {
      const total = [...pos.values()].reduce((a, b) => a + b, 0), expected = total / n;
      if (expected < 5) continue;
      const counts = Array.from({ length: n }, (_, i) => pos.get(i) || 0);
      assert.ok(Math.min(...counts) >= expected / 2, `${t.id}: a helyes válasz helye egyenlőtlen (${n} válasz) ${JSON.stringify(counts)}`);
    }
  }
});

test('minden eltérítő máshol helyes válasz (nem lehet kizárással megtanulni)', () => {
  for (const st of GENERATED) {
    const right = new Set(), wrong = new Set();
    // a díszítő tárgy (és a "Melyik sárga?" jó tárgya) véletlen: sok maggal minden tárgy sorra kerül, ahogy a valódi játékban is
    for (const t of TEMPLATES.filter(t => t.station === st)) for (const x of targetsOf(t)) for (let seed = 0; seed < 24; seed++) {
      const it = build(x.id, rng(`${x.id}%${seed}`)); if (it.type !== 'pick') continue;
      for (const o of it.options) (o.ok ? right : wrong).add(o.n !== undefined ? 'n' + o.n : o.name || o.key);
    }
    const never = [...wrong].filter(w => !right.has(w));
    assert.deepEqual(never, [], `${st}: soha nem helyes válasz`);
  }
});
