// A Varázsvilág térképe (M7): a terep és a nevezetességek helye a világ magjából, számolással (semmit nem tárol).
// Tiszta modul (nincs 3D, nincs hang): a játék (js/rewards/openworld.js) és a Node-tesztek is ezt használják.
//
// Nevezetességek: a világ CELL méretű cellákra oszlik, minden cellában egy nevezetesség áll. A fajtájuk rácsmintát követ
// (bármelyik cella négy szomszédja közt mind a négy fajta megvan), így egyik sincs messze. A kezdőhely cellájában a
// nevezetesség 36–42 egységre van a kezdőponttól: néhány másodperc futás, rövid jutalomidő alatt is odaér a gyerek.
// A nevezetesség körül a talaj sík (SITE_FLAT), és akadály sem nő ott (SITE_CLEAR).

export const CELL = 110;            // egy cella oldala (két nevezetesség között kb. 15 másodperc futás)
export const SITE_FLAT = 7;         // ekkora körben teljesen sík a talaj a nevezetesség körül
export const SITE_BLEND = 6;        // ezen a sávon simul vissza a dombokba
export const SITE_CLEAR = 8.5;      // ezen belül nincs fa, kő, rönk, tócsa, és barát sem áll ott
export const FIND_R = 4.5;          // ennyire kell megközelíteni, hogy "megtalálta"

// A mondatok kézzel írtak (ragozott alakokkal), legfeljebb tizenkét szó, számjegy nélkül.
export const LANDMARKS = [
  { id: 'kut', name: 'Csillagkút', found: 'Megtaláltad a Csillagkutat! Csillagok úsznak a vizében.', way: 'Arra van a Csillagkút. Kövesd a kis fényt!' },
  { id: 'kokor', name: 'Ősi kőkör', found: 'Megtaláltad az Ősi kőkört! Nagyon régen rakták ide a köveket.', way: 'Arra van az Ősi kőkör. Kövesd a kis fényt!' },
  { id: 'fa', name: 'Varázsfa', found: 'Megtaláltad a Varázsfát! Színes lámpások lógnak az ágain.', way: 'Arra van a Varázsfa. Kövesd a kis fényt!' },
  { id: 'kapu', name: 'Szivárványkapu', found: 'Megtaláltad a Szivárványkaput! Fuss át alatta!', way: 'Arra van a Szivárványkapu. Kövesd a kis fényt!' },
];
export const landmarkById = id => LANDMARKS.find(l => l.id === id) || null;
export const WORLD_LINES = {
  start: 'Varázsvilág! Koppints oda, ahová fusson az unikornis. Kövesd a kis fényt!',
  startAll: 'Varázsvilág! Koppints oda, ahová fusson az unikornis. Köszönj a barátoknak!',
  notYet: 'Ezt még keressük! Kövesd a kis fényt!',
  again: 'Ezt már megtaláltuk. Nézzük meg újra!',
};

const smooth = t => t * t * (3 - 2 * t);
export const hash2 = (x, z, s) => { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + s) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mod = (a, n) => ((a % n) + n) % n;

// Egy cella nevezetessége: { key, cx, cz, type, x, z }
export function siteOfCell(seed, cx, cz) {
  const n = LANDMARKS.length, type = LANDMARKS[mod(cx + 2 * cz + mod(seed, n), n)].id;
  let x, z;
  if (cx === 0 && cz === 0) { const a = hash2(0, 0, seed + 31) * Math.PI * 2, d = 36 + hash2(1, 0, seed + 31) * 6; x = Math.sin(a) * d; z = Math.cos(a) * d; }
  else { x = cx * CELL + (hash2(cx, cz, seed + 31) - 0.5) * 56; z = cz * CELL + (hash2(cx, cz, seed + 53) - 0.5) * 56; }
  return { key: cx + ',' + cz, cx, cz, type, x, z };
}
export const cellOf = v => Math.round(v / CELL);

