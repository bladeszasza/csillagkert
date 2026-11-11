// Megszámlálás 1–10: hány van? Büntetés nélkül: tévedésre megszámoljuk együtt,
// 2. tévedésre eltűnik egy rossz válasz, 3.-ra a jó felragyog.
import { say } from '../voice.js';

const THINGS = ['🍎', '🌸', '🐟', '🎈', '🦋', '🍓', '🐥', '⭐'];
const NAMES = ['egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz'];

function dots(n) { return '●'.repeat(Math.min(n, 5)) + (n > 5 ? '<br>' + '●'.repeat(n - 5) : ''); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function run(container, { n = 3 }) {
  return new Promise(resolve => {
    const thing = THINGS[Math.floor(Math.random() * THINGS.length)];
    const options = new Set([n]);
    const pool = [n - 2, n - 1, n + 1, n + 2].filter(x => x >= 1 && x <= 10);
    while (options.size < 3 && pool.length) options.add(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const opts = [...options].sort((a, b) => a - b);

    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Hány van? Számold meg! 🔢</div>
        <div class="items">${Array.from({ length: n }, (_, i) => `<span class="item" data-i="${i}">${thing}</span>`).join('')}</div>
        <div class="answers">${opts.map(o => `<button class="answer" data-n="${o}">${o}<small>${dots(o)}</small></button>`).join('')}</div>
      </div>`;
    const items = [...container.querySelectorAll('.item')];
    const answers = [...container.querySelectorAll('.answer')];
    let wrong = 0, locked = false, finished = false;

    async function countAloud() {
      for (let i = 0; i < items.length; i++) {
        items[i].classList.add('pulse');
        await say(NAMES[i], { remember: false, rate: 0.8 });
        await sleep(150);
        items[i].classList.remove('pulse');
      }
    }
    items.forEach((it, i) => it.addEventListener('pointerdown', () => {
      it.classList.add('pulse'); say(NAMES[i], { remember: false }); setTimeout(() => it.classList.remove('pulse'), 400);
    }));

    answers.forEach(btn => btn.addEventListener('click', async () => {
      if (locked || finished) return;
      const val = +btn.dataset.n;
      if (val === n) {
        finished = true; btn.classList.add('win');
        await say('Igen! ' + NAMES[n - 1] + '!');
        resolve();
      } else {
        locked = true; wrong++;
        btn.classList.add('shake');
        say('Majdnem! Nézzük meg együtt.', { remember: false });
        await sleep(1700);
        await countAloud();
        if (wrong >= 2) {
          const bad = answers.filter(a => +a.dataset.n !== n && !a.classList.contains('gone'));
          if (bad.length > 1) bad[0].classList.add('gone');
        }
        if (wrong >= 3) answers.find(a => +a.dataset.n === n).classList.add('glow');
        btn.classList.remove('shake');
        locked = false;
      }
    }));
    say(`Hány ${thing === '🍎' ? 'alma' : 'darab'} van? Számold meg!`);
  });
}
