// Összeadás és kivonás 20-ig, képekkel. Tévedésnél nem csak "rossz": közösen megszámoljuk
// (összeadásnál a két csoportot, kivonásnál elvesszük a megadott darabot, és megszámoljuk a maradékot).
import { say } from '../voice.js';

export const NUMS = ['nulla', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc', 'húsz'];
const THINGS = ['🍎', '🌸', '🍓', '🎈', '🐥', '⭐', '🦋', '🍪'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[Math.floor(Math.random() * a.length)];

export function run(container, { a, b, op }) {
  return new Promise(resolve => {
    const add = op === '+';
    const result = add ? a + b : a - b;
    const thing = rnd(THINGS);
    const options = new Set([result]);
    for (const d of [1, -1, 2, -2, 3]) { const v = result + d; if (v >= 0 && v <= 20 && options.size < 3) options.add(v); }
    const opts = [...options].sort((x, y) => x - y);
    const size = a + (add ? b : 0) > 10 ? 'sm' : '';
    const items = (n, cls = '') => Array.from({ length: n }, () => `<span class="item ${size} ${cls}">${thing}</span>`).join('');

    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Mennyi ${a} ${add ? '+' : '−'} ${b}? ➕</div>
        <div class="mathrow">
          ${add
            ? `<div class="grp" id="g1">${items(a)}</div><div class="sign">+</div><div class="grp" id="g2">${items(b)}</div>`
            : `<div class="grp" id="g1">${items(a)}</div><div class="sign">−&nbsp;${b}</div>`}
        </div>
        <div class="answers">${opts.map(o => `<button class="answer" data-n="${o}">${o}</button>`).join('')}</div>
      </div>`;
    const answers = [...container.querySelectorAll('.answer')];
    const all = () => [...container.querySelectorAll('.item')];
    let wrong = 0, locked = false, finished = false;
    const question = add ? `Mennyi ${NUMS[a]} meg ${NUMS[b]}? Számold össze!` : `Van ${NUMS[a]}. Elveszünk ${NUMS[b]}-t. Mennyi marad?`;

    async function teach() {
      const items = all();
      if (add) {
        await say(`Nézzük meg együtt! Van ${NUMS[a]}, és jön még ${NUMS[b]}. Számoljuk meg mindet!`, { remember: false });
        for (let i = 0; i < items.length; i++) { items[i].classList.add('pulse'); await say(NUMS[i + 1], { remember: false, rate: 0.8 }); await sleep(120); items[i].classList.remove('pulse'); }
        await say(`Összesen ${NUMS[result]}.`, { remember: false });
      } else {
        await say(`Nézzük meg együtt! Van ${NUMS[a]}. Elveszünk ${NUMS[b]}-t.`, { remember: false });
        for (let i = 0; i < b; i++) { const it = items[a - 1 - i]; it.classList.add('gone'); await say(`elvesz`, { remember: false, rate: 0.9 }); await sleep(100); }
        const left = items.slice(0, result);
        await say('Számoljuk meg, mennyi maradt!', { remember: false });
        for (let i = 0; i < left.length; i++) { left[i].classList.add('pulse'); await say(NUMS[i + 1], { remember: false, rate: 0.8 }); await sleep(120); left[i].classList.remove('pulse'); }
        await say(`Maradt ${NUMS[result]}.`, { remember: false });
      }
      // visszaállítjuk a képet a következő próbálkozáshoz
      items.forEach(i => i.classList.remove('gone', 'pulse'));
    }

    answers.forEach(btn => btn.addEventListener('click', async () => {
      if (locked || finished) return;
      const val = +btn.dataset.n;
      if (val === result) {
        finished = true; btn.classList.add('win');
        await say(`Igen! ${NUMS[a]} ${add ? 'meg' : 'mínusz'} ${NUMS[b]} egyenlő ${NUMS[result]}!`);
        resolve();
      } else {
        locked = true; wrong++; btn.classList.add('shake');
        await sleep(700); btn.classList.remove('shake');
        await teach();
        if (wrong >= 2) { const bad = answers.filter(x => +x.dataset.n !== result && !x.classList.contains('gone')); if (bad.length > 1) bad[0].classList.add('gone'); }
        if (wrong >= 3) answers.find(x => +x.dataset.n === result).classList.add('glow');
        say(question, { remember: false });
        locked = false;
      }
    }));
    say(question);
  });
}
