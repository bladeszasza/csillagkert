// Adaptív ütemező – tiszta függvények (Node-ban tesztelhető: az idő és a véletlen kívülről jön).
// Elvek (docs/pedagogia.md): öt nehézségi szint területenként (állomásonként, mint a DIFER-ben), a területen belül
// a készségek váltakoznak (kevert gyakorlás), elosztott ismétlés, magas sikerarány.
// A számok (3 siker a szintlépéshez, 2 segített megoldás a visszalépéshez, 1–3–7–14 napos ismétlés, a sikerarány
// sávjai) AZ ÉN KIINDULÓ BEÁLLÍTÁSAIM az elvek alapján, nem kutatásból átvett értékek: a tapasztalat szerint hangolandók.
//
// A gyerek állása (progress) ezeket a mezőket kapja:
//   sk: { 'st.<állomás>': { lv, ok, bad, n, at } } – a terület szintje (1–5) és a sikersorozatok
//       { készség: { n, at } }                  – a készség gyakorlásainak száma és utolsó ideje (a váltogatáshoz)
//   rv: { azonosító: { b, due } }             – ismétlési doboz (0–4) és a következő ismétlés ideje
//   hist: [true/false]                         – az utolsó 20 értékelt feladat: elsőre sikerült-e
//   lastSt: [állomás, állomás]                 – az utolsó két állomás (ne jöjjön egymás után ugyanaz)
//   stAt: { állomás: időbélyeg }               – mikor volt utoljára az adott állomás
export const DAY = 864e5;
export const INTERVALS = [1, 3, 7, 14];          // napok: az elsőre sikerült feladat ennyi idő múlva tér vissza
export const UP_AFTER = 3, DOWN_AFTER = 2, MAX_LEVEL = 5, HIST = 20;
export const startLevel = age => (age >= 7 ? 3 : age >= 6 ? 2 : 1);

const shuffled = (arr, rand) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickRand = (arr, rand) => arr[Math.floor(rand() * arr.length)];

export function ensure(state) {
  for (const k of ['sk', 'rv', 'stAt', 'seen']) if (!state[k] || typeof state[k] !== 'object' || Array.isArray(state[k])) state[k] = {};
  for (const k of ['hist', 'lastSt']) if (!Array.isArray(state[k])) state[k] = [];
  return state;
}
// elsőre jó arány az utolsó feladatokból (kevés adatnál a célsáv közepe)
export const rate = state => (state.hist?.length >= 5 ? state.hist.filter(Boolean).length / state.hist.length : 0.8);
export const isLegacy = skill => String(skill).startsWith('legacy.');

// Egy terület (állomás) szintje. Kezdőszint az életkorból; aki a régi feladatokból sokat megoldott itt, egy szinttel feljebb indul
export const ladderKey = station => 'st.' + station;
export function levelOf(state, station, legacySolved = 0) {
  ensure(state);
  const k = ladderKey(station);
  if (!state.sk[k]) state.sk[k] = { lv: Math.min(MAX_LEVEL, Math.max(startLevel(state.age), legacySolved >= 8 ? 2 : 1)), ok: 0, bad: 0, n: 0, at: 0 };
  return state.sk[k];
}

// a még nem látott közül véletlenszerűen, különben a legrégebben látott
export function freshest(list, state, rand) {
  const unseen = list.filter(e => state.seen[e.id] === undefined);
  if (unseen.length) return pickRand(unseen, rand);
  let best = null; for (const e of list) if (!best || state.seen[e.id] < state.seen[best.id]) best = e;
  return best;
}

// Állomás a "Tovább" gombhoz: nem az utolsó kettő közül, a legrégebben látogatottak közül (kis véletlennel)
export function chooseStation(state, stations, rand) {
  ensure(state);
  const free = stations.filter(s => !state.lastSt.includes(s));
  const cand = shuffled(free.length ? free : stations, rand).sort((a, b) => (state.stAt[a] || 0) - (state.stAt[b] || 0));
  return pickRand(cand.slice(0, Math.min(3, cand.length)), rand);
}

