// Barátom: válassz egy barátot, majd fésüld, simogasd, vagy játssz vele labdázni.
// Az állat minden gondoskodásra boldog hangokat ad (kuncog, dorombol, kacag...). Nincs hiba, nincs vége.
import { icon } from '../icons.js';
import { happy, unlockAudio, play } from '../sounds.js';
import { say } from '../voice.js';
import { FRIEND_ACC, withArt } from '../hu.js';
import { createStage } from './stage3d.js';
import { makeGardenCat, animateCat, CAT_HEIGHT } from './cat3d.js';
import { makeFriend, animateFriend } from './creatures.js';
import { makeCharacter, animateCharacter, measureCharacter, createCharacterBatch } from '../three/characters.js';
const KIND = { cica: 'cat', nyuszi: 'bunny', kutya: 'dog', róka: 'fox', maci: 'bear', panda: 'panda', unikornis: 'unicorn' };

// az utolsó a gyerek saját unikornisa, a mostani ruhájában (ctx.avatar)
const FRIENDS = [['🐱', 'cica'], ['🐰', 'nyuszi'], ['🐶', 'kutya'], ['🦊', 'róka'], ['🐻', 'maci'], ['🐼', 'panda'], ['🦄', 'unikornis']];

export function run(container, ctx = {}) {
  let alive = true, raf = 0, cleanup = () => {};
  const root = document.createElement('div'); root.className = 'pet'; container.innerHTML = ''; container.appendChild(root);
  const view = document.createElement('div'); view.style.cssText = 'position:absolute;inset:0'; root.appendChild(view);
  // EGY 3D színpad az egész játékra (a választó ↔ gondozás váltás nem nyit új WebGL-kontextust)
  let st3 = null, crowd = null;
  try { st3 = createStage(root); st3.canvas.style.display = 'none'; } catch (e) { console.warn('3D színpad nem indult', e); st3 = null; }
  const ensureCrowd = () => crowd || (crowd = createCharacterBatch(st3.scene));   // a saját unikornis példányosított rajzolása
  // Rozi szabad játékban ritkán szól (legfeljebb 15 mp-enként egyszer); a hang és a kép viszi a többit
  let lastTalk = -1e9;
  const talk = (text, force = false) => { const now = performance.now(); if (!force && now - lastTalk < 15000) return; lastTalk = now; say(text, { remember: false }); };

  function chooser() {
    cleanup(); cleanup = () => {};
    if (st3) st3.canvas.style.display = 'none';
    view.innerHTML = `<div class="pet-pick"><h2>Válaszd ki a barátodat! 🐾</h2><div class="pet-grid">${FRIENDS.map(([e, n]) => `<button class="pet-friend" data-e="${e}" data-n="${n}"><span>${e}</span><small>${n}</small></button>`).join('')}</div></div>`;
    view.querySelectorAll('.pet-friend').forEach(b => b.addEventListener('click', () => { unlockAudio(); happy(b.dataset.e); care(b.dataset.e, b.dataset.n); }));
    talk('Válaszd ki a barátodat!', true);
  }

  function care(emoji, name) {
    view.innerHTML = `<div class="pet-stage" id="pet-stage">
        <button class="round pet-back" aria-label="Másik barát">${icon('ui-friends')}</button>
        <div class="pet-meter"><span class="fill"></span><span class="heart">❤️</span></div>
        <div class="pet-animal" id="pet-animal">${emoji}</div>
        <div class="pet-fx" id="pet-fx"></div>
        <div class="pet-tools"><button class="pet-tool sel" data-m="brush">${icon('ui-comb')}<small>fésülés</small></button><button class="pet-tool" data-m="pet">${icon('ui-hand')}<small>simogatás</small></button><button class="pet-tool" data-m="ball">${icon('ui-ball')}<small>labdázás</small></button></div>
      </div>`;
    const stage = view.querySelector('#pet-stage'), animal = view.querySelector('#pet-animal'), fx = view.querySelector('#pet-fx'), fill = view.querySelector('.pet-meter .fill');
    // a 3D állat az emoji helyén jelenik meg (az emoji csak a hely és az érintés célpontja)
    let model = null, modelH = 1.9; const kind = KIND[name] || 'cat', uni = kind === 'unicorn';
    if (st3) { try {
      if (uni) { model = makeCharacter('unicorn', ctx.avatar || {}); ensureCrowd().add(model); modelH = measureCharacter(model).height; model.userData.facing = Math.PI - 0.55; }   // ferdén áll: látszik a szarva és a ruhája
      else { model = kind === 'cat' ? makeGardenCat() : makeFriend(kind); model.userData.facing = kind === 'cat' ? 0 : Math.PI; if (kind === 'cat') modelH = CAT_HEIGHT; }
      st3.add(model); st3.canvas.style.display = ''; animal.style.opacity = 0;
    } catch (e) { console.warn('3D állat nem indult', e); model = null; } }
    let mode = 'brush', joy = 0, ball = null, ballEl = null, animalPos = { x: 0, y: 0 }, home = { x: 0, y: 0 }, chasing = false, hopUntil = 0;
    const rect = () => stage.getBoundingClientRect();
    const setJoy = d => { joy = Math.min(100, Math.max(0, joy + d)); fill.style.width = joy + '%'; if (joy >= 100) { joy = 0; fill.style.width = '0%'; celebrate(); } };
    // ünneplés: csak a 3D állat ugrál a helyén (a régi CSS-animáció felülírta a helyét, és a sarokba rántotta)
    const timers = new Set(), later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    function celebrate() { ctx.heart?.(); ctx.gift?.(); happy(emoji);   // a boldog barát: gondoskodás (szív) és ajándék
      later(() => happy(emoji), 500); hopUntil = performance.now() + 1500; spawn('🎉', 6); talk(`${withArt(name, true)} nagyon boldog!`); }
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
      ballEl = document.createElement('div'); ballEl.className = 'pet-ball'; ballEl.innerHTML = icon('ui-ball'); stage.appendChild(ballEl);
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
      placeAnimal();
      if (st3 && model) {
        const rr = st3.hostRect(), r = animal.getBoundingClientRect(), t = now / 1000, hop = now < hopUntil, wig = animal.classList.contains('wiggle');
        st3.place(model, r.left - rr.left + r.width / 2, r.bottom - rr.top - (hop ? Math.abs(Math.sin(t * 9)) * 30 : 0), r.height * (kind === 'cat' ? 1.35 : uni ? 1.2 : 1.45), modelH);
        const dxb = ball && chasing ? (ball.x - (animalPos.x + r.width / 2)) / 220 : 0;
        model.rotation.y = model.userData.facing + Math.max(-0.9, Math.min(0.9, dxb)) + Math.sin(t) * 0.12;
        if (kind === 'cat') animateCat(model, t, { hop: hop ? (t * 1.5) % 1 : 0, shake: wig ? (t * 3) % 1 : 0, cheer: hop });
        else if (uni) animateCharacter(model, t, chasing ? 0.8 : 0, hop || wig); else animateFriend(model, t, chasing ? 0.8 : 0, hop || wig);
        crowd?.update(); st3.render();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // eszközváltás: minden eszköz rövid magyarázata egyszer hangzik el (és ritkán: lásd talk)
    const told = new Set();
    view.querySelectorAll('.pet-tool').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.m; view.querySelectorAll('.pet-tool').forEach(x => x.classList.toggle('sel', x === b)); down = false;
      const tip = { ball: 'Dobd el a labdát!', brush: 'Fésüld meg az ujjaddal!', pet: `Simogasd meg ${withArt(FRIEND_ACC[name] || name)}!` }[mode];
      if (!told.has(mode)) { told.add(mode); talk(tip); }
      if (mode === 'ball') { ensureBall(); ballEl.style.display = ''; play('boing'); }
      else { if (ballEl) ballEl.style.display = 'none'; chasing = false; if (ball) ball.carried = false; }
    }));
    view.querySelector('.pet-back').addEventListener('click', chooser);
    told.add('brush'); talk(`Szia! Fésülj meg, simogass meg, vagy dobj labdát!`, true);
    container.__pet = Object.assign(container.__pet || {}, { celebrate, animalRect: () => animal.getBoundingClientRect(), tool: m => view.querySelector('.pet-tool[data-m=' + m + ']')?.click(), back: () => view.querySelector('.pet-back')?.click(), model: () => model, crowd: () => crowd });
    cleanup = () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers.clear(); if (st3 && model) { crowd?.remove(model); st3.remove(model); } model = null; };
  }

  chooser();
  container.__pet = Object.assign(container.__pet || {}, { choose: i => view.querySelectorAll('.pet-friend')[i]?.click(), stage: () => st3, view });
  return () => { alive = false; cleanup(); crowd?.dispose(); crowd = null; st3?.dispose(); st3 = null; };
}
