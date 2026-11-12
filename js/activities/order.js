// Sorrendezés: koppints a képekre a helyes sorrendben (kézmosás lépései, napszakok, növekedés...).
import { say } from '../voice.js';

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
import { sleep } from '../scope.js';

// steps: helyes sorrendben [{ t, name }]
export function run(container, { prompt, say: sayText, steps, icon = '🔢', fact }) {
  return new Promise(resolve => {
    let order = shuffle(steps);
    if (order.every((s, i) => s === steps[i])) order = order.reverse();
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">${prompt} ${icon}</div>
        <div class="answers">${order.map((s, i) => `<button class="answer pic" data-i="${i}">${s.t}${s.name ? `<small>${s.name}</small>` : ''}<b class="badge"></b></button>`).join('')}</div>
      </div>`;
    const btns = [...container.querySelectorAll('.answer')];
    let next = 0, wrong = 0, total = 0, locked = false;
    const refreshHint = () => { btns.forEach(b => b.classList.remove('glow')); if (wrong >= 3) btns.find((b, i) => order[i] === steps[next] && !b.classList.contains('done'))?.classList.add('glow'); };

    btns.forEach((btn, i) => btn.addEventListener('click', async () => {
      if (locked || btn.classList.contains('done')) return;
      if (order[i] === steps[next]) {
        btn.classList.add('done'); btn.querySelector('.badge').textContent = String(next + 1);
        next++; wrong = 0; refreshHint();
        if (next === steps.length) { locked = true; await say(fact || ('Pontosan így van! ' + steps.map(s => s.name || s.t).join(', ') + '.')); resolve({ wrong: total }); }
        else say(order[i].name || order[i].t, { remember: false });
      } else {
        locked = true; wrong++; total++; btn.classList.add('shake');
        const nm = order[i].name || '';
        await say(`${nm ? nm[0].toUpperCase() + nm.slice(1) + '. ' : ''}Ez később jön. Mi van előbb?`, { remember: false });
        btn.classList.remove('shake'); locked = false; refreshHint();
      }
    }));
    // bemutatás: a kérdés után sorban megnevezzük a kártyákat (a gyerek nem olvas)
    (async () => {
      locked = true;
      await say(sayText || prompt);
      for (let i = 0; i < btns.length; i++) { if (!order[i].name) continue; btns[i].classList.add('glow'); await say(order[i].name, { remember: false }); btns[i].classList.remove('glow'); }
      locked = false;
    })();
  });
}
