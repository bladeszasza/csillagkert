// Okoskodó: generált sablonok (gondolkodás: sorminta, osztályozás, ellentétek, párosítás, analógia, emlékezet).
// Kulcs-szabály: a kulcs a választ meghatározó szerkezet (minta-típus és a hiányzó hely, kategória-pár, a kérdezett tárgy);
// a konkrét képek és a sorrend díszítés, nem új feladat.
// Minden képnek egy neve van; a kategóriák diszjunktak, a félreérthető párokat (növény – gyümölcs) kihagyjuk.
import { cap, group } from './common.js';
import { COLORS, shape } from './pics.js';
import { withArt } from '../hu.js';

const S = { station: 'okos', icon: '🧩' };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const it = ([e, n]) => ({ e, n });

// --- kategóriák: egyes szám (a "jármű"), többes szám (a csoport neve), ismerősség (1 = a legismertebb)
export const CATS = {
  gyumolcs: { one: 'gyümölcs', pl: 'gyümölcsök', fam: 1, items: [['🍎', 'alma'], ['🍐', 'körte'], ['🍌', 'banán'], ['🍓', 'eper'], ['🍒', 'cseresznye'], ['🍊', 'narancs'], ['🍋', 'citrom'], ['🍇', 'szőlő'], ['🍉', 'dinnye'], ['🍑', 'barack']].map(it) },
  haziallat: { one: 'háziállat', pl: 'háziállatok', fam: 1, items: [['🐶', 'kutya'], ['🐱', 'cica'], ['🐷', 'malac'], ['🐮', 'tehén'], ['🐔', 'tyúk'], ['🐴', 'ló'], ['🐑', 'bárány'], ['🐐', 'kecske']].map(it) },
  jarmu: { one: 'jármű', pl: 'járművek', fam: 1, items: [['🚗', 'autó'], ['🚌', 'busz'], ['🚲', 'bicikli'], ['✈️', 'repülő'], ['🚂', 'vonat'], ['🚢', 'hajó'], ['🚁', 'helikopter'], ['🚜', 'traktor']].map(it) },
  ruha: { one: 'ruhadarab', pl: 'ruhák', fam: 2, items: [['👕', 'póló'], ['👖', 'nadrág'], ['🧦', 'zokni'], ['🧤', 'kesztyű'], ['🧣', 'sál'], ['🧢', 'sapka'], ['🧥', 'kabát'], ['👚', 'blúz']].map(it) },
  jatek: { one: 'játék', pl: 'játékok', fam: 2, items: [['⚽', 'labda'], ['🧸', 'maci'], ['🪁', 'sárkány'], ['🎈', 'lufi'], ['🪀', 'jojó'], ['🎲', 'dobókocka']].map(it) },
  zoldseg: { one: 'zöldség', pl: 'zöldségek', fam: 2, items: [['🥕', 'répa'], ['🥦', 'brokkoli'], ['🥒', 'uborka'], ['🌽', 'kukorica'], ['🍆', 'padlizsán'], ['🥔', 'krumpli'], ['🧅', 'hagyma'], ['🫑', 'paprika']].map(it) },
  vadallat: { one: 'vadállat', pl: 'vadállatok', fam: 2, items: [['🦁', 'oroszlán'], ['🐘', 'elefánt'], ['🦒', 'zsiráf'], ['🐯', 'tigris'], ['🦓', 'zebra'], ['🐵', 'majom'], ['🦛', 'víziló'], ['🐊', 'krokodil']].map(it) },
  hangszer: { one: 'hangszer', pl: 'hangszerek', fam: 3, items: [['🥁', 'dob'], ['🎸', 'gitár'], ['🎺', 'trombita'], ['🎻', 'hegedű'], ['🎹', 'zongora'], ['🪗', 'harmonika'], ['🎷', 'szaxofon']].map(it) },
  konyha: { one: 'konyhai eszköz', pl: 'konyhai eszközök', fam: 3, items: [['🥄', 'kanál'], ['🍳', 'serpenyő'], ['🫖', 'teáskanna'], ['☕', 'bögre'], ['🥣', 'tál'], ['🧂', 'sószóró'], ['🍽️', 'tányér']].map(it) },
  szerszam: { one: 'szerszám', pl: 'szerszámok', fam: 3, items: [['🔨', 'kalapács'], ['🪚', 'fűrész'], ['🔧', 'csavarkulcs'], ['🪛', 'csavarhúzó'], ['🪓', 'fejsze'], ['⛏️', 'csákány']].map(it) },
  noveny: { one: 'növény', pl: 'növények', fam: 3, items: [['🌷', 'tulipán'], ['🌻', 'napraforgó'], ['🌹', 'rózsa'], ['🌵', 'kaktusz'], ['🌲', 'fenyőfa'], ['🌳', 'fa'], ['🌼', 'százszorszép']].map(it) },
  rovar: { one: 'rovar', pl: 'rovarok', fam: 3, items: [['🐞', 'katica'], ['🦋', 'pillangó'], ['🐜', 'hangya'], ['🦗', 'tücsök'], ['🪲', 'bogár'], ['🐛', 'hernyó']].map(it) },
};
const CAT_KEYS = Object.keys(CATS);
const pairKey = (a, b) => [a, b].sort().join('|');
// hasonló kategóriák (nehezebb megkülönböztetni) és a kihagyott, félreérthető párok
const NEAR = new Map([['gyumolcs|zoldseg', 5], ['haziallat|vadallat', 5], ['hangszer|jatek', 4], ['konyha|szerszam', 4], ['haziallat|rovar', 4], ['rovar|vadallat', 4]]);
const SKIP = new Set(['gyumolcs|noveny', 'noveny|zoldseg']);
const catOf = e => CAT_KEYS.find(k => CATS[k].items.some(x => x.e === e));
const nameOf = e => CATS[catOf(e)].items.find(x => x.e === e).n;

