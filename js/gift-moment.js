// Ajándék-pillanat: ugyanaz a rövid, ünnepi jelenet minden ajándéknál (bármelyik játék adta, vagy minden 20. csillag).
// Egy becsomagolt doboz megremeg és kinyílik, kiugrik belőle az ajándék, Rozi egy mondatban elmondja, mi az
// (a csillagokat nem számolja), aztán az ajándék a „következő ajándék" jelhez repül. Koppintásra azonnal továbbmegy.
// 2D réteg, nem 3D jelenet: így nem nyílik harmadik 3D-vászon a játék és a kert mellé (README: „Ajándékok és szívek").
// Játék közben a réteg átengedi az érintést (a játék megy tovább), csak maga a doboz fogad koppintást.
import { say, onSpeaking } from './voice.js';
import { play } from './sounds.js';
import { giftLine } from './economy.js';
export { giftLine };

const SHOW_MS = 3600;                 // ennyi ideig látszik legalább (ha a gyerek nem koppint)
const WAIT_TALK = 3000;               // ha Rozi épp beszél, legfeljebb ennyit vár a mondatával
const MAX_MS = 9000;                  // ennél tovább semmiképp nem marad fent

let talking = false;
onSpeaking(on => { talking = on; });

// Saját rajz: becsomagolt ajándékdoboz (a fedele külön csoport, mert az repül le)
export const BOX_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true"><g class="gm-body"><rect x="30" y="92" width="140" height="94" rx="12" fill="#ff8fc8" stroke="#c53b6e" stroke-width="5"/><rect x="88" y="92" width="24" height="94" fill="#ffd24d"/><circle cx="58" cy="128" r="6" fill="#fff" opacity=".7"/><circle cx="142" cy="156" r="5" fill="#fff" opacity=".7"/></g><g class="gm-lid"><rect x="20" y="64" width="160" height="34" rx="9" fill="#ff5d8f" stroke="#c53b6e" stroke-width="5"/><rect x="88" y="64" width="24" height="34" fill="#ffd24d"/><path d="M100 64 C72 22 46 36 66 60Z M100 64 C128 22 154 36 134 60Z" fill="#ffd24d" stroke="#e0a400" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="62" r="9" fill="#ffbf1f" stroke="#e0a400" stroke-width="4"/></g></svg>`;

let layer = null, current = null;
const queue = [];
export const giftBusy = () => !!current || queue.length > 0;

// Egy ajándék megmutatása. Akkor teljesül, amikor a jelenet eltűnt (és Rozi mondata véget ért, ha nem koppintott tovább).
export function showGift(g, { name = '', target = null } = {}) {
  if (!g) return Promise.resolve(false);
  return new Promise(resolve => { queue.push({ g, name, target, resolve }); if (!current) next(); });
}

// Azonnali lebontás (a jutalomkör vége, kilépés): semmi nem marad a képernyőn, a várakozók továbbmennek
export function clearGifts() {
  queue.splice(0).forEach(q => q.resolve(false));
  if (current) finish(true);
}

async function itemHtml(g) {
  if (g.kind === 'dress') {
    try {                                                    // a saját unikornis, rajta az új ruhadarab (az öltöztető rajzolja)
      const { preview } = await import('./rewards/dressup.js');
      return `<img class="gm-uni" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview(g.id))}">`;
    } catch (e) {}
  }
  return `<span class="gm-ic">${g.icon}</span>`;
}

function next() {
  const job = queue.shift();
  if (!job) { current = null; return; }
  current = { ...job, timers: [], done: false };
  const me = current;
  const inGame = !!document.getElementById('game') && !document.getElementById('game').hidden;
  layer?.remove();
  layer = document.createElement('div');
  layer.id = 'gift-moment'; layer.className = inGame ? 'passthru' : '';
  layer.setAttribute('aria-label', 'Ajándék');
  layer.innerHTML = `<div class="gm-card"><div class="gm-glow"></div><div class="gm-box">${BOX_SVG}</div><div class="gm-item"></div><div class="gm-sparks">${'<i>★</i>'.repeat(10)}</div><small class="gm-name"></small></div>`;
  layer.querySelector('.gm-name').textContent = job.g.nom;
  document.body.appendChild(layer);
  const t0 = performance.now();
  const later = (fn, ms) => me.timers.push(setTimeout(() => { if (!me.done) fn(); }, ms));
  itemHtml(job.g).then(html => { if (!me.done) layer.querySelector('.gm-item').innerHTML = html; });
  requestAnimationFrame(() => { if (!me.done) layer.classList.add('in'); });
  later(() => { layer.classList.add('open'); play('magic'); }, 650);
  later(() => play('yay'), 1050);
  // Rozi egy mondata: ha épp beszél (pl. „Nyertél!"), megvárja, de legfeljebb WAIT_TALK-ot
  let spoken = false;
  const speak = () => {
    if (me.done) return;
    say(giftLine(job.g, job.name), { remember: false }).then(() => { spoken = true; maybeEnd(); });
  };
  (function waitQuiet() { if (me.done) return; if (!talking || performance.now() - t0 > WAIT_TALK) later(speak, 250); else later(waitQuiet, 120); })();
  const maybeEnd = () => { if (!me.done && spoken && performance.now() - t0 >= SHOW_MS) finish(false); };
  later(maybeEnd, SHOW_MS);
  later(() => finish(false), MAX_MS);
  layer.querySelector('.gm-card').addEventListener('pointerdown', e => { e.stopPropagation(); if (performance.now() - t0 > 500) finish(false); });
  if (!inGame) layer.addEventListener('pointerdown', () => { if (performance.now() - t0 > 500) finish(false); });
}

// Vége: az ajándék a „következő ajándék" jelhez repül (ha az látszik), a réteg elhalványul
function finish(instant) {
  const me = current; if (!me || me.done) return;
  me.done = true; me.timers.forEach(clearTimeout);
  const el = layer; layer = null;
  const drop = () => { el?.remove(); };
  if (instant || !el) drop();
  else {
    const item = el.querySelector('.gm-item'), tg = me.target || document.getElementById('gift-next');
    const r = tg && tg.offsetParent !== null && !tg.closest('[hidden]') ? tg.getBoundingClientRect() : null;
    if (item && r && r.width) {
      const ir = item.getBoundingClientRect();
      const dx = r.left + r.width / 2 - (ir.left + ir.width / 2), dy = r.top + r.height / 2 - (ir.top + ir.height / 2);
      item.style.transition = 'transform .5s cubic-bezier(.5,-.2,.6,1)';
      item.style.transform = `translate(calc(-50% + ${dx}px), calc(-62% + ${dy}px)) scale(.16)`;
    }
    el.classList.add('out');
    setTimeout(drop, 520);
  }
  current = null;
  me.resolve(true);
  next();
}

// Egy jó tett szíve: kis szív száll fel a képernyő tetején (beszéd nélkül)
export function floatHeart(from = null) {
  const h = document.createElement('div');
  h.className = 'heart-float'; h.textContent = '❤';
  const x = from ? from.x : window.innerWidth - 150, y = from ? from.y : 110;
  h.style.left = x + 'px'; h.style.top = y + 'px';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1300);
}
