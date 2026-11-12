// Hallás-próba a hangos feladatok előtt (laponként egyszer): "Hallod a csengőt?"
// Ha a gyerek nem hallja, egy felnőttnek szólunk (hangerő, néma mód), aztán megy tovább. A választ megjegyezzük.
// Közös lejátszó is: a feladat hangsora egymás után, ütemezés nélkül szól, így megszakításkor (X) azonnal elhallgat.
import { say, setRepeatHandler } from '../voice.js';
import { playNote, clap, unlock } from '../audio.js';
import { sleep } from '../scope.js';
import { progress } from '../progress.js';
import { NOTES } from '../notes.js';

let checked = false;
const speed = () => globalThis.__soundSpeed || 1;      // a böngészős teszt gyorsítja (a hangok ugyanazok, csak rövidebbek)
export const resetHearing = () => { checked = false; };

export async function hearingCheck(container) {
  if (checked) return; checked = true;
  unlock();
  container.innerHTML = `<div class="activity music"><div class="prompt">Hallod a csengőt? 👂</div>
    <div class="answers"><div class="answer key bell big" id="hb" style="background:#8e5be8"><span>🔔</span></div></div>
    <div class="answers"><button class="answer pic" data-h="1" aria-label="hallom">👍</button><button class="answer pic" data-h="0" aria-label="nem hallom">🙉</button></div>
    <div class="hearhelp" id="hearhelp" hidden>🔊⬆️ &nbsp; 🔕❌<small>Szülőknek: hangosítsd fel az iPadet, és kapcsold ki a néma módot (Vezérlőközpont → harang).</small><button class="answer pic" id="hgo" aria-label="tovább">▶</button></div></div>`;
  const hb = container.querySelector('#hb');
  const play = async () => { hb.classList.add('playing'); await playNote(784, { inst: 'bell', dur: 0.9 }); await sleep(150); await playNote(1047, { inst: 'bell', dur: 0.9 }); hb.classList.remove('playing'); };
  setRepeatHandler(play);
  await say('Hallod a csengőt? Ha hallod, koppints a felfelé mutató hüvelykujjra!', { remember: false });
  play();
  const heard = await new Promise(done => container.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => done(b.dataset.h === '1'), { once: true })));
  progress.set({ heardBell: heard });
  if (!heard) {
    container.querySelector('#hearhelp').hidden = false;
    await say('Semmi baj! Kérj meg egy felnőttet, hogy hangosítsa fel. Ha kész, koppints a nyílra!', { remember: false });
    await new Promise(done => container.querySelector('#hgo').addEventListener('click', done, { once: true }));
  }
  setRepeatHandler(null);
}

// Egy hangsor lejátszása: { n (hangnév) | f, dur, vol, inst, gap, clap, hi } elemek egymás után.
// hi: a megszólaló elem kulcsa (válaszgomb data-k), különben a feladat titok-harangja (.mystery) lüktet.
export async function playEvents(container, events = []) {
  for (const ev of events) {
    const el = ev.hi ? container.querySelector(`[data-k="${CSS.escape(ev.hi)}"]`) : container.querySelector('.mystery');
    el?.classList.add('playing');
    const k = speed();
    if (ev.rest) await sleep((ev.dur ?? 0.6) * 1000 / k);
    else if (ev.clap) { clap({ vol: ev.vol ?? 0.9 }); await sleep((ev.dur ?? 0.3) * 1000 / k); }
    else await playNote(ev.f ?? NOTES[ev.n].f, { dur: (ev.dur ?? 0.8) / k, vol: ev.vol ?? 0.8, inst: ev.inst || 'piano' });
    el?.classList.remove('playing');
    if (ev.gap) await sleep(ev.gap * 1000 / k);
  }
}
