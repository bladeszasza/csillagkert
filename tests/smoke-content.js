// Böngészős megoldó a generált feladatokra: minden sablonból szintenként egy feladat a VALÓDI feladat-modulon fut,
// a megoldó a sablon független solve()-jával dönti el, hova koppint. Az első feladatnál előbb szándékosan téved,
// és ellenőrzi, hogy a tévedés eljut-e az ütemezőhöz ({ wrong } ≥ 1). Közben figyeli, mit mond Rozi.
import { TEMPLATES, targetsOf, build } from '../js/content/engine.js';
import { rng } from '../js/content/rng.js';
import { optionKey } from '../js/activities/pick.js';
import { setScope } from '../js/scope.js';
import { stopSpeaking } from '../js/voice.js';
import { compress } from '../js/robot-path.js';
import { KEPEK } from '../js/content/kepek.js';

const wait = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await wait(50); } return null; }
const host = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:700px;opacity:0;pointer-events:none'; document.body.appendChild(d); return d; };
const answerOf = o => o.n ?? (o.name || o.key);
const BAD_SPEECH = /[0-9+×÷=<>−]|\p{Extended_Pictographic}/u;

// a gomb, amire a megoldó koppint (jó vagy szándékosan rossz)
function buttonFor(d, item, right) {
  if (item.type === 'pick') {
    const ans = TEMPLATES.find(t => t.id === item.template).solve(item);
    const o = item.options.find(x => (answerOf(x) === ans) === right);
    return d.querySelector(`.answer[data-k="${CSS.escape(optionKey(o))}"]`);
  }
  const val = item.type === 'count' ? item.n : item.op === '+' ? item.a + item.b : item.a - item.b;
  const btns = [...d.querySelectorAll('.answer')];
  return btns.find(b => (+b.dataset.n === val) === right);
}

// memória: a kártyák képe szerint párosít (egy szándékos tévedéssel is próbálkozhat)
async function solveMemory(d, done) {
  const groups = new Map();
  for (const c of d.querySelectorAll('.mcard')) groups.set(c.dataset.e, [...(groups.get(c.dataset.e) || []), c]);
  const [g1, g2] = [...groups.values()];
  g1[0].click(); g2[0].click(); await wait(1200);                    // nem pár: visszafordul
  for (const [a, b] of groups.values()) { a.click(); b.click(); await wait(1150); }
  await waitFor(done, 4000);
}

// tapsolás: a megoldó annyit tapsol, ahány magánhangzó van a szóban (a gomb data-locked jelzi, mikor lehet)
async function solveClap(d, n, mistake) {
  const open = () => d.querySelector('.clap[data-locked="0"]');
  if (!await waitFor(open, 20000)) throw new Error('a tapsoló gomb nem nyílt meg');
  const tap = async k => { for (let i = 0; i < k; i++) { d.querySelector('.clap').click(); await wait(150); } };
  if (mistake) { await tap(n + 1); await waitFor(() => d.querySelector('.clap[data-locked="1"]'), 4000); if (!await waitFor(open, 30000)) throw new Error('tévedés után nem nyílt meg újra'); }
  await tap(n);
}

// hallásos feladat: a hallás-próbán (laponként egyszer) a hüvelykujjra koppint, aztán megvárja, amíg a hang lejátszódik
const ready = d => d.querySelector('.activity[data-locked="0"]');
async function openSound(d) {
  const first = await waitFor(() => d.querySelector('[data-h="1"]') || ready(d), 20000);
  if (first?.dataset.h === '1') for (let k = 0; k < 100 && d.querySelector('[data-h="1"]'); k++) { d.querySelector('[data-h="1"]').click(); await wait(100); }
  if (!await waitFor(() => ready(d), 30000)) throw new Error('a hallásos feladat nem nyílt meg');
}
// dallam-visszhang: a dallam hangjait sorban megkoppintja (tévedésnél előbb egy rossz harangot)
async function solveEcho(d, item, mistake) {
  await openSound(d);
  const bell = k => d.querySelector(`.bell[data-k="${k}"]`);
  if (mistake) {
    bell(item.bells.find(k => k !== item.melody[0])).click();
    await waitFor(() => d.querySelector('.activity[data-locked="1"]'), 3000);
    if (!await waitFor(() => ready(d), 30000)) throw new Error('tévedés után nem nyílt meg újra');
  }
  for (const k of item.melody) { if (!await waitFor(() => ready(d), 10000)) throw new Error('a harangok zárva maradtak'); bell(k).click(); await wait(120); }
}

