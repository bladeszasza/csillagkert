// Füstteszt: ajándékok és szívek (M5). Minden jutalomjáték az első igazi játék-pillanatánál ajándékot ad (az öltöztető csak fogad),
// a jó tettek szívet adnak; az ajándék-pillanat megjelenik és nyom nélkül eltűnik; a kertben ott vannak a díszek,
// a Barátság fája és az aranyvirágok, a teljesítmény-kereten belül, és egyik dísz sem takar el barátot.
import { REWARDS } from '../js/rewards/index.js';
import { CATALOG, giftById } from '../js/gifts.js';
import { GIFT_SOURCES, HEART_CAPS } from '../js/economy.js';
import { showGift, giftBusy, clearGifts } from '../js/gift-moment.js';
import { createGarden } from '../js/garden.js';
import { MAX_FLOWERS, AREAS } from '../js/friends.js';

const wait = ms => new Promise(r => setTimeout(r, ms));
const box = (w = 1024, h = 768) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none`; document.body.appendChild(d); return d; };
const spoken = () => window.__spoken.length;
const DT = 1 / 30;

// Játékonként az első igazi játék-pillanat (amit a gyerek is csinálna), a játék saját teszt-kapaszkodóin át
const DRIVE = {
  race: async h => {
    const R = h.__race; R.S.phase = 'run'; R.S.me.z = R.LEN - 0.05; R.S.rv.z = R.LEN - 15;
    for (let i = 0; i < 80; i++) R.step(1 / 20);                // célba ér (most nyer), aztán a célban összebújnak
  },
  healthy: async h => {
    const H = h.__hd;
    for (let k = 0; k < 16 && H.stats().fed < 3; k++) { if (!H.current()) H.dispense(); await wait(60); if (H.current()) await H.feed(k % 4); await wait(60); }
  },
  pet: async h => { h.__pet.choose(1); await wait(300); h.__pet.celebrate(); },
  foodcatch: async h => { for (let i = 0; i < h.__fc.FULL_AT; i++) h.__fc.feed(); },
  bubbles: async h => { for (let i = 0; i < h.__bub.GIFT_AT; i++) h.__bub.popOne(); },
  openworld: async (h, calls) => {
    const ow = h.__ow;
    for (let tries = 0; tries < 30 && !calls.gift; tries++) {
      const p = ow.pals().find(q => q.mode === 'follow' && !q.follow);
      if (p) Object.assign(ow.P, { x: p.x + 2, z: p.z, target: null }); else Object.assign(ow.P, { x: ow.P.x + 20, z: ow.P.z + 5, target: null });
      for (let i = 0; i < 15; i++) ow.update(DT);
    }
  },
  sparkhorn: async h => {
    await wait(600);
    const fw = h.querySelector('iframe').contentWindow;
    fw.__sparkhorn = { busy: () => true }; await wait(700);   // egy kör fut…
    fw.__sparkhorn = { busy: () => false }; await wait(700);  // …és véget ér
    delete fw.__sparkhorn;
  },
  dressup: async () => {},                                    // az öltöztető nem ad ajándékot: ott várnak a megnyert ruhák
};
const OPTS = { sparkhorn: { src: './blank.html', wait: 3000 }, openworld: { manual: true, seed: 101 } };

export async function testGifts(ok) {
  // 1) minden jutalomjáték ad (kivéve az öltöztetőt), és a lista egyetlen játékot sem hagy ki
  const keys = Object.keys(REWARDS), missing = keys.filter(k => !DRIVE[k]);
  ok('ajándék: a füstteszt minden jutalomjátékot ismer (js/rewards/index.js)', missing.length === 0 && [...GIFT_SOURCES, 'dressup'].sort().join() === [...keys].sort().join(), `hiányzik: ${missing.join(', ') || '–'}; játékok: ${keys.join(', ')}`);
  for (const k of keys) {
    const errs = [], onErr = e => errs.push(e.message || String(e.reason?.message || e.reason));
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
    const h = box(), calls = { gift: 0, heart: 0 }; let dispose = null;
    try {
      const mod = await REWARDS[k]();
      dispose = mod.run(h, { ...(OPTS[k] || {}), gift: () => { calls.gift++; return null; }, heart: () => { calls.heart++; return true; } });
      await wait(k === 'healthy' ? 900 : 300);
      await DRIVE[k](h, calls);
      await wait(200);
    } catch (e) { errs.push(e.stack || e.message); }
    try { dispose?.(); } catch (e) { errs.push('kilépés: ' + e.message); }
    await wait(150);
    window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
    h.remove();
    const wantGift = GIFT_SOURCES.includes(k), wantHeart = k in HEART_CAPS;
    ok(`ajándék (${k}): ${wantGift ? 'az első játék-pillanat ajándékot hoz' : 'nem ad ajándékot (itt várnak a ruhák)'}${wantHeart ? ', a jó tett szívet' : ''}`,
      errs.length === 0 && (wantGift ? calls.gift >= 1 : calls.gift === 0) && (!wantHeart || calls.heart >= 1), `ajándék-hívás ${calls.gift}, szív ${calls.heart}${errs.length ? ' · ' + errs.join(' · ') : ''}`);
  }

  // 2) az öltöztető: a meg nem nyert darab árnyképként látszik (lakat nélkül), koppintásra Rozi elmondja, hogyan nyerhető
  {
    const h = box(), mod = await REWARDS.dressup(), dispose = mod.run(h);
    let locked = 0, lockIcons = 0;
    const tabs = [...h.querySelectorAll('.du-tab')].map(t => t.dataset.t), openTab = t => h.querySelector(`.du-tab[data-t="${t}"]`).click();   // a fülsor kattintáskor újrarajzolódik
    for (const t of tabs) { openTab(t); await wait(20); locked += h.querySelectorAll('.du-opt.locked').length; lockIcons += h.querySelectorAll('.du-opt .lock').length; }
    const s0 = spoken();
    for (const t of tabs) { openTab(t); await wait(20); const b = h.querySelector('.du-opt.locked'); if (b) { b.click(); break; } }
    await wait(50);
    const said = window.__spoken.slice(s0).join(' | ');
    const svg = mod.preview('head:crown'), bad = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror');
    dispose(); h.remove();
    const dress = CATALOG.filter(g => g.kind === 'dress').length;
    ok('öltöztető: a még meg nem nyert ruhák árnyképként látszanak, koppintásra Rozi elmondja, hol nyerhetők', locked === dress && lockIcons === 0 && /meg kell nyerni/.test(said), `zárolt ${locked}/${dress}, lakat-jel ${lockIcons}; ${said}`);
    ok('öltöztető: az ajándék-pillanat képe (a saját unikornis az új darabbal) érvényes SVG', svg.startsWith('<svg') && !bad && svg.includes('#ffd24d'), bad ? bad.textContent.slice(0, 120) : `${svg.length} karakter`);
  }

  // 3) az ajándék-pillanat: megjelenik, kinyílik, Rozi egy mondatot mond (csillagszám nélkül), aztán magától eltűnik
  {
    const s0 = spoken(), t0 = performance.now();
    const p = showGift(giftById('garden:lampas'));
    await wait(200); const shown = !!document.getElementById('gift-moment'), busy = giftBusy();
    await wait(1200); const open = document.getElementById('gift-moment')?.classList.contains('open');
    const res = await Promise.race([p, wait(10000).then(() => 'túl sokáig')]);
    const secs = (performance.now() - t0) / 1000; await wait(650);
    const said = window.__spoken.slice(s0);
    ok('ajándék-pillanat: megjelenik, kinyílik, magától eltűnik, és nem marad utána semmi', shown && busy && open && res === true && secs >= 3.4 && !document.getElementById('gift-moment') && !giftBusy(), `látszott ${shown}, foglalt ${busy}, kinyílt ${open}, vége: ${res} ${secs.toFixed(1)} mp után`);
    ok('ajándék-pillanat: Rozi egy mondatban mondja, mit kapott (a csillagokat nem számolja)', said.length === 1 && /egy lámpást/.test(said[0]) && !/[0-9]|csillag/i.test(said[0]), said.join(' | '));
  }
  // lebontás: a jutalomkör vége (X) azonnal eltünteti, a sorban álló ajándékok is továbbengednek
  {
    const p1 = showGift(giftById('neck:cape')), p2 = showGift(giftById('garden:kut'));
    await wait(300); const two = giftBusy();
    clearGifts();
    const r = await Promise.race([Promise.all([p1, p2]), wait(500).then(() => 'beragadt')]);
    ok('ajándék-pillanat: a jutalomkör végén azonnal eltűnik (a sorban álló is)', two && Array.isArray(r) && !document.getElementById('gift-moment') && !giftBusy(), `előtte foglalt ${two}; ${Array.isArray(r) ? 'mindkettő továbbengedett' : r}`);
  }

  // 4) a kert: díszek, a Barátság fája és aranyvirágok a teljes kerttel; a teljesítmény-kereten belül; egy dísz sem takar barátot
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'position:fixed;left:0;top:0;width:1024px;height:768px;opacity:0;pointer-events:none'; document.body.appendChild(canvas);
  let garden; try { garden = createGarden(canvas); } catch (e) { ok('kert (díszek): a 3D jelenet elindul', false, e.message); canvas.remove(); return; }
  try {
    // a saját unikornis a legszélesebb öltözetben (szárny, köpeny): így sem takarhatja dísz, és a kert a kereten belül marad
    garden.setAvatar({ body: 'c7', pattern: 'spots', manestyle: 'curl', horn: 'rainbow', hornstyle: 'spiral', wing: 'rainbow', head: 'flowers', eyes: 'glasses', neck: 'cape' });
    garden.setStars(420, []); garden.setGifts({ owned: CATALOG.map(g => g.id), hearts: 60, gold: 12 }, false);
    await wait(2900); garden.debug(); await wait(1900);           // a barátok besétálnak, a köszönés szívei eltűnnek
    const d = garden.debug();
    ok(`kert: mind a ${d.decor.length} kerti dísz, a Barátság fája és az aranyvirágok ott vannak`, d.decor.length === CATALOG.filter(g => g.kind === 'garden').length && d.treeHearts === 40 && d.gold === 12 && Math.abs(d.treeScale - 1) < 0.01, `díszek ${d.decor.length}, szívek a fán ${d.treeHearts}, fa mérete ${d.treeScale.toFixed(2)}, aranyvirág ${d.gold}`);
    ok(`kert: teljes kert (420 csillag, ${MAX_FLOWERS} virág, minden dísz, 60 szív) a teljesítmény-kereten belül`, d.calls <= 150 && d.triangles <= 250000, `${d.calls} hívás, ${Math.round(d.triangles / 1000)}k háromszög (saját határ: 150 hívás, 250k)`);
    for (const [W, H] of [[1024, 768], [768, 1024]]) {
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; window.dispatchEvent(new Event('resize')); await wait(300);
      for (const a of AREAS) {
        const ms = garden.goTo(a.id); await wait(ms + 400);
        const g = garden.debug(), bad = [];
        for (const id of g.decor.filter(x => giftById(x).spot[0] === a.id)) {
          const pt = g.decorScreen[id];
          if (pt.x < 8 || pt.x > W - 8 || pt.y < 95 || pt.y > H * 0.88) { bad.push(`${id} kilóg (${Math.round(pt.x)}, ${Math.round(pt.y)})`); continue; }
          const on = Object.entries(g.screen).find(([, r]) => r.visible && pt.x > r.left + 8 && pt.x < r.right - 8 && pt.y > r.top + 8 && pt.y < r.bottom - 8);
          if (on) bad.push(`${id} a(z) ${on[0]} előtt/mögött`);
        }
        ok(`kert (${a.id}, ${W}×${H}): minden dísz a képen van, és nem takar barátot`, bad.length === 0, bad.join(' · ') || 'rendben');
      }
      garden.goTo(null); await wait(1600);
    }
  } finally { garden.pause(true); canvas.remove(); }
}
