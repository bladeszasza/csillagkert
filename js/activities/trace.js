// Vonalkövetés: a gyerek ceruzával / ujjal végigköveti a pöttyös vonalat.
// Bőséges tűréshatár; ha letér, onnan folytathatja. Nincs hibajelzés.
// Segítség: irányjelző nyilak, a megtett szakasz aranyra színeződik, tétlenségnél felvillan a következő pötty.
import { attachPen } from '../pen.js';
import { say } from '../voice.js';

// Útvonalak 0..1 koordinátákban
export const PATHS = {
  hullam: t => ({ x: 0.08 + 0.84 * t, y: 0.5 + 0.22 * Math.sin(t * Math.PI * 4) }),
  cikcak: t => {
    const k = t * 6, i = Math.floor(Math.min(k, 5.999)), f = k - i;
    const y0 = i % 2 ? 0.28 : 0.72, y1 = i % 2 ? 0.72 : 0.28;
    return { x: 0.08 + 0.84 * ((i + f) / 6), y: y0 + (y1 - y0) * f };
  },
  hurok: t => ({ x: 0.12 + 0.76 * t + 0.16 * Math.sin(t * Math.PI * 6), y: 0.5 - 0.22 * Math.cos(t * Math.PI * 6) }),
  kor: t => ({ x: 0.5 + 0.26 * Math.sin(t * Math.PI * 2), y: 0.5 - 0.3 * Math.cos(t * Math.PI * 2) }),
  // fekvő nyolcas: a bal csúcsból indul és oda ér vissza, középen keresztezi önmagát
  nyolcas: t => ({ x: 0.5 - 0.32 * Math.cos(t * Math.PI * 2), y: 0.5 + 0.24 * Math.sin(t * Math.PI * 4) }),
  hegyek: t => ({ x: 0.08 + 0.84 * t, y: 0.72 - 0.4 * Math.abs(Math.sin(t * Math.PI * 3)) }),
  spiral: t => { const a = t * Math.PI * 5, r = 0.06 + 0.26 * t; return { x: 0.5 + r * Math.cos(a) * 1.1, y: 0.5 + r * Math.sin(a) }; },
  lejto: t => ({ x: 0.1 + 0.8 * t, y: 0.25 + 0.5 * t * t * (3 - 2 * t) }),
};

const TOL = 46;           // tűrés pixelben (széles sáv)
const N = 48;

