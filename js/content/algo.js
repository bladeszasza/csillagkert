// Robotpálya: generált programozós feladatok. Abszolút irányok (fel, le, balra, jobbra), nem fordulás: így 5 évesen is követhető.
// Sorrend: egyenes út → egy forduló → kerülő a virágok körül → ismétlés (×2, ×3); mellette előrejelzés ("Hová ér?"),
// programok összevetése, hibakeresés és ha–akkor szabály. A szintek beosztása saját döntés: a hibakeresés, az összevetés és a
// ha–akkor a 3. szinten indul, hogy a gyerek előbb maga építsen programot (friss profilnál az építés és a "Hová ér?" jön).
// Kulcs-szabály: a kulcs a helyes program (betűjellel: f fel, l le, b balra, j jobbra; j3 = jobbra háromszor).
// Az eltolt vagy nagyobb pályán ugyanaz a program NEM új feladat; két pálya, amelyiknek ugyanaz a legegyszerűbb megoldása, egy feladat.
// A pályákat rögzített magból sorsoljuk (az azonosítók így minden betöltéskor ugyanazok), a megoldást a robot-path.js számolja.
import { DIRS, ORDER, LETTER, solve, compress, simulate, keyOf, parseKey, expand, turns, fit } from '../robot-path.js';
import { rng } from './rng.js';
import { cap } from './common.js';
import { withArt } from '../hu.js';

const S = { station: 'algo', icon: '🤖' };
// a választós feladat képe legfeljebb 6×4 mezős; a robot saját pályája (algo feladat) 6×5-ös is lehet
const MAXW = 6, MAXH = 4, ALGO_H = 5;
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const NAME = d => DIRS[d][3], ARROW = d => DIRS[d][2];
const POINTS = { up: 'felfelé', down: 'lefelé', left: 'balra', right: 'jobbra' };
const TIMES = ['', '', 'kétszer', 'háromszor'];
// "jobbra kétszer, le": így mondja ki Rozi a programot
const spoken = toks => toks.map(t => NAME(t.dir) + (t.times > 1 ? ' ' + TIMES[t.times] : '')).join(', ');
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const cellsOf = (w, h) => Array.from({ length: w * h }, (_, i) => [i % w, (i / w) | 0]);

// --- rajz (a pick feladatok képe; a megoldó ebből olvassa vissza a pályát) ---
// mezők sorfolytonosan; tartalom: 🤖 robot, ⭐ csillag, 🌸 virág (fal), gyümölcs
export function boardHtml({ w, h, start, goal, walls = [], items = [] }, cell = 58) {
  const at = (x, y) => (start && same(start, [x, y]) ? '🤖' : goal && same(goal, [x, y]) ? '⭐' : walls.some(c => same(c, [x, y])) ? '🌸' : items.find(f => same(f.at, [x, y]))?.e || '');
  return `<div class="agrid mini" style="grid-template-columns:repeat(${w}, ${cell}px)">${cellsOf(w, h).map(([x, y]) => { const c = at(x, y); return `<div class="acell${c === '🌸' ? ' wall' : ''}" style="width:${cell}px;height:${cell}px;font-size:${Math.round(cell * 0.62)}px">${c}</div>`; }).join('')}</div>`;
}
export const chipsHtml = toks => `<span class="pchips">${toks.map(t => `<span class="pchip">${ARROW(t.dir)}${t.times > 1 ? `<b>×${t.times}</b>` : ''}</span>`).join('')}</span>`;
const cellFor = (w, h) => Math.min(54, Math.floor(340 / Math.max(w, h * 1.5)));

// --- programok: nem lép vissza, és nem jár kétszer ugyanott ---
function programs(len) {
  let out = [[]];
  for (let i = 0; i < len; i++) out = out.flatMap(p => ORDER.filter(d => !p.length || d !== OPP[p[p.length - 1]]).map(d => [...p, d]));
  return out.filter(p => { const seen = new Set(), c = [0, 0]; seen.add('0,0'); for (const d of p) { c[0] += DIRS[d][0]; c[1] += DIRS[d][1]; const k = c.join(','); if (seen.has(k)) return false; seen.add(k); } return true; });
}
// ismétléses programok: egy lépés ×2/×3, vagy két egymásra merőleges lépés (legalább az egyik ismétléses)
function loopPrograms() {
  const out = [];
  for (const d of ORDER) for (const n of [2, 3]) out.push([{ dir: d, times: n }]);
  for (const a of ORDER) for (const b of ORDER) if (b !== a && b !== OPP[a]) for (const n of [1, 2, 3]) for (const m of [1, 2, 3]) if (n > 1 || m > 1) out.push([{ dir: a, times: n }, { dir: b, times: m }]);
  return out;
}
const fits = toks => { const f = fit(expand(toks)); return f.w <= MAXW - 1 && f.h <= MAXH; };

