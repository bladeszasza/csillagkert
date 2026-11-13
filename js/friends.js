// A kert lakói és az etetés adatai. Nincs benne three.js, hogy a Node-tesztek is beolvashassák.
// Egyetlen tábla adja a kertet (ki mikor érkezik, hol lakik) és az etetést (ki mit eszik).

// stars: ennyi összegyűjtött csillagnál érkezik a kertbe (etetéssel hamarabb is megjöhet)
// home: a zuga a kertben [x, z] (a kamerából nézve senki nem takarja a másikat);  height: a modell magassága a saját léptékében
// area: a kert melyik részén lakik (nincs = a kert közepén, a térképen; 'to' = tópart balra; 'tanya' = tanya jobbra)
// eats: amit biztosan eszik (ebből lesz jó válasz);  maybe: amit néha megeszik, ezért rossz válasznak NEM használható.
// Ami egyikben sincs benne, azt a teszt "biztosan nem eszi"-nek veszi – ezért a maybe-be minden kétes étel bekerül.
// Az érkezési csillagszám a jóváhagyott tervből: nyuszi 3, kutya 8, róka 15, kacsa 25, maci 30, sün 40, panda 55, bagoly 70,
// unikornis 90; a többi fajé saját beállítás (lásd README).
export const FRIENDS = [
  { id: 'cat', emoji: '🐱', name: 'cica', stars: 0, home: [0, 1], height: 3.1, eats: ['hal', 'hús'], maybe: ['tojás', 'csont'] },
  { id: 'bunny', emoji: '🐰', name: 'nyuszi', stars: 3, home: [-2.5, 1.2], height: 1.77, eats: ['répa', 'saláta', 'széna'], maybe: ['fű', 'áfonya', 'bambusz', 'alma', 'zab', 'búza', 'kukorica', 'makk', 'dió', 'mogyoró'] },
  { id: 'dog', emoji: '🐶', name: 'kutya', stars: 8, home: [2.4, 1.2], height: 1.33, eats: ['hús', 'csont'], maybe: ['répa', 'saláta', 'tojás', 'hal', 'áfonya', 'alma', 'kukorica', 'fű', 'bogár', 'giliszta', 'zab'] },
  { id: 'fox', emoji: '🦊', name: 'róka', stars: 15, home: [-4.75, -0.6], height: 1.47, eats: ['hús', 'tojás'], maybe: ['áfonya', 'hal', 'csont', 'széna', 'bogár', 'giliszta', 'csiga', 'alma', 'kukorica', 'búza', 'fű', 'makk', 'dió', 'mogyoró'] },
  { id: 'duck', emoji: '🦆', name: 'kacsa', stars: 25, area: 'to', home: [-17.6, -1.8], height: 1.01, eats: ['kukorica', 'saláta', 'vízinövény'], maybe: ['búza', 'zab', 'fű', 'bogár', 'giliszta', 'csiga', 'hal', 'tojás', 'répa', 'áfonya', 'alma', 'hús', 'széna', 'makk', 'dió', 'mogyoró'] },
  { id: 'bear', emoji: '🐻', name: 'maci', stars: 30, home: [4.65, -0.6], height: 1.41, eats: ['hal', 'áfonya', 'hús'], maybe: ['tojás', 'répa', 'saláta', 'csont', 'széna', 'alma', 'makk', 'dió', 'mogyoró', 'kukorica', 'fű', 'bogár', 'giliszta', 'zab', 'búza', 'csiga'] },
  { id: 'frog', emoji: '🐸', name: 'béka', stars: 35, area: 'to', home: [-15.5, 0.5], height: 0.68, eats: [], maybe: [] },
  { id: 'hedgehog', emoji: '🦔', name: 'sün', stars: 40, area: 'to', home: [-14.0, 2.3], height: 0.81, eats: ['bogár', 'giliszta', 'csiga'], maybe: ['alma','tojás', 'hús', 'áfonya', 'hal', 'kukorica', 'csont'] },
  { id: 'hen', emoji: '🐔', name: 'tyúk', stars: 48, area: 'tanya', home: [15.0, 2.6], height: 1.10, eats: ['kukorica', 'búza', 'bogár'], maybe: ['giliszta', 'csiga','saláta', 'fű', 'zab', 'alma', 'répa', 'áfonya', 'tojás', 'hús', 'hal', 'csont', 'széna', 'makk', 'dió', 'mogyoró', 'bambusz', 'vízinövény'] },
  { id: 'panda', emoji: '🐼', name: 'panda', stars: 55, home: [2.2, -3.6], height: 1.41, eats: ['bambusz'], maybe: ['répa', 'saláta', 'áfonya', 'alma', 'tojás', 'hús', 'hal', 'fű', 'kukorica', 'csont'] },
  { id: 'squirrel', emoji: '🐿️', name: 'mókus', stars: 62, area: 'to', home: [-13.9, -2.6], height: 1.16, eats: ['mogyoró', 'dió', 'makk'], maybe: ['alma', 'kukorica', 'búza', 'zab', 'áfonya', 'répa', 'saláta', 'tojás', 'bogár', 'giliszta', 'csiga', 'hús', 'csont', 'fű', 'bambusz'] },
  { id: 'owl', emoji: '🦉', name: 'bagoly', stars: 70, area: 'to', home: [-20.4, -3.0], height: 1.16, sleepy: true, still: true, eats: [], maybe: [] },
  { id: 'mouse', emoji: '🐭', name: 'egér', stars: 80, area: 'to', home: [-20.0, 1.2], height: 0.71, eats: [], maybe: [] },
  { id: 'unicorn', emoji: '🦄', name: 'unikornis', stars: 90, area: 'tanya', home: [14.3, -3.1], height: 2.21, eats: [], maybe: [] },
  { id: 'pig', emoji: '🐷', name: 'malac', stars: 100, area: 'tanya', home: [18.6, 1.8], height: 1.20, eats: [], maybe: [] },
  { id: 'sheep', emoji: '🐑', name: 'bárány', stars: 110, area: 'tanya', home: [13.7, 0.0], height: 1.31, eats: [], maybe: [] },
  { id: 'turtle', emoji: '🐢', name: 'teknős', stars: 120, area: 'to', home: [-17.8, 2.7], height: 0.52, eats: [], maybe: [] },
  { id: 'pony', emoji: '🐴', name: 'póni', stars: 135, area: 'tanya', home: [20.3, -2.4], height: 1.67, eats: ['zab', 'széna', 'alma'], maybe: ['répa', 'fű', 'saláta', 'kukorica', 'búza', 'áfonya', 'bambusz'] },
  { id: 'cow', emoji: '🐮', name: 'tehén', stars: 150, area: 'tanya', home: [17.1, -1.4], height: 1.70, eats: ['fű', 'széna'], maybe: ['zab', 'kukorica', 'búza', 'répa', 'alma', 'saláta', 'csont', 'bambusz', 'áfonya', 'makk'] },
];
export const friendById = id => FRIENDS.find(f => f.id === id);

