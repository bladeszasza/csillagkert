// A feladatsor ADATKÉNT. Új feladat = új sor. A kabala egymás után, vegyesen adja őket,
// a sorrend a nyolc terület (állomás) között váltakozik. A lista végén újrakezdődik.
//
// type → js/activities/<type>.js. A pick(...) segéd: az ELSŐ válasz a helyes (futáskor összekeveredik),
// formátum: 'emoji név'.

const opt = (s, ok) => { const i = s.indexOf(' '); return i < 0 ? { t: s, ok } : { t: s.slice(0, i), name: s.slice(i + 1), ok }; };
const pick = (icon, prompt, correct, ...wrong) => ({ type: 'pick', icon, prompt, options: [opt(correct, true), ...wrong.map(w => opt(w, false))] });
const withQ = (q, p) => ({ ...p, q });
const order = (icon, prompt, ...steps) => ({ type: 'order', icon, prompt, steps: steps.map(s => opt(s)) });
const word = (t, name, ...parts) => ({ type: 'clap', word: { t, name, parts } });

export const CURRICULUM = [
  // ✏️ Ceruzavár · 🔢 Számoló rét · 🔺 Formák · 🔤 Hangok · 🧩 Okoskodó · 🌍 Világunk · 🍎 Egészség · 🎨 Rajz
  { type: 'trace', path: 'hullam', say: 'Kövesd a hullámos vonalat a kiscicától a csillagig!' },
  { type: 'count', n: 2 },
  pick('🔺', 'Melyik a kör?', '🔴 kör', '🟦 négyzet', '🔺 háromszög'),
  pick('🔤', 'Melyik állat neve kezdődik M hanggal?', '🐱 macska', '🐶 kutya', '🐘 elefánt'),
  { type: 'memory', pairs: 3 },
  pick('🌍', 'Melyik évszakban esik a hó?', '❄️ tél', '🏖️ nyár', '🌸 tavasz'),
  pick('🍎', 'Mivel látunk?', '👀 szem', '👂 fül', '👃 orr'),
  { type: 'draw', template: 'nap' },

  withQ('☀️<br>🏠', pick('🔺', 'Mi van fent?', '☀️ nap', '🏠 ház')),
  withQ('🍎🍎🍎<br>🍌🍌', pick('🔢', 'Melyikből van több?', '🍎 alma', '🍌 banán')),

  { type: 'trace', path: 'lejto' },
  { type: 'count', n: 3 },
  pick('🔺', 'Melyik a háromszög?', '🔺 háromszög', '🔴 kör', '🟦 négyzet'),
  word('🍎', 'alma', 'al', 'ma'),
  withQ('🍎 🍐 🍌 🚗', pick('🧩', 'Melyik nem illik közéjük?', '🚗 autó', '🍎 alma', '🍌 banán')),
  pick('🌍', 'Ki oltja a tüzet?', '🧑‍🚒 tűzoltó', '🧑‍⚕️ orvos', '🧑‍🍳 szakács'),
  order('🍎', 'Hogyan mossunk kezet? Koppints sorrendben!', '🚰 vizezd be', '🧼 szappanozd', '👏 dörzsöld', '💦 öblítsd', '🧻 töröld meg'),
  { type: 'betu', text: 'O', say: 'Fesd át az O betűt!' },

  withQ('☀️<br>🏠', pick('🔺', 'Mi van lent?', '🏠 ház', '☀️ nap')),
  withQ('➡️', pick('🔺', 'Merre mutat a nyíl?', '👉 jobbra', '👈 balra')),

  { type: 'trace', path: 'cikcak' },
  { type: 'count', n: 4 },
  pick('🔺', 'Melyik piros?', '🍎 alma', '🍌 banán', '🫐 áfonya'),
  pick('🔤', 'Mi rímel a kéz szóra?', '🍯 méz', '🐱 cica', '🌞 nap'),
  withQ('🔴 🔵 🔴 🔵 🔴 ❓', pick('🧩', 'Mi jön ezután?', '🔵 kék', '🔴 piros', '🟡 sárga')),
  pick('🌍', 'Mikor megyünk aludni?', '🌙 éjszaka', '☀️ délben', '🌅 reggel'),
  pick('🍎', 'Melyik az egészséges?', '🥕 répa', '🍭 nyalóka', '🍟 sült krumpli'),
  { type: 'draw', template: 'haz' },

  withQ('🐟🐟<br>🐥🐥🐥🐥', pick('🔢', 'Melyikből van kevesebb?', '🐟 hal', '🐥 csibe')),
  withQ('⬅️', pick('🔺', 'Merre mutat a nyíl?', '👈 balra', '👉 jobbra')),

  { type: 'trace', path: 'kor' },
  { type: 'count', n: 5 },
  pick('🔺', 'Melyik a nagyobb?', '🐘 elefánt', '🐭 egér', '🐜 hangya'),
  word('🐘', 'elefánt', 'e', 'le', 'fánt'),
  { type: 'memory', pairs: 4 },
  pick('🌍', 'Kinek a kicsinye a csibe?', '🐔 tyúk', '🐮 tehén', '🐷 malac'),
  pick('🍎', 'Mit használunk fogmosáshoz?', '🪥 fogkefe', '🍬 cukorka', '🧦 zokni'),
  { type: 'betu', text: 'A', say: 'Fesd át az A betűt!' },

  withQ('🍎 🐱 🍌', pick('🔺', 'Mi van az alma és a banán között?', '🐱 cica', '🚗 autó')),
  order('🌍', 'Melyik nap után melyik jön? Koppints sorrendben!', '1️⃣ hétfő', '2️⃣ kedd', '3️⃣ szerda', '4️⃣ csütörtök', '5️⃣ péntek', '6️⃣ szombat', '7️⃣ vasárnap'),

  { type: 'trace', path: 'hurok' },
  { type: 'count', n: 6 },
  pick('🔺', 'Melyik sárga?', '🌼 virág', '🥦 brokkoli', '🫐 áfonya'),
  pick('🔤', 'Melyik szó kezdődik K hanggal?', '🐶 kutya', '🐱 macska', '🐭 egér'),
  withQ('🐶 🐱 🐭 🌳', pick('🧩', 'Melyik nem illik közéjük?', '🌳 fa', '🐶 kutya', '🐱 cica')),
  order('🌍', 'Mi történik a nap folyamán? Koppints sorrendben!', '🌅 reggel', '☀️ dél', '🌇 este', '🌙 éjszaka'),
  pick('🍎', 'Esik az eső. Mit viszünk magunkkal?', '☂️ esernyő', '🕶️ napszemüveg', '🩴 papucs'),
  { type: 'draw', template: 'virag' },

  pick('🌍', 'Melyik nap jön péntek után?', '🎈 szombat', '🎒 hétfő', '📚 szerda'),

  { type: 'trace', path: 'hegyek' },
  { type: 'count', n: 7 },
  word('🦋', 'pillangó', 'pil', 'lan', 'gó'),
  pick('🔺', 'Melyik a négyzet?', '🟦 négyzet', '🔴 kör', '🔺 háromszög'),
  { type: 'memory', pairs: 5 },
  pick('🌍', 'Ki gyógyítja meg a betegeket?', '🧑‍⚕️ orvos', '🧑‍🚒 tűzoltó', '🧑‍🌾 gazda'),
  order('🌍', 'Hogyan nő a virág? Koppints sorrendben!', '🌰 mag', '🌱 csíra', '🌷 virág'),
  { type: 'betu', useName: true, text: 'M', say: 'Írd át a betűket! Ez a te neved!' },

  { type: 'trace', path: 'spiral' },
  { type: 'count', n: 8 },
  pick('🔤', 'Melyik állat neve kezdődik S hanggal?', '🦔 sün', '🐝 méh', '🦆 kacsa'),
  word('🌻', 'napraforgó', 'nap', 'ra', 'for', 'gó'),
  withQ('⚽ 🏀 🎾 🪑', pick('🧩', 'Melyik nem illik közéjük?', '🪑 szék', '⚽ foci', '🎾 teniszlabda')),
  pick('🍎', 'Mivel szagolunk?', '👃 orr', '👂 fül', '👀 szem'),
  { type: 'count', n: 9 },
  { type: 'draw', say: 'Rajzolj, amit csak szeretnél!' },

  { type: 'trace', path: 'hullam' },
  { type: 'count', n: 10 },
  word('🐱', 'macska', 'macs', 'ka'),
  withQ('⭐ 🌙 ⭐ 🌙 ⭐ ❓', pick('🧩', 'Mi jön ezután?', '🌙 hold', '⭐ csillag', '☀️ nap')),
];