// --- sorminták: a minta betűi (0 = A, 1 = B, ...), szint
const PATTERNS = { AB: [[0, 1], 1], ABC: [[0, 1, 2], 2], AAB: [[0, 0, 1], 2], ABB: [[0, 1, 1], 3], AABB: [[0, 0, 1, 1], 3], ABCD: [[0, 1, 2, 3], 4], ABAC: [[0, 1, 0, 2], 4], ABCB: [[0, 1, 2, 1], 5] };
const PAT_PICS = [['🍎', 'alma'], ['🍐', 'körte'], ['🍌', 'banán'], ['🍓', 'eper'], ['⭐', 'csillag'], ['🌸', 'virág'], ['⚽', 'labda'], ['🎈', 'lufi'], ['🐟', 'hal'], ['🍄', 'gomba'], ['🚗', 'autó'], ['🦋', 'pillangó']].map(it);
const PAT_COLORS = ['piros', 'kek', 'sarga', 'zold', 'barna', 'feher'];     // egymással nem összetéveszthető színek
// egy elem a sorban: kép (emoji) vagy színes kör; az azonosító az, amit a gyerek lát
const elem = (dim, x) => (dim === 'kep' ? { id: x.e, face: x.e, name: x.n, said: `Ez ${withArt(x.n)}.` } : { id: x, face: shape('kor', x, 60), name: COLORS[x].name, said: `Ez ${COLORS[x].name}.`, big: shape('kor', x, 90) });
const seqTokens = html => [...String(html).matchAll(/<i>(.*?)<\/i>|<b class="next">\?<\/b>/g)].map(m => (m[1] === undefined ? null : (/data-c="(\w+)"/.exec(m[1]) || [])[1] || m[1]));