// A kert két szélső része: ide az alsó sarkokban lévő gombokkal lehet átsiklani (a térkép jelei közben is koppinthatók).
// x: a kamera vízszintes eltolása; a zugok úgy vannak, hogy fekvő és álló képernyőn is mind látsszon, egymást nem takarva.
export const AREAS = [
  { id: 'to', name: 'tópart', x: -17 },
  { id: 'tanya', name: 'tanya', x: 17 },
];
export const areaOf = id => friendById(id)?.area || null;

// Ki van a kertben: akinek megvan a csillaga, vagy akit már megetettek
export const friendsFor = (total, fed = []) => FRIENDS.filter(f => total >= f.stars || fed.includes(f.id)).map(f => f.id);

// Ételek. acc: tárgyeset a tanító mondathoz ("A nyuszi répát eszik."); a ragozott alak ki van írva, nem a gép vezeti le.
// t: kép (emoji); svg: saját rajz, ahol nincs jó emoji.
const SVG = {
  bambusz: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g fill="#7ccf6a" stroke="#3f8f3a" stroke-width="2"><rect x="13" y="8" width="10" height="52" rx="4"/><rect x="29" y="3" width="10" height="57" rx="4"/><rect x="45" y="14" width="9" height="46" rx="4"/></g><path d="M13 24h10M13 42h10M29 21h10M29 40h10M45 30h9M45 46h9" stroke="#3f8f3a" stroke-width="2.5"/><g fill="#4caf50" stroke="#3f8f3a" stroke-width="1.5"><path d="M23 16q10-9 15-1q-8 5-15 1z"/><path d="M39 28q9-9 16-3q-8 6-16 3z"/><path d="M13 33q-8-8-13-1q7 6 13 1z"/></g></svg>',
  széna: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M22 30L8 9l8-3 6 9 2-12 8-1 2 12 6-10 8 3-8 14 12-8 5 6-17 13z" fill="#f2cf63" stroke="#c9972a" stroke-width="2" stroke-linejoin="round"/><path d="M22 36L7 54l7 5 10-10-2 12h20l-2-12 10 10 7-5-15-18z" fill="#f2cf63" stroke="#c9972a" stroke-width="2" stroke-linejoin="round"/><path d="M27 42v14M37 42v14M32 12v14" stroke="#c9972a" stroke-width="2" stroke-linecap="round"/><rect x="19" y="28" width="26" height="10" rx="5" fill="#b5651d"/></svg>',
};
// Saját rajz kell ott, ahol az emoji mást mutat (🌰 gesztenye, 🥜 földimogyoró; 🌾 már a széna) vagy nincs is ilyen.
Object.assign(SVG, {
  búza: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 62V16" stroke="#c9972a" stroke-width="3" stroke-linecap="round"/><path d="M32 6V1M23 14l-5-7M41 14l5-7M22 25l-7-5M42 25l7-5" stroke="#c9972a" stroke-width="1.5" stroke-linecap="round"/><g fill="#f2c94c" stroke="#c9972a" stroke-width="1.5"><ellipse cx="32" cy="12" rx="4.5" ry="7"/><ellipse cx="25" cy="21" rx="4.5" ry="7" transform="rotate(-30 25 21)"/><ellipse cx="39" cy="21" rx="4.5" ry="7" transform="rotate(30 39 21)"/><ellipse cx="25" cy="32" rx="4.5" ry="7" transform="rotate(-30 25 32)"/><ellipse cx="39" cy="32" rx="4.5" ry="7" transform="rotate(30 39 32)"/><ellipse cx="25" cy="43" rx="4.5" ry="7" transform="rotate(-30 25 43)"/><ellipse cx="39" cy="43" rx="4.5" ry="7" transform="rotate(30 39 43)"/></g></svg>',
  zab: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M32 62V10M32 16q-10 4-14 14M32 16q10 4 14 14M32 30q-9 4-12 13M32 30q9 4 12 13M32 44q-6 3-8 9M32 44q6 3 8 9" stroke="#b8a04a" stroke-width="2" fill="none" stroke-linecap="round"/><g fill="#efe3a0" stroke="#b8a04a" stroke-width="1.5"><path d="M32 3q-5 6 0 12q5-6 0-12z"/><path d="M18 29q-6 5-2 12q6-4 2-12z"/><path d="M46 29q6 5 2 12q-6-4-2-12z"/><path d="M20 42q-6 4-3 10q6-3 3-10z"/><path d="M44 42q6 4 3 10q-6-3-3-10z"/><path d="M24 52q-5 3-2 9q5-3 2-9z"/><path d="M40 52q5 3 2 9q-5-3-2-9z"/></g></svg>',
  mogyoró: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M13 30q-4-15 9-21q4 6 10 2q6 4 10-2q13 6 9 21z" fill="#9ccc65" stroke="#689f38" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="41" r="18" fill="#b5651d" stroke="#7a4012" stroke-width="2"/><path d="M18 33q14-7 28 0" stroke="#7a4012" stroke-width="2" fill="none"/><ellipse cx="25" cy="45" rx="4" ry="6" fill="#d9945a" opacity=".7"/></svg>',
  dió: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><ellipse cx="32" cy="33" rx="23" ry="26" fill="#d2a86e" stroke="#8a6436" stroke-width="2"/><path d="M32 8v51" stroke="#8a6436" stroke-width="2.5"/><path d="M22 16q5 6-1 12q6 6 0 12q5 6 1 11M42 16q-5 6 1 12q-6 6 0 12q-5 6-1 11M15 28q4 5 0 10M49 28q-4 5 0 10" stroke="#8a6436" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  makk: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><path d="M18 30q0 26 14 31q14-5 14-31z" fill="#d0913f" stroke="#8a5a20" stroke-width="2"/><path d="M11 31q2-15 21-16q19 1 21 16z" fill="#8a5a2a" stroke="#5e3a16" stroke-width="2" stroke-linejoin="round"/><path d="M17 24h30M14 28h36" stroke="#5e3a16" stroke-width="1.5"/><path d="M32 15q0-7 5-11" stroke="#5e3a16" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="26" cy="43" rx="3" ry="7" fill="#e9b062" opacity=".8"/></svg>',
  fű: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><g fill="#6fcf73" stroke="#3f8f3a" stroke-width="1.5" stroke-linejoin="round"><path d="M9 58q2-22-4-34q12 12 12 34z"/><path d="M17 58q0-30 6-47q3 23 5 47z"/><path d="M27 58q2-29 11-45q-2 25 0 45z"/><path d="M37 58q4-23 17-33q-10 14-8 33z"/><path d="M45 58q4-15 15-19q-8 8-6 19z"/></g><path d="M4 58h56" stroke="#3f8f3a" stroke-width="3" stroke-linecap="round"/></svg>',
  vízinövény: '<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><ellipse cx="32" cy="51" rx="28" ry="10" fill="#7fd0ff" stroke="#3a9ad9" stroke-width="2"/><path d="M24 51q-6-14 0-26q6-12 0-20M32 51q4-14-2-25M40 51q6-12 0-22q-4-8 2-16" stroke="#3f8f3a" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#6fcf73" stroke="#3f8f3a" stroke-width="1.2"><ellipse cx="20" cy="30" rx="6" ry="3" transform="rotate(-30 20 30)"/><ellipse cx="28" cy="18" rx="6" ry="3" transform="rotate(25 28 18)"/><ellipse cx="44" cy="26" rx="6" ry="3" transform="rotate(30 44 26)"/><ellipse cx="36" cy="12" rx="5" ry="2.6" transform="rotate(-20 36 12)"/><ellipse cx="34" cy="35" rx="5" ry="2.6" transform="rotate(-25 34 35)"/></g></svg>',
});
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
  'kukorica': { t: '🌽', acc: 'kukoricát' },
  'búza': { t: '🌾', svg: SVG['búza'], acc: 'búzát' },
  'zab': { t: '🌾', svg: SVG.zab, acc: 'zabot' },
  'alma': { t: '🍎', acc: 'almát' },
  'fű': { t: '🌿', svg: SVG['fű'], acc: 'füvet' },
  'mogyoró': { t: '🌰', svg: SVG['mogyoró'], acc: 'mogyorót' },
  'dió': { t: '🌰', svg: SVG['dió'], acc: 'diót' },
  'makk': { t: '🌰', svg: SVG.makk, acc: 'makkot' },
  'bogár': { t: '🪲', acc: 'bogarat' },
  'giliszta': { t: '🪱', acc: 'gilisztát' },
  'csiga': { t: '🐌', acc: 'csigát' },
  'vízinövény': { t: '🌿', svg: SVG['vízinövény'], acc: 'vízinövényt' },
};