// robotpálya: a megoldó a program gombjait nyomja (ismétlésnél előbb a ×n gombot); hibakeresésnél kiveszi a hibás lépést,
// vagy hozzáadja a hiányzót. Tévedésnek egy rossz irányú lépést (hibakeresésnél a hibás programot) futtat le.
async function solveAlgo(d, item, ans, mistake) {
  const open = () => d.querySelector('.activity.algo[data-locked="0"]');
  if (!await waitFor(open, 10000)) throw new Error('a robotpálya nem nyílt meg');
  const run = async () => { d.querySelector('#arun').click(); await waitFor(() => d.querySelector('.activity[data-locked="1"]'), 2000); };
  const press = async toks => { for (const t of toks) { if (item.loops) d.querySelector(`.amul[data-m="${t.times}"]`).click(); d.querySelector(`.acmd[data-d="${t.dir}"]`).click(); await wait(30); } };
  if (mistake) {
    if (!item.prefill?.length) await press([{ dir: ['up', 'down', 'left', 'right'].find(x => x !== ans[0]), times: 1 }]);
    await run();
    if (!await waitFor(open, 20000)) throw new Error('tévedés után nem nyílt meg újra');
  }
  if (item.prefill?.length) {
    if (ans.length < item.prefill.length) {
      let i = item.prefill.findIndex((x, k) => x !== ans[k]); if (i < 0) i = item.prefill.length - 1;
      d.querySelector(`.atok[data-i="${i}"]`).click();
    } else await press([{ dir: ans[ans.length - 1], times: 1 }]);
  } else { d.querySelector('#aclear').click(); await press(compress(ans, item.loops)); }
  await run();
}

// Ceruzavár: a megoldó tollal követi a képernyőn látható pontokat (végig ugyanazzal a mutatóval: a pen.js a toll után
// négy másodpercig nem enged ujjat). Vonalnál a vonásokat, útvesztőnél a megoldás mezőinek közepét, pöttyöknél a pöttyöket.
const penEv = (el, type, p) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'pen', pressure: 0.5, clientX: r.left + p.x, clientY: r.top + p.y })); };
const between = pts => pts.flatMap((p, i) => (i ? Array.from({ length: 6 }, (_, k) => ({ x: pts[i - 1].x + (p.x - pts[i - 1].x) * (k + 1) / 6, y: pts[i - 1].y + (p.y - pts[i - 1].y) * (k + 1) / 6 })) : [p]));
async function penStroke(el, pts) {
  penEv(el, 'pointerdown', pts[0]);
  for (let i = 1; i < pts.length; i++) { penEv(el, 'pointermove', pts[i]); if (i % 60 === 0) await wait(0); }
  penEv(el, 'pointerup', pts[pts.length - 1]); await wait(10);
}
async function solveTrace(d) {
  const box = await waitFor(() => d.querySelector('.activity.trace'), 5000); if (!box?.__trace) throw new Error('a vonalkövetés nem nyílt meg');
  for (const st of box.__trace.strokes()) await penStroke(box.__trace.canvas, st);
}
async function solveMazeUi(d, path) {
  const box = await waitFor(() => d.querySelector('.activity.maze'), 5000); if (!box?.__maze) throw new Error('az útvesztő nem nyílt meg');
  await penStroke(box.__maze.canvas, between(path.map(c => box.__maze.center(c))));
}
async function solveDots(d) {
  const box = await waitFor(() => d.querySelector('.activity.dots'), 5000); if (!box?.__dots) throw new Error('a pöttyösszekötő nem nyílt meg');
  await penStroke(box.__dots.canvas, between(Array.from({ length: box.__dots.total }, (_, i) => box.__dots.px(i))));
}

async function solveKepUi(d, ans, mistake) {
  const box = await waitFor(() => d.querySelector('.activity.kep'), 5000); if (!box?.__kep) throw new Error('a színező nem nyílt meg');
  Object.assign(d.style, { pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' });   // mint a valódi #stage; a böngésző saját találat-vizsgálata: ott koppint, ahol a gyerek is
  const hit = id => { const [x, y] = box.__kep.point(id), el = document.elementFromPoint(x, y), g = el?.closest('.kp-part');
    if (g?.dataset.p !== id) throw new Error(`a(z) ${id} rész nem koppintható (${g?.dataset.p || el?.tagName})`); return [el, x, y]; };
  const tapAt = id => { const [el, x, y] = hit(id); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 5, pointerType: 'pen', clientX: x, clientY: y })); };
  for (const g of box.querySelectorAll('.kp-part')) hit(g.dataset.p);
  if (mistake) { const other = [...box.querySelectorAll('.kp-part')].map(g => g.dataset.p).find(p => p !== ans.part), wc = ans.color === 1 ? 2 : 1;
    box.__kep.swatch(wc).click(); tapAt(other); await wait(800); }
  box.__kep.swatch(ans.color).click(); tapAt(ans.part);
}

