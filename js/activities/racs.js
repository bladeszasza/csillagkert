// Rácsos színezés (Rajzasztal): másolás, tükör, sorminta és szabály szerinti színezés.
// A gyerek kiválaszt egy színt, és a cellára koppint. A rossz szín vagy rossz hely nem marad meg: a cella megbillen,
// visszafehéredik, és Rozi röviden megmondja, mi volna ott (büntetés nincs). Ha a hibák száma a rács méretéhez képest
// sok, a következő hiányzó cella felvillan; még több hiba után a kész kép halványan előtűnik.
// Tétlenségnél (8 mp) is felvillan egy hiányzó cella. Az ütemezőnek: 0 = hiba nélkül, 1 = kevés hiba, 2 = sok hiba.
import { say } from '../voice.js';
import { every, later } from '../scope.js';
import { penAllows } from '../pen.js';
import { happy } from '../sounds.js';

const SVG = {   // alakok a szabályos feladathoz (100×100-as mezőben)
  k: '<circle cx="50" cy="50" r="38"/>', o: '<ellipse cx="50" cy="50" rx="42" ry="27"/>',
  n: '<rect x="14" y="14" width="72" height="72" rx="4"/>', t: '<rect x="6" y="26" width="88" height="48" rx="4"/>',
  h: '<path d="M50 10 L90 86 L10 86 Z"/>', s: '<path d="M50 86 C10 58 8 30 28 20 C40 14 48 22 50 30 C52 22 60 14 72 20 C92 30 90 58 50 86 Z"/>',
  c: '<path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z"/>',
};
const NAMES = { k: ['kör', 'köröket'], o: ['ovális', 'oválisokat'], n: ['négyzet', 'négyzeteket'], t: ['téglalap', 'téglalapokat'], h: ['háromszög', 'háromszögeket'], c: ['csillag', 'csillagokat'], s: ['szív', 'szíveket'] };
const ON = { piros: 'pirosra', kék: 'kékre', sárga: 'sárgára', zöld: 'zöldre', lila: 'lilára', narancssárga: 'narancssárgára' };

