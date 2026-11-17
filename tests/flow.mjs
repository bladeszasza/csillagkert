// Szimulált ülés a valódi index.html-en (M8, a 6.3 mátrix egységként-sorai): indulás → feladatok → etetés → jutalomkapu
// → jutalomjáték és vissza → pihenő → szülői sarok (haladás-térkép, pihenő-beállítás, kiejtés-javító) → újratöltés.
// Friss, ideiglenes Chrome-profillal fut, ál-felolvasóval és kitalált tesztnévvel; az órát a teszt előreállítja.
// Futtatás (a tesztszerver a 8124-es porton): node tests/flow.mjs [http://localhost:8124/index.html]
// A Chrome helye a CHROME környezeti változóval adható meg. Képernyőképek: SHOTS=<mappa>.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:8124/index.html';
if (!/^http:\/\/localhost:8124\//.test(url)) throw new Error('csak a 8124-es tesztszerveren fut (a mentéshez nyúl)');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', port = 9500 + Math.floor(Math.random() * 300);
const dir = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'flow-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1024,768', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(), exceptions = [], consoleErrors = [];
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) exceptions.push('teszt: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 200)); return r.result?.result?.value; };
const results = [], ok = (name, pass, info = '') => { results.push(pass); console.log(`${pass ? 'OK  ' : 'HIBA'} ${name}${info ? ' :: ' + info : ''}`); };

// kitalált tesztprofil: 40 csillag, a mérőn 3, a jutalomhoz 5 kell, pihenő 15 percenként
const SEED = `(() => {
  try {
    if (!localStorage.getItem('csillagkert:profiles')) {
      localStorage.setItem('csillagkert:profiles', JSON.stringify({ v: 1, ids: ['p1'], active: 'p1' }));
      localStorage.setItem('csillagkert:p:p1', JSON.stringify({ v2: true, name: 'Teszt Elek', nameAsked: true, introDone: true, total: 40, meter: 3, rewardMinutes: 2, perReward: 5, breakMin: 15, friends: [] }));
    }
  } catch (e) {}
  const realNow = Date.now; window.__dt = 0; Date.now = () => realNow() + window.__dt;   // a teszt előreállíthatja az órát
  window.__spoken = [];
  const fake = { speaking: false, pending: false, getVoices: () => [{ lang: 'hu-HU', name: 'Teszt hang', voiceURI: 'teszt', localService: true }], addEventListener() {}, removeEventListener() {},
    cancel() { this.speaking = false; const u = this._u; this._u = null; if (u) { clearTimeout(u._t); setTimeout(() => u.onend && u.onend({}), 0); } },
    speak(u) { window.__spoken.push(u.text); this.speaking = true; this._u = u; setTimeout(() => u.onstart && u.onstart({}), 0); u._t = setTimeout(() => { this.speaking = false; this._u = null; u.onend && u.onend({}); }, 120); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
})();`;
const said = async from => JSON.parse((await ev(`JSON.stringify(window.__spoken.slice(${from}))`)) || '[]');
const n = async () => ev('window.__spoken.length');
const state = async () => JSON.parse(await ev(`localStorage.getItem('csillagkert:p:p1')`));
const visible = sel => ev(`(() => { const e = document.querySelector('${sel}'); return !!e && !e.hidden && e.getClientRects().length > 0; })()`);
const shot = async name => { if (!process.env.SHOTS) return; const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(process.env.SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64')); };
// válaszgombos feladat megoldása: sorra koppint, amíg a feladat be nem zárul; ha nem válaszgombos, kilép (X)
const solve = async () => {
  for (let k = 0; k < 60; k++) {
    const r = await ev(`(() => { const st = document.getElementById('stage'); if (st.hidden) return 'done';
      const b = [...st.querySelectorAll('.answer')].filter(x => !x.disabled && x.offsetParent && !x.classList.contains('gone') && !x.classList.contains('nope'));
      if (!b.length) return 'none'; const x = b[(window.__k = ((window.__k || 0) + 1)) % b.length];
      const r = x.getBoundingClientRect(), o = { bubbles: true, pointerId: 5, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: 'touch' };
      x.dispatchEvent(new PointerEvent('pointerdown', o)); x.dispatchEvent(new PointerEvent('pointerup', o)); x.click(); return 'tap'; })()`);
    if (r === 'done') return 'done';
    if (r === 'none' && k > 6) { await ev(`document.getElementById('stage-x').click()`); await sleep(800); return 'skip'; }
    await sleep(r === 'none' ? 700 : 1200);
  }
  await ev(`document.getElementById('stage-x').click()`); return 'skip';
};
const waitFor = async (expr, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(expr)) return true; await sleep(250); } return false; };

try {
  let target;
  for (let k = 0; k < 50 && !target; k++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch (e) { await sleep(200); } }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200) || m.params.exceptionDetails?.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 200));
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: SEED });
  await send('Page.navigate', { url });
  await waitFor('!!document.getElementById("break").__timer', 30000); await sleep(1500);   // a modulok betöltődtek

  // 1) indulás
  let s0 = await n();
  await ev(`document.getElementById('start-btn').click()`);
  const home = await waitFor(`!document.getElementById('home').hidden`);
  ok('indulás: a kezdőgomb után a kert és a térkép látszik, Rozi köszön', home && (await said(s0)).length >= 1, (await said(s0)).join(' | ').slice(0, 160));
  // 2) feladatok és etetés a jutalomkapuig (válaszgombos állomások és a "Tovább")
  let solved = 0, skipped = 0, tries = 0;
  for (const st of ['forma', 'allat', 'next', 'szamol', 'next', 'okos', 'next', 'vilag', 'next', 'hang']) {
    if (await visible('#reward')) break;
    tries++;
    await waitFor(`!document.getElementById('home').hidden || !document.getElementById('reward').hidden`, 12000);
    if (await visible('#reward')) break;
    await ev(st === 'next' ? `document.getElementById('next').click()` : `document.querySelector('.station[data-st=${st}]').click()`);
    await waitFor(`!document.getElementById('stage').hidden`, 8000);
    const r = await solve(); r === 'done' ? solved++ : skipped++;
  }
  const gate = await waitFor(`!document.getElementById('reward').hidden`, 15000);
  await shot('flow-reward');
  ok('feladatok: megoldva a jutalomkapuig, a csillagok mentve', gate && (await state()).total >= 42, `megoldva ${solved}, kilépve ${skipped}, összes csillag ${(await state()).total}`);
  // 3) jutalomjáték és vissza
  await ev(`document.querySelector('.choice[data-game=bubbles]').click()`); await sleep(3500);
  const inGame = await visible('#game');
  await ev(`document.getElementById('game-back').click()`);
  const back = await waitFor(`document.getElementById('game').hidden && document.getElementById('reward').hidden`, 10000);
  ok('jutalomjáték: elindul, a vissza gombbal hazatér', inGame && back);
  await waitFor(`!document.getElementById('home').hidden`, 8000);
  // 4) pihenő: 16 perc látható játék után a következő feladat előtt
  await ev(`window.__dt = 16 * 60000`);
  s0 = await n();
  await ev(`document.querySelector('.station[data-st=forma]').click()`);
  const brk = await waitFor(`!document.getElementById('break').hidden`, 5000);
  await sleep(500); await shot('flow-break');
  const brLine = (await said(s0)).join(' | '), taskHeld = await ev(`document.getElementById('stage').hidden`);
  ok('pihenő: a beállított idő után két feladat között jön, egy mondattal; a feladat addig vár', brk && /vizet/.test(brLine) && taskHeld, brLine);
  await ev(`document.getElementById('break-go').click()`);
  const after = await waitFor(`document.getElementById('break').hidden && !document.getElementById('stage').hidden`, 8000);
  ok('pihenő: a nagy gombra eltűnik, és a választott feladat indul', after);
  await solve(); await waitFor(`!document.getElementById('home').hidden`, 10000);
  const noAgain = !(await ev(`document.getElementById('break').__timer.due()`));
  ok('pihenő: utána elölről számol (nem jön rögtön újra)', noAgain);
  // 5) szülői sarok: 3 mp nyomva tartás
  await ev(`(() => { const b = document.getElementById('parent-btn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); })()`);
  const panel = await waitFor(`!document.getElementById('parent').hidden`, 5000);
  const map = await ev(`(() => { const d = [...document.querySelectorAll('#p-stats details.pm')]; return { n: d.length, lv: d.filter(x => x.querySelector('.pm-lv i.on')).length, names: d.map(x => x.querySelector('.pm-lvname').textContent), skills: document.querySelectorAll('#p-stats td').length }; })()`);
  const stations = await ev(`document.querySelectorAll('.station[data-st]').length`);
  await ev(`(() => { const d = document.querySelector('#p-stats details.pm[data-st=forma]'); d.open = true; document.getElementById('p-stats').scrollIntoView(); })()`); await sleep(300); await shot('flow-parent');
  ok('szülői sarok: nyomva tartásra nyílik; a haladás-térképen minden állomás, a bejárt helyeken szinttel', panel && map.n === stations && map.lv >= 1 && map.names.includes('előkészítő') && map.skills > 100,
    `${map.n}/${stations} állomás, szinttel ${map.lv}; készség-sorok ${map.skills / 2}`);
  if (process.env.SHOTS) {   // a nyomtatási nézet (a Nyomtatás gomb ugyanezt a nézetet kapcsolja be)
    await ev("(() => { document.querySelectorAll('#p-stats details.pm').forEach(d => { d.open = true; }); document.body.classList.add('print-progress'); })()");
    const pdf = await send('Page.printToPDF', { printBackground: true, paperWidth: 8.27, paperHeight: 11.69 }); writeFileSync(join(process.env.SHOTS, 'flow-haladas.pdf'), Buffer.from(pdf.result.data, 'base64'));
    await send('Emulation.setEmulatedMedia', { media: 'print' }); const pm = await send('Page.getLayoutMetrics');
    const img = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1024, height: Math.min(4000, Math.ceil(pm.result.cssContentSize.height)), scale: 0.6 } }); writeFileSync(join(process.env.SHOTS, 'flow-haladas.png'), Buffer.from(img.result.data, 'base64'));
    await send('Emulation.setEmulatedMedia', { media: '' });
    await ev("(() => { document.querySelectorAll('#p-stats details.pm').forEach(d => { d.open = false; }); document.body.classList.remove('print-progress'); })()");
  }
  ok('szülői sarok: a pihenő-beállítás a profilé (15 perc)', (await ev(`document.getElementById('p-break').value`)) === '15');
  // kiejtés-javító: felvesz egy javítást, Rozi azonnal a javított alakot mondja
  s0 = await n();
  await ev(`(() => { document.getElementById('p-fix').open = true; document.getElementById('p-fix-word').value = 'Csillagkert'; document.getElementById('p-fix-say').value = 'Csil-lag-kert'; document.getElementById('p-fix-add').click(); })()`);
  await sleep(600);
  const fixSaid = (await said(s0)).join(' | '), fixRows = await ev(`document.querySelectorAll('#p-fix-list .fx').length`);
  ok('kiejtés-javító: a javítás megmarad, és Rozi úgy mondja', fixRows === 1 && /Csil-lag-kert/.test(fixSaid) && /Csil-lag-kert/.test(await ev(`localStorage.getItem('csillagkert:device')`)), fixSaid);
  await ev(`document.getElementById('p-break').value = '30'`); await ev(`document.getElementById('p-close').click()`); await sleep(800);
  ok('szülői sarok: a "Kész" a pihenő-beállítást menti (30 perc)', (await state()).breakMin === 30);
  // 6) újratöltés: minden megmarad
  const before = await state();
  await send('Page.navigate', { url }); await sleep(4000);
  const re = await state(), dev = await ev(`localStorage.getItem('csillagkert:device')`);
  ok('újratöltés: a csillagok, a mérő, a pihenő és a kiejtés-javítás megmaradt', re.total === before.total && re.meter === before.meter && re.breakMin === 30 && /Csil-lag-kert/.test(dev), `csillag ${re.total}, mérő ${re.meter}`);
  // 7) hibamentesség
  const log = await ev(`localStorage.getItem('csillagkert_errors')`);
  ok('konzol: nincs kivétel, nincs konzol-hiba, üres a hibanapló', !exceptions.length && !consoleErrors.length && (!log || log === '[]'), [...exceptions, ...consoleErrors].join(' | ').slice(0, 400) || 'tiszta');
} catch (e) {
  ok('szimulált ülés: kivétel', false, e.stack || e);
} finally {
  try { ws?.close(); } catch (e) {} proc.kill(); await sleep(400); try { rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  const bad = results.filter(x => !x).length;
  console.log(`${results.length} ellenőrzés, ${results.length - bad} zöld, ${bad} piros`);
  process.exitCode = bad ? 1 : 0;
}
