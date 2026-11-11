// Képválasztós feladat (formák, színek, hangok, világ, egészség, logika...).
// Büntetés nélkül: 1. tévedés → újra; 2. → eltűnik egy rossz válasz; 3. → a jó felragyog.
import { say } from '../voice.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// options: [{ t: '🍎', name: 'alma', ok: true }, ...]; q: opcionális nagy kérdéssor (pl. minta)
export function run(container, { prompt, say: sayText, options, q, icon = '🧠' }) {
  return new Promise(resolve => {
    const opts = shuffle(options);
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">${prompt} ${icon}</div>
        ${q ? `<div class="items"><span class="item">${q}</span></div>` : ''}
        <div class="answers">${opts.map((o, i) => `<button class="answer pic" data-i="${i}">${o.t}${o.name ? `<small>${o.name}</small>` : ''}</button>`).join('')}</div>
      </div>`;
    const btns = [...container.querySelectorAll('.answer')];
    const names = opts.map(o => o.name).filter(Boolean);
    let wrong = 0, locked = false, finished = false;

    btns.forEach((btn, i) => btn.addEventListener('click', async () => {
      if (locked || finished) return;
      const o = opts[i];
      if (o.ok) {
        finished = true; btn.classList.add('win');
        await say('Igen!' + (o.name ? ' ' + o.name + '!' : ''));
        resolve();
      } else {
        locked = true; wrong++;
        btn.classList.add('shake');
        say(wrong === 1 ? 'Majdnem! Próbáld újra!' : 'Semmi baj, gondold végig!', { remember: false });
        await sleep(900);
        btn.classList.remove('shake');
        if (wrong >= 2) {
          const bad = btns.filter((b, k) => !opts[k].ok && !b.classList.contains('gone'));
          if (bad.length > 1) bad[0].classList.add('gone');
        }
        if (wrong >= 3) btns[opts.findIndex(x => x.ok)].classList.add('glow');
        locked = false;
      }
    }));
    say(sayText || (prompt + (names.length ? ' ' + names.join(', ') + '?' : '')));
  });
}
