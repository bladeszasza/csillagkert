// A feladatsor ADATKÉNT. Új feladat = új sor. A sorrend a területek között váltakozik, minden 2–3. feladat
// állatetetés ("hami az állatoknak"). type → js/activities/<type>.js. A pick(...) segéd: az ELSŐ válasz a helyes
// (futáskor összekeveredik), formátum: 'emoji név'. A kiválasztás (js/queue.js) a megoldottakat kerüli.

const opt = (s, ok) => { const i = s.indexOf(' '); return i < 0 ? { t: s, ok } : { t: s.slice(0, i), name: s.slice(i + 1), ok }; };
const pick = (icon, prompt, correct, ...wrong) => ({ type: 'pick', icon, prompt, options: [opt(correct, true), ...wrong.map(w => opt(w, false))] });
const withQ = (q, p) => ({ ...p, q });
const order = (icon, prompt, ...steps) => ({ type: 'order', icon, prompt, steps: steps.map(s => opt(s)) });
const word = (t, name, ...parts) => ({ type: 'clap', word: { t, name, parts } });
const music = (mode, notes, say) => ({ type: 'music', mode, notes, say });
const math = (a, b, op) => ({ type: 'math', a, b, op });
const algo = o => ({ type: 'algo', ...o });
const num = n => `${n} ${NUMS[n - 1]}`;
const NUMS = ['egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc', 'húsz'];
// Állatetetés: melyik ételt eszi az állat? food: [helyes, ...rosszak] 'emoji név'
const feed = (animal, name, ...food) => ({ type: 'feed', animal, name, food: food.map((f, i) => opt(f, i === 0)) });

// Betűlecke: 1) betű átírása, 2–3) melyik szó kezdődik ezzel a hanggal? — egyetlen csillagért.
// A kérdésben mindig a MÁSIK helyes szó a példa, hogy ne áruljuk el a választ. Csak egyszerű hangokkal kezdődő szavak.
const WRONG = { alma: '🍎 alma', kutya: '🐶 kutya', macska: '🐱 macska', labda: '⚽ labda', fa: '🌳 fa', beka: '🐸 béka' };
function lesson(L, [w1, w2], wrongs) {
  const wa = wrongs.slice(0, 2).map(k => WRONG[k]), wb = wrongs.slice(1, 3).map(k => WRONG[k]);
  const q = (right, example, wr) => ({ ...pick('🔤', `Melyik szó kezdődik ${L} betűvel?`, right, ...wr),
    say: `Melyik szó kezdődik ugyanazzal a hanggal, mint a ${example.split(' ')[1]}?` });
  return { type: 'seq', icon: '🔤', key: 'betu-' + L, steps: [
    { type: 'betu', text: L, say: `Fesd át a ${L} betűt!` },
    q(w1, w2, wa), q(w2, w1, wb),
  ] };
}

