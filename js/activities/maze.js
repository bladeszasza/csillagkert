// Útvesztő (Ceruzavár): a gyerek a ceruzával vezeti a cicát a csillaghoz. A cica mezőről mezőre lép a ceruza után,
// falon nem megy át (ott egyszerűen megvárja a ceruzát), visszafelé lépve az út visszahúzódik. Nincs hibajelzés.
// Tétlenségnél felvillan a következő jó mező. A cica és a csillag DOM-elem (a vászonra rajzolt emoji egyes eszközökön fekete).
import { attachPen } from '../pen.js';
import { say } from '../voice.js';
import { every, later } from '../scope.js';
import { decode, solveMaze, canStep } from '../maze-core.js';

export function run(container, item) {
  const { w, h, rows, start, goal, say: sayText = 'Vezesd a cicát a csillaghoz!', prompt = 'Vezesd a cicát a csillaghoz! 🐱' } = item;
  const cells = decode(rows), solution = solveMaze(rows, start, goal).path, same = (a, b) => a[0] === b[0] && a[1] === b[1];
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity maze">
        <div class="prompt">${prompt}</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas><div class="mz-tok mz-star">⭐</div><div class="mz-tok mz-cat">🐱</div></div>
      </div>`;
    const box = container.querySelector('.activity'), guide = container.querySelector('.guide'), ink = container.querySelector('.ink'), gctx = guide.getContext('2d');
    const catEl = container.querySelector('.mz-cat'), starEl = container.querySelector('.mz-star');
    let cs = 60, ox = 0, oy = 0, path = [start], holding = false, done = false, hint = false, lastLen = -1, nags = 0, idle = 0, stuck = 0;

    const center = ([x, y]) => ({ x: ox + (x + 0.5) * cs, y: oy + (y + 0.5) * cs });
    const cellAt = p => { const x = Math.floor((p.x - ox) / cs), y = Math.floor((p.y - oy) / cs); return x >= 0 && y >= 0 && x < w && y < h ? [x, y] : null; };
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = guide.getBoundingClientRect();
      guide.width = Math.max(1, Math.round(r.width * dpr)); guide.height = Math.max(1, Math.round(r.height * dpr));
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cs = Math.min(r.width * 0.88 / w, r.height * 0.84 / h); ox = (r.width - cs * w) / 2; oy = (r.height - cs * h) / 2;
      draw();
    }
    function token(el, c) { const p = center(c), s = cs * 0.62; el.style.fontSize = `${s}px`; el.style.transform = `translate(${p.x - s * 0.6}px, ${p.y - s * 0.62}px)`; }
    function draw() {
      const r = guide.getBoundingClientRect();
      gctx.clearRect(0, 0, r.width, r.height);
      gctx.fillStyle = '#f6f1ff'; gctx.beginPath(); if (gctx.roundRect) gctx.roundRect(ox, oy, cs * w, cs * h, cs * 0.12); else gctx.rect(ox, oy, cs * w, cs * h); gctx.fill();
      if (hint && !done) {                                   // a következő jó mező felvillan
        const i = solution.findIndex(c => !path.some(q => same(q, c))), c = solution[i < 0 ? solution.length - 1 : i], p = center(c);
        gctx.fillStyle = 'rgba(255,93,143,.22)'; gctx.beginPath(); gctx.arc(p.x, p.y, cs * 0.36, 0, 7); gctx.fill();
      }
      // a megtett út
      gctx.lineCap = 'round'; gctx.lineJoin = 'round'; gctx.strokeStyle = '#ffd34d'; gctx.lineWidth = cs * 0.36; gctx.beginPath();
      path.forEach((c, i) => { const p = center(c); i ? gctx.lineTo(p.x, p.y) : gctx.moveTo(p.x, p.y); }); if (path.length === 1) { const p = center(start); gctx.lineTo(p.x + 0.1, p.y); } gctx.stroke();
      // falak
      gctx.strokeStyle = '#6b4bb5'; gctx.lineWidth = Math.max(5, cs * 0.09); gctx.beginPath();
      const seg = (x0, y0, x1, y1) => { gctx.moveTo(ox + x0 * cs, oy + y0 * cs); gctx.lineTo(ox + x1 * cs, oy + y1 * cs); };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const v = cells[y][x];
        if (!(v & 1)) seg(x, y, x + 1, y);
        if (!(v & 8)) seg(x, y, x, y + 1);
        if (x === w - 1 && !(v & 2)) seg(x + 1, y, x + 1, y + 1);
        if (y === h - 1 && !(v & 4)) seg(x, y + 1, x + 1, y + 1);
      }
      gctx.stroke();
      token(catEl, path[path.length - 1]); token(starEl, goal);
    }
    const inPath = c => path.findIndex(q => same(q, c));
    function move(p) {
      if (done || !holding) return;
      const c = cellAt(p), end = path[path.length - 1]; if (!c || same(c, end)) return;
      if (path.length > 1 && same(c, path[path.length - 2])) path.pop();               // visszalépés
      else if (canStep(cells, end, c) && inPath(c) < 0) path.push(c);
      else return;                                                                      // fal vagy ugrás: a cica vár
      hint = false; draw();
      if (same(path[path.length - 1], goal)) { done = true; box.classList.add('done'); draw(); later(() => resolve({ help: stuck }), 800); }
    }
    function down(p) {
      if (done) return;
      const c = cellAt(p), i = c ? inPath(c) : -1;
      if (i >= 0) { path = path.slice(0, i + 1); holding = true; draw(); return; }      // az út bármelyik mezőjéről folytatható
      const end = path[path.length - 1];
      holding = !!c && canStep(cells, end, c); if (holding) move(p);
    }
    attachPen(ink, { color: 'rgba(142,91,232,.3)', baseWidth: 12, onStart: down, onMove: move, onEnd: () => { holding = false; } });
    layout();
    new ResizeObserver(layout).observe(guide);
    box.__maze = { center: c => center(c), canvas: ink };
    const timer = every(() => {
      if (!ink.isConnected) { clearInterval(timer); return; }
      if (done) return;
      if (path.length === lastLen) { stuck = Math.max(stuck, ++idle); hint = true; draw(); if (nags++ % 3 === 0 && nags <= 7) say(sayText, { remember: false }); }
      else idle = 0;     // help = a leghosszabb egymás utáni tétlen szakasz (lásd trace.js)
      lastLen = path.length;
    }, 6000);
    say(sayText);
  });
}
