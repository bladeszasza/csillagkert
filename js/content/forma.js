// Formák és színek: generált sablonok, saját rajzolt formákkal (js/content/pics.js).
// Sorrend (docs/pedagogia.md): alapformák és alapszínek → több forma és szín → szín és forma együtt → tulajdonságok
// (sarkok, darabszám) → téri viszonyok (fölött, alatt, között, balra, jobbra) → méret-összevetés → hasonló formák.
// Kulcs-szabály: a kulcs csak a választ meghatározó paraméter (a keresett forma, szín, viszony, hely);
// a díszítő szín, a tárgyak és a sorrend bemutatásonként változik, ez nem új feladat.
import { NUMS, attr, cap, numCard, nearNums } from './common.js';
import { SHAPES, COLORS, shape, shadow, arrow, measure, swatch } from './pics.js';
import { withArt } from '../hu.js';

const S = { station: 'forma', icon: '🔺' };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const dataOf = (html, a) => (new RegExp(`data-${a}="([^"]+)"`).exec(String(html)) || [])[1];
const allData = (html, a) => [...String(html).matchAll(new RegExp(`data-${a}="([^"]+)"`, 'g'))].map(m => m[1]);

// --- formák: szint, összetéveszthető párok, ragozott alakok, rövid tény és segítség
const SL = { kor: 1, negyzet: 1, haromszog: 1, teglalap: 2, csillag: 2, sziv: 2, ovalis: 3, rombusz: 3, otszog: 4, hatszog: 4 };
const CONF = { kor: ['ovalis'], ovalis: ['kor'], negyzet: ['teglalap', 'rombusz'], teglalap: ['negyzet', 'rombusz'], rombusz: ['negyzet', 'teglalap'], otszog: ['hatszog'], hatszog: ['otszog'] };
const SH_ACC = { kor: 'kört', negyzet: 'négyzetet', haromszog: 'háromszöget', teglalap: 'téglalapot', csillag: 'csillagot', sziv: 'szívet', ovalis: 'oválist', rombusz: 'rombuszt', otszog: 'ötszöget', hatszog: 'hatszöget' };
const SH_DAT = { kor: 'körnek', negyzet: 'négyzetnek', haromszog: 'háromszögnek', teglalap: 'téglalapnak', rombusz: 'rombusznak', otszog: 'ötszögnek', hatszog: 'hatszögnek' };
const SH_FACT = {
  kor: 'kerek, nincs sarka', negyzet: 'négy egyforma oldala van', haromszog: 'három sarka van', teglalap: 'két hosszú és két rövid oldala van',
  csillag: 'öt ága van', sziv: 'ilyet rajzolunk, ha szeretünk valakit', ovalis: 'olyan, mint egy tojás', rombusz: 'olyan, mint egy ferde négyzet',
  otszog: 'öt sarka van', hatszog: 'hat sarka van, mint a méhsejtnek',
};
const SH_HINT = {
  kor: 'A kör kerek, mint a labda.', negyzet: 'A négyzetnek négy egyforma oldala van.', haromszog: 'A háromszögnek három sarka van.',
  teglalap: 'A téglalap olyan, mint egy tégla.', csillag: 'A csillagnak öt ága van.', sziv: 'A szívet rajzoljuk, ha szeretünk valakit.',
  ovalis: 'Az ovális hosszúkás és kerek, mint a tojás.', rombusz: 'A rombusz olyan, mint egy ferde négyzet.',
  otszog: 'Az ötszögnek öt sarka van.', hatszog: 'A hatszögnek hat sarka van.',
};
const sname = s => SHAPES[s].name;
const notConf = (s, x) => x !== s && !(CONF[s] || []).includes(x);

// --- színek: szint, tárgyeset, hasonlat, a közeli (összetéveszthető) színek
const CL = { piros: 1, kek: 1, sarga: 1, zold: 1, narancs: 2, lila: 2, feher: 2, fekete: 2, rozsaszin: 3, barna: 3, szurke: 3 };
const C_ACC = { piros: 'pirosat', kek: 'kéket', sarga: 'sárgát', zold: 'zöldet', narancs: 'narancssárgát', lila: 'lilát', rozsaszin: 'rózsaszínt', barna: 'barnát', fekete: 'feketét', feher: 'fehéret', szurke: 'szürkét' };
const LIKE = { piros: 'az eper', kek: 'az ég', sarga: 'a citrom', zold: 'a fű', narancs: 'a narancs', lila: 'a padlizsán', rozsaszin: 'a malac', barna: 'a csoki', fekete: 'az éjszaka', feher: 'a hó', szurke: 'az elefánt' };
const NEAR = { piros: ['narancs', 'rozsaszin'], narancs: ['piros', 'sarga', 'barna'], sarga: ['narancs'], rozsaszin: ['piros', 'lila'], lila: ['rozsaszin', 'kek'], kek: ['lila'], barna: ['narancs'], szurke: ['feher', 'fekete'], feher: ['szurke'], fekete: ['szurke'], zold: [] };
const BRIGHT = ['piros', 'kek', 'sarga', 'zold', 'narancs', 'lila', 'rozsaszin'];
const cname = c => COLORS[c].name;
const colorOpt = (c, ok) => ({ key: c, t: swatch(c), name: cname(c), ok, hideName: true, said: `Ez ${cname(c)}.` });