const BASE = [
  // ✏️ Ceruzavár · 🔢 Számoló rét · 🔺 Formák · 🔤 Hangok · 🧩 Okoskodó · 🌍 Világunk · 🍎 Egészség · 🫀 Testünk · 🏺 Időutazás · 🎵 Zene · 🎨 Rajz
  { type: 'trace', path: 'hullam', say: 'Kövesd a hullámos vonalat a kiscicától a csillagig!' },
  { type: 'count', n: 6 },
  music('highlow', [], 'Ismerkedjünk a hangokkal! Vannak mély és magas hangok.'),
  pick('🔺', 'Melyik a kör?', '🔴 kör', '🟦 négyzet', '🔺 háromszög'),
  lesson('A', ['🍎 alma', '🚗 autó'], ['kutya', 'macska', 'labda']),
  algo({ w: 4, h: 2, start: [0, 0], goal: [3, 0], max: 5, say: 'Ismerkedj a robottal! Nyomd meg a jobbra nyilat annyiszor, ahányat a robotnak lépnie kell, aztán indítsd el!' }),
  math(2, 1, '+'),
  pick('🫀', 'Melyik szerv pumpálja a vért?', '❤️ szív', '🧠 agy', '🦷 fog'),
  pick('🏺', 'Mi élt nagyon régen, az emberek előtt?', '🦖 dinoszaurusz', '📱 telefon', '🚀 űrhajó'),
  { type: 'memory', pairs: 3 },
  { type: 'draw', template: 'nap' },

  { type: 'trace', path: 'lejto' },
  { type: 'count', n: 9 },
  withQ('☀️<br>🏠', pick('🔺', 'Mi van fent?', '☀️ nap', '🏠 ház')),
  music('learn', ['do', 'mi', 'szo']),
  math(3, 2, '+'),
  pick('🌍', 'Melyik évszakban esik a hó?', '❄️ tél', '🏖️ nyár', '🌸 tavasz'),
  pick('🫀', 'Mivel gondolkodunk?', '🧠 agy', '🦴 csont', '👅 nyelv'),
  withQ('🍎🍎🍎<br>🍌🍌', pick('🔢', 'Melyikből van több?', '🍎 alma', '🍌 banán')),
  pick('🍎', 'Mivel látunk?', '👀 szem', '👂 fül', '👃 orr'),
  pick('🏺', 'Mi melegített és világított az ősembereknek?', '🔥 tűz', '📺 tévé', '🚗 autó'),

  { type: 'trace', path: 'cikcak' },
  { type: 'count', n: 12 },
  math(5, 2, '-'),
  pick('🔺', 'Melyik a háromszög?', '🔺 háromszög', '🔴 kör', '🟦 négyzet'),
  word('🍎', 'alma', 'al', 'ma'),
  withQ('🍎 🍐 🍌 🚗', pick('🧩', 'Melyik nem illik közéjük?', '🚗 autó', '🍎 alma', '🍌 banán')),
  pick('🌍', 'Ki oltja a tüzet?', '🧑‍🚒 tűzoltó', '🧑‍⚕️ orvos', '🧑‍🍳 szakács'),
  music('learn', ['re', 'fa', 'la']),
  order('🍎', 'Hogyan mossunk kezet? Koppints sorrendben!', '🚰 vizezd be', '🧼 szappanozd', '👏 dörzsöld', '💦 öblítsd', '🧻 töröld meg'),
  pick('🫀', 'Mivel lélegzünk?', '🫁 tüdő', '🦷 fog', '👂 fül'),
  { type: 'betu', useName: true, text: 'M', say: 'Írd át a betűket! Ez a te neved!' },

  { type: 'trace', path: 'kor' },
  { type: 'count', n: 14 },
  math(4, 3, '+'),
  withQ('☀️<br>🏠', pick('🔺', 'Mi van lent?', '🏠 ház', '☀️ nap')),
  lesson('M', ['🐱 macska', '🐷 malac'], ['alma', 'kutya', 'labda']),
  algo({ w: 3, h: 3, start: [0, 2], goal: [2, 0], max: 6 }),
  withQ('🔴 🔵 🔴 🔵 🔴 ❓', pick('🧩', 'Mi jön ezután?', '🔵 kék', '🔴 piros', '🟡 sárga')),
  pick('🔢', 'Melyik szám nagyobb?', num(14), num(9)),
  pick('🌍', 'Mikor megyünk aludni?', '🌙 éjszaka', '☀️ délben', '🌅 reggel'),
  music('loud', [], 'Vannak halk és hangos hangok is.'),
  pick('🍎', 'Melyik az egészséges?', '🥕 répa', '🍭 nyalóka', '🍟 sült krumpli'),
  pick('🏺', 'Hol laktak a királyok és a lovagok régen?', '🏰 vár', '🏢 felhőkarcoló', '⛺ sátor'),
  { type: 'draw', template: 'haz' },

  { type: 'trace', path: 'hurok' },
  { type: 'count', n: 16 },
  math(6, 3, '-'),
  pick('🔺', 'Melyik piros?', '🍎 alma', '🍌 banán', '🫐 áfonya'),
  pick('🔤', 'Mi rímel a kéz szóra?', '🍯 méz', '🐱 cica', '🌞 nap'),
  pick('🫀', 'Mivel rágunk?', '🦷 fog', '👃 orr', '👂 fül'),
  music('learn', ['do', 're', 'mi', 'fa', 'szo']),
  withQ('🐟🐟<br>🐥🐥🐥🐥', pick('🔢', 'Melyikből van kevesebb?', '🐟 hal', '🐥 csibe')),
  pick('🌍', 'Kinek a kicsinye a csibe?', '🐔 tyúk', '🐮 tehén', '🐷 malac'),
  math(7, 2, '+'),
  { type: 'memory', pairs: 4 },
  pick('🍎', 'Mit használunk fogmosáshoz?', '🪥 fogkefe', '🍬 cukorka', '🧦 zokni'),
  { type: 'draw', template: 'virag' },

  { type: 'trace', path: 'hegyek' },
  { type: 'count', n: 18 },
  math(8, 5, '-'),
  word('🐘', 'elefánt', 'e', 'le', 'fánt'),
  withQ('➡️', pick('🔺', 'Merre mutat a nyíl?', '👉 jobbra', '👈 balra')),
  lesson('O', ['✂️ olló', '👃 orr'], ['alma', 'kutya', 'macska']),
  order('🤖', 'Hogyan készítünk szendvicset? Koppints sorrendben!', '🍞 kenyeret veszünk elő', '🧈 megkenjük vajjal', '🧀 sajtot teszünk rá', '🥪 megesszük'),
  order('🔢', 'Rendezd sorba a számokat a legkisebbtől a legnagyobbig!', num(3), num(7), num(12), num(18)),
  pick('🌍', 'Melyik nap jön péntek után?', '🎈 szombat', '🎒 hétfő', '📚 szerda'),
  pick('🏺', 'Mit építettek az egyiptomiak a fáraóknak?', '🔺 piramis', '🏰 vár', '🏠 ház'),
  pick('🫀', 'Mi folyik az ereinkben?', '🩸 vér', '🥛 tej', '🧃 gyümölcslé'),
  music('learn', ['la', 'szi', 'do']),
  { type: 'draw', say: 'Rajzolj, amit csak szeretnél!' },

  { type: 'trace', path: 'spiral' },
  { type: 'count', n: 20 },
  math(5, 5, '+'),
  withQ('🐶 🐱 🐭 🌳', pick('🧩', 'Melyik nem illik közéjük?', '🌳 fa', '🐶 kutya', '🐱 cica')),
  withQ('⬅️', pick('🔺', 'Merre mutat a nyíl?', '👈 balra', '👉 jobbra')),
  word('🦋', 'pillangó', 'pil', 'lan', 'gó'),
  order('🌍', 'Mi történik a nap folyamán? Koppints sorrendben!', '🌅 reggel', '☀️ dél', '🌇 este', '🌙 éjszaka'),
  order('🫀', 'Hogyan növünk? Koppints sorrendben!', '👶 baba', '🧒 gyerek', '🧑 felnőtt', '🧓 idős'),
  lesson('L', ['⚽ labda', '💡 lámpa'], ['macska', 'alma', 'kutya']),
  algo({ w: 4, h: 3, start: [0, 0], goal: [3, 2], walls: [[1, 0], [1, 1]], max: 6 }),
  pick('🔢', 'Melyik szám jön a 12 után?', num(13), num(11), num(14)),
  pick('🏺', 'Ki védte a várat?', '⚔️ lovag', '🧑‍🚒 tűzoltó', '🧑‍🍳 szakács'),

  { type: 'trace', path: 'hullam' },
  { type: 'count', n: 11 },
  math(9, 4, '-'),
  pick('🔺', 'Melyik sárga?', '🌼 virág', '🥦 brokkoli', '🫐 áfonya'),
  withQ('🍎 🐱 🍌', pick('🔺', 'Mi van az alma és a banán között?', '🐱 cica', '🚗 autó')),
  order('🌍', 'Melyik nap után melyik jön? Koppints sorrendben!', '1️⃣ hétfő', '2️⃣ kedd', '3️⃣ szerda', '4️⃣ csütörtök', '5️⃣ péntek', '6️⃣ szombat', '7️⃣ vasárnap'),
  pick('🍎', 'Esik az eső. Mit viszünk magunkkal?', '☂️ esernyő', '🕶️ napszemüveg', '🩴 papucs'),
  math(6, 6, '+'),
  pick('🫀', 'Mivel fogunk meg dolgokat?', '✋ kéz', '🦶 láb', '👂 fül'),
  order('🏺', 'Hogyan változott a közlekedés? Koppints sorrendben!', '🐎 ló', '🚂 vonat', '🚗 autó', '✈️ repülő'),
  lesson('K', ['🐶 kutya', '👒 kalap'], ['macska', 'alma', 'labda']),
  algo({ w: 4, h: 3, start: [0, 0], goal: [3, 2], prefill: ['right', 'right', 'right', 'down'], max: 6 }),

  { type: 'trace', path: 'kor' },
  { type: 'count', n: 13 },
  math(10, 3, '-'),
  word('🌻', 'napraforgó', 'nap', 'ra', 'for', 'gó'),
  pick('🔤', 'Melyik állat neve kezdődik S hanggal?', '🦔 sün', '🐝 méh', '🦆 kacsa'),
  withQ('⚽ 🏀 🎾 🪑', pick('🧩', 'Melyik nem illik közéjük?', '🪑 szék', '⚽ foci', '🎾 teniszlabda')),
  pick('🔢', 'Melyik szám kisebb?', num(8), num(17)),
  pick('🍎', 'Mivel szagolunk?', '👃 orr', '👂 fül', '👀 szem'),
  order('🌍', 'Hogyan nő a virág? Koppints sorrendben!', '🌰 mag', '🌱 csíra', '🌷 virág'),
  pick('🫀', 'Mivel ízlelünk?', '👅 nyelv', '👁️ szem', '👂 fül'),
  lesson('T', ['🐮 tehén', '🥚 tojás'], ['kutya', 'alma', 'labda']),
  algo({ w: 6, h: 2, start: [0, 0], goal: [5, 1], loops: true, max: 4, say: 'Új gombok: ×2 és ×3! Így egyszerre többet lépsz egy nyíllal. Segítsd a robotot a csillaghoz!' }),

  { type: 'count', n: 15 },
  math(8, 7, '+'),
  word('🐱', 'macska', 'macs', 'ka'),
  withQ('⭐ 🌙 ⭐ 🌙 ⭐ ❓', pick('🧩', 'Mi jön ezután?', '🌙 hold', '⭐ csillag', '☀️ nap')),
  math(12, 5, '-'),
  pick('🫀', 'Hány ujjunk van két kezünkön?', '🔟 tíz', '5️⃣ öt', '8️⃣ nyolc'),
  pick('🫀', 'Mi segít, hogy kipihenjük magunkat?', '😴 alvás', '📺 tévézés', '🍟 sült krumpli'),
  { type: 'count', n: 17 },
  math(9, 9, '+'),
  { type: 'count', n: 19 },
  math(15, 6, '-'),
  pick('🏺', 'Hogyan világítottak régen, villany nélkül?', '🕯️ gyertyával', '📱 telefonnal', '💡 villanyfénnyel'),
  algo({ w: 5, h: 5, start: [0, 4], goal: [4, 0], walls: [[2, 2], [2, 3], [1, 2]], loops: true, max: 6 }),
  withQ('👏 ×3', pick('🤖', 'Hány taps lesz összesen?', '3️⃣ három', '2️⃣ kettő', '5️⃣ öt')),
  pick('🤖', 'Piros a lámpa. Mit csinálsz?', '✋ megállok', '🚶 átmegyek', '🏃 szaladok'),
  withQ('🔴🔴🔵 🔴🔴🔵 🔴🔴 ❓', pick('🤖', 'Mi jön ezután? Találd ki a szabályt!', '🔵 kék', '🔴 piros', '🟡 sárga')),
  order('🤖', 'Hogyan mosunk fogat? Koppints sorrendben!', '🪥 fogkrémet teszünk a kefére', '🦷 megsúrolunk minden fogat', '🚰 kiöblítjük a szánkat', '😁 mosolygunk'),
  algo({ w: 5, h: 4, start: [0, 0], goal: [4, 3], walls: [[1, 0], [1, 1], [3, 2], [3, 3]], loops: true, max: 6 }),
  pick('🤖', 'Ha sötét van a szobában, mit kapcsolunk fel?', '💡 lámpát', '📺 tévét', '🔊 hangszórót'),
];

