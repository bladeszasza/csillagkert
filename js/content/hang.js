// Hangok háza: generált sablonok a fonológiai tudatosság sorrendjében:
// szótag (tapsolás, melyik hosszabb, szótagkezdés) → rím → kezdőhang → véghang → kezdőbetű.
// A szóbankban csak a kép és a név van kézzel írva; a szótagokat, az első és az utolsó hangot, a rímet a kód számolja
// a magyar szabályok szerint (egy szótag = egy magánhangzó; a kétjegyű betű egy hang), és a tesztek ellenőrzik.
// Kulcs-szabály: a kulcs a vizsgált szó (és a betűnél a betű); az eltérítők és a sorrend díszítés.
import { cap } from './common.js';
import { withArt, artLetter } from '../hu.js';

const S = { station: 'hang', icon: '🔤' };

// --- szóbank: kép + név. Ugyanaz a kép ugyanazzal a névvel, mint a többi állomáson (cica, nem macska; 🎩 kalap).
// Nincs benne ly (ugyanúgy hangzik, mint a j) és nincs hosszú kétjegyű mássalhangzó (nny, ssz), mert a szótagjai nem írhatók szét.
export const WORDS = [
  ['🐶', 'kutya'], ['🐱', 'cica'], ['🐰', 'nyuszi'], ['🦊', 'róka'], ['🐻', 'maci'], ['🐼', 'panda'], ['🐸', 'béka'], ['🐷', 'malac'],
  ['🐮', 'tehén'], ['🐔', 'tyúk'], ['🦆', 'kacsa'], ['🐭', 'egér'], ['🦔', 'sün'], ['🐢', 'teknős'], ['🐑', 'bárány'], ['🐴', 'ló'],
  ['🐐', 'kecske'], ['🦁', 'oroszlán'], ['🐘', 'elefánt'], ['🦒', 'zsiráf'], ['🐯', 'tigris'], ['🦓', 'zebra'], ['🐵', 'majom'],
  ['🦛', 'víziló'], ['🐊', 'krokodil'], ['🐟', 'hal'], ['🐥', 'csibe'], ['🦋', 'pillangó'], ['🐞', 'katica'], ['🐌', 'csiga'],
  ['🐝', 'méh'], ['🐜', 'hangya'], ['🦗', 'tücsök'], ['🪲', 'bogár'], ['🐛', 'hernyó'], ['🐪', 'teve'], ['🐧', 'pingvin'],
  ['🐿️', 'mókus'], ['🕷️', 'pók'], ['🐍', 'kígyó'], ['🦀', 'rák'],
  ['🍎', 'alma'], ['🍐', 'körte'], ['🍓', 'eper'], ['🍌', 'banán'], ['🥕', 'répa'], ['🍋', 'citrom'], ['🍒', 'cseresznye'],
  ['🍊', 'narancs'], ['🍇', 'szőlő'], ['🍑', 'barack'], ['🥦', 'brokkoli'], ['🥒', 'uborka'], ['🌽', 'kukorica'], ['🍆', 'padlizsán'],
  ['🥔', 'krumpli'], ['🧅', 'hagyma'], ['🫑', 'paprika'], ['🍄', 'gomba'], ['🎃', 'tök'], ['🍯', 'méz'], ['🍞', 'kenyér'],
  ['🍪', 'keksz'], ['🥚', 'tojás'], ['🎂', 'torta'],
  ['⭐', 'csillag'], ['🎈', 'lufi'], ['⚽', 'labda'], ['🚗', 'autó'], ['🚌', 'busz'], ['🚲', 'bicikli'], ['✈️', 'repülő'],
  ['🚂', 'vonat'], ['🚢', 'hajó'], ['🚁', 'helikopter'], ['🚜', 'traktor'], ['🚀', 'rakéta'],
  ['👕', 'póló'], ['👖', 'nadrág'], ['🧦', 'zokni'], ['🧤', 'kesztyű'], ['🧣', 'sál'], ['🧢', 'sapka'], ['🧥', 'kabát'], ['🎩', 'kalap'],
  ['👟', 'cipő'], ['🪁', 'sárkány'], ['🪀', 'jojó'], ['🎲', 'dobókocka'], ['🥁', 'dob'], ['🎸', 'gitár'], ['🎺', 'trombita'],
  ['🎻', 'hegedű'], ['🎹', 'zongora'], ['🥄', 'kanál'], ['🥣', 'tál'], ['🍽️', 'tányér'], ['🔨', 'kalapács'], ['⛏️', 'csákány'],
  ['🌷', 'tulipán'], ['🌻', 'napraforgó'], ['🌹', 'rózsa'], ['🌵', 'kaktusz'], ['🌸', 'virág'], ['🌳', 'fa'], ['🌞', 'nap'],
  ['✋', 'kéz'], ['🏰', 'vár'], ['🌊', 'tenger'], ['🔑', 'kulcs'], ['🦷', 'fog'], ['🦴', 'csont'], ['☂️', 'esernyő'],
  ['🕯️', 'gyertya'], ['✂️', 'olló'], ['🏠', 'ház'], ['🪑', 'szék'], ['⌚', 'óra'], ['🌙', 'hold'], ['🚪', 'ajtó'],
].map(([e, n]) => ({ e, n }));