// nyitott pálya egy úthoz, véletlen mérettel és eltolással (a díszítés része: a válasz ugyanaz marad)
function openBoard(path, r, padW = [1, 2], padH = [0, 2], maxH = MAXH) {
  const f = fit(path);
  const w = Math.min(MAXW, Math.max(3, f.w + r.int(...padW))), h = Math.min(maxH, Math.max(3, f.h + r.int(...padH)));
  const ox = r.int(0, w - f.w), oy = r.int(0, h - f.h);
  return { w, h, start: [f.start[0] + ox, f.start[1] + oy], goal: [f.goal[0] + ox, f.goal[1] + oy] };
}

// --- építős pályák (algo.epit és a hibakeresés alapja) ---
// egyenes és egy fordulós utak nyitott pályán, aztán rögzített magból sorsolt virágos pályák, amelyeken gondolkodni kell
// (legalább két forduló vagy kerülő); egy pálya csak akkor kerül be, ha a legegyszerűbb megoldása új.
function buildLayouts() {
  const out = [], seen = new Set();
  const add = (lv, level, kind) => {
    const p = solve(lv); if (!p) return;
    const key = keyOf(p); if (seen.has(key)) return;
    seen.add(key); out.push({ key, level, kind, lv, path: p });
  };
  for (const d of ORDER) for (let n = 1; n <= 4; n++) {
    const f = fit(Array(n).fill(d));
    add({ ...f, w: Math.max(f.w, 2), h: Math.max(f.h, 2) }, 1, 'egyenes');
  }
  for (const hd of ['left', 'right']) for (const vd of ['up', 'down']) for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) {
    const len = a + b;
    add(fit([...Array(a).fill(hd), ...Array(b).fill(vd)]), len <= 3 ? 2 : len <= 5 ? 3 : 4, 'fordulo');
  }
  const r = rng('algo.epit.viragok'), SIZES = [[4, 3], [5, 3], [4, 4], [5, 4], [6, 3], [6, 4]];
  for (let tries = 0, n = 0; n < 40 && tries < 6000; tries++) {
    const [w, h] = r.pick(SIZES), cells = cellsOf(w, h), start = r.pick(cells);
    const far = cells.filter(c => Math.abs(c[0] - start[0]) + Math.abs(c[1] - start[1]) >= 3); if (!far.length) continue;
    const goal = r.pick(far), walls = r.sample(cells.filter(c => !same(c, start) && !same(c, goal)), r.int(2, 5));
    const lv = { w, h, start, goal, walls }, p = solve(lv);
    if (!p || p.length > 8) continue;
    const man = Math.abs(goal[0] - start[0]) + Math.abs(goal[1] - start[1]), detour = p.length > man;
    if (turns(p) < 2 && !detour) continue;
    let level = p.length <= 5 ? 3 : p.length <= 7 ? 4 : 5; if (detour) level = Math.min(5, level + 1);
    const before = out.length; add(lv, level, 'viragos'); if (out.length > before) n++;
  }
  return out;
}
let LAYOUTS = null;
const layouts = () => (LAYOUTS ||= buildLayouts());

// --- algo feladat (a robot a gyerek programját futtatja) ---
const algoItem = (lv, extra) => ({ type: 'algo', w: lv.w, h: lv.h, start: lv.start, goal: lv.goal, walls: lv.walls || [], ...extra });
const solveAlgo = item => (item.prefill?.length ? repair(item) : solve(item));
// a hibás program javítása: egy lépés kivétele vagy egy hozzáadása, amitől a robot a csillaghoz ér
export function repair(item) {
  const p = item.prefill;
  for (let i = 0; i < p.length; i++) { const q = [...p.slice(0, i), ...p.slice(i + 1)]; if (simulate(item, q).ok) return q; }
  for (const d of ORDER) { const q = [...p, d]; if (simulate(item, q).ok) return q; }
  return null;
}