// --- determinisztikus zaj és terep (a világ magja alapján) ---
export function makeTerrain(seed) {
  const h2 = (x, z, s = seed) => hash2(x, z, s);
  function noise(x, z) {
    const x0 = Math.floor(x), z0 = Math.floor(z), fx = smooth(x - x0), fz = smooth(z - z0);
    const a = h2(x0, z0), b = h2(x0 + 1, z0), c = h2(x0, z0 + 1), d = h2(x0 + 1, z0 + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }
  // a dombok a nevezetességek nélkül
  function raw(x, z) {
    const d = Math.hypot(x, z), flat = smooth(Math.min(1, d / 14));        // a kezdőpont körül sík
    return ((noise(x * 0.035, z * 0.035) - 0.5) * 6 + (noise(x * 0.1, z * 0.1) - 0.5) * 1.4) * flat;
  }
  const cache = new Map();
  // a pont cellájának nevezetessége (y: a talaj magassága ott)
  function siteAt(x, z) {
    const cx = cellOf(x), cz = cellOf(z), k = cx + ',' + cz;
    let s = cache.get(k);
    if (!s) { if (cache.size > 600) cache.clear(); s = siteOfCell(seed, cx, cz); s.y = raw(s.x, s.z); cache.set(k, s); }
    return s;
  }
  // A nevezetesség körül sík a talaj, a szélén simán olvad vissza a dombokba. (A simító sáv a saját celláján belül marad.)
  function heightAt(x, z) {
    const h = raw(x, z), s = siteAt(x, z), d = Math.hypot(x - s.x, z - s.z);
    if (d >= SITE_FLAT + SITE_BLEND) return h;
    return s.y + (h - s.y) * smooth(Math.max(0, (d - SITE_FLAT) / SITE_BLEND));
  }
  // a közeli nevezetességek (a pont cellája és a körülötte lévő gyűrűk)
  function sitesNear(x, z, ring = 1) {
    const cx = cellOf(x), cz = cellOf(z), out = [];
    for (let a = -ring; a <= ring; a++) for (let b = -ring; b <= ring; b++) out.push(siteAt((cx + a) * CELL, (cz + b) * CELL));
    return out;
  }
  return { hash2: h2, noise, heightAt, siteAt, sitesNear };
}

// A vezető fény célja: a legközelebbi még meg nem talált fajta; ha már mind megvan, a legközelebbi, ami nem épp itt áll.
export function guideGoal(terrain, x, z, found) {
  const dist = s => Math.hypot(s.x - x, s.z - z);
  const all = terrain.sitesNear(x, z, 2).sort((a, b) => dist(a) - dist(b));
  return all.find(s => !found.has(s.type)) || all.find(s => dist(s) > 25) || all[0];
}

// --- Gyűjtögetés és kalandok (M7, 2. szelet) ---
// Egyszerre egy kaland fut: egyféle csillogó dolgot kell összegyűjteni (a képernyő sarkában a képe és a megtelő pöttyök
// mutatják, olvasni nem kell). Ha megvan mind, ajándék jár (ugyanabból az ajándéklétrából, mint mindenhol: js/economy.js),
// és jön a következő kaland. Az állás (melyik kaland, hány darab van már) a profilban marad.
// A dolgok helye a világ magjából számolódik, saját véletlen-sorral: a fák, kövek és barátok helyét nem változtatja meg.
export const ITEM_P = 0.2;          // ekkora eséllyel van egy chunkban gyűjthető dolog (egy chunk kb. négy másodperc futás)
export const PICK_R = 1.5;          // ennyire kell odaérni (ugrás közben is jó)
export const TRAIL = [12, 18, 24];  // a kezdőhelytől az első nevezetesség felé vezető nyom: innen tanulja meg, mit kell szedni
export const ITEMS = [
  { id: 'szilank', name: 'csillagszilánk' },
  { id: 'mag', name: 'virágmag' },
  { id: 'toll', name: 'madártoll' },
  { id: 'kristaly', name: 'kristály' },
];
export const ADVENTURES = [
  { item: 'szilank', need: 12, intro: 'Gyűjtsünk csillagszilánkot! Csillognak a fűben.', done: 'Megvan az összes csillagszilánk! Ügyes voltál!' },
  { item: 'mag', need: 14, intro: 'Gyűjtsünk virágmagot a kertbe!', done: 'Megvan az összes virágmag! Köszönöm a segítséget!' },
  { item: 'toll', need: 16, intro: 'A madarak elhagyták a tollukat. Szedjük össze!', done: 'Megvan az összes toll! A madarak nagyon örülnek.' },
  { item: 'kristaly', need: 18, intro: 'Gyűjtsünk csillogó kristályt!', done: 'Megvan az összes kristály! Ragyog a kosarunk.' },
];
export const ADV_MAX = 9999;
// az i-edik kaland (körbe jár: az ötödik újra csillagszilánk)
export const adventureAt = i => ({ ...ADVENTURES[mod(Math.floor(+i || 0), ADVENTURES.length)], i: Math.max(0, Math.floor(+i || 0)) });
// a mentett kalandállás rendbetétele (megbízhatatlan adatból is): { i, n }, ahol 0 <= n <= a kaland darabszáma
export function cleanAdventure(a) {
  const ok = v => v !== null && v !== '' && Number.isFinite(+v);
  const i = a && ok(a.i) ? Math.max(0, Math.min(ADV_MAX, Math.floor(+a.i))) : 0;
  const n = a && ok(a.n) ? Math.max(0, Math.min(adventureAt(i).need, Math.floor(+a.n))) : 0;
  return { i, n };
}
// Egy chunk gyűjthető dolgai: { key, x, z }. size: a chunk oldala (js/rewards/openworld.js). A kulcs a világban egyedi,
// így amit a gyerek felszedett, az a chunk újragyártásakor sem bukkan fel újra (a játékon belül).
export function itemSpots(seed, cx, cz, size) {
  const out = [], ox = cx * size, oz = cz * size, m = 3;
  if (hash2(cx, cz, seed + 211) < ITEM_P) {
    const x = ox + (hash2(cx, cz, seed + 223) - 0.5) * (size - 2 * m), z = oz + (hash2(cx, cz, seed + 227) - 0.5) * (size - 2 * m);
    if (Math.hypot(x, z) > 8) out.push({ key: cx + ',' + cz, x, z });
  }
  const s0 = siteOfCell(seed, 0, 0), d0 = Math.hypot(s0.x, s0.z);
  TRAIL.forEach((r, k) => {
    const x = s0.x / d0 * r, z = s0.z / d0 * r;
    if (Math.floor((x + size / 2) / size) === cx && Math.floor((z + size / 2) / size) === cz) out.push({ key: 'nyom' + k, x, z });
  });
  return out;
}

// --- Élőhelyek (M7, 3. szelet) ---
// A világ nagy foltokban más-más tájat mutat. Az élőhely csak a színeket, az égboltot, a levegőben szálló apróságokat és a
// hangokat változtatja: a fák, kövek és barátok helye és száma ugyanaz marad (a mentett világok nem változnak).
// Két lassú zajmező (a magból, saját sóval) egy pontot ad egy kis "térképen"; az élőhely a legközelebbi középpont, a
// határon a színek simán olvadnak egymásba. A kezdőhely körül mindig virágrét van (ott kezdődik a játék, ott a kert kapuja).
export const HOME_R = 70, HOME_BLEND = 30;
export const BIOMES = [
  { id: 'ret', name: 'Virágrét', line: 'Virágrét! Pillangók repkednek.', c: [0.5, 0.5],
    ground: [0x8fd98a, 0x9be08f, 0x86d082, 0xa6e59a], crowns: [0x6fcf7f, 0x57c46f, 0xffa8d4, 0x8fe08f],
    flowers: [0xff8fc8, 0xffcf3f, 0xffffff, 0x9bb8ff, 0xc9a0ff, 0xff9f43], rock: 0xb8b0c8, puddle: 0x8fd0ff, sky: 0xbfe9ff,
    mote: 'lepke', sounds: ['chirp', 'trill'] },
  { id: 'erdo', name: 'Tündérerdő', line: 'Tündérerdő! Világító virágok nőnek itt.', c: [0.32, 0.36],
    ground: [0x4f9a86, 0x58a48f, 0x47917e, 0x5fae96], crowns: [0x2f8a6a, 0x3f9a78, 0x7fd0c0, 0x9b7fe0],
    flowers: [0x9bf0ff, 0xc9a0ff, 0xfff08a, 0x7fffd0, 0xff9fe0, 0xffffff], rock: 0x9fa8c0, puddle: 0x7fc8e0, sky: 0x9fd4cc,
    mote: 'feny', sounds: ['cincin', 'hoot'] },
  { id: 'osz', name: 'Őszi erdő', line: 'Őszi erdő! Színes levelek hullanak.', c: [0.68, 0.36],
    ground: [0xd9c46a, 0xcdb85e, 0xe0cc78, 0xc8b058], crowns: [0xff9f43, 0xf2545b, 0xffcf3f, 0xe07a3a],
    flowers: [0xff9f43, 0xffcf3f, 0xf2545b, 0xffffff, 0xc98a5a, 0xffe0a0], rock: 0xc0a890, puddle: 0x9fc8e0, sky: 0xffe2c4,
    mote: 'level', sounds: ['peep', 'chirp'] },
  { id: 'kristaly', name: 'Kristálydombok', line: 'Kristálydombok! Csillognak a kövek.', c: [0.32, 0.66],
    ground: [0xc8b8f0, 0xd0c2f4, 0xbfaee8, 0xd8ccf8], crowns: [0xb0e8ff, 0xffc0e8, 0xd0b0ff, 0x9bf0ff],
    flowers: [0xffffff, 0x9bf0ff, 0xffc0e8, 0xd0b0ff, 0xfff08a, 0xb0ffd0], rock: 0x9bf0ff, puddle: 0xc0e8ff, sky: 0xe0d4ff,
    mote: 'szikra', sounds: ['cincin'] },
  { id: 'ho', name: 'Havas domb', line: 'Havas domb! Hull a hó.', c: [0.68, 0.66],
    ground: [0xf4f8ff, 0xeaf2fc, 0xffffff, 0xe2ecf8], crowns: [0x5fa880, 0x6ab48a, 0xe8f4ff, 0x58a078],
    flowers: [0xffffff, 0xd8ecff, 0xff8fc8, 0xffffff, 0xbfe0ff, 0xffd0e8], rock: 0xd0d8e8, puddle: 0xd8f0ff, sky: 0xe8f4ff,
    mote: 'ho', sounds: ['peep'] },
];
export const biomeById = id => BIOMES.find(b => b.id === id) || null;
const TAU = 0.018;                 // a határ élessége (kisebb = élesebb, de mindig folytonos)
// Az élőhelyek súlya egy pontban (összegük 1). out: újrahasznosítható tömb.
export function makeBiomes(seed) {
  const n = salt => (x, z) => {
    const x0 = Math.floor(x), z0 = Math.floor(z), fx = smooth(x - x0), fz = smooth(z - z0);
    const a = hash2(x0, z0, seed + salt), b = hash2(x0 + 1, z0, seed + salt), c = hash2(x0, z0 + 1, seed + salt), d = hash2(x0 + 1, z0 + 1, seed + salt);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
  const na = n(401), nb = n(433), F = 0.005;      // egy folt kb. kétszáz egység (fél perc futás)
  function weights(x, z, out = new Array(BIOMES.length)) {
    const u = na(x * F, z * F), v = nb(z * F + 31.7, -x * F + 57.3), r = Math.hypot(x, z);   // a második mező elforgatva és eltolva: a kettő független
    const away = smooth(Math.max(0, Math.min(1, (r - HOME_R) / HOME_BLEND)));   // 0 a kezdőhely körül, 1 messze
    let sum = 0;
    for (let i = 0; i < BIOMES.length; i++) {
      const [cu, cv] = BIOMES[i].c; let d2 = (u - cu) ** 2 + (v - cv) ** 2;
      if (i > 0) d2 += (1 - away) * 0.5;                 // otthon közelében a többi élőhely "messze van"
      out[i] = Math.exp(-d2 / TAU); sum += out[i];
    }
    if (!(sum > 0)) { out.fill(0); out[0] = 1; return out; }
    for (let i = 0; i < out.length; i++) out[i] /= sum;
    return out;
  }
  const W = new Array(BIOMES.length);
  // a pont fő élőhelye
  function biomeAt(x, z) { weights(x, z, W); let k = 0; for (let i = 1; i < W.length; i++) if (W[i] > W[k]) k = i; return BIOMES[k]; }
  return { weights, biomeAt };
}
// egy színpaletta adott fokának keverése a súlyok szerint (hex szín)
export function mixHex(w, pick) {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < w.length; i++) { if (w[i] < 1e-4) continue; const h = pick(BIOMES[i]); r += ((h >> 16) & 255) * w[i]; g += ((h >> 8) & 255) * w[i]; b += (h & 255) * w[i]; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
