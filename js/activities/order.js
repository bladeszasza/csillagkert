// Sorrendezés: koppints a képekre a helyes sorrendben (kézmosás lépései, napszakok, növekedés...).
import { say } from '../voice.js';

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// steps: helyes sorrendben [{ t, name }]
export function run(container, { prompt, say: sayText, steps, icon = '🔢' }) {
  return new Promise(resolve => {
    let order = shuffle(steps);
    if (order.every((s, i) => s === steps[i])) order = order.reverse();
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">${prompt} ${icon}</div>
        <div class="answers">${order.map((s, i) => `<button class="answer pic" data-i="${i}">${s.t}<small>${s.name}</small><b class="badge"></b></button>`).join('')}</div>
      </div>`;
    const btns = [...container.querySelectorAll('.answer')];
    let next = 0, wrong = 0, locked = false;
    const refreshHint = () => { btns.forEach(b => b.classList.remove('glow')); if (wrong >= 3) btns.find((b, i) => order[i] === steps[next] && !b.classList.contains('done'))?.classList.add('glow'); };

    btns.forEach((btn, i) => btn.addEventListener('click', async () => {
      if (locked || btn.classList.contains('done')) return;
      if (order[i] === steps[next]) {
        btn.classList.add('done'); btn.querySelector('.badge').textContent = String(next + 1);
        next++; wrong = 0; refreshHint();
        if (next === steps.length) { locked = true; await say('Pontosan így van! Ügyes!'); resolve(); }
        else say(order[i].name, { remember: false });
      } else {
        locked = true; wrong++; btn.classList.add('shake');
        say('Majdnem! Gondold végig, mi jön most?', { remember: false });
        await sleep(900); btn.classList.remove('shake'); locked = false; refreshHint();
      }
    }));
    say(sayText || prompt);
  });
}