// 1. Építsd meg a programot! (egyenes → forduló → virágok körül)
const EPIT = { ...S, id: 'algo.epit', skill: 'algo.epit',
  targets: () => layouts().map(({ key, level, kind, lv }) => ({ key, level, kind, lv })),
  make: (t, r) => {
    // nyitott pályán a méret és az eltolás díszítés; a virágos pálya kötött (ott minden mező számít)
    const lv = t.kind === 'viragos' ? t.lv : openBoard(solve(t.lv), r, [0, 1], [0, 1], ALGO_H);
    const p = solve(lv);
    return algoItem(lv, { max: Math.min(9, p.length + 2), say: t.kind === 'viragos' ? 'Vezesd a robotot a csillaghoz! A virágokra nem léphet.' : t.level === 1 ? 'Nyomd meg a nyilat annyiszor, ahányat a robotnak lépnie kell! Aztán indítsd el!' : 'Rakd össze a nyilakból a programot, aztán nyomd meg az indítást!' });
  },
  solve: solveAlgo };

// 2. Ismétlés: kevés a hely a programban, a ×2 és ×3 gomb kell hozzá
function loopTargets() {
  const out = [], seen = new Set();
  const add = (lv, level, kind) => {
    if (lv.w > MAXW || lv.h > ALGO_H) return false;
    const p = solve({ ...lv, loops: true }); if (!p) return false;
    const toks = compress(p, true); if (p.length - toks.length < 2) return false;
    const key = keyOf(toks); if (seen.has(key)) return false;
    seen.add(key); out.push({ key, level, kind, lv }); return true;
  };
  for (const d of ORDER) for (const n of [4, 5]) { const f = fit(Array(n).fill(d)); add({ ...f, w: Math.max(f.w, 2), h: Math.max(f.h, 2) }, 3, 'egyenes'); }
  for (const hd of ['left', 'right']) for (const vd of ['up', 'down']) for (let a = 1; a <= 5; a++) for (let b = 1; b <= 3; b++)
    add(fit([...Array(a).fill(hd), ...Array(b).fill(vd)]), 4, 'fordulo');
  const r = rng('algo.ciklus.viragok'), SIZES = [[5, 3], [6, 3], [5, 4], [6, 4]];
  for (let tries = 0, n = 0; n < 14 && tries < 6000; tries++) {
    const [w, h] = r.pick(SIZES), cells = cellsOf(w, h), start = r.pick(cells);
    const far = cells.filter(c => Math.abs(c[0] - start[0]) + Math.abs(c[1] - start[1]) >= 5); if (!far.length) continue;
    const goal = r.pick(far), walls = r.sample(cells.filter(c => !same(c, start) && !same(c, goal)), r.int(2, 4));
    const lv = { w, h, start, goal, walls }, p = solve({ ...lv, loops: true });
    // a virágoknak számítaniuk kell: nélkülük más lenne a legegyszerűbb program
    if (!p || keyOf(compress(p, true)) === keyOf(compress(solve({ w, h, start, goal, loops: true }), true))) continue;
    if (add(lv, 5, 'viragos')) n++;
  }
  return out;
}
const CIKLUS = { ...S, id: 'algo.ciklus', skill: 'algo.ciklus',
  targets: loopTargets,
  make: (t, r) => {
    const lv = t.kind === 'viragos' ? t.lv : openBoard(solve({ ...t.lv, loops: true }), r, [0, 1], [0, 1], ALGO_H);
    const toks = compress(solve({ ...lv, loops: true }), true);
    return algoItem(lv, { loops: true, max: toks.length + 1, say: 'Kevés a hely a programban! Használd a kétszer és a háromszor gombot!' });
  },
  solve: solveAlgo };

