// Csillagmérő: ★☆☆ — a csillag látványosan odarepül és kigyullad. Kevés csillagnál külön csillagok,
// sokatnál (12 fölött) kitöltődő sáv számlálóval: a jutalomhoz egyre több csillag kell.
const meter = () => document.getElementById('meter');
const BAR_FROM = 13;

export function renderMeter(count, slots) {
  const el = meter();
  if (slots) {
    const wantBar = slots >= BAR_FROM;
    if (wantBar !== el.classList.contains('bar') || el.dataset.slots !== String(slots)) {
      el.classList.toggle('bar', wantBar); el.dataset.slots = String(slots);
      el.innerHTML = wantBar
        ? '<span class="track"><span class="fill"></span></span><span class="slot ico on">★</span><b class="num"></b>'
        : Array.from({ length: slots }, (_, i) => `<span class="slot" data-i="${i}">★</span>`).join('');
    }
  }
  if (el.classList.contains('bar')) {
    const total = +el.dataset.slots || 1;
    el.querySelector('.fill').style.width = Math.min(100, (count / total) * 100) + '%';
    el.querySelector('.num').textContent = count + '/' + total;
  } else el.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('on', i < count));
}

import { giveStar } from './robot.js';

// Egy csillag Roziból (aki osztja) a mérőre repül.
export function flyStar(toIndex, count) {
  return new Promise(resolve => {
    const el0 = meter();
    const target = el0.classList.contains('bar') ? el0.querySelector('.ico') : el0.querySelectorAll('.slot')[toIndex];
    const layer = document.getElementById('fly-layer');
    const el = document.createElement('div'); el.className = 'fly'; el.textContent = '★';
    const o = giveStar();
    const sx = (o ? o.x : window.innerWidth / 2) - 40, sy = (o ? o.y : window.innerHeight / 2) - 40;
    el.style.left = sx + 'px'; el.style.top = sy + 'px'; layer.appendChild(el);
    const r = (target || el0).getBoundingClientRect();
    const dx = r.left + r.width / 2 - 40 - sx, dy = r.top + r.height / 2 - 40 - sy;
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${dx}px, ${dy}px) scale(.55) rotate(360deg)`; }));
    setTimeout(() => { el.remove(); renderMeter(count ?? toIndex + 1); resolve(); }, 950);
  });
}