export function run(container, item) {
  const { mode, grids, colors, cnames = [], goal } = item;
  // a paletta sorrendje véletlen: a sormintánál ne árulja el a színek sorrendjét
  const order = colors.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return new Promise(resolve => {
    const legend = mode === 'szabaly' ? `<div class="rc-legend">${item.rules.map(([s, c]) => `<span class="rc-rule">${shape(s, '#fff', item.sized)}<b>→</b><i style="background:${colors[c - 1]}"></i></span>`).join('')}</div>` : '';
    container.innerHTML = `
      <div class="activity racs rc-${mode}">
        <div class="prompt">${item.prompt || 'Színezd ki! 🎨'}</div>
        ${legend}
        <div class="rc-area">${grids.map((g, gi) => `${gi && grids[gi - 1].model ? '<div class="rc-arrow">➜</div>' : ''}<div class="rc-grid${g.model ? ' model' : ''}" data-g="${gi}" style="--w:${g.w};--h:${g.h}">${[...g.fixed].map((c, i) => cellHtml(g, gi, i)).join('')}${g.axis ? `<div class="rc-axis" style="--a:${g.axis}"></div>` : ''}</div>`).join('')}</div>
        <div class="palette">${order.map(i => `<button class="swatch${i === 0 ? ' sel' : ''}" data-c="${i + 1}" style="background:${colors[i]}" aria-label="${cnames[i] || 'szín'}"></button>`).join('')}</div>
      </div>`;
    const box = container.querySelector('.activity'), area = container.querySelector('.rc-area');
    let sel = 1, wrong = 0, done = false, hintLv = 0, lastTalk = 0, lastAct = performance.now(), firstMiss = true;
    const state = grids.map(g => [...g.fixed].map(c => (c === '?' ? '0' : c)));
    const work = []; grids.forEach((g, gi) => [...g.fixed].forEach((c, i) => { if (c === '?') work.push([gi, i]); }));
    const need = work.filter(([gi, i]) => goal[gi][i] !== '0');
    const allowance = 1 + Math.floor(need.length / 8);

    function cellHtml(g, gi, i) {
      const c = g.fixed[i], s = g.shapes?.[i];
      const fill = c !== '?' && c !== '0' ? colors[+c - 1] : '';
      return `<div class="rc-cell${c === '?' ? ' work' : ''}" data-i="${i}" style="${fill && !s ? `background:${fill}` : ''}">${s ? shape(s, fill || '#fff', item.sized) : ''}</div>`;
    }
    const cellEl = (gi, i) => area.querySelector(`.rc-grid[data-g="${gi}"] .rc-cell[data-i="${i}"]`);
    function paint(gi, i, v) {
      state[gi][i] = v; const el = cellEl(gi, i), s = grids[gi].shapes?.[i], fill = v === '0' ? '' : colors[+v - 1];
      if (s) el.querySelector('svg .f').setAttribute('fill', fill || '#fff'); else el.style.background = fill;
    }
    // a cellák mérete a rendelkezésre álló helyhez igazodik (fekvő és álló iPaden is)
    function layout() {
      const r = area.getBoundingClientRect(); if (!r.width || !r.height) return;
      const side = grids.length > 1 && r.width > r.height * 1.1;     // másolás: egymás mellett, ha van rá hely
      area.classList.toggle('stack', grids.length > 1 && !side);
      const W = grids.reduce((a, g) => (side ? a + g.w : Math.max(a, g.w)), 0) + (side && grids.length > 1 ? 1.4 : 0);
      const H = grids.reduce((a, g) => (side ? Math.max(a, g.h) : a + g.h), 0) + (!side && grids.length > 1 ? 1.4 : 0);
      const size = Math.max(28, Math.min(96, Math.floor(Math.min((r.width - 40) / W, (r.height - 40) / H) - 4)));     // a cellák közti rés és a keret is helyet kér
      box.style.setProperty('--cs', `${size}px`);
    }
    function talk(text) { const now = performance.now(); if (now - lastTalk < 2500) return; lastTalk = now; say(text, { remember: false }); }
    function feedback(gi, i, v) {
      const want = goal[gi][i], wn = want === '0' ? '' : cnames[+want - 1], got = cnames[+v - 1], s = grids[gi].shapes?.[i];
      if (mode === 'szabaly') {
        const nm = NAMES[s.toLowerCase()], sz = item.sized ? (s === s.toUpperCase() ? 'nagy ' : 'kicsi ') : '';
        talk(want === '0' ? `Ez egy ${sz}${nm[0]}. Ez fehér marad.` : `Ez egy ${sz}${nm[0]}. A ${sz}${nm[1]} ${ON[wn]} színezzük.`);
      } else if (mode === 'minta') talk(firstMiss ? 'Majdnem! Mondd ki sorban a színeket, és figyeld, mi ismétlődik!' : `Ide ${wn} jön.`);
      else {
        const where = mode === 'tukor' ? 'A tükörben' : 'A mintán';
        talk(want === '0' ? `${where} ez a hely fehér.` : `Ez ${got}. ${where} itt ${wn} van.`);
      }
      firstMiss = false;
    }
    function missing() { return need.filter(([gi, i]) => state[gi][i] !== goal[gi][i]); }
    function pulse() { const m = missing()[0]; if (!m) return; const el = cellEl(...m); el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); }
    function ghost() { for (const [gi, i] of missing()) { const el = cellEl(gi, i); el.style.setProperty('--ghost', colors[+goal[gi][i] - 1]); el.classList.add('ghost'); } }

    function tap(e) {
      const el = e.target.closest('.rc-cell.work'); if (!el || done || !penAllows(e)) return;
      e.preventDefault(); lastAct = performance.now();
      const gi = +el.parentElement.dataset.g, i = +el.dataset.i, want = goal[gi][i];
      if (state[gi][i] === want && want !== '0') return;               // már jó: nem rontjuk el
      if (String(sel) === want) {
        paint(gi, i, want); el.classList.remove('hint', 'ghost');
        if (!missing().length) finish();
        return;
      }
      wrong++; paint(gi, i, String(sel)); el.classList.remove('wob'); void el.offsetWidth; el.classList.add('wob');
      feedback(gi, i, String(sel));
      later(() => { if (state[gi][i] === String(sel) && state[gi][i] !== want) paint(gi, i, '0'); }, 650);
      if (wrong > allowance && hintLv < 1) { hintLv = 1; later(pulse, 700); }
      else if (wrong > allowance * 2 && hintLv < 2) { hintLv = 2; later(ghost, 700); }
      else if (hintLv >= 1) later(pulse, 700);
    }
    function finish() {
      done = true; box.classList.add('done'); happy('🦄');
      const text = mode === 'tukor' ? 'Kész a tükörkép! Pont olyan, mint egy pillangó két szárnya.' : mode === 'masol' ? 'Kész! Pont olyan, mint a minta.' : mode === 'minta' ? 'Kész! Szépen folytattad a mintát.' : 'Kész! Mindent a szabály szerint színeztél.';
      say(text);
      later(() => resolve({ wrong: wrong === 0 ? 0 : wrong <= allowance ? 1 : 2 }), 1400);
    }

    area.addEventListener('pointerdown', tap);
    container.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.c; lastAct = performance.now();
      if (mode === 'szabaly' || colors.length > 1) say(cnames[sel - 1] || '', { remember: false });
    }));
    layout(); new ResizeObserver(layout).observe(area);
    const timer = every(() => { if (!area.isConnected) { clearInterval(timer); return; } if (!done && performance.now() - lastAct > 8000) { lastAct = performance.now(); pulse(); } }, 2000);
    // a böngészős teszt a cellákra és a színekre koppint
    box.__racs = { cell: (gi, i) => cellEl(gi, i), swatch: c => container.querySelector(`.swatch[data-c="${c}"]`) };
    say(item.say || 'Színezd ki!');
  });
}

function shape(code, fill, sized) {
  const k = code.toLowerCase(), big = code !== k, sc = sized ? (big ? 1 : 0.58) : 0.86;
  return `<svg viewBox="0 0 100 100"><g transform="translate(50 50) scale(${sc}) translate(-50 -50)" class="f" fill="${fill}" stroke="#3b2a63" stroke-width="${6 / sc}" stroke-linejoin="round">${SVG[k]}</g></svg>`;
}
