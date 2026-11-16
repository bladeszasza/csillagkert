// Az állatetetés feladatai és az állomások listája. A többi feladat sablonokból (generált állomások) és kézzel írt,
// a szülő által átnézett ténytáblákból jön (js/content/). type → js/activities/<type>.js. A sorrendet az ütemező adja
// (js/scheduler-core.js), nem ez a lista.

import { MEALS, ANY, friendById } from './friends.js';
import { APPROVED } from './content/approved.js';

// Állatetetés: a kert valódi lakóját etetjük (js/friends.js: ki mit eszik). A kulcs az állat és a jó étel párja.
// A mindenevő barátnál (ANY) mindegyik étel jó: ott a gyerek választ, a kulcs vége "mind".
const feed = ([kind, good, ...rest]) => {
  const base = { type: 'feed', kind, animal: friendById(kind).emoji, name: friendById(kind).name };
  return good === ANY ? { ...base, key: `feed-${kind}-mind`, any: rest } : { ...base, key: `feed-${kind}-${good}`, good, wrong: rest };
};

// A régi, kézzel írt feladatok mind kikerültek: minden állomás sablonokból vagy ténytáblából kapja a feladatait
// (js/content/). Ez a lista üresen marad, hogy a régi mentések átemelése és a tesztek ugyanúgy működjenek.
const BASE = [];

const FEED = MEALS.map(feed);

// Az állatetetés (a régi lista üres). Az etetés ütemét (minden 2., majd 3. feladat) az ütemező tartja be.
export const CURRICULUM = [...BASE, ...FEED];
export const isFeed = item => item.type === 'feed';
export const BASE_ITEMS = BASE;
export const FEED_ITEMS = FEED;

// Állomások a kertben (szabad választáshoz és a szülői áttekintéshez). review: új állomás, amelyik csak a szülő jóváhagyása
// után jelenik meg (addig nincs feladata a játékban, lásd js/content/approved.js)
export const ALL_STATIONS = [
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
  { id: 'sziv', emoji: '💗', name: 'Szívkert', review: true },
];
export const STATIONS = ALL_STATIONS.filter(s => !s.review || APPROVED[s.id]);
const BY_TYPE = { trace: 'ceruza', maze: 'ceruza', dots: 'ceruza', racs: 'rajz', matrica: 'rajz', kep: 'rajz', count: 'szamol', math: 'szamol', memory: 'okos', clap: 'hang', draw: 'rajz', seq: 'hang', echo: 'zene', feed: 'allat', algo: 'algo' };
const BY_ICON = { '🔺': 'forma', '🔤': 'hang', '🧩': 'okos', '🌍': 'vilag', '🍎': 'egeszseg', '🔢': 'szamol', '🫀': 'test', '🏺': 'ido', '🤖': 'algo' };
export const stationOf = item => item.station || BY_TYPE[item.type] || BY_ICON[item.icon] || 'okos';
export const itemsOf = id => CURRICULUM.filter(i => stationOf(i) === id);

// Stabil azonosító a megoldott feladatok megjegyzéséhez (a tartalom határozza meg, nem a sorrend)
export const idOf = item => item.id || item.key || [item.type, item.path, item.n, item.a, item.b, item.op, item.template, item.text, item.useName, item.pairs, item.word?.name, item.mode, item.notes?.join(','), item.animal, item.w, item.goal?.join('-'), item.prefill?.join('-'), item.loops, item.prompt, item.q, item.say]
  .filter(x => x !== undefined && x !== null).join('|');
