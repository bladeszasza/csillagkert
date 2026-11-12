// Böngészős füstteszt: nyisd meg a tests/smoke.html oldalt a helyi kiszolgálón (node serve.cjs . 8080).
// A beszédet egy ál-felolvasó helyettesíti (lásd smoke.html), így mérhető, mikor és mit mondana Rozi.
import { scheduleNote, buildChain } from '../js/audio.js';
import { setScope } from '../js/scope.js';
import { stopSpeaking } from '../js/voice.js';
import { CURRICULUM } from '../js/curriculum.js';
import { createGarden } from '../js/garden.js';
import { soundLog, VOICE } from '../js/sounds.js';
import { MEALS, ANY, friendById } from '../js/friends.js';

const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass: !!pass, info: String(info) }); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const host = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:650px;opacity:0;pointer-events:none'; document.body.appendChild(d); return d; };
const spoken = () => window.__spoken.length;

// --- 1. hangerő: a zenei hang átlagos szintje (RMS) a teljes hosszra, régi és új megvalósítás ---
async function rms(render, secs = 1.2) {
  const c = new OfflineAudioContext(1, Math.ceil(44100 * (secs + 0.3)), 44100); render(c);
  const d = (await c.startRendering()).getChannelData(0), n = Math.floor(44100 * secs);
  let s = 0; for (let i = 0; i < n; i++) s += d[i] * d[i];
  return Math.sqrt(s / n);
}
function oldTone(c, freq, vol = 0.3, dur = 1.2) {          // a javítás előtti music.js hangja, változatlanul
  for (const [type, g] of [['sine', 1], ['triangle', 0.35]]) {
    const o = c.createOscillator(), gain = c.createGain(); o.type = type; o.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, 0); gain.gain.exponentialRampToValueAtTime(vol * g, 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, dur);
    o.connect(gain); gain.connect(c.destination); o.start(0); o.stop(dur + 0.05);
  }
}
const newTone = (freq, vol = 0.8) => c => scheduleNote(c, buildChain(c).buses.music, freq, { dur: 1.2, vol });
async function testLoudness() {
  for (const [label, f] of [['dó (régi 262 Hz)', 261.63], ['lá (440 Hz)', 440]]) {
    const before = await rms(c => oldTone(c, f)), after = await rms(newTone(f === 261.63 ? 523.25 : 880));
    ok(`zene hangosabb: ${label}`, after >= before * 3, `régi ${before.toFixed(4)} → új ${after.toFixed(4)} (${(after / before).toFixed(1)}×)`);
  }
  const quietOld = await rms(c => oldTone(c, 392, 0.06)), quietNew = await rms(newTone(784, 0.22)), loudNew = await rms(newTone(784, 1));
  ok('a "halk" példa is hallható', quietNew >= quietOld * 3, `régi ${quietOld.toFixed(4)} → új ${quietNew.toFixed(4)}`);
  ok('a halk és a hangos jól megkülönböztethető', loudNew >= quietNew * 2, `halk ${quietNew.toFixed(4)}, hangos ${loudNew.toFixed(4)}`);
  const peak = await (async () => { const c = new OfflineAudioContext(1, 44100, 44100), chain = buildChain(c); for (const f of [392, 523, 659, 784, 1047, 1319]) scheduleNote(c, chain.buses.music, f, { dur: 0.8, vol: 1 }); const d = (await c.startRendering()).getChannelData(0); let m = 0; for (const v of d) m = Math.max(m, Math.abs(v)); return m; })();
  ok('hat hang egyszerre sem torzít (csúcs < 1)', peak < 0.999, `csúcs ${peak.toFixed(3)}`);
}

// --- 2. a jó válasz helye egyenletes (matek, számolás) ---
async function positions(file, item, correct, runs = 90) {
  const mod = await import(`../js/activities/${file}.js`), count = [0, 0, 0];
  for (let i = 0; i < runs; i++) {
    const ac = new AbortController(), d = host(); setScope(ac.signal);
    mod.run(d, item);
    const idx = [...d.querySelectorAll('.answer')].findIndex(b => +b.dataset.n === correct);
    if (idx >= 0) count[idx]++;
    ac.abort(); stopSpeaking(); setScope(null); d.remove();
  }
  return count;
}
async function testPositions() {
  for (const [file, item, correct] of [['math', { a: 3, b: 2, op: '+' }, 5], ['count', { n: 7 }, 7]]) {
    const c = await positions(file, item, correct);
    ok(`${file}: a jó válasz helye véletlen`, Math.min(...c) >= 15, `bal/közép/jobb: ${c.join(' / ')}`);
  }
}

