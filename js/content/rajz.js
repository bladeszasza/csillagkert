// Rajzasztal: rajzolás, színezés és rácsos feladatok.
// Egy önálló feladat (a 250-es kapu szerint) az, ami a választ meghatározza:
//   - másolás: a minta alakja (eltolva, elforgatva, tükrözve vagy más színekkel ugyanaz a feladat);
//   - tükör: a fél kép alakja a tükörtengelyhez illesztve (függőlegesen eltolva, fejjel lefelé vagy más színnel ugyanaz);
//   - minta: a sorminta szerkezete (AB, AAB…), a színe és a hossza díszítés;
//   - szabály: a szabály szerkezete (hány szabály, van-e szabály nélküli alak, hasonló alakok, méret szerinti szabály);
//     hogy melyik alak melyik színt kapja, díszítés;
//   - matrica: a viszony (fölé, alá, mellé, közé…) és hogy egy vagy több tárgy közül kell-e választani; a tárgy fajtája díszítés;
//   - szabad rajz: a téma; színező: a kép és a megnevezett rész (a kért szín díszítés).
import { rng } from './rng.js';
import { KEPEK } from './kepek.js';

const S = { station: 'rajz', icon: '🎨' };

// a színek: a név tárgyesete is kell a mondatokhoz ("pirosra")
export const PALETTE = [
  ['#ff5a5f', 'piros', 'pirosra'], ['#3f8cff', 'kék', 'kékre'], ['#ffd23f', 'sárga', 'sárgára'],
  ['#34c27a', 'zöld', 'zöldre'], ['#9b6bff', 'lila', 'lilára'], ['#ff9a3c', 'narancssárga', 'narancssárgára'],
];
const pickColors = (n, r) => { const p = PALETTE.map((c, i) => i); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p.slice(0, n); };

// --- rácsminták: cellák halmaza, 1..n színkóddal ---
// p: [[x, y, c], ...]; kanonikus alak a megadott átalakításokkal (eltolás mindig, plusz a listában lévők), színcserével
const TRANSFORMS = { id: (x, y) => [x, y], fx: (x, y) => [-x, y], fy: (x, y) => [x, -y], r90: (x, y) => [-y, x], r180: (x, y) => [-x, -y], r270: (x, y) => [y, -x], d1: (x, y) => [y, x], d2: (x, y) => [-y, -x] };
function canon(p, tfs, shiftX = true) {
  let best = null;
  for (const tf of tfs) {
    const q = p.map(([x, y, c]) => [...TRANSFORMS[tf](x, y), c]);
    const mx = shiftX ? Math.min(...q.map(a => a[0])) : 0, my = Math.min(...q.map(a => a[1]));
    const r = q.map(([x, y, c]) => [x - mx, y - my, c]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const map = new Map(); const s = r.map(([x, y, c]) => { if (!map.has(c)) map.set(c, map.size + 1); return `${x}.${y}.${map.get(c)}`; }).join('_');
    if (best === null || s < best) best = s;
  }
  return best;
}
// összefüggő, véletlenül növesztett alak a w×h rácson (n cella, k szín); "touch": legyen cellája az utolsó oszlopban (tükörtengely)
function grow(w, h, n, k, r, touch) {
  for (let tries = 0; tries < 200; tries++) {
    const start = touch ? [w - 1, Math.floor(r() * h)] : [Math.floor(r() * w), Math.floor(r() * h)];
    const cells = [start], has = new Set([start.join()]);
    while (cells.length < n) {
      const [x, y] = cells[Math.floor(r() * cells.length)], [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || has.has(nx + ',' + ny)) continue;
      cells.push([nx, ny]); has.add(nx + ',' + ny);
    }
    const cols = cells.map((_, i) => (k === 1 ? 1 : 1 + (i % k)));
    for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
    if (k > 1 && new Set(cols).size < k) continue;
    return cells.map(([x, y], i) => [x, y, cols[i]]);
  }
  return null;
}
const toRows = (p, w, h) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (p.find(a => a[0] === x && a[1] === y)?.[2] ?? 0)).join(''));
const fromRows = rows => rows.flatMap((row, y) => [...row].map((c, x) => [x, y, +c]).filter(a => a[2] > 0));

