// Böngészős füstteszt: nyisd meg a tests/smoke.html oldalt a helyi kiszolgálón (node serve.cjs . 8080).
// A beszédet egy ál-felolvasó helyettesíti (lásd smoke.html), így mérhető, mikor és mit mondana Rozi.
import { scheduleNote, buildChain } from '../js/audio.js';
import { setScope } from '../js/scope.js';
import { stopSpeaking } from '../js/voice.js';
import { CURRICULUM } from '../js/curriculum.js';

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
    mod.run(d, item); await wait(350); poke(d); await wait(500);
    ac.abort(); stopSpeaking(); setScope(null); d.remove();
    const before = spoken(); await wait(2600);
    ok(`${file}: megszakítás után csend`, spoken() === before, `mondatok a megszakítás után: ${spoken() - before}`);
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

export async function runAll() {
  for (const t of [testLoudness, testPositions, testClap, testStart, testAbort]) { try { await t(); } catch (e) { ok(t.name, false, e.stack || e.message); } }
  window.__results = results;
  return results;
}