// Tárgyak állandó színnel (a "Milyen színű?" kérdéshez). alt: amilyen színű a valóságban is lehet (az nem lehet eltérítő);
// has: a képen látható másik szín (pl. az eper zöld levele) – "Melyik zöld?" kérdésnél nem kerül a válaszok közé.
const CT = [
  { e: '🍋', n: 'citrom', acc: 'citromot', c: 'sarga' }, { e: '🍌', n: 'banán', acc: 'banánt', c: 'sarga', alt: ['zold'] },
  { e: '🌽', n: 'kukorica', acc: 'kukoricát', c: 'sarga', has: ['zold'] }, { e: '🐥', n: 'csibe', acc: 'csibét', c: 'sarga', has: ['narancs'] },
  { e: '🌻', n: 'napraforgó', acc: 'napraforgót', c: 'sarga', has: ['barna', 'zold'] },
  { e: '🐸', n: 'béka', acc: 'békát', c: 'zold', alt: ['barna'] }, { e: '🥦', n: 'brokkoli', acc: 'brokkolit', c: 'zold' },
  { e: '🥒', n: 'uborka', acc: 'uborkát', c: 'zold' }, { e: '🌲', n: 'fenyőfa', acc: 'fenyőfát', c: 'zold', has: ['barna'] },
  { e: '🌵', n: 'kaktusz', acc: 'kaktuszt', c: 'zold' },
  { e: '🥕', n: 'répa', acc: 'répát', c: 'narancs', alt: ['sarga', 'lila'], has: ['zold'] }, { e: '🍊', n: 'narancs', acc: 'narancsot', c: 'narancs', has: ['zold'] },
  { e: '🎃', n: 'tök', acc: 'tököt', c: 'narancs', alt: ['sarga', 'zold'] },
  { e: '🍆', n: 'padlizsán', acc: 'padlizsánt', c: 'lila', has: ['zold'] },
  { e: '🐷', n: 'malac', acc: 'malacot', c: 'rozsaszin' }, { e: '🦩', n: 'flamingó', acc: 'flamingót', c: 'rozsaszin' },
  { e: '🌰', n: 'gesztenye', acc: 'gesztenyét', c: 'barna' }, { e: '🍫', n: 'csoki', acc: 'csokit', c: 'barna', alt: ['feher'], hidden: true },
  { e: '🐘', n: 'elefánt', acc: 'elefántot', c: 'szurke' }, { e: '🐨', n: 'koala', acc: 'koalát', c: 'szurke', has: ['fekete'] },
  { e: '⛄', n: 'hóember', acc: 'hóembert', c: 'feher', has: ['fekete', 'narancs'] }, { e: '🥛', n: 'tej', acc: 'tejet', c: 'feher' },
  { e: '☁️', n: 'felhő', acc: 'felhőt', c: 'feher', alt: ['szurke'] }, { e: '🐑', n: 'bárány', acc: 'bárányt', c: 'feher', alt: ['szurke', 'fekete'], has: ['fekete'] },
  { e: '🦢', n: 'hattyú', acc: 'hattyút', c: 'feher', alt: ['fekete'], has: ['narancs'] },
  { e: '🍓', n: 'eper', acc: 'epret', c: 'piros', has: ['zold'] }, { e: '🍒', n: 'cseresznye', acc: 'cseresznyét', c: 'piros', alt: ['fekete'], has: ['zold'] },
  { e: '🚒', n: 'tűzoltóautó', acc: 'tűzoltóautót', c: 'piros' }, { e: '🐞', n: 'katica', acc: 'katicát', c: 'piros', alt: ['sarga'], has: ['fekete'] },
  { e: '🍅', n: 'paradicsom', acc: 'paradicsomot', c: 'piros', alt: ['zold', 'sarga', 'narancs'], has: ['zold'] },
  { e: '🌊', n: 'tenger', acc: 'tengert', c: 'kek', alt: ['zold'], has: ['feher'] },
];
// Csak a képen látszó színük miatt (a "Melyik fekete?" kérdéshez): nem tény-kérdés, mert a valóságban sokféle színűek
const SEEN = [
  ...CT.filter(o => !o.hidden),
  { e: '🎩', n: 'kalap', c: 'fekete', has: ['piros'] }, { e: '🕷️', n: 'pók', c: 'fekete' },
  { e: '🧢', n: 'sapka', c: 'kek' }, { e: '🦋', n: 'pillangó', c: 'kek', has: ['fekete'] },
];