// --- ellentétek: két pólus; props: amit a kép még jelenthet (az ilyen kép nem lehet eltérítő arra a szóra)
const OPP = [
  // (bőkezűen: ami egy gyereknek akár csak összehasonlításban is igaz lehet – a citrom a sziklához képest könnyű –, az is ide kerül)
  [{ k: 'meleg', e: '🔥', n: 'tűz', adj: 'meleg', s: 'A tűz meleg.', props: ['világos', 'gyors'] }, { k: 'hideg', e: '❄️', n: 'hópehely', adj: 'hideg', s: 'A hópehely hideg.', props: ['kicsi', 'könnyű', 'puha', 'világos'] }, 2],
  [{ k: 'nagy', e: '🐘', n: 'elefánt', adj: 'nagy', s: 'Az elefánt nagy.', props: ['nehéz', 'lassú', 'kemény', 'sok'] }, { k: 'kicsi', e: '🐭', n: 'egér', adj: 'kicsi', s: 'Az egér kicsi.', props: ['könnyű', 'gyors', 'puha', 'fiatal'] }, 2],
  [{ k: 'gyors', e: '🚀', n: 'rakéta', adj: 'gyors', s: 'A rakéta gyors.', props: ['nagy', 'nehéz', 'meleg', 'kemény', 'világos'] }, { k: 'lassu', e: '🐌', n: 'csiga', adj: 'lassú', s: 'A csiga lassú.', props: ['kicsi', 'puha', 'könnyű', 'kemény', 'fiatal'] }, 2],
  [{ k: 'vidam', e: '😀', n: 'vidám arc', adj: 'vidám', s: 'Ez az arc vidám.', props: ['édes', 'világos'] }, { k: 'szomoru', e: '😢', n: 'szomorú arc', adj: 'szomorú', s: 'Ez az arc szomorú.', props: ['savanyú', 'sötét'] }, 2],
  [{ k: 'sok', t: group('🍎', 8), n: 'sok alma', adj: 'sok', s: 'Itt sok alma van.', q: 'Melyik képen van sok?', props: ['nagy', 'nehéz', 'édes', 'savanyú'] }, { k: 'keves', t: group('🍎', 2), n: 'kevés alma', adj: 'kevés', s: 'Itt kevés alma van.', q: 'Melyik képen van kevés?', props: ['kicsi', 'könnyű', 'édes', 'savanyú'] }, 2],
  [{ k: 'nehez', e: '🪨', n: 'szikla', adj: 'nehéz', s: 'A szikla nehéz.', props: ['kemény', 'nagy', 'hideg', 'idős', 'lassú'] }, { k: 'konnyu', e: '🪶', n: 'toll', adj: 'könnyű', s: 'A toll könnyű.', props: ['puha', 'kicsi', 'gyors'] }, 3],
  [{ k: 'nyitott', e: '📖', n: 'nyitott könyv', adj: 'nyitott', s: 'Ez a könyv nyitott.', props: ['könnyű', 'kicsi', 'világos'] }, { k: 'csukott', e: '📕', n: 'csukott könyv', adj: 'csukott', s: 'Ez a könyv csukott.', props: ['könnyű', 'kicsi', 'kemény'] }, 3],
  [{ k: 'edes', e: '🍯', n: 'méz', adj: 'édes', s: 'A méz édes.', props: ['puha', 'kicsi', 'lassú', 'világos'] }, { k: 'savanyu', e: '🍋', n: 'citrom', adj: 'savanyú', s: 'A citrom savanyú.', props: ['kicsi', 'könnyű', 'világos', 'kemény'] }, 3],
  [{ k: 'vilagos', e: '☀️', n: 'napsütés', adj: 'világos', s: 'Nappal világos van.', props: ['meleg', 'nagy', 'vidám'] }, { k: 'sotet', e: '🌃', n: 'éjszaka', adj: 'sötét', s: 'Éjszaka sötét van.', props: ['hideg', 'nagy', 'csukott'] }, 4],
  [{ k: 'idos', e: '👴', n: 'nagypapa', adj: 'idős', s: 'A nagypapa idős.', props: ['lassú', 'nagy', 'vidám', 'nehéz'] }, { k: 'fiatal', e: '👶', n: 'baba', adj: 'fiatal', s: 'A baba fiatal.', props: ['kicsi', 'puha', 'könnyű', 'vidám', 'édes', 'lassú'] }, 4],
  [{ k: 'kemeny', e: '🧱', n: 'tégla', adj: 'kemény', s: 'A tégla kemény.', props: ['nehéz', 'hideg', 'kicsi'] }, { k: 'puha', e: '🧸', n: 'maci', adj: 'puha', s: 'A maci puha.', props: ['könnyű', 'kicsi', 'vidám', 'édes', 'meleg'] }, 4],
];
const POLES = OPP.flatMap(([a, b]) => [a, b]);
const poleFace = p => p.t || p.e;
const has = (p, adj) => p.adj === adj || p.props.includes(adj);

