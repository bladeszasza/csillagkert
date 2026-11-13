// Vonalkövetés (Ceruzavár): a gyerek ceruzával vagy ujjal végigköveti a pöttyös vonalat, vonásról vonásra.
// A vonás sorrendjét a kezdőpontok száma mutatja (a soron következő zöld). Vonalnál és formánál bármelyik végéről
// lehet kezdeni (free); számnál, betűnél és szónál a zöld pöttytől, a jelölt irányba. Nincs hibajelzés: ha letér,
// onnan folytathatja. A tűrés a rajz méretéhez igazodik (egy szó kis betűinél kisebb), de 14 és 46 képpont között marad.
// Segítség: irányjelző nyilak, a megtett szakasz aranyra színeződik, tétlenségnél felvillan a következő pont.
// A saját nevet (useName) futáskor olvassa ki a helyi mentésből; nem kerül azonosítóba vagy naplóba.
import { attachPen } from '../pen.js';
import { say } from '../voice.js';
import { every, later } from '../scope.js';
import { progress } from '../progress.js';
import { compose, known } from '../glyphs.js';

// a megadott név írható alakja: nagybetűvel, csak ismert betűkkel; hosszú névnél az első szó (legfeljebb kilenc betű)
export function nameText(raw) {
  let s = [...String(raw || '').trim().toLocaleUpperCase('hu')].filter(known).join('').replace(/\s+/g, ' ').trim();
  if (s.length > 9) s = s.split(/[ -]/)[0];
  return s.slice(0, 9);
}