// --- hangtan: a kétjegyű (és háromjegyű) betű egy hang; a szóvégi "ck" (barack) egy k, a kocka c-je és k-ja két hang
const VOWELS = 'aáeéiíoóöőuúüű';
const DIGRAPHS = ['dzs', 'cs', 'dz', 'gy', 'ly', 'ny', 'sz', 'ty', 'zs', 'ck'];
const unitAt = (w, i) => DIGRAPHS.find(g => w.startsWith(g, i) && (g !== 'ck' || i + 2 === w.length));
export function sounds(word) {
  const w = word.toLowerCase(), out = [];
  for (let i = 0; i < w.length;) {
    const d = unitAt(w, i);
    if (d) { out.push(d === 'ck' ? 'k' : d); i += d.length; } else { out.push(w[i]); i++; }
  }
  return out;
}
const isV = s => VOWELS.includes(s);
// szótagolás: minden magánhangzó egy szótag; két magánhangzó között egy mássalhangzó a következő szótaghoz megy,
// több mássalhangzóból csak az utolsó. A szótagok betűi (nem a hangjai) adják ki a szót.
export function syllables(word) {
  const w = word.toLowerCase(), units = [];
  for (let i = 0; i < w.length;) { const d = unitAt(w, i); const u = d || w[i]; units.push(u); i += u.length; }
  const vi = units.map((u, i) => (isV(u) ? i : -1)).filter(i => i >= 0);
  if (vi.length < 2) return [word];
  const cut = [];
  for (let k = 0; k < vi.length - 1; k++) { const gap = vi[k + 1] - vi[k] - 1; cut.push(gap === 0 ? vi[k + 1] : vi[k + 1] - 1); }
  const parts = []; let from = 0;
  for (const c of cut) { parts.push(units.slice(from, c).join('')); from = c; }
  parts.push(units.slice(from).join(''));
  return parts;
}
const hasHiatus = word => { const s = sounds(word); return s.some((x, i) => i && isV(x) && isV(s[i - 1])); };
// hangcsaládok: ezek egymás eltérítői sem lehetnek (rövid–hosszú magánhangzó, zöngés–zöngétlen pár, sziszegők, orrhangok, r–l–j)
const FAMILY = [['a', 'á'], ['e', 'é'], ['i', 'í'], ['o', 'ó'], ['ö', 'ő'], ['u', 'ú'], ['ü', 'ű'], ['b', 'p'], ['d', 't', 'ty', 'gy'], ['g', 'k'], ['f', 'v'],
  ['s', 'sz', 'z', 'zs', 'c', 'cs', 'dz', 'dzs'], ['m', 'n', 'ny'], ['l', 'r', 'j', 'ly'], ['h']];