const FEED = [
  feed('🐰', 'nyuszi', '🥕 répa', '🍖 hús', '🧀 sajt'),
  feed('🐱', 'cica', '🐟 hal', '🥕 répa', '🍌 banán'),
  feed('🐶', 'kutya', '🦴 csont', '🥕 répa', '🍌 banán'),
  feed('🐵', 'majom', '🍌 banán', '🦴 csont', '🧀 sajt'),
  feed('🐭', 'egér', '🧀 sajt', '🍖 hús', '🍌 banán'),
  feed('🐻', 'maci', '🍯 méz', '🥕 répa', '🍌 banán'),
  feed('🐴', 'ló', '🍎 alma', '🐟 hal', '🍖 hús'),
  feed('🐔', 'tyúk', '🌽 kukorica', '🐟 hal', '🍖 hús'),
  feed('🐿️', 'mókus', '🥜 mogyoró', '🐟 hal', '🍖 hús'),
  feed('🐮', 'tehén', '🌿 fű', '🍖 hús', '🐟 hal'),
];

// A feladatsor: alap feladatok + állatetetés. A "minden 2., majd 3. feladat etetés" szabályt a js/queue.js tartja be.
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
export const stationOf = item => BY_TYPE[item.type] || BY_ICON[item.icon] || 'okos';
export const itemsOf = id => CURRICULUM.filter(i => stationOf(i) === id);

// Stabil azonosító a megoldott feladatok megjegyzéséhez (a tartalom határozza meg, nem a sorrend)
export const idOf = item => item.key || [item.type, item.path, item.n, item.a, item.b, item.op, item.template, item.text, item.useName, item.pairs, item.word?.name, item.mode, item.notes?.join(','), item.animal, item.w, item.goal?.join('-'), item.prefill?.join('-'), item.loops, item.prompt, item.q, item.say]
  .filter(x => x !== undefined && x !== null).join('|');
