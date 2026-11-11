// Barátom: válassz egy barátot, majd fésüld, simogasd, vagy játssz vele labdázni.
// Az állat minden gondoskodásra boldog hangokat ad (kuncog, dorombol, kacag...). Nincs hiba, nincs vége.
import { happy, unlockAudio, play } from '../sounds.js';
import { say } from '../voice.js';

const FRIENDS = [['🐱', 'cica'], ['🐰', 'nyuszi'], ['🐶', 'kutya'], ['🦊', 'róka'], ['🐻', 'maci'], ['🐼', 'panda']];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function run(container) {
  let alive = true, raf = 0, cleanup = () => {};
  const root = document.createElement('div'); root.className = 'pet'; container.innerHTML = ''; container.appendChild(root);

  function chooser() {
    cleanup(); cleanup = () => {};
    root.innerHTML = `<div class="pet-pick"><h2>Válaszd ki a barátodat! 🐾</h2><div class="pet-grid">${FRIENDS.map(([e, n]) => `<button class="pet-friend" data-e="${e}" data-n="${n}"><span>${e}</span><small>${n}</small></button>`).join('')}</div></div>`;
    root.querySelectorAll('.pet-friend').forEach(b => b.addEventListener('click', () => { unlockAudio(); happy(b.dataset.e); care(b.dataset.e, b.dataset.n); }));
    say('Válaszd ki a barátodat! Kit szeretnél megsimogatni, megfésülni, vagy vele játszani?', { remember: false });
  }

  function care(emoji, name) {
    root.innerHTML = `<div class="pet-stage" id="pet-stage">
        <button class="round pet-back" aria-label="Másik barát">🔙</button>
        <div class="pet-meter"><span class="fill"></span><span class="heart">❤️</span></div>
        <div class="pet-animal" id="pet-animal">${emoji}</div>
        <div class="pet-fx" id="pet-fx"></div>
        <div class="pet-tools"><button class="pet-tool sel" data-m="brush">🖌️<small>fésülés</small></button><button class="pet-tool" data-m="pet">✋<small>simogatás</small></button><button class="pet-tool" data-m="ball">⚽<small>labdázás</small></button></div>
      </div>`;
    const stage = root.querySelector('#pet-stage'), animal = root.querySelector('#pet-animal'), fx = root.querySelector('#pet-fx'), fill = root.querySelector('.pet-meter .fill');
    let mode = 'brush', joy = 0, ball = null, ballEl = null, animalPos = { x: 0, y: 0 }, home = { x: 0, y: 0 }, chasing = false;
    const rect = () => stage.getBoundingClientRect();
    const setJoy = d => { joy = Math.min(100, Math.max(0, joy + d)); fill.style.width = joy + '%'; if (joy >= 100) { joy = 0; fill.style.width = '0%'; celebrate(); } };
    async function celebrate() { happy(emoji); setTimeout(() => happy(emoji), 500); animal.classList.add('joy'); spawn('🎉', 6); say(`Nagyon boldog a ${name}! Szeretlek, mondja!`, { remember: false }); await sleep(1500); animal.classList.remove('joy'); }
    function spawn(e, n = 1, x, y) {
      const R = rect();
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div'); el.className = 'pet-spark'; el.textContent = e;
        el.style.left = (x ?? R.width / 2 + (Math.random() - 0.5) * 160) + 'px'; el.style.top = (y ?? R.height * 0.4 + (Math.random() - 0.5) * 80) + 'px';
        el.style.setProperty('--dx', (Math.random() - 0.5) * 90 + 'px'); fx.appendChild(el); setTimeout(() => el.remove(), 1100);
      }
    }
    const inAnimal = e => { const a = animal.getBoundingClientRect(); return e.clientX > a.left - 10 && e.clientX < a.right + 10 && e.clientY > a.top - 10 && e.clientY < a.bottom + 10; };

    // --- fésülés és simogatás: húzás az állat fölött ---
    let down = false, lastP = null, acc = 0, lastSound = 0;
    stage.addEventListener('pointerdown', e => { unlockAudio(); if (e.target.closest('button')) return; down = true; lastP = { x: e.clientX, y: e.clientY }; if (mode === 'ball') startThrow(e); });
    stage.addEventListener('pointermove', e => {
      if (!down || mode === 'ball') { if (down && mode === 'ball') moveThrow(e); return; }
      const d = Math.hypot(e.clientX - lastP.x, e.clientY - lastP.y); lastP = { x: e.clientX, y: e.clientY };
      if (!inAnimal(e)) return;
      acc += d; const R = rect();
      if (mode === 'brush' && acc > 70) { acc = 0; spawn('✨', 1, e.clientX - R.left, e.clientY - R.top); setJoy(7); if (Date.now() - lastSound > 1100) { lastSound = Date.now(); happy(emoji); } }
      if (mode === 'pet' && acc > 90) { acc = 0; spawn('❤️', 1, e.clientX - R.left, e.clientY - R.top); setJoy(6); animal.classList.add('wiggle'); setTimeout(() => animal.classList.remove('wiggle'), 300); if (Date.now() - lastSound > 1300) { lastSound = Date.now(); happy(emoji); } }
    });
    const up = e => { down = false; if (mode === 'ball') endThrow(e); };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

    // --- labdázás: dobd el a labdát, az állat elhozza ---
    function ensureBall() {
      if (ballEl) return; const R = rect();
      ballEl = document.createElement('div'); ballEl.className = 'pet-ball'; ballEl.textContent = '⚽'; stage.appendChild(ballEl);
      ball = { x: R.width * 0.5, y: R.height * 0.82, vx: 0, vy: 0, held: false, carried: false, hist: [] }; place();
    }
    const place = () => { if (ballEl) ballEl.style.transform = `translate(${ball.x - 36}px, ${ball.y - 36}px)`; };
    function startThrow(e) { ensureBall(); const R = rect(), x = e.clientX - R.left, y = e.clientY - R.top; if (Math.hypot(x - ball.x, y - ball.y) < 90 && !chasing) { ball.held = true; ball.hist = [[performance.now(), x, y]]; ball.x = x; ball.y = y; place(); } }
    function moveThrow(e) { if (!ball?.held) return; const R = rect(); ball.x = e.clientX - R.left; ball.y = e.clientY - R.top; ball.hist.push([performance.now(), ball.x, ball.y]); if (ball.hist.length > 6) ball.hist.shift(); place(); }
    function endThrow() { if (!ball?.held) return; ball.held = false; const h = ball.hist, a = h[0], b = h[h.length - 1], dt = Math.max(0.016, (b[0] - a[0]) / 1000); ball.vx = Math.max(-900, Math.min(900, (b[1] - a[1]) / dt)); ball.vy = Math.max(-900, Math.min(900, (b[2] - a[2]) / dt)); if (Math.hypot(ball.vx, ball.vy) < 120) { ball.vx = (Math.random() - 0.5) * 500; ball.vy = -350; } chasing = true; play('yay'); }
    function placeAnimal() { animal.style.transform = `translate(${animalPos.x}px, ${animalPos.y}px)`; }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const R = rect();
      home = { x: R.width / 2 - animal.offsetWidth / 2, y: R.height * 0.18 };
      if (!animalPos.set) { animalPos = { x: home.x, y: home.y, set: true }; }
      if (mode === 'ball' && ball && !ball.held) {
        if (ball.carried) {                                               // az állat hozza vissza
          const tx = R.width / 2 - 36, ty = R.height * 0.8, dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy);
          ball.x += (dx / (d || 1)) * Math.min(d, 300 * dt); ball.y += (dy / (d || 1)) * Math.min(d, 300 * dt);
          animalPos.x += (ball.x - 70 - animalPos.x) * Math.min(1, dt * 6); animalPos.y += (ball.y - 150 - animalPos.y) * Math.min(1, dt * 6);
          if (d < 6) { ball.carried = false; chasing = false; setJoy(14); happy(emoji); spawn('⭐', 4, ball.x, ball.y - 60); }
        } else if (chasing) {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vx *= 1 - dt * 1.6; ball.vy = ball.vy * (1 - dt * 1.6) + 400 * dt;
          if (ball.x < 36 || ball.x > R.width - 36) { ball.vx *= -0.8; ball.x = Math.min(R.width - 36, Math.max(36, ball.x)); }
          if (ball.y > R.height - 110) { ball.y = R.height - 110; ball.vy *= -0.55; } if (ball.y < 60) { ball.y = 60; ball.vy *= -0.6; }
          const slow = Math.hypot(ball.vx, ball.vy) < 180;
          const tx = ball.x - animal.offsetWidth / 2 + 36, ty = ball.y - animal.offsetHeight / 2, dx = tx - animalPos.x, dy = ty - animalPos.y, d = Math.hypot(dx, dy);
          animalPos.x += (dx / (d || 1)) * Math.min(d, 420 * dt); animalPos.y += (dy / (d || 1)) * Math.min(d, 420 * dt);
          if (d < 60 && slow) { ball.carried = true; ball.vx = ball.vy = 0; animal.classList.add('wiggle'); setTimeout(() => animal.classList.remove('wiggle'), 300); }
        }
        place();
      } else if (mode !== 'ball') { animalPos.x += (home.x - animalPos.x) * Math.min(1, dt * 4); animalPos.y += (home.y - animalPos.y) * Math.min(1, dt * 4); }
      placeAnimal(); raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    root.querySelectorAll('.pet-tool').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.m; root.querySelectorAll('.pet-tool').forEach(x => x.classList.toggle('sel', x === b)); down = false;
      if (mode === 'ball') { ensureBall(); ballEl.style.display = ''; say(`Dobd el a labdát! A ${name} elhozza neked!`, { remember: false }); }
      else { if (ballEl) ballEl.style.display = 'none'; chasing = false; if (ball) ball.carried = false; say(mode === 'brush' ? `Húzd az ujjadat a ${name} szőrén, így fésülöd meg!` : `Simogasd meg a ${name}t!`, { remember: false }); }
    }));
    root.querySelector('.pet-back').addEventListener('click', chooser);
    say(`Szia! Én vagyok a ${name}! Fésülj meg, simogass meg, vagy játsszunk labdázni!`, { remember: false });
    cleanup = () => { cancelAnimationFrame(raf); };
  }

  chooser();
  return () => { alive = false; cleanup(); };
}
