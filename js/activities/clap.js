// Szótagolás tapsolással: annyiszor koppints, ahány szótagból áll a szó. Túl sok koppintásnál szelíden újrakezdjük.
import { say } from '../voice.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// word: { t: '🐘', name: 'elefánt', parts: ['e','le','fánt'] }
export function run(container, { word }) {
  return new Promise(resolve => {
    const n = word.parts.length;
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Tapsold el a szót! 👏</div>
        <div class="items"><span class="item" style="font-size:clamp(90px,18vw,160px)">${word.t}</span></div>
        <div class="dots">${word.parts.map(() => '<span class="dot"></span>').join('')}</div>
        <button class="giant clap">👏</button>
      </div>`;
    const dots = [...container.querySelectorAll('.dot')];
    const btn = container.querySelector('.clap');
    let taps = 0, timer = null, locked = false;

    async function judge() {
      if (taps === n) {
        locked = true; await say(word.parts.join(' - ') + '. ' + word.name + '! Pontosan ' + n + ' szótag.'); resolve();
      } else {
        locked = true;
        say('Majdnem! Próbáljuk újra lassan.', { remember: false });
        await sleep(1700);
        taps = 0; dots.forEach(d => d.classList.remove('on')); locked = false;
        say(word.name + '. Tapsold el lassan!', { remember: false });
      }
    }
    btn.addEventListener('click', () => {
      if (locked) return;
      if (taps < n) dots[taps].classList.add('on');
      taps++;
      clearTimeout(timer); timer = setTimeout(judge, 1300);
    });
    say(`Tapsold el: ${word.name}! Hány részből áll?`);
  });
}