// 3. Hibakeresés: a program egy lépéssel hosszabb (a robot épp ott ütközik, ahol a hiba van), vagy hiányzik az utolsó lépés
function faultTargets() {
  const out = [], seen = new Set();
  for (const b of layouts()) {
    const p = b.path, r = rng('algo.hiba:' + b.key);
    if (b.kind === 'egyenes' && p.length < 2) continue;
    let prefill, key, level;
    if (b.kind === 'egyenes' || (b.kind === 'fordulo' && p.length <= 3)) {
      prefill = p.slice(0, -1); key = `${keyOf(prefill)}-p${LETTER[p[p.length - 1]]}`; level = 3;
    } else {
      // a beszúrt lépés falnak vagy a pálya szélének megy: a robot ennél a lépésnél akad el, ezt jelöli meg
      const pos = simulate(b.lv, p).cells, cand = [];
      pos.forEach((c, i) => { for (const d of ORDER) { const s = simulate({ ...b.lv, start: c }, [d]); if (s.why === 'edge' || s.why === 'wall') cand.push([i, d]); } });
      if (!cand.length) continue;
      const [i, d] = r.pick(cand);
      prefill = [...p.slice(0, i), d, ...p.slice(i)]; key = `${keyOf(prefill)}-x${i}`;
      level = b.kind === 'fordulo' ? 3 : p.length <= 6 ? 4 : 5;
    }
    if (seen.has(key)) continue;
    seen.add(key); out.push({ key, level, lv: b.lv, prefill, max: p.length + 2 });
  }
  return out;
}
const HIBA = { ...S, id: 'algo.hiba', skill: 'algo.hiba',
  targets: faultTargets,
  make: t => algoItem(t.lv, { prefill: t.prefill.slice(), max: t.max, say: 'Hiba van a programban! Indítsd el, nézd meg, hol akad el, és javítsd ki!' }),
  solve: solveAlgo };

