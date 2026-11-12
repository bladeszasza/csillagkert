// Állatetetés a kertben: az éhes barát (a kert valódi 3D lakója) az etetőhelyre sétál, a kamera ráközelít,
// és az asztalról neki kell adni az ételt: a szájához húzva, vagy az ételre koppintva.
// Jó étel: rág, megköszöni, és CSAK az állat saját hangja szól. Tévedés: udvariasan elfordítja a fejét,
// a falat visszalebeg; a második tévedésnél a rossz étel eltűnik, a jó felragyog, és egy mondat megtanítja.
// Ha a 3D kert nem érhető el, ugyanez a játék az állat képével megy.
import { say } from '../voice.js';
import { animalVoice, munch } from '../sounds.js';
import { ding } from '../audio.js';
import { withArt } from '../hu.js';
import { sleep, later } from '../scope.js';
import { FOODS } from '../friends.js';

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function run(container, { kind, animal, name, good, wrong }, ctx = {}) {
  return new Promise(resolve => {
    const foods = shuffle([{ name: good, ok: true }, ...wrong.map(n => ({ name: n, ok: false }))]).map(f => ({ ...f, ...FOODS[f.name] }));
    const A = withArt(name), Acap = withArt(name, true);
    container.innerHTML = `
      <div class="activity feedpad">
        <div class="prompt">Éhes ${A}! Mit eszik? 🍽️</div>
        <div class="animal-wrap" id="feed-win"><div class="animal" id="animal">${animal}</div><div class="bubble" id="bubble"></div></div>
        <div class="feed-table"><div class="answers foods">${foods.map((f, i) => `<button class="answer pic food" data-i="${i}" aria-label="${f.name}">${f.svg || f.t}<small>${f.name}</small></button>`).join('')}</div></div>
      </div>`;
    const root = container.querySelector('.feedpad'), win = container.querySelector('#feed-win');
    const animalEl = container.querySelector('#animal'), bubble = container.querySelector('#bubble');
    const btns = [...container.querySelectorAll('.food')];

    // a kert valódi állata (ha van 3D kert); különben az állat képe marad
    let live = null;
    try { live = ctx.garden?.beginFeed?.(kind, () => win.getBoundingClientRect()) || null; } catch (e) { live = null; }
    root.classList.toggle('live', !!live); container.classList.toggle('see-garden', !!live);

    let wrongs = 0, locked = true, finished = false, taught = false;
    const target = () => {                           // az állat helye a képernyőn (a 3D-ből vetítve, vagy a kép helye)
      if (live) { const r = live.rect(); return { ...r, mx: r.mouth.x, my: r.mouth.y }; }
      const r = animalEl.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, mx: r.left + r.width / 2, my: r.top + r.height * 0.6 };
    };
    const flyTo = (btn, scale) => {                  // az étel az állat szájához repül
      const t = target(), b = btn.getBoundingClientRect(), cur = new DOMMatrixReadOnly(getComputedStyle(btn).transform);
      const x = t.mx - (b.left + b.width / 2) + cur.m41, y = t.my - (b.top + b.height / 2) + cur.m42;
      btn.style.transition = 'transform .42s ease-in'; btn.style.zIndex = 5; btn.classList.add('fly');
      btn.dataset.at = `translate(${x}px, ${y}px)`; btn.style.transform = `${btn.dataset.at} scale(${scale})`;
    };
    const home = btn => { btn.style.transition = 'transform .45s'; btn.style.transform = ''; btn.style.zIndex = ''; btn.classList.remove('fly'); };

    async function decide(btn) {
      if (locked || finished) return;
      locked = true;
      const f = foods[+btn.dataset.i];
      flyTo(btn, 0.55); await sleep(440);
      if (f.ok) {
        finished = true; btn.classList.add('eaten');
        live?.eat(1150); animalEl.classList.add('munch');
        for (const s of [0.42, 0.28, 0.12]) {         // rág: a falat három harapással elfogy
          munch(); btn.style.transition = 'transform .2s'; btn.style.transform = `${btn.dataset.at} scale(${s})`;
          await sleep(370);
        }
        btn.style.opacity = 0;
        live?.thank(); if (!live) bubble.textContent = '😋';
        animalVoice(kind, { happy: true, defer: later });           // jóllakott: csak az állat hangja szól, Rozi hallgat
        await sleep(1900);
        resolve();
      } else {
        wrongs++;
        live?.refuse(); if (!live) { animalEl.classList.add('shake'); bubble.textContent = '🙅'; }
        ding(440, { dur: 0.16, vol: 0.3 }); ding(370, { dur: 0.22, vol: 0.3, when: 0.17 });   // szelíd "nem-nem", nem büntető hang
        await sleep(500); home(btn); await sleep(480);
        if (!live) { animalEl.classList.remove('shake'); bubble.textContent = ''; }
        if (wrongs >= 2) {
          btn.classList.add('gone');                  // ezt már nem kell újra kipróbálni
          btns[foods.findIndex(x => x.ok)].classList.add('glow');
          if (!taught) { taught = true; await say(`${Acap} ${FOODS[good].acc} eszik.`, { remember: false }); }
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
      btn.addEventListener('pointerup', e => {
        if (!start) return;
        const s = start; start = null;
        const t = target(), pad = 36;
        const over = e.clientX > t.left - pad && e.clientX < t.right + pad && e.clientY > t.top - pad && e.clientY < t.bottom + pad;
        if (!s.moved || over) decide(btn); else home(btn);
      });
      btn.addEventListener('pointercancel', () => { start = null; home(btn); });
    });

    say(`Éhes ${A}! Mit eszik?`);                    // egyetlen rövid megszólalás; a 🔊 gomb megismétli
    sleep(live ? live.arriveMs : 0).then(() => { locked = false; });   // amíg a barát odasétál, az étel vár
  });
}
