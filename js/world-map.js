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
