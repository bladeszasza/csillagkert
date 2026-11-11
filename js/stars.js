// Csillagmérő: ★☆☆ — a csillag látványosan odarepül és kigyullad.
const meter = () => document.getElementById('meter');

export function renderMeter(count) {
  meter().querySelectorAll('.slot').forEach((el, i) => el.classList.toggle('on', i < count));
}

// Egy csillag a képernyő közepéről a soron következő mérőhelyre repül.
export function flyStar(toIndex) {
  return new Promise(resolve => {
    const slot = meter().querySelectorAll('.slot')[toIndex];
    const layer = document.getElementById('fly-layer');
    const el = document.createElement('div'); el.className = 'fly'; el.textContent = '★';
    const sx = window.innerWidth / 2 - 40, sy = window.innerHeight / 2 - 40;
    el.style.left = sx + 'px'; el.style.top = sy + 'px'; layer.appendChild(el);
    const r = slot.getBoundingClientRect();
    const dx = r.left + r.width / 2 - 40 - sx, dy = r.top + r.height / 2 - 40 - sy;
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${dx}px, ${dy}px) scale(.55) rotate(360deg)`; }));
    setTimeout(() => { el.remove(); renderMeter(toIndex + 1); resolve(); }, 950);
  });
}