// szintenként: [szint, rács w×h, cellaszám-tartomány, színek száma, legfeljebb hány minta]; a mag rögzített, így a feladatok
// minden betöltéskor ugyanazok. (A tükörnél w a fél kép szélessége.)
const COPY_LV = [[1, 3, 3, 2, 4, 1, 10], [2, 4, 4, 3, 5, 1, 15], [3, 4, 4, 4, 6, 2, 15], [4, 5, 5, 6, 8, 2, 15], [5, 5, 5, 7, 9, 3, 12]];
const MIRROR_LV = [[2, 2, 4, 2, 4, 1, 10], [3, 3, 4, 3, 5, 1, 15], [4, 3, 4, 4, 6, 2, 15], [5, 4, 5, 5, 8, 2, 15]];
function patternTargets(table, seed, tfs, touch) {
  const out = [], seen = new Set();          // egy alak az egész sablonban csak egyszer számít (két szinten sem)
  for (const [level, w, h, n0, n1, k, max] of table) {
    const r = rng(`${seed}.${level}`); let guard = 0;
    while (out.filter(t => t.level === level).length < max && guard++ < 6000) {
      const n = n0 + Math.floor(r() * (n1 - n0 + 1)), p = grow(w, h, n, k, r, touch); if (!p) continue;
      const key = canon(p, tfs, !touch); if (seen.has(key)) continue;
      seen.add(key); out.push({ key: `${level}-${key}`, level, w, h, rows: toRows(p, w, h), k });
    }
  }
  return out;
}

const copyTargets = () => patternTargets(COPY_LV, 'rajz.masol', Object.keys(TRANSFORMS), false);
const mirrorTargets = () => patternTargets(MIRROR_LV, 'rajz.tukor', ['id', 'fy'], true);

// --- sorminta ---
const MINTA = [
  ['ab', 1, 'AB'], ['aab', 2, 'AAB'], ['abb', 2, 'ABB'], ['abc', 2, 'ABC'], ['aabb', 3, 'AABB'], ['aaab', 3, 'AAAB'], ['abbb', 3, 'ABBB'],
  ['abcd', 4, 'ABCD'], ['aabc', 4, 'AABC'], ['abbc', 4, 'ABBC'], ['abcc', 4, 'ABCC'], ['abac', 5, 'ABAC'], ['abcb', 5, 'ABCB'],
  // két dimenzió: a cella színe = minta[(a·x + b·y) mod p]
  ['sakk', 3, null, [2, 1, 1]], ['csikos', 3, null, [2, 0, 1]], ['atlos', 5, null, [3, 1, 1]],
];

// --- szabály szerinti színezés: alakok a rácsban, jelmagyarázat (alak → szín) ---
export const SHAPES = { k: ['kör', 'köröket'], o: ['ovális', 'oválisokat'], n: ['négyzet', 'négyzeteket'], t: ['téglalap', 'téglalapokat'], h: ['háromszög', 'háromszögeket'], c: ['csillag', 'csillagokat'], s: ['szív', 'szíveket'] };
const SIMILAR = [['k', 'o'], ['n', 't']];
const BASIC = ['k', 'n', 'h', 'c', 's'];
const RULES = [
  // [kulcs, szint, szabályok száma, szabály nélküli alakok?, hasonló alakpár?, méret szerinti?]
  ['egy', 1, 1, true, false, null],
  ['ketto', 2, 2, false, false, null], ['ketto-tobbi', 3, 2, true, false, null], ['ketto-hasonlo', 4, 2, false, true, null], ['ketto-hasonlo-tobbi', 5, 2, true, true, null],
  ['harom', 3, 3, false, false, null], ['harom-tobbi', 4, 3, true, false, null], ['harom-hasonlo', 4, 3, false, true, null], ['harom-hasonlo-tobbi', 5, 3, true, true, null],
  ['negy', 4, 4, false, false, null], ['negy-tobbi', 5, 4, true, false, null], ['negy-hasonlo', 5, 4, false, true, null], ['negy-hasonlo-tobbi', 5, 4, true, true, null],
  ['meret', 3, 2, false, false, 'meret'], ['meret-tobbi', 4, 2, true, false, 'meret'], ['meret-alak', 5, 2, true, false, 'alak'],
];

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ruleWord = (code, sizeRule) => sizeRule ? `a ${code === code.toUpperCase() ? 'nagy' : 'kicsi'} ${SHAPES[code.toLowerCase()][1]}` : `a ${SHAPES[code][1]}`;

