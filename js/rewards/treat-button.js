// A tarisznya gombja egy játékban (2. kör): ha van az adott meglepetésből (falat, varázspor, tűzijáték), egy nagy kerek
// gomb a saját rajzával és egy kis számmal (hány van még). Koppintásra egy elfogy (azonnal mentve, js/economy.js useItem),
// és a játék megmutatja a meglepetést. Ha elfogyott, a gomb eltűnik. Előnyt nem ad, csak örömöt.
import { TREATS } from '../gifts.js';

// key: a tarisznya rekesze; ctx: { items, useItem }; onUse(): a meglepetés a játékban. Visszaadja a gombot (vagy null-t).
export function treatButton(container, key, ctx, onUse, { cls = '' } = {}) {
  const g = TREATS.find(t => t.item === key);
  let n = Math.max(0, Math.floor(+(ctx?.items?.[key]) || 0));
  if (!g || !n || typeof ctx.useItem !== 'function') return null;
  const b = document.createElement('button');
  b.className = `treat-btn${cls ? ' ' + cls : ''}`; b.type = 'button'; b.dataset.treat = key;
  b.setAttribute('aria-label', g.nom);
  const show = () => { b.innerHTML = `${g.icon}<span class="n">${n}</span>`; };
  show();
  b.addEventListener('click', e => {
    e.stopPropagation();
    if (b.disabled || !ctx.useItem(key)) return;
    n--; onUse();
    if (n > 0) show();
    else { b.disabled = true; b.classList.add('gone'); setTimeout(() => b.remove(), 600); }
  });
  container.appendChild(b);
  return b;
}
