// A nagy mese (js/story-week.js): öt fejezet öt játéknapon át. Mondat-szabályok, a kert lakóihoz igazodás, a napok léptetése.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WEEKS, CHAPTERS, WEEK_START, weekById, activeWeek, weekStart, weekGate } from '../js/story-week.js';
import { VALUES } from '../js/story.js';
import { FRIENDS } from '../js/friends.js';
import { openProfiles } from '../js/progress.js';

const sentences = t => String(t).match(/[^.!?]+[.!?]+/g) || [];
const words = s => s.trim().split(/\s+/).filter(w => /\p{L}/u.test(w)).length;
const mentions = (text, stem) => new RegExp('(^|[^\\p{L}])' + stem, 'u').test(text);
const STEMS = {
  cat: ['cica', 'cicá'], bunny: ['nyuszi'], dog: ['kutya', 'kutyá', 'kutyus'], fox: ['róka', 'róká'], duck: ['kacsa', 'kacsá'],
  bear: ['maci'], frog: ['béka', 'béká'], hedgehog: ['sün'], hen: ['tyúk'], panda: ['panda', 'pandá'], squirrel: ['mókus'],
  owl: ['bagoly', 'bagly', 'bagoll'], mouse: ['egér', 'egere'], unicorn: ['unikornis'], pig: ['malac'], sheep: ['bárány'], turtle: ['teknős'],
  pony: ['póni'], cow: ['tehén', 'tehen'],
};
// játéknapokhoz kötött: a naptárra utaló szó hamis lenne, ha egy nap kimarad
const CALENDAR = /(^|[^\p{L}])(tegnap\p{L}*|holnap\p{L}*|hétfő\p{L}*|kedd\p{L}*|szerd\p{L}*|csütörtök\p{L}*|péntek\p{L}*|szombat\p{L}*|vasárnap\p{L}*|hétvég\p{L}*|ma|mai|mára|hét|heti|hetet)(?=[^\p{L}]|$)/iu;
const lines = w => w.ch.flatMap((c, i) => Object.entries(c).map(([k, t]) => [`${i + 1}.${k}`, t]));
const day = n => `2026-12-${String(n).padStart(2, '0')}`;
const ALL = FRIENDS.map(f => f.id);

test('legalább hat nagy mese, mindegyik öt fejezettel; az utolsó fejezetnek vége van, a többinek izgalmas vége és összefoglalója', () => {
  assert.ok(WEEKS.length >= 6);
  assert.equal(new Set(WEEKS.map(w => w.id)).size, WEEKS.length);
  for (const w of WEEKS) {
    assert.match(w.id, /^[a-z0-9-]{1,24}$/, w.id);
    assert.equal(weekById(w.id), w);
    assert.equal(w.ch.length, CHAPTERS, w.id);
    w.ch.forEach((c, i) => {
      assert.ok(c.open, `${w.id} ${i + 1}: eleje`);
      if (i < CHAPTERS - 1) { assert.ok(c.cliff && c.sum && !c.end, `${w.id} ${i + 1}: izgalmas vég és összefoglaló`); assert.match(c.sum, /^Múltkor /, `${w.id} ${i + 1}: az összefoglaló a múltkorira utal`); }
      else assert.ok(c.end && !c.cliff, `${w.id}: a nagy mese vége`);
    });
  }
});

test('minden mondat rövid, kimondható, és nincs benne naptári szó (tegnap, holnap, ma, hét napjai)', () => {
  for (const w of WEEKS) for (const [k, t] of lines(w)) {
    assert.doesNotMatch(t, /[0-9]/, `${w.id} ${k}: számjegy`);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, `${w.id} ${k}: emoji`);
    assert.match(t, /^[A-ZÁÉÍÓÖŐÚÜŰ]/, `${w.id} ${k}: nagybetű`);
    assert.match(t, /[.!?]$/, `${w.id} ${k}: írásjel`);
    assert.doesNotMatch(t, CALENDAR, `${w.id} ${k}: naptári szó: ${t}`);
    const ss = sentences(t);
    assert.equal(ss.join('').replace(/\s/g, ''), t.replace(/\s/g, ''), `${w.id} ${k}: mondatokra bontható`);
    for (const x of ss) assert.ok(words(x) <= 12, `${w.id} ${k}: túl hosszú (${words(x)} szó): ${x}`);
    assert.ok(ss.length <= (/open|sum/.test(k) ? 1 : 2), `${w.id} ${k}: ${ss.length} mondat`);
  }
  assert.doesNotMatch(WEEK_START, CALENDAR);
});

