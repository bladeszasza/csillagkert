// Robotpálya: programozz nyilakból! A robot sorban végrehajtja a lépéseket, és el kell érnie a csillagot.
// Az algoritmikus gondolkodás alapjai: sorrend, ismétlés (×2, ×3), akadály kikerülése, hibajavítás.
// Hibánál nem büntetünk: elmondjuk, hol akadt el, kiemeljük a hibás lépést; 2. hibánál megmutatjuk a megoldást,
// 3. hibánál a robot lassan maga "begépeli" – a gyerek csak elindítja. A programot a lépésekre koppintva lehet javítani.
import { say } from '../voice.js';
import { happy } from '../sounds.js';

const DIRS = { up: [0, -1, '⬆️', 'fel'], down: [0, 1, '⬇️', 'le'], left: [-1, 0, '⬅️', 'balra'], right: [1, 0, '➡️', 'jobbra'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// legrövidebb út (BFS) a segítséghez: [irányok]
export function solve({ w, h, start, goal, walls = [] }) {
  const wall = new Set(walls.map(([x, y]) => x + ',' + y)), seen = new Set([start.join(',')]), q = [[start[0], start[1], []]];
  while (q.length) {
    const [x, y, path] = q.shift();
    if (x === goal[0] && y === goal[1]) return path;
    for (const [k, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || wall.has(key) || seen.has(key)) continue;
      seen.add(key); q.push([nx, ny, [...path, k]]);
    }
  }
  return null;
}
// egymás utáni azonos lépések összevonása ×n tokenekké (ha az ismétlés engedélyezett)
export function compress(path, loops) {
  const out = [];
  for (const d of path) { const l = out[out.length - 1]; if (loops && l && l.dir === d && l.times < 3) l.times++; else out.push({ dir: d, times: 1 }); }
  return out;
}

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
    const gridEl = container.querySelector('.agrid'), robotEl = container.querySelector('.arobot'), progEl = container.querySelector('#aprog');
    const place = () => { robotEl.style.transform = `translate(${robot.x * (cell + 4)}px, ${robot.y * (cell + 4)}px)`; };
    const tokenHtml = (t, i, cls = '') => `<button class="atok ${cls}" data-i="${i}">${DIRS[t.dir][2]}${t.times > 1 ? `<b>×${t.times}</b>` : ''}</button>`;
    const render = (hi = -1, ghost = false) => {
      progEl.innerHTML = program.map((t, i) => tokenHtml(t, i, i === hi ? 'hi' : '')).join('') + Array.from({ length: Math.max(0, max - program.length) }, () => '<span class="aslot"></span>').join('');
    };
    robotEl.style.transition = 'transform .35s'; place(); render();

    container.querySelectorAll('.acmd[data-d]').forEach(b => b.addEventListener('click', () => {
      if (running || finished || program.length >= max) return;
      program.push({ dir: b.dataset.d, times: mult }); render(); say(DIRS[b.dataset.d][3] + (mult > 1 ? ` ${mult}-szor` : ''), { remember: false });
    }));
    container.querySelectorAll('.amul').forEach(b => b.addEventListener('click', () => { mult = +b.dataset.m; container.querySelectorAll('.amul').forEach(x => x.classList.toggle('sel', x === b)); }));
    progEl.addEventListener('click', e => { const t = e.target.closest('.atok'); if (!t || running || finished) return; program.splice(+t.dataset.i, 1); render(); });  // koppintásra kikerül a lépés (javítás)
    container.querySelector('#aclear').addEventListener('click', () => { if (running || finished) return; program = []; render(); });

    async function exec() {
      running = true; robot = { x: start[0], y: start[1] }; place(); await sleep(450);
      for (let i = 0; i < program.length; i++) {
        render(i);
        const t = program[i], [dx, dy] = DIRS[t.dir];
        for (let k = 0; k < t.times; k++) {
          const nx = robot.x + dx, ny = robot.y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || wallSet.has(nx + ',' + ny)) {          // nekiütközik: kedvesen megáll
            robotEl.classList.add('bump'); await sleep(450); robotEl.classList.remove('bump');
            return { ok: false, step: i, why: nx < 0 || ny < 0 || nx >= w || ny >= h ? 'a pálya szélén' : 'a virágoknál' };
          }
          robot.x = nx; robot.y = ny; place(); await sleep(420);
        }
      }
      render();
      return robot.x === goal[0] && robot.y === goal[1] ? { ok: true } : { ok: false, step: program.length - 1, why: 'a csillag előtt' };
    }

    container.querySelector('#arun').addEventListener('click', async () => {
      if (running || finished) return;
      if (!program.length) { say('Előbb rakd össze a programot a nyilakkal!', { remember: false }); return; }
      const res = await exec(); running = false;
      if (res.ok) { finished = true; gridEl.classList.add('win'); happy('🦄'); await say('A robot odaért a csillaghoz! Szuper programozó vagy!'); resolve(); return; }
      fails++; robot = { x: start[0], y: start[1] }; place(); render(res.step);
      if (fails === 1) say(`Majdnem! A robot elakadt ${res.why}. Nézd meg a megjelölt lépést, és javítsd ki! Koppints egy lépésre, ha ki akarod venni.`, { remember: false });
      else if (fails === 2) {
        say('Segítek! Nézd meg ezt a sort, ez vezet el a csillaghoz.', { remember: false });
        const tk = compress(solution, loops); const hint = document.createElement('div'); hint.className = 'ahint'; hint.innerHTML = '<span>Segítség:</span>' + tk.map((t, i) => tokenHtml(t, i, 'ghost')).join(''); progEl.after(hint);
      } else {
        say('Építsük meg együtt! Nézd, ahogy a robot programja elkészül, aztán nyomd meg az indítást.', { remember: false });
        program = []; render();
        for (const t of compress(solution, loops).slice(0, max)) { await sleep(700); program.push({ ...t }); render(); }
      }
    });
    say(sayText || (prefill.length ? 'Hiba van a programban! A robot nem ér el a csillaghoz. Javítsd ki, aztán nyomd meg az indítást!' : 'Rakd össze a nyilakból a programot, ami elvezeti a robotot a csillaghoz! Aztán nyomd meg az indítást.'));
  });
}
