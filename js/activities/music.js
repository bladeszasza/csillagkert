// Zenevár: hallás-fejlesztés a Kodály-úton (viszonyított hallás, nem "melyik hang ez?" vakon).
// Módok:
//   learn   – 2–3 harang neve (szó–mi-vel kezdve); a harangok megkoppinthatók; aztán "melyik harang szólt?"
//   highlow – mély és magas hang; két harang szól egymás után: "melyik volt a magasabb?"
//   loud    – halk és hangos hang; "melyik volt a hangosabb?"
//   same    – "egyforma volt a két hang, vagy különböző?"
//   updown  – "feljebb ment a hang, vagy lejjebb?"
// Minden hang a közös hangmotoron szól (js/audio.js): kitartott, felhangokban gazdag, jól hallható.
import { say, setRepeatHandler } from '../voice.js';
import { playNote, unlock } from '../audio.js';
import { sleep, every } from '../scope.js';
import { progress } from '../progress.js';

const NOTES = {
  do: { f: 523.25, c: '#ff5d5d', name: 'dó' },
  re: { f: 587.33, c: '#ff9f43', name: 'ré' },
  mi: { f: 659.25, c: '#d99a00', name: 'mi' },
  fa: { f: 698.46, c: '#3fae7c', name: 'fá' },
  szo: { f: 783.99, c: '#2fa3b8', name: 'szó' },
  la: { f: 880.0, c: '#4a7dff', name: 'lá' },
  ti: { f: 987.77, c: '#9b5de5', name: 'ti' },
};
NOTES.szi = NOTES.ti;                                   // régi kulcs
const rnd = a => a[Math.floor(Math.random() * a.length)];
let hearingChecked = false;                             // laponként egyszer kérdezzük meg: "Hallod a csengőt?"

