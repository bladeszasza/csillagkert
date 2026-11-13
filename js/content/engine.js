// Tartalom-motor: sablon + ellenőrzött szóbank → feladat.
// Egy sablon: { id, station, skill, icon, graded?, targets() → [{ key, level, ...paraméterek }], make(cél, rng) → feladat, solve(feladat) → helyes válasz }.
//   - A cél (target) dönti el a helyes választ; az azonosító `${sablon}:${kulcs}`. Egy cél = egy önálló feladat.
//   - Az eltérítők, a képek sorrendje és a díszítő tárgyak bemutatásonként változnak (rng), ezek NEM számítanak új feladatnak.
//   - solve() a feladatból (amit a gyerek lát és hall) számolja ki a választ, a make()-től függetlenül: ezt ellenőrzik a tesztek.
import { rng } from './rng.js';
import { SZAMOL } from './szamol.js';
import { FORMA } from './forma.js';
import { OKOS } from './okos.js';
import { HANG } from './hang.js';
import { ZENE } from './zene.js';
import { ALGO } from './algo.js';
import { CERUZA } from './ceruza.js';

export const TEMPLATES = [...SZAMOL, ...FORMA, ...OKOS, ...HANG, ...ZENE, ...ALGO, ...CERUZA];
export const GENERATED = [...new Set(TEMPLATES.map(t => t.station))];
const BY_ID = new Map(TEMPLATES.map(t => [t.id, t]));
const TARGETS = new Map();

export function targetsOf(t) {
  if (!TARGETS.has(t.id)) {
    const list = t.targets().map(x => ({ ...x, id: `${t.id}:${x.key}` }));
    TARGETS.set(t.id, { list, byId: new Map(list.map(x => [x.id, x])) });
  }
  return TARGETS.get(t.id).list;
}
export const templateOf = id => BY_ID.get(String(id).slice(0, String(id).indexOf(':')));

// Könnyű jegyzék az ütemezőnek: minden generált feladat azonosítója, állomása, készsége és szintje
let ENTRIES = null;
export function entries() {
  if (!ENTRIES) {
    ENTRIES = TEMPLATES.flatMap(t => targetsOf(t).map(x => ({ id: x.id, template: t.id, station: t.station, skill: t.skill, level: x.level, graded: t.graded !== false })));
    // top: a készség legnehezebb szintje (aki ezt megoldja, annak a sikere a terület szintlépésébe is beleszámít)
    const top = new Map(); for (const e of ENTRIES) top.set(e.skill, Math.max(top.get(e.skill) || 0, e.level));
    for (const e of ENTRIES) e.top = top.get(e.skill);
  }
  return ENTRIES;
}

// Egy feladat felépítése az azonosítójából (bemutatásonként más rng: más eltérítők, más sorrend)
export function build(id, r = rng()) {
  const t = templateOf(id); if (!t) return null;
  targetsOf(t);
  const target = TARGETS.get(t.id).byId.get(id); if (!target) return null;
  const item = t.make(target, r);
  return { icon: t.icon, ...item, id, station: t.station, skill: t.skill, level: target.level, template: t.id, graded: t.graded !== false };
}