export function run(container, { path = 'hullam', say: sayText }) {
  return new Promise(resolve => {
    const instruction = sayText || 'Kövesd a pöttyöket az ujjaddal vagy a ceruzával!';
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Kövesd a pöttyöket! ✏️</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas><button class="round clear" aria-label="Törlés">🧹</button></div>
      </div>`;
    const guide = container.querySelector('.guide');
    const ink = container.querySelector('.ink');
    const fn = PATHS[path] || PATHS.hullam;
    let points = [];
    let reached = 0, done = false, hint = false, lastSeen = -1, flipped = false;

    const gctx = guide.getContext('2d');
    function build() {
      const r = guide.getBoundingClientRect();
      points = [];
      for (let i = 0; i <= N; i++) { const p = fn(i / N); points.push({ x: p.x * r.width, y: p.y * r.height }); }
      if (flipped) points.reverse();
    }
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = guide.getBoundingClientRect();
      guide.width = Math.max(1, Math.round(r.width * dpr)); guide.height = Math.max(1, Math.round(r.height * dpr));
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); draw();
    }
    function line(upTo, color) {
      gctx.strokeStyle = color; gctx.lineWidth = 46;
      gctx.beginPath(); for (let i = 0; i <= upTo; i++) i ? gctx.lineTo(points[i].x, points[i].y) : gctx.moveTo(points[i].x, points[i].y); gctx.stroke();
    }
    function draw() {
      const r = guide.getBoundingClientRect();
      gctx.clearRect(0, 0, r.width, r.height);
      gctx.lineCap = 'round'; gctx.lineJoin = 'round';
      line(N, '#efe6ff');                                  // széles, kényelmes sáv
      if (reached > 0) line(reached, '#ffe28a');            // a megtett szakasz aranyra színeződik
      gctx.fillStyle = '#c9b3f5';
      points.forEach((p, i) => { if (i % 2 === 0) { gctx.beginPath(); gctx.arc(p.x, p.y, 7, 0, 7); gctx.fill(); } });
      // irányjelző nyilak
      gctx.fillStyle = '#8e5be8';
      for (const i of [8, 20, 32, 42]) {
        const a = points[i], b = points[Math.min(N, i + 1)], ang = Math.atan2(b.y - a.y, b.x - a.x);
        gctx.save(); gctx.translate(a.x, a.y); gctx.rotate(ang); gctx.beginPath(); gctx.moveTo(14, 0); gctx.lineTo(-8, -11); gctx.lineTo(-8, 11); gctx.closePath(); gctx.fill(); gctx.restore();
      }
      if (hint) { // tétlenségnél felvillan a következő pötty
        const p = points[Math.min(N, reached + 4)];
        gctx.strokeStyle = '#ff5d8f'; gctx.lineWidth = 8; gctx.beginPath(); gctx.arc(p.x, p.y, 34, 0, 7); gctx.stroke();
      }
      const a = points[0], b = points[N];
      star(b.x, b.y - (Math.hypot(a.x - b.x, a.y - b.y) < 10 ? 52 : 0),   // zárt alakzatnál a csillag a mancs fölé kerül
       done || reached >= N - 3 ? 34 : 28, done || reached >= N - 3);
      paw(a.x, a.y);
    }

    function star(x, y, r, glow) {
      gctx.save(); gctx.beginPath();
      for (let i = 0; i < 10; i++) { const rad = i % 2 ? r * 0.45 : r, ang = -Math.PI / 2 + i * Math.PI / 5; gctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); }
      gctx.closePath(); gctx.fillStyle = '#ffcf3f'; gctx.strokeStyle = '#e69a00'; gctx.lineWidth = 4; gctx.lineJoin = 'round';
      if (glow) { gctx.shadowColor = '#ffd85a'; gctx.shadowBlur = 24; }
      gctx.fill(); gctx.stroke(); gctx.restore();
    }
    function paw(x, y) {
      gctx.save(); gctx.fillStyle = '#3b2a63';
      gctx.beginPath(); gctx.ellipse(x, y + 6, 15, 12, 0, 0, 7); gctx.fill();
      for (const [dx, dy] of [[-17, -9], [-6, -19], [6, -19], [17, -9]]) { gctx.beginPath(); gctx.ellipse(x + dx, y + dy, 6, 8, 0, 0, 7); gctx.fill(); }
      gctx.restore();
    }

    const near = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 < TOL * TOL;
    function check(p) {
      let moved = false;
      // zárt alakzat (kör): ha a gyerek a másik irányba indul, megfordítjuk az útvonalat
      if (reached <= 1 && !flipped && Math.hypot(points[0].x - points[N].x, points[0].y - points[N].y) < 10) {
        for (let k = 3; k <= 7; k++) if (near(p, points[N - k]) && !near(p, points[k])) { flipped = true; points.reverse(); draw(); break; }
      }
      for (let i = Math.min(N, reached + 6); i > reached; i--) {
        const q = points[i];
        if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < TOL * TOL) { reached = i; moved = true; break; }
      }
      if (moved) { hint = false; draw(); }
      if (!done && reached >= N - 2) finish();
    }
    function start(p) {
      // nyitott vonalnál a végéről is lehet kezdeni: megfordítjuk az útvonalat
      const closed = Math.hypot(points[0].x - points[N].x, points[0].y - points[N].y) < 10;
      if (!closed && reached === 0 && !flipped) {
        const dStart = Math.hypot(p.x - points[0].x, p.y - points[0].y), dEnd = Math.hypot(p.x - points[N].x, p.y - points[N].y);
        if (dEnd < dStart && dEnd < TOL * 1.6) { flipped = true; points.reverse(); draw(); }
      }
      check(p);
    }
    let timer = null, nags = 0;
    function finish() {
      done = true; hint = false; reached = N; draw(); clearInterval(timer);
      setTimeout(resolve, 700);
    }

    attachPen(ink, { color: 'rgba(142,91,232,.6)', baseWidth: 16, onStart: start, onMove: check });
    layout();
    new ResizeObserver(layout).observe(guide);
    container.querySelector('.clear').addEventListener('click', () => { const c = ink.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ink.width, ink.height); c.restore(); });
    // 6 mp tétlenség: felvillan a következő pötty, és újra elhangzik az utasítás
    timer = setInterval(() => {
      if (!ink.isConnected) { clearInterval(timer); return; }
      if (done) return;
      if (reached === lastSeen) { hint = true; draw(); if (nags++ % 3 === 0 && nags <= 7) say(instruction, { remember: false }); }   // a pötty mindig felvillan, a mondat csak ritkán ismétlődik
      lastSeen = reached;
    }, 6000);
    say(instruction);
  });
}
