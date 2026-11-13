// A teljes feladatkészlet egy helyen: generált feladatok (sablonokból) + a még kézzel írt feladatok + etetés.
// Az ütemező ezt a jegyzéket használja; egy bejegyzésből a materialize() készít futtatható feladatot.
import { entries, build, GENERATED } from './engine.js';
import { BASE_ITEMS, FEED_ITEMS, stationOf, idOf } from '../curriculum.js';

// gyakorló feladatok: nincs bennük hibaszám (vonal, betű, útvesztő, pöttyök, rajz, memória) – az ütemező a befejezést számolja
export const PRACTICE = new Set(['trace', 'maze', 'dots', 'draw', 'memory']);
const legacyEntry = it => ({ id: idOf(it), station: stationOf(it), skill: 'legacy.' + stationOf(it), level: 0, graded: !PRACTICE.has(it.type), item: it });

// a kézzel írt feladatok közül csak azok maradnak, amelyek állomása még nem generált
export const LEGACY = BASE_ITEMS.filter(i => !GENERATED.includes(stationOf(i)));
export const POOL = [...entries(), ...LEGACY.map(legacyEntry)];
export const FEED_POOL = FEED_ITEMS.map(legacyEntry);
export const materialize = (e, r) => (e ? e.item || build(e.id, r) : null);
const BY_ID = new Map(entries().map(e => [e.id, e]));
export const entryOf = item => (item.template ? BY_ID.get(item.id) || { id: item.id, station: item.station, skill: item.skill, level: item.level, graded: item.graded, neutral: item.neutral } : legacyEntry(item));

// A korábbi (1.0-s) feladatok azonosítói állomásonként: aki ezekből sokat megoldott, az új készségeken egy szinttel feljebb indul
const OLD = {
  szamol: [/^(count|math)\|/, /^pick\|(Melyik szám|Melyikből van)/, /^order\|Rendezd sorba a számokat/],
  forma: [/^pick\|(Melyik a kör|Melyik a háromszög|Mi van fent|Mi van lent|Melyik piros|Melyik sárga|Merre mutat|Mi van az alma)/],
  okos: [/^memory\|/, /^pick\|(Melyik nem illik|Mi jön ezután\?\|)/],
  hang: [/^clap\|/, /^betu-[A-Z]$/, /^pick\|(Mi rímel|Melyik állat neve kezdődik)/],
  zene: [/^music\|/],
  ceruza: [/^trace\|/, /^betu\|/],
  rajz: [/^draw\|/],
  algo: [/^algo\|/, /^order\|Hogyan készítünk szendvicset/, /^pick\|(Hány taps lesz|Mi jön ezután\? Találd ki|Ha sötét van)/],
};
export function legacySolvedIn(seen, station) {
  const res = OLD[station]; if (!res || !seen) return 0;
  let n = 0; for (const k of Object.keys(seen)) if (res.some(re => re.test(k))) n++;
  return n;
}