// --- jelenet (téri viszonyok): irány nélküli tárgyak, ragozott alakkal
const GRID = [
  { e: '🍎', n: 'alma', acc: 'almát', abl: 'almától' }, { e: '🍐', n: 'körte', acc: 'körtét', abl: 'körtétől' }, { e: '🍓', n: 'eper', acc: 'epret', abl: 'epertől' },
  { e: '🍌', n: 'banán', acc: 'banánt', abl: 'banántól' }, { e: '🥕', n: 'répa', acc: 'répát', abl: 'répától' }, { e: '🌸', n: 'virág', acc: 'virágot', abl: 'virágtól' },
  { e: '⭐', n: 'csillag', acc: 'csillagot', abl: 'csillagtól' }, { e: '🎈', n: 'lufi', acc: 'lufit', abl: 'lufitól' }, { e: '🍄', n: 'gomba', acc: 'gombát', abl: 'gombától' },
  { e: '⚽', n: 'labda', acc: 'labdát', abl: 'labdától' }, { e: '🍋', n: 'citrom', acc: 'citromot', abl: 'citromtól' }, { e: '🍪', n: 'keksz', acc: 'kekszet', abl: 'keksztől' },
  { e: '🥚', n: 'tojás', acc: 'tojást', abl: 'tojástól' },
];
const LEFT = 'Tedd a kezed a szívedre: az a bal oldalad.';
const RIGHT = 'Tedd a kezed a szívedre: az a bal. A másik oldal a jobb.';
// hol van d az a-hoz képest (ha egy sorban vagy oszlopban vannak) – a tévedésnél ezt mondja el
function where(d, a, A) {
  if (d.c === a.c) return d.r < a.r ? `${withArt(A.n)} fölött` : `${withArt(A.n)} alatt`;
  if (d.r === a.r) return `${withArt(A.abl)} ${d.c < a.c ? 'balra' : 'jobbra'}`;
  return '';
}
const sceneOf = item => [...String(item.qHtml).matchAll(/<span>([^<]+)<\/span>/g)].map(m => m[1]);

// --- méret-összevetés: fajta, a legnagyobb és a legkisebb neve (tárgyesettel), középfok
const MERET = {
  nagy: { max: 'legnagyobb', min: 'legkisebb', acc: ['legnagyobbat', 'legkisebbet'], more: 'nagyobb', less: 'kisebb', lv: [1, 3] },
  hossz: { max: 'leghosszabb', min: 'legrövidebb', acc: ['leghosszabbat', 'legrövidebbet'], more: 'hosszabb', less: 'rövidebb', lv: [2, 4] },
  magas: { max: 'legmagasabb', min: 'legalacsonyabb', acc: ['legmagasabbat', 'legalacsonyabbat'], more: 'magasabb', less: 'alacsonyabb', lv: [2, 4] },
  vastag: { max: 'legvastagabb', min: 'legvékonyabb', acc: ['legvastagabbat', 'legvékonyabbat'], more: 'vastagabb', less: 'vékonyabb', lv: [3, 5] },
};
const SIZE_EMOJI = ['🍎', '🎈', '⭐', '🌸', '⚽', '🍄', '🐟', '🦋'];
const BAR_COLORS = ['#4cc38a', '#ff8a1f', '#2f6fe0', '#e8383d', '#8e44c9'];
// a kép mérete abból, amit a gyerek lát (betűméret vagy a rajzolt téglalap)
function sizeOf(html, kind) {
  if (kind === 'nagy') return +(/font-size:\s*([\d.]+)em/.exec(html) || [])[1];
  const m = /<rect[^>]*\swidth="(\d+)"[^>]*\sheight="(\d+)"/.exec(html);
  return kind === 'hossz' ? +m[1] : +m[2];
}

// --- irányok
const DIRS = { fel: { w: 'felfelé', hint: 'Felfelé: az ég felé.', lv: 2, opp: 'le' }, le: { w: 'lefelé', hint: 'Lefelé: a föld felé.', lv: 2, opp: 'fel' }, balra: { w: 'balra', hint: LEFT, lv: 4, opp: 'jobbra' }, jobbra: { w: 'jobbra', hint: RIGHT, lv: 4, opp: 'balra' } };

// --- árnyékok: egész alakos képek, jól felismerhető körvonallal; az állatok egymás között nehezebbek
const SIL = [
  ['🐘', 'elefánt', 'allat'], ['🦒', 'zsiráf', 'allat'], ['🐢', 'teknős', 'allat'], ['🐇', 'nyuszi', 'allat'], ['🐈', 'cica', 'allat'],
  ['🐕', 'kutya', 'allat'], ['🐎', 'ló', 'allat'], ['🐓', 'kakas', 'allat'], ['🦆', 'kacsa', 'allat'], ['🐌', 'csiga', 'allat'],
  ['🐟', 'hal', 'allat'], ['🦋', 'pillangó', 'allat'],
  ['🍎', 'alma', 'targy'], ['🍌', 'banán', 'targy'], ['🥕', 'répa', 'targy'], ['🍐', 'körte', 'targy'], ['🍄', 'gomba', 'targy'],
  ['🎈', 'lufi', 'targy'], ['🔑', 'kulcs', 'targy'], ['☂️', 'esernyő', 'targy'], ['✂️', 'olló', 'targy'], ['🚗', 'autó', 'targy'],
  ['✈️', 'repülő', 'targy'], ['🏠', 'ház', 'targy'], ['🌳', 'fa', 'targy'],
].map(([e, n, g]) => ({ e, n, g }));

// --- torony: alulról számolt hely kimondva
function place(p, h) {
  if (p === 1) return { q: 'legalul', said: 'legalul van', hint: 'Nézd meg a torony alját!' };
  if (p === h) return { q: 'legfelül', said: 'legfelül van', hint: 'Nézd meg a torony tetejét!' };
  if (2 * p === h + 1) return { q: 'középen', said: 'középen van', hint: 'Keresd meg, melyik van éppen a közepén!' };
  if (p === 2) return { q: 'alulról a második helyen', said: 'alulról a második', hint: 'Számolj alulról: első, második.' };
  return { q: 'felülről a második helyen', said: 'felülről a második', hint: 'Számolj felülről: első, második.' };
}
const TOWER = ['piros', 'kek', 'sarga', 'zold', 'narancs', 'lila', 'rozsaszin', 'barna'];

