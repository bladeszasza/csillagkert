// Szülői sarok: 3 mp-es nyomva tartással nyílik.
import { progress } from './progress.js';
import { say, hasHungarianVoice } from './voice.js';

export function setupParent(onReset) {
  const btn = document.getElementById('parent-btn'), panel = document.getElementById('parent');
  const name = document.getElementById('p-name'), minutes = document.getElementById('p-minutes'), voiceInfo = document.getElementById('p-voice');
  let timer = null;

  function open() {
    name.value = progress.get().name || '';
    minutes.value = String(progress.get().rewardMinutes);
    voiceInfo.textContent = hasHungarianVoice()
      ? '✅ Magyar felolvasóhang elérhető.'
      : '⚠️ Nincs magyar felolvasóhang ezen az eszközön – a feladatok képekkel így is játszhatók. Lásd lent, hogyan tölthető le.';
    panel.hidden = false;
  }
  const start = e => { e.preventDefault(); clearTimeout(timer); timer = setTimeout(open, 3000); };
  const stop = () => clearTimeout(timer);
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));

  document.getElementById('p-test').addEventListener('click', () => say('Szia' + (name.value ? ' ' + name.value : '') + '! Ügyes vagy!', { remember: false }));
  document.getElementById('p-close').addEventListener('click', () => {
    progress.set({ name: name.value.trim(), rewardMinutes: +minutes.value || 4 });
    panel.hidden = true;
  });
  document.getElementById('p-reset').addEventListener('click', () => {
    if (confirm('Biztosan újrakezded? A gyűjtött csillagok és virágok törlődnek.')) { progress.reset(); panel.hidden = true; onReset(); }
  });
}