function makeRule(t, r) {
  const [, , k, other, similar, size] = RULES.find(x => x[0] === t.key);
  let ruled, extra;
  if (size === 'meret') { const s = BASIC[Math.floor(r() * BASIC.length)]; ruled = [s.toUpperCase(), s]; extra = other ? shuffle(BASIC.filter(x => x !== s), r).slice(0, 2) : []; }
  else if (size === 'alak') { const [a, b] = shuffle(BASIC, r); ruled = [a.toUpperCase(), b]; extra = [a, b.toUpperCase()]; }   // nagy kör → piros, kicsi négyzet → kék; a kicsi kör és a nagy négyzet fehér marad
  else {
    const pair = similar ? SIMILAR[Math.floor(r() * SIMILAR.length)] : null;      // hasonló pár: kör és ovális, vagy négyzet és téglalap
    const others = shuffle(BASIC.filter(x => !pair || !pair.includes(x)), r);
    ruled = shuffle(pair ? [...pair, ...others.slice(0, k - 2)] : others.slice(0, k), r);
    extra = other ? others.filter(x => !ruled.includes(x)).slice(0, 2) : [];
  }
  const colors = pickColors(ruled.length, r);
  const w = ruled.length + extra.length >= 4 ? 5 : 4, h = ruled.length >= 3 ? 4 : 3;
  // minden szabályos alak legalább kétszer, a szabály nélküliek legalább egyszer
  const bag = [...ruled.flatMap(c => [c, c]), ...extra];
  while (bag.length < w * h) { const all = [...ruled, ...extra]; bag.push(all[Math.floor(r() * all.length)]); }
  const shapes = shuffle(bag, r);
  const sizeRule = !!size;
  const parts = ruled.map((c, i) => `${ruleWord(c, sizeRule)} ${PALETTE[colors[i]][2]}`);
  const say = `Színezd ki a szabály szerint! ${parts.join(', ').replace(/^a/, 'A')}!${extra.length ? ' A többit hagyd fehéren.' : ''}`;
  return { type: 'racs', mode: 'szabaly', prompt: 'Színezd ki a szabály szerint! 🎨', say,
    colors: colors.map(i => PALETTE[i][0]), cnames: colors.map(i => PALETTE[i][1]),
    rules: ruled.map((c, i) => [c, i + 1]), sized: !!size, grids: [{ w, h, fixed: '?'.repeat(w * h), shapes }],
    goal: { 0: shapes.map(c => String(ruled.indexOf(c) + 1)).join('') } };
}

// --- a feladat felépítése ---
function makeCopy(t, r) {
  const colors = pickColors(t.k, r), cells = t.rows.join('');
  return { type: 'racs', mode: 'masol', prompt: 'Másold le a mintát! 🎨', say: t.level === 1 ? 'Színezd ki ugyanígy a másik rácsot! Nézd meg jól a mintát.' : 'Másold le a mintát a másik rácsra!',
    colors: colors.map(i => PALETTE[i][0]), cnames: colors.map(i => PALETTE[i][1]),
    grids: [{ w: t.w, h: t.h, fixed: cells, model: true }, { w: t.w, h: t.h, fixed: '?'.repeat(t.w * t.h) }], goal: { 1: t.rows.join('') } };
}
function makeMirror(t, r) {
  const colors = pickColors(t.k, r), hw = t.w, w = 2 * hw;
  const fixed = t.rows.map(row => row + '?'.repeat(hw)).join('');
  return { type: 'racs', mode: 'tukor', prompt: 'Tükrözd a képet! 🦋', say: t.level === 2 ? 'Ez egy tükör. Színezd ki a másik felét is ugyanígy, tükörben!' : 'Színezd ki a kép tükörképét a vonal másik oldalán!',
    colors: colors.map(i => PALETTE[i][0]), cnames: colors.map(i => PALETTE[i][1]),
    grids: [{ w, h: t.h, fixed, axis: hw }], goal: { 0: t.rows.map(row => row + [...row].reverse().join('')).join('') } };
}
function makeMinta(t, r) {
  const [, , seq, d2] = MINTA.find(m => m[0] === t.key);
  if (seq) {
    const kinds = new Set(seq).size, colors = pickColors(kinds, r), p = seq.length;
    const shown = 2 * p, total = shown + (p <= 2 ? 4 : p), code = c => String('ABCD'.indexOf(c) + 1);
    const full = Array.from({ length: total }, (_, i) => code(seq[i % p]));
    return { type: 'racs', mode: 'minta', prompt: 'Folytasd a mintát! 🎨', say: 'Folytasd a mintát! Melyik szín jön a következő helyre?',
      colors: colors.map(i => PALETTE[i][0]), cnames: colors.map(i => PALETTE[i][1]),
      grids: [{ w: total, h: 1, fixed: full.map((c, i) => (i < shown ? c : '?')).join('') }], goal: { 0: full.join('') } };
  }
  const [p, a, b] = d2, w = 5, h = 4, colors = pickColors(p, r);
  const full = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) full.push(String(1 + ((a * x + b * y) % p)));
  const cells = full.map((c, i) => (i < 2 * w ? c : '?'));
  return { type: 'racs', mode: 'minta', prompt: 'Folytasd a mintát! 🎨', say: 'Folytasd a mintát a többi sorban is!',
    colors: colors.map(i => PALETTE[i][0]), cnames: colors.map(i => PALETTE[i][1]),
    grids: [{ w, h, fixed: cells.join('') }], goal: { 0: full.join('') } };
}

