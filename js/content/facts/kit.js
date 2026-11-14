// Ténytáblák → sablonok (a tény-állomásokhoz: Állatok, Világunk, Egészség, Testünk, Időutazás, Szívkert).
// Ezeket a feladatokat NEM generáljuk: minden tényt kézzel írtunk, és a szülő átnézi, mielőtt élesedik (approved.js).
//
// Egy tény: egy igaz, teljes állítás (ez hangzik el a jó válasz után) és legfeljebb két kérdés róla.
// A válaszok készségenként zárt KÉPBANKBÓL jönnek (minden képnek egy neve). Egy kérdés megadja:
//   a – a bank MINDEN tagját, amelyik helyes válasz (ebből egy kerül a képernyőre),
//   x – a vitatható tagokat (nem rossz, de nem is a várt válasz): ezek soha nem eltérítők.
// Eltérítő csak a bank többi tagja lehet, ezért egy feladatban pontosan egy védhető válasz van.
// A feladat kulcsa a tény azonosítója (és ".2" a második kérdésnél): az eltérítők és a sorrend díszítés, nem új feladat.
//
// A jó válasz után elhangzó tény alapból a tényé (f), de egy kérdésnek lehet saját ténye is (Q(..., { f })). Ha a kérdésnek
// több jó válasza van, a tényben a {A} helyére a képernyőn lévő jó válasz kerül ("{A} a tengerben él." → "A delfin a tengerben él."),
// így a gyerek mindig arról hall, amit kiválasztott.
import { withArt } from '../../hu.js';
import { NUMS } from '../common.js';

export const asList = v => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
// kérdés: Q('Mivel látunk?', 'resz', 'szem', { x: [...], show: '🐥', hint: '...', lv: 3 })
// quiet: a válaszok nevét nem soroljuk fel és nem írjuk ki ("Melyik arc vidám?" – a név elárulná)
// sil: a kérdés képe árnyékként (sziluett) látszik: "Kinek az árnyéka ez?"
export const Q = (ask, bank, a, o = {}) => ({ ask, bank, a: asList(a), x: asList(o.x), show: o.show, hint: o.hint, lv: o.lv, quiet: !!o.quiet, sil: !!o.sil, f: o.f });
// a kérdés ténye, a {A} helyén a választott jó válasszal ("A delfin", "Az oroszlán")
export const factOf = (f, q, name) => (q.f || f.f).replace('{A}', name === undefined ? '{A}' : withArt(name, true));
// sorrend: S('Hogyan mosunk kezet?', [['🚰', 'vizes kéz'], ...]) – a lépések helyes sorrendben
export const S = (ask, steps, o = {}) => ({ ask, steps: steps.map(([e, n]) => ({ t: e, name: n })), lv: o.lv, kind: 'order' });

// képbank: [[emoji, név, tévedéskor elhangzó mondat?], ...]; a mondat alapból "Ez a(z) <név>."
// számbank: a válasz számkártya (számjegy és pöttyök a gombon, kimondva szóval)
export const pics = list => Object.fromEntries(list.map(([e, n, said]) => [n, { e, n, said: said || `Ez ${withArt(n)}.` }]));
export const nums = list => Object.fromEntries(list.map(v => [NUMS[v], { num: v, n: NUMS[v], said: `Ez ${withArt(NUMS[v])}.` }]));

const optionOf = (b, ok, quiet) => (b.num !== undefined ? { n: b.num, name: b.n, ok, said: b.said } : { key: b.n, t: b.e, name: b.n, ok, said: b.said, ...(quiet ? { hideName: true } : {}) });

// Egy állomás táblájából készségenként egy sablon
export function factTemplates({ station, icon, banks, skills, facts }) {
  // kérdés szövege és képe → kérdés (a megoldó ebből dolgozik: amit a gyerek hall és lát). Ugyanaz a kérdés csak más képpel
  // szerepelhet újra ("Kinek az árnyéka ez?")
  const qkey = (ask, show) => `${ask}|${show || ''}`, qs = new Map();
  for (const f of facts) for (const q of f.q) {
    if (qs.has(qkey(q.ask, q.show))) throw new Error(`${station}: kétszer ugyanaz a kérdés: ${q.ask}`);
    qs.set(qkey(q.ask, q.show), q);
  }
  return Object.entries(skills).map(([skill, s]) => ({
    station, icon, id: skill, skill, review: true, title: s.name,
    targets: () => facts.filter(f => f.sk === skill).flatMap(f => f.q.map((q, i) => ({ key: i ? `${f.id}.${i + 1}` : f.id, level: q.lv || f.lv, f, q }))),
    make: (t, r) => {
      const { f, q } = t;
      if (q.kind === 'order') return { type: 'order', prompt: q.ask, steps: q.steps, fact: q.f || f.f };
      const bank = banks[q.bank];
      const bad = Object.keys(bank).filter(n => !q.a.includes(n) && !q.x.includes(n));
      const k = t.level >= 4 && bad.length >= 3 ? 3 : 2;
      const right = bank[r.pick(q.a)];
      return {
        type: 'pick', prompt: q.ask, ask: { show: q.show || '' }, ...(q.show ? { qHtml: `<span class="${q.sil ? 'silsrc sil' : 'big1'}">${q.show}</span>` } : {}), ...(q.quiet ? { noList: true } : {}),
        options: r.shuffle([optionOf(right, true, q.quiet), ...r.sample(bad, k).map(n => optionOf(bank[n], false, q.quiet))]),
        fact: factOf(f, q, right.n), hint: q.hint || s.hint,
      };
    },
    // a megoldó a kérdésből dolgozik (amit a gyerek hall): a kérdés helyes válaszai közül az, amelyik a képernyőn van
    solve: item => {
      const q = qs.get(qkey(item.prompt, item.ask?.show));
      if (q.kind === 'order') return q.steps.map(x => x.name).join(', ');
      const o = item.options.find(x => q.a.includes(x.name));
      return o ? o.n ?? o.name : null;
    },
  }));
}
