// A kert lakói és az etetés adatai. Nincs benne three.js, hogy a Node-tesztek is beolvashassák.
// Egyetlen tábla adja a kertet (ki mikor érkezik, hol lakik) és az etetést (ki mit eszik).

// stars: ennyi összegyűjtött csillagnál érkezik a kertbe (etetéssel hamarabb is megjöhet)
// home: a zuga a kertben [x, z] (a kamerából nézve senki nem takarja a másikat);  height: a modell magassága a saját léptékében
// eats: amit biztosan eszik (ebből lesz jó válasz);  maybe: amit néha megeszik, ezért rossz válasznak NEM használható
export const FRIENDS = [
  { id: 'cat', emoji: '🐱', name: 'cica', stars: 0, home: [0, 1], height: 3.1, eats: ['hal', 'hús'], maybe: ['tojás', 'csont'] },
  { id: 'bunny', emoji: '🐰', name: 'nyuszi', stars: 3, home: [-2.5, 1.2], height: 1.9, eats: ['répa', 'saláta', 'széna'], maybe: ['áfonya', 'bambusz'] },
  { id: 'dog', emoji: '🐶', name: 'kutya', stars: 8, home: [2.4, 1.2], height: 1.55, eats: ['hús', 'csont'], maybe: ['répa', 'saláta', 'tojás', 'hal', 'áfonya'] },
  { id: 'fox', emoji: '🦊', name: 'róka', stars: 15, home: [-4.75, -0.6], height: 1.55, eats: ['hús', 'tojás'], maybe: ['áfonya', 'hal', 'csont'] },
  { id: 'bear', emoji: '🐻', name: 'maci', stars: 30, home: [4.65, -0.6], height: 1.55, eats: ['hal', 'áfonya'], maybe: ['hús', 'tojás', 'répa', 'saláta', 'csont'] },
  { id: 'panda', emoji: '🐼', name: 'panda', stars: 55, home: [2.2, -3.6], height: 1.55, eats: ['bambusz'], maybe: ['répa', 'saláta', 'áfonya'] },
];
export const friendById = id => FRIENDS.find(f => f.id === id);

// Ki van a kertben: akinek megvan a csillaga, vagy akit már megetettek
export const friendsFor = (total, fed = []) => FRIENDS.filter(f => total >= f.stars || fed.includes(f.id)).map(f => f.id);

// Ételek. acc: tárgyeset a tanító mondathoz ("A nyuszi répát eszik."); a ragozott alak ki van írva, nem a gép vezeti le.
// t: kép (emoji); svg: saját rajz, ahol nincs jó emoji.
const SVG = {
  bambusz: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g fill="#7ccf6a" stroke="#3f8f3a" stroke-width="2"><rect x="13" y="8" width="10" height="52" rx="4"/><rect x="29" y="3" width="10" height="57" rx="4"/><rect x="45" y="14" width="9" height="46" rx="4"/></g><path d="M13 24h10M13 42h10M29 21h10M29 40h10M45 30h9M45 46h9" stroke="#3f8f3a" stroke-width="2.5"/><g fill="#4caf50" stroke="#3f8f3a" stroke-width="1.5"><path d="M23 16q10-9 15-1q-8 5-15 1z"/><path d="M39 28q9-9 16-3q-8 6-16 3z"/><path d="M13 33q-8-8-13-1q7 6 13 1z"/></g></svg>',
  széna: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M22 30L8 9l8-3 6 9 2-12 8-1 2 12 6-10 8 3-8 14 12-8 5 6-17 13z" fill="#f2cf63" stroke="#c9972a" stroke-width="2" stroke-linejoin="round"/><path d="M22 36L7 54l7 5 10-10-2 12h20l-2-12 10 10 7-5-15-18z" fill="#f2cf63" stroke="#c9972a" stroke-width="2" stroke-linejoin="round"/><path d="M27 42v14M37 42v14M32 12v14" stroke="#c9972a" stroke-width="2" stroke-linecap="round"/><rect x="19" y="28" width="26" height="10" rx="5" fill="#b5651d"/></svg>',
};
export const FOODS = {
  'répa': { t: '🥕', acc: 'répát' },
  'saláta': { t: '🥬', acc: 'salátát' },
  'széna': { t: '🌾', svg: SVG['széna'], acc: 'szénát' },
  'hal': { t: '🐟', acc: 'halat' },
  'hús': { t: '🍖', acc: 'húst' },
  'csont': { t: '🦴', acc: 'csontot' },
  'bambusz': { t: '🎋', svg: SVG.bambusz, acc: 'bambuszt' },
  'tojás': { t: '🥚', acc: 'tojást' },
  'áfonya': { t: '🫐', acc: 'áfonyát' },
};

// Etetős feladatok: [állat, jó étel, rossz étel, rossz étel]. Egymás után más-más állat jön.
// A nyuszi, a cica, a kutya és a panda párjai a jóváhagyott tervből valók; a rókáé és a macié forrásból
// (lásd README: „Etetés"), a szülő átnézi őket. Rossz válasz csak olyan étel lehet, amit az állat biztosan nem eszik.
export const MEALS = [
  ['bunny', 'répa', 'hús', 'hal'],
  ['cat', 'hal', 'répa', 'széna'],
  ['dog', 'csont', 'széna', 'bambusz'],
  ['panda', 'bambusz', 'hal', 'csont'],
  ['fox', 'hús', 'saláta', 'széna'],
  ['bear', 'hal', 'bambusz', 'széna'],
  ['bunny', 'saláta', 'csont', 'tojás'],
  ['cat', 'hús', 'saláta', 'bambusz'],
  ['dog', 'hús', 'bambusz', 'széna'],
  ['fox', 'tojás', 'bambusz', 'széna'],
  ['bear', 'áfonya', 'széna', 'bambusz'],
  ['bunny', 'széna', 'hal', 'hús'],
];

// Az etetőhely: ide jön az éhes barát, a kamera ide közelít. A kutya zuga előtt van, így a közelképen
// a kutya takarásban marad, a cica pedig oldalt, halványan látszik: az éhes állat a főszereplő.
export const FEED_SPOT = [2.4, 5.0];

// --- virágok helye: determinisztikus, a barátok zugait és az etetőhely előtti sávot szabadon hagyja ---
export const MAX_FLOWERS = 420;
const ZONES = FRIENDS.map(f => ({ x: f.home[0], z: f.home[1], r: f.id === 'cat' ? 1.7 : 1.35 }));
const isFree = (x, z) => !(Math.abs(x - FEED_SPOT[0]) < 1.7 && z > 2.3) && z < 6 && Math.hypot(x, z) < 12.6
  && ZONES.every(o => Math.hypot(x - o.x, z - o.z) > o.r);
const spots = [];
let cand = 0;
function candidate(j) {                 // napraforgó-minta, kifelé ritkulás nélkül; a 2. és 3. réteg a hézagokba ül
  const PER = 300, layer = Math.floor(j / PER), k = j % PER;
  const a = k * 2.39996 + layer * 1.2, r = 2.3 + layer * 0.33 + 0.66 * Math.sqrt(k);
  return { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.62 - 1.0 };
}
export function flowerSpot(i) {
  while (spots.length <= i && cand < 3000) { const p = candidate(cand++); if (isFree(p.x, p.z)) spots.push(p); }
  return spots[Math.min(i, spots.length - 1)];
}