// --- megoldók: csak abból, amit a gyerek lát (a minta, a fél kép, a sor eleje, a jelmagyarázat) ---
// A válasz: { [rács sorszáma]: a munkacellák kívánt színkódja, '0' = fehéren marad }
export function solveRacs(item) {
  const g = item.grids;
  if (item.mode === 'masol') return { 1: g[0].fixed };
  if (item.mode === 'tukor') {
    const { w, h, fixed, axis } = g[0]; let out = '';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out += x < axis ? fixed[y * w + x] : fixed[y * w + (2 * axis - 1 - x)];
    return { 0: out };
  }
  if (item.mode === 'minta') {
    const { w, h, fixed } = g[0], known = [...fixed].map((c, i) => [i % w, Math.floor(i / w), c]).filter(a => a[2] !== '?');
    for (let p = 1; p <= 4; p++) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) {
      const seq = new Array(p).fill(null); let okk = true;
      for (const [x, y, c] of known) { const i = (a * x + b * y) % p; if (seq[i] === null) seq[i] = c; else if (seq[i] !== c) { okk = false; break; } }
      if (!okk || seq.includes(null)) continue;
      // csak akkor fogadjuk el, ha a látott rész legalább kétszer mutatja a teljes mintát (különben nem egyértelmű)
      if (h === 1 && known.length < 2 * p) continue;
      return { 0: [...fixed].map((c, i) => seq[(a * (i % w) + b * Math.floor(i / w)) % p]).join('') };
    }
    return null;
  }
  if (item.mode === 'szabaly') {
    const rule = new Map(item.rules);
    return { 0: g[0].shapes.map(s => String(rule.get(s) || 0)).join('') };
  }
  return null;
}

export const RAJZ = [
  { ...S, id: 'rajz.masol', skill: 'rajz.masol', icon: '🔲', targets: copyTargets, make: makeCopy, solve: solveRacs },
  { ...S, id: 'rajz.tukor', skill: 'rajz.tukor', icon: '🦋', targets: mirrorTargets, make: makeMirror, solve: solveRacs },
  { ...S, id: 'rajz.minta', skill: 'rajz.minta', icon: '🟥', targets: () => MINTA.map(([key, level]) => ({ key, level })), make: makeMinta, solve: solveRacs },
  { ...S, id: 'rajz.szabaly', skill: 'rajz.szabaly', icon: '🔷', targets: () => RULES.map(([key, level]) => ({ key, level })), make: makeRule, solve: solveRacs },
];
// a kanonikus alak a teszteknek (az önálló feladatok ellenőrzéséhez)
export const _canon = { canon, fromRows, TRANSFORMS };

