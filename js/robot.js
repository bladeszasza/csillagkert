// Rozi, a robot: bemutatkozik, ő osztja a csillagokat, és az arca (szín + kifejezés) a beszédhez igazodik.
// Hangulatok (data-mood): idle (kedves mosoly), happy (nagy mosoly, hunyorgó zöld szem), cheer (sárga szem, ugrál),
// love (rózsaszín szem), oops (narancs szem, szelíd – hiba után biztat), think (lila szem, felfelé néz).
import { say } from './voice.js';
import { progress } from './progress.js';

const robot = () => document.getElementById('robot');
let timer = 0;

export function emote(mood, ms = 1800) {
  const r = robot(); if (!r) return;
  r.dataset.mood = mood; clearTimeout(timer);
  if (ms) timer = setTimeout(() => { r.dataset.mood = 'idle'; }, ms);
}

// Mely hangulat illik a kimondott mondathoz? (az arc a beszéddel együtt változik)
export function moodFor(text) {
  const t = String(text).trim();
  if (/^(Nyertél|Jóllakott|Megtaláltad az összes|A robot odaért|Gyönyörű lett|Ez nagyon jó volt)/.test(t)) return ['cheer', 2600];
  if (/^(Igen|Nyam|Pontosan|Szép|Megvan|Szuper|Csodás|Ez az|Nagyszerű|Ügyes|Pár!|Beletettük|Becsomagoltuk)/.test(t)) return ['happy', 2200];
  if (/^(Majdnem|Semmi baj|Ezt nem|Köszönöm, de|Ezt együk|Próbáld|Gondold|Ezt a .* hangot választottad)/.test(t)) return ['oops', 2600];
  if (/(Szia|Szeretlek|boldog)/.test(t)) return ['love', 2200];
  if (/(Melyik|Hány|Mennyi|Számold|Mit eszik|Figyelj|Hallgasd|Hogyan|Mi jön|Mi van|Kövesd|Rakd|Koppints)/.test(t)) return ['think', 2800];
  return null;
}

// Bemutatkozás: Rozi nagyban megjelenik középen, integet, elmondja, ki ő és mit csinál; koppintásra átugorható.
export async function introduce() {
  const r = robot(), bub = document.getElementById('rozi-bubble');
  if (!r) return;
  const text = 'Szia! Rozi vagyok, a robot! Én osztom a csillagokat. Minden feladat után kapsz tőlem egy csillagot. Ha összegyűlt elég, jöhet a játék! Gyere, kezdjük!';
  r.classList.add('intro'); emote('happy', 0);
  if (bub) { bub.textContent = 'Szia! Rozi vagyok, a robot! 🌟 Én osztom a csillagokat!'; bub.classList.add('on'); }
  let skipped = false;
  const skip = new Promise(res => { const h = () => { skipped = true; res(); }; r.addEventListener('click', h, { once: true }); setTimeout(res, 14000); });
  const minWait = 6500;   // legalább ennyi ideig látszik (a beszéd úgyis hosszabb); koppintásra átugorható
  await Promise.race([Promise.all([say(text, { remember: false }), new Promise(res => setTimeout(res, minWait))]), skip]);
  if (!skipped) await new Promise(res => setTimeout(res, 300));
  r.classList.remove('intro'); if (bub) bub.classList.remove('on');
  emote('idle', 0); progress.set({ introDone: true });
}

// A csillag kiindulópontja: Rozi (ő osztja ki). Visszaadja a közepét; közben örül.
export function giveStar() {
  const r = robot(); if (!r || r.hidden) return null;
  emote('cheer', 1500); r.classList.remove('give'); void r.offsetWidth; r.classList.add('give'); setTimeout(() => r.classList.remove('give'), 900);
  const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}
