// Buborékpukkasztás: koppintásra kipukkannak. Minden színnek saját hangja van (pentaton skála),
// a buborék mérete adja a hang erejét és mélységét: nagy buborék = hangosabb, mélyebb "bumm".
// Nincs pont, nincs büntetés.
// 2. kör: a buborék alakja az öltöztető "játék" fülén választható (kerek, szív, csillag), és ha van varázspor a
// tarisznyában, a gombjával szivárványos buborékeső indul (egy varázspor egy eső; előnyt nem ad, csak öröm).
import { unlock as unlockAudio, ding } from '../audio.js';
import { treatButton } from './treat-button.js';
import { say } from '../voice.js';
const COLORS = [
  { c: '#ff8fc8', f: 523.25 },  // C
  { c: '#7fe0c0', f: 587.33 },  // D
  { c: '#ffcf3f', f: 659.25 },  // E
  { c: '#9bb8ff', f: 783.99 },  // G
  { c: '#c9a0ff', f: 880.0 },   // A
];

const GIFT_AT = 15;                       // ennyi pukkantás után jön az ajándék (jutalomkörönként egy)

export function run(container, gameCtx = {}) {
  container.innerHTML = '<canvas></canvas>';
  const shape = ['hearts', 'stars'].includes(gameCtx.avatar?.bubble) ? gameCtx.avatar.bubble : 'round';
  const canvas = container.querySelector('canvas'), ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0;
  const bubbles = [], pops = [];
  let popped = 0;

  function size() { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size();
  window.addEventListener('resize', size);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(canvas);

  // Szín = hangmagasság, méret = hangerő (és kicsit mélyebb hang). A kicsi buborék halk és vékony.
  function chime(b) {
    const big = (b.r - 36) / 44;                          // 0 (kicsi) .. 1 (nagy)
    ding(COLORS[b.ci].f * (1.15 - 0.35 * big), { dur: 0.4 + 0.4 * big, vol: 0.3 + 0.6 * big, glide: 1.5 });
  }
  const unlock = () => unlockAudio();
  canvas.addEventListener('pointerdown', unlock); canvas.addEventListener('pointerup', unlock);

  function spawn(magic = false) { bubbles.push({ x: 60 + Math.random() * Math.max(10, w - 120), y: h + 80, r: magic ? 28 + Math.random() * 30 : 36 + Math.random() * 44, vy: magic ? 110 + Math.random() * 80 : 40 + Math.random() * 60, ci: magic ? (rainI++ % COLORS.length) : (Math.random() * COLORS.length) | 0, ph: Math.random() * 6, rb: magic }); }
  // a buborék körvonala: kör, szív vagy csillag (a középpontja és a sugara ugyanaz, így a koppintás is ugyanúgy talál)
  function outline(b) {
    ctx.beginPath();
    if (shape === 'hearts') { const s = b.r / 16; ctx.moveTo(b.x, b.y + 14 * s); ctx.bezierCurveTo(b.x - 22 * s, b.y, b.x - 16 * s, b.y - 20 * s, b.x, b.y - 9 * s); ctx.bezierCurveTo(b.x + 16 * s, b.y - 20 * s, b.x + 22 * s, b.y, b.x, b.y + 14 * s); }
    else if (shape === 'stars') for (let k = 0; k < 10; k++) { const rr = k % 2 ? b.r * 0.55 : b.r * 1.1, a = -Math.PI / 2 + k * Math.PI / 5 + Math.sin(b.ph) * 0.1; ctx[k ? 'lineTo' : 'moveTo'](b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr); }
    else ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.closePath();
  }
  // varázspor: szivárványos buborékeső és hulló csillámpor néhány másodpercig
  let rainI = 0, rainT = 0, rainAcc = 0;
  const dust = [];
  const RAIN_S = 7;
  const btn = treatButton(container, 'varazspor', gameCtx, () => {
    rainT = RAIN_S; unlockAudio(); [0, 1, 2, 3, 4].forEach(i => setTimeout(() => ding(COLORS[i].f, { dur: 0.35, vol: 0.4 }), i * 110));
    say('Varázspor! Szivárványos buborékeső!', { remember: false });
  });
  function pop(i) {
    const b = bubbles[i]; pops.push({ x: b.x, y: b.y, r: b.r, t: 0, c: COLORS[b.ci].c }); bubbles.splice(i, 1); chime(b);
    if (++popped === GIFT_AT) gameCtx.gift?.();
  }
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if ((b.x - x) ** 2 + (b.y - y) ** 2 < (b.r + 14) ** 2) { pop(i); break; }
    }
  });
  // teszteléshez: pukkantások száma, egy buborék kipukkantása (nem része a játéknak)
  container.__bub = { popped: () => popped, popOne: () => { if (!bubbles.length) spawn(); pop(bubbles.length - 1); }, GIFT_AT, shape, raining: () => rainT > 0, button: () => btn, count: () => bubbles.length };

  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    if (acc > 0.45 && bubbles.length < 18) { spawn(); acc = 0; }
    if (rainT > 0) {
      rainT -= dt; rainAcc += dt;
      while (rainAcc > 0.09) { rainAcc -= 0.09; if (bubbles.length < 46) spawn(true); dust.push({ x: Math.random() * w, y: -10, vy: 120 + Math.random() * 120, c: COLORS[(Math.random() * COLORS.length) | 0].c, t: 0 }); }
    }
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1a6b'); g.addColorStop(1, '#7a4fd0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(now / 600 + b.ph) * 24 * dt;   // képkocka-sebességtől független
      if (b.y < -90) { bubbles.splice(i, 1); continue; }
      const col = COLORS[b.ci].c;
      outline(b); ctx.fillStyle = col + (b.rb ? 'bb' : '88'); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = b.rb ? '#ffffff' : '#ffffffaa'; ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .18, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i]; d.y += d.vy * dt; d.t += dt; if (d.y > h + 10) { dust.splice(i, 1); continue; }
      ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x + Math.sin(d.t * 5) * 6, d.y, 4, 0, 7); ctx.fill();
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt * 2.5; if (p.t > 1) { pops.splice(i, 1); continue; }
      ctx.strokeStyle = p.c; ctx.lineWidth = 6 * (1 - p.t); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * .8), 0, 7); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k * .785; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * p.r * (.6 + p.t), p.y + Math.sin(a) * p.r * (.6 + p.t), 5 * (1 - p.t), 0, 7); ctx.fill(); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { btn?.remove(); cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', size); };
}
