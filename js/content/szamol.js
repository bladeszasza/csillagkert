// Számoló rét: generált sablonok. A szintek a számfogalom fejlődési sorát követik (lásd docs/pedagogia.md):
// megszámlálás → ránézéses felismerés → mennyiségek összevetése → számsor → műveletek tárgyakkal → bontás → sorszám.
// Kulcs-szabály: a kulcs csak a választ meghatározó paraméter (darabszám, számhármas, művelet); a tárgy fajtája,
// az eltérítők és a sorrend díszítés, nem új feladat.
import { NUMS, ACC, ORD, attr, cap, numCard, nearNums, group } from './common.js';
import { THINGS, ANIMALS, countOf } from './banks.js';
import { die, tenFrame } from './pics.js';
import { withArt } from '../hu.js';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const triples = (lo, hi) => { const out = []; for (let a = lo; a <= hi; a++) for (let b = a + 1; b <= hi; b++) for (let c = b + 1; c <= hi; c++) out.push([a, b, c]); return out; };
const minGap = ([a, b, c]) => Math.min(b - a, c - b);
const S = { station: 'szamol', icon: '🔢' };
const cards = (right, wrongs, r) => r.shuffle([numCard(right, true), ...wrongs.map(n => numCard(n))]);
const thing = r => r.pick(THINGS);
const grpOpt = (e, n, name, ok, said) => ({ key: 'g' + n + (name ? '-' + name : ''), t: group(e, n), cls: 'grp', name, ok, said });
const countIn = (o, e) => countOf(o.t, e);

// --- mennyiség-összevetés hármasai: kicsi számok bármilyen különbséggel, nagyobbaknál előbb nagy, aztán kicsi különbség
const QTY = [
  ...triples(1, 5).map(t => [t, 1]),
  ...triples(1, 10).filter(t => t[2] > 5 && minGap(t) >= 3).map(t => [t, 2]),
  ...triples(1, 10).filter(t => t[2] > 5 && minGap(t) === 2).map(t => [t, 3]),
  ...triples(1, 10).filter(t => t[2] > 5 && t[2] - t[0] === 2).map(t => [t, 4]),
];
// --- számok összevetése (számkártya + pöttyök): tízig nagy különbséggel, tízig szomszédos, húszig nagy, húszig szomszédos
const NUM3 = [
  ...triples(1, 10).filter(t => minGap(t) >= 3).map(t => [t, 2]),
  ...triples(1, 10).filter(t => t[2] - t[0] === 2).map(t => [t, 3]),
  ...triples(11, 20).filter(t => minGap(t) >= 3).map(t => [t, 4]),
  ...triples(10, 20).filter(t => t[2] - t[0] === 2).map(t => [t, 5]),
];