const fam = s => FAMILY.findIndex(f => f.includes(s));
const near = (a, b) => a === b || fam(a) === fam(b);
// a magánhangzóval vagy "hosszan mondható" mássalhangzóval kezdődő szót könnyebb hallani, mint a pattanó hangot
const EASY = new Set([...VOWELS, 'm', 'n', 'ny', 's', 'sz', 'z', 'zs', 'l', 'r', 'f', 'v', 'h', 'j']);

const info = w => {
  const parts = syllables(w.n), snd = sounds(w.n), vowels = snd.filter(isV);
  return { ...w, parts, syl: vowels.length, first: snd[0], last: snd[snd.length - 1], lastV: vowels[vowels.length - 1], hiatus: hasHiatus(w.n) };
};
export const BANK = WORDS.map(info);
const byName = new Map(BANK.map(w => [w.n, w]));
const byFace = new Map(BANK.map(w => [w.e, w]));
// rím: az utolsó szótag magánhangzója és a mögötte lévő hangok egyeznek; nyitott szótagnál (alma) az egész utolsó szótag,
// és ha mindkét szó legalább kétszótagú, az utolsó előtti magánhangzó is (cica – katica, alma – hagyma)
const coda = w => { const s = sounds(w.parts[w.parts.length - 1]); return s.slice(s.findIndex(isV)); };
const penultV = w => (w.syl < 2 ? null : sounds(w.parts[w.parts.length - 2]).find(isV));
export function rhymes(a, b) {
  if (a.n === b.n) return false;
  const ca = coda(a), cb = coda(b);
  if (ca.join() !== cb.join()) return false;
  if (ca.length > 1) return true;                              // zárt szótag: kéz – méz, tál – kanál
  if (a.parts[a.parts.length - 1] !== b.parts[b.parts.length - 1]) return false;
  return a.syl < 2 || b.syl < 2 || penultV(a) === penultV(b);
}

const pic = w => ({ key: w.n, t: w.e, name: w.n });
const big = w => `<span class="big1">${w.e}</span>`;
// a jó válasz és két eltérítő; az eltérítők a megadott készletből jönnek, egymásnak sem lehetnek "majdnem jók"
function choose(r, right, pool, bad) {
  const out = [];
  for (const w of r.shuffle(pool)) { if (out.length === 2) break; if (w !== right && !bad(w) && !out.some(o => o.n === w.n)) out.push(w); }
  return out;
}
const one = (item, test) => { const ok = item.options.filter(o => test(byName.get(o.name))); return ok.length === 1 ? ok[0].name : null; };

const COUNTABLE = BANK.filter(w => !w.hiatus);                                     // az autó (a-u-tó) szótagszáma vitatható
const mates = (w, rel) => BANK.filter(x => x !== w && rel(w, x));
const sameFirst = (a, b) => a.first === b.first;
const sameLast = (a, b) => a.last === b.last;
const sameSyl1 = (a, b) => a.parts[0] === b.parts[0] && a.syl > 1 && b.syl > 1;
const RHYMING = BANK.filter(w => mates(w, rhymes).length);
const LETTERS = BANK.filter(w => w.first.length === 1 && mates(w, sameFirst).length);

