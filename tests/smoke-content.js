// Böngészős megoldó a generált feladatokra: minden sablonból szintenként egy feladat a VALÓDI feladat-modulon fut,
// a megoldó a sablon független solve()-jával dönti el, hova koppint. Az első feladatnál előbb szándékosan téved,
// és ellenőrzi, hogy a tévedés eljut-e az ütemezőhöz ({ wrong } ≥ 1). Közben figyeli, mit mond Rozi.
import { TEMPLATES, targetsOf, build } from '../js/content/engine.js';
import { rng } from '../js/content/rng.js';
import { optionKey } from '../js/activities/pick.js';
import { setScope } from '../js/scope.js';
import { stopSpeaking } from '../js/voice.js';
import { compress } from '../js/robot-path.js';

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
}
