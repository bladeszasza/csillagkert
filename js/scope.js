// A futó feladat "hatóköre": ha a gyerek az X-szel kilép, a feladat MINDEN várakozása megáll.
// A say(), a sleep(), a later() és a hangok mind ezt nézik, így megszakítás után semmi nem beszél
// és semmi nem fut tovább (korábban a számolás, a magyarázat és a robot még másodpercekig folytatódott).
let current = null;                               // AbortSignal vagy null (a jutalomjátékoknál null)

export const setScope = signal => { current = signal || null; };
export const getScope = () => current;
export const aborted = () => !!current?.aborted;
const hang = () => new Promise(() => {});        // soha nem teljesül: a megszakított feladat itt "megfagy"

// Várakozás, ami megszakított feladatnál soha nem tér vissza
export function sleep(ms) {
  const s = current; if (s?.aborted) return hang();
  return new Promise(r => setTimeout(() => { if (!s?.aborted) r(); }, ms));
}
// Késleltetett hívás, ami megszakítás után nem fut le. Visszaadja az időzítő azonosítóját (clearTimeout-hoz).
export function later(fn, ms) {
  const s = current;
  return setTimeout(() => { if (!s?.aborted) fn(); }, ms);
}
// Ismétlődő hívás; megszakításkor magától leáll
export function every(fn, ms) {
  const s = current;
  const id = setInterval(() => { if (s?.aborted) { clearInterval(id); return; } fn(); }, ms);
  s?.addEventListener('abort', () => clearInterval(id), { once: true });
  return id;
}
// Takarítás megszakításkor (pl. 3D jelenet, időzítők)
export function onAbort(fn) { current?.addEventListener('abort', () => { try { fn(); } catch (e) {} }, { once: true }); }
