// Zenevár: generált hallás-feladatok. Csak viszonyított hallás (melyik magasabb, merre megy, ugyanaz-e), abszolút hangnév soha:
// a harangok nevét a feladat mindig megszólaltatja, mielőtt kérdez. Sorrend a Kodály-koncepció szerint: szó–mi, aztán lá, dó, ré;
// a fá és a ti csak az 5. szinten (a legkisebb hangköz). A szintek beosztása saját döntés.
// Kulcs-szabály: a kulcs a hallott minta. A transzponált (feljebb vagy lejjebb ugyanúgy szóló) minta NEM új feladat,
// a három harangos összehasonlításban pedig a kulcs a kérdés és a különbség nagysága, a helye nem (az a díszítés része).
import { cap } from './common.js';
import { withArt } from '../hu.js';
import { NOTES, TRIO, VOL } from '../notes.js';

const S = { station: 'zene', icon: '🎵' };
const semi = n => NOTES[n].semi;
const myst = '<span class="mbell mystery">🎵</span>';
const bellFace = n => `<span class="bellf" style="background:${NOTES[n].c}">🔔</span>`;
const trioFace = b => `<span class="bellf" style="background:${b.c}">🔔</span>`;
const names = ns => ns.map(n => NOTES[n].name).join(', ');
// minden sorozat a hangközeiről ismerhető fel (transzponálva ugyanaz)
const shape = ns => ns.slice(1).map((n, i) => semi(n) - semi(ns[i])).join(',');
function seqs(set, len) {
  let out = [[]];
  for (let i = 0; i < len; i++) out = out.flatMap(s => set.map(n => [...s, n]));
  return out;
}

// --- 1. harangok: a hallható harangok (Kodály-sorrend), mindegyik készletben legalább három
const BELL_SETS = [[['szo', 'mi', 'la'], 2], [['do', 'mi', 'szo'], 3], [['mi', 're', 'do'], 3], [['do', 're', 'mi', 'szo'], 4], [['do', 're', 'mi', 'szo', 'la'], 5]];

// --- 2. merre ment a hang? A hangpárok a Kodály-sorrendben; a hangköz (és az iránya) a feladat
const IRANY_NOTES = ['szo', 'mi', 'la', 'do', 're', 'fdo', 'msz', 'mla', 'fa', 'ti'];
const ivLevel = d => (d >= 7 ? 1 : d >= 4 ? 2 : d === 3 ? 3 : d === 2 ? 4 : 5);
const DIR = {
  fel: { e: '⬆️', name: 'feljebb', said: 'Ez a nyíl azt jelenti: feljebb.', fact: 'A második hang magasabb volt, feljebb ment.' },
  le: { e: '⬇️', name: 'lejjebb', said: 'Ez a nyíl azt jelenti: lejjebb.', fact: 'A második hang mélyebb volt, lejjebb ment.' },
  ugyanaz: { e: '➡️', name: 'ugyanaz', said: 'Ez a nyíl azt jelenti: ugyanaz maradt.', fact: 'A két hang egyforma volt.' },
};
const dirOf = (a, b) => (b > a ? 'fel' : b < a ? 'le' : 'ugyanaz');