// --- matrica: térbeli viszonyok (fölé, alá, rá, bele, mellé, balra, jobbra, közé) ---
// A jelenet 120×84 egység; a tárgyak alja a 62-es vonalon áll. A helyek (szaggatott körök) a tárgyhoz képest:
// fölé = jóval fölötte, rá = a tetején, alá = alatta, bele = benne, balra / jobbra = mellette.
// [kép, név, -ra/-re alak, -on/-en/-ön alak, -ba/-be alak, -ban/-ben alak, lehetséges viszonyok]
export const REFS = {
  haz: ['🏠', 'ház', '', '', '', '', ['fole', 'melle', 'bal', 'jobb', 'koze']],
  fa: ['🌳', 'fa', '', '', '', '', ['fole', 'ala', 'melle', 'bal', 'jobb', 'koze']],
  doboz: ['📦', 'doboz', 'dobozra', 'dobozon', 'dobozba', 'dobozban', ['fole', 'ra', 'bele', 'melle', 'bal', 'jobb', 'koze']],
  kosar: ['🧺', 'kosár', '', '', 'kosárba', 'kosárban', ['bele', 'melle', 'bal', 'jobb', 'koze']],
  szek: ['🪑', 'szék', 'székre', 'széken', '', '', ['fole', 'ala', 'ra', 'melle', 'bal', 'jobb']],
  agy: ['🛏️', 'ágy', 'ágyra', 'ágyon', '', '', ['ra', 'melle', 'bal', 'jobb']],
};
// matricák: [kép, név, tárgyeset]; a madár csak fölé repülhet, a többi bárhova kerülhet
const STICKERS = [['🐱', 'cica', 'cicát'], ['⚽', 'labda', 'labdát'], ['🧸', 'maci', 'macit'], ['🍎', 'alma', 'almát'], ['🐶', 'kutya', 'kutyát'], ['🐰', 'nyuszi', 'nyuszit']];
const BIRD = ['🐦', 'madár', 'madarat'];
// A választható helyek köre feladatonként rögzített (a tárgy fajtája ne tegye könnyebbé vagy nehezebbé): csak olyan tárgy
// kerülhet a jelenetbe, amelyiknél mind megvan.
const MATRICA = [
  // [kulcs, szint, viszony, két egyforma tárgy közül (nagy / kicsi)?, helyek tárgyanként]
  ['fole', 1, 'fole', false, ['fole', 'bal', 'jobb']], ['ala', 1, 'ala', false, ['fole', 'ala', 'bal', 'jobb']],
  ['ra', 2, 'ra', false, ['fole', 'ra', 'bal', 'jobb']], ['bele', 2, 'bele', false, ['bele', 'bal', 'jobb']],
  ['melle', 2, 'melle', false, ['fole', 'ala', 'bal', 'jobb']],
  ['bal', 3, 'bal', false, ['fole', 'bal', 'jobb']], ['jobb', 3, 'jobb', false, ['fole', 'bal', 'jobb']], ['koze', 3, 'koze', false, null],
  ['fole-ketto', 4, 'fole', true, ['fole', 'bal', 'jobb']], ['ala-ketto', 4, 'ala', true, ['fole', 'ala', 'bal', 'jobb']],
  ['melle-ketto', 4, 'melle', true, ['fole', 'bal', 'jobb']], ['bele-ketto', 4, 'bele', true, ['bele', 'bal', 'jobb']],
  ['bal-ketto', 5, 'bal', true, ['fole', 'bal', 'jobb']], ['jobb-ketto', 5, 'jobb', true, ['fole', 'bal', 'jobb']], ['ra-ketto', 5, 'ra', true, ['ra', 'bal', 'jobb']],
];
const GROUND = 62;
// a kép szerinti "teteje" és "alja": a széknek az ülőkéje, az ágynak a matraca, a fa alja a törzse a lomb alatt
const RA_AT = { doboz: (y0, s) => y0 - 4, szek: (y0, s) => GROUND - s * 0.6, agy: (y0, s) => GROUND - s * 0.55 };
const ALA_AT = { szek: s => GROUND - s * 0.18, fa: s => GROUND - s * 0.12 };
function slotsOf(ref, ri, rels) {
  const { x, s, k } = ref, y0 = GROUND - s, y1 = GROUND, out = [];
  const at = { fole: [x, y0 - 20], ra: RA_AT[k] && [x, RA_AT[k](y0, s)], ala: ALA_AT[k] && [x, ALA_AT[k](s)], bele: [x, y1 - s * 0.38], bal: [x - s / 2 - 10, y1 - 6], jobb: [x + s / 2 + 10, y1 - 6] };
  for (const rel of rels) if (at[rel]) out.push({ rel, ref: ri, x: at[rel][0], y: at[rel][1] });
  return out;
}
// "a ház alá", "a dobozra"; helyhatározó a visszajelzéshez: "a ház alatt", "a dobozon"
export function relPhrase(rel, refName, forms, where) {
  const [ra, on, ba, ban] = forms;
  const t = where
    ? { fole: `${refName} fölött`, ala: `${refName} alatt`, ra: on, bele: ban, melle: `${refName} mellett`, bal: `${refName} mellett`, jobb: `${refName} mellett` }
    : { fole: `${refName} fölé`, ala: `${refName} alá`, ra, bele: ba, melle: `${refName} mellé`, bal: `${refName} mellé, balra`, jobb: `${refName} mellé, jobbra` };
  return t[rel];
}
export const withA = w => (/^[aáeéiíoóöőuúüű]/i.test(w) ? 'az ' : 'a ') + w;

