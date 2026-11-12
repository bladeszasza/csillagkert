// Képválasztós feladat (formák, színek, számok, hangok, világ, egészség, logika...).
// Büntetés nélkül: 1. tévedés → újra; 2. → eltűnik egy rossz válasz; 3. → a jó felragyog.
// A kimondott mondatokat a js/lines.js pickSpeech() állítja össze (Node-ban is tesztelhető).
// Eredmény: { wrong } – hányszor tévedett (az ütemező ebből hangolja a nehézséget).
import { say, setRepeatHandler } from '../voice.js';
import { withArt } from '../hu.js';
import { pickSpeech } from '../lines.js';
import { dots } from './count.js';
import { sleep } from '../scope.js';
import { hearingCheck, playEvents } from './hearing.js';

// hangos feladat (item.sound): a bemutató (item.intro) laponként egyszer szól fogalmanként
const introShown = new Set();

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// régi (kézzel írt) feladatok: tény nélkül ez hangzik el a jó válasz után
function explain(prompt, o) {
  const nm = o.name || '';
  let m;
  if ((m = /Melyikből van (több|kevesebb)/.exec(prompt))) return `Igen, ebből van ${m[1]}: ${nm}.`;
  return nm ? `Igen, ez ${withArt(nm)}!` : 'Igen, ez az!';      // a kérdést nem ismételjük
}
// régi feladatok tévedésénél: főnévnél névelővel ("Ez a fül."), ragozott szónál és igénél csak a szó ("Jobbra.")
const legacyName = n => !n ? '' : (/\s/.test(n) || /(val|vel|ra|re|ban|ben|nyel|llok|gyek|dok)$/.test(n)) ? n[0].toUpperCase() + n.slice(1) + '.' : `Ez ${withArt(n)}.`;

// Egy válaszgomb tartalma: kép (emoji vagy SVG) + név, vagy számkártya (számjegy + pöttyök)
export const optionKey = o => o.key || (o.n !== undefined ? 'n' + o.n : o.name || o.t);
const face = o => o.n !== undefined ? `${o.n}<small>${dots(o.n)}</small>` : `${o.t}${o.name && !o.hideName ? `<small>${o.name}</small>` : ''}`;

// A feladat képe (a galéria-oldal is ezt rajzolja ki: tests/gallery.html)
export const markup = ({ prompt, q, qHtml, icon = '🧠' }, opts) => `
      <div class="activity">
        <div class="prompt">${prompt} ${icon}</div>
        ${qHtml ? `<div class="qbox">${qHtml}</div>` : q ? `<div class="items"><span class="item">${q}</span></div>` : ''}
        <div class="answers">${opts.map((o, i) => `<button class="answer${o.n !== undefined ? ' num' : ' pic'}${o.cls ? ' ' + o.cls : ''}" data-i="${i}" data-k="${optionKey(o)}"${o.name ? ` aria-label="${o.name}"` : ''}>${face(o)}</button>`).join('')}</div>
      </div>`;

// options: [{ t: '🍎', name: 'alma', ok: true }, ...] vagy számkártya { n: 7, name: 'hét', ok }
// q: nagy kérdéssor (emoji-szöveg), qHtml: tetszőleges kép-tartalom (csoportok, jelenet)
// item.memo: { html, say, ms } – "Mi tűnt el?": előbb ezt a képet nézi meg, aztán jön a kérdés (megszakításkor megáll)
// item.sound: { events, again? } (és a válasznál o.tone: koppintásra ez szól) – hallásos feladat: a kérdés után a hangsor szól, addig a gombok zárva; a 🔊 a hangot is
//   újrajátssza, tévedés után az again (vagy az egész) hangsor szól újra. item.fixed: a válaszok sorrendje kötött
//   (a balról jobbra megszólaló harangok). item.intro: { key, steps: [{ hi, say, events }] } – bemutató az első alkalommal.
export function run(container, item) {
  const { prompt, options, fact } = item;
  return new Promise(async resolve => {
    if (item.memo) {
      container.innerHTML = `<div class="activity"><div class="prompt">Nézd meg jól! 👀</div><div class="qbox memo">${item.memo.html}</div></div>`;
      await say(item.memo.say, { remember: false });
      await sleep(item.memo.ms);
    }
    if (item.sound) await hearingCheck(container);
    const opts = item.fixed ? options.slice() : shuffle(options);
    const speech = pickSpeech({ ...item, options: opts }, legacyName);   // a válaszok a képernyő sorrendjében hangzanak el
    container.innerHTML = markup(item, opts);
    const btns = [...container.querySelectorAll('.answer')];
    let wrong = 0, locked = false, finished = false;
    const box = container.querySelector('.activity');
    const lock = v => { locked = v; box.dataset.locked = v ? '1' : '0'; };
    const playAll = async evs => { lock(true); await playEvents(container, evs); lock(false); };

    btns.forEach((btn, i) => btn.addEventListener('click', async () => {
      if (locked || finished) return;
      const o = opts[i];
      if (item.sound && o.tone) { lock(true); await playEvents(container, o.tone); }       // a harang megszólal, amire koppintott (a zárat a folytatás oldja)
      if (o.ok) {
        finished = true; btn.classList.add('win'); if (item.sound) setRepeatHandler(null);
        await say(fact ? speech.right(wrong) : explain(prompt, o));
        resolve({ wrong });
      } else {
        lock(true); wrong++;
        btn.classList.add('shake');
        // tanít: megmondja, mi az, amit választott, aztán röviden visszakérdez / segít
        await say(speech.wrong(o, wrong), { remember: false });
        btn.classList.remove('shake');
        if (wrong >= 2) {
          const bad = btns.filter((b, k) => !opts[k].ok && !b.classList.contains('gone'));
          if (bad.length > 1) bad[0].classList.add('gone');
        }
        if (wrong >= 3) btns[opts.findIndex(x => x.ok)].classList.add('glow');
        if (item.sound) { await sleep(250); await playAll(item.sound.again || item.sound.events); }
        lock(false);
      }
    }));
    if (!item.sound) { say(speech.question); return; }
    // hallásos feladat: bemutató (egyszer), kérdés, aztán a hangsor; a 🔊 a kérdést és a hangot is megismétli
    lock(true);
    const intro = item.intro;
    if (intro && !introShown.has(intro.key)) {
      for (const st of intro.steps) {
        const el = st.hi && container.querySelector(`[data-k="${CSS.escape(st.hi)}"]`);
        el?.classList.add('glow'); await say(st.say, { remember: false }); await playEvents(container, st.events); await sleep(350); el?.classList.remove('glow');
      }
      introShown.add(intro.key);
    }
    setRepeatHandler(async () => { if (locked || finished) return; lock(true); await say(speech.question, { remember: false }); await playEvents(container, item.sound.events); lock(false); });
    await say(speech.question); await sleep(250);
    await playAll(item.sound.events);
  });
}
