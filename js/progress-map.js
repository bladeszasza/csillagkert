// A szülői haladás-térkép adatai: csak azt mutatja, amit a mentés tényleg tud. Állomásonként a szint (1–5, a DIFER
// öt szintjének nevével), hány feladatot oldott meg ott, mikor járt ott utoljára; készségenként hányszor gyakorolta,
// és hány feladata vár ismétlésre, mert legutóbb nem ment elsőre. Nem mér és nem diagnosztizál. Tiszta modul.
import { skillName, LEVEL_NAMES } from './content/skill-names.js';

// stations: [{ id, name }], pool: [{ id, station, skill }] (a tananyag minden feladata)
export function progressMap(state, stations, pool) {
  const skillOf = new Map(pool.map(e => [e.id, e]));
  const sk = state?.sk || {}, rv = state?.rv || {};
  const again = new Map();                                   // készség → legutóbb nem elsőre ment feladatok száma
  for (const [id, r] of Object.entries(rv)) { const e = skillOf.get(id); if (e?.skill && r && r.b === 0) again.set(e.skill, (again.get(e.skill) || 0) + 1); }
  return stations.map(st => {
    const lad = sk['st.' + st.id], skills = [...new Set(pool.filter(e => e.station === st.id && e.skill && !String(e.skill).startsWith('legacy.')).map(e => e.skill))];
    const rows = skills.map(id => ({ id, name: skillName(id), n: sk[id]?.n || 0, at: sk[id]?.at || 0, again: again.get(id) || 0 }));
    return {
      id: st.id, name: st.name, done: state?.done?.[st.id] || 0,
      lv: lad?.lv || 0, level: lad?.lv ? LEVEL_NAMES[lad.lv - 1] : '', at: lad?.at || 0,
      skills: rows, practiced: rows.filter(r => r.n > 0).length,
    };
  });
}
