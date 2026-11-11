// Memóriajáték: keresd meg a párokat. Nincs lépésszámlálás, nincs időkorlát.
import { say } from '../voice.js';

const POOL = ['🍎', '🐱', '🌸', '🚗', '🐟', '🎈', '🦋', '🍓', '🐥', '⭐', '🌈', '🍄'];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function run(container, { pairs = 3 }) {
  return new Promise(resolve => {
    const faces = shuffle(POOL).slice(0, pairs);
    const deck = shuffle([...faces, ...faces]);
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Keresd meg a párokat! 🧩</div>
        <div class="cards">${deck.map((f, i) => `<button class="mcard" data-i="${i}"><span class="back">❓</span><span class="face">${f}</span></button>`).join('')}</div>
      </div>`;
    const cards = [...container.querySelectorAll('.mcard')];
    let open = [], busy = false, found = 0;
    cards.forEach((c, i) => c.addEventListener('click', async () => {
      if (busy || c.classList.contains('up') || c.classList.contains('matched')) return;
      c.classList.add('up'); open.push(i);
      if (open.length < 2) return;
      busy = true;
      const [a, b] = open; open = [];
      await sleep(900);
      if (deck[a] === deck[b]) {
        cards[a].classList.add('matched'); cards[b].classList.add('matched'); found++;
        if (found === pairs) { await say('Megtaláltad az összes párt!'); resolve(); return; }
        say('Pár!', { remember: false });
      } else { cards[a].classList.remove('up'); cards[b].classList.remove('up'); }
      busy = false;
    }));
    say('Fordíts fel két kártyát. Keresd meg, melyik pár egyforma!');
  });
}