function makeMatrica(t, r) {
  const [, , rel, two, set] = MATRICA.find(m => m[0] === t.key);
  const pickOne = arr => arr[Math.floor(r() * arr.length)];
  const st = rel === 'fole' && r() < 0.4 ? BIRD : pickOne(STICKERS);
  let refs, target = 0, say;
  if (rel === 'koze') {
    const pool = Object.keys(REFS).filter(k => REFS[k][6].includes('koze')), a = pickOne(pool), b = pickOne(pool.filter(k => k !== a));
    refs = [{ k: a, x: 31, s: 26 }, { k: b, x: 89, s: 26 }];
    say = `Tedd ${withA(st[2])} ${withA(REFS[a][1])} és ${withA(REFS[b][1])} közé!`;
  } else {
    const pool = Object.keys(REFS).filter(k => set.every(x => REFS[k][6].includes(x))), k = pickOne(pool), R = REFS[k];
    if (two) {
      const bigFirst = r() < 0.5; target = r() < 0.5 ? 0 : 1;
      refs = bigFirst ? [{ k, x: 33, s: 32, size: 'nagy' }, { k, x: 93, s: 20, size: 'kicsi' }] : [{ k, x: 28, s: 20, size: 'kicsi' }, { k, x: 88, s: 32, size: 'nagy' }];
    } else refs = [{ k, x: 60, s: 30 }];
    const tr = refs[target], pre = tr.size ? tr.size + ' ' : '';
    say = `Tedd ${withA(st[2])} ${relPhrase(rel, withA(pre + R[1]), [R[2], R[3], R[4], R[5]].map(f => f && withA(pre + f)), false)}!`;
  }
  // a helyek: minden tárgynál a hozzá illő viszonyok (közénél a két tárgy között is egy hely)
  const slots = [];
  refs.forEach((ref, ri) => {
    // két tárgynál a másik tárgy befelé néző oldala nem hely: a kettő között csak egy hely van, így a "mellé, jobbra"
    // nem lehet a másik tárgy "mellé, balra" helyén is igaz
    const inner = ri === 0 ? 'jobb' : 'bal', can = two ? set.filter(x => ri === target || x !== inner) : set;
    slots.push(...slotsOf(ref, ri, rel === 'koze' ? (ri === 0 ? ['bal', 'fole'] : ['jobb', 'fole']) : can));
  });
  if (rel === 'koze') slots.push({ rel: 'koze', ref: -1, x: (refs[0].x + refs[1].x) / 2, y: GROUND - 6 });
  slots.forEach((s, i) => { s.id = i; s.ok = rel === 'koze' ? s.rel === 'koze' : s.ref === target && (rel === 'melle' ? s.rel === 'bal' || s.rel === 'jobb' : s.rel === rel); });
  return { type: 'matrica', prompt: `Hova kerüljön? ${st[0]}`, say, rel, target, sticker: st,
    refs: refs.map(x => ({ ...x, pic: REFS[x.k][0], name: REFS[x.k][1], forms: REFS[x.k].slice(2, 6) })), slots };
}
// a megoldó csak a mondat jelentéséből és a helyek elhelyezkedéséből dolgozik (az ok jelölést nem nézi)
export function solveMatrica(item) {
  const { rel, target, refs, slots } = item;
  if (rel === 'koze') { const mid = (refs[0].x + refs[1].x) / 2; return slots.filter(s => s.x > refs[0].x + refs[0].s / 2 && s.x < refs[1].x - refs[1].s / 2 && Math.abs(s.x - mid) < 6).map(s => s.id); }
  // sávok a tárgy fölött és benne: fölötte messze = fölé; a teteje és a felső fele = rá; a közepe = bele; az alsó harmada = alá
  const R = refs[target], x0 = R.x - R.s / 2, x1 = R.x + R.s / 2, y0 = GROUND - R.s, mid = GROUND - R.s * 0.5, low = GROUND - R.s * 0.3;
  const inX = s => s.x >= x0 && s.x <= x1;
  const test = {
    fole: s => inX(s) && s.y < y0 - 12, ra: s => inX(s) && s.y >= y0 - 12 && s.y < mid,
    bele: s => inX(s) && s.y >= mid && s.y < low, ala: s => inX(s) && s.y >= low,
    bal: s => s.x < x0 && s.x > x0 - 16 && s.y > y0 && s.y <= GROUND, jobb: s => s.x > x1 && s.x < x1 + 16 && s.y > y0 && s.y <= GROUND,
  };
  const f = rel === 'melle' ? s => test.bal(s) || test.jobb(s) : test[rel];
  return slots.filter(f).map(s => s.id);
}
RAJZ.push({ ...S, id: 'rajz.matrica', skill: 'rajz.matrica', icon: '🧸', targets: () => MATRICA.map(([key, level]) => ({ key, level })), make: makeMatrica, solve: solveMatrica });

