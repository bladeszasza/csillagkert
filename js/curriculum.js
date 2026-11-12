// A kézzel írt feladatok ADATKÉNT (azok az állomások, amelyek még nem sablonokból jönnek) + az állatetetés.
// A Számoló rét, a Formák és színek és az Okoskodó feladatai sablonokból készülnek (js/content/); a régi, kézzel írt
// változatuk kikerült innen. type → js/activities/<type>.js. A pick(...) segéd: az ELSŐ válasz a helyes (futáskor
// összekeveredik), formátum: 'emoji név'. A sorrendet az ütemező adja (js/scheduler-core.js), nem ez a lista.

import { withArt, artLetter } from './hu.js';
import { MEALS, ANY, friendById } from './friends.js';

// Kijelentések a helyes válaszhoz: kulcs = kérdés|helyes válasz neve. Elhangzik: "Igen! <kijelentés>"
const FACTS = {
  'Melyik évszakban esik a hó?|tél': 'Télen esik a hó, és hideg van.',
  'Mivel gondolkodunk?|agy': 'Az agyunkkal gondolkodunk.',
  'Mivel látunk?|szem': 'A szemünkkel látunk.',
  'Mivel melegedtek az ősemberek?|tűz': 'Az ősemberek a tűz mellett melegedtek.',
  'Ki oltja a tüzet?|tűzoltó': 'A tűzoltó oltja el a tüzet.',
  'Mivel lélegzünk?|tüdő': 'A tüdőnkkel lélegzünk.',
  'Mikor látjuk a csillagokat az égen?|éjszaka': 'Éjszaka, amikor sötét van, látjuk a csillagokat.',
  'Melyik az egészséges?|répa': 'A répa egészséges, sok vitamin van benne.',
  'Hol laktak a királyok és a lovagok régen?|vár': 'A királyok és a lovagok régen várban laktak.',
  'Mi rímel a kéz szóra?|méz': 'A kéz és a méz rímel egymásra.',
  'Mivel rágunk?|fog': 'A fogunkkal rágunk.',
  'Kinek a kicsinye a csibe?|tyúk': 'A csibe a tyúk kicsinye.',
  'Mivel mosunk fogat?|fogkefe': 'Fogat fogkefével mosunk.',
  'Melyik nap jön péntek után?|szombat': 'Péntek után szombat jön.',
  'Mivel hallunk?|fül': 'A fülünkkel hallunk.',
  'Kik védték a várat?|lovagok': 'A várat a lovagok védték.',
  'Esik az eső. Mit viszünk magunkkal?|esernyő': 'Esőben esernyőt viszünk magunkkal.',
  'Mivel fogjuk meg a kanalat?|kéz': 'A kanalat a kezünkkel fogjuk meg.',
  'Melyik állat neve kezdődik S betűvel?|sün': 'A sün, a sapka és a sajt is ugyanazzal a hanggal kezdődik.',
  'Mivel szagolunk?|orr': 'Az orrunkkal szagolunk.',
  'Mivel érezzük az ízeket?|nyelv': 'A nyelvünkkel érezzük az ízeket.',
  'Hány ujjunk van két kezünkön?|tíz': 'Két kezünkön tíz ujjunk van.',
  'Mit csinálunk, ha álmosak vagyunk?|alszunk': 'Ha álmosak vagyunk, alszunk egy jót.',
  'Melyikhez nem kell villany?|gyertya': 'A gyertyához nem kell villany. Régen azzal világítottak.',
  'Melyik szerv pumpálja a vért?|szív': 'A szív pumpálja a vért az egész testünkben.',
  'Melyik állat élt nagyon régen, és ma már nem él?|dinoszaurusz': 'A dinoszauruszok nagyon régen éltek, ma már nincsenek.',
  'Piros a lámpa. Mit csinálsz?|megállok': 'Piros lámpánál megállunk, és megvárjuk a zöldet.',
  'Mi jön ezután? Találd ki a szabályt!|kék': 'Utána a kék jön: két piros és egy kék ismétlődik.',
  'Hány taps lesz összesen?|három': 'Háromszor tapsolunk: az három taps.',
  'Ha sötét van a szobában, mit kapcsolunk fel?|lámpát': 'Ha sötét van a szobában, felkapcsoljuk a lámpát.',
};
const ORDER_FACTS = {
  'Hogyan mossunk kezet? Koppints sorrendben!': 'Víz, szappan, dörzsölés, öblítés, végül törölközés.',
  'Mi történik a nap folyamán? Koppints sorrendben!': 'A nap így telik: reggel, dél, este, éjszaka.',
  'Hogyan változunk az évek alatt? Koppints sorrendben!': 'Előbb baba vagyunk, aztán gyerek, felnőtt, végül idős.',
  'Rakd sorba a hét napjait! Koppints sorrendben!': 'Hétfő, kedd, szerda, csütörtök, péntek, szombat, vasárnap.',
  'Hogyan nő a virág? Koppints sorrendben!': 'Először mag van, abból csíra nő, végül virág lesz belőle.',
  'Hogyan változott a közlekedés? Koppints sorrendben!': 'Régen lovon jártak, aztán jött a vonat, az autó, és végül a repülő.',
  'Hogyan készítünk szendvicset? Koppints sorrendben!': 'Kenyér, vaj, sajt, és kész is a szendvics!',
  'Hogyan mosunk fogat? Koppints sorrendben!': 'Fogkrém a kefére, fogmosás, öblítés, és jöhet a mosoly!',
};
const opt = (s, ok) => { const i = s.indexOf(' '); return i < 0 ? { t: s, ok } : { t: s.slice(0, i), name: s.slice(i + 1), ok }; };
const pick = (icon, prompt, correct, ...wrong) => ({ type: 'pick', icon, prompt, fact: FACTS[prompt + '|' + (opt(correct, true).name || '')], options: [opt(correct, true), ...wrong.map(w => opt(w, false))] });
const withQ = (q, p) => ({ ...p, q });
const order = (icon, prompt, ...steps) => ({ type: 'order', icon, prompt, fact: ORDER_FACTS[prompt], steps: steps.map(s => opt(s)) });
const word = (t, name, ...parts) => ({ type: 'clap', word: { t, name, parts } });
const music = (mode, notes, say) => ({ type: 'music', mode, notes, say });
const algo = o => ({ type: 'algo', ...o });
// Állatetetés: a kert valódi lakóját etetjük (js/friends.js: ki mit eszik). A kulcs az állat és a jó étel párja.
// A mindenevő barátnál (ANY) mindegyik étel jó: ott a gyerek választ, a kulcs vége "mind".
const feed = ([kind, good, ...rest]) => {
  const base = { type: 'feed', kind, animal: friendById(kind).emoji, name: friendById(kind).name };
  return good === ANY ? { ...base, key: `feed-${kind}-mind`, any: rest } : { ...base, key: `feed-${kind}-${good}`, good, wrong: rest };
};

