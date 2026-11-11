// Buborékpukkasztás: koppintásra csilingelve kipukkannak. Nincs pont, nincs vége-büntetés.
export function run(container) {
  container.innerHTML = '<canvas></canvas>';
  const canvas = container.querySelector('canvas'); const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, audio = null;
  const bubbles = [], pops = [];
  const colors = ['#ff8fc8', '#7fe0c0', '#ffcf3f', '#9bb8ff', '#c9a0ff'];
  function size() { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size(); window.addEventListener('resize', size);
  function chime() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = 520 + Math.random() * 600; g.gain.setValueAtTime(.15, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .25);
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .25); } catch (e) {}
  }
  function spawn() { bubbles.push({ x: Math.random() * w, y: h + 60, r: 36 + Math.random() * 44, vy: 40 + Math.random() * 60, c: colors[(Math.random() * colors.length) | 0], ph: Math.random() * 6 }); }
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i];
      if ((b.x - x) ** 2 + (b.y - y) ** 2 < (b.r + 14) ** 2) { pops.push({ x: b.x, y: b.y, r: b.r, t: 0, c: b.c }); bubbles.splice(i, 1); chime(); break; } }
  });
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    if (acc > 0.45 && bubbles.length < 18) { spawn(); acc = 0; }
    ctx.fillStyle = '#1a1040'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1a6b'); g.addColorStop(1, '#7a4fd0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(now / 600 + b.ph) * 0.4;
      if (b.y < -80) { bubbles.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fillStyle = b.c + '88'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffffaa'; ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .18, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
    for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt * 2.5; if (p.t > 1) { pops.splice(i, 1); continue; }
      ctx.strokeStyle = p.c; ctx.lineWidth = 6 * (1 - p.t); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * .8), 0, 7); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k * .785; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * p.r * (.6 + p.t), p.y + Math.sin(a) * p.r * (.6 + p.t), 5 * (1 - p.t), 0, 7); ctx.fill(); } }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); try { audio && audio.close(); } catch (e) {} };
}