// Állomások a kertben (szabad választáshoz és a szülői áttekintéshez)
export const STATIONS = [
  { id: 'ceruza', emoji: '✏️', name: 'Ceruzavár' },
  { id: 'szamol', emoji: '🔢', name: 'Számoló rét' },
  { id: 'forma', emoji: '🔺', name: 'Formák és színek' },
  { id: 'hang', emoji: '🔤', name: 'Hangok háza' },
  { id: 'okos', emoji: '🧩', name: 'Okoskodó' },
  { id: 'vilag', emoji: '🌍', name: 'Világunk' },
  { id: 'egeszseg', emoji: '🍎', name: 'Egészség' },
  { id: 'rajz', emoji: '🎨', name: 'Rajzasztal' },
];
const BY_TYPE = { trace: 'ceruza', betu: 'ceruza', count: 'szamol', memory: 'okos', clap: 'hang', draw: 'rajz' };
const BY_ICON = { '🔺': 'forma', '🔤': 'hang', '🧩': 'okos', '🌍': 'vilag', '🍎': 'egeszseg', '🔢': 'szamol' };
export const stationOf = item => BY_TYPE[item.type] || BY_ICON[item.icon] || 'okos';
export const itemsOf = id => CURRICULUM.filter(i => stationOf(i) === id);
