// Szülői sarok: 3 mp-es nyomva tartással nyílik. Itt lehet gyereket (profilt) felvenni, váltani, törölni,
// a játszó gyerek beállításait megadni, és az állását fájlba menteni vagy fájlból visszatölteni.
import { progress, MARKS } from './progress.js';
import { say, hasHungarianVoice, listHuVoices, chooseVoice, currentVoiceName } from './voice.js';
import { STATIONS } from './curriculum.js';
import { unlock, getLevel, setLevel, playNote, isRunning } from './audio.js';
import { calmChoice, setCalm } from './motion.js';
import { icon } from './icons.js';

// restart(profil-azonosító?): újratölti az oldalt; ha kap azonosítót, azzal a gyerekkel indul
export function setupParent(restart) {
  const $ = id => document.getElementById(id);
  const btn = $('parent-btn'), panel = $('parent');
  const name = $('p-name'), minutes = $('p-minutes'), perReward = $('p-per'), age = $('p-age'), mark = $('p-mark');
  const voiceInfo = $('p-voice'), voiceSel = $('p-voicesel'), stats = $('p-stats');
  const volume = $('p-volume'), speech = $('p-speech'), errors = $('p-errors'), calmSel = $('p-calm');
  const kids = $('p-kids'), del = $('p-del'), newBox = $('p-new'), file = $('p-file');
  let timer = null;
  mark.textContent = ''; for (const m of MARKS) { const o = document.createElement('option'); o.value = o.textContent = m; mark.append(o); }

  function renderKids() {                                // a nevek szövegként kerülnek ki (nem HTML-ként)
    kids.textContent = '';
    const list = progress.list();
    for (const p of list) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'small kid' + (p.id === progress.id() ? ' on' : '');
      b.textContent = `${p.mark} ${p.name || 'Névtelen'} · ${p.total} ★`;
      b.addEventListener('click', () => { if (p.id !== progress.id()) restart(p.id); });
      kids.append(b);
    }
    del.hidden = !progress.ready() || list.length < 2;
  }

  function open() {
    const p = progress.get(), dev = progress.device.get();
    panel.classList.toggle('nochild', !progress.ready());      // amíg nincs kiválasztva, ki játszik, a gyerekhez kötött mezők rejtve maradnak
    renderKids(); newBox.hidden = true;
    name.value = p.name || '';
    age.value = String(p.age || 5); mark.value = p.mark;
    minutes.value = String(p.rewardMinutes);
    perReward.value = String(p.perReward || 10);
    volume.value = String(getLevel());
    speech.value = String(dev.speechVol ?? 1);
    const cc = calmChoice(); calmSel.value = cc === null ? '' : cc ? '1' : '0';
    const heard = p.heardBell === false ? ' A legutóbbi zenei hallás-próbánál a gyerek azt jelezte, hogy NEM hallja a csengőt.' : '';
    voiceInfo.textContent = (hasHungarianVoice()
      ? `✅ Magyar felolvasóhang: ${currentVoiceName()}.`
      : '⚠️ Nincs magyar felolvasóhang ezen az eszközön – a feladatok képekkel így is játszhatók. Lásd lent, hogyan tölthető le.') + heard;
    const voices = listHuVoices();
    voiceSel.parentElement.hidden = voices.length < 1;
    voiceSel.textContent = ''; for (const v of voices) { const o = document.createElement('option'); o.value = v.voiceURI; o.textContent = v.name; voiceSel.append(o); }
    if (dev.voiceURI) voiceSel.value = dev.voiceURI;
    stats.innerHTML = `<b>Összes csillag: ${p.total || 0}</b>` + STATIONS.map(s => `<div class="stat"><span>${icon('st-' + s.id) || s.emoji} ${s.name}</span><b>${p.done[s.id] || 0}</b></div>`).join('');
    let log = [];
    try { log = JSON.parse(localStorage.getItem('csillagkert_errors') || '[]'); } catch (e) {}
    errors.textContent = log.length ? `Hibanapló (${log.length}): ` + log.slice(-3).map(x => `${x.where}: ${x.msg}`).join(' · ') : '';
    panel.hidden = false;
  }
  const start = e => { e.preventDefault(); clearTimeout(timer); timer = setTimeout(open, 3000); };
  const stop = () => clearTimeout(timer);
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));

  // --- gyerekek ---
  $('p-add').addEventListener('click', () => { newBox.hidden = false; $('p-new-name').value = ''; $('p-new-name').focus(); });
  $('p-new-cancel').addEventListener('click', () => { newBox.hidden = true; });
  $('p-new-ok').addEventListener('click', () => restart(progress.create({ name: $('p-new-name').value, age: +$('p-new-age').value })));
  del.addEventListener('click', () => {
    const who = progress.get().name || 'ezt a gyereket';
    if (confirm(`Biztosan törlöd: ${who}? A csillagai, a kertje és a ruhatára végleg törlődnek. Ez nem vonható vissza.`) && progress.remove(progress.id())) restart();
  });

  // --- mentés fájlba / visszatöltés fájlból (a fájl csak oda kerül, ahová a szülő menti) ---
  $('p-export').addEventListener('click', () => {
    const data = progress.exportData(); if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `csillagkert-mentes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
  $('p-import').addEventListener('click', () => { file.value = ''; file.click(); });
  file.addEventListener('change', async () => {
    const f = file.files?.[0]; if (!f) return;
    try {
      if (f.size > 3e6) throw new Error('Ez a fájl túl nagy, nem Csillagkert-mentés.');
      let obj; try { obj = JSON.parse(await f.text()); } catch (e) { throw new Error('Ez a fájl nem Csillagkert-mentés.'); }
      const id = progress.importData(obj);                // mindig új gyerekként kerül be, meglévőt nem ír felül
      alert('A mentés betöltve, új gyerekként jelenik meg.');
      restart(id);
    } catch (e) { alert(e.message || 'Ez a fájl nem Csillagkert-mentés.'); }
  });

  voiceSel.addEventListener('change', () => chooseVoice(voiceSel.value));
  volume.addEventListener('change', () => { setLevel(+volume.value); unlock(); playNote(784, { inst: 'bell', dur: 0.8 }); });
  calmSel.addEventListener('change', () => setCalm(calmSel.value === '' ? null : calmSel.value === '1'));
  speech.addEventListener('change', () => { progress.device.set({ speechVol: +speech.value }); say('Így beszélek.', { remember: false }); });
  // Hangpróba: előbb Rozi beszél, utána megszólal a csengő – így összehasonlítható a kettő hangereje
  $('p-test').addEventListener('click', async () => {
    unlock();
    await say('Szia' + (name.value ? ' ' + name.value : '') + '! Ügyes vagy! Most a csengő szól.', { remember: false });
    await playNote(784, { inst: 'bell', dur: 0.9 }); await playNote(1047, { inst: 'bell', dur: 0.9 });
    if (!isRunning()) voiceInfo.textContent += ' ⚠️ A játékhangok motorja nem indult el ezen az eszközön.';
  });
  $('p-close').addEventListener('click', () => {
    panel.hidden = true;
    if (!progress.ready()) return;
    const before = progress.get(), per = +perReward.value || 10;
    const changed = per !== (before.perReward || 10) || mark.value !== before.mark;
    progress.set({ name: name.value.trim(), rewardMinutes: +minutes.value || 4, perReward: per, age: +age.value || 5, mark: MARKS.includes(mark.value) ? mark.value : before.mark });
    if (changed) restart(progress.id());                 // a csillagmérő és a jel újraépül
  });
  $('p-reset').addEventListener('click', () => {
    if (confirm('Biztosan újrakezded? A gyűjtött csillagok, a kert és a ruhatár törlődnek (a gyerek neve megmarad).')) { progress.reset(); panel.hidden = true; restart(progress.id()); }
  });
}
