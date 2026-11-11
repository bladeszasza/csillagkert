// Rajz / színezés: szabad rajz vagy kontúr kiszínezése. Pencil: nyomásérzékeny. "Kész" gombbal fejezi be.
import { attachPen } from '../pen.js';
import { say } from '../voice.js';

const COLORS = ['#ff5d8f', '#ffb020', '#ffe14d', '#4cc38a', '#4aa8ff', '#8e5be8', '#8a5a3c', '#3b2a63'];

// Kontúrok 0..1 koordinátákban
const TEMPLATES = {
  nap: (c, w, h) => { c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * 0.2, 0, 7); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r1 = Math.min(w, h) * 0.26, r2 = Math.min(w, h) * 0.36; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); c.lineTo(w / 2 + Math.cos(a) * r2, h / 2 + Math.sin(a) * r2); c.stroke(); } },
  haz: (c, w, h) => { const s = Math.min(w, h); c.beginPath(); c.rect(w / 2 - s * .28, h / 2 - s * .05, s * .56, s * .38); c.stroke();
    c.beginPath(); c.moveTo(w / 2 - s * .34, h / 2 - s * .05); c.lineTo(w / 2, h / 2 - s * .32); c.lineTo(w / 2 + s * .34, h / 2 - s * .05); c.closePath(); c.stroke();
    c.beginPath(); c.rect(w / 2 - s * .06, h / 2 + s * .1, s * .12, s * .23); c.stroke(); },
  virag: (c, w, h) => { const s = Math.min(w, h), cx = w / 2, cy = h / 2 - s * .1;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.arc(cx + Math.cos(a) * s * .15, cy + Math.sin(a) * s * .15, s * .1, 0, 7); c.stroke(); }
    c.beginPath(); c.arc(cx, cy, s * .07, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(cx, cy + s * .26); c.lineTo(cx, h / 2 + s * .38); c.stroke();
    c.beginPath(); c.ellipse(cx + s * .1, h / 2 + s * .25, s * .09, s * .04, -0.5, 0, 7); c.stroke(); },
};

export function run(container, { template = null, say: sayText }) {
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">${template ? 'Színezd ki!' : 'Rajzolj, amit szeretnél!'} 🎨</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas></div>
        <div class="palette">${COLORS.map((c, i) => `<button class="swatch${i === 0 ? ' sel' : ''}" data-c="${c}" style="background:${c}" aria-label="szín"></button>`).join('')}<button class="small ok done-btn">Kész ✔</button></div>
      </div>`;
    const guide = container.querySelector('.guide'), ink = container.querySelector('.ink');
    let strokes = 0;
    const pen = attachPen(ink, { color: COLORS[0], baseWidth: template ? 34 : 18, onEnd: () => { strokes++; } });
    container.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel')); s.classList.add('sel'); pen.setColor(s.dataset.c);
    }));
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = guide.getBoundingClientRect();
      guide.width = Math.max(1, r.width * dpr); guide.height = Math.max(1, r.height * dpr);
      const c = guide.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, r.width, r.height);
      if (template) { c.strokeStyle = '#3b2a63'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; TEMPLATES[template]?.(c, r.width, r.height); }
    }
    layout(); new ResizeObserver(layout).observe(guide);
    container.querySelector('.done-btn').addEventListener('click', async () => {
      if (strokes === 0) { say('Rajzolj még egy kicsit!', { remember: false }); return; }
      await say('Gyönyörű lett!'); resolve();
    });
    say(sayText || (template ? 'Színezd ki a képet a kedvenc színeddel!' : 'Rajzolj, amit csak szeretnél! Ha kész vagy, koppints a pipára.'));
  });
}