// Etetős feladatok: [állat, jó étel, rossz étel, rossz étel]. Egymás után más-más állat jön.
// A nyuszi, a cica, a kutya és a panda párjai a jóváhagyott tervből valók; a rókáé forrásból (lásd README: „Etetés"),
// a szülő átnézi. Rossz válasz csak olyan étel lehet, amit az állat biztosan nem eszik.
// A maci mindenevő (hal, bogyó, hús, fű, gyökér), ezért nála nincs rossz válasz: a sora [állat, ANY, étel, étel, étel],
// és MINDEGYIK étel jó – a gyerek választja ki, mit ad neki (a szülő döntése). Itt is csak olyan étel állhat, amit biztosan eszik.
export const ANY = '*';
export const MEALS = [
  ['bunny', 'répa', 'hús', 'hal'],
  ['cat', 'hal', 'répa', 'széna'],
  ['dog', 'csont', 'széna', 'bambusz'],
  ['panda', 'bambusz', 'mogyoró', 'makk'],
  ['fox', 'hús', 'saláta', 'bambusz'],
  ['bear', ANY, 'hal', 'áfonya', 'hús'],
  ['bunny', 'saláta', 'csont', 'tojás'],
  ['cat', 'hús', 'saláta', 'bambusz'],
  ['dog', 'hús', 'bambusz', 'széna'],
  ['fox', 'tojás', 'bambusz', 'saláta'],
  ['bunny', 'széna', 'hal', 'hús'],
  // Új barátok. Jó válasz a jóváhagyott tervből (mókus, póni, tehén, kacsa) vagy forrásból (sün, tyúk – README).
  // A kacsa, a sün és a tyúk mindenevő: náluk – a maci mintájára – mindegyik felkínált étel jó.
  ['squirrel', 'mogyoró', 'hal', 'széna'],
  ['duck', ANY, 'kukorica', 'saláta', 'vízinövény'],
  ['pony', 'zab', 'hús', 'hal'],
  ['hedgehog', ANY, 'bogár', 'giliszta', 'csiga'],
  ['cow', 'fű', 'hal', 'hús'],
  ['hen', ANY, 'kukorica', 'búza', 'bogár'],
  ['squirrel', 'dió', 'hal', 'széna'],
  ['pony', 'alma', 'hús', 'csont'],
  ['cow', 'széna', 'hal', 'tojás'],
  ['squirrel', 'makk', 'széna', 'hal'],
  ['pony', 'széna', 'hal', 'csont'],
];