// Feladat egy állomáson belül: esedékes ismétlés, különben a legrégebben gyakorolt készség a gyerek szintjén
export function chooseInStation(state, list, rand, now, legacySolved = () => 0) {
  ensure(state);
  if (!list.length) return null;
  const due = list.filter(e => state.rv[e.id] && state.rv[e.id].due <= now);
  const share = rate(state) < 0.7 ? 0.45 : 0.3;
  if (due.length && rand() < share) return due.reduce((a, b) => (state.rv[a.id].due <= state.rv[b.id].due ? a : b));
  // csak az a készség jön, amelyiknek a legkönnyebb feladata legfeljebb egy szinttel van a gyerek szintje fölött
  // (kezdőnek nem jön bontás vagy sorszám, amíg a számolás alapjai nem mennek)
  const minLv = new Map();
  for (const e of list) minLv.set(e.skill, Math.min(minLv.get(e.skill) ?? 9, e.level || 0));
  const gen = list.find(e => !isLegacy(e.skill)), here = gen && levelOf(state, gen.station, legacySolved(gen.station)).lv;
  const all = [...minLv.keys()];
  let fit = gen ? all.filter(k => isLegacy(k) || minLv.get(k) <= here + 1) : all;
  // az első két feladat egy generált állomáson a bevezető készségekből jön (amelyik a legkönnyebb szinten kezdődik):
  // a Robotpályán így előbb programot épít vagy előrejelez a gyerek, és csak utána jön hibakeresés vagy ismétlés – idősebbnek is
  if (gen && list.filter(e => state.seen[e.id] !== undefined).length < 2) {
    const g = all.filter(k => !isLegacy(k)), low = Math.min(...g.map(k => minLv.get(k)));
    fit = g.filter(k => minLv.get(k) === low);
  }
  // a legrégebben gyakorolt készség jön; ha annak a gyerek szintje körül már nincs új feladata, a következő készség
  let spare = null;
  for (const skill of shuffled(fit.length ? fit : all, rand).sort((a, b) => (state.sk[a]?.at || 0) - (state.sk[b]?.at || 0))) {
    const mine = list.filter(e => e.skill === skill);
    if (isLegacy(skill)) return freshest(mine, state, rand);
    const e = inSkill(state, mine, rand, legacySolved);
    if (state.seen[e.id] === undefined) return e;
    spare ??= e;
  }
  return spare;
}
function inSkill(state, mine, rand, legacySolved) {
  const s = levelOf(state, mine[0].station, legacySolved(mine[0].station));
  const r = rate(state), challenge = r > 0.9 ? 0.35 : r < 0.7 ? 0 : 0.2, warm = r < 0.7 ? 0.4 : 0.15;
  const x = rand();
  let want = s.lv + (x < challenge ? 1 : x < challenge + warm ? -1 : 0);
  const levels = [...new Set(mine.map(e => e.level))].sort((a, b) => a - b);
  const below = levels.filter(l => l <= want);
  const lv = below.length ? below[below.length - 1] : levels[0];
  // ha ezen a szinten már mindet látta, a legközelebbi szint (legfeljebb eggyel a kívánt vagy a választott fölött) még nem látott feladata jön
  // (bemelegítéskor a kívánt szint a választott alatt is lehet: ilyenkor is szabad egy szinttel feljebb nézni)
  const atLv = mine.filter(e => e.level === lv);
  if (!atLv.some(e => state.seen[e.id] === undefined)) {
    const near = levels.filter(l => l !== lv && l <= Math.max(want, lv) + 1).sort((a, b) => Math.abs(a - lv) - Math.abs(b - lv) || a - b);
    for (const l of near) { const fresh = mine.filter(e => e.level === l && state.seen[e.id] === undefined); if (fresh.length) return pickRand(fresh, rand); }
  }
  return freshest(atLv, state, rand);
}