export function run(container, { mode = 'learn', notes = ['szo', 'mi'], say: sayText }) {
  return (async () => {
    unlock();
    const html = inner => { container.innerHTML = `<div class="activity music"><div class="prompt" id="mprompt"></div>${inner}</div>`; };
    const setPrompt = t => { const el = container.querySelector('#mprompt'); if (el) el.textContent = t; };
    const $$ = sel => [...container.querySelectorAll(sel)];
    // hang + látható jelzés: a megszólaló harang lüktet
    const sound = async (el, f, opts = {}) => { el?.classList.add('playing'); await playNote(f, { dur: 1.0, inst: 'piano', ...opts }); el?.classList.remove('playing'); };
    const bellHtml = (k, extra = '') => `<button class="answer key bell ${extra}" data-k="${k}" style="background:${NOTES[k].c}"><span>🔔</span><small>${NOTES[k].name}</small></button>`;

    // ---- hallás-próba (egyszer): ha a gyerek nem hallja a csengőt, szólunk a felnőttnek ----
    async function hearingCheck() {
      if (hearingChecked) return; hearingChecked = true;
      html(`<div class="answers"><div class="answer key bell big" id="hb" style="background:#8e5be8"><span>🔔</span></div></div>
            <div class="answers"><button class="answer pic" data-h="1">👍</button><button class="answer pic" data-h="0">🙉</button></div>
            <div class="hearhelp" id="hearhelp" hidden>🔊⬆️ &nbsp; 🔕❌<small>Szülőknek: hangosítsd fel az iPadet, és kapcsold ki a néma módot (Vezérlőközpont → harang).</small><button class="answer pic" id="hgo">▶</button></div>`);
      setPrompt('Hallod a csengőt? 👂');
      const hb = container.querySelector('#hb');
      const play = async () => { await sound(hb, 784, { inst: 'bell', dur: 0.9 }); await sleep(150); await sound(hb, 1047, { inst: 'bell', dur: 0.9 }); };
      setRepeatHandler(play);
      await say('Hallod a csengőt? Ha hallod, koppints a felfelé mutató hüvelykujjra!', { remember: false });
      play();
      const heard = await new Promise(done => $$('[data-h]').forEach(b => b.addEventListener('click', () => done(b.dataset.h === '1'), { once: true })));
      progress.set({ heardBell: heard });
      if (!heard) {
        container.querySelector('#hearhelp').hidden = false;
        await say('Semmi baj! Kérj meg egy felnőttet, hogy hangosítsa fel. Ha kész, koppints a nyílra!', { remember: false });
        await new Promise(done => container.querySelector('#hgo').addEventListener('click', done, { once: true }));
      }
    }

    // ---- harangok neve + szabad kipróbálás + "melyik harang szólt?" ----
    async function learn() {
      html(`<div class="answers bells">${notes.map(k => bellHtml(k)).join('')}</div>`);
      const bells = $$('.bell'), el = k => bells.find(b => b.dataset.k === k);
      setPrompt('Ezek a harangok 🔔');
      setRepeatHandler(null);
      if (sayText) await say(sayText);
      for (const k of notes) {
        await say(`Ennek a harangnak a neve: ${NOTES[k].name}.`, { remember: false });
        await sound(el(k), NOTES[k].f, { dur: 1.3 }); await sleep(500);
      }
      // szabad kipróbálás: minden harangot meg kell szólaltatni egyszer
      setPrompt('Koppints a harangokra! 👆');
      const tried = new Set();
      let busy = false;
      const explore = new Promise(done => bells.forEach(b => b.addEventListener('click', async () => {
        if (busy) return; busy = true; b.classList.remove('glow');
        await sound(b, NOTES[b.dataset.k].f, { dur: 0.8 }); busy = false;
        tried.add(b.dataset.k); if (tried.size === notes.length) done();
      })));
      await say('Most te jössz! Koppints minden harangra, és hallgasd meg!');
      const nudge = every(() => bells.filter(b => !tried.has(b.dataset.k)).forEach(b => b.classList.add('glow')), 7000);
      await explore; clearInterval(nudge); await sleep(400);
      let prev = null;
      for (let round = 0; round < 2; round++) prev = await quizBell(prev);
    }
    async function quizBell(prev) {
      const target = rnd(notes.filter(k => k !== prev || notes.length === 1));
      html(`<div class="answers"><div class="answer key bell mystery" id="myst"><span>🎁</span></div></div><div class="answers bells">${notes.map(k => bellHtml(k)).join('')}</div>`);
      setPrompt('Melyik harang szólt? 👂');
      const myst = container.querySelector('#myst'), bells = $$('.bell[data-k]');
      let locked = true, wrong = 0;
      const playTarget = async () => { locked = true; await sound(myst, NOTES[target].f, { dur: 1.2 }); locked = false; };
      setRepeatHandler(() => { if (!locked) playTarget(); });
      await say('Figyelj! Az ajándék-harang megszólal. Melyik harang szól ugyanígy?');
      await sleep(300); await playTarget();
      await new Promise(done => bells.forEach(b => b.addEventListener('click', async () => {
        if (locked) return; locked = true;
        const k = b.dataset.k;
        await sound(b, NOTES[k].f, { dur: 0.8 });
        if (k === target) { b.classList.add('win'); await say(`Igen! Ez a harang szólt: a ${NOTES[k].name}.`, { remember: false }); done(); return; }
        wrong++; b.classList.add('shake');
        await say(`Ez a ${NOTES[k].name} volt. Hallgasd, ez szólt:`, { remember: false });
        b.classList.remove('shake'); await playTarget();
        if (wrong >= 2) bells.find(x => x.dataset.k === target).classList.add('glow');
      })));
      return target;
    }

    // ---- két hang összehasonlítása: a két harang egymás után szól, a gyerek a harangra koppint ----
    const TEACH = {
      highlow: [{ icon: '🐻', label: 'mély', f: 196, vol: 0.9, say: 'Ez mély hang. Olyan, mint a medve hangja.' }, { icon: '🐦', label: 'magas', f: 1568, vol: 0.7, say: 'Ez pedig magas hang. Olyan, mint a kismadáré.' }],
      loud: [{ icon: '🐭', label: 'halk', f: 784, vol: 0.22, say: 'Ez halk hang. Olyan, mint a kisegér.' }, { icon: '🦁', label: 'hangos', f: 784, vol: 1, say: 'Ez pedig hangos hang. Olyan, mint az oroszlán.' }],
    };
    async function teachTwo(kind) {
      for (const x of TEACH[kind]) {
        html(`<div class="answers"><div class="answer key bell big" style="background:#8e5be8"><span>${x.icon}</span><small>${x.label}</small></div></div>`);
        setPrompt(`Ez a ${x.label} hang 🎵`);
        setRepeatHandler(null);
        await say(x.say); await sound(container.querySelector('.bell'), x.f, { dur: 1.3, vol: x.vol }); await sleep(600);
      }
    }
    async function quizCompare(kind) {
      const hi = kind === 'highlow', word = hi ? 'magasabb' : 'hangosabb';
      const base = hi ? rnd([262, 294, 330, 392]) : rnd([659, 784]);
      const low = hi ? { f: base, vol: 0.85 } : { f: base, vol: 0.22 }, high = hi ? { f: base * 2, vol: 0.8 } : { f: base, vol: 1 };
      const targetLeft = Math.random() < 0.5, A = targetLeft ? high : low, B = targetLeft ? low : high;
      html(`<div class="answers bells"><button class="answer key bell" data-i="0" style="background:#ff7ab8"><span>🔔</span></button><button class="answer key bell" data-i="1" style="background:#4a9dff"><span>🔔</span></button></div>`);
      setPrompt(`Melyik harang volt a ${word}? 👂`);
      const bells = $$('.bell');
      let locked = true, wrong = 0;
      const play = async () => { locked = true; await sound(bells[0], A.f, { vol: A.vol, dur: 1.0 }); await sleep(350); await sound(bells[1], B.f, { vol: B.vol, dur: 1.0 }); locked = false; };
      setRepeatHandler(() => { if (!locked) play(); });
      await say(`Két harang szól egymás után. Koppints arra, amelyik ${hi ? 'magasabban' : 'hangosabban'} szólt!`);
      await sleep(300); await play();
      await new Promise(done => bells.forEach(b => b.addEventListener('click', async () => {
        if (locked) return; locked = true;
        if ((b.dataset.i === '0') === targetLeft) { b.classList.add('win'); await say(`Igen! Ez a harang szólt ${hi ? 'magasabban' : 'hangosabban'}.`, { remember: false }); done(); return; }
        wrong++; b.classList.add('shake');
        await say(`Hallgasd meg újra! Figyeld, melyik a ${word}.`, { remember: false });
        b.classList.remove('shake'); if (wrong >= 2) bells[targetLeft ? 0 : 1].classList.add('glow');
        await play();
      })));
    }

    // ---- kétválaszos hallás-feladat: előbb bemutatjuk mindkét esetet, aztán kérdezünk ----
    const TWO = {
      same: {
        prompt: 'Egyforma vagy különböző? 👂', ask: 'Egyforma volt a két hang, vagy különböző?',
        opts: [{ id: 'same', html: '<span class="pair"><i style="background:#ff7ab8"></i><i style="background:#ff7ab8"></i></span>', label: 'egyforma', demo: 'Ez a két hang egyforma.', right: 'Igen! A két hang egyforma volt.' },
               { id: 'diff', html: '<span class="pair"><i style="background:#ff7ab8"></i><i style="background:#4a9dff"></i></span>', label: 'különböző', demo: 'Ez a két hang különböző.', right: 'Igen! A két hang különböző volt.' }],
        pair(id) { const a = rnd([523.25, 587.33, 659.25, 783.99]); return [a, id === 'same' ? a : a * rnd([1.5, 2, 0.667])]; },
      },
      updown: {
        prompt: 'Feljebb vagy lejjebb? 👂', ask: 'Feljebb ment a hang, vagy lejjebb?',
        opts: [{ id: 'up', html: '⬆️', label: 'feljebb', demo: 'Most feljebb megy a hang.', right: 'Igen! A hang feljebb ment.' },
               { id: 'down', html: '⬇️', label: 'lejjebb', demo: 'Most lejjebb megy a hang.', right: 'Igen! A hang lejjebb ment.' }],
        pair(id) { const a = rnd([523.25, 587.33, 659.25]); return id === 'up' ? [a, a * 1.5] : [a * 1.5, a]; },
      },
    };
    async function twoChoice(kind) {
      const T = TWO[kind];
      const screen = () => {
        html(`<div class="answers"><div class="answer key bell mystery" id="myst"><span>🎵</span></div></div><div class="answers">${T.opts.map(o => `<button class="answer pic two" data-o="${o.id}">${o.html}<small>${o.label}</small></button>`).join('')}</div>`);
        setPrompt(T.prompt);
        return { myst: container.querySelector('#myst'), btns: $$('.two') };
      };
      const playPair = async (myst, [a, b]) => { await sound(myst, a, { dur: 0.9 }); await sleep(250); await sound(myst, b, { dur: 0.9 }); };
      // bemutatás
      let ui = screen(); setRepeatHandler(null);
      if (sayText) await say(sayText);
      for (const o of T.opts) {
        const b = ui.btns.find(x => x.dataset.o === o.id); b.classList.add('glow');
        await say(o.demo, { remember: false }); await playPair(ui.myst, T.pair(o.id)); await sleep(400); b.classList.remove('glow');
      }
      // kérdések
      let prev = null;
      for (let round = 0; round < 3; round++) {
        const target = round === 0 ? rnd(T.opts).id : (Math.random() < 0.7 ? T.opts.find(o => o.id !== prev).id : prev); prev = target;
        const pair = T.pair(target), right = T.opts.find(o => o.id === target);
        ui = screen();
        let locked = true, wrong = 0;
        const play = async () => { locked = true; await playPair(ui.myst, pair); locked = false; };
        setRepeatHandler(() => { if (!locked) play(); });
        await say(T.ask); await sleep(250); await play();
        await new Promise(done => ui.btns.forEach(b => b.addEventListener('click', async () => {
          if (locked) return; locked = true;
          if (b.dataset.o === target) { b.classList.add('win'); await say(right.right, { remember: false }); done(); return; }
          wrong++; b.classList.add('shake');
          await say('Hallgasd meg újra!', { remember: false }); b.classList.remove('shake');
          if (wrong >= 2) ui.btns.find(x => x.dataset.o === target).classList.add('glow');
          await play();
        })));
      }
    }

    // ---- menet ----
    await hearingCheck();
    if (mode === 'learn') await learn();
    else if (mode === 'highlow' || mode === 'loud') {
      if (sayText) { html(''); setPrompt('🎵'); await say(sayText); }
      await teachTwo(mode); await quizCompare(mode); await quizCompare(mode);
    } else if (TWO[mode]) await twoChoice(mode);
    setRepeatHandler(null);
  })();
}