test('a tanulság a kiáltvány értékeiből; csak a who listában szereplő barátokról szól, és mindegyiket említi', () => {
  for (const w of WEEKS) {
    assert.ok(VALUES.includes(w.value), `${w.id}: ${w.value}`);
    for (const f of w.who) assert.ok(ALL.includes(f), `${w.id}: ismeretlen barát ${f}`);
    const text = lines(w).map(([, t]) => t.toLowerCase()).join(' ');
    for (const [id, stems] of Object.entries(STEMS)) if (stems.some(x => mentions(text, x))) assert.ok(w.who.includes(id), `${w.id}: említi (${id}), de nincs a who listában`);
    for (const f of w.who) assert.ok(STEMS[f].some(x => mentions(text, x)), `${w.id}: ${f} nincs említve`);
  }
  assert.ok(WEEKS.some(w => w.who.every(f => f === 'cat')), 'legalább egy nagy mese csak a cicával is mehet');
  assert.equal(weekStart({}, [], day(1)), null, 'ha egy nagy mese sem illik, nincs nagy mese');
});

test('napok: naponta egy fejezet; aznap újra nem; kapu nélküli nap után ugyanaz a fejezet; kimaradt napok nem számítanak', () => {
  let st = {};
  const play = (d, gate) => {
    const s = weekStart(st, ALL, d); if (s) st = { ...st, ...s };
    const again = weekStart(st, ALL, d);
    assert.equal(again, null, 'aznapi újranyitáskor nem mondja újra');
    let g = null; if (gate) { g = weekGate(st); if (g) st = { ...st, week: g.week }; assert.equal(weekGate(st), null, 'a kapunál egyszer'); }
    return { s, g };
  };
  const first = play(day(1), true);
  assert.equal(st.week.id, WEEKS[0].id); assert.equal(st.week.ch, 1);
  assert.equal(first.s.text, `${WEEK_START} ${WEEKS[0].ch[0].open}`);
  assert.equal(first.g.text, WEEKS[0].ch[0].cliff);
  const second = play(day(4), false);                                  // két nap kimaradt, és ezen a napon nem ért a kapuig
  assert.equal(st.week.ch, 2);
  assert.equal(second.s.text, `${WEEKS[0].ch[0].sum} ${WEEKS[0].ch[1].open}`);
  const third = play(day(5), true);                                    // a meg nem hallgatott fejezet újra jön
  assert.equal(st.week.ch, 2); assert.equal(third.s.text, second.s.text); assert.equal(third.g.text, WEEKS[0].ch[1].cliff);
  play(day(6), true); play(day(7), true);
  const last = play(day(8), true);
  assert.equal(st.week.ch, 5); assert.ok(last.g.finale); assert.equal(last.g.text, WEEKS[0].ch[4].end);
  const next = play(day(9), true);                                     // utána a következő nagy mese kezdődik
  assert.equal(st.week.id, WEEKS[1].id); assert.equal(st.week.ch, 1); assert.ok(next.s.text.startsWith(WEEK_START));
  assert.deepEqual(st.weeksUsed, [WEEKS[0].id, WEEKS[1].id]);
});

test('csak a kertbe illő nagy mese jön; ha mind sorra került, elölről (a legutóbbi kivételével); sérült állás nem dob hibát', () => {
  const onlyCat = weekStart({}, ['cat'], day(1));
  assert.ok(weekById(onlyCat.week.id).who.every(f => f === 'cat'));
  const used = WEEKS.map(w => w.id);
  const again = weekStart({ weeksUsed: used }, ALL, day(1));
  assert.notEqual(again.week.id, used[used.length - 1]); assert.deepEqual(again.weeksUsed, [again.week.id]);
  for (const bad of [{ week: 'x' }, { week: { id: 'nincs', ch: 2 } }, { week: { id: WEEKS[0].id, ch: 9 } }, { weeksUsed: 'x' }]) {
    assert.equal(activeWeek(bad), null);
    assert.ok(weekStart(bad, ALL, day(1)), 'helyette új nagy mese');
    assert.equal(weekGate(bad), null);
  }
});

test('a nagy mese állása mentődik és újratöltés után megmarad; a hibás érték kiszűrődik', () => {
  const mem = new Map(), storage = { get length() { return mem.size; }, key: i => [...mem.keys()][i] ?? null, getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  const p = openProfiles(storage); const pid = p.create({ name: 'Teszt Elek', age: 5 }); p.use(pid);
  p.set({ week: { id: WEEKS[2].id, ch: 3, day: day(2), heard: true }, weeksUsed: [WEEKS[0].id, WEEKS[2].id] });
  const q = openProfiles(storage); q.use(pid);
  assert.deepEqual(q.get().week, { id: WEEKS[2].id, ch: 3, day: day(2), heard: true });
  assert.deepEqual(q.get().weeksUsed, [WEEKS[0].id, WEEKS[2].id]);
  const raw = JSON.parse(mem.get(`csillagkert:p:${pid}`)); raw.week = { id: WEEKS[2].id, ch: 77, day: 'tegnap', heard: 'igen' }; mem.set(`csillagkert:p:${pid}`, JSON.stringify(raw));
  const r = openProfiles(storage); r.use(pid);
  assert.deepEqual(r.get().week, { id: WEEKS[2].id, ch: 5, day: '', heard: false });
});
