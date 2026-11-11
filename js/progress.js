// Haladás és beállítások helyben (localStorage). Minden hívás védett: privát módban is működik, csak nem ment.
import { CURRICULUM, itemsOf, idOf, STATIONS } from './curriculum.js';

const KEY = 'csillagkert_v1';
const fresh = () => ({
  total: 0,          // az összes valaha gyűjtött csillag (a kertben virágként nőnek)
  meter: 0,          // csillagok a legutóbbi jutalom óta
  done: {},          // kész feladatok állomásonként (szülői áttekintéshez)
  seen: undefined,   // megoldott feladatok {azonosító: időbélyeg} – ebből kerüljük az ismétlést
  gifts: [],         // megszerzett ajándékok (öltöztető elemei)
  rewardsDone: 0,    // hány jutalomjátékot játszott már: minden kör után több csillag kell
  name: '', nameAsked: false, rewardMinutes: 4, perReward: 10, voiceURI: '', feedGap: 2, sinceFeed: 0,
});
let hadSave = false;
let state = fresh();
try { const raw = localStorage.getItem(KEY); hadSave = !!raw; state = { ...fresh(), ...(JSON.parse(raw || '{}')) }; } catch (e) {}
if (typeof state.done !== 'object' || !state.done) state.done = {};
if (!Array.isArray(state.gifts)) state.gifts = [];

// Régi mentésből (index/sp számlálók) átvesszük, mi volt már meg, hogy ne játszassuk újra
if (!state.seen || typeof state.seen !== 'object') {
  state.seen = {};
  const t0 = Date.now() - 1e9;
  for (let i = 0; i < (state.index || 0) && i < CURRICULUM.length; i++) state.seen[idOf(CURRICULUM[i])] = t0 + i;
  for (const st of STATIONS) { const l = itemsOf(st.id); for (let i = 0; i < (state.sp?.[st.id] || 0) && i < l.length; i++) state.seen[idOf(l[i])] = t0 + i; }
}
delete state.index; delete state.sp;
if (!state.v2) { if (hadSave) state.perReward = 10; state.v2 = true; }   // korábbi mentés: 3 helyett 10 csillag

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

export const progress = {
  get: () => state,
  // Egy kész feladat = 1 csillag. Visszaadja a mérő új állását.
  addStar(station, id) {
    state.total++; state.meter++;
    state.done[station] = (state.done[station] || 0) + 1;
    if (id) state.seen[id] = Date.now();
    save(); return state.meter;
  },
  completeReward() { state.rewardsDone = (state.rewardsDone || 0) + 1; save(); },
  addGift(id) { if (!state.gifts.includes(id)) { state.gifts.push(id); save(); } },
  resetMeter() { state.meter = 0; save(); },
  set(patch) { Object.assign(state, patch); save(); },
  reset() { const keep = { name: state.name, nameAsked: state.nameAsked, rewardMinutes: state.rewardMinutes, perReward: state.perReward, voiceURI: state.voiceURI }; state = { ...fresh(), seen: {}, ...keep }; save(); },
};
