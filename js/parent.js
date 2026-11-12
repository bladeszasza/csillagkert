// Szülői sarok: 3 mp-es nyomva tartással nyílik.
import { progress } from './progress.js';
import { say, hasHungarianVoice, listHuVoices, chooseVoice, currentVoiceName } from './voice.js';
import { STATIONS } from './curriculum.js';
import { unlock, getLevel, setLevel, playNote, isRunning } from './audio.js';

export function setupParent(onReset) {
  const btn = document.getElementById('parent-btn'), panel = document.getElementById('parent');
  const name = document.getElementById('p-name'), minutes = document.getElementById('p-minutes'), perReward = document.getElementById('p-per');
  const voiceInfo = document.getElementById('p-voice'), voiceSel = document.getElementById('p-voicesel'), stats = document.getElementById('p-stats');
  const volume = document.getElementById('p-volume'), speech = document.getElementById('p-speech'), errors = document.getElementById('p-errors');
  let timer = null;

  function open() {
    const p = progress.get();
    name.value = p.name || '';
    minutes.value = String(p.rewardMinutes);
    perReward.value = String(p.perReward || 10);
    volume.value = String(getLevel());
    speech.value = String(p.speechVol ?? 1);
    const heard = p.heardBell === false ? ' A legutóbbi zenei hallás-próbánál a gyerek azt jelezte, hogy NEM hallja a csengőt.' : '';
    voiceInfo.textContent = (hasHungarianVoice()
      ? `✅ Magyar felolvasóhang: ${currentVoiceName()}.`
      : '⚠️ Nincs magyar felolvasóhang ezen az eszközön – a feladatok képekkel így is játszhatók. Lásd lent, hogyan tölthető le.') + heard;
    const voices = listHuVoices();
    voiceSel.parentElement.hidden = voices.length < 1;
    voiceSel.innerHTML = voices.map(v => `<option value="${v.voiceURI}">${v.name}</option>`).join('');
    if (p.voiceURI) voiceSel.value = p.voiceURI;
    const total = p.total || 0;
    stats.innerHTML = `<b>Összes csillag: ${total}</b>` + STATIONS.map(s => `<div class="stat"><span>${s.emoji} ${s.name}</span><b>${p.done[s.id] || 0}</b></div>`).join('');
    let log = [];
    try { log = JSON.parse(localStorage.getItem('csillagkert_errors') || '[]'); } catch (e) {}
    errors.textContent = log.length ? `Hibanapló (${log.length}): ` + log.slice(-3).map(x => `${x.where}: ${x.msg}`).join(' · ') : '';
    panel.hidden = false;
  }
  const start = e => { e.preventDefault(); clearTimeout(timer); timer = setTimeout(open, 3000); };
  const stop = () => clearTimeout(timer);
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));

  voiceSel.addEventListener('change', () => chooseVoice(voiceSel.value));
  volume.addEventListener('change', () => { setLevel(+volume.value); unlock(); playNote(784, { inst: 'bell', dur: 0.8 }); });
  speech.addEventListener('change', () => { progress.set({ speechVol: +speech.value }); say('Így beszélek.', { remember: false }); });
  // Hangpróba: előbb Rozi beszél, utána megszólal a csengő – így összehasonlítható a kettő hangereje
  document.getElementById('p-test').addEventListener('click', async () => {
    unlock();
    await say('Szia' + (name.value ? ' ' + name.value : '') + '! Ügyes vagy! Most a csengő szól.', { remember: false });
    await playNote(784, { inst: 'bell', dur: 0.9 }); await playNote(1047, { inst: 'bell', dur: 0.9 });
    if (!isRunning()) voiceInfo.textContent += ' ⚠️ A játékhangok motorja nem indult el ezen az eszközön.';
  });
  document.getElementById('p-close').addEventListener('click', () => {
    const before = progress.get().perReward || 10;
    const per = +perReward.value || 10;
    progress.set({ name: name.value.trim(), rewardMinutes: +minutes.value || 4, perReward: per });
    panel.hidden = true;
    if (per !== before) location.reload(); // a csillagmérő újraépül
  });
  document.getElementById('p-reset').addEventListener('click', () => {
    if (confirm('Biztosan újrakezded? A gyűjtött csillagok és virágok törlődnek.')) { progress.reset(); panel.hidden = true; onReset(); }
  });
}