export const HANG = [
  // 1. Tapsolás: annyit tapsol, ahány szótag (clap feladat). Kulcs: a szó.
  { ...S, id: 'hang.taps', skill: 'hang.szotag',
    targets: () => COUNTABLE.filter(w => w.syl <= 4).map(w => ({ key: w.n, level: w.syl <= 2 ? 1 : w.syl - 1, w })),
    make: t => ({ type: 'clap', word: { t: t.w.e, name: t.w.n, parts: t.w.parts } }),
    solve: item => sounds(item.word.name).filter(isV).length },

  // 2. Melyik a leghosszabb szó? (a szótagok száma dönt). Kulcs: a leghosszabb szó.
  { ...S, id: 'hang.hosszabb', skill: 'hang.hosszabb',
    targets: () => COUNTABLE.filter(w => w.syl >= 2 && w.syl <= 4).map(w => ({ key: w.n, level: w.syl, w })),
    make: (t, r) => {
      const w = t.w, shorter = COUNTABLE.filter(x => x.syl < w.syl);
      // az egyik eltérítő eggyel rövidebb (nem elég ránézni), a másik bármilyen rövidebb
      const a = r.pick(shorter.filter(x => x.syl === w.syl - 1)), b = r.pick(shorter.filter(x => x !== a && x.syl !== a.syl || x !== a && w.syl === 2));
      return { type: 'pick', prompt: 'Melyik a leghosszabb szó?', ask: {},
        options: r.shuffle([w, a, b].map(x => ({ ...pic(x), ok: x === w, said: `${cap(x.parts.join('-'))}: ez rövidebb.` }))),
        fact: `${cap(withArt(w.n))} a leghosszabb: ${w.parts.join('-')}.`, hint: 'Tapsold el mindegyiket! Melyikre tapsolsz a legtöbbet?' };
    },
    solve: item => { const n = item.options.map(o => byName.get(o.name).syl), m = Math.max(...n); return n.filter(x => x === m).length === 1 ? item.options[n.indexOf(m)].name : null; } },

  // 3. Szótagkezdés: ma-ci, ma-lac. Kulcs: a megmutatott szó.
  { ...S, id: 'hang.szotagkezdo', skill: 'hang.szotagkezdo',
    targets: () => BANK.filter(w => mates(w, sameSyl1).length).map(w => ({ key: w.n, level: 2, w })),
    make: (t, r) => {
      const w = t.w, right = r.pick(mates(w, sameSyl1)), wrongs = choose(r, right, BANK.filter(x => x.syl > 1), x => near(x.first, w.first) || x.parts[0] === w.parts[0]);
      return { type: 'pick', prompt: `${cap(withArt(w.n))}: ${w.parts.join('-')}. Melyik kezdődik így: ${w.parts[0]}?`, qHtml: big(w), ask: { n: w.n },
        options: r.shuffle([right, ...wrongs].map(x => ({ ...pic(x), ok: x === right, said: `${cap(x.parts.join('-'))}. Ez így kezdődik: ${x.parts[0]}.` }))),
        fact: `${cap(w.parts.join('-'))}, ${right.parts.join('-')}: mindkettő így kezdődik: ${w.parts[0]}.`, hint: `Tapsold el lassan: ${w.parts.join('-')}! Melyik kezdődik ugyanígy?` };
    },
    solve: item => { const w = byName.get(item.ask.n); return one(item, x => sameSyl1(w, x)); } },

  // 4. Rím: Mi rímel a kéz szóra? Kulcs: a megmutatott szó. Az eltérítő utolsó magánhangzója is más (nincs "majdnem rím").
  { ...S, id: 'hang.rim', skill: 'hang.rim',
    targets: () => RHYMING.map(w => ({ key: w.n, level: coda(w).length > 1 ? 2 : 3, w })),
    make: (t, r) => {
      const w = t.w, right = r.pick(mates(w, rhymes)), wrongs = choose(r, right, RHYMING, x => near(x.lastV, w.lastV) || x.last === w.last);
      return { type: 'pick', prompt: `Mi rímel ${withArt(w.n)} szóra?`, qHtml: big(w), ask: { n: w.n },
        options: r.shuffle([right, ...wrongs].map(x => ({ ...pic(x), ok: x === right, said: x === right ? `Ez ${withArt(x.n)}.` : `${cap(w.n)}, ${x.n}: ez nem rímel.` }))),
        fact: `${cap(withArt(w.n))} és ${withArt(right.n)} rímel: ${w.n}, ${right.n}.`, hint: `Mondd ki: ${w.n}! Melyik szó végződik ugyanúgy?` };
    },
    solve: item => { const w = byName.get(item.ask.n); return one(item, x => rhymes(w, x)); } },

  // 5. Kezdőhang: melyik kezdődik úgy, mint az alma? Kulcs: a megmutatott szó.
  { ...S, id: 'hang.kezdo', skill: 'hang.kezdohang',
    targets: () => BANK.filter(w => mates(w, sameFirst).length).map(w => ({ key: w.n, level: EASY.has(w.first) ? 3 : 4, w })),
    make: (t, r) => {
      const w = t.w, right = r.pick(mates(w, sameFirst)), wrongs = choose(r, right, BANK, x => near(x.first, w.first));
      return { type: 'pick', prompt: `Melyik kezdődik úgy, mint ${withArt(w.n)}?`, qHtml: big(w), ask: { n: w.n },
        options: r.shuffle([right, ...wrongs].map(x => ({ ...pic(x), ok: x === right, said: x === right ? `Ez ${withArt(x.n)}.` : `Ez ${withArt(x.n)}. ${cap(withArt(x.n))} másképp kezdődik.` }))),
        fact: `${cap(withArt(w.n))} és ${withArt(right.n)} ugyanazzal a hanggal kezdődik.`, hint: `Mondd ki lassan: ${w.n}! Mi az első hang?` };
    },
    solve: item => { const w = byName.get(item.ask.n); return one(item, x => sameFirst(w, x)); } },

  // 6. Véghang: melyik végződik úgy, mint a hal? Kulcs: a megmutatott szó.
  { ...S, id: 'hang.veg', skill: 'hang.veghang',
    targets: () => BANK.filter(w => mates(w, sameLast).length).map(w => ({ key: w.n, level: isV(w.last) ? 4 : 5, w })),
    make: (t, r) => {
      const w = t.w, right = r.pick(mates(w, sameLast)), wrongs = choose(r, right, BANK, x => near(x.last, w.last));
      return { type: 'pick', prompt: `Melyik végződik úgy, mint ${withArt(w.n)}?`, qHtml: big(w), ask: { n: w.n },
        options: r.shuffle([right, ...wrongs].map(x => ({ ...pic(x), ok: x === right, said: x === right ? `Ez ${withArt(x.n)}.` : `Ez ${withArt(x.n)}. ${cap(withArt(x.n))} másképp végződik.` }))),
        fact: `${cap(withArt(w.n))} és ${withArt(right.n)} ugyanazzal a hanggal végződik.`, hint: `Mondd ki lassan: ${w.n}! Mi az utolsó hang?` };
    },
    solve: item => { const w = byName.get(item.ask.n); return one(item, x => sameLast(w, x)); } },

  // 7. Kezdőbetű: a betűt mutatjuk, a gyerek a képet választja. Csak egyjegyű betűk. Kulcs: a betű és a jó szó.
  //    A képek alatt nincs felirat (a felirat első betűje elárulná).
  { ...S, id: 'hang.betu', skill: 'hang.betu',
    targets: () => LETTERS.map(w => ({ key: `${w.first}-${w.n}`, level: 5, w, L: w.first.toUpperCase() })),
    make: (t, r) => {
      const w = t.w, L = t.L, wrongs = choose(r, w, BANK, x => near(x.first, w.first));
      return { type: 'pick', prompt: 'Melyik kezdődik ezzel a betűvel?', say: `Ez ${artLetter(L)} ${L} betű. Melyik szó kezdődik vele?`,
        qHtml: `<span class="letter1">${L}</span>`, ask: { L },
        options: r.shuffle([w, ...wrongs].map(x => ({ ...pic(x), hideName: true, ok: x === w, said: x === w ? `Ez ${withArt(x.n)}.` : `Ez ${withArt(x.n)}. ${cap(withArt(x.n))} másképp kezdődik.` }))),
        fact: `${cap(withArt(w.n))} ${artLetter(L)} ${L} betűvel kezdődik.`, hint: 'Mondd ki lassan a szavakat, és figyeld az első hangot!' };
    },
    solve: item => one(item, x => x.first.toUpperCase() === item.ask.L) },
];

export { byFace as hangWordOf };
