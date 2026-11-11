// Vonalkövetés: a gyerek ceruzával / ujjal végigköveti a pöttyös vonalat.
// Bőséges tűréshatár; ha letér, onnan folytathatja. Nincs hibajelzés.
import { attachPen } from '../pen.js';
import { say } from '../voice.js';

// Útvonalak 0..1 koordinátákban
const PATHS = {
  hullam: t => ({ x: 0.08 + 0.84 * t, y: 0.5 + 0.22 * Math.sin(t * Math.PI * 4) }),
  cikcak: t => {
    const k = t * 6, i = Math.floor(Math.min(k, 5.999)), f = k - i;
    const y0 = i % 2 ? 0.28 : 0.72, y1 = i % 2 ? 0.72 : 0.28;
    return { x: 0.08 + 0.84 * ((i + f) / 6), y: y0 + (y1 - y0) * f };
  },
  hurok: t => ({ x: 0.12 + 0.76 * t + 0.16 * Math.sin(t * Math.PI * 6), y: 0.5 - 0.22 * Math.cos(t * Math.PI * 6) + 0.22 * 0 }),
  lejto: t => ({ x: 0.1 + 0.8 * t, y: 0.25 + 0.5 * t * t * (3 - 2 * t) }),
};

export function run(container, { path = 'hullam', say: sayText }) {
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Kövesd a pöttyöket! ✏️</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas></div>
      </div>`;
    const guide = container.querySelector('.guide');
    const ink = container.querySelector('.ink');
    const fn = PATHS[path] || PATHS.hullam;
    const N = 48;
    let points = [];
    let reached = 0;               // az utolsó elért ellenőrzőpont indexe
    let done = false;

    const gctx = guide.getContext('2d');
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = guide.getBoundingClientRect();
      guide.width = Math.max(1, Math.round(r.width * dpr)); guide.height = Math.max(1, Math.round(r.height * dpr));
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      for (let i = 0; i <= N; i++) { const p = fn(i / N); points.push({ x: p.x * r.width, y: p.y * r.height }); }
      draw();
    }
    function draw() {
      const r = guide.getBoundingClientRect();
      gctx.clearRect(0, 0, r.width, r.height);
      gctx.lineCap = 'round'; gctx.lineJoin = 'round';
      gctx.strokeStyle = '#efe6ff'; gctx.lineWidth = 46;       // széles, kényelmes sáv
      gctx.beginPath(); points.forEach((p, i) => i ? gctx.lineTo(p.x, p.y) : gctx.moveTo(p.x, p.y)); gctx.stroke();
      gctx.fillStyle = '#c9b3f5';
      points.forEach((p, i) => { if (i % 2 === 0) { gctx.beginPath(); gctx.arc(p.x, p.y, 7, 0, 7); gctx.fill(); } });
      const a = points[0], b = points[N];
      gctx.font = '56px serif'; gctx.textAlign = 'center'; gctx.textBaseline = 'middle';
      gctx.fillText('🐾', a.x, a.y); gctx.fillText(reached >= N - 3 ? '🌟' : '⭐', b.x, b.y);
    }

    function check(p) {
      const tol = 46;
      for (let i = Math.min(N, reached + 6); i > reached; i--) {
        const q = points[i];
        if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < tol * tol) { reached = i; break; }
      }
      if (!done && reached >= N - 2) finish();
    }
    function finish() {
      done = true; draw();
      setTimeout(resolve, 700);
    }

    const pen = attachPen(ink, {
      color: '#8e5be8', baseWidth: 16,
      onStart: p => check(p), onMove: p => check(p),
    });
    layout();
    new ResizeObserver(layout).observe(guide);
    say(sayText || 'Kövesd a pöttyöket az ujjaddal vagy a ceruzával!');
  });
}