// Betűlecke: 1) betű átírása, 2–3) melyik szó kezdődik ezzel a hanggal? — egyetlen csillagért.
// A kérdésben mindig a MÁSIK helyes szó a példa, hogy ne áruljuk el a választ. Csak egyszerű hangokkal kezdődő szavak.
const WRONG = { alma: '🍎 alma', kutya: '🐶 kutya', macska: '🐱 macska', labda: '⚽ labda', fa: '🌳 fa', beka: '🐸 béka' };
function lesson(L, [w1, w2], wrongs) {
  const wa = wrongs.slice(0, 2).map(k => WRONG[k]), wb = wrongs.slice(1, 3).map(k => WRONG[k]);
  const q = (right, example, wr) => ({ ...pick('🔤', `Melyik szó kezdődik ${L} betűvel?`, right, ...wr),
    say: `Melyik szó kezdődik ugyanazzal a hanggal, mint ${withArt(example.split(' ')[1])}?`,
    fact: `${withArt(right.split(' ')[1], true)} ugyanazzal a hanggal kezdődik, mint ${withArt(example.split(' ')[1])}.` });
  return { type: 'seq', icon: '🔤', key: 'betu-' + L, steps: [
    { type: 'betu', text: L, say: `Fesd át ${artLetter(L)} ${L} betűt!` },
    q(w1, w2, wa), q(w2, w1, wb),
  ] };
}

