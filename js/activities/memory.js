// Memóriajáték: keresd meg a párokat. Nincs lépésszámlálás, nincs időkorlát.
// A generált feladat témás paklit ad ({ deck: [{ e, n }] }): felfordításkor Rozi kimondja a kártya nevét (szókincs),
// és a párnál azt is, mit talált ("Pár: két alma!").
import { say } from '../voice.js';
import { sleep } from '../scope.js';

const POOL = ['🍎', '🐱', '🌸', '🚗', '🐟', '🎈', '🦋', '🍓', '🐥', '⭐', '🌈', '🍄'].map(e => ({ e, n: '' }));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function run(container, { pairs = 3, deck: given }) {
  return new Promise(resolve => {
    const faces = given ? given.slice(0, pairs) : shuffle(POOL).slice(0, pairs);
    const deck = shuffle([...faces, ...faces]);
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Keresd meg a párokat! 🧩</div>
        <div class="cards">${deck.map((f, i) => `<button class="mcard" data-i="${i}" data-e="${f.e}"${f.n ? ` aria-label="${f.n}"` : ''}><span class="back">❓</span><span class="face">${f.e}</span></button>`).join('')}</div>
      </div>`;
    const cards = [...container.querySelectorAll('.mcard')];
    let open = [], busy = false, found = 0;
    cards.forEach((c, i) => c.addEventListener('click', async () => {
      if (busy || c.classList.contains('up') || c.classList.contains('matched')) return;
      c.classList.add('up'); open.push(i);
      if (deck[i].n) say(deck[i].n, { remember: false });
      if (open.length < 2) return;
      busy = true;
      const [a, b] = open; open = [];
      await sleep(900);
      if (deck[a].e === deck[b].e) {
        cards[a].classList.add('matched'); cards[b].classList.add('matched'); found++;
        if (found === pairs) { await say('Megtaláltad az összes párt!'); resolve({ wrong: 0 }); return; }
        say(deck[a].n ? `Pár: két ${deck[a].n}!` : 'Pár!', { remember: false });
      } else { cards[a].classList.remove('up'); cards[b].classList.remove('up'); }
      busy = false;
    }));
    say('Fordíts fel két kártyát. Keresd meg, melyik pár egyforma!');
  });
}
