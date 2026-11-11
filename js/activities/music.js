// Hangok tanítása: Rozi megmutatja és kimondja a hangot, megszólaltatja (1 mp), szünet (1 mp),
// aztán a gyereknek fel kell ismernie. Módok:
//   learn   – szolmizáció (dó ré mi fá szó lá szí; a betűneve is: C D E F G A H), majd felismerés
//   highlow – mély és magas hang, majd "melyik volt a magasabb?"
//   loud    – halk és hangos hang, majd "melyik volt a hangosabb?"
import { say } from '../voice.js';
import { artLetter } from '../hu.js';

const NOTES = {
  do: { f: 261.63, c: '#ff5d5d', name: 'dó', letter: 'C' },
  re: { f: 293.66, c: '#ff9f43', name: 'ré', letter: 'D' },
  mi: { f: 329.63, c: '#ffd93d', name: 'mi', letter: 'E' },
  fa: { f: 349.23, c: '#4cc38a', name: 'fá', letter: 'F' },
  szo: { f: 392.0, c: '#3bb7c9', name: 'szó', letter: 'G' },
  la: { f: 440.0, c: '#4a7dff', name: 'lá', letter: 'A' },
  szi: { f: 493.88, c: '#9b5de5', name: 'tí', letter: 'H' },
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[Math.floor(Math.random() * a.length)];
let actx = null;

function ctx() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {}
  return actx;
}
// Egy hang megszólaltatása (szinusz + háromszög, puha lecsengés). Visszatér, ha lejárt.
function tone(freq, { dur = 1.1, vol = 0.3 } = {}) {
  const c = ctx(); if (!c) return sleep(dur * 1000);
  const t = c.currentTime;
  for (const [type, g] of [['sine', 1], ['triangle', 0.35]]) {
    const o = c.createOscillator(), gain = c.createGain();
    o.type = type; o.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(vol * g, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gain); gain.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  return sleep(dur * 1000);
}

export function run(container, { mode = 'learn', notes = ['do', 'mi', 'szo'], say: sayText }) {
  return new Promise(async resolve => {
    let alive = true;
    const html = inner => { container.innerHTML = `<div class="activity"><div class="prompt" id="mprompt"></div>${inner}</div>`; };
    const setPrompt = t => { const el = container.querySelector('#mprompt'); if (el) el.textContent = t; };
    const alivePing = () => alive && container.isConnected && container.querySelector('#mprompt');

    // ---- tanítás ----
    async function teachNote(key) {
      const n = NOTES[key];
      html(`<div class="answers"><div class="answer key big" style="background:${n.c}">${n.name}<small>${n.letter}</small></div></div>`);
      setPrompt('Hallgasd meg a hangot! 🎵');
      const k = container.querySelector('.key');
      await say(`Ez a ${n.name} hang. Más néven ${artLetter(n.letter)} ${n.letter} hang. Hallgasd meg!`);
      if (!alivePing()) return false;
      k.classList.add('ring'); await tone(n.f, { dur: 1.2 }); k.classList.remove('ring');
      await sleep(1000);                                   // 1 másodperc csend, hogy "megülepedjen"
      return !!alivePing();
    }
    async function teachTwo(a, b) { // a, b: [felirat, frekvencia, hangerő, szín, mondat]
      for (const x of [a, b]) {
        html(`<div class="answers"><div class="answer key big" style="background:${x.c}">${x.icon}<small>${x.label}</small></div></div>`);
        setPrompt(x.title);
        await say(x.say); if (!alivePing()) return false;
        container.querySelector('.key').classList.add('ring'); await tone(x.f, { dur: 1.2, vol: x.vol }); await sleep(1000);
        if (!alivePing()) return false;
      }
      return true;
    }

    // ---- felismerés: szolmizációs hangok ----
    async function quizNotes(roundsLeft) {
      const target = rnd(notes);
      html(`<div class="answers"><button class="answer key replay" aria-label="Újra">🔊</button>${notes.map(k => `<button class="answer key" data-k="${k}" style="background:${NOTES[k].c}">${NOTES[k].name}<small>${NOTES[k].letter}</small></button>`).join('')}</div>`);
      setPrompt('Melyik hangot hallod? 👂');
      const keys = [...container.querySelectorAll('.key[data-k]')];
      let wrong = 0, locked = true;
      const play = async () => { locked = true; await tone(NOTES[target].f, { dur: 1.1 }); locked = false; };
      container.querySelector('.replay').addEventListener('click', () => { if (!locked) play(); });
      await say('Most te jössz! Figyelj, melyik hangot hallod?'); if (!alivePing()) return;
      await sleep(400); await play();
      await new Promise(done => keys.forEach(btn => btn.addEventListener('click', async () => {
        if (locked) return;
        const k = btn.dataset.k;
        if (k === target) { locked = true; btn.classList.add('win'); await tone(NOTES[k].f, { dur: 0.6 }); await say(`Igen! Ez a ${NOTES[k].name} hang!`); done(); }
        else {
          locked = true; wrong++; btn.classList.add('shake');
          await say(`Ezt a ${NOTES[k].name} hangot választottad. Hallgasd meg!`, { remember: false });
          await tone(NOTES[k].f, { dur: 0.9 }); await sleep(300);
          await say(`Ezt keressük, a ${NOTES[target].name} hangot. Figyeld!`, { remember: false });
          await tone(NOTES[target].f, { dur: 1.1 });
          btn.classList.remove('shake'); if (wrong >= 2) keys.find(x => x.dataset.k === target).classList.add('glow'); locked = false;
        }
      })));
    }

    // ---- felismerés: két hang összehasonlítása ----
    async function quizCompare(kind) {
      const hi = kind === 'highlow';
      const base = hi ? rnd([262, 294, 330]) : 392;
      const A = hi ? { f: base, vol: 0.3 } : { f: base, vol: 0.06 };
      const B = hi ? { f: base * 1.75, vol: 0.3 } : { f: base, vol: 0.38 };
      const firstIsTarget = Math.random() < 0.5;            // melyik a magasabb / hangosabb?
      const first = firstIsTarget ? B : A, second = firstIsTarget ? A : B;
      const word = hi ? 'magasabb' : 'hangosabb';
      html(`<div class="answers"><button class="answer key replay" aria-label="Újra">🔊</button><button class="answer key" data-i="0" style="background:#ffd1e8">1️⃣<small>az első</small></button><button class="answer key" data-i="1" style="background:#cfe8ff">2️⃣<small>a második</small></button></div>`);
      setPrompt(`Melyik volt a ${word}? 👂`);
      const buttons = [...container.querySelectorAll('.key[data-i]')];
      let locked = true, wrong = 0;
      const play = async () => { locked = true; await tone(first.f, { dur: 0.9, vol: first.vol }); await sleep(500); await tone(second.f, { dur: 0.9, vol: second.vol }); locked = false; };
      container.querySelector('.replay').addEventListener('click', () => { if (!locked) play(); });
      await say(`Hallgasd meg két hangot! Melyik a ${word}, az első vagy a második?`); if (!alivePing()) return;
      await sleep(300); await play();
      await new Promise(done => buttons.forEach(btn => btn.addEventListener('click', async () => {
        if (locked) return;
        const right = (+btn.dataset.i === 0) === firstIsTarget;
        if (right) { locked = true; btn.classList.add('win'); await say(`Igen! ${firstIsTarget ? 'Az első' : 'A második'} hang volt a ${word}.`); done(); }
        else { locked = true; wrong++; btn.classList.add('shake'); await say(`Majdnem! Hallgasd meg újra, figyeld, melyik a ${word}!`, { remember: false }); await sleep(200); await play(); btn.classList.remove('shake'); if (wrong >= 2) buttons[firstIsTarget ? 0 : 1].classList.add('glow'); }
      })));
    }

    // ---- menet ----
    if (mode === 'learn') {
      if (sayText) await say(sayText);
      for (const k of notes) { if (!(await teachNote(k))) return; }
      await quizNotes(); if (!alivePing()) return;
      await quizNotes();
    } else {
      const hi = mode === 'highlow';
      if (!(await teachTwo(
        { icon: hi ? '⬇️' : '🔈', label: hi ? 'mély' : 'halk', c: '#cfe8ff', f: hi ? 196 : 392, vol: hi ? 0.3 : 0.06, title: hi ? 'Ez a mély hang 🎵' : 'Ez a halk hang 🎵', say: (sayText ? sayText + ' ' : '') + (hi ? 'Ez egy mély hang. Hallgasd meg!' : 'Ez egy halk hang. Hallgasd meg!') },
        { icon: hi ? '⬆️' : '🔊', label: hi ? 'magas' : 'hangos', c: '#ffd1e8', f: hi ? 784 : 392, vol: hi ? 0.3 : 0.38, title: hi ? 'Ez a magas hang 🎵' : 'Ez a hangos hang 🎵', say: hi ? 'Ez pedig egy magas hang. Hallgasd meg!' : 'Ez pedig egy hangos hang. Hallgasd meg!' }))) return;
      await quizCompare(mode); if (!alivePing()) return;
      await quizCompare(mode);
    }
    if (alivePing()) resolve();
  });
}
