// A Varázsvilág tízperces próbafutása (M7/5): egy automata "gyerek" tíz percnyi játékidőt tölt a világban, és közben
// mindent kipróbál: követi a vezető fényt, gyűjtöget, megvárja a varázslényeket, távoli tájakra fut, fák alá ugrik.
// Mérjük: kivétel nincs; a rajzolási hívások és háromszögek a kereten belül; a 3D-erőforrások száma nem nő; a
// képkocka-frissítés gyors; nem ragad be; Rozi ritkán szól; és a játék közben tényleg történik valami.
// A játékidő gyorsított (a teszt lépteti), a kép minden hatodik lépésben készül el. Futtatás: tests/soak.html.
import { run as runWorld } from '../js/rewards/openworld.js';

const DT = 1 / 30, RENDER_EVERY = 6;
const GAME_S = 60 * (+new URLSearchParams(location.search).get('perc') || 10);   // ?perc=1: rövid próba
const r1 = v => Math.round(v * 10) / 10;

export async function runSoak(list) {
  const results = [], ok = (name, pass, info = '') => { results.push({ name, pass: !!pass, info: String(info) }); if (list) list.insertAdjacentHTML('beforeend', `<li class="${pass ? 'ok' : 'bad'}">${pass ? '✔' : '✖'} ${name} <small>${info}</small></li>`); };
  const errors = [];
  const onErr = e => errors.push(String(e.message || e.reason || e));
  window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
  const h = document.createElement('div'); h.style.cssText = 'position:fixed;left:0;top:0;width:1024px;height:768px;opacity:0;pointer-events:none'; document.body.appendChild(h);
  const got = { finds: [], picks: 0, gifts: 0, meets: [], hearts: 0 };
  const stop = runWorld(h, { manual: true, heart: () => { got.hearts++; },
    world: { seed: 424242, found: [], met: [], adv: { i: 0, n: 0 }, onFind: id => got.finds.push(id), onPick: () => got.picks++, onAdventure: () => { got.gifts++; return { id: 'teszt' }; }, onMeet: id => got.meets.push(id) } });
  const w = h.__ow, P = w.P;
  const spoken0 = window.__spoken.length, lineT = [];
  const watchSpeech = (() => { let n = window.__spoken.length; return () => { while (n < window.__spoken.length) { lineT.push(clock); n++; } }; })();
  let clock = 0, maxCalls = 0, maxTris = 0, frames = 0, biomes = new Set(), upd = [], stuck = 0, win = { x: 0, z: 0, t: 0, moving: 0 };
  const heap = () => { try { window.gc?.(); } catch (e) {} return performance.memory ? performance.memory.usedJSHeapSize : 0; };   // gc csak --expose-gc mellett
  const samples = [];                                  // percenként: geometriák, objektumok, apróságok, memória
  const step = () => {
    const a = performance.now(); w.update(DT); upd.push(performance.now() - a);
    clock += DT; frames++;
    if (frames % RENDER_EVERY === 0) { w.render(); const s = w.stats(); maxCalls = Math.max(maxCalls, s.calls); maxTris = Math.max(maxTris, s.triangles); }
    biomes.add(w.biome()); watchSpeech();
    // beragadás: ha van célja, öt másodperc alatt legalább másfél egységet halad
    if (P.target) win.moving += DT;
    if (clock - win.t >= 5) { if (win.moving > 4.5 && Math.hypot(P.x - win.x, P.z - win.z) < 1.5) stuck++; win = { x: P.x, z: P.z, t: clock, moving: 0 }; }
    if (Math.floor(clock / 60) !== Math.floor((clock - DT) / 60)) { const s = w.stats(); samples.push({ min: Math.round(clock / 60), geo: s.geometries, tex: s.textures, obj: s.objects, chunks: s.chunks, motes: s.motes, crit: s.critterMeshes, heap: heap() }); }
  };
  // játékmásodpercenként visszaadja a vezérlést a böngészőnek (mint az igazi játék képkockánként): így a lejátszott
  // hangok és a többi háttérmunka közben rendben felszabadul, és a memória-mérés a valódi játékot mutatja
  const breathe = () => new Promise(r => setTimeout(r, 0));
  const run = async secs => { const end = clock + secs; while (clock < end && clock < GAME_S) { step(); if (frames % 30 === 0) await breathe(); } };
  const near = (list, f = x => x) => list.map(f).filter(Boolean).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
  try {
    await run(1);
    let phase = 0, heading = 0.7;
    while (clock < GAME_S) {
      const kind = phase++ % 5;
      if (kind === 0) {                                  // a vezető fény után
        const before = got.finds.length; w.guide.click(); if (!w.guide.hidden || w.goal()) { const g = w.goal(); if (g) w.setTarget(g.x, g.z); }
        for (let s = 0; s < 40 && got.finds.length === before && clock < GAME_S; s++) { await run(1); const g = w.goal(); if (g && !P.target) w.setTarget(g.x, g.z); }
      } else if (kind === 1) {                           // gyűjtögetés
        for (let s = 0; s < 8 && clock < GAME_S; s++) { const it = near(w.items()); if (!it || Math.hypot(it.x - P.x, it.z - P.z) > 45) break; w.setTarget(it.x, it.z); await run(5); }
      } else if (kind === 2) {                           // varázslény: odamegy hét egységre, megáll, vár
        const c = near(w.critters().filter(x => x.mode === 'idle'));
        if (c && Math.hypot(c.x - P.x, c.z - P.z) < 90) {
          const d = Math.hypot(P.x - c.x, P.z - c.z) || 1; w.setTarget(c.x + (P.x - c.x) / d * 8, c.z + (P.z - c.z) / d * 8);
          for (let s = 0; s < 20 && P.target && clock < GAME_S; s++) await run(1);
          P.target = null; await run(8);
        } else await run(2);
      } else if (kind === 3) {                           // felfedezés: egyenesen messzire, új tájakra
        heading += 1.3;
        for (let s = 0; s < 12 && clock < GAME_S; s++) { w.setTarget(P.x + Math.sin(heading) * 30, P.z + Math.cos(heading) * 30); await run(2.5); }
      } else {                                           // fák alá ugrálás
        for (let k = 0; k < 3 && clock < GAME_S; k++) {
          const tr = near(w.trees()); if (!tr) break;
          w.setTarget(tr.x + tr.r + 1.0, tr.z); await run(4); P.target = null; await run(0.3); w.jump(); await run(2);
        }
      }
    }
    window.__spoken.length;                              // (a beszéd-naplót a watchSpeech követte)
    const lines = lineT.length, gaps = lineT.slice(1).map((v, i) => v - lineT[i]), minGap = gaps.length ? Math.min(...gaps) : 99;
    const sorted = upd.slice().sort((a, b) => a - b), avg = upd.reduce((s, v) => s + v, 0) / upd.length, p99 = sorted[Math.floor(sorted.length * 0.99)];
    const s2 = samples.find(s => s.min === 2) || samples[0], sl = samples[samples.length - 1];
    ok(`próbafutás: ${GAME_S / 60} perc játékidő kivétel nélkül`, errors.length === 0 && clock >= GAME_S - 1, `${r1(clock / 60)} perc, ${frames} lépés; hibák: ${errors.slice(0, 3).join(' | ') || 'nincs'}`);
    ok('próbafutás: a rajzolási hívások és háromszögek végig a kereten belül', maxCalls <= 150 && maxTris <= 150000, `legtöbb: ${maxCalls} hívás, ${Math.round(maxTris / 1000)}k háromszög`);
    ok('próbafutás: a 3D-erőforrások száma nem nő (a második és a tizedik perc között)', sl.geo <= s2.geo * 1.25 + 10 && sl.tex <= s2.tex + 2 && sl.obj <= s2.obj + 20 && sl.chunks <= 49 && sl.motes <= 80,
      samples.map(s => `${s.min}. p: ${s.geo} geo, ${s.obj} obj, ${s.chunks} chunk, ${s.crit} lény, ${Math.round(s.heap / 1e6)} MB`).join(' · '));
    const h2 = s2.heap, hl = sl.heap;
    ok('próbafutás: a memória nem szalad el', !h2 || hl < h2 * 1.6, h2 ? `${Math.round(h2 / 1e6)} MB → ${Math.round(hl / 1e6)} MB` : 'a böngésző nem méri');
    ok('próbafutás: a képkocka-frissítés gyors (a rajzolás nélkül)', avg < 4 && p99 < 16, `átlag ${avg.toFixed(2)} ms, 99%: ${p99.toFixed(2)} ms`);
    ok('próbafutás: nem ragad be', stuck <= 1, `beragadt ötmásodperces szakasz: ${stuck}`);
    const full = GAME_S >= 600;                          // a beszéd-átlag és a "tényleg játszik" küszöbe a tízperces futásra szól
    ok('próbafutás: Rozi ritkán szól (átlagban legfeljebb percenként négyszer, és nem egymás szavába)', (!full || lines / (GAME_S / 60) <= 4) && minGap >= 1.5, `${lines} mondat, legkisebb szünet ${r1(minGap)} mp${full ? '' : ' (rövid próba: csak a szünetet nézzük)'}`);
    ok('próbafutás: közben tényleg játszik (nevezetesség, kaland, varázslény, tájak)', !full || (new Set(got.finds).size >= 3 && got.gifts >= 1 && new Set(got.meets).size >= 2 && biomes.size >= 3),
      (full ? '' : 'rövid próba, nem mérjük · ') +
      `nevezetesség: ${[...new Set(got.finds)].join(',')}; felvett: ${got.picks}, kaland-ajándék: ${got.gifts}; barát: ${[...new Set(got.meets)].join(',')}; tájak: ${[...biomes].join(',')}; szív: ${got.hearts}`);
    window.__soak = { samples, lines: window.__spoken.slice(spoken0) };
  } catch (e) {
    ok('próbafutás: kivétel', false, e.stack || e);
  } finally {
    stop(); h.remove(); window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
  }
  window.__results = results;
  return results;
}