// --- 0. a mérőeszköz működik: az ál-felolvasó tényleg rögzíti, amit Rozi mond ---
async function testHarness() {
  const mod = await import('../js/activities/count.js'), ac = new AbortController(), d = host(), before = spoken(); setScope(ac.signal);
  mod.run(d, { n: 4 }); await wait(400);
  ok('a teszt hallja Rozit (az ál-felolvasó rögzít)', spoken() > before, `rögzített mondatok: ${spoken() - before}`);
  ok('a teszt nem nyúl a valódi mentéshez (memóriában élő tároló)', window.__memStorage === true, window.__memStorage ? 'a localStorage helyén ál-tároló van' : 'A VALÓDI localStorage van használatban!');
  ac.abort(); stopSpeaking(); setScope(null); d.remove(); await wait(300);
}

// --- 3. megszakítás (X): utána semmi nem szólal meg ---
async function testAbort() {
  for (const [file, item, poke] of [
    ['count', { n: 6 }, d => [...d.querySelectorAll('.answer')].find(b => +b.dataset.n !== 6).click()],
    ['math', { a: 4, b: 2, op: '+' }, d => [...d.querySelectorAll('.answer')].find(b => +b.dataset.n !== 6).click()],
    ['clap', { word: { t: '🍎', name: 'alma', parts: ['al', 'ma'] } }, d => d.querySelector('.clap').click()],
    ['music', { mode: 'highlow', notes: [] }, () => {}],
  ]) {
    const mod = await import(`../js/activities/${file}.js`);
    const ac = new AbortController(), d = host(); setScope(ac.signal);
    const start = spoken();
    mod.run(d, item); await wait(350); poke(d); await wait(500);
    ac.abort(); stopSpeaking(); setScope(null); d.remove();
    const before = spoken(); await wait(2600);
    ok(`${file}: megszakítás után csend`, spoken() === before && before > start, `előtte ${before - start} mondat, a megszakítás után ${spoken() - before}`);
  }
}

// --- 4. tapsolás: a megoldás nem látszik előre ---
async function testClap() {
  const mod = await import('../js/activities/clap.js'), ac = new AbortController(), d = host(); setScope(ac.signal);
  mod.run(d, { word: { t: '🐘', name: 'elefánt', parts: ['e', 'le', 'fánt'] } });
  ok('tapsolás: induláskor nincs előre kirakott pötty', d.querySelectorAll('#taps .dot').length === 0 && d.querySelectorAll('.dots .dot').length === 0, `pöttyök: ${d.querySelectorAll('#taps .dot').length}`);
  ac.abort(); stopSpeaking(); setScope(null); d.remove();
}

// --- 5. minden feladattípus elindul kivétel nélkül ---
async function testStart() {
  const seenTypes = new Set();
  for (const it of CURRICULUM) {
    if (seenTypes.has(it.type + (it.mode || ''))) continue; seenTypes.add(it.type + (it.mode || ''));
    const ac = new AbortController(), d = host(); setScope(ac.signal);
    let err = null;
    try {
      const mod = await import(`../js/activities/${it.type}.js`); const p = mod.run(d, it); p?.catch?.(e => { err = e; });
      for (let k = 0; k < 60 && !d.children.length && !err; k++) await wait(50);      // a lecke-sor a lépését külön tölti be: lassú hálózaton tovább tart
    } catch (e) { err = e; }
    ok(`elindul: ${it.type}${it.mode ? ' / ' + it.mode : ''}`, !err && d.children.length > 0, err ? err.message : '');
    ac.abort(); stopSpeaking(); setScope(null); d.remove(); await wait(30);
  }
}

// --- 6. a kert lakói és az etetés a kert valódi 3D állatával ---
const pev = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9, clientX: x, clientY: y, pointerType: 'touch' }));
const mid = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const tap = el => { const [x, y] = mid(el); pev(el, 'pointerdown', x, y); pev(el, 'pointerup', x, y); };
const dragTo = (el, tx, ty) => { const [x, y] = mid(el); pev(el, 'pointerdown', x, y); for (let k = 1; k <= 5; k++) pev(el, 'pointermove', x + (tx - x) * k / 5, y + (ty - y) * k / 5); pev(el, 'pointerup', tx, ty); };
const foodBtn = (d, n) => [...d.querySelectorAll('.food')].find(b => b.getAttribute('aria-label') === n);
const feedItem = (kind, good) => { const m = MEALS.find(x => x[0] === kind && x[1] === good), f = friendById(kind), base = { type: 'feed', kind, animal: f.emoji, name: f.name }; return good === ANY ? { ...base, any: m.slice(2) } : { ...base, good, wrong: m.slice(2) }; };
const kindsSince = n => soundLog.slice(n).map(x => x.kind).join(',');

