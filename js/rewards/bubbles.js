// Buborékpukkasztás: koppintásra kipukkannak. Minden színnek saját hangja van (pentaton skála),
// a buborék mérete adja a hang erejét és mélységét: nagy buborék = hangosabb, mélyebb "bumm".
// Nincs pont, nincs büntetés.
const COLORS = [
  { c: '#ff8fc8', f: 523.25 },  // C
  { c: '#7fe0c0', f: 587.33 },  // D
  { c: '#ffcf3f', f: 659.25 },  // E
  { c: '#9bb8ff', f: 783.99 },  // G
  { c: '#c9a0ff', f: 880.0 },   // A
];

export function run(container) {
  container.innerHTML = '<canvas></canvas>';
  const canvas = container.querySelector('canvas'), ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, audio = null;
  const bubbles = [], pops = [];

  function size() { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size();
  window.addEventListener('resize', size);
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);

  // Szín = hangmagasság, méret = hangerő (és kicsit mélyebb hang). A kicsi buborék halk és vékony.
  function chime(b) {
    try {
      if (!audio) return;
      const big = (b.r - 36) / 44;                        // 0 (kicsi) .. 1 (nagy)
      const freq = COLORS[b.ci].f * (1.15 - 0.35 * big);
      const vol = 0.04 + 0.26 * big;
      const t = audio.currentTime, dur = 0.35 + 0.35 * big;
      for (const [type, g] of [['sine', 1], ['triangle', 0.3]]) {
        const o = audio.createOscillator(), gain = audio.createGain();
        o.type = type; o.frequency.setValueAtTime(freq * 1.5, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
        gain.gain.setValueAtTime(vol * g, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(gain); gain.connect(audio.destination); o.start(t); o.stop(t + dur + 0.05);
      }
    } catch (e) {}
  }
  function unlock() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} }
  canvas.addEventListener('pointerdown', unlock); canvas.addEventListener('pointerup', unlock);

  function spawn() { bubbles.push({ x: 60 + Math.random() * Math.max(10, w - 120), y: h + 80, r: 36 + Math.random() * 44, vy: 40 + Math.random() * 60, ci: (Math.random() * COLORS.length) | 0, ph: Math.random() * 6 }); }
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if ((b.x - x) ** 2 + (b.y - y) ** 2 < (b.r + 14) ** 2) { pops.push({ x: b.x, y: b.y, r: b.r, t: 0, c: COLORS[b.ci].c }); bubbles.splice(i, 1); chime(b); break; }
    }
  });

  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    if (acc > 0.45 && bubbles.length < 18) { spawn(); acc = 0; }
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1a6b'); g.addColorStop(1, '#7a4fd0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(now / 600 + b.ph) * 0.4;
      if (b.y < -90) { bubbles.splice(i, 1); continue; }
      const col = COLORS[b.ci].c;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fillStyle = col + '88'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffffaa'; ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .18, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt * 2.5; if (p.t > 1) { pops.splice(i, 1); continue; }
      ctx.strokeStyle = p.c; ctx.lineWidth = 6 * (1 - p.t); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * .8), 0, 7); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k * .785; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * p.r * (.6 + p.t), p.y + Math.sin(a) * p.r * (.6 + p.t), 5 * (1 - p.t), 0, 7); ctx.fill(); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); try { audio && audio.close(); } catch (e) {} };
}
