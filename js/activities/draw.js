// Szabad rajz (Rajzasztal): Rozi témát ad ("Rajzolj egy napot!"), a rajzlap sarkában egy kis kép ad ötletet (nem kell
// átrajzolni). Nincs jó vagy rossz rajz: a pipa után Rozi elmondja, mit lát (milyen színeket használt a gyerek), és
// megköszöni. Az ütemező nem számol vele (a szintet a többi feladat állítja). Pencil: nyomásérzékeny; ↶ = visszavonás.
import { attachPen } from '../pen.js';
import { say } from '../voice.js';

const COLORS = [['#e53935', 'piros', 'pirosat'], ['#ff8a1f', 'narancssárga', 'narancssárgát'], ['#ffd400', 'sárga', 'sárgát'],
  ['#3fb950', 'zöld', 'zöldet'], ['#2f8cff', 'kék', 'kéket'], ['#8e5be8', 'lila', 'lilát'], ['#ff6fae', 'rózsaszín', 'rózsaszínt'],
  ['#8a5a3c', 'barna', 'barnát'], ['#222222', 'fekete', 'feketét']];
const WARM = ['Köszönöm, hogy megmutattad!', 'Látom, mennyit dolgoztál rajta!', 'Ezt megmutathatod valakinek, akit szeretsz!', 'Nagyon tetszik, ahogy elképzelted!'];
const BASE = 16;
let lastWarm = -1;

export function colorsLine(used) {
  const acc = used.map(i => COLORS[i][2]);
  if (!acc.length) return '';
  if (acc.length >= 4) return 'Milyen sok színt használtál!';
  return `Látom, ${acc.length === 1 ? acc[0] : `${acc.slice(0, -1).join(', ')} és ${acc[acc.length - 1]}`} használtál.`;
}

export function run(container, item) {
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity draw">
        <div class="prompt">${item.prompt || 'Rajzolj! 🎨'}</div>
        <div class="pad"><canvas class="ink"></canvas>${item.pic ? `<div class="dr-model" aria-hidden="true">${item.pic}</div>` : ''}<button class="small dr-undo" aria-label="vissza">↶</button></div>
        <div class="palette">${COLORS.map(([c, n], i) => `<button class="swatch${i === 0 ? ' sel' : ''}" data-i="${i}" style="background:${c}" aria-label="${n}"></button>`).join('')}<button class="small ok done-btn" aria-label="kész">✔</button></div>
      </div>`;
    const box = container.querySelector('.activity'), ink = container.querySelector('.ink');
    // a vonások vektorosan is megmaradnak, így a visszavonás újrarajzolja a többit (forgatás után is a helyükön)
    const strokes = []; let cur = null, sel = 0, done = false;
    const sizeNow = () => [ink.clientWidth, ink.clientHeight];
    const wOf = e => (e?.pointerType === 'pen' && e.pressure > 0 ? BASE * (0.6 + e.pressure * 1.2) : BASE);
    const pen = attachPen(ink, {
      color: COLORS[0][0], baseWidth: BASE,
      onStart: (p, e) => { cur = { c: sel, size: sizeNow(), pts: [[p.x, p.y, wOf(e)]] }; },
      onMove: (p, e) => { cur?.pts.push([p.x, p.y, wOf(e)]); },
      onEnd: () => { if (cur) strokes.push(cur); cur = null; },
    });
    function redraw() {
      const ctx = pen.ctx, [W, H] = sizeNow();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ink.width, ink.height); ctx.restore();
      for (const s of strokes) {
        const k = Math.min(W / s.size[0], H / s.size[1]), ox = (W - s.size[0] * k) / 2, oy = (H - s.size[1] * k) / 2;
        const P = s.pts.map(([x, y, w]) => [ox + x * k, oy + y * k, w * k]);
        ctx.fillStyle = ctx.strokeStyle = COLORS[s.c][0];
        ctx.beginPath(); ctx.arc(P[0][0], P[0][1], P[0][2] / 2, 0, 7); ctx.fill();
        for (let i = 1; i < P.length; i++) { ctx.lineWidth = P[i][2]; ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); }
      }
    }
    container.querySelector('.dr-undo').addEventListener('click', () => { if (strokes.length) { strokes.pop(); redraw(); } });
    container.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      sel = +b.dataset.i; pen.setColor(COLORS[sel][0]);
    }));
    container.querySelector('.done-btn').addEventListener('click', async () => {
      if (done) return;
      if (!strokes.length) { say('Rajzolj még egy kicsit!', { remember: false }); return; }
      done = true; box.classList.add('done');
      const used = [...new Set(strokes.map(s => s.c))];
      let w; do { w = Math.floor(Math.random() * WARM.length); } while (w === lastWarm && WARM.length > 1); lastWarm = w;
      await say(`${item.done || 'Kész a rajz!'} ${Math.random() < 0.6 ? colorsLine(used) : WARM[w]}`);
      resolve({});
    });
    box.__draw = { canvas: ink, strokes: () => strokes.length };
    say(item.say || 'Rajzolj, amit csak szeretnél! Ha kész vagy, koppints a pipára.');
  });
}