// a keverés független ellenőrzése: a két szín átlaga melyik válaszhoz van a legközelebb
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const MIX = [['piros', 'sarga', 'narancs', 4], ['kek', 'sarga', 'zold', 4], ['piros', 'kek', 'lila', 4], ['piros', 'feher', 'rozsaszin', 5], ['fekete', 'feher', 'szurke', 5]];

const shapeOpt = (s, c, ok, said) => ({ key: s, t: shape(s, c), name: sname(s), ok, hideName: true, said: said || `Ez ${withArt(sname(s))}.` });
const nameShape = (t, r, pool) => {
  const c = r.pick(BRIGHT);
  return { type: 'pick', prompt: `Melyik ${withArt(sname(t.s))}?`, noList: true, ask: { s: t.s },
    options: r.shuffle([t.s, ...pool].map(s => shapeOpt(s, c, s === t.s))), fact: `Ez ${withArt(sname(t.s))}: ${SH_FACT[t.s]}.`, hint: SH_HINT[t.s] };
};
const solveShape = item => item.options.find(o => dataOf(o.t, 's') === item.ask.s).name;

export const FORMA = [
  // 1. Melyik a kör? Kulcs: a keresett forma. Az eltérítők nem összetéveszthetők (azt a "hasonló formák" gyakorolja).
  { ...S, id: 'forma.nev', skill: 'forma.formak',
    targets: () => Object.keys(SL).map(s => ({ key: s, level: SL[s], s })),
    make: (t, r) => nameShape(t, r, r.sample(Object.keys(SL).filter(x => notConf(t.s, x) && SL[x] <= Math.max(SL[t.s], 2)), 2)),
    solve: solveShape },

  // 2. Hasonló formák: kör vagy ovális? négyzet, téglalap vagy rombusz? ötszög vagy hatszög? Kulcs: a keresett forma.
  { ...S, id: 'forma.hasonlo', skill: 'forma.formak',
    targets: () => ['kor', 'ovalis', 'negyzet', 'teglalap', 'rombusz', 'otszog', 'hatszog'].map(s => ({ key: s, level: s === 'kor' || s === 'ovalis' ? 4 : 5, s })),
    make: (t, r) => {
      const group = CONF[t.s], extra = group.length < 2 ? [r.pick(Object.keys(SL).filter(x => x !== t.s && !group.includes(x) && notConf(t.s, x) && !(CONF[x] || []).some(y => group.includes(y) || y === t.s)))] : [];
      return nameShape(t, r, [...group, ...extra]);
    },
    solve: solveShape },

  // 3. Melyik piros? Kulcs: a keresett szín. Kezdőszinten a hasonló színek nem kerülnek egymás mellé.
  { ...S, id: 'forma.szin', skill: 'forma.szinek',
    targets: () => Object.keys(CL).map(c => ({ key: c, level: CL[c], c })),
    make: (t, r) => {
      const pool = Object.keys(CL).filter(c => c !== t.c && (t.level > 1 || !NEAR[t.c].includes(c)) && CL[c] <= Math.max(2, t.level));
      return { type: 'pick', prompt: `Melyik ${cname(t.c)}?`, noList: true, ask: { c: t.c },
        options: r.shuffle([t.c, ...r.sample(pool, 2)].map(c => colorOpt(c, c === t.c))),
        fact: `Ez ${cname(t.c)}, mint ${LIKE[t.c]}.`, hint: `A ${cname(t.c)} olyan, mint ${LIKE[t.c]}.` };
    },
    solve: item => item.options.find(o => dataOf(o.t, 'c') === item.ask.c).name },

  // 4. Színkeverés: a piros és a sárga együtt narancssárga. Kulcs: a keverék.
  { ...S, id: 'forma.keveres', skill: 'forma.szinek',
    targets: () => MIX.map(([a, b, c, level]) => ({ key: `${a}-${b}`, level, a, b, c })),
    make: (t, r) => ({ type: 'pick', prompt: 'Milyen szín lesz?', say: `Összekeverjük a ${C_ACC[t.a]} és a ${C_ACC[t.b]}. Milyen szín lesz?`,
      qHtml: `<span class="mix">${swatch(t.a, 90)}<b>+</b>${swatch(t.b, 90)}<b>=</b><b class="next">?</b></span>`,
      options: r.shuffle([t.c, t.a, t.b].map(c => colorOpt(c, c === t.c))),
      fact: `A ${cname(t.a)} és a ${cname(t.b)} együtt ${cname(t.c)} lesz.`, hint: 'Gondolj a festékre! Ha összekevered, új szín lesz.' }),
    solve: item => {
      const [a, b] = allData(item.qHtml, 'c').map(c => rgb(COLORS[c].hex)), mix = a.map((v, i) => (v + b[i]) / 2);
      const d = o => rgb(COLORS[dataOf(o.t, 'c')].hex).reduce((s, v, i) => s + (v - mix[i]) ** 2, 0);
      return item.options.reduce((x, y) => (d(y) < d(x) ? y : x)).name;
    } },

  // 5. Milyen színű a citrom? (színtelen képpel: emlékezetből) Kulcs: a tárgy.
  { ...S, id: 'forma.targyszin', skill: 'forma.targyszin',
    targets: () => CT.map(o => ({ key: o.n, level: CL[o.c] === 1 ? 2 : 3, o })),
    make: (t, r) => {
      // a kép szürke: a szürke, a fehér és a fekete eltérítőként csapda lenne (a szürke képen ezek látszanak), ezért nem kerülnek mellé
      const o = t.o, pool = Object.keys(CL).filter(c => c !== o.c && !NEAR[o.c].includes(c) && !(o.alt || []).includes(c) && !(o.has || []).includes(c) && !['szurke', 'feher', 'fekete'].includes(c));
      return { type: 'pick', prompt: `Milyen színű ${withArt(o.n)}?`, qHtml: `<span class="nocolor">${o.e}</span>`, ask: { n: o.n },
        options: r.shuffle([o.c, ...r.sample(pool, 2)].map(c => colorOpt(c, c === o.c))),
        fact: `${cap(withArt(o.n))} ${cname(o.c)}.`, hint: `Képzeld el ${withArt(o.acc)}! Milyen a színe?` };
    },
    // a tény a szóbankból jön (a kép szürke): a megoldó a tárgy nevéből keresi ki a színét
    solve: item => cname(CT.find(o => o.n === item.ask.n).c) },

  // 6. Melyik sárga? (színes tárgyak közül) Kulcs: a keresett szín; a tárgy díszítés.
  { ...S, id: 'forma.melyiktargy', skill: 'forma.targyszin',
    targets: () => Object.keys(CL).map(c => ({ key: c, level: CL[c], c })),
    make: (t, r) => {
      const right = r.pick(SEEN.filter(o => o.c === t.c));
      const ok = o => o.c !== t.c && !NEAR[t.c].includes(o.c) && !(o.alt || []).includes(t.c) && !(o.has || []).includes(t.c);
      const a = r.pick(SEEN.filter(ok)), b = r.pick(SEEN.filter(o => ok(o) && o.c !== a.c));
      return { type: 'pick', prompt: `Melyik ${cname(t.c)}?`, ask: { c: t.c },
        options: r.shuffle([right, a, b].map(o => ({ key: o.n, t: o.e, name: o.n, ok: o === right, said: `Ez ${withArt(o.n)}. ${cap(withArt(o.n))} ${cname(o.c)}.` }))),
        fact: `${cap(withArt(right.n))} ${cname(t.c)}.`, hint: `A ${cname(t.c)} olyan, mint ${LIKE[t.c]}.` };
    },
    solve: item => item.options.find(o => SEEN.find(x => x.e === o.t).c === item.ask.c).name },

  // 7. Melyik a piros kör? (szín és forma együtt) Kulcs: a szín és a forma.
  { ...S, id: 'forma.szinforma', skill: 'forma.szinforma',
    targets: () => Object.keys(CL).flatMap(c => ['kor', 'negyzet', 'haromszog', 'teglalap', 'csillag', 'sziv', 'ovalis', 'rombusz'].map(s => ({ key: `${c}-${s}`, level: Math.max(CL[c], SL[s]) + 1, c, s }))),
    make: (t, r) => {
      const s2 = r.pick(['kor', 'negyzet', 'haromszog', 'teglalap', 'csillag', 'sziv', 'ovalis', 'rombusz'].filter(x => notConf(t.s, x) && SL[x] <= Math.max(SL[t.s], 2)));
      const c2 = r.pick(Object.keys(CL).filter(x => x !== t.c && !NEAR[t.c].includes(x) && CL[x] <= Math.max(CL[t.c], 2)));
      const nm = (c, s) => `${cname(c)} ${sname(s)}`, opt = (c, s, said) => ({ key: `${c}-${s}`, t: shape(s, c), name: nm(c, s), ok: c === t.c && s === t.s, hideName: true, said });
      return { type: 'pick', prompt: `Melyik ${withArt(nm(t.c, t.s))}?`, noList: true, ask: { c: t.c, s: t.s },
        options: r.shuffle([opt(t.c, t.s), opt(t.c, s2, `Ez is ${cname(t.c)}, de ez ${sname(s2)}.`), opt(c2, t.s, `Ez is ${sname(t.s)}, de ez ${cname(c2)}.`)]),
        fact: `${cap(cname(t.c))} a színe, és ${sname(t.s)} a formája.`, hint: `Keresd ${withArt(C_ACC[t.c])}, aztán nézd meg a formáját!` };
    },
    solve: item => item.options.find(o => dataOf(o.t, 's') === item.ask.s && dataOf(o.t, 'c') === item.ask.c).name },

  // 8. Hány kör van a képen? (formák keverve) Kulcs: a forma és a darabszám.
  { ...S, id: 'forma.hany', skill: 'forma.hany',
    targets: () => ['kor', 'negyzet', 'haromszog', 'csillag', 'sziv', 'teglalap'].flatMap(s => range(1, 6).map(n => ({ key: `${s}${n}`, level: (n <= 2 ? 2 : n <= 4 ? 3 : 4) + (SL[s] >= 2 ? 1 : 0), s, n }))),
    make: (t, r) => {
      const fill = r.sample(['kor', 'negyzet', 'haromszog', 'csillag', 'sziv', 'teglalap', 'otszog'].filter(x => notConf(t.s, x)), 2);
      const all = r.shuffle([...Array(t.n).fill(t.s), ...fill.flatMap(f => Array(r.int(1, 3)).fill(f))]);
      return { type: 'pick', prompt: `Hány ${sname(t.s)} van a képen?`, ask: { s: t.s },
        qHtml: `<span class="shapes">${all.map(s => shape(s, r.pick(BRIGHT), 64)).join('')}</span>`,
        options: r.shuffle([numCard(t.n, true), ...nearNums(t.n, r, 1, 6).map(n => numCard(n))]),
        fact: `${cap(attr(t.n))} ${sname(t.s)} van a képen.`, hint: `Keresd meg az összes ${SH_ACC[t.s]}, és számold meg őket!` };
    },
    solve: item => allData(item.qHtml, 's').filter(s => s === item.ask.s).length },

  // 9. Hány sarka van a háromszögnek? Kulcs: a forma.
  { ...S, id: 'forma.sarok', skill: 'forma.sarok',
    targets: () => [['haromszog', 3], ['negyzet', 3], ['teglalap', 4], ['rombusz', 4], ['kor', 4], ['otszog', 5], ['hatszog', 5]].map(([s, level]) => ({ key: s, level, s })),
    make: (t, r) => {
      const c = SHAPES[t.s].corners;
      return { type: 'pick', prompt: `Hány sarka van ${withArt(SH_DAT[t.s])}?`, qHtml: shape(t.s, r.pick(BRIGHT), 160),
        options: r.shuffle([numCard(c, true), ...nearNums(c, r, 0, 6).map(n => numCard(n))]),
        fact: c ? `${cap(withArt(SH_DAT[t.s]))} ${NUMS[c]} sarka van.` : 'A körnek nincs sarka, mert kerek.', hint: 'Mutass rá a sarkaira egyenként, és számold meg!' };
    },
    solve: item => SHAPES[dataOf(item.qHtml, 's')].corners },

  // 10. Melyiknek van három sarka? Kulcs: a sarkok száma (a négy sarkú forma bemutatásonként más).
  { ...S, id: 'forma.melyiksarok', skill: 'forma.sarok',
    targets: () => [[0, 4], [3, 3], [4, 4], [5, 5], [6, 5]].map(([c, level]) => ({ key: 'c' + c, level, c })),
    make: (t, r) => {
      const POOL = ['kor', 'haromszog', 'negyzet', 'teglalap', 'rombusz', 'otszog', 'hatszog'];
      const right = r.pick(POOL.filter(s => SHAPES[s].corners === t.c)), color = r.pick(BRIGHT);
      const others = r.sample(POOL.filter(s => SHAPES[s].corners !== t.c), 2);
      const tell = s => (SHAPES[s].corners ? `${NUMS[SHAPES[s].corners]} sarka van` : 'nincs sarka');
      return { type: 'pick', prompt: t.c ? `Melyiknek van ${NUMS[t.c]} sarka?` : 'Melyiknek nincs sarka?', noList: true, ask: { c: t.c },
        options: r.shuffle([right, ...others].map(s => shapeOpt(s, color, s === right, `Ez ${withArt(sname(s))}: ${tell(s)}.`))),
        fact: `Ez ${withArt(sname(right))}: ${tell(right)}.`, hint: 'Számold meg mindegyiknek a sarkait!' };
    },
    solve: item => item.options.find(o => SHAPES[dataOf(o.t, 's')].corners === item.ask.c).name },

  // 11. Mi van a labda fölött / alatt / balra / jobbra? (3×3-as jelenet) Kulcs: a viszony és a viszonyítási pont helye.
  { ...S, id: 'forma.ter', skill: 'forma.ter',
    targets: () => {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        if (r > 0) out.push({ key: `folott-${r}${c}`, level: c === 1 ? 1 : 2, rel: 'folott', a: { r, c }, x: { r: r - 1, c } });
        if (r < 2) out.push({ key: `alatt-${r}${c}`, level: c === 1 ? 1 : 2, rel: 'alatt', a: { r, c }, x: { r: r + 1, c } });
        if (c > 0) out.push({ key: `balra-${r}${c}`, level: r === 1 ? 4 : 5, rel: 'balra', a: { r, c }, x: { r, c: c - 1 } });
        if (c < 2) out.push({ key: `jobbra-${r}${c}`, level: r === 1 ? 4 : 5, rel: 'jobbra', a: { r, c }, x: { r, c: c + 1 } });
      }
      for (let i = 0; i < 3; i++) {
        out.push({ key: `kozott-s${i}`, level: 3, rel: 'kozott', a: { r: i, c: 0 }, b: { r: i, c: 2 }, x: { r: i, c: 1 } });
        out.push({ key: `kozott-o${i}`, level: 3, rel: 'kozott', a: { r: 0, c: i }, b: { r: 2, c: i }, x: { r: 1, c: i } });
      }
      return out;
    },
    make: (t, r) => {
      const objs = r.sample(GRID, 9), at = p => objs[p.r * 3 + p.c], A = at(t.a), X = at(t.x), B = t.b && at(t.b);
      const cells = range(0, 8).map(i => ({ r: Math.floor(i / 3), c: i % 3 }));
      const same = (p, q) => p && q && p.r === q.r && p.c === q.c;
      // eltérítő: soha nem olyan, ami tágabb értelemben is igaz lehetne (pl. két sorral feljebb is "fölött" van)
      const fine = p => !same(p, t.a) && !same(p, t.b) && !same(p, t.x) && ({ folott: p.r >= t.a.r, alatt: p.r <= t.a.r, balra: p.c >= t.a.c, jobbra: p.c <= t.a.c, kozott: true })[t.rel];
      const opp = { folott: { r: t.a.r + 1, c: t.a.c }, alatt: { r: t.a.r - 1, c: t.a.c }, balra: { r: t.a.r, c: t.a.c + 1 }, jobbra: { r: t.a.r, c: t.a.c - 1 } }[t.rel];
      const cand = r.shuffle(cells.filter(fine)).sort((p, q) => (same(q, opp) ? 1 : 0) - (same(p, opp) ? 1 : 0)).slice(0, 2);
      const opt = p => { const o = at(p), w = where(p, t.a, A); return { key: o.n, t: o.e, name: o.n, ok: o === X, said: w ? `Ez ${withArt(o.n)}. ${cap(withArt(o.n))} ${w} van.` : `Ez ${withArt(o.n)}.` }; };
      const Q = { folott: `Mi van ${withArt(A.n)} fölött?`, alatt: `Mi van ${withArt(A.n)} alatt?`, balra: `Mi van ${withArt(A.abl)} balra?`, jobbra: `Mi van ${withArt(A.abl)} jobbra?`, kozott: B && `Mi van ${withArt(A.n)} és ${withArt(B.n)} között?` }[t.rel];
      const F = { folott: `${cap(withArt(A.n))} fölött ${withArt(X.n)} van.`, alatt: `${cap(withArt(A.n))} alatt ${withArt(X.n)} van.`, balra: `${cap(withArt(A.abl))} balra ${withArt(X.n)} van.`, jobbra: `${cap(withArt(A.abl))} jobbra ${withArt(X.n)} van.`, kozott: B && `${cap(withArt(A.n))} és ${withArt(B.n)} között ${withArt(X.n)} van.` }[t.rel];
      const H = { folott: `Keresd meg ${withArt(A.acc)}, és nézz fölé!`, alatt: `Keresd meg ${withArt(A.acc)}, és nézz alá!`, balra: `${LEFT} Keresd meg ${withArt(A.acc)}, és nézz balra!`, jobbra: `${RIGHT} Keresd meg ${withArt(A.acc)}, és nézz jobbra!`, kozott: B && `Keresd meg ${withArt(A.acc)} és ${withArt(B.acc)}! Mi van a kettő között?` }[t.rel];
      return { type: 'pick', prompt: Q, qHtml: `<span class="scene">${objs.map(o => `<span>${o.e}</span>`).join('')}</span>`,
        ask: { rel: t.rel, a: A.e, b: B ? B.e : null }, options: r.shuffle([opt(t.x), ...cand.map(opt)]), fact: F, hint: H };
    },
    solve: item => {
      const g = sceneOf(item), i = g.indexOf(item.ask.a), pr = Math.floor(i / 3), pc = i % 3;
      let x;
      if (item.ask.rel === 'kozott') { const j = g.indexOf(item.ask.b); x = g[((pr + Math.floor(j / 3)) / 2) * 3 + (pc + j % 3) / 2]; }
      else { const [dr, dc] = { folott: [-1, 0], alatt: [1, 0], balra: [0, -1], jobbra: [0, 1] }[item.ask.rel]; x = g[(pr + dr) * 3 + pc + dc]; }
      return item.options.find(o => o.t === x).name;
    } },

  // 12. Torony: melyik kocka van legfelül / legalul / középen / alulról a második helyen? Kulcs: a torony magassága és a hely.
  { ...S, id: 'forma.torony', skill: 'forma.torony',
    targets: () => [[3, [1, 2, 1]], [4, [2, 4, 4, 2]], [5, [2, 5, 3, 5, 2]]].flatMap(([h, lv]) => range(1, h).map(p => ({ key: `h${h}p${p}`, level: lv[p - 1], h, p }))),
    make: (t, r) => {
      const cols = r.sample(TOWER, t.h), right = cols[t.p - 1], pl = place(t.p, t.h);     // cols[0] = legalul
      const near = [t.p, t.p - 2, t.p + 1, t.p - 3].filter(i => i >= 0 && i < t.h && i !== t.p - 1).slice(0, 2);
      const opt = i => ({ key: cols[i], t: shape('negyzet', cols[i], 90), name: cname(cols[i]), ok: i === t.p - 1, hideName: true, said: `Ez ${withArt(cname(cols[i]) + ' kocka')}: ${place(i + 1, t.h).said}.` });
      return { type: 'pick', prompt: `Melyik kocka van ${pl.q}?`, ask: { p: t.p },
        qHtml: `<span class="tower">${[...cols].reverse().map(c => shape('negyzet', c, 64)).join('')}</span>`,
        options: r.shuffle([opt(t.p - 1), ...near.map(opt)]),
        fact: `${cap(withArt(cname(right) + ' kocka'))} van ${pl.q}.`, hint: pl.hint };
    },
    solve: item => cname(allData(item.qHtml, 'c').reverse()[item.ask.p - 1]) },

  // 13. Melyik a leghosszabb / a legrövidebb / a középső? Kulcs: a méret fajtája és a kérdés.
  { ...S, id: 'forma.meret', skill: 'forma.meret',
    targets: () => Object.entries(MERET).flatMap(([k, m]) => [['max', m.lv[0]], ['min', m.lv[0]], ['kozep', m.lv[1]]].map(([q, level]) => ({ key: `${k}-${q}`, level, k, q }))),
    make: (t, r) => {
      const m = MERET[t.k], want = { max: 2, min: 0, kozep: 1 }[t.q], e = r.pick(SIZE_EMOJI), color = r.pick(BAR_COLORS);
      const pic = rank => (t.k === 'nagy' ? `<span class="sz" style="font-size:${[0.42, 0.68, 1][rank]}em">${e}</span>` : measure(t.k, rank, color));
      const said = rank => (rank === 2 ? `Ez ${withArt(m.max)}.` : rank === 0 ? `Ez ${withArt(m.min)}.` : 'Ez a középső.');
      return { type: 'pick', prompt: t.q === 'kozep' ? `Melyik nem ${withArt(m.max)}, és nem is ${withArt(m.min)}?` : `Melyik ${withArt(m[t.q])}?`, ask: { k: t.k, q: t.q },
        options: r.shuffle([0, 1, 2].map(rank => ({ key: `${t.k}-r${rank}`, t: pic(rank), ok: rank === want, said: said(rank) }))),
        fact: t.q === 'kozep' ? `Ez a középső: ${m.more}, mint az egyik, és ${m.less}, mint a másik.` : `Ez ${withArt(m[t.q])}: ${t.q === 'max' ? m.more : m.less}, mint a másik kettő.`,
        hint: t.q === 'kozep' ? `Keresd meg ${withArt(m.acc[0])} és ${withArt(m.acc[1])}! Melyik maradt?` : 'Nézd meg mindhármat, és hasonlítsd össze őket!' };
    },
    solve: item => {
      const sized = item.options.map(o => [sizeOf(o.t, item.ask.k), o]).sort((a, b) => a[0] - b[0]);
      return sized[{ max: 2, min: 0, kozep: 1 }[item.ask.q]][1].key;
    } },

  // 14. Melyik nyíl mutat felfelé? Kulcs: az irány.
  { ...S, id: 'forma.irany', skill: 'forma.irany',
    targets: () => Object.entries(DIRS).map(([d, x]) => ({ key: d, level: x.lv, d })),
    make: (t, r) => {
      const x = DIRS[t.d], third = r.pick(Object.keys(DIRS).filter(d => d !== t.d && d !== x.opp));
      return { type: 'pick', prompt: `Melyik nyíl mutat ${x.w}?`, noList: true, ask: { d: t.d },
        options: r.shuffle([t.d, x.opp, third].map(d => ({ key: d, t: arrow(d), name: DIRS[d].w, ok: d === t.d, hideName: true, said: `Ez ${DIRS[d].w} mutat.` }))),
        fact: `Ez a nyíl ${x.w} mutat.`, hint: x.hint };
    },
    solve: item => item.options.find(o => dataOf(o.t, 'd') === item.ask.d).name },

  // 15. Melyik a csillag árnyéka? (formák) Kulcs: a forma. A felsőbb szinten a hasonló forma is ott van.
  { ...S, id: 'forma.arnyek', skill: 'forma.arnyek',
    targets: () => Object.keys(SL).map(s => ({ key: s, level: Math.min(5, SL[s] + 1), s })),
    make: (t, r) => {
      const conf = SL[t.s] >= 3 ? (CONF[t.s] || []).slice(0, 1) : [];
      const rest = r.sample(Object.keys(SL).filter(x => x !== t.s && !conf.includes(x) && notConf(t.s, x)), 2 - conf.length);
      return { type: 'pick', prompt: `Melyik ${withArt(sname(t.s))} árnyéka?`, noList: true, qHtml: shape(t.s, r.pick(BRIGHT), 150), ask: {},
        options: r.shuffle([t.s, ...conf, ...rest].map(s => ({ key: 'a-' + s, t: shadow(s, 110), name: sname(s), ok: s === t.s, hideName: true, said: `Ez ${withArt(sname(s))} árnyéka.` }))),
        fact: `Ez ${withArt(sname(t.s))} árnyéka: ugyanolyan a formája.`, hint: 'Nézd meg a formáját! Melyik árnyék ugyanolyan?' };
    },
    solve: item => item.options.find(o => dataOf(o.t, 's') === dataOf(item.qHtml, 's')).name },

  // 16. Kié ez az árnyék? (állatok, tárgyak) Kulcs: a kép. Az állatokat más állatok árnyéka közül kell kiválasztani.
  { ...S, id: 'forma.arnyekkep', skill: 'forma.arnyek',
    targets: () => SIL.map(o => ({ key: o.n, level: o.g === 'allat' ? 3 : 2, o })),
    make: (t, r) => {
      const others = r.sample(SIL.filter(x => x !== t.o && (t.o.g === 'allat' ? x.g === 'allat' : x.g !== t.o.g)), 2);
      return { type: 'pick', prompt: `Melyik ${withArt(t.o.n)} árnyéka?`, noList: true, qHtml: `<span class="silsrc">${t.o.e}</span>`, ask: {},
        options: r.shuffle([t.o, ...others].map(o => ({ key: o.n, t: `<span class="sil">${o.e}</span>`, name: o.n, ok: o === t.o, hideName: true, said: `Ez ${withArt(o.n)} árnyéka.` }))),
        fact: `Ez ${withArt(t.o.n)} árnyéka: ugyanolyan a formája.`, hint: 'Nézd meg a körvonalát! Melyik árnyék ugyanolyan?' };
    },
    solve: item => { const e = /<span class="silsrc">([^<]+)</.exec(item.qHtml)[1]; return item.options.find(o => o.t.includes(`>${e}<`)).name; } },
];