// --- szabad rajz: téma + kis kép ötletnek. Nincs jó vagy rossz rajz, ezért nem számít bele a szintlépésbe (neutral);
// a téma az állomás szintjét követi: 1 = egy forma, 2 = két-három forma, 3 = tárgy, 4 = állat vagy ember,
// 5 = kis jelenet két dologgal és egy térbeli szóval (a matrica szavai: mellé, fölé, bele, rá, közé).
// Egy téma egy feladat; a szín szabadon választható (Rozi a végén elmondja, milyen színeket lát).
const SZABAD = [
  // [kulcs, szint, kép, Rozi kérése, Rozi mondata a pipa után]
  ['nap', 1, '☀️', 'Rajzolj egy napot!', 'Süt a nap!'], ['labda', 1, '⚽', 'Rajzolj egy labdát!', 'Kész a labda!'],
  ['lufi', 1, '🎈', 'Rajzolj egy lufit!', 'Kész a lufi!'], ['hold', 1, '🌙', 'Rajzolj egy holdat!', 'Kész a hold!'],
  ['felho', 1, '☁️', 'Rajzolj egy felhőt!', 'Kész a felhő!'], ['szivarvany', 1, '🌈', 'Rajzolj egy szivárványt!', 'Kész a szivárvány!'],
  ['kigyo', 1, '🐍', 'Rajzolj egy hosszú kígyót!', 'Kész a kígyó!'], ['eso', 1, '💧', 'Rajzolj esőcseppeket!', 'Esik az eső!'],
  ['narancs', 1, '🍊', 'Rajzolj egy narancsot!', 'Kész a narancs!'], ['szolo', 1, '🍇', 'Rajzolj egy fürt szőlőt!', 'Kész a szőlő!'],
  ['fank', 1, '🍩', 'Rajzolj egy fánkot!', 'Kész a fánk!'], ['tojas', 1, '🥚', 'Rajzolj egy tojást!', 'Kész a tojás!'],
  ['alma', 2, '🍎', 'Rajzolj egy almát!', 'Kész az alma!'], ['fagyi', 2, '🍦', 'Rajzolj egy fagyit!', 'Kész a fagyi!'],
  ['gomba', 2, '🍄', 'Rajzolj egy gombát!', 'Kész a gomba!'], ['virag', 2, '🌸', 'Rajzolj egy virágot!', 'Kész a virág!'],
  ['hoember', 2, '⛄', 'Rajzolj egy hóembert!', 'Kész a hóember!'], ['csiga', 2, '🐌', 'Rajzolj egy csigát!', 'Kész a csiga!'],
  ['eper', 2, '🍓', 'Rajzolj egy epret!', 'Kész az eper!'], ['cseresznye', 2, '🍒', 'Rajzolj cseresznyét!', 'Kész a cseresznye!'],
  ['korte', 2, '🍐', 'Rajzolj egy körtét!', 'Kész a körte!'], ['repa', 2, '🥕', 'Rajzolj egy sárgarépát!', 'Kész a répa!'],
  ['zaszlo', 2, '🚩', 'Rajzolj egy zászlót!', 'Kész a zászló!'], ['sziv', 2, '❤️', 'Rajzolj egy szívet!', 'Kész a szív!'],
  ['haz', 3, '🏠', 'Rajzolj egy házat!', 'Kész a ház!'], ['fa', 3, '🌳', 'Rajzolj egy fát!', 'Kész a fa!'],
  ['hal', 3, '🐟', 'Rajzolj egy halat!', 'Kész a hal!'], ['auto', 3, '🚗', 'Rajzolj egy autót!', 'Kész az autó!'],
  ['hajo', 3, '⛵', 'Rajzolj egy vitorlás hajót!', 'Kész a hajó!'], ['esernyo', 3, '☂️', 'Rajzolj egy esernyőt!', 'Kész az esernyő!'],
  ['torta', 3, '🎂', 'Rajzolj egy tortát!', 'Kész a torta!'], ['ajandek', 3, '🎁', 'Rajzolj egy ajándékdobozt!', 'Kész az ajándék!'],
  ['bogre', 3, '☕', 'Rajzolj egy bögrét!', 'Kész a bögre!'], ['pillango', 3, '🦋', 'Rajzolj egy pillangót!', 'Kész a pillangó!'],
  ['katica', 3, '🐞', 'Rajzolj egy katicát!', 'Kész a katica!'], ['falevel', 3, '🍁', 'Rajzolj egy falevelet!', 'Kész a falevél!'],
  ['cica', 4, '🐱', 'Rajzolj egy cicát!', 'Kész a cica!'], ['kutya', 4, '🐶', 'Rajzolj egy kutyát!', 'Kész a kutya!'],
  ['nyuszi', 4, '🐰', 'Rajzolj egy nyuszit!', 'Kész a nyuszi!'], ['madar', 4, '🐦', 'Rajzolj egy madarat!', 'Kész a madár!'],
  ['maci', 4, '🧸', 'Rajzolj egy macit!', 'Kész a maci!'], ['eger', 4, '🐭', 'Rajzolj egy egeret!', 'Kész az egér!'],
  ['beka', 4, '🐸', 'Rajzolj egy békát!', 'Kész a béka!'], ['suni', 4, '🦔', 'Rajzolj egy sünit!', 'Kész a süni!'],
  ['kacsa', 4, '🦆', 'Rajzolj egy kacsát!', 'Kész a kacsa!'], ['robot', 4, '🤖', 'Rajzold le Rozit, a robotot!', 'Köszönöm, ez nagyon kedves!'],
  ['unikornis', 4, '🦄', 'Rajzolj egy unikornist!', 'Kész az unikornis!'], ['magad', 4, '🙂', 'Rajzold le magadat!', 'Kész a kép rólad!'],
  ['haz-fa', 5, '🏠🌳', 'Rajzolj egy házat, és mellé egy fát!', 'Kész a ház és a fa!'],
  ['felho-nap', 5, '☁️☀️', 'Rajzolj egy felhőt, és fölé egy napot!', 'Kész a kép!'],
  ['viz-hal', 5, '🌊🐟', 'Rajzolj vizet, és bele egy halat!', 'Úszik a hal!'],
  ['fa-madar', 5, '🌳🐦', 'Rajzolj egy fát, és rá egy madarat!', 'Kész a fa és a madár!'],
  ['tenger-hajo', 5, '🌊⛵', 'Rajzolj egy hajót a tengeren!', 'Úszik a hajó!'],
  ['ut-auto', 5, '🛣️🚗', 'Rajzolj egy utat, és rá egy autót!', 'Indulhat az autó!'],
  ['kert', 5, '🌷🌻', 'Rajzolj egy kertet sok virággal!', 'Kész a kert!'],
  ['felhok-szivarvany', 5, '☁️🌈☁️', 'Rajzolj két felhőt, és közéjük egy szivárványt!', 'Kész a szivárvány!'],
  ['almafa', 5, '🌳🍎', 'Rajzolj egy fát, és rá sok almát!', 'Kész az almafa!'],
  ['hoember-ho', 5, '⛄❄️', 'Rajzolj egy hóembert, és köré hópelyheket!', 'Kész a téli kép!'],
  ['kedvenc-allat', 5, '🐾', 'Rajzold le a kedvenc állatodat!', 'Kész a kedvenc állatod!'],
  ['mai-nap', 5, '🎨', 'Rajzold le, mit csináltál ma!', 'Kész a mai nap képe!'],
];
RAJZ.push({ ...S, id: 'rajz.szabad', skill: 'rajz.szabad', icon: '🖍️', graded: false, neutral: true,
  targets: () => SZABAD.map(([key, level]) => ({ key, level })),
  make: t => { const [, , pic, say, done] = SZABAD.find(x => x[0] === t.key); return { type: 'draw', prompt: `Rajzolj! ${pic}`, pic, say, done }; },
  solve: () => 'kész' });

