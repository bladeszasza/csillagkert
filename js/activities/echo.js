// Dallam-visszhang (Zenevár): a titok-harang eljátszik egy 2–5 hangos dallamot, a gyerek a harangokon visszajátssza.
// Büntetés nincs. 1. tévedés: újra szól a dallam. 2.: újra, és most a harangok is felvillannak, amikor szólnak.
// 3.: együtt játsszuk: mindig a soron következő harang ragyog. Eredmény: { wrong }.
// item: { melody: ['szo','mi','szo'], bells: ['mi','szo'] }
import { say, setRepeatHandler } from '../voice.js';
import { sleep } from '../scope.js';
import { playNote, unlock } from '../audio.js';
import { NOTES } from '../notes.js';
import { hearingCheck } from './hearing.js';

const speed = () => globalThis.__soundSpeed || 1;      // a böngészős teszt gyorsítja (a hangok ugyanazok, csak rövidebbek)

export function run(container, { melody, bells }) {
  return (async () => {
    unlock();
    await hearingCheck(container);
    container.innerHTML = `<div class="activity music"><div class="prompt">Játszd el ugyanígy! 🔔</div>
      <div class="answers"><span class="mbell mystery">🎵</span></div>
      <div class="answers bells">${bells.map(k => `<button class="answer key bell" data-k="${k}" style="background:${NOTES[k].c}"><span>🔔</span><small>${NOTES[k].name}</small></button>`).join('')}</div>
      <div class="dots" id="eprog"></div></div>`;
    const box = container.querySelector('.activity'), myst = container.querySelector('.mystery'), prog = container.querySelector('#eprog');
    const btns = [...container.querySelectorAll('.bell')], bellOf = k => btns.find(b => b.dataset.k === k);
    let locked = true, pos = 0, fails = 0, guide = false, finished = false, finish;
    const lock = v => { locked = v; box.dataset.locked = v ? '1' : '0'; };
    const done = new Promise(r => { finish = r; });
    const glowNext = () => { btns.forEach(b => b.classList.remove('glow')); if (guide && pos < melody.length) bellOf(melody[pos]).classList.add('glow'); };
    const play = async (showBells = false, slow = false) => {
      lock(true); pos = 0; prog.innerHTML = ''; btns.forEach(b => b.classList.remove('glow'));
      for (const k of melody) {
        const el = showBells ? bellOf(k) : myst;
        el.classList.add('playing');
        await playNote(NOTES[k].f, { dur: (slow ? 0.9 : 0.65) / speed(), inst: 'piano' });
        el.classList.remove('playing'); await sleep((slow ? 260 : 130) / speed());
      }
      lock(false); glowNext();
    };
    setRepeatHandler(() => { if (!locked && !finished) play(fails >= 2, guide); });

    btns.forEach(b => b.addEventListener('click', async () => {
      if (locked || finished) return;
      const k = b.dataset.k;
      playNote(NOTES[k].f, { dur: 0.5 / speed(), inst: 'piano' });
      b.classList.add('playing'); setTimeout(() => b.classList.remove('playing'), 300);
      if (k === melody[pos]) {
        pos++; const d = document.createElement('span'); d.className = 'dot on'; prog.appendChild(d); glowNext();
        if (pos === melody.length) {
          finished = true; lock(true); setRepeatHandler(null); await sleep(450 / speed());
          await say(`Igen! Pont így szólt: ${melody.map(n => NOTES[n].name).join(', ')}.`); finish(); return;
        }
        return;
      }
      fails++; lock(true); b.classList.add('shake'); await sleep(400 / speed()); b.classList.remove('shake');
      if (fails === 1) { await say('Hallgasd meg újra!', { remember: false }); await play(); }
      else if (fails === 2) { await say('Figyeld a harangokat is! Ezek szólnak, sorban.', { remember: false }); await play(true); }
      else { guide = true; await say('Játsszuk együtt! Mindig a ragyogó harangra koppints.', { remember: false }); await play(true, true); }
    }));

    await say(melody.length <= 2 ? 'Figyeld a két hangot, aztán játszd el a harangokon!' : 'Figyeld a dallamot, aztán játszd el a harangokon!');
    await sleep(200 / speed());
    await play();
    await done;
    return { wrong: fails };
  })();
}
