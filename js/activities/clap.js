// Szótagolás tapsolással: annyiszor tapsolj, ahány szótagból áll a szó.
// A megoldás nem látszik előre: a pöttyök a tapsokkal együtt jelennek meg. Minden tapsnak hangja van.
// Ha nem sikerül, Rozi előtapsolja (szótagonként egy taps), aztán újra a gyerek jön. Büntetés nincs.
import { say } from '../voice.js';
import { sleep, later } from '../scope.js';
import { clap as clapSound, unlock } from '../audio.js';
import { progress } from '../progress.js';

const COUNT = ['', 'Egy', 'Két', 'Három', 'Négy', 'Öt', 'Hat'];

// word: { t: '🐘', name: 'elefánt', parts: ['e','le','fánt'] }
export function run(container, { word }) {
  return (async () => {
    unlock();
    const n = word.parts.length;
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Tapsold el a szót! 👏</div>
        <div class="items"><span class="item" style="font-size:clamp(90px,18vw,160px)">${word.t}</span></div>
        <div class="dots" id="taps"></div>
        <button class="giant clap">👏</button>
      </div>`;
    const tapsEl = container.querySelector('#taps'), btn = container.querySelector('.clap');
    let taps = 0, timer = null, locked = true, fails = 0, finish;
    const done = new Promise(r => { finish = r; });
    const reset = () => { taps = 0; tapsEl.innerHTML = ''; };
    const addDot = () => { const d = document.createElement('span'); d.className = 'dot on'; tapsEl.appendChild(d); };

    // Rozi előtapsolja: szótagonként egy taps, közben kimondja a szótagot
    async function demo() {
      reset();
      for (const part of word.parts) {
        addDot(); clapSound(); btn.classList.add('pulse');
        await say(part, { remember: false, rate: 0.75 });
        btn.classList.remove('pulse'); await sleep(280);
      }
      await sleep(500); reset();
    }
    async function judge() {
      locked = true;
      if (taps === n) { await say(`${word.parts.join(', ')}. ${word.name}! ${COUNT[n] || n} szótag.`); finish(); return; }
      fails++;
      await say(fails === 1 ? 'Tapsoljuk el együtt, lassan!' : 'Figyeld, így tapsolom!', { remember: false });
      await demo();
      await say(`Most te jössz: ${word.name}!`, { remember: false });
      locked = false;
    }
    btn.addEventListener('click', () => {
      if (locked) return;
      taps++; addDot(); clapSound();
      clearTimeout(timer); timer = later(judge, 1400);
    });

    // Az első tapsolós feladatnál megmutatjuk, mi a szótag-tapsolás
    if (!progress.get().clapShown) {
      await say('Tapsoljuk el a szavakat! Minden kis részre egyet tapsolunk. Figyelj!', { remember: false });
      await demo(); progress.set({ clapShown: true });
      await say(`Most te jössz! Tapsold el: ${word.name}!`);
    } else await say(`Tapsold el a szót: ${word.name}!`);
    locked = false;
    await done;
    return { wrong: fails };
  })();
}