async function solveDrawUi(d) {
  const box = await waitFor(() => d.querySelector('.activity.draw'), 5000); if (!box?.__draw) throw new Error('a rajzlap nem nyílt meg');
  box.querySelector('.done-btn').click(); await wait(50);
  if (box.classList.contains('done')) throw new Error('üres rajzlapnál is befejeződött');
  const c = box.__draw.canvas, r = c.getBoundingClientRect(), P = (x, y) => ({ x: r.width * x, y: r.height * y });
  await penStroke(c, between([P(0.3, 0.4), P(0.6, 0.5), P(0.5, 0.7)]));
  box.querySelector('.swatch[data-i="4"]').click();
  await penStroke(c, between([P(0.2, 0.2), P(0.4, 0.3)]));
  box.querySelector('.dr-undo').click();
  if (box.__draw.strokes() !== 1) throw new Error(`a visszavonás után ${box.__draw.strokes()} vonás maradt`);
  box.querySelector('.done-btn').click();
}

async function solveMatricaUi(d, ans, mistake) {
  const box = await waitFor(() => d.querySelector('.activity.matrica'), 5000); if (!box?.__matrica) throw new Error('a matrica nem nyílt meg');
  const mid = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const ev = (el, type, [x, y]) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'pen', clientX: x, clientY: y }));
  if (mistake) {                     // szándékos tévedés: koppintás egy rossz helyre (Rozi megmondja, hova került)
    const bad = [...box.querySelectorAll('.mt-slot')].find(el => !ans.includes(+el.dataset.s));
    ev(bad, 'pointerdown', mid(bad)); await wait(1800);
  }
  const st = box.querySelector('.mt-st'), to = box.__matrica.slot(ans[0]), a = mid(st), b = mid(to);
  ev(st, 'pointerdown', a);
  for (let k = 1; k <= 6; k++) { ev(st, 'pointermove', [a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6]); await wait(16); }
  ev(st, 'pointerup', b);
}

async function solveRacsUi(d, ans, mistake) {
  const box = await waitFor(() => d.querySelector('.activity.racs'), 5000); if (!box?.__racs) throw new Error('a rács nem nyílt meg');
  const tapCell = el => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, pointerType: 'pen', clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); };
  if (mistake) {                     // szándékos tévedés: egy munkacellára olyan szín, ami oda nem jó
    const nc = box.querySelectorAll('.swatch').length;
    outer: for (const [gi, s] of Object.entries(ans)) for (let i = 0; i < s.length; i++) for (let c = 1; c <= nc; c++) {
      if (String(c) === s[i] || !box.__racs.cell(+gi, i)?.classList.contains('work')) continue;
      box.__racs.swatch(String(c)).click(); tapCell(box.__racs.cell(+gi, i)); await wait(800); break outer;
    }
  }
  for (const [gi, s] of Object.entries(ans)) for (let i = 0; i < s.length; i++) {
    if (s[i] === '0' || !box.__racs.cell(+gi, i)?.classList.contains('work')) continue;
    box.__racs.swatch(s[i]).click(); tapCell(box.__racs.cell(+gi, i)); await wait(5);
  }
}