// --- 3. dallamív: három hang, a rajz a dallam útja
const CONTOUR = {
  'fel-fel': { name: 'felfelé lépcső', desc: 'fel, fel', pts: [[10, 54], [40, 32], [70, 10]] },
  'le-le': { name: 'lefelé lépcső', desc: 'le, le', pts: [[10, 10], [40, 32], [70, 54]] },
  'fel-le': { name: 'domb', desc: 'fel, aztán le', pts: [[10, 50], [40, 12], [70, 50]] },
  'le-fel': { name: 'völgy', desc: 'le, aztán fel', pts: [[10, 14], [40, 52], [70, 14]] },
};
const contourFace = k => `<svg class="contour" viewBox="0 0 80 64" width="96" height="77"><polyline points="${CONTOUR[k].pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#8e5be8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${CONTOUR[k].pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#ffb703"/>`).join('')}</svg>`;
const contourOf = fs => `${fs[1] > fs[0] ? 'fel' : 'le'}-${fs[2] > fs[1] ? 'fel' : 'le'}`;
const DALLAM_SETS = [[['szo', 'mi', 'la'], 2], [['szo', 'mi', 'la', 'do'], 3], [['szo', 'mi', 'la', 'do', 're'], 4]];

// --- 4. ritmus: négy ütés; tá (egy taps), ti-ti (két gyors taps), szün (csend, csak a 4. szinttől)
const BEAT = { ta: 'tá', titi: 'ti-ti', szun: 'szün' };
const beatEvents = b => (b === 'ta' ? [{ clap: true, dur: 0.6 }] : b === 'titi' ? [{ clap: true, dur: 0.3 }, { clap: true, dur: 0.3 }] : [{ rest: true, dur: 0.6 }]);
const rhythmFace = pat => `<span class="rcard">${pat.map(b => (b === 'ta' ? '<i class="ta"></i>' : b === 'titi' ? '<i class="titi"><b></b><b></b></i>' : '<i class="sz"></i>')).join('')}</span>`;
const rhythmName = pat => pat.map(b => BEAT[b]).join(', ');
const RHYTHMS = seqs(['ta', 'titi', 'szun'], 4).filter(p => p.filter(b => b === 'szun').length <= 1)
  .map(p => { const k = p.filter(b => b === 'titi').length, rest = p.includes('szun'); return { p, key: p.join('.'), level: rest ? 4 : k <= 1 ? 2 : 3 }; });
const dist = (a, b) => a.reduce((s, x, i) => s + (x !== b[i]), 0);

// --- 5–8. három harang egymás után (balról jobbra): melyik a leg...?
const TRIO_ASK = {
  magas: { hi: { q: 'Melyik harang szólt a legmagasabban?', other: 'mélyebben', fact: 'szólt a legmagasabban', hint: 'Figyeld meg mindhármat! Melyik szól a legvékonyabban, mint a kismadár?' },
           lo: { q: 'Melyik harang szólt a legmélyebben?', other: 'magasabban', fact: 'szólt a legmélyebben', hint: 'Figyeld meg mindhármat! Melyik szól a legmélyebben, mint a medve?' } },
  hangero: { hi: { q: 'Melyik harang szólt a leghangosabban?', other: 'halkabban', fact: 'szólt a leghangosabban', hint: 'Figyeld meg mindhármat! Melyik szól a legerősebben, mint az oroszlán?' },
             lo: { q: 'Melyik harang szólt a leghalkabban?', other: 'hangosabban', fact: 'szólt a leghalkabban', hint: 'Figyeld meg mindhármat! Melyik szól a legcsendesebben, mint a kisegér?' } },
  hossz: { hi: { q: 'Melyik harang szólt a legtovább?', other: 'rövidebb ideig', fact: 'szólt a legtovább', hint: 'Figyeld meg mindhármat! Melyiknek a hangja tart a legtovább?' },
           lo: { q: 'Melyik harang szólt a legrövidebb ideig?', other: 'tovább', fact: 'szólt a legrövidebb ideig', hint: 'Figyeld meg mindhármat! Melyik hallgat el a leghamarabb?' } },
  tempo: { hi: { q: 'Melyik harang kopogott a leggyorsabban?', other: 'lassabban kopogott', fact: 'kopogott a leggyorsabban', hint: 'Figyeld meg mindhármat! Melyik siet, mint a nyuszi?' },
           lo: { q: 'Melyik harang kopogott a leglassabban?', other: 'gyorsabban kopogott', fact: 'kopogott a leglassabban', hint: 'Figyeld meg mindhármat! Melyik ballag, mint a teknős?' } },
};
// a hangok a leg- hang és a többi; a különbség nagysága adja a szintet
const MAGAS_GAPS = [[12, 1], [7, 2], [4, 3], [2, 4], [1, 5]];
const NOTE_SEMIS = Object.keys(NOTES).sort((a, b) => semi(a) - semi(b));
// a fá és a ti (a félhangok) csak az 5. szinten szólhat, a transzponált változatban sem
const usable = level => NOTE_SEMIS.filter(n => level === 5 || (n !== 'fa' && n !== 'ti'));
// [a leg-, a másik kettő] értéke nagy és kicsi különbséggel. hangero: hangerő; hossz: mp; tempo: két kopogás közti idő (a kisebb a gyorsabb)
const TRIO_VALS = {
  hangero: { hi: { nagy: [VOL.hangos, VOL.halk, VOL.halk], kicsi: [VOL.hangos, VOL.kozepes, VOL.halk] }, lo: { nagy: [VOL.halk, VOL.hangos, VOL.hangos], kicsi: [VOL.halk, VOL.kozepes, VOL.hangos] } },
  hossz: { hi: { nagy: [1.5, 0.4, 0.4], kicsi: [1.4, 0.8, 0.4] }, lo: { nagy: [0.4, 1.5, 1.5], kicsi: [0.4, 0.8, 1.4] } },
  tempo: { hi: { nagy: [0.22, 0.6, 0.6], kicsi: [0.26, 0.42, 0.6] }, lo: { nagy: [0.6, 0.22, 0.22], kicsi: [0.6, 0.42, 0.26] } },
};
const trioOptions = (right, said) => TRIO.map((b, i) => ({ key: b.k, t: trioFace(b), name: b.name, hideName: true, ok: i === right, said: said(b) }));
const INTRO = {
  magas: { key: 'magas', steps: [{ say: 'Ez mély hang, mint a medve brummogása.', events: [{ n: 'msz', dur: 1.1 }] }, { say: 'Ez magas hang, mint a kismadár csipogása.', events: [{ n: 'fdo', dur: 1.1 }] }] },
  hangero: { key: 'hangero', steps: [{ say: 'Ez halk hang, mint a kisegér.', events: [{ n: 'szo', vol: VOL.halk, dur: 1.1 }] }, { say: 'Ez hangos hang, mint az oroszlán.', events: [{ n: 'szo', vol: VOL.hangos, dur: 1.1 }] }] },
  hossz: { key: 'hossz', steps: [{ say: 'Ez hosszú hang.', events: [{ n: 'szo', dur: 1.6 }] }, { say: 'Ez rövid hang.', events: [{ n: 'szo', dur: 0.35 }] }] },
  tempo: { key: 'tempo', steps: [{ say: 'Ez gyors kopogás, mint a nyuszi.', events: knock('szo', 0.22) }, { say: 'Ez lassú kopogás, mint a teknős.', events: knock('szo', 0.6) }] },
};
function knock(n, step, hi) { return [0, 1, 2, 3].map(i => ({ n, dur: 0.12, inst: 'marimba', gap: i < 3 ? step - 0.12 : 0, hi })); }

// --- 9. dallam-visszhang: a dallam a harangokon (Kodály-sorrend), csoportonként legfeljebb 14 dallam
const ECHO_GROUPS = [[['szo', 'mi'], 2, 1], [['szo', 'mi'], 3, 1], [['szo', 'mi'], 4, 2], [['szo', 'mi', 'la'], 3, 2], [['szo', 'mi', 'la'], 4, 3],
  [['do', 'mi', 'szo'], 3, 3], [['do', 're', 'mi'], 3, 4], [['do', 'mi', 'szo'], 4, 4], [['do', 're', 'mi'], 4, 4], [['do', 're', 'mi', 'szo', 'la'], 4, 5], [['do', 're', 'mi', 'szo', 'la'], 5, 5]];
const ECHO_CAP = 14;

export const ZENE = [
  // 1. Melyik harang szólt? Előbb minden harang megszólal a nevével, aztán a titok-harang. Kulcs: a harangok és a titok.
  { ...S, id: 'zene.harang', skill: 'zene.harang',
    targets: () => BELL_SETS.flatMap(([set, level]) => set.map(n => ({ key: `${set.join('.')}-${n}`, level, set, n }))),
    make: (t, r) => {
      const ordered = t.set.slice().sort((a, b) => semi(a) - semi(b));
      const refs = ordered.map(n => ({ n, dur: 0.8, gap: 0.3, hi: n }));
      return { type: 'pick', prompt: 'Melyik harang szólt a végén?', say: 'Figyeld a harangokat! Melyik szólt a végén?', qHtml: myst, ask: {},
        sound: { events: [...refs, { rest: true, dur: 0.5 }, { n: t.n, dur: 1.1 }] },
        options: r.shuffle(t.set.map(n => ({ key: n, t: bellFace(n), name: NOTES[n].name, ok: n === t.n, cls: t.set.length > 3 ? 'sm' : undefined, tone: [{ n, dur: 0.6, hi: n }], said: `Ennek a neve: ${NOTES[n].name}.` }))),
        fact: `A végén ez szólt: ${NOTES[t.n].name}.`, hint: 'Hallgasd meg még egyszer! Melyik harang szól ugyanígy?' };
    },
    solve: item => { const last = item.sound.events[item.sound.events.length - 1]; return item.options.find(o => o.key === last.n).name; } },

  // 2. Merre ment a hang: feljebb, lejjebb, vagy ugyanaz maradt? Kulcs: az irány és a hangköz (és az egyforma hangok magassága).
  { ...S, id: 'zene.irany', skill: 'zene.irany',
    targets: () => {
      // a hangköz szintje; a fá és a ti csak az 5. szinten szól, ezért ami csak velük jönne ki (a nagy, szokatlan ugrások),
      // az kimarad; a félhang (mi–fá, ti–dó) az 5. szintű feladat
      const seen = new Map(), easy = usable(1);
      for (const a of IRANY_NOTES) for (const b of IRANY_NOTES) {
        const d = semi(b) - semi(a); if (!d) continue;
        const key = `${d > 0 ? 'fel' : 'le'}${Math.abs(d)}`, plain = easy.includes(a) && easy.includes(b), level = ivLevel(Math.abs(d));
        if (!seen.has(key) && (plain || level === 5)) seen.set(key, { key, level, a, b });
      }
      return [...seen.values(), { key: 'ugyanaz-mely', level: 1, a: 'msz', b: 'msz' }, { key: 'ugyanaz-kozep', level: 1, a: 'mi', b: 'mi' }, { key: 'ugyanaz-magas', level: 1, a: 'fdo', b: 'fdo' }];
    },
    make: (t, r) => {
      // ugyanaz a hangköz más magasságból is szólhat (a transzponálás díszítés)
      const pool = usable(t.level), d = semi(t.b) - semi(t.a), starts = pool.filter(n => pool.some(m => semi(m) - semi(n) === d) && (d || n === t.a));
      const a = r.pick(starts), b = pool.find(m => semi(m) - semi(a) === d), right = dirOf(semi(a), semi(b));
      return { type: 'pick', prompt: 'Merre ment a hang?', qHtml: myst, ask: {},
        sound: { events: [{ n: a, dur: 0.8, gap: 0.3 }, { n: b, dur: 0.8 }] },
        intro: { key: 'irany', steps: [{ hi: 'fel', say: 'Ha a hang feljebb megy, ez a nyíl.', events: [{ n: 'do', dur: 0.7, gap: 0.25 }, { n: 'szo', dur: 0.7 }] },
          { hi: 'le', say: 'Ha lejjebb megy, ez a nyíl.', events: [{ n: 'szo', dur: 0.7, gap: 0.25 }, { n: 'do', dur: 0.7 }] },
          { hi: 'ugyanaz', say: 'Ha ugyanaz marad, ez a nyíl.', events: [{ n: 'mi', dur: 0.7, gap: 0.25 }, { n: 'mi', dur: 0.7 }] }] },
        options: r.shuffle(Object.entries(DIR).map(([k, x]) => ({ key: k, t: x.e, name: x.name, ok: k === right, said: x.said }))),
        fact: DIR[right].fact, hint: 'Figyeld a második hangot! Magasabb, mélyebb, vagy ugyanolyan?' };
    },
    solve: item => { const [a, b] = item.sound.events.map(e => NOTES[e.n].f); return item.options.find(o => o.key === dirOf(a, b)).name; } },

  // 3. Milyen volt a dallam? Három hang, a rajz a dallam útja (lépcső, domb, völgy). Kulcs: a dallam (hangközei).
  { ...S, id: 'zene.dallam', skill: 'zene.dallam',
    targets: () => {
      const seen = new Map();
      for (const [set, level] of DALLAM_SETS) for (const m of seqs(set, 3)) {
        if (m[0] === m[1] || m[1] === m[2]) continue;
        const sh = shape(m); if (!seen.has(sh)) seen.set(sh, { key: m.join('.'), level, m });
      }
      return [...seen.values()];
    },
    make: (t, r) => {
      const right = contourOf(t.m.map(n => NOTES[n].f)), wrongs = r.sample(Object.keys(CONTOUR).filter(k => k !== right), 2);
      return { type: 'pick', prompt: 'Milyen volt a dallam?', qHtml: myst, ask: {},
        sound: { events: t.m.map((n, i) => ({ n, dur: 0.7, gap: i < 2 ? 0.15 : 0 })) },
        intro: { key: 'dallam', steps: [{ hi: 'fel-le', say: 'Ha a dallam fel, aztán le megy, az domb.', events: [{ n: 'mi', dur: 0.6, gap: 0.1 }, { n: 'la', dur: 0.6, gap: 0.1 }, { n: 'mi', dur: 0.6 }] },
          { hi: 'le-fel', say: 'Ha le, aztán fel megy, az völgy.', events: [{ n: 'la', dur: 0.6, gap: 0.1 }, { n: 'mi', dur: 0.6, gap: 0.1 }, { n: 'la', dur: 0.6 }] }] },
        options: r.shuffle([right, ...wrongs].map(k => ({ key: k, t: contourFace(k), name: CONTOUR[k].name, ok: k === right, said: `Ez ${withArt(CONTOUR[k].name)}: ${CONTOUR[k].desc}.` }))),
        fact: `${cap(CONTOUR[right].desc)} ment a dallam: ${names(t.m)}.`, hint: 'Mutasd az ujjaddal, merre megy a hang!' };
    },
    solve: item => item.options.find(o => o.key === contourOf(item.sound.events.map(e => NOTES[e.n].f))).name },

  // 4. Ritmus: melyik kártyán van, amit hallottál? Nagy kör = tá, két kis kör = ti-ti, üres hely = szün. Kulcs: a ritmus.
  { ...S, id: 'zene.ritmus', skill: 'zene.ritmus',
    targets: () => RHYTHMS.map(x => ({ key: x.key, level: x.level, p: x.p })),
    make: (t, r) => {
      const pool = RHYTHMS.filter(x => x.key !== t.key && (x.level >= 4) === (t.level >= 4));
      // a 4. szinttől az egyik rossz kártya csak egy ütésben más (figyelni kell); lejjebb legalább kettőben
      const close = r.shuffle(pool.filter(x => dist(x.p, t.p) === 1)), far = r.shuffle(pool.filter(x => dist(x.p, t.p) >= 2));
      const wrongs = (t.level >= 4 ? [close[0], far[0]] : [far[0], far[1]]).filter(Boolean);
      return { type: 'pick', prompt: 'Melyik kártyán van ez a ritmus?', qHtml: myst, ask: {}, noList: true,
        sound: { events: [{ rest: true, dur: 0.3 }, ...t.p.flatMap(beatEvents)] },
        intro: t.p.includes('szun')
          ? { key: 'ritmus-szun', steps: [{ say: 'Az üres hely csend: szün. Ott nem tapsolunk.', events: [{ clap: true, dur: 0.6 }, { rest: true, dur: 0.6 }, { clap: true, dur: 0.6 }] }] }
          : { key: 'ritmus', steps: [{ say: 'A nagy kör egy taps: tá.', events: [{ clap: true, dur: 0.6 }] }, { say: 'A két kis kör két gyors taps: ti-ti.', events: [{ clap: true, dur: 0.3 }, { clap: true, dur: 0.3 }] }] },
        options: r.shuffle([t, ...wrongs].map(x => ({ key: x.p.join('.'), t: rhythmFace(x.p), name: rhythmName(x.p), hideName: true, ok: x === t, said: `Ez másik ritmus: ${rhythmName(x.p)}.` }))),
        fact: `Ez volt a ritmus: ${rhythmName(t.p)}.`, hint: 'Tapsold velem halkan! Egy nagy kör egy taps, két kis kör két gyors taps.' };
    },
    // a hallott tapsokból visszaírja a ritmust: hosszú taps = tá, két rövid = ti-ti, csend = szün (az első csend csak felvezetés)
    solve: item => {
      const ev = item.sound.events.slice(1), pat = [];
      for (let i = 0; i < ev.length; i++) { const e = ev[i]; if (e.rest) pat.push('szun'); else if (e.dur >= 0.5) pat.push('ta'); else { pat.push('titi'); i++; } }
      return item.options.find(o => o.key === pat.join('.')).name;
    } },

  // 5–8. Három harang egymás után: a leg-magasabb / -mélyebb, -hangosabb / -halkabb, -hosszabb / -rövidebb, -gyorsabb / -lassabb.
  // A hangerő, a hossz és a tempó egy készség (a hang egy tulajdonságának összevetése): külön-külön szintenként csak egy feladat jutna rájuk.
  ...['magas', 'hangero', 'hossz', 'tempo'].map(kind => ({ ...S, id: `zene.${kind}`, skill: kind === 'magas' ? 'zene.magassag' : 'zene.osszevet',
    targets: () => kind === 'magas'
      ? ['hi', 'lo'].flatMap(sup => MAGAS_GAPS.map(([gap, level]) => ({ key: `${sup}-${gap}`, level, sup, gap })))
      : ['hi', 'lo'].flatMap(sup => [['nagy', sup === 'hi' ? 1 : 2], ['kicsi', sup === 'hi' ? 3 : 4]].map(([c, level]) => ({ key: `${sup}-${c}`, level, sup, c }))),
    make: (t, r) => {
      const A = TRIO_ASK[kind][t.sup], pos = r.int(0, 2);
      let vals;                                                  // a három harang értéke balról jobbra
      if (kind === 'magas') {
        // a leg- hang, egy pontosan gap-nyira lévő, és egy még messzebbi (de a hangkészletben lévő) hang
        const pool = usable(t.level), sign = t.sup === 'hi' ? 1 : -1, pairs = pool.filter(x => pool.some(y => (semi(x) - semi(y)) * sign === t.gap));
        const ext = r.pick(pairs.filter(x => pool.some(y => (semi(x) - semi(y)) * sign > t.gap)));
        const second = pool.find(y => (semi(ext) - semi(y)) * sign === t.gap), third = r.pick(pool.filter(y => (semi(ext) - semi(y)) * sign > t.gap));
        const rest = r.shuffle([second, third]); vals = [0, 1, 2].map(i => (i === pos ? ext : rest.shift()));
      } else {
        const L = TRIO_VALS[kind][t.sup][t.c], rest = r.shuffle(L.slice(1));
        vals = [0, 1, 2].map(i => (i === pos ? L[0] : rest.shift()));
      }
      const n = kind === 'magas' ? null : 'szo';
      const events = TRIO.flatMap((b, i) => {
        const last = i === 2;
        if (kind === 'magas') return [{ n: vals[i], dur: 0.8, gap: last ? 0 : 0.35, hi: b.k }];
        if (kind === 'hangero') return [{ n, vol: vals[i], dur: 0.8, gap: last ? 0 : 0.35, hi: b.k }];
        if (kind === 'hossz') return [{ n, dur: vals[i], gap: last ? 0 : 0.35, hi: b.k }];
        const k = knock(n, vals[i], b.k); if (!last) k[3].gap = 0.5; return k;
      });
      return { type: 'pick', prompt: A.q, ask: {}, fixed: true,
        qHtml: `<span class="trio-note">🔔 🔔 🔔</span>`,
        sound: { events }, intro: INTRO[kind],
        options: trioOptions(pos, b => `A ${b.name} harang ${A.other}${kind === 'tempo' ? '' : ' szólt'}.`),
        fact: `A ${TRIO[pos].name} harang ${A.fact}.`, hint: A.hint };
    },
    solve: item => {
      const by = TRIO.map(b => item.sound.events.filter(e => e.hi === b.k));
      const val = evs => (kind === 'magas' ? NOTES[evs[0].n].f : kind === 'hangero' ? evs[0].vol : kind === 'hossz' ? evs[0].dur : -(evs[0].dur + evs[0].gap));
      const v = by.map(val), want = item.prompt.match(/leg(magasabban|hangosabban|tovább|gyorsabban)/) ? Math.max(...v) : Math.min(...v);
      return v.filter(x => x === want).length === 1 ? item.options[v.indexOf(want)].name : null;
    } })),

  // 9. Dallam-visszhang: a titok-harang eljátssza, a gyerek a harangokon visszajátssza. Kulcs: a dallam (hangközei).
  { ...S, id: 'zene.visszhang', skill: 'zene.visszhang',
    targets: () => {
      const seen = new Set(), out = [];
      for (const [set, len, level] of ECHO_GROUPS) {
        let n = 0;
        for (const m of seqs(set, len)) {
          if (n >= ECHO_CAP) break;
          if (new Set(m).size < Math.min(2, set.length) || !set.every(x => m.includes(x)) && len >= set.length) continue;   // minden harang szól, ha elfér
          const sh = shape(m); if (seen.has(sh)) continue;
          seen.add(sh); out.push({ key: m.join('.'), level, m, set }); n++;
        }
      }
      return out;
    },
    make: t => ({ type: 'echo', melody: t.m, bells: t.set.slice().sort((a, b) => semi(a) - semi(b)) }),
    solve: item => item.melody.join('.') },
];