// --- párok: mi illik össze; allat: -hoz/-hez/-höz alak; avoid: amivel félreérthető lenne
const PAIRS = [
  [{ e: '🔑', n: 'kulcs', all: 'kulcshoz' }, { e: '🔒', n: 'lakat', all: 'lakathoz' }, 'A kulccsal nyitjuk ki a lakatot.', 1, ['kapu']],
  [{ e: '🧦', n: 'zokni', all: 'zoknihoz' }, { e: '👟', n: 'cipő', all: 'cipőhöz' }, 'Előbb zoknit húzunk, aztán cipőt.', 1, []],
  [{ e: '🪥', n: 'fogkefe', all: 'fogkeféhez' }, { e: '🦷', n: 'fog', all: 'foghoz' }, 'A fogkefével fogat mosunk.', 1, []],
  [{ e: '🥄', n: 'kanál', all: 'kanálhoz' }, { e: '🥣', n: 'tál', all: 'tálhoz' }, 'A tálból kanállal eszünk.', 1, ['tej', 'keksz', 'torta']],
  [{ e: '🐶', n: 'kutya', all: 'kutyához' }, { e: '🦴', n: 'csont', all: 'csonthoz' }, 'A kutya szereti rágni a csontot.', 1, ['labda']],
  [{ e: '☂️', n: 'esernyő', all: 'esernyőhöz' }, { e: '🌧️', n: 'eső', all: 'esőhöz' }, 'Esőben esernyőt viszünk.', 1, []],
  [{ e: '🥛', n: 'tej', all: 'tejhez' }, { e: '🍪', n: 'keksz', all: 'kekszhez' }, 'A keksz mellé jólesik a tej.', 2, ['kanál', 'tál', 'torta']],
  [{ e: '⚽', n: 'labda', all: 'labdához' }, { e: '🥅', n: 'kapu', all: 'kapuhoz' }, 'A labdát a kapuba rúgjuk.', 2, ['kutya', 'kulcs', 'lakat']],
  [{ e: '✏️', n: 'ceruza', all: 'ceruzához' }, { e: '📓', n: 'füzet', all: 'füzethez' }, 'A ceruzával a füzetbe rajzolunk.', 2, ['papír', 'ecset', 'festék', 'levél', 'olló']],
  [{ e: '🎂', n: 'torta', all: 'tortához' }, { e: '🕯️', n: 'gyertya', all: 'gyertyához' }, 'A születésnapi tortára gyertyát teszünk.', 2, ['tűz', 'tűzoltóautó', 'kanál', 'tál', 'tej', 'keksz']],
  [{ e: '🚂', n: 'vonat', all: 'vonathoz' }, { e: '🛤️', n: 'sín', all: 'sínhez' }, 'A vonat a sínen jár.', 2, []],
  [{ e: '🐝', n: 'méh', all: 'méhhez' }, { e: '🌸', n: 'virág', all: 'virághoz' }, 'A méh a virágról gyűjti a nektárt.', 2, ['eső', 'esernyő', 'ecset', 'festék']],
  [{ e: '🖌️', n: 'ecset', all: 'ecsethez' }, { e: '🎨', n: 'festék', all: 'festékhez' }, 'Az ecsettel festünk.', 3, ['papír', 'ceruza', 'füzet']],
  [{ e: '✂️', n: 'olló', all: 'ollóhoz' }, { e: '📄', n: 'papír', all: 'papírhoz' }, 'Az ollóval papírt vágunk.', 3, ['ceruza', 'füzet', 'ecset', 'festék', 'levél']],
  [{ e: '✉️', n: 'levél', all: 'levélhez' }, { e: '📮', n: 'postaláda', all: 'postaládához' }, 'A levelet a postaládába tesszük.', 3, ['papír', 'ceruza', 'füzet', 'olló']],
  [{ e: '🚒', n: 'tűzoltóautó', all: 'tűzoltóautóhoz' }, { e: '🔥', n: 'tűz', all: 'tűzhöz' }, 'A tűzoltók eloltják a tüzet.', 3, ['gyertya', 'torta']],
];
const PAIR_ITEMS = PAIRS.flatMap(([a, b, why, lv, avoid]) => [{ ...a, mate: b, why, avoid }, { ...b, mate: a, why, avoid }]);