async function testGarden() {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:650px;opacity:0;pointer-events:none'; document.body.appendChild(canvas);
  let garden; try { garden = createGarden(canvas); } catch (e) { ok('kert: a 3D jelenet elindul', false, e.message); return; }
  garden.setStars(10, []);
  let d = garden.debug();
  ok('kert: 10 csillagnál a cica, a nyuszi és a kutya lakik itt', d.friends.join() === 'cat,bunny,dog' && d.flowers === 10, `lakók: ${d.friends.join(', ')}; virágok: ${d.flowers}; rajzolási hívások: ${d.calls}`);
  const g0 = soundLog.length;
  garden.setStars(70, []); await wait(2900);                  // az új barátok besétálnak az ösvényen: megvárjuk őket
  d = garden.debug(); const calls70 = d.calls;
  const greet = soundLog.slice(g0).map(x => x.kind).sort().join(',');
  ok('kert: az érkező barát megszólal a saját hangján', greet === [VOICE.fox, VOICE.bear, VOICE.panda].sort().join(','), greet);
  // térkép: az állomások jelei a kerti tereptárgyaikon ülnek, a képen belül, egymást nem takarva
  const pl = garden.places(), ids = Object.keys(pl || {}), near = [];
  for (let i = 0; i < ids.length; i++) for (let j = 0; j < i; j++) if (Math.abs(pl[ids[i]].x - pl[ids[j]].x) < 70 && Math.abs(pl[ids[i]].y - pl[ids[j]].y) < 70) near.push(`${ids[i]}~${ids[j]}`);
  const off = ids.filter(k => pl[k].x < 33 || pl[k].x > 867 || pl[k].y < 80 || pl[k].y > 617);
  const onFriend = ids.filter(k => Object.values(d.screen).some(r => pl[k].x > r.left + 10 && pl[k].x < r.right - 10 && pl[k].y > r.top + 10 && pl[k].y < r.bottom - 10));
  ok('térkép: mind a 13 állomásnak van megkoppintható helye a kertben', ids.length === 13 && !near.length && !off.length && !onFriend.length, `jelek: ${ids.length}; egymáson: ${near.join(' ') || '–'}; képen kívül: ${off.join(' ') || '–'}; baráton: ${onFriend.join(' ') || '–'}`);
  ok('kert: 70 csillagnál mind a hat barát itt van', d.friends.length === 6 && d.flowers === 70, `lakók: ${d.friends.join(', ')}`);
  ok('kert: legfeljebb 150 rajzolási hívás (régen 70 virággal kb. 600 volt)', d.calls <= 150, `hívások: ${d.calls}, háromszögek: ${d.triangles}`);
  const out = Object.entries(d.screen).filter(([, r]) => r.left < 0 || r.right > 900 || r.top < 0 || r.bottom > 650).map(([k]) => k);
  ok('kert: minden barát a képen van', out.length === 0, out.length ? `kilóg: ${out.join(', ')}` : Object.entries(d.screen).map(([k, r]) => `${k} ${Math.round(r.cx)},${Math.round(r.cy)}`).join(' · '));
  garden.setStars(300, []); d = garden.debug();
  // (a 70 virágos mérésnél az érkező barátok szívecskéi is látszhatnak, ezért itt kevesebb hívás is lehet – több nem)
  ok('kert: 300 virág sem kerül több rajzolási hívásba (nincs 70-es plafon)', d.flowers === 300 && d.calls <= calls70, `virágok: ${d.flowers}, hívások: ${d.calls}, háromszögek: ${d.triangles}`);

  const feed = await import('../js/activities/feed.js'), canvases = document.querySelectorAll('canvas').length;
  // a) jó étel a szájához húzva
  {
    const ac = new AbortController(), h = host(), s0 = spoken(), l0 = soundLog.length; let done = false; setScope(ac.signal);
    feed.run(h, feedItem('fox', 'hús'), { garden }).then(() => { done = true; });
    await wait(2800);
    const g = garden.debug(), r = g.screen.fox, w = h.querySelector('#feed-win').getBoundingClientRect();
    ok('etetés: a róka az etetőhelyre jött, a kamera ráközelített', g.feeding === 'fox' && g.zoom > 0.99 && r.top > w.top - 10 && r.bottom < w.bottom + 10 && Math.abs(r.cx - (w.left + w.width / 2)) < 30, `a róka a képen: ${Math.round(r.left)}–${Math.round(r.right)} × ${Math.round(r.top)}–${Math.round(r.bottom)}; az ablak: ${Math.round(w.top)}–${Math.round(w.bottom)}`);
    dragTo(foodBtn(h, 'hús'), r.mouth.x, r.mouth.y);
    await wait(4300);
    ok('etetés (húzás): a jó ételt megeszi, a feladat kész', done);
    ok('etetés: rágás után az állat a SAJÁT hangján szól', kindsSince(l0) === `munch,munch,munch,${VOICE.fox}`, kindsSince(l0));
    ok('etetés: jó válasznál Rozi csak egyszer szólal meg', spoken() - s0 === 1, window.__spoken.slice(s0).join(' | '));
    garden.endFeed(); setScope(null); h.remove(); await wait(1300);
    const e = garden.debug();
    ok('etetés után a kamera visszatér, és nem marad új 3D-vászon', e.zoom === 0 && e.feeding === null && document.querySelectorAll('canvas').length === canvases, `közelítés: ${e.zoom}, vásznak: ${document.querySelectorAll('canvas').length}`);
  }
  // b) két tévedés: az első szó nélkül, a második után egy tanító mondat; aztán koppintással a jó étel
  {
    const ac = new AbortController(), h = host(), s0 = spoken(), l0 = soundLog.length; let done = false; setScope(ac.signal);
    feed.run(h, feedItem('dog', 'csont'), { garden }).then(() => { done = true; });
    await wait(2800);
    tap(foodBtn(h, 'bambusz')); await wait(1800);
    const afterFirst = spoken() - s0;
    tap(foodBtn(h, 'széna')); await wait(2100);
    const said = window.__spoken.slice(s0), gone = h.querySelectorAll('.food.gone').length, glow = h.querySelector('.food.glow')?.getAttribute('aria-label');
    ok('etetés: az első tévedésnél Rozi nem szól, a másodiknál megtanítja', afterFirst === 1 && said.length === 2 && said[1] === 'A kutya csontot eszik.' && gone === 1 && glow === 'csont', said.join(' | '));
    ok('etetés: tévedésnél nem szól az állat öröm-hangja', kindsSince(l0) === '', kindsSince(l0) || 'nincs állathang');
    tap(foodBtn(h, 'csont')); await wait(4300);
    ok('etetés (koppintás): két tévedés után is befejezhető, összesen két Rozi-mondattal', done && spoken() - s0 === 2 && kindsSince(l0).endsWith(VOICE.dog), `${window.__spoken.slice(s0).join(' | ')} · ${kindsSince(l0)}`);
    garden.endFeed(); setScope(null); h.remove(); await wait(300);
  }
  // c) megszakítás (X) etetés közben: csend, és a kert visszaáll
  {
    const ac = new AbortController(), h = host(), s0 = spoken(); setScope(ac.signal);
    feed.run(h, feedItem('panda', 'bambusz'), { garden });
    await wait(2800); tap(foodBtn(h, 'hal')); await wait(300);
    ac.abort(); stopSpeaking(); garden.endFeed(); setScope(null); h.remove();
    const before = spoken(), l0 = soundLog.length; await wait(2600);
    const e = garden.debug();
    ok('feed: megszakítás után csend, a kamera visszatér', spoken() === before && before > s0 && soundLog.length === l0 && e.feeding === null && e.zoom === 0, `előtte ${before - s0} mondat, utána ${spoken() - before}; hangok utána: ${soundLog.length - l0}`);
  }
  // e) a maci mindenevő: bármelyik felkínált ételt megeszi, tévedés nincs
  for (const pick of feedItem('bear', ANY).any) {
    const ac = new AbortController(), h = host(), s0 = spoken(), l0 = soundLog.length; let done = false; setScope(ac.signal);
    feed.run(h, feedItem('bear', ANY), { garden }).then(() => { done = true; });
    await wait(2800); tap(foodBtn(h, pick)); await wait(4300);
    const said = window.__spoken.slice(s0);
    ok(`maci: ${pick} – ez is jó neki (nincs rossz válasz)`, done && said.length === 1 && /sokfélét eszik/.test(said[0]) && kindsSince(l0) === `munch,munch,munch,${VOICE.bear}` && !h.querySelector('.food.gone, .food.glow'), `${said.join(' | ')} · ${kindsSince(l0)}`);
    garden.endFeed(); setScope(null); h.remove(); await wait(300);
  }
  // d) 3D kert nélkül is megoldható (az állat képével)
  {
    const ac = new AbortController(), h = host(), s0 = spoken(), l0 = soundLog.length; let done = false; setScope(ac.signal);
    feed.run(h, feedItem('bunny', 'répa')).then(() => { done = true; });
    await wait(300); tap(foodBtn(h, 'répa')); await wait(4300);
    ok('etetés 3D kert nélkül is megoldható', done && spoken() - s0 === 1 && kindsSince(l0).endsWith(VOICE.bunny), `${window.__spoken.slice(s0).join(' | ')} · ${kindsSince(l0)}`);
    setScope(null); h.remove();
  }
  garden.pause(true); canvas.remove();
}

export async function runAll() {
  for (const t of [testHarness, testLoudness, testPositions, testClap, testStart, testAbort, testGarden]) { try { await t(); } catch (e) { ok(t.name, false, e.stack || e.message); } }
  window.__results = results;
  return results;
}
