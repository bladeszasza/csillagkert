// Robotpálya: programozz nyilakból! A robot sorban végrehajtja a lépéseket, és el kell érnie a csillagot.
// Az algoritmikus gondolkodás alapjai: sorrend, ismétlés (×2, ×3), akadály kikerülése, hibajavítás.
// Hibánál nem büntetünk: elmondjuk, hol akadt el, kiemeljük a hibás lépést; 2. hibánál megmutatjuk a megoldást,
// 3. hibánál a robot lassan maga "begépeli" – a gyerek csak elindítja. A programot a lépésekre koppintva lehet javítani.
// A segítség a robot-path.js legegyszerűbb programja (ugyanaz, amit a tesztek ellenőriznek). A .activity data-locked jelzi,
// mikor fut a robot (a böngészős teszt ehhez igazodik); a várakozásokat a teszt gyorsíthatja (__soundSpeed).
import { say } from '../voice.js';
import { happy } from '../sounds.js';
import { sleep } from '../scope.js';
import { DIRS, solve, compress } from '../robot-path.js';
export { solve, compress };

const speed = () => globalThis.__soundSpeed || 1;
const wait = ms => sleep(ms / speed());

export function run(container, level) {
  const { w, h, start, goal, walls = [], loops = false, max = 8, prefill = [], say: sayText } = level;
  return new Promise(resolve => {
    const wallSet = new Set(walls.map(([x, y]) => x + ',' + y));
    const solution = solve(level) || [];
    let program = prefill.map(d => ({ dir: d, times: 1 }));
    let mult = 1, fails = 0, running = false, finished = false, robot = { x: start[0], y: start[1] };
    const cell = Math.floor(Math.min(86, 560 / Math.max(w, h * 1.4)));

    container.innerHTML = `
      <div class="activity algo">
        <div class="prompt">${prefill.length ? 'Javítsd ki a programot! 🛠️' : 'Vezesd a robotot a csillaghoz! 🤖'}</div>
        <div class="agrid" style="grid-template-columns:repeat(${w}, ${cell}px)">${Array.from({ length: w * h }, (_, i) => { const x = i % w, y = (i / w) | 0; const isW = wallSet.has(x + ',' + y), g = goal[0] === x && goal[1] === y; return `<div class="acell${isW ? ' wall' : ''}" data-x="${x}" data-y="${y}" style="width:${cell}px;height:${cell}px;font-size:${cell * 0.62}px">${isW ? '🌸' : g ? '⭐' : ''}</div>`; }).join('')}<div class="arobot" style="width:${cell}px;height:${cell}px;font-size:${cell * 0.7}px">🤖</div></div>
        <div class="aprog" id="aprog"></div>
        <div class="apal">
          ${Object.entries(DIRS).map(([k, d]) => `<button class="acmd" data-d="${k}" aria-label="${d[3]}">${d[2]}</button>`).join('')}
          ${loops ? `<span class="amult"><button class="amul sel" data-m="1">×1</button><button class="amul" data-m="2">×2</button><button class="amul" data-m="3">×3</button></span>` : ''}
          <button class="acmd small" id="aclear" aria-label="Törlés">🗑️</button>
          <button class="giant arun" id="arun">▶️ Indítás</button>
        </div>
      </div>`;
    const gridEl = container.querySelector('.agrid'), robotEl = container.querySelector('.arobot'), progEl = container.querySelector('#aprog'), box = container.querySelector('.activity');
    const lock = v => { box.dataset.locked = v ? '1' : '0'; };
    lock(false);
    const place = () => { robotEl.style.transform = `translate(${robot.x * (cell + 4)}px, ${robot.y * (cell + 4)}px)`; };
    const tokenHtml = (t, i, cls = '') => `<button class="atok ${cls}" data-i="${i}">${DIRS[t.dir][2]}${t.times > 1 ? `<b>×${t.times}</b>` : ''}</button>`;
    const render = (hi = -1, ghost = false) => {
      progEl.innerHTML = program.map((t, i) => tokenHtml(t, i, i === hi ? 'hi' : '')).join('') + Array.from({ length: Math.max(0, max - program.length) }, () => '<span class="aslot"></span>').join('');
    };
    robotEl.style.transition = 'transform .35s'; place(); render();

    container.querySelectorAll('.acmd[data-d]').forEach(b => b.addEventListener('click', () => {
      if (running || finished || program.length >= max) return;
      program.push({ dir: b.dataset.d, times: mult }); render(); say(DIRS[b.dataset.d][3] + (mult > 1 ? ' ' + ['', '', 'kétszer', 'háromszor'][mult] : ''), { remember: false });
    }));
    container.querySelectorAll('.amul').forEach(b => b.addEventListener('click', () => { mult = +b.dataset.m; container.querySelectorAll('.amul').forEach(x => x.classList.toggle('sel', x === b)); }));
    progEl.addEventListener('click', e => { const t = e.target.closest('.atok'); if (!t || running || finished) return; program.splice(+t.dataset.i, 1); render(); });  // koppintásra kikerül a lépés (javítás)
    container.querySelector('#aclear').addEventListener('click', () => { if (running || finished) return; program = []; render(); });

    async function exec() {
      running = true; lock(true); robot = { x: start[0], y: start[1] }; place(); await wait(450);
      for (let i = 0; i < program.length; i++) {
        if (!container.isConnected) return { ok: null };
        render(i);
        const t = program[i], [dx, dy] = DIRS[t.dir];
        for (let k = 0; k < t.times; k++) {
          const nx = robot.x + dx, ny = robot.y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || wallSet.has(nx + ',' + ny)) {          // nekiütközik: kedvesen megáll
            robotEl.classList.add('bump'); await wait(450); robotEl.classList.remove('bump');
            return { ok: false, step: i, why: nx < 0 || ny < 0 || nx >= w || ny >= h ? 'a pálya szélén' : 'a virágoknál' };
          }
          robot.x = nx; robot.y = ny; place(); await wait(420);
        }
      }
      render();
      return robot.x === goal[0] && robot.y === goal[1] ? { ok: true } : { ok: false, step: program.length - 1, why: 'short' };
    }

    container.querySelector('#arun').addEventListener('click', async () => {
      if (running || finished) return;
      if (!program.length) { say('Előbb rakd össze a programot a nyilakkal!', { remember: false }); return; }
      const res = await exec();
      if (res.ok === null) return;
      if (res.ok) { finished = true; gridEl.classList.add('win'); happy('🦄'); await say('A robot odaért a csillaghoz! Szuper programozó vagy!'); resolve({ wrong: fails }); return; }
      // ütközésnél az ütköző lépés kap jelet; ha a robot csak megállt a csillag előtt, nincs hibás lépés, nem jelölünk meg semmit
      fails++; robot = { x: start[0], y: start[1] }; place(); render(res.why === 'short' ? -1 : res.step);
      if (fails === 1) say(res.why === 'short' ? 'Majdnem! A robot megállt, de nem ért el a csillagig. Nézd meg, merre kell még mennie!'
        : `Majdnem! A robot elakadt ${res.why}. Nézd meg a megjelölt lépést, és javítsd ki! Koppints egy lépésre, ha ki akarod venni.`, { remember: false });
      else if (fails === 2) {
        say('Segítek! Nézd meg ezt a sort, ez vezet el a csillaghoz.', { remember: false });
        const tk = compress(solution, loops); const hint = document.createElement('div'); hint.className = 'ahint'; hint.innerHTML = '<span>Segítség:</span>' + tk.map((t, i) => tokenHtml(t, i, 'ghost')).join(''); progEl.after(hint);
      } else {
        say('Építsük meg együtt! Nézd, ahogy a robot programja elkészül, aztán nyomd meg az indítást.', { remember: false });
        program = []; render();
        for (const t of compress(solution, loops).slice(0, max)) { await wait(700); if (!container.isConnected) return; program.push({ ...t }); render(); }
      }
      running = false; lock(false);
    });
    say(sayText || (prefill.length ? 'Hiba van a programban! A robot nem jut el a csillagig. Javítsd ki, aztán nyomd meg az indítást!' : 'Rakd össze a nyilakból a programot, ami elvezeti a robotot a csillaghoz! Aztán nyomd meg az indítást.'));
  });
}
