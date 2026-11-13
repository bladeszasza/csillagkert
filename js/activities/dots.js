// Pöttyösszekötő (Ceruzavár): a pöttyöket sorban kell összekötni, az egyestől. A soron következő pötty zöld és lüktet,
// így az is követi, aki még nem ismeri a számokat. A ceruza útja szabad; amikor eléri a következő pöttyöt, egyenes vonal
// köti össze az előzővel. A végén kiderül, mi lett belőle (a kép DOM-elem, nem vászonra rajzolt emoji).
import { attachPen } from '../pen.js';
import { say } from '../voice.js';
import { every } from '../scope.js';

export function run(container, item) {
  const { dots, closed = true, pic = '⭐', name = 'egy kép', say: sayText = 'Kösd össze a pöttyöket sorban, az egyestől!', prompt = 'Kösd össze a pöttyöket sorban! 🔢' } = item;
  const total = dots.length + (closed ? 1 : 0);          // zárt képnél a végén vissza az egyeshez
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity dots">
        <div class="prompt">${prompt}</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas><div class="dt-pic">${pic}</div></div>
      </div>`;
    const box = container.querySelector('.activity'), guide = container.querySelector('.guide'), ink = container.querySelector('.ink'), gctx = guide.getContext('2d');
    const picEl = container.querySelector('.dt-pic');
    let pts = [], hitR = 30, reached = 0, done = false, hint = false, lastSeen = -1, nags = 0, idle = 0, stuck = 0, cx = 0, cy = 0;
    const at = i => pts[i % dots.length];

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = guide.getBoundingClientRect();
      guide.width = Math.max(1, Math.round(r.width * dpr)); guide.height = Math.max(1, Math.round(r.height * dpr));
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const xs = dots.map(d => d[0]), ys = dots.map(d => d[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
      const k = Math.min(r.width * 0.78 / Math.max(1, x1 - x0), r.height * 0.74 / Math.max(1, y1 - y0)), ox = (r.width - k * (x1 - x0)) / 2 - k * x0, oy = (r.height - k * (y1 - y0)) / 2 - k * y0;
      pts = dots.map(([x, y]) => ({ x: ox + k * x, y: oy + k * y }));
      let md = Infinity; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) md = Math.min(md, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      hitR = Math.max(20, Math.min(40, md * 0.45));
      cx = pts.reduce((s, p) => s + p.x, 0) / pts.length; cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const fs = Math.min(r.width, r.height) * 0.34; picEl.style.fontSize = `${fs}px`; picEl.style.transform = `translate(${cx - fs * 0.6}px, ${cy - fs * 0.62}px)`;
      draw();
    }
    function draw() {
      const r = guide.getBoundingClientRect();
      gctx.clearRect(0, 0, r.width, r.height); gctx.lineCap = 'round'; gctx.lineJoin = 'round';
      if (done && closed) { gctx.fillStyle = '#fff3c4'; gctx.beginPath(); pts.forEach((p, i) => (i ? gctx.lineTo(p.x, p.y) : gctx.moveTo(p.x, p.y))); gctx.closePath(); gctx.fill(); }
      gctx.strokeStyle = '#8e5be8'; gctx.lineWidth = 8; gctx.beginPath();
      for (let i = 0; i < reached; i++) { const p = at(i); i ? gctx.lineTo(p.x, p.y) : gctx.moveTo(p.x, p.y); }
      gctx.stroke();
      if (!done) {                                       // a soron következő pötty zöld gyűrűt kap
        const p = at(reached);
        gctx.strokeStyle = hint ? '#ff5d8f' : '#4cc38a'; gctx.lineWidth = hint ? 8 : 6; gctx.beginPath(); gctx.arc(p.x, p.y, hitR * 0.9, 0, 7); gctx.stroke();
      }
      gctx.font = `800 ${Math.round(Math.max(18, hitR * 0.72))}px Nunito, system-ui, sans-serif`; gctx.textAlign = 'center'; gctx.textBaseline = 'middle';
      pts.forEach((p, i) => {
        const hit = i < reached || done, next = !done && i === reached % dots.length;
        gctx.fillStyle = hit ? '#e69a00' : next ? '#4cc38a' : '#6b4bb5'; gctx.beginPath(); gctx.arc(p.x, p.y, Math.max(7, hitR * 0.28), 0, 7); gctx.fill();
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, off = hitR * (next ? 1.55 : 0.95);     // a szám kifelé, a pötty mellé (a soron következőnél a gyűrűn kívül)
        const tx = p.x + dx / d * off, ty = p.y + dy / d * off;
        gctx.lineWidth = 5; gctx.strokeStyle = '#fff'; gctx.strokeText(String(i + 1), tx, ty);       // fehér szegély: a vonal se takarja el
        gctx.fillStyle = next ? '#2f9e6b' : '#3b2a63'; gctx.fillText(String(i + 1), tx, ty);
      });
    }
    async function finish() {
      done = true; draw(); box.classList.add('done'); picEl.classList.add('show');
      await say(`Kész! ${name[0].toUpperCase() + name.slice(1)} lett belőle!`, { remember: false });
      resolve({ help: stuck });
    }
    const near = p => { const q = at(reached); return (p.x - q.x) ** 2 + (p.y - q.y) ** 2 < hitR * hitR; };
    const touch = p => { if (done) return; if (near(p)) { reached++; hint = false; draw(); if (reached >= total) finish(); } };
    attachPen(ink, { color: 'rgba(142,91,232,.45)', baseWidth: 12, onStart: touch, onMove: touch });
    layout();
    new ResizeObserver(layout).observe(guide);
    box.__dots = { px: i => ({ ...at(i) }), total, canvas: ink };
    const timer = every(() => {
      if (!ink.isConnected) { clearInterval(timer); return; }
      if (done) return;
      if (reached === lastSeen) { stuck = Math.max(stuck, ++idle); hint = true; draw(); if (nags++ % 3 === 0 && nags <= 7) say(sayText, { remember: false }); }
      else idle = 0;     // help = a leghosszabb egymás utáni tétlen szakasz (lásd trace.js)
      lastSeen = reached;
    }, 6000);
    say(sayText);
  });
}