export async function testContent(ok) {
  window.__soundSpeed = 4;                                 // a hangok ugyanazok, csak gyorsabban szólnak (a teszt ideje miatt)
  const runs = [], badLines = [];
  for (const t of TEMPLATES) {
    const byLevel = new Map(); for (const x of targetsOf(t)) if (!byLevel.has(x.level)) byLevel.set(x.level, x);
    [...byLevel.values()].forEach((x, i) => runs.push({ x, mistake: i === 0 && t.graded !== false }));
  }
  let solved = 0, reported = 0, mistakes = 0;
  const fails = [];
  for (const { x, mistake } of runs) {
    const mod = await import(`../js/activities/${build(x.id, rng(1)).type}.js`);
    const item = build(x.id, rng(x.id + '#ui'));
    const ac = new AbortController(), d = host(); setScope(ac.signal);
    const s0 = window.__spoken.length;
    let result = null, err = null;
    const p = Promise.resolve(mod.run(d, item)).then(r => { result = r || {}; }, e => { err = e; });
    await wait(180);
    try {
      const tpl = TEMPLATES.find(t => t.id === item.template);
      if (item.type === 'memory') await solveMemory(d, () => result);
      else if (item.type === 'echo') { if (mistake) mistakes++; await solveEcho(d, item, mistake); await waitFor(() => result || err, 10000); }
      else if (item.type === 'trace') { await solveTrace(d); await waitFor(() => result || err, 8000); }
      else if (item.type === 'maze') { await solveMazeUi(d, tpl.solve(item)); await waitFor(() => result || err, 8000); }
      else if (item.type === 'dots') { await solveDots(d); await waitFor(() => result || err, 12000); }
      else if (item.type === 'kep') { if (mistake) mistakes++; await solveKepUi(d, tpl.solve(item), mistake); await waitFor(() => result || err, 8000); }
      else if (item.type === 'draw') { await solveDrawUi(d); await waitFor(() => result || err, 8000); }
      else if (item.type === 'matrica') { if (mistake) mistakes++; await solveMatricaUi(d, tpl.solve(item), mistake); await waitFor(() => result || err, 8000); }
      else if (item.type === 'racs') { if (mistake) mistakes++; await solveRacsUi(d, tpl.solve(item), mistake); await waitFor(() => result || err, 8000); }
      else if (item.type === 'algo') { if (mistake) mistakes++; await solveAlgo(d, item, tpl.solve(item), mistake); await waitFor(() => result || err, 15000); }
      else if (item.type === 'clap') { if (mistake) mistakes++; await solveClap(d, tpl.solve(item), mistake); await waitFor(() => result || err, 10000); }
      else {
        if (item.memo) await waitFor(() => d.querySelector('.answer'), item.memo.ms + 4000);     // "Mi tűnt el?": előbb a kép
        if (item.sound) await openSound(d);
        if (mistake) { buttonFor(d, item, false).click(); mistakes++; for (let k = 0; k < 40 && d.querySelector('.shake'); k++) await wait(50); await wait(150); }
        // a tanítás (közös számolás) alatt a gombok zárva vannak: a megoldó addig próbálkozik, amíg el nem fogadják
        const tries = item.sound ? 400 : 60;                 // hallásos feladatnál tévedés után újra szól a hang: tovább vár
        for (let k = 0; k < tries && !result && !err; k++) { if (k % 5 === 0 && (!item.sound || ready(d))) buttonFor(d, item, true)?.click(); await wait(60); }
      }
    } catch (e) { err = e; }
    if (result && !err) solved++; else fails.push(`${x.id}: ${err ? err.message : 'nem fejeződött be'}`);
    if (mistake && result && result.wrong >= 1) reported++;
    for (const line of window.__spoken.slice(s0)) if (BAD_SPEECH.test(line)) badLines.push(`${x.id}: "${line}"`);
    ac.abort(); stopSpeaking(); setScope(null); d.remove(); await wait(20);
    await Promise.race([p, wait(10)]);
  }
  delete window.__soundSpeed;
  const graded = TEMPLATES.filter(t => t.graded !== false).length;
  ok(`generált feladatok: a megoldó mind a ${runs.length} mintát megoldja a valódi feladatban (minden sablon, minden szint)`, solved === runs.length, fails.slice(0, 6).join(' · ') || `${solved} megoldva`);
  ok('generált feladatok: a szándékos tévedés eljut az ütemezőhöz', reported === mistakes && mistakes === graded, `${reported} / ${mistakes} tévedés jelentve`);
  ok('generált feladatok: Rozi nem mond számjegyet, jelet vagy emojit', badLines.length === 0, badLines.slice(0, 5).join(' · ') || 'rendben');
  // színező: minden kép minden része ott koppintható, ahol a gyerek is koppintana (a mintafeladatok csak egy képet érintenek)
  const kepMod = await import('../js/activities/kep.js'), missed = []; let parts = 0;
  for (const pic of Object.keys(KEPEK)) {
    const ac = new AbortController(), d = host(); Object.assign(d.style, { pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }); setScope(ac.signal);
    kepMod.run(d, build(`rajz.kep:${pic}:${KEPEK[pic].parts[0][0]}`, rng(1)));
    const box = await waitFor(() => d.querySelector('.activity.kep'), 3000);
    for (const p of KEPEK[pic].parts) {
      parts++;
      const [x, y] = box.__kep.point(p[0]), g = document.elementFromPoint(x, y)?.closest('.kp-part');
      if (g?.dataset.p !== p[0]) missed.push(`${pic}:${p[0]}`);
    }
    ac.abort(); stopSpeaking(); setScope(null); d.remove(); await wait(20);
  }
  ok('színező: mind a nyolc kép minden része koppintható (böngészős találat-vizsgálat)', missed.length === 0 && parts > 0, missed.join(', ') || `${parts} rész`);
}