export function run(container, item) {
  const { free = true, tol = 0.2 } = item;
  let units = item.strokes, sayText = item.say || 'Kövesd a pöttyöket az ujjaddal vagy a ceruzával!', prompt = item.prompt || 'Kövesd a pöttyöket! ✏️';
  if (item.useName) {        // a saját név: a feladat képe helyett a gyerek saját jele (⭐, 💖…) áll mellette
    const me = progress.get(), nm = nameText(me.name);
    if (nm) { units = compose(nm); sayText = 'Írd át a nevedet! Kezdd a zöld pöttynél.'; prompt = `${me.mark || '⭐'} Írd át! ✏️`; }
  }
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity trace">
        <div class="prompt">${prompt}</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas><button class="round clear" aria-label="Törlés">🧹</button></div>
      </div>`;
    const box = container.querySelector('.activity'), guide = container.querySelector('.guide'), ink = container.querySelector('.ink'), gctx = guide.getContext('2d');
    const n = units.length;
    let px = [], cum = [], tolPx = 30, cur = 0, reached = 0, flipped = units.map(() => false), done = false, hint = false, lastSeen = -1, nags = 0, idle = 0, stuck = 0;
    const closedU = units.map(s => s.length > 2 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < 0.05);

    // a rajz a lapra illesztve, arányosan (a betű ne torzuljon), széles margóval
    function build() {
      const r = guide.getBoundingClientRect(), all = units.flat();
      let x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
      if (x1 - x0 < 0.5) { const c = (x0 + x1) / 2; x0 = c - 0.25; x1 = c + 0.25; }
      if (y1 - y0 < 0.5) { const c = (y0 + y1) / 2; y0 = c - 0.25; y1 = c + 0.25; }
      const k = Math.min(r.width * 0.8 / (x1 - x0), r.height * 0.74 / (y1 - y0)), ox = (r.width - k * (x1 - x0)) / 2 - k * x0, oy = (r.height - k * (y1 - y0)) / 2 - k * y0;
      tolPx = Math.max(14, Math.min(46, tol * k));
      px = units.map((s, i) => { const p = s.map(([x, y]) => ({ x: ox + k * x, y: oy + k * y })); return flipped[i] ? p.reverse() : p; });
      cum = px.map(p => { const c = [0]; for (let j = 1; j < p.length; j++) c.push(c[j - 1] + Math.hypot(p[j].x - p[j - 1].x, p[j].y - p[j - 1].y)); return c; });
    }
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = guide.getBoundingClientRect();
      guide.width = Math.max(1, Math.round(r.width * dpr)); guide.height = Math.max(1, Math.round(r.height * dpr));
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); draw();
    }
    const last = i => px[i].length - 1;
    function band(p, upTo, color, width) {
      gctx.strokeStyle = color; gctx.lineWidth = width; gctx.beginPath();
      for (let j = 0; j <= upTo; j++) j ? gctx.lineTo(p[j].x, p[j].y) : gctx.moveTo(p[j].x, p[j].y);
      if (upTo === 0) gctx.lineTo(p[0].x + 0.1, p[0].y);
      gctx.stroke();
    }
    function badge(p, num, active) {
      gctx.fillStyle = active ? '#4cc38a' : '#d9c8fb'; gctx.beginPath(); gctx.arc(p.x, p.y, Math.max(13, tolPx * 0.55), 0, 7); gctx.fill();
      if (n > 1) { gctx.fillStyle = active ? '#fff' : '#6b4bb5'; gctx.font = `800 ${Math.round(Math.max(13, tolPx * 0.55) * 1.1)}px system-ui, sans-serif`; gctx.textAlign = 'center'; gctx.textBaseline = 'middle'; gctx.fillText(String(num), p.x, p.y + 1); }
    }
    function draw() {
      const r = guide.getBoundingClientRect();
      gctx.clearRect(0, 0, r.width, r.height); gctx.lineCap = 'round'; gctx.lineJoin = 'round';
      px.forEach((p, i) => band(p, last(i), i < cur || done ? '#ffe28a' : i === cur ? '#e7dbff' : '#f3eeff', tolPx * 1.25));
      if (!done && cur < n && reached > 0) band(px[cur], reached, '#ffe28a', tolPx * 1.25);
      // pöttyök a még meg nem tett vonásokon
      gctx.fillStyle = '#c9b3f5';
      px.forEach((p, i) => { if (i < cur || done) return; let next = 0; p.forEach((q, j) => { if (cum[i][j] >= next) { gctx.beginPath(); gctx.arc(q.x, q.y, Math.max(3, tolPx * 0.13), 0, 7); gctx.fill(); next = cum[i][j] + Math.max(16, tolPx * 0.7); } }); });
      if (!done && cur < n && px[cur].length > 1) {      // irányjelző nyilak a soron következő vonáson
        const p = px[cur], L = cum[cur][last(cur)];
        gctx.fillStyle = '#8e5be8';
        for (const f of L > tolPx * 6 ? [0.2, 0.45, 0.7, 0.9] : [0.5]) {
          const j = p.findIndex((_, m) => cum[cur][m] >= f * L), a = p[Math.max(0, j)], b = p[Math.min(last(cur), Math.max(0, j) + 1)];
          if (!a || !b || (a.x === b.x && a.y === b.y)) continue;
          const s = Math.max(8, tolPx * 0.32), ang = Math.atan2(b.y - a.y, b.x - a.x);
          gctx.save(); gctx.translate(a.x, a.y); gctx.rotate(ang); gctx.beginPath(); gctx.moveTo(s * 1.3, 0); gctx.lineTo(-s * 0.7, -s); gctx.lineTo(-s * 0.7, s); gctx.closePath(); gctx.fill(); gctx.restore();
        }
      }
      if (hint && !done && cur < n) {                     // tétlenségnél felvillan a következő pont
        const p = px[cur], j = p.findIndex((_, m) => cum[cur][m] >= cum[cur][reached] + tolPx * 1.5), q = p[j < 0 ? last(cur) : j];
        gctx.strokeStyle = '#ff5d8f'; gctx.lineWidth = 7; gctx.beginPath(); gctx.arc(q.x, q.y, tolPx * 0.9, 0, 7); gctx.stroke();
      }
      // kezdőpontok (a soron következő zöld) és a csillag a legvégén
      for (let i = n - 1; i >= 0; i--) if (!done && i >= cur && !(i === cur && reached > 0)) badge(px[i][0], i + 1, i === cur);
      const end = px[n - 1][last(n - 1)], lift = closedU[n - 1] ? tolPx * 1.6 : 0;
      star(end.x, end.y - lift, Math.max(18, tolPx * 0.75), done);
    }
    function star(x, y, r, glow) {
      gctx.save(); gctx.beginPath();
      for (let i = 0; i < 10; i++) { const rad = i % 2 ? r * 0.45 : r, ang = -Math.PI / 2 + i * Math.PI / 5; gctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); }
      gctx.closePath(); gctx.fillStyle = '#ffcf3f'; gctx.strokeStyle = '#e69a00'; gctx.lineWidth = 4; gctx.lineJoin = 'round';
      if (glow) { gctx.shadowColor = '#ffd85a'; gctx.shadowBlur = 24; }
      gctx.fill(); gctx.stroke(); gctx.restore();
    }

    const near = (p, q, f = 1) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 < (tolPx * f) ** 2;
    function flip(i) { flipped[i] = !flipped[i]; build(); }
    function check(p) {
      if (done) return;
      const s = px[cur], L = last(cur);
      if (L === 0) { if (near(p, s[0], 1.2)) nextStroke(); return; }          // pötty (ékezet): elég megérinteni
      // zárt alak, szabad irány: ha a másik irányba indul, megfordítjuk
      if (free && closedU[cur] && reached <= 2) {
        const k = Math.min(L - 1, Math.round(L * 0.08) + 2);
        if (near(p, s[L - k]) && !near(p, s[k])) { flip(cur); reached = 0; }
      }
      const s2 = px[cur], look = cum[cur][reached] + tolPx * 2.5;
      let best = -1;
      for (let j = reached + 1; j <= L && cum[cur][j] <= look; j++) if (near(p, s2[j])) best = j;
      if (best > reached) { reached = best; hint = false; draw(); }
      if (cum[cur][L] - cum[cur][reached] < tolPx * 0.5) nextStroke();
    }
    function start(p) {
      if (done) return;
      // nyitott vonal, szabad irány: a végéről is lehet kezdeni
      if (free && reached === 0 && !closedU[cur] && px[cur].length > 1) {
        const s = px[cur], dS = Math.hypot(p.x - s[0].x, p.y - s[0].y), dE = Math.hypot(p.x - s[last(cur)].x, p.y - s[last(cur)].y);
        if (dE < dS && dE < tolPx * 1.6) flip(cur);
      }
      check(p);
    }
    function nextStroke() {
      cur++; reached = 0; hint = false;
      if (cur >= n) { done = true; draw(); later(() => resolve({ help: stuck }), 700); return; }
      draw();
    }

    attachPen(ink, { color: 'rgba(142,91,232,.6)', baseWidth: 16, onStart: start, onMove: check });
    layout();
    new ResizeObserver(layout).observe(guide);
    container.querySelector('.clear').addEventListener('click', () => { const c = ink.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ink.width, ink.height); c.restore(); });
    // a böngészős teszt a képernyőn látható pontokat követi (képpontban, a lap bal felső sarkától)
    box.__trace = { strokes: () => px.map(s => s.map(q => ({ ...q }))), tol: () => tolPx, canvas: ink };
    // 6 mp tétlenség: felvillan a következő pont, és ritkán újra elhangzik az utasítás. Az ütemezőnek a leghosszabb
    // egymás utáni tétlen szakasz megy (help): kettő = a segítség után sem haladt tovább, ez elakadás; két rövid
    // gondolkodós szünet egy hosszú feladatban nem az.
    const timer = every(() => {
      if (!ink.isConnected) { clearInterval(timer); return; }
      if (done) return;
      const at = cur * 100000 + reached;
      if (at === lastSeen) { stuck = Math.max(stuck, ++idle); hint = true; draw(); if (nags++ % 3 === 0 && nags <= 7) say(sayText, { remember: false }); }
      else idle = 0;
      lastSeen = at;
    }, 6000);
    say(sayText);
  });
}
