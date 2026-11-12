// Megszámlálás 1–10: hány van? Büntetés nélkül: tévedésre megszámoljuk együtt,
// 2. tévedésre eltűnik egy rossz válasz, 3.-ra a jó felragyog.
import { say } from '../voice.js';
import { numAttr } from '../hu.js';

const THINGS = ['🍎', '🌸', '🐟', '🎈', '🦋', '🍓', '🐥', '⭐'];
const NAMES = ['egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc', 'húsz'];
const THING_NAME = { '🍎': 'alma', '🌸': 'virág', '🐟': 'hal', '🎈': 'lufi', '🦋': 'pillangó', '🍓': 'eper', '🐥': 'csibe', '⭐': 'csillag' };

// pöttyök ötös csoportokban, 20-ig (így a 11, 12, 13 is megkülönböztethető)
export function dots(n) { let s = ''; for (let i = 1; i <= n; i++) { s += '●'; if (i % 5 === 0 && i < n) s += i % 10 === 0 ? '<br>' : ' '; } return s; }
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
import { sleep } from '../scope.js';

export function run(container, { n = 3 }) {
  return new Promise(resolve => {
    const thing = THINGS[Math.floor(Math.random() * THINGS.length)];
    const options = new Set([n]);
    const pool = shuffle([n - 3, n - 2, n - 1, n + 1, n + 2, n + 3].filter(x => x >= 1 && x <= 20));
    while (options.size < 3 && pool.length) options.add(pool.pop());
    const opts = shuffle([...options]);                    // a jó válasz helye véletlen (korábban többnyire a középső volt)

    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Hány van? Számold meg! 🔢</div>
        <div class="items">${Array.from({ length: n }, (_, i) => `<span class="item${n > 10 ? ' sm' : ''}" data-i="${i}">${thing}</span>`).join('')}</div>
        <div class="answers">${opts.map(o => `<button class="answer" data-n="${o}">${o}<small>${dots(o)}</small></button>`).join('')}</div>
      </div>`;
    const items = [...container.querySelectorAll('.item')];
    const answers = [...container.querySelectorAll('.answer')];
    let wrong = 0, locked = false, finished = false;

    async function countAloud() {
      for (let i = 0; i < items.length; i++) {
        if (!container.isConnected) return;
        items[i].classList.add('pulse');
        await say(NAMES[i], { remember: false, rate: 0.8 });
        await sleep(150);
        items[i].classList.remove('pulse');
      }
      await say(`Összesen ${NAMES[items.length - 1]}.`, { remember: false });
    }
    // a gyerek maga is megszámolhatja: minden megkoppintott tárgy megkapja a következő számot (bármilyen sorrendben)
    let counted = 0;
    items.forEach(it => it.addEventListener('pointerdown', () => {
      if (locked || finished) return;
      if (!it.dataset.c) { it.dataset.c = String(++counted); it.classList.add('counted'); }
      it.classList.add('pulse'); say(NAMES[+it.dataset.c - 1], { remember: false }); setTimeout(() => it.classList.remove('pulse'), 400);
    }));

    answers.forEach(btn => btn.addEventListener('click', async () => {
      if (locked || finished) return;
      const val = +btn.dataset.n;
      if (val === n) {
        finished = true; btn.classList.add('win');
        await say(`Igen! ${numAttr(NAMES[n - 1])} ${THING_NAME[thing]} van.`);
        resolve({ wrong });
      } else {
        locked = true; wrong++;
        btn.classList.add('shake');
        items.forEach(it => { delete it.dataset.c; it.classList.remove('counted'); }); counted = 0;
        await say('Számoljuk meg együtt!', { remember: false });
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
    say(`Hány ${THING_NAME[thing]} van? Számold meg!`);
  });
}