// --- pick feladatok közös része: a pálya és a program visszaolvasása a rajzból (a megoldó nem a make() adatait nézi) ---
export function readBoard(html) {
  const w = +/repeat\((\d+),/.exec(html)[1];
  const cells = [...html.matchAll(/<div class="acell[^"]*"[^>]*>([^<]*)<\/div>/g)].map(m => m[1]);
  const find = e => { const i = cells.indexOf(e); return i < 0 ? null : [i % w, (i / w) | 0]; };
  return { w, h: cells.length / w, cells, start: find('🤖'), goal: find('⭐'), at: ([x, y]) => cells[y * w + x] };
}
const ARROWS = Object.fromEntries(ORDER.map(d => [ARROW(d), d]));
export const readChips = html => [...html.matchAll(/<span class="pchip">(⬆️|⬇️|⬅️|➡️)(?:<b>×(\d)<\/b>)?<\/span>/g)].map(m => ({ dir: ARROWS[m[1]], times: m[2] ? +m[2] : 1 }));

// 4. Hová ér a robot? A program látszik, a gyerek a gyümölcsre koppint, ahol a robot megáll.
const FRUITS = [['🍎', 'alma', 'almánál'], ['🍐', 'körte', 'körténél'], ['🍓', 'eper', 'epernél'], ['🍌', 'banán', 'banánnál'], ['🍇', 'szőlő', 'szőlőnél'],
  ['🍊', 'narancs', 'narancsnál'], ['🍋', 'citrom', 'citromnál'], ['🍒', 'cseresznye', 'cseresznyénél'], ['🍑', 'barack', 'baracknál'], ['🍉', 'dinnye', 'dinnyénél']];
function predictTargets() {
  const out = [], r = rng('algo.hova');
  const add = (toks, level) => out.push({ key: keyOf(toks), level, toks });
  for (const p of [...programs(1), ...programs(2)].filter(p => turns(p) === 0)) add(p.map(d => ({ dir: d, times: 1 })), 1);
  for (const p of [...programs(2).filter(p => turns(p) === 1), ...programs(3).filter(p => turns(p) === 0)]) add(p.map(d => ({ dir: d, times: 1 })), 2);
  for (const p of programs(3).filter(p => turns(p) > 0)) add(p.map(d => ({ dir: d, times: 1 })), 3);
  for (const p of r.sample(programs(4).filter(p => fits(p.map(d => ({ dir: d, times: 1 })))), 24)) add(p.map(d => ({ dir: d, times: 1 })), 4);
  for (const toks of r.sample(loopPrograms().filter(fits), 24)) add(toks, 5);
  return out;
}
// egy elírt program (más irány, más ismétlés, kimaradt vagy plusz lépés) hova vinné a robotot: ezek a csalogató mezők
function slips(toks) {
  const out = [];
  toks.forEach((t, i) => {
    for (const d of ORDER) if (d !== t.dir) out.push(toks.map((u, j) => (j === i ? { dir: d, times: u.times } : u)));
    for (const n of [1, 2, 3]) if (n !== t.times) out.push(toks.map((u, j) => (j === i ? { dir: u.dir, times: n } : u)));
    if (toks.length > 1) out.push(toks.filter((_, j) => j !== i));
  });
  for (const d of ORDER) out.push([...toks, { dir: d, times: 1 }]);
  return out;
}
const HOVA = { ...S, id: 'algo.hova', skill: 'algo.hova',
  targets: predictTargets,
  make: (t, r) => {
    const toks = t.toks, lv = openBoard(expand(toks), r), sim = simulate(lv, toks), end = sim.end;
    const onPath = c => sim.cells.some(p => same(p, c));
    // a többi gyümölcs nem eshet a robot útjába (különben "előbb odaér" kétértelmű lenne)
    const near = [], keys = new Set();
    for (const s of slips(toks)) { const e = simulate(lv, s); const k = e.end.join(','); if (e.why !== 'edge' && !onPath(e.end) && !keys.has(k)) { keys.add(k); near.push(e.end); } }
    const free = cellsOf(lv.w, lv.h).filter(c => !onPath(c) && !keys.has(c.join(',')));
    const spots = [...r.shuffle(near), ...r.shuffle(free)].slice(0, 2);
    const fr = r.sample(FRUITS, 3), items = [{ at: end, e: fr[0][0] }, ...spots.map((at, i) => ({ at, e: fr[i + 1][0] }))];
    return { type: 'pick', prompt: 'Hová ér a robot?', say: 'Nézd meg a robot programját! Melyik gyümölcsnél áll meg?',
      qHtml: `<div class="aboard">${boardHtml({ ...lv, goal: null, items }, cellFor(lv.w, lv.h))}${chipsHtml(toks)}</div>`, ask: {},
      options: r.shuffle(fr.map(([e, n], i) => ({ key: n, t: e, name: n, ok: i === 0, said: `Ez ${withArt(n)}. A robot nem itt áll meg.` }))),
      fact: `${cap(spoken(toks))}: a robot ${withArt(fr[0][2])} áll meg.`, hint: 'Kövesd az ujjaddal a nyilakat, lépésről lépésre!' };
  },
  solve: item => {
    const b = readBoard(item.qHtml), s = simulate({ w: b.w, h: b.h, start: b.start }, readChips(item.qHtml));
    return item.options.find(o => o.t === b.at(s.end)).name;
  } };

// 5. Melyik program viszi a csillaghoz? Három program, pontosan egy jó; a többi máshová ér, és a csillagon sem megy át.
const LV_PROGS = (() => {
  const r = rng('algo.melyik'), one = p => p.map(d => ({ dir: d, times: 1 }));
  return { 2: programs(2).map(one), 3: programs(3).map(one), 4: r.sample(programs(4).map(one).filter(fits), 24), 5: r.sample(loopPrograms().filter(fits), 20) };
})();
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const MELYIK = { ...S, id: 'algo.melyik', skill: 'algo.melyik',
  targets: () => Object.entries(LV_PROGS).flatMap(([g, list]) => list.map(toks => ({ key: keyOf(toks), level: Math.max(3, +g), g: +g, toks }))),
  make: (t, r) => {
    const toks = t.toks, lv = openBoard(expand(toks), r);
    const passes = s => s.cells.some(c => same(c, lv.goal));
    const cands = LV_PROGS[t.g].filter(o => keyOf(o) !== t.key).map(o => ({ o, s: simulate(lv, o) })).filter(c => !c.s.ok && !passes(c.s));
    // a hasonló, pályán maradó programok az igazi csalogatók; a falnak menő csak tartalék
    const ranked = r.shuffle(cands).sort((a, b) => (a.s.why === 'edge') - (b.s.why === 'edge') || lev(keyOf(a.o), t.key) - lev(keyOf(b.o), t.key));
    const wrong = r.sample(ranked.slice(0, 5), 2);
    const opt = (o, ok, s) => ({ key: keyOf(o), t: chipsHtml(o), cls: 'prog', ok, said: ok ? undefined : s.why === 'edge' ? 'Ezzel a robot nekimenne a pálya szélének.' : 'Ezzel a robot máshová érne.' });
    return { type: 'pick', prompt: 'Melyik program viszi a csillaghoz?', say: 'Melyik program viszi el a robotot a csillaghoz?', noList: true,
      qHtml: `<div class="aboard">${boardHtml(lv, cellFor(lv.w, lv.h))}</div>`, ask: {},
      options: r.shuffle([opt(toks, true), ...wrong.map(c => opt(c.o, false, c.s))]),
      fact: `${cap(spoken(toks))}: így ér a robot a csillaghoz.`, hint: 'Próbáld ki mindegyiket az ujjaddal, nyilanként!' };
  },
  solve: item => {
    const b = readBoard(item.qHtml), lv = { w: b.w, h: b.h, start: b.start, goal: b.goal };
    return item.options.find(o => simulate(lv, readChips(o.t)).ok).key;
  } };

// 6. Ha–akkor: a szabálykártyák megmondják, melyik jelnél merre menjen a robot. (5. szinten két jel egymás után.)
const SIGNS = [['🟥', 'piros'], ['🟦', 'kék'], ['🟩', 'zöld'], ['🟨', 'sárga']];
const rulesHtml = rules => `<div class="rules">${rules.map(([e, d]) => `<span class="rule"><i>${e}</i><b>${ARROW(d)}</b></span>`).join('')}</div>`;
const readRules = html => Object.fromEntries([...html.matchAll(/<span class="rule"><i>([^<]+)<\/i><b>([^<]+)<\/b><\/span>/g)].map(m => [m[1], ARROWS[m[2]]]));
const readSeen = html => [...(/<div class="rsee">(.*?)<\/div>/.exec(html)?.[1] || '').matchAll(/<span class="rsign">([^<]+)<\/span>/g)].map(m => m[1]);
const HAAKKOR = { ...S, id: 'algo.haakkor', skill: 'algo.haakkor',
  targets: () => [
    ...[2, 3, 4].flatMap(k => ORDER.map(d => ({ key: `szabaly${k}-${LETTER[d]}`, level: Math.max(3, k), k, dirs: [d] }))),
    ...ORDER.flatMap(a => ORDER.filter(b => b !== a).map(b => ({ key: `ket-${LETTER[a]}${LETTER[b]}`, level: 5, k: 3, dirs: [a, b] }))),
  ],
  make: (t, r) => {
    const others = r.shuffle(ORDER.filter(d => !t.dirs.includes(d))), ruleDirs = r.shuffle([...t.dirs, ...others.slice(0, t.k - t.dirs.length)]);
    const signs = r.sample(SIGNS, t.k), rules = ruleDirs.map((d, i) => [signs[i][0], d]), signOf = d => signs[ruleDirs.indexOf(d)];
    const qHtml = `${rulesHtml(rules)}<div class="rsee"><span class="rbot">🤖</span>${t.dirs.map(d => `<span class="rsign">${signOf(d)[0]}</span>`).join('')}</div>`;
    if (t.dirs.length === 1) {
      const d = t.dirs[0], ruleOthers = r.shuffle(ruleDirs.filter(x => x !== d)), rest = r.shuffle(ORDER.filter(x => x !== d && !ruleOthers.includes(x)));
      const wrong = [...ruleOthers, ...rest].slice(0, 2);
      return { type: 'pick', prompt: 'Merre megy a robot?', say: `A robot ${withArt(signOf(d)[1])} jelet látja. Merre megy?`, qHtml, ask: {},
        options: r.shuffle([d, ...wrong].map(x => ({ key: x, t: ARROW(x), name: NAME(x), ok: x === d, said: `Ez ${POINTS[x]} mutat.` }))),
        fact: `${cap(withArt(signOf(d)[1]))} jel azt jelenti: ${NAME(d)}.`, hint: 'Keresd meg ugyanezt a színt a kártyákon!' };
    }
    const [a, b] = t.dirs, third = ruleDirs.find(x => !t.dirs.includes(x));
    const progs = [[a, b, ''], [b, a, 'Ebben fordított a sorrend.'], r.pick([[a, third], [third, b]]).concat('Ez a nyíl nem illik a jelhez.')];
    return { type: 'pick', prompt: 'Merre lép a robot?', say: 'A robot két jelet lát, egymás után. Merre lép?', noList: true, qHtml, ask: {},
      options: r.shuffle(progs.map(([x, y, said], i) => ({ key: keyOf([x, y]), t: chipsHtml([{ dir: x, times: 1 }, { dir: y, times: 1 }]), cls: 'prog', ok: i === 0, said: said || undefined }))),
      fact: `Előbb ${NAME(a)}, aztán ${NAME(b)}.`, hint: 'Nézd meg a jeleket sorban, és keresd meg a kártyájukat!' };
  },
  solve: item => {
    const rules = readRules(item.qHtml), seen = readSeen(item.qHtml).map(e => rules[e]);
    return seen.length === 1 ? NAME(seen[0]) : keyOf(seen);
  } };

export const ALGO = [EPIT, CIKLUS, HIBA, HOVA, MELYIK, HAAKKOR];
