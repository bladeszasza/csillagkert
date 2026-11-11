// Haladás mentése helyben (localStorage). Minden hívás védett: privát módban is működik, csak nem ment.
const KEY = 'csillagkert_v1';
const defaults = { total: 0, meter: 0, index: 0, name: '', rewardMinutes: 4 };
let state = { ...defaults };
try { state = { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch (e) {}

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

export const progress = {
  get: () => state,
  addStar() { state.total++; state.meter++; state.index++; save(); return state.meter; },
  resetMeter() { state.meter = 0; save(); },
  set(patch) { Object.assign(state, patch); save(); },
  reset() { state = { ...defaults, name: state.name, rewardMinutes: state.rewardMinutes }; save(); },
};