// --- analógiák: ugyanaz a viszony két párban; a mondat a viszonyt kimondja, a gyerek a második párt egészíti ki
const ANALOG = {
  ad: { lv: 4, items: [[{ e: '🐔', n: 'tyúk' }, { e: '🥚', n: 'tojás', acc: 'tojást' }], [{ e: '🐮', n: 'tehén' }, { e: '🥛', n: 'tej', acc: 'tejet' }], [{ e: '🐝', n: 'méh' }, { e: '🍯', n: 'méz', acc: 'mézet' }], [{ e: '🐑', n: 'bárány' }, { e: '🧶', n: 'gyapjú', acc: 'gyapjút' }]],
    model: (a, b) => `${cap(withArt(a.n))} ${b.acc} ad.`, ask: c => `Mit ad ${withArt(c.n)}?`, tell: (c, d) => `${cap(withArt(c.n))} ${d.acc} ad.` },
  lakik: { lv: 5, items: [[{ e: '🐟', n: 'hal' }, { e: '🌊', n: 'tenger', loc: 'a tengerben' }], [{ e: '🐪', n: 'teve' }, { e: '🏜️', n: 'sivatag', loc: 'a sivatagban' }], [{ e: '🐧', n: 'pingvin' }, { e: '🧊', n: 'jég', loc: 'a jégen' }], [{ e: '🐿️', n: 'mókus' }, { e: '🌲🌳', n: 'erdő', loc: 'az erdőben' }]],
    model: (a, b) => `${cap(withArt(a.n))} ${b.loc} él.`, ask: c => `Hol él ${withArt(c.n)}?`, tell: (c, d) => `${cap(withArt(c.n))} ${d.loc} él.` },
  kell: { lv: 4, items: [[{ e: '🌧️', n: 'eső', when: 'Esőben' }, { e: '☂️', n: 'esernyő' }], [{ e: '☀️', n: 'napsütés', when: 'Napsütésben' }, { e: '🕶️', n: 'napszemüveg' }], [{ e: '🌨️', n: 'hóesés', when: 'Hóesésben' }, { e: '🧣', n: 'sál' }]],
    model: (a, b) => `${a.when} ${b.n} kell.`, ask: c => `Mi kell ${c.when.toLowerCase()}?`, tell: (c, d) => `${c.when} ${d.n} kell.` },
};

// --- memória és "Mi tűnt el?": jól megnevezhető képek
const MEMO_DECKS = { gyumolcs: 1, haziallat: 1, jarmu: 1, jatek: 2, ruha: 2, hangszer: 3 };

