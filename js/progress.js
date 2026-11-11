// Haladás és beállítások helyben (localStorage). Minden hívás védett: privát módban is működik, csak nem ment.
const KEY = 'csillagkert_v1';
const fresh = () => ({
  total: 0,          // az összes valaha gyűjtött csillag (a kertben virágként nőnek)
  meter: 0,          // csillagok a legutóbbi jutalom óta
  index: 0,          // "Tovább" gomb: hol tartunk a teljes feladatsorban
  done: {},          // kész feladatok állomásonként (szülői áttekintéshez)
  sp: {},            // állomásonkénti saját feladatsor-pozíció (szabad választásnál)
  name: '', rewardMinutes: 4, perReward: 3, voiceURI: '',
});
let state = fresh();
try { state = { ...fresh(), ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch (e) {}
if (typeof state.done !== 'object' || !state.done) state.done = {};
if (typeof state.sp !== 'object' || !state.sp) state.sp = {};

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

export const progress = {
  get: () => state,
  // via: 'next' (Tovább gomb) vagy 'station' (szabad választás). Visszaadja a mérő új állását.
  addStar(station, via) {
    state.total++; state.meter++;
    state.done[station] = (state.done[station] || 0) + 1;
    if (via === 'next') state.index++; else state.sp[station] = (state.sp[station] || 0) + 1;
    save(); return state.meter;
  },
  resetMeter() { state.meter = 0; save(); },
  set(patch) { Object.assign(state, patch); save(); },
  reset() { const keep = { name: state.name, rewardMinutes: state.rewardMinutes, perReward: state.perReward, voiceURI: state.voiceURI }; state = { ...fresh(), ...keep }; save(); },
};
