// Matrica (Rajzasztal): térbeli szavak. A gyerek a polcról a jelenetbe húzza a matricát (vagy a helyre koppint).
// A lehetséges helyeket szaggatott kör jelzi. Rossz helyen Rozi megmondja, hova került ("A cica most a szék mellett
// van."), és a matrica visszaszáll a polcra; a második tévedés után a jó hely felvillan. Jó helyen egy teljes, igaz
// mondat: "A cica a szék alatt van."
import { say } from '../voice.js';
import { every, later } from '../scope.js';
import { penAllows } from '../pen.js';
import { happy } from '../sounds.js';
import { relPhrase, withA } from '../content/rajz.js';

const W = 120, H = 100, GROUND = 62, HOME = [60, 91];

export function run(container, item) {
  const { refs, slots, sticker, rel } = item;
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity matrica">
        <div class="prompt">${item.prompt || 'Hova kerüljön?'}</div>
        <div class="mt-wrap"><div class="mt-scene">
          <div class="mt-ground"></div><div class="mt-shelf"></div>
          ${refs.map((r, i) => `<span class="mt-ref" data-r="${i}">${r.pic}</span>`).join('')}
          ${slots.map(s => `<div class="mt-slot" data-s="${s.id}"></div>`).join('')}
          <span class="mt-st">${sticker[0]}</span>
        </div></div>
      </div>`;
    const box = container.querySelector('.activity'), wrap = container.querySelector('.mt-wrap'), scene = container.querySelector('.mt-scene'), st = container.querySelector('.mt-st');
    let u = 6, pos = HOME.slice(), drag = null, done = false, wrong = 0, lastAct = performance.now(), busy = false;
    const nameOf = r => withA((r.size ? r.size + ' ' : '') + r.name);
    const formsOf = r => r.forms.map(f => f && withA((r.size ? r.size + ' ' : '') + f));
    const where = s => (s.rel === 'koze' ? `${withA(refs[0].name)} és ${withA(refs[1].name)} között` : relPhrase(s.rel, nameOf(refs[s.ref]), formsOf(refs[s.ref]), true));
    const Nom = withA(sticker[1]).replace(/^a/, 'A');
    const dir = s => (s.rel === 'bal' ? ', balra' : s.rel === 'jobb' ? ', jobbra' : '');      // "A cica a ház mellett van, balra."

    function layout() {
      const r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
      u = Math.max(3, Math.min(r.width / W, r.height / H));
      scene.style.width = `${W * u}px`; scene.style.height = `${H * u}px`; scene.style.setProperty('--u', `${u}px`);
      refs.forEach((rf, i) => { const el = scene.querySelector(`.mt-ref[data-r="${i}"]`); el.style.left = `${rf.x * u}px`; el.style.top = `${GROUND * u}px`; el.style.fontSize = `${rf.s * u}px`; });
      slots.forEach(s => { const el = scene.querySelector(`.mt-slot[data-s="${s.id}"]`); el.style.left = `${s.x * u}px`; el.style.top = `${s.y * u}px`; });
      place(pos, false);
    }
    const peek = s => [s.x, GROUND - refs[s.ref].s * 0.88];        // a tároló pereme mögül kikukucskál
    function place(p, anim = true) { pos = p; st.classList.toggle('fly', anim); st.style.left = `${p[0] * u}px`; st.style.top = `${p[1] * u}px`; }
    const toScene = e => { const r = scene.getBoundingClientRect(); return [(e.clientX - r.left) / u, (e.clientY - r.top) / u]; };
    function nearest(p) { let best = null, bd = 13; for (const s of slots) { const d = Math.hypot(s.x - p[0], s.y - p[1]); if (d < bd) { bd = d; best = s; } } return best; }

    function drop(s) {
      if (done || busy) return;
      lastAct = performance.now();
      if (!s) { place(HOME); return; }
      place(s.rel === 'bele' ? peek(s) : [s.x, s.y]); st.classList.toggle('behind', s.rel === 'bele');
      if (s.ok) {
        done = true; box.classList.add('done'); happy(sticker[0]);
        say(`Ügyes! ${Nom} ${where(s)} van${dir(s)}.`);
        later(() => resolve({ wrong }), 1600);
        return;
      }
      wrong++; busy = true;
      const cue = wrong >= 2 && (rel === 'bal' || rel === 'jobb') ? ` Tedd a kezed a szívedre: az a bal oldalad.${rel === 'jobb' ? ' A másik a jobb.' : ''}` : '';
      say(`${Nom} most ${where(s)} van${dir(s)}.${cue} ${item.say}`, { remember: false });
      later(() => { busy = false; st.classList.remove('behind'); place(HOME); if (wrong >= 2) hint(); }, 1500);
    }
    function hint() { for (const s of slots.filter(x => x.ok)) { const el = scene.querySelector(`.mt-slot[data-s="${s.id}"]`); el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); } }

    st.addEventListener('pointerdown', e => {
      if (done || busy || !penAllows(e)) return; e.preventDefault(); e.stopPropagation();
      drag = e.pointerId; try { st.setPointerCapture(e.pointerId); } catch (err) { /* nem kritikus */ }
      st.classList.add('drag'); st.classList.remove('behind'); place(toScene(e), false);
    });
    st.addEventListener('pointermove', e => { if (e.pointerId !== drag) return; e.preventDefault(); place(toScene(e), false); });
    const end = e => { if (e.pointerId !== drag) return; drag = null; st.classList.remove('drag'); drop(nearest(toScene(e))); };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    // koppintás egy helyre: a matrica odaszáll (húzás nélkül is megoldható)
    scene.addEventListener('pointerdown', e => {
      const el = e.target.closest('.mt-slot'); if (!el || drag !== null || !penAllows(e)) return;
      e.preventDefault(); drop(slots.find(s => s.id === +el.dataset.s));
    });
    layout(); new ResizeObserver(layout).observe(wrap);
    const timer = every(() => {
      if (!scene.isConnected) { clearInterval(timer); return; }
      if (!done && !busy && performance.now() - lastAct > 10000) { lastAct = performance.now(); st.classList.remove('wig'); void st.offsetWidth; st.classList.add('wig'); }
    }, 2000);
    box.__matrica = { slot: id => scene.querySelector(`.mt-slot[data-s="${id}"]`) };
    say(item.say);
  });
}
