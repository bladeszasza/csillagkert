// Etesd a cicát: húzd a cicát, és kapd el a lehulló finomságokat. Minden elkapott falattól kicsit
// kerekebb és boldogabb a cica; ha tele a pocak, "jóllakott" és dorombol. A mellément falat nem számít semmit.
// (Az elemek a lapon belüli elemek, nem vászonra rajzolt emoji, így minden eszközön színesek.)
import { say } from '../voice.js';
import { happy, unlockAudio } from '../sounds.js';
import { createStage } from './stage3d.js';
import { makeGardenCat, animateCat, CAT_HEIGHT } from './cat3d.js';

const FOODS = ['🐟', '🥛', '🍗', '🦐', '🧀'];
const FULL_AT = 8;

export function run(container) {
  container.innerHTML = `
    <div class="fc">
      <div class="fc-bar"><div class="fc-fill"></div><span class="fc-label">🍽️</span></div>
      <div class="fc-layer"></div>
      <div class="fc-cat">🐱</div>
      <div class="fc-msg"></div>
    </div>`;
  const root = container.querySelector('.fc'), layer = root.querySelector('.fc-layer'), cat = root.querySelector('.fc-cat');
  const fill = root.querySelector('.fc-fill'), msg = root.querySelector('.fc-msg');
  let w = 0, h = 0, raf = 0, audio = null, catX = 0.5, full = 0, resting = false, acc = 0, last = performance.now();
  const drops = [];
  let st3 = null, cat3 = null, hopUntil = 0, nomUntil = 0;
  try { st3 = createStage(root); cat3 = st3.add(makeGardenCat()); cat.style.opacity = 0; } catch (e) { console.warn('3D cica nem indult el', e); st3 = null; }

  function size() { w = root.clientWidth; h = root.clientHeight; }
  size();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(root);
  window.addEventListener('resize', size);

  function unlock() { unlockAudio(); try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} }
  function chime(f = 700) {
    try { if (!audio) return; const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + .3); } catch (e) {}
  }
  const move = e => { const r = root.getBoundingClientRect(); catX = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); unlock(); };
  root.addEventListener('pointerdown', move); root.addEventListener('pointermove', move); root.addEventListener('pointerup', unlock);

  function spawn() {
    const el = document.createElement('div'); el.className = 'fc-food'; el.textContent = FOODS[(Math.random() * FOODS.length) | 0];
    layer.appendChild(el);
    drops.push({ el, x: 50 + Math.random() * Math.max(10, w - 100), y: -60, vy: 110 + Math.random() * 70, rot: Math.random() * 60 - 30 });
  }
  async function purr() {
    resting = true; hopUntil = performance.now() + 3000; cat.textContent = '😻'; cat.classList.add('purr'); msg.textContent = 'Jóllakott! ❤️';
    say('Jóllakott a cica! Nyam-nyam!', { remember: false });
    setTimeout(() => { full = 0; fill.style.width = '0%'; cat.textContent = '🐱'; cat.classList.remove('purr'); cat.style.setProperty('--belly', 1); msg.textContent = ''; resting = false; }, 3000);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    if (!resting && acc > 0.75 && drops.length < 6) { spawn(); acc = 0; }
    const cx = catX * w, catSize = cat.offsetWidth || 130;
    cat.style.transform = `translate(${cx - catSize / 2}px, 0) scale(var(--belly, 1))`;
    const catTop = h - catSize - 14;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.y += d.vy * dt;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px) rotate(${d.rot + d.y * 0.2}deg)`;
      const dcx = d.x + 30, dcy = d.y + 30;
      if (!resting && Math.abs(dcx - cx) < catSize * 0.55 && dcy > catTop && dcy < catTop + catSize) {
        d.el.remove(); drops.splice(i, 1); chime(600 + full * 60);
        full++; fill.style.width = Math.min(100, (full / FULL_AT) * 100) + '%'; cat.style.setProperty('--belly', 1 + full * 0.05);
        cat.classList.remove('nom'); void cat.offsetWidth; cat.classList.add('nom'); nomUntil = performance.now() + 500;
        if (full % 3 === 0 && full < FULL_AT) happy('🐱');
        if (full >= FULL_AT) { happy('🐱'); purr(); }
        continue;
      }
      if (d.y > h + 40) { d.el.remove(); drops.splice(i, 1); }
    }
    if (st3) {
      const rr = st3.hostRect(), cr = cat.getBoundingClientRect(), t = now / 1000;
      const hopT = Math.max(0, (hopUntil - now) / 3000), nomT = Math.max(0, (nomUntil - now) / 500), belly = 1 + full * 0.05;
      st3.place(cat3, cr.left - rr.left + cr.width / 2, h - 14, catSize * 1.25 * belly, CAT_HEIGHT);
      cat3.rotation.y = Math.sin(t) * 0.15;
      animateCat(cat3, t, { hop: hopT > 0 ? 1 - hopT : 0, nom: nomT > 0 ? 1 - nomT : 0, cheer: resting });
      st3.render();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); st3?.dispose(); ro?.disconnect(); window.removeEventListener('resize', size); try { audio && audio.close(); } catch (e) {} };
}