export const OKOS = [
  // 1. Sorminta: mi jön ezután, vagy mi hiányzik? Kulcs: a minta típusa, a kérdőjel helye és hogy képek vagy színek.
  { ...S, id: 'okos.sorminta', skill: 'okos.sorminta',
    targets: () => Object.entries(PATTERNS).flatMap(([name, [p, level]]) => ['kep', 'szin'].flatMap(dim => {
      const k = p.length, L = 2 * k + 2;
      return range(k, L - 1).map(q => ({ key: `${name}-${dim}-${q}`, level, p, dim, q, L }));
    })),
    make: (t, r) => {
      const n = Math.max(...t.p) + 1;
      const pool = t.dim === 'kep' ? r.sample(PAT_PICS, n + 1) : r.sample(PAT_COLORS, n + 1);
      const els = pool.map(x => elem(t.dim, x)), seq = range(0, t.L - 1).map(i => els[t.p[i % t.p.length]]), right = seq[t.q];
      const inPattern = els.slice(0, n).filter(x => x !== right), outside = els[n];
      const wrongs = [...r.shuffle(inPattern), outside].slice(0, 2);
      const last = t.q === t.L - 1;
      return { type: 'pick', prompt: last ? 'Mi jön ezután?' : 'Mi hiányzik a sorból?', ask: {},
        qHtml: `<span class="seq${t.L > 8 ? ' long' : ''}">${seq.map((x, i) => (i === t.q ? '<b class="next">?</b>' : `<i>${x.face}</i>`)).join('')}</span>`,
        options: r.shuffle([right, ...wrongs].map(x => ({ key: x.id, t: x.big || x.face, name: x.name, ok: x === right, said: x.said }))),
        fact: `A minta: ${t.p.map(i => els[i].name).join(', ')}, és újra elölről.`, hint: 'Mondd ki hangosan a sort, és figyeld, mi ismétlődik!' };
    },
    solve: item => {
      const s = seqTokens(item.qHtml), q = s.indexOf(null);
      for (let per = 1; per < s.length; per++) {
        let fits = true;
        for (let i = 0; i < s.length && fits; i++) for (let j = i + per; j < s.length; j += per) if (s[i] !== null && s[j] !== null && s[i] !== s[j]) { fits = false; break; }
        if (!fits) continue;
        const x = s.find((v, i) => v !== null && i % per === q % per);
        return item.options.find(o => o.key === x).name;
      }
      return null;
    } },

  // 2. Kakukktojás: melyik nem illik közéjük? Kulcs: a három egyforma kategóriája és a kakukktojás kategóriája.
  { ...S, id: 'okos.kakukk', skill: 'okos.kakukk',
    targets: () => CAT_KEYS.flatMap(b => CAT_KEYS.filter(o => o !== b && !SKIP.has(pairKey(b, o))).map(o => ({ key: `${b}-${o}`, level: NEAR.get(pairKey(b, o)) || Math.max(CATS[b].fam, CATS[o].fam), b, o }))),
    make: (t, r) => {
      const base = r.sample(CATS[t.b].items, 3), odd = r.pick(CATS[t.o].items);
      const opt = (x, cat, ok) => ({ key: x.n, t: x.e, name: x.n, ok, said: `Ez ${withArt(x.n)}. ${cap(withArt(x.n))} ${CATS[cat].one}.` });
      return { type: 'pick', prompt: 'Melyik nem illik közéjük?', ask: {},
        options: r.shuffle([...base.map(x => opt(x, t.b, false)), opt(odd, t.o, true)]),
        fact: `${cap(withArt(odd.n))} ${CATS[t.o].one}, a többi ${CATS[t.b].one}.`, hint: `Három ${CATS[t.b].one} van itt. Melyik nem ${CATS[t.b].one}?` };
    },
    // a gyerek tudása: melyik kép milyen fajta (a szóbank); az a kakukktojás, amelyiknek a fajtája egyedül van
    solve: item => { const cats = item.options.map(o => catOf(o.t)); return item.options.find((o, i) => cats.filter(c => c === cats[i]).length === 1).name; } },

  // 3. Csoportosítás: melyik csoportba illik a körte? Kulcs: a tárgy.
  { ...S, id: 'okos.csoport', skill: 'okos.csoport',
    targets: () => CAT_KEYS.flatMap(c => CATS[c].items.map(x => ({ key: x.n, level: CATS[c].fam, c, x }))),
    make: (t, r) => {
      const others = r.sample(CAT_KEYS.filter(k => k !== t.c && !NEAR.has(pairKey(k, t.c)) && !SKIP.has(pairKey(k, t.c)) && CATS[k].fam <= Math.max(2, CATS[t.c].fam)), 2);
      const grp = (k, ok) => ({ key: k, t: `<span class="trio">${r.sample(CATS[k].items.filter(x => x !== t.x), 3).map(x => x.e).join('')}</span>`, name: CATS[k].pl, ok, said: `Ezek ${CATS[k].pl}.` });
      return { type: 'pick', prompt: `Melyik csoportba illik ${withArt(t.x.n)}?`, qHtml: `<span class="big1">${t.x.e}</span>`, ask: { e: t.x.e },
        options: r.shuffle([grp(t.c, true), ...others.map(k => grp(k, false))]),
        fact: `${cap(withArt(t.x.n))} ${CATS[t.c].one}, a többi ${CATS[t.c].one} közé illik.`, hint: `Mi ${withArt(t.x.n)}? Melyik csoportban van hasonló?` };
    },
    solve: item => { const c = catOf(item.ask.e); return item.options.find(o => [...o.t.matchAll(/\p{Extended_Pictographic}️?/gu)].every(m => catOf(m[0]) === c)).name; } },

  // 4. Ellentétek: a tűz meleg. Melyik hideg? Kulcs: a pár és az irány.
  { ...S, id: 'okos.ellentet', skill: 'okos.ellentet',
    targets: () => OPP.flatMap(([a, b, level]) => [[a, b], [b, a]].map(([A, B]) => ({ key: `${A.k}-${B.k}`, level, A, B }))),
    make: (t, r) => {
      const { A, B } = t, wrongs = r.sample(POLES.filter(p => p !== A && p !== B && !has(p, B.adj) && !has(p, A.adj)), 2);
      // a válaszok neve ("vidám arc", "csukott könyv") elárulná a megoldást: nem soroljuk fel és nem írjuk ki
      return { type: 'pick', prompt: `${A.s} ${B.q || `Melyik ${B.adj}?`}`, qHtml: `<span class="big1">${poleFace(A)}</span>`, ask: { adj: B.adj }, noList: true,
        options: r.shuffle([B, ...wrongs].map(p => ({ key: p.k, t: poleFace(p), name: p.n, cls: p.t ? 'grp' : '', ok: p === B, hideName: true, said: p.s }))),
        fact: `${B.s} ${cap(withArt(A.adj))} ellentéte ${withArt(B.adj)}.`, hint: `${cap(withArt(A.adj))} ellentéte ${withArt(B.adj)}. ${B.q || `Melyik ${B.adj}?`}` };
    },
    solve: item => item.options.find(o => has(POLES.find(p => p.k === o.key), item.ask.adj)).name },

  // 5. Párosítás: mi illik a kulcshoz? Kulcs: a megmutatott tárgy.
  { ...S, id: 'okos.par', skill: 'okos.parositas',
    targets: () => PAIRS.flatMap(([a, b, why, level]) => [a, b].map(x => ({ key: x.n, level, x: PAIR_ITEMS.find(p => p.n === x.n) }))),
    make: (t, r) => {
      const x = t.x, bad = new Set([x.n, x.mate.n, ...x.avoid]);
      const wrongs = r.sample(PAIR_ITEMS.filter(p => !bad.has(p.n) && !p.avoid.includes(x.n) && !p.avoid.includes(x.mate.n)), 2);
      return { type: 'pick', prompt: `Mi illik ${withArt(x.all)}?`, qHtml: `<span class="big1">${x.e}</span>`, ask: { e: x.e },
        options: r.shuffle([x.mate, ...wrongs].map(p => { const full = PAIR_ITEMS.find(q => q.n === p.n); return { key: p.n, t: p.e, name: p.n, ok: p.n === x.mate.n, said: `Ez ${withArt(p.n)}. ${cap(withArt(p.n))} ${withArt(full.mate.all)} illik.` }; })),
        fact: `${cap(withArt(x.n))} és ${withArt(x.mate.n)} összeillik. ${x.why}`, hint: 'Gondold végig, mit csinálunk vele! Mi kell hozzá?' };
    },
    solve: item => { const me = PAIR_ITEMS.find(p => p.e === item.ask.e); return item.options.find(o => o.t === me.mate.e).name; } },

  // 6. Analógia: a tyúk tojást ad. Mit ad a tehén? Kulcs: a viszony és a kérdezett szereplő.
  { ...S, id: 'okos.analogia', skill: 'okos.analogia',
    targets: () => Object.entries(ANALOG).flatMap(([rel, g]) => g.items.map(([c]) => ({ key: `${rel}-${c.n}`, level: g.lv, rel, c: c.n }))),
    make: (t, r) => {
      const g = ANALOG[t.rel], [C, D] = g.items.find(([c]) => c.n === t.c), [A, B] = r.pick(g.items.filter(([c]) => c.n !== t.c));
      const rest = g.items.filter(([c]) => c.n !== t.c).map(([, d]) => d);
      const wrongs = [B, ...r.shuffle(rest.filter(d => d !== B))].slice(0, 2);
      const owner = d => g.items.find(([, x]) => x === d)[0];
      return { type: 'pick', prompt: g.ask(C), say: `${g.model(A, B)} ${g.ask(C)}`, ask: { c: C.n, rel: t.rel },
        qHtml: `<span class="analog"><i>${A.e}</i><b>➜</b><i>${B.e}</i><s></s><i>${C.e}</i><b>➜</b><b class="next">?</b></span>`,
        // ha az első pár párját választja, nem mondjuk el újra a mintamondatot (a kérdés úgyis megismétli)
        options: r.shuffle([D, ...wrongs].map(d => ({ key: d.n, t: d.e, name: d.n, ok: d === D, said: d === B ? `Ez ${withArt(d.n)}, ${withArt(A.n)} párja.` : `Ez ${withArt(d.n)}. ${g.tell(owner(d), d)}` }))),
        fact: g.tell(C, D), hint: `Nézd az első párt! ${g.model(A, B)} És ${withArt(C.n)}?` };
    },
    solve: item => { const g = ANALOG[item.ask.rel], d = g.items.find(([c]) => c.n === item.ask.c)[1]; return item.options.find(o => o.t === d.e).name; } },

  // 7. Mi tűnt el? Előbb megnézi a sort, aztán egy kép eltűnik; a válaszok közül kettő nem is volt a képen.
  //    Kulcs: a képek száma és (amíg a helye látszik) az eltűnt kép helye.
  { ...S, id: 'okos.eltunt', skill: 'okos.emlekezet',
    targets: () => [
      ...[3, 4, 5].flatMap(n => range(1, n).map(p => ({ key: `n${n}p${p}`, level: n - 2, n, p, keep: true }))),
      { key: 'n4-kever', level: 4, n: 4, keep: false }, { key: 'n5-kever', level: 5, n: 5, keep: false }, { key: 'n6-kever', level: 5, n: 6, keep: false },
    ],
    make: (t, r) => {
      const all = r.sample(PAT_PICS, t.n + 2), shown = all.slice(0, t.n), gone = t.keep ? shown[t.p - 1] : r.pick(shown), never = all.slice(t.n);
      const rest = t.keep ? shown.map(x => (x === gone ? null : x)) : r.shuffle(shown.filter(x => x !== gone));
      const row = xs => `<span class="seq">${xs.map(x => (x ? `<i>${x.e}</i>` : '<b class="next">?</b>')).join('')}</span>`;
      return { type: 'pick', prompt: 'Mi tűnt el?', say: 'Valami eltűnt. Mi tűnt el?', ask: {},
        memo: { html: row(shown), say: 'Nézd meg jól, mi van a képen! Jegyezd meg!', ms: 1200 + 800 * t.n },
        qHtml: row(rest),
        options: r.shuffle([gone, ...never].map(x => ({ key: x.n, t: x.e, name: x.n, ok: x === gone, said: x === gone ? `Ez ${withArt(x.n)}.` : `${cap(withArt(x.n))} nem volt a képen.` }))),
        fact: `${cap(withArt(gone.n))} tűnt el.`, hint: 'Gondolj vissza a képre! Mi volt még ott?' };
    },
    solve: item => { const before = seqTokens(item.memo.html), now = seqTokens(item.qHtml); const x = before.find(e => !now.includes(e)); return item.options.find(o => o.t === x).name; } },

  // 8. Memória: keresd meg a párokat! A kártya neve felfordításkor elhangzik. Gyakorló feladat (nincs hibaszám).
  { ...S, id: 'okos.memoria', skill: 'okos.memoria', graded: false,
    targets: () => Object.entries(MEMO_DECKS).flatMap(([c, fam]) => [3, 4, 5, 6].map(pairs => ({ key: `${c}-${pairs}`, level: Math.min(5, pairs - 2 + (fam >= 3 ? 1 : 0)), c, pairs }))),
    make: (t, r) => ({ type: 'memory', pairs: t.pairs, deck: r.sample(CATS[t.c].items, t.pairs).map(x => ({ e: x.e, n: x.n })) }),
    solve: item => item.pairs },
];

export { nameOf };