// Az etetőhely: ide jön az éhes barát, a kamera ide közelít; a többi barát a háttérben halványul.
// FEED_GATE: az első sor tereptárgyai mellett (jobbról) megy ki a barát az etetőhelyre, nem a tárgyakon keresztül.
export const FEED_SPOT = [4.7, 5.0];
export const FEED_GATE = [4.7, 2.3];

// Az állomások HELYEK a kertben (id = az állomás azonosítója). Hátul a magas tereptárgyak (a cica mögött üres a hely,
// hogy semmi ne bújjon el mögötte), elöl, a barátok előtt az alacsonyak.
// x, z: a tereptárgy helye;  scale: méret;  sign: [magasság, előre-tolás] – ide kerül a megkoppintható jel a képernyőn.
// A két sor fekvő és álló képernyőn is elfér úgy, hogy a jelek nem takarják sem egymást, sem a barátokat, sem a gombokat.
const BACK_Z = -7, FRONT_Z = 3.2;
export const PLACES = [
  { id: 'ido', x: -6.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'hang', x: -4.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'ceruza', x: -2.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'egeszseg', x: 2.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'vilag', x: 4.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'algo', x: 6.9, z: BACK_Z, r: 1.2, sign: [2.75, 0] },
  { id: 'rajz', x: -3.45, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
  { id: 'szamol', x: -2.3, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
  { id: 'forma', x: -1.15, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
  { id: 'okos', x: 0, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
  { id: 'zene', x: 1.15, z: FRONT_Z, r: 0.7, scale: 0.44, sign: [0, 0.3] },
  { id: 'test', x: 2.3, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
  { id: 'allat', x: 3.45, z: FRONT_Z, r: 0.7, sign: [0, 0.3] },
];

// --- virágok helye: determinisztikus; szabadon hagyja a barátok zugait, a tereptárgyakat és az etetőhely előtti sávot ---
// Egyszerre legfeljebb MAX_FLOWERS virág nyílik (a szülő kérésére ne nőjön túl a kert): az új csillag virága a legrégebbi
// helyére nő, az a régi előbb elhervad. 70, mert a 71. hely már a feladatjelek elé, a képernyő aljára esne.
export const MAX_FLOWERS = 70;
// Az aranyvirágok (ajándék) a külső gyűrűn nyílnak: nem a feladatjelek előtt, és egyik virágra sem lógnak rá.
export const GOLD_MAX = 60;
const SIGN_FRONT = 4.3, SIGN_WIDE = 4.9;                 // az alsó jelsor előtti sáv (a jelek és a Tovább gomb fölött)
export const beforeSigns = p => p.z > SIGN_FRONT && Math.abs(p.x) < SIGN_WIDE;
const gold = [];
export function goldSpot(k) {
  for (let i = 420 + (gold.length ? gold.at(-1).i + 1 - 420 : 0); gold.length <= k && i < 2400; i++) {
    const p = flowerSpot(i);
    if (beforeSigns(p)) continue;
    const near = q => Math.hypot(p.x - q.x, p.z - q.z) < 0.75;
    if (gold.some(near) || Array.from({ length: MAX_FLOWERS }, (_, j) => flowerSpot(j)).some(near)) continue;
    gold.push({ ...p, i });
  }
  return gold[Math.min(k, gold.length - 1)];
}
const ZONES = [...FRIENDS.map(f => ({ x: f.home[0], z: f.home[1], r: f.id === 'cat' ? 1.7 : 1.35 })), ...PLACES.filter(p => p.z < 0).map(p => ({ x: p.x, z: p.z, r: p.r }))];
const isFree = (x, z) => !(Math.abs(x - FEED_SPOT[0]) < 1.7 && z > 1.6) && !(z > 2.4 && z < 4.3 && Math.abs(x) < 4.3) && z < 6 && Math.hypot(x, z) < 12.6
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
