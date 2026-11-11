// Csillagfogó: húzd a kiscicát, és kapd el a hulló csillagokat. Nincs pont, a mellément csillag csak elhalványul.
export function run(container) {
  container.innerHTML = '<canvas></canvas>';
  const canvas = container.querySelector('canvas'), ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, audio = null, catX = 0.5;
  const stars = [], bursts = [];
  function size() { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size(); window.addEventListener('resize', size);
  function chime() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'triangle'; o.frequency.value = 700 + Math.random() * 500; g.gain.setValueAtTime(.15, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .3);
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .3); } catch (e) {}
  }
  const move = e => { const r = canvas.getBoundingClientRect(); catX = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  canvas.addEventListener('pointerdown', move); canvas.addEventListener('pointermove', move);
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    if (acc > 0.7 && stars.length < 8) { stars.push({ x: 40 + Math.random() * (w - 80), y: -30, vy: 90 + Math.random() * 60, r: 24 + Math.random() * 14, rot: 0, fade: 1 }); acc = 0; }
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1040'); g.addColorStop(1, '#5b3bb0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const cx = catX * w, cy = h - 70;
    for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; s.y += s.vy * dt; s.rot += dt * 2;
      if (Math.abs(s.x - cx) < 70 && Math.abs(s.y - cy) < 50 && s.fade === 1) { bursts.push({ x: s.x, y: s.y, t: 0 }); stars.splice(i, 1); chime(); continue; }
      if (s.y > h - 20) s.fade -= dt * 2; if (s.fade <= 0) { stars.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = Math.max(0, s.fade); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.font = s.r * 2 + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐', 0, 0); ctx.restore(); }
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += dt * 2.5; if (b.t > 1) { bursts.splice(i, 1); continue; }
      for (let k = 0; k < 8; k++) { const a = k * .785; ctx.fillStyle = `rgba(255,224,102,${1 - b.t})`; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 60 * b.t, b.y + Math.sin(a) * 60 * b.t, 7 * (1 - b.t), 0, 7); ctx.fill(); } }
    ctx.font = '110px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐱', cx, cy);
    ctx.font = '60px serif'; ctx.fillText('🧺', cx, cy - 60);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); try { audio && audio.close(); } catch (e) {} };
}
