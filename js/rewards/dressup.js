// Unikornis-öltöztető: válassz színt, sörényt, kiegészítőt. Nincs jó vagy rossz.
export function run(container) {
  const BODY = ['#ffffff', '#ffd6ea', '#d6e6ff', '#e6d6ff', '#fff0b8'];
  const MANE = ['#ff5d8f', '#8e5be8', '#4aa8ff', '#4cc38a', '#ffb020'];
  const ACC = ['', '🪽', '👑', '🎀', '🌈'];
  const sel = { body: 0, mane: 0, acc: 2 };
  container.innerHTML = `<canvas></canvas>
    <div class="dress">
      <div class="row">${BODY.map((c, i) => `<button class="swatch" data-k="body" data-i="${i}" style="background:${c}"></button>`).join('')}</div>
      <div class="row">${MANE.map((c, i) => `<button class="swatch" data-k="mane" data-i="${i}" style="background:${c}"></button>`).join('')}</div>
      <div class="row">${ACC.map((a, i) => `<button class="swatch emo" data-k="acc" data-i="${i}">${a || '∅'}</button>`).join('')}</div>
    </div>`;
  const canvas = container.querySelector('canvas'), ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0;
  function size() { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size(); window.addEventListener('resize', size);
  container.querySelectorAll('.dress .swatch').forEach(b => b.addEventListener('click', () => { sel[b.dataset.k] = +b.dataset.i; }));
  function frame(now) {
    const t = now / 1000, s = Math.min(w / 460, h * 0.56 / 400), cx = w / 2 - 20 * s, cy = h * 0.1 + 250 * s + Math.sin(t * 2) * 4;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfefff'); g.addColorStop(1, '#ffd6f0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    const body = BODY[sel.body], mane = MANE[sel.mane];
    ctx.lineWidth = 5; ctx.strokeStyle = '#3b2a63'; ctx.lineJoin = ctx.lineCap = 'round';
    const ell = (x, y, rx, ry, fill, rot = 0) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); ctx.fill(); ctx.stroke(); };
    if (sel.acc === 1) { ctx.font = '170px serif'; ctx.textAlign = 'center'; ctx.fillText('🪽', -40, -50); }
    ctx.fillStyle = body; for (const lx of [-90, -50, 50, 90]) { ctx.beginPath(); ctx.roundRect(lx - 14, 40, 28, 110, 12); ctx.fill(); ctx.stroke(); }
    ell(-120, 10, 40, 80, mane, 0.5);                               // farok
    ell(0, 0, 130, 85, body);                                       // test
    ell(110, -75, 36, 70, body, 0.35);                              // nyak
    ell(150, -135, 52, 42, body);                                   // fej
    ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.moveTo(150, -170); ctx.lineTo(176, -250); ctx.lineTo(180, -165); ctx.closePath(); ctx.fill(); ctx.stroke(); // szarv
    for (let i = 0; i < 5; i++) ell(95 - i * 18, -140 + i * 14 - 30, 20, 26, mane);  // sörény
    ctx.fillStyle = '#3b2a63'; ctx.beginPath(); ctx.arc(165, -140, 7, 0, 7); ctx.fill();
    ctx.font = '70px serif'; ctx.textAlign = 'center';
    if (sel.acc === 2) ctx.fillText('👑', 140, -170); if (sel.acc === 3) ctx.fillText('🎀', 105, -150); if (sel.acc === 4) ctx.fillText('🌈', 0, -110);
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
}
