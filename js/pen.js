// Közös ceruza/ujj rajzréteg. Apple Pencil: nyomásérzékeny vonal, sima ív (coalesced events),
// tenyér-elutasítás: amíg a ceruza aktív, az ujj érintését figyelmen kívül hagyjuk.

let lastPenAt = -1e9;     // még nem volt ceruza (0-val az oldal betöltése utáni első 4 mp-ben az ujj nem rajzolhatott)

// Koppintós és húzós felületeknek (rács, matrica, színező): a ceruza mindig számít, az ujj csak akkor, ha 4 mp-e nem
// használtak ceruzát. Így a ceruzát fogó kéz tenyere nem színez ki cellát, és nem számít tévedésnek.
export function penAllows(e) {
  if (e.pointerType === 'pen') { lastPenAt = performance.now(); return true; }
  return performance.now() - lastPenAt > 4000;
}

export function attachPen(canvas, { onStart, onMove, onEnd, color = '#8e5be8', baseWidth = 14 } = {}) {
  const ctx = canvas.getContext('2d');
  let active = null;      // az éppen rajzoló pointerId
  let last = null;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width * dpr)), nh = Math.max(1, Math.round(r.height * dpr));
    if (nw === canvas.width && nh === canvas.height) return;
    let snap = null;                       // a már megrajzolt vonalat átmentjük (forgatásnál ne vesszen el)
    if (canvas.width > 1 && canvas.height > 1) { snap = document.createElement('canvas'); snap.width = canvas.width; snap.height = canvas.height; snap.getContext('2d').drawImage(canvas, 0, 0); }
    canvas.width = nw; canvas.height = nh;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (snap) {                              // arányosan, középre igazítva (forgatásnál ne torzuljon a rajz)
      const k = Math.min(nw / snap.width, nh / snap.height), dw = snap.width * k, dh = snap.height * k;
      ctx.drawImage(snap, (nw - dw) / 2, (nh - dh) / 2, dw, dh);
    }
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

  let activeType = '';
  canvas.addEventListener('pointerdown', e => {
    // A ceruza mindig elsőbbséget kap: ha előbb a tenyér (ujj) ért le, a Pencil átveszi a rajzolást.
    const penTakesOver = e.pointerType === 'pen' && active !== null && activeType !== 'pen';
    if ((active !== null && !penTakesOver) || !allowed(e)) return;
    e.preventDefault();
    active = e.pointerId; activeType = e.pointerType;
    last = pos(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nem kritikus */ }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(last.x, last.y, widthFor(e) / 2, 0, 7); ctx.fill();
    onStart?.(last, e);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== active) return;
    e.preventDefault();
    if (e.pointerType === 'pen') lastPenAt = performance.now();   // hosszú vonás közben is ceruzásnak számít (a tenyér ne rajzoljon)
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
    if (e.pointerType === 'pen') lastPenAt = performance.now();
    active = null; activeType = ''; onEnd?.(e);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  // a kontextusmenü / kijelölés ne zavarjon
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return { ctx, setColor(c) { color = c; }, setWidth(w) { baseWidth = w; }, clear() { ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); }, destroy() { ro.disconnect(); } };
}
