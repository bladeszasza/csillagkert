// Állatetetés: húzd (vagy koppints) az ételt az állat szájához. Tévedés után az étel szelíden visszamegy,
// az állat nem haragszik; két hibánál megtanítjuk, mi a kedvence. A tanulság: ki mit eszik.
import { say } from '../voice.js';
import { happy } from '../sounds.js';
import { withArt } from '../hu.js';

import { sleep, later, onAbort } from '../scope.js';
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function run(container, { animal, name, food }) {
  return new Promise(resolve => {
    const foods = shuffle(food);
    const good = foods.find(f => f.ok);
    container.innerHTML = `
      <div class="activity feedpad">
        <div class="prompt">Éhes ${withArt(name)}! Mit eszik? 🍽️</div>
        <div class="animal-wrap"><div class="animal" id="animal">${animal}</div><div class="bubble" id="bubble"></div></div>
        <div class="answers foods">${foods.map((f, i) => `<button class="answer pic food" data-i="${i}">${f.t}<small>${f.name}</small></button>`).join('')}</div>
      </div>`;
    const animalEl = container.querySelector('#animal'), bubble = container.querySelector('#bubble');
    const btns = [...container.querySelectorAll('.food')];
    let wrong = 0, locked = false, finished = false;
    const A = withArt(name), Acap = withArt(name, true);
    const speakQ = `Éhes ${A}! Mit eszik?`;

    function toAnimal(btn) { // az étel az állathoz repül
      const a = animalEl.getBoundingClientRect(), b = btn.getBoundingClientRect();
      btn.style.transition = 'transform .45s ease-in'; btn.style.zIndex = 5;
      btn.style.transform = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(.3)`;
      return sleep(480);
    }
    async function decide(btn) {
      if (locked || finished) return;
      locked = true;
      const f = foods[+btn.dataset.i];
      await toAnimal(btn);
      if (f.ok) {
        finished = true; btn.style.opacity = 0; animalEl.classList.add('munch'); bubble.textContent = '😋 nyam-nyam!';
        happy(animal); later(() => happy(animal), 700);
        await sleep(1400);                                    // jóllakás: csak az állat hangja szól, a robot hallgat
        const { run: runHealthy } = await import('../rewards/healthy.js');   // utána a barátok etetése / ajándékozás
        let stopH = null;
        onAbort(() => stopH?.());                           // X-re a 3D jelenet és az időzítők is megszűnnek
        await new Promise(done => { stopH = runHealthy(container, { rounds: true, onDone: done }); });
        try { stopH?.(); } catch (e) {}                       // a 3D jelenet és a ciklus megszűnik
        resolve();
      } else {
        wrong++; btn.style.transition = 'transform .4s'; btn.style.transform = ''; btn.style.zIndex = '';
        animalEl.classList.add('shake'); bubble.textContent = '🙅 ez nem az enyém';
        await say(`Ezt nem eszi ${A}.`, { remember: false });
        animalEl.classList.remove('shake'); bubble.textContent = '';
        if (wrong >= 2) {
          const bad = btns.filter((b, k) => !foods[k].ok && b.style.opacity !== '0' && !b.classList.contains('gone'));
          if (bad.length > 1) bad[0].classList.add('gone');
          await say(`Segítek! Nézd, melyik ragyog.`, { remember: false });
          btns[foods.indexOf(good)].classList.add('glow');
        }
        locked = false;
      }
    }

    // húzás (ujj / Apple Pencil) vagy egyszerű koppintás
    btns.forEach(btn => {
      let start = null;
      btn.addEventListener('pointerdown', e => {
        if (locked || finished) return;
        start = { x: e.clientX, y: e.clientY, moved: false }; try { btn.setPointerCapture?.(e.pointerId); } catch (err) {}
        btn.style.transition = 'none'; btn.style.zIndex = 5;
      });
      btn.addEventListener('pointermove', e => {
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 8) start.moved = true;
        btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      });
      const up = async e => {
        if (!start) return;
        const s = start; start = null;
        const a = animalEl.getBoundingClientRect(), pad = 30;
        const over = e.clientX > a.left - pad && e.clientX < a.right + pad && e.clientY > a.top - pad && e.clientY < a.bottom + pad;
        if (!s.moved || over) { btn.style.transform = ''; await decide(btn); }
        else { btn.style.transition = 'transform .35s'; btn.style.transform = ''; btn.style.zIndex = ''; }
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', () => { start = null; btn.style.transition = 'transform .3s'; btn.style.transform = ''; });
    });
    say(speakQ);
  });
}