// --- színező: "Színezd pirosra a tetőt!" A gyerek színt választ, és a megnevezett részre koppint. Egy kép egy része egy
// feladat (a kért szín díszítés). Jó színezés után a kép többi része magától kiszíneződik (jutalom).
const KEP_COLORS = [...PALETTE, ['#8a5a3c', 'barna', 'barnára'], ['#ff6fae', 'rózsaszín', 'rózsaszínre']];
function makeKep(t, r) {
  const [pic, part] = t.key.split(':'), K = KEPEK[pic], P = K.parts.find(p => p[0] === part);
  const pool = KEP_COLORS.map((_, i) => i), good = P[5] ? pool.filter(i => P[5].includes(KEP_COLORS[i][1])) : pool;
  const want = good[Math.floor(r() * good.length)], n = P[1] >= 3 ? 4 : 3, rest = pool.filter(i => i !== want);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const cols = [want, ...rest.slice(0, n - 1)];
  return { type: 'kep', pic, prompt: `Színezd ki! ${K.pic}`, say: `Színezd ${KEP_COLORS[want][2]} ${P[3]}!`, target: part, color: 1,
    colors: cols.map(i => KEP_COLORS[i][0]), cnames: cols.map(i => KEP_COLORS[i][1]), cra: cols.map(i => KEP_COLORS[i][2]),
    parts: K.parts.map(([id, , nom, acc, fill, , shapes, pl]) => ({ id, nom, acc, fill, shapes, pl: !!pl })), deco: K.deco };
}
// a megoldó a kimondott mondatból dolgozik: melyik rész tárgyesete és melyik szín "-ra" alakja hangzik el benne
export function solveKep(item) {
  const has = w => new RegExp(`(^| )${w}( |!|$)`).test(item.say);
  const part = item.parts.filter(p => has(p.acc)).sort((a, b) => b.acc.length - a.acc.length)[0];
  const ci = item.cra.findIndex(has);
  return { part: part?.id, color: ci + 1 };
}
RAJZ.push({ ...S, id: 'rajz.kep', skill: 'rajz.kep', icon: '🖌️',
  targets: () => Object.entries(KEPEK).flatMap(([pic, K]) => K.parts.map(p => ({ key: `${pic}:${p[0]}`, level: p[1] }))),
  make: makeKep, solve: solveKep });