export const SZAMOL = [
  // 1. Megszámlálás egyenként, koppintással (a meglévő számolós játék). Kulcs: a darabszám.
  { ...S, id: 'szamol.megszamol', skill: 'szamol.megszamlalas',
    targets: () => range(1, 20).map(n => ({ key: 'n' + n, level: n <= 5 ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : 4, n })),
    make: t => ({ type: 'count', n: t.n }),
    solve: item => item.n },

  // 2. Ránézéses felismerés: dobókocka (1–6). Kulcs: a pöttyök száma.
  { ...S, id: 'szamol.kocka', skill: 'szamol.ranezes',
    targets: () => range(1, 6).map(n => ({ key: 'n' + n, level: n <= 3 ? 1 : 2, n })),
    make: (t, r) => ({ type: 'pick', prompt: 'Hány pötty van a kockán?', say: 'Hány pötty van a dobókockán?', qHtml: die(t.n, 150),
      options: cards(t.n, nearNums(t.n, r, 1, 6), r), fact: `${cap(attr(t.n))} pötty van a kockán.`, hint: 'Mutass rá a pöttyökre egyenként, és számolj!' }),
    solve: item => countOf(item.qHtml, '<circle') },

  // 3. Tízes keret (1–10): az ötös tagolás segít ránézésre látni. Kulcs: a pöttyök száma.
  { ...S, id: 'szamol.tizes', skill: 'szamol.ranezes',
    targets: () => range(1, 10).map(n => ({ key: 'n' + n, level: n <= 5 ? 2 : 3, n })),
    make: (t, r) => ({ type: 'pick', prompt: 'Hány pötty van a keretben?', say: 'Hány pötty van a keretben?', qHtml: tenFrame(t.n),
      options: cards(t.n, nearNums(t.n, r, 1, 10), r),
      fact: t.n > 5 ? `${cap(attr(t.n))} pötty van: öt meg ${NUMS[t.n - 5]}.` : `${cap(attr(t.n))} pötty van a keretben.`,
      hint: 'Egy sorban öt hely van. Számolj tovább!' }),
    solve: item => countOf(item.qHtml, '<circle') },

  // 4. Melyik képen van hét? (szám → mennyiség). Kulcs: a keresett szám.
  { ...S, id: 'szamol.melyikben', skill: 'szamol.mennyiseg',
    targets: () => range(1, 15).map(n => ({ key: 'n' + n, level: n <= 5 ? 1 : n <= 10 ? 2 : 3, n })),
    make: (t, r) => {
      const o = thing(r), far = t.level === 1 ? r.shuffle([2, -2, 3, -3].map(d => t.n + d).filter(v => v >= 1 && v <= 15)).slice(0, 2) : nearNums(t.n, r, 1, 15);
      return { type: 'pick', prompt: `Melyik képen van ${NUMS[t.n]}?`, say: `Melyik képen van ${attr(t.n)} ${o.n}?`, ask: { n: t.n, e: o.e },
        options: r.shuffle([t.n, ...far].map(c => grpOpt(o.e, c, '', c === t.n, `Itt ${attr(c)} ${o.n} van.`))),
        fact: `Itt ${attr(t.n)} ${o.n} van.`, hint: 'Számold meg mindegyik képen!' };
    },
    solve: item => item.options.find(o => countIn(o, item.ask.e) === item.ask.n).key },

  // 5–6. Melyikből van a legtöbb / a legkevesebb? Három fajta tárgy. Kulcs: a darabszám-hármas.
  ...['legtobb', 'legkevesebb'].map(ask => ({ ...S, id: 'szamol.' + ask, skill: 'szamol.osszevetes',
    targets: () => QTY.map(([t, level]) => ({ key: t.join('-'), level, counts: t })),
    make: (t, r) => {
      const objs = r.sample(THINGS, 3), counts = r.shuffle(t.counts), want = ask === 'legtobb' ? Math.max(...counts) : Math.min(...counts);
      const i = counts.indexOf(want), w = ask === 'legtobb' ? 'a legtöbb' : 'a legkevesebb';
      return { type: 'pick', prompt: `Melyikből van ${w}?`, ask: { most: ask === 'legtobb', es: objs.map(o => o.e) },
        options: objs.map((o, k) => grpOpt(o.e, counts[k], o.n, k === i, `Itt ${attr(counts[k])} ${o.n} van.`)),
        fact: `${cap(objs[i].ela)} van ${w}: ${attr(want)} ${objs[i].n}.`, hint: 'Számold meg mindegyik sort!' };
    },
    solve: item => { const c = item.options.map((o, k) => countIn(o, item.ask.es[k])); const want = item.ask.most ? Math.max(...c) : Math.min(...c); return item.options[c.indexOf(want)].name; } })),

  // 7. Ugyanannyi (párosítás): melyik képen van ugyanannyi hal, mint ahány alma? Kulcs: a darabszám.
  { ...S, id: 'szamol.ugyanannyi', skill: 'szamol.mennyiseg',
    targets: () => range(1, 10).map(n => ({ key: 'n' + n, level: n <= 5 ? 2 : 3, n })),
    make: (t, r) => {
      const [a, b] = r.sample(THINGS, 2), others = nearNums(t.n, r, 1, 10);
      return { type: 'pick', prompt: 'Hol van ugyanannyi?', say: `Melyik képen van ugyanannyi ${b.n}, mint ahány ${a.n}?`, qHtml: group(a.e, t.n), ask: { a: a.e, b: b.e },
        options: r.shuffle([t.n, ...others].map(c => grpOpt(b.e, c, '', c === t.n, `Itt ${attr(c)} ${b.n} van.`))),
        fact: `Ugyanannyi: ${attr(t.n)} ${a.n} és ${attr(t.n)} ${b.n}.`, hint: 'Számold meg őket, és hasonlítsd össze!' };
    },
    solve: item => { const n = countOf(item.qHtml, item.ask.a); return item.options.find(o => countIn(o, item.ask.b) === n).key; } },

  // 8–9. Melyik a legnagyobb / a legkisebb szám? (számkártya pöttyökkel). Kulcs: a számhármas.
  ...['legnagyobb', 'legkisebb'].map(ask => ({ ...S, id: 'szamol.' + ask, skill: 'szamol.szamok',
    targets: () => NUM3.map(([t, level]) => ({ key: t.join('-'), level, nums: t })),
    make: (t, r) => {
      const [a, b, c] = t.nums, big = ask === 'legnagyobb', want = big ? c : a, rest = big ? [b, a] : [b, c];
      return { type: 'pick', prompt: `Melyik a ${ask} szám?`, options: cards(want, rest, r),
        fact: `${withArt(NUMS[want], true)} a ${ask}: ${big ? 'nagyobb' : 'kisebb'}, mint ${withArt(NUMS[rest[0]])} és ${withArt(NUMS[rest[1]])}.`,
        hint: big ? 'Nézd a pöttyöket! Ahol több a pötty, az a nagyobb.' : 'Nézd a pöttyöket! Ahol kevesebb a pötty, az a kisebb.', ask: { big } };
    },
    solve: item => (item.ask.big ? Math.max : Math.min)(...item.options.map(o => o.n)) })),

  // 10–12. Számsor: utána, előtte, között. Kulcs: a megadott szám.
  { ...S, id: 'szamol.utana', skill: 'szamol.szamsor',
    targets: () => range(1, 19).map(n => ({ key: 'n' + n, level: n < 5 ? 2 : n < 10 ? 3 : 4, n })),
    make: (t, r) => ({ type: 'pick', prompt: 'Melyik szám jön utána?', say: `Melyik szám jön ${withArt(NUMS[t.n])} után?`,
      qHtml: `<span class="numrow"><b>${t.n}</b><b class="next">?</b></span>`, options: cards(t.n + 1, nearNums(t.n + 1, r, 1, 20, 2, [t.n]), r),
      fact: `${withArt(NUMS[t.n], true)} után ${withArt(NUMS[t.n + 1])} jön.`, hint: `Számolj tovább: ${NUMS[t.n]}, és utána?`, ask: { after: t.n } }),
    solve: item => item.ask.after + 1 },
  { ...S, id: 'szamol.elotte', skill: 'szamol.szamsor',
    targets: () => range(2, 20).map(n => ({ key: 'n' + n, level: n <= 5 ? 2 : n <= 10 ? 3 : 4, n })),
    make: (t, r) => ({ type: 'pick', prompt: 'Melyik szám van előtte?', say: `Melyik szám van ${withArt(NUMS[t.n])} előtt?`,
      qHtml: `<span class="numrow"><b class="next">?</b><b>${t.n}</b></span>`, options: cards(t.n - 1, nearNums(t.n - 1, r, 1, 20, 2, [t.n]), r),
      fact: `${withArt(NUMS[t.n], true)} előtt ${withArt(NUMS[t.n - 1])} van.`, hint: `Számolj velem egytől, és figyeld, mi van ${withArt(NUMS[t.n])} előtt!`, ask: { before: t.n } }),
    solve: item => item.ask.before - 1 },
  { ...S, id: 'szamol.kozott', skill: 'szamol.szamsor',
    targets: () => range(2, 19).map(n => ({ key: 'n' + n, level: n <= 5 ? 2 : n <= 10 ? 3 : 4, n })),
    make: (t, r) => ({ type: 'pick', prompt: 'Melyik szám van középen?', say: `Melyik szám van ${withArt(NUMS[t.n - 1])} és ${withArt(NUMS[t.n + 1])} között?`,
      qHtml: `<span class="numrow"><b>${t.n - 1}</b><b class="next">?</b><b>${t.n + 1}</b></span>`, options: cards(t.n, nearNums(t.n, r, 1, 20, 2, [t.n - 1, t.n + 1]), r),
      fact: `${withArt(NUMS[t.n - 1], true)} és ${withArt(NUMS[t.n + 1])} között ${withArt(NUMS[t.n])} van.`, hint: `Számolj: ${NUMS[t.n - 1]}, és utána?`, ask: { lo: t.n - 1, hi: t.n + 1 } }),
    solve: item => (item.ask.lo + item.ask.hi) / 2 },

  // 13. Hiányzó szám egy ötös sorban. Kulcs: a sor eleje és a hiányzó helye.
  { ...S, id: 'szamol.hianyzo', skill: 'szamol.szamsor',
    targets: () => range(1, 16).flatMap(s => [1, 2, 3].map(p => ({ key: `s${s}p${p}`, level: s + 4 <= 10 ? (s <= 3 ? 2 : 3) : 4, s, p }))),
    make: (t, r) => {
      const row = range(t.s, t.s + 4), x = row[t.p], wrongs = r.sample([t.s - 1, t.s - 2, t.s + 5, t.s + 6].filter(v => v >= 1 && v <= 20), 2);
      return { type: 'pick', prompt: 'Melyik szám hiányzik?', say: 'Melyik szám hiányzik a sorból?', ask: { row: row.map(v => (v === x ? null : v)) },
        qHtml: `<span class="numrow">${row.map(v => (v === x ? '<b class="next">?</b>' : `<b>${v}</b>`)).join('')}</span>`, options: cards(x, wrongs, r),
        fact: `${withArt(NUMS[x], true)} hiányzik: ${row.map(v => NUMS[v]).join(', ')}.`, hint: 'Számold végig a sort, és figyeld, hol akadsz el!' };
    },
    solve: item => { const row = item.ask.row, i = row.indexOf(null); return i > 0 ? row[i - 1] + 1 : row[i + 1] - 1; } },

  // 14–15. Összeadás és kivonás tárgyakkal (a meglévő matek-játék). Kulcs: a két szám.
  { ...S, id: 'szamol.osszead', skill: 'szamol.osszeadas',
    targets: () => {
      const out = [];
      for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) out.push({ key: `${a}p${b}`, level: a + b <= 5 ? 2 : 3, a, b });
      for (let a = 10; a <= 19; a++) for (let b = 1; a + b <= 20; b++) out.push({ key: `${a}p${b}`, level: 4, a, b });
      for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) if (a + b >= 11) out.push({ key: `${a}p${b}`, level: 5, a, b });
      return out;
    },
    make: t => ({ type: 'math', a: t.a, b: t.b, op: '+' }),
    solve: item => item.a + item.b },
  { ...S, id: 'szamol.kivon', skill: 'szamol.kivonas',
    targets: () => {
      const out = [];
      for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) out.push({ key: `${a}m${b}`, level: a <= 5 ? 2 : 3, a, b });
      for (let a = 11; a <= 20; a++) for (let b = 1; b <= a - 10; b++) out.push({ key: `${a}m${b}`, level: 4, a, b });
      for (let a = 11; a <= 18; a++) for (let b = a - 9; b <= 9; b++) out.push({ key: `${a}m${b}`, level: 5, a, b });
      return out;
    },
    make: t => ({ type: 'math', a: t.a, b: t.b, op: '-' }),
    solve: item => item.a - item.b },

  // 16. Bontás: hány bújt el a doboz alá? Kulcs: az összes és a látható darab.
  { ...S, id: 'szamol.bontas', skill: 'szamol.bontas',
    targets: () => range(2, 10).flatMap(n => range(1, n - 1).map(k => ({ key: `${n}l${k}`, level: n <= 5 ? 3 : 4, n, k }))),
    make: (t, r) => {
      const o = thing(r), h = t.n - t.k;
      return { type: 'pick', prompt: 'Hány bújt el?', say: `${cap(attr(t.n))} ${o.n} van. ${cap(ACC[t.k])} látsz. Hány bújt el a doboz alá?`,
        qHtml: `${group(o.e, t.k)}<span class="hidebox">📦</span>`, ask: { n: t.n, e: o.e },
        options: cards(h, nearNums(h, r, 1, Math.max(t.n, h + 2)), r),
        fact: `${cap(NUMS[h])} bújt el. ${cap(NUMS[t.k])} meg ${NUMS[h]} az ${NUMS[t.n]}.`, hint: 'Számold meg, amit látsz, aztán számolj tovább az ujjadon!' };
    },
    solve: item => item.ask.n - countOf(item.qHtml, item.ask.e) },

  // 17. Sorszám: ki a harmadik a zászlótól? Kulcs: a sor hossza és a hely.
  { ...S, id: 'szamol.sorszam', skill: 'szamol.sorszam',
    targets: () => [5, 7, 10].flatMap(len => range(1, len).map(p => ({ key: `l${len}p${p}`, level: len === 5 ? 3 : len === 7 ? 4 : 5, len, p }))),
    make: (t, r) => {
      const row = r.sample(ANIMALS, t.len), right = row[t.p - 1];
      const near = [t.p - 2, t.p, t.p - 3, t.p + 1].filter(i => i >= 0 && i < t.len && i !== t.p - 1).slice(0, 2).map(i => row[i]);
      return { type: 'pick', prompt: `Ki ${withArt(ORD[t.p])}?`, say: `Számolj a zászlótól! Ki ${withArt(ORD[t.p])}?`, ask: { row: row.map(a => a.n), p: t.p },
        qHtml: `<span class="queue">🚩${row.map(a => `<i>${a.e}</i>`).join('')}</span>`,
        options: r.shuffle([right, ...near].map(a => ({ t: a.e, name: a.n, ok: a === right, said: `Ez ${withArt(a.n)}.` }))),
        fact: `${withArt(ORD[t.p], true)} ${withArt(right.n)}.`, hint: 'Mutass rájuk sorban a zászlótól: első, második, harmadik.' };
    },
    solve: item => item.ask.row[item.ask.p - 1] },
];
