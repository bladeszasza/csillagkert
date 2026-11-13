// Színező (Rajzasztal): "Színezd pirosra a tetőt!" A gyerek kiválaszt egy színt, és a megnevezett részre koppint.
// Rossz rész vagy rossz szín nem marad meg: a rész felvillan, visszafehéredik, és Rozi megmondja, mi az ("Ez az ajtó.
// A tetőt keressük."). Második tévedés után a jó rész felvillan, harmadik után a jó szín is. Jó színezésnél a kép többi
// része magától kiszíneződik. Az ütemezőnek: 0 = hiba nélkül, 1 = egy tévedés, 2 = több.
import { say } from '../voice.js';
import { every, later } from '../scope.js';
import { penAllows } from '../pen.js';
import { happy } from '../sounds.js';
import { shapeSvg, decoSvg, tapPoint } from '../content/kepek.js';

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function run(container, item) {
  const { parts, colors, cnames, cra, target } = item;
  const order = colors.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const T = parts.find(p => p.id === target), want = item.color;
  return new Promise(resolve => {
    container.innerHTML = `
      <div class="activity kep">
        <div class="prompt">${item.prompt || 'Színezd ki! 🎨'}</div>
        <div class="kp-wrap"><svg class="kp-svg" viewBox="0 0 200 200">
          ${parts.map(p => `<g class="kp-part" data-p="${p.id}">${p.shapes.map(s => shapeSvg(s, 'fill="#fff" stroke="#3b2a63" stroke-width="3" stroke-linejoin="round"')).join('')}</g>`).join('')}
          <g class="kp-deco">${(item.deco || []).map(decoSvg).join('')}</g>
        </svg></div>
        <div class="palette">${order.map(i => `<button class="swatch" data-c="${i + 1}" style="background:${colors[i]}" aria-label="${cnames[i]}"></button>`).join('')}</div>
      </div>`;
    const box = container.querySelector('.activity'), svg = container.querySelector('.kp-svg');
    let sel = 0, wrong = 0, done = false, lastAct = performance.now(), lastTalk = 0;
    const partEl = id => svg.querySelector(`.kp-part[data-p="${id}"]`);
    const fill = (id, c) => partEl(id).querySelectorAll('*').forEach(s => s.setAttribute('fill', c));
    function talk(text) { const now = performance.now(); if (now - lastTalk < 2000) return; lastTalk = now; say(text, { remember: false }); }
    function pulse(el) { el.classList.remove('hint'); void el.getBoundingClientRect(); el.classList.add('hint'); }
    const swatch = c => container.querySelector(`.swatch[data-c="${c}"]`);

    function tap(e) {
      const g = e.target.closest?.('.kp-part'); if (!g || done || !penAllows(e)) return;
      e.preventDefault(); lastAct = performance.now();
      const id = g.dataset.p, P = parts.find(p => p.id === id);
      if (!sel) { talk('Előbb válassz egy színt!'); container.querySelectorAll('.swatch').forEach(pulse); return; }   // nem tévedés
      if (id === target && sel === want) {
        done = true; fill(id, colors[want - 1]); box.classList.add('done'); happy('🦄');
        say(`Kész! ${cap(cra[want - 1])} színezted ${T.acc}.`);
        parts.filter(p => p.id !== target).forEach((p, k) => later(() => fill(p.id, p.fill), 350 + k * 160));   // a többi rész magától kiszíneződik
        later(() => resolve({ wrong: Math.min(2, wrong) }), 1600 + parts.length * 160);
        return;
      }
      wrong++; fill(id, colors[sel - 1]); g.classList.remove('wob'); void g.getBoundingClientRect(); g.classList.add('wob');
      later(() => { if (!done) fill(id, '#fff'); }, 650);
      talk(id !== target ? `${P.pl ? 'Ezek' : 'Ez'} ${P.nom}. ${cap(T.acc)} keressük.` : `Ez ${cnames[sel - 1]}. ${cap(T.acc)} ${cra[want - 1]} színezzük.`);
      if (wrong >= 2) later(() => pulse(partEl(target)), 700);
      if (wrong >= 3) later(() => pulse(swatch(want)), 900);
    }
    svg.addEventListener('pointerdown', tap);
    container.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.c; lastAct = performance.now();
      say(cnames[sel - 1], { remember: false });
    }));
    const timer = every(() => { if (!svg.isConnected) { clearInterval(timer); return; } if (!done && performance.now() - lastAct > 8000) { lastAct = performance.now(); pulse(partEl(target)); } }, 2000);
    // a böngészős teszt: a rész látható pontja képernyő-koordinátában (ott koppint, ahol a gyerek is)
    box.__kep = { swatch, point: id => { const [x, y] = tapPoint(item.pic, id), m = svg.getScreenCTM(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; } };
    say(item.say);
  });
}
