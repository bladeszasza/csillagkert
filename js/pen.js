// Közös ceruza/ujj rajzréteg. Apple Pencil: nyomásérzékeny vonal, sima ív (coalesced events),
// tenyér-elutasítás: amíg a ceruza aktív, az ujj érintését figyelmen kívül hagyjuk.

let lastPenAt = 0;

export function attachPen(canvas, { onStart, onMove, onEnd, color = '#8e5be8', baseWidth = 14 } = {}) {
  const ctx = canvas.getContext('2d');
  let active = null;      // az éppen rajzoló pointerId
  let last = null;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const widthFor = e => e.pointerType === 'pen' && e.pressure > 0 ? baseWidth * (0.6 + e.pressure * 1.2) : baseWidth;

  function allowed(e) {
    if (e.pointerType === 'pen') { lastPenAt = performance.now(); return true; }
    // ujj: csak akkor, ha mostanában nem használtak ceruzát
    return performance.now() - lastPenAt > 4000;
  }

  canvas.addEventListener('pointerdown', e => {
    if (active !== null || !allowed(e)) return;
    e.preventDefault();
    active = e.pointerId;
    last = pos(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nem kritikus */ }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(last.x, last.y, widthFor(e) / 2, 0, 7); ctx.fill();
    onStart?.(last, e);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== active) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (events.length ? events : [e])) {
      const p = pos(ev);
      ctx.strokeStyle = color; ctx.lineWidth = widthFor(ev);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
      onMove?.(p, ev);
    }
  });
  const end = e => {
    if (e.pointerId !== active) return;
    active = null; onEnd?.(e);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  // a kontextusmenü / kijelölés ne zavarjon
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return { ctx, setColor(c) { color = c; }, setWidth(w) { baseWidth = w; }, clear() { ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); }, destroy() { ro.disconnect(); } };
}