export function chooseNext(state, pool, feedPool, rand, now, legacySolved) {
  ensure(state);
  if (feedPool.length && (state.sinceFeed || 0) >= (state.feedGap || 2)) return freshestInOrder(feedPool, state);
  const stations = [...new Set(pool.map(e => e.station))];
  const st = chooseStation(state, stations, rand);
  return chooseInStation(state, pool.filter(e => e.station === st), rand, now, legacySolved);
}
// az etetés a régi rend szerint: az első még nem látott, különben a legrégebben látott (a lista sorrendje váltogatja az állatokat)
export function freshestInOrder(list, state) {
  let best = null;
  for (const e of list) { const t = state.seen[e.id]; if (t === undefined) return e; if (!best || t < state.seen[best.id]) best = e; }
  return best;
}

// Egy lefutott feladat eredménye. outcome: { wrong, aborted }
export function record(state, entry, outcome = {}, now = Date.now(), legacySolved = 0) {
  ensure(state);
  state.seen[entry.id] = now;
  state.stAt[entry.station] = now;
  state.lastSt = [...state.lastSt.filter(s => s !== entry.station), entry.station].slice(-2);
  if (outcome.aborted) return;
  // gyakorló feladatnál nincs tévedés; a "help" azt számolja, hányszor kellett a feladatnak segítenie (tétlenség után
  // felvillanó következő pont). Két segítségtől elakadásnak számít: nem lép feljebb, és két ilyen után könnyebb jön.
  const wrong = Math.max(0, Math.floor(+outcome.wrong || 0)), help = Math.max(0, Math.floor(+outcome.help || 0));
  const stuck = entry.graded === false && help >= 2, first = wrong === 0 && !stuck;
  // ismétlés: elsőre jó → a következő dobozba (1, 3, 7, 14 nap); különben holnap újra
  const box = state.rv[entry.id]?.b || 0, b = first ? Math.min(INTERVALS.length, box + 1) : 0;
  state.rv[entry.id] = { b, due: now + INTERVALS[Math.max(0, b - 1)] * DAY };
  if (!entry.skill || isLegacy(entry.skill)) return;
  const sk = state.sk[entry.skill] || (state.sk[entry.skill] = { n: 0, at: 0 });
  sk.at = now; sk.n = (sk.n || 0) + 1;
  const s = levelOf(state, entry.station, legacySolved);
  s.at = now; s.n++;
  // a gyerek szintjén (vagy a készség legnehezebb szintjén, ha az alacsonyabb) megoldott feladat számít a szintlépéshez
  const atLevel = (entry.level || 0) >= Math.min(s.lv, entry.top ?? Infinity);
  if (entry.graded === false) {                   // gyakorló feladat (vonal, betű, rajz, memória): nincs hibaszám, a befejezés számít
    if (stuck) { s.ok = 0; if (++s.bad >= DOWN_AFTER) { s.lv = Math.max(1, s.lv - 1); s.bad = 0; } }
    else if (help === 0) { s.bad = 0; if (atLevel && ++s.ok >= UP_AFTER) { s.lv = Math.min(MAX_LEVEL, s.lv + 1); s.ok = 0; } }
    return;                                       // egy segítség: semleges
  }
  state.hist = [...state.hist, first].slice(-HIST);
  if (first) {
    s.bad = 0;
    if (atLevel && ++s.ok >= UP_AFTER) { s.lv = Math.min(MAX_LEVEL, s.lv + 1); s.ok = 0; }
  } else if (wrong >= 2) {                         // segítséggel oldotta meg (a második tévedéstől segítünk)
    s.ok = 0;
    if (++s.bad >= DOWN_AFTER) { s.lv = Math.max(1, s.lv - 1); s.bad = 0; }
  }
  // egy tévedés után, segítség nélkül megoldva: semleges (nem lép feljebb, de a sorozat sem vész el)
}