const BASE = [
  // ✏️ Ceruzavár · 🔤 Hangok · 🌍 Világunk · 🍎 Egészség · 🫀 Testünk · 🏺 Időutazás · 🎵 Zene · 🤖 Robotpálya · 🎨 Rajz
  { type: 'trace', path: 'hullam', say: 'Kövesd a hullámos vonalat a kiscicától a csillagig!' },
  music('highlow', [], 'Ismerkedjünk a hangokkal! Vannak mély és magas hangok.'),
  lesson('A', ['🍎 alma', '🚗 autó'], ['kutya', 'macska', 'labda']),
  algo({ w: 4, h: 2, start: [0, 0], goal: [3, 0], max: 5, say: 'Ismerkedj a robottal! Nyomd meg a jobbra nyilat annyiszor, ahányat a robotnak lépnie kell, aztán indítsd el!' }),
  pick('🫀', 'Melyik szerv pumpálja a vért?', '❤️ szív', '🧠 agy', '🦷 fog'),
  pick('🏺', 'Melyik állat élt nagyon régen, és ma már nem él?', '🦖 dinoszaurusz', '🐶 kutya', '🐱 cica'),
  { type: 'draw', template: 'nap' },

  { type: 'trace', path: 'lejto' },
  music('learn', ['szo', 'mi']),
  pick('🌍', 'Melyik évszakban esik a hó?', '❄️ tél', '🏖️ nyár', '🌸 tavasz'),
  pick('🫀', 'Mivel gondolkodunk?', '🧠 agy', '🦴 csont', '👅 nyelv'),
  pick('🫀', 'Mivel látunk?', '👀 szem', '👂 fül', '👃 orr'),
  pick('🏺', 'Mivel melegedtek az ősemberek?', '🔥 tűz', '🧊 jég', '🌧️ eső'),

  { type: 'trace', path: 'cikcak' },
  word('🍎', 'alma', 'al', 'ma'),
  pick('🌍', 'Ki oltja a tüzet?', '🧑‍🚒 tűzoltó', '🧑‍⚕️ orvos', '🧑‍🍳 szakács'),
  music('learn', ['szo', 'mi', 'la']),
  order('🍎', 'Hogyan mossunk kezet? Koppints sorrendben!', '🚰 vizezd be', '🧼 szappanozd be', '🫧 dörzsöld habosra', '💧 öblítsd le', '🧻 töröld meg'),
  pick('🫀', 'Mivel lélegzünk?', '🫁 tüdő', '🦷 fog', '👂 fül'),
  { type: 'betu', useName: true, text: 'M', say: 'Írd át a betűket! Ez a te neved!' },

  { type: 'trace', path: 'kor' },
  lesson('M', ['🐱 macska', '🐷 malac'], ['alma', 'kutya', 'labda']),
  algo({ w: 3, h: 3, start: [0, 2], goal: [2, 0], max: 6 }),
  pick('🌍', 'Mikor látjuk a csillagokat az égen?', '🌙 éjszaka', '☀️ délben', '🌤️ délután'),
  music('loud', [], 'Vannak halk és hangos hangok is.'),
  pick('🍎', 'Melyik az egészséges?', '🥕 répa', '🍭 nyalóka', '🍟 sült krumpli'),
  pick('🏺', 'Hol laktak a királyok és a lovagok régen?', '🏰 vár', '🏢 felhőkarcoló', '⛺ sátor'),
  { type: 'draw', template: 'haz' },

  { type: 'trace', path: 'hurok' },
  music('same', [], 'Figyeld meg, egyforma-e két hang!'),
  pick('🔤', 'Mi rímel a kéz szóra?', '🍯 méz', '🐱 cica', '🌞 nap'),
  pick('🫀', 'Mivel rágunk?', '🦷 fog', '👃 orr', '👂 fül'),
  music('learn', ['mi', 're', 'do']),
  withQ('🐥', pick('🌍', 'Kinek a kicsinye a csibe?', '🐔 tyúk', '🐮 tehén', '🐷 malac')),
  pick('🍎', 'Mivel mosunk fogat?', '🪥 fogkefe', '🧼 szappan', '🧽 szivacs'),
  { type: 'draw', template: 'virag' },

  { type: 'trace', path: 'hegyek' },
  word('🐘', 'elefánt', 'e', 'le', 'fánt'),
  lesson('O', ['✂️ olló', '👃 orr'], ['alma', 'kutya', 'macska']),
  order('🤖', 'Hogyan készítünk szendvicset? Koppints sorrendben!', '🍞 kenyeret veszünk elő', '🧈 megkenjük vajjal', '🧀 sajtot teszünk rá', '🥪 megesszük'),
  pick('🌍', 'Melyik nap jön péntek után?', '🎈 szombat', '🎒 hétfő', '📚 szerda'),
  pick('🫀', 'Mivel hallunk?', '👂 fül', '👃 orr', '🦶 láb'),
  music('learn', ['do', 'mi', 'szo']),
  { type: 'draw', say: 'Rajzolj, amit csak szeretnél!' },

  { type: 'trace', path: 'spiral' },
  music('updown', [], 'A hang felfelé is mehet, lefelé is.'),
  word('🦋', 'pillangó', 'pil', 'lan', 'gó'),
  order('🌍', 'Mi történik a nap folyamán? Koppints sorrendben!', '🌅 reggel', '☀️ dél', '🌇 este', '🌙 éjszaka'),
  order('🫀', 'Hogyan változunk az évek alatt? Koppints sorrendben!', '👶 baba', '🧒 gyerek', '🧑 felnőtt', '🧓 idős'),
  lesson('L', ['⚽ labda', '💡 lámpa'], ['macska', 'alma', 'kutya']),
  algo({ w: 4, h: 3, start: [0, 0], goal: [3, 2], walls: [[1, 0], [1, 1]], max: 6 }),
  pick('🏺', 'Kik védték a várat?', '⚔️ lovagok', '🧑‍🏫 tanítók', '🧑‍🎨 festők'),

  { type: 'trace', path: 'nyolcas', say: 'Kövesd a nyolcast! Körbe-körbe, mint a kisvasút.' },
  order('🌍', 'Rakd sorba a hét napjait! Koppints sorrendben!', '🔴 hétfő', '🟡 kedd', '🟢 szerda', '🔵 csütörtök'),
  pick('🌍', 'Esik az eső. Mit viszünk magunkkal?', '☂️ esernyő', '🕶️ napszemüveg', '🩴 papucs'),
  pick('🫀', 'Mivel fogjuk meg a kanalat?', '✋ kéz', '🦶 láb', '👃 orr'),
  order('🏺', 'Hogyan változott a közlekedés? Koppints sorrendben!', '🐎 ló', '🚂 vonat', '🚗 autó', '✈️ repülő'),
  lesson('K', ['🐶 kutya', '👒 kalap'], ['macska', 'alma', 'labda']),
  algo({ w: 4, h: 3, start: [0, 0], goal: [3, 2], prefill: ['right', 'right', 'right', 'down'], max: 6 }),

  { type: 'trace', path: 'hullam' },
  word('🌻', 'napraforgó', 'nap', 'ra', 'for', 'gó'),
  { ...pick('🔤', 'Melyik állat neve kezdődik S betűvel?', '🦔 sün', '🐝 méh', '🦆 kacsa'), say: 'Melyik állat neve kezdődik ugyanúgy, mint a sapka?' },
  pick('🫀', 'Mivel szagolunk?', '👃 orr', '👂 fül', '👀 szem'),
  order('🌍', 'Hogyan nő a virág? Koppints sorrendben!', '🫘 mag', '🌱 csíra', '🌷 virág'),
  pick('🫀', 'Mivel érezzük az ízeket?', '👅 nyelv', '👀 szem', '✋ kéz'),
  lesson('T', ['🐮 tehén', '🥚 tojás'], ['kutya', 'alma', 'labda']),
  algo({ w: 6, h: 2, start: [0, 0], goal: [5, 1], loops: true, max: 4, say: 'Új gombok: a kétszer és a háromszor gomb! Így egy nyíllal többet lépsz. Segítsd a robotot a csillaghoz!' }),

  word('🐱', 'macska', 'macs', 'ka'),
  pick('🫀', 'Hány ujjunk van két kezünkön?', '🔟 tíz', '5️⃣ öt', '8️⃣ nyolc'),
  pick('🫀', 'Mit csinálunk, ha álmosak vagyunk?', '😴 alszunk', '🏃 szaladgálunk', '⚽ focizunk'),
  pick('🏺', 'Melyikhez nem kell villany?', '🕯️ gyertya', '💡 villanykörte', '📺 tévé'),
  algo({ w: 5, h: 5, start: [0, 4], goal: [4, 0], walls: [[2, 2], [2, 3], [1, 2]], loops: true, max: 6 }),
  { ...withQ('👏 👏 👏', pick('🤖', 'Hány taps lesz összesen?', '3️⃣ három', '2️⃣ kettő', '5️⃣ öt')), say: 'Háromszor tapsolunk. Hány taps lesz összesen?' },
  withQ('🚦', pick('🌍', 'Piros a lámpa. Mit csinálsz?', '✋ megállok', '🚶 átmegyek', '🏃 szaladok')),
  withQ('🔴🔴🔵 🔴🔴🔵 🔴🔴 ❓', pick('🤖', 'Mi jön ezután? Találd ki a szabályt!', '🔵 kék', '🔴 piros', '🟡 sárga')),
  order('🍎', 'Hogyan mosunk fogat? Koppints sorrendben!', '🪥 fogkrémet teszünk a kefére', '🦷 megmossuk minden fogunkat', '🚰 kiöblítjük a szánkat', '😁 mosolygunk'),
  algo({ w: 5, h: 4, start: [0, 0], goal: [4, 3], walls: [[1, 0], [1, 1], [3, 2], [3, 3]], loops: true, max: 6 }),
  pick('🤖', 'Ha sötét van a szobában, mit kapcsolunk fel?', '💡 lámpát', '📺 tévét', '🔊 hangszórót'),
];

const FEED = MEALS.map(feed);

// A kézzel írt feladatok + az állatetetés. Az etetés ütemét (minden 2., majd 3. feladat) az ütemező tartja be.
export const CURRICULUM = [...BASE, ...FEED];
export const isFeed = item => item.type === 'feed';
export const BASE_ITEMS = BASE;
export const FEED_ITEMS = FEED;

// Állomások a kertben (szabad választáshoz és a szülői áttekintéshez)
export const STATIONS = [
  { id: 'ceruza', emoji: '✏️', name: 'Ceruzavár' },
  { id: 'szamol', emoji: '🔢', name: 'Számoló rét' },
  { id: 'forma', emoji: '🔺', name: 'Formák és színek' },
  { id: 'hang', emoji: '🔤', name: 'Hangok háza' },
  { id: 'zene', emoji: '🎵', name: 'Zenevár' },
  { id: 'allat', emoji: '🐰', name: 'Állatetetés' },
  { id: 'okos', emoji: '🧩', name: 'Okoskodó' },
  { id: 'vilag', emoji: '🌍', name: 'Világunk' },
  { id: 'egeszseg', emoji: '🍎', name: 'Egészség' },
  { id: 'test', emoji: '🫀', name: 'Testünk csodái' },
  { id: 'ido', emoji: '🏺', name: 'Időutazás' },
  { id: 'algo', emoji: '🤖', name: 'Robotpálya' },
  { id: 'rajz', emoji: '🎨', name: 'Rajzasztal' },
];
const BY_TYPE = { trace: 'ceruza', betu: 'ceruza', count: 'szamol', math: 'szamol', memory: 'okos', clap: 'hang', draw: 'rajz', seq: 'hang', music: 'zene', feed: 'allat', algo: 'algo' };
const BY_ICON = { '🔺': 'forma', '🔤': 'hang', '🧩': 'okos', '🌍': 'vilag', '🍎': 'egeszseg', '🔢': 'szamol', '🫀': 'test', '🏺': 'ido', '🤖': 'algo' };
export const stationOf = item => item.station || BY_TYPE[item.type] || BY_ICON[item.icon] || 'okos';
export const itemsOf = id => CURRICULUM.filter(i => stationOf(i) === id);

// Stabil azonosító a megoldott feladatok megjegyzéséhez (a tartalom határozza meg, nem a sorrend)
export const idOf = item => item.id || item.key || [item.type, item.path, item.n, item.a, item.b, item.op, item.template, item.text, item.useName, item.pairs, item.word?.name, item.mode, item.notes?.join(','), item.animal, item.w, item.goal?.join('-'), item.prefill?.join('-'), item.loops, item.prompt, item.q, item.say]
  .filter(x => x !== undefined && x !== null).join('|');
