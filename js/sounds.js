// Boldog hangok: kuncogás, kacagás, örömsikoly, csicsergés, dorombolás, vakkantás, ujjongás.
// Mind szintetizált (WebAudio), ezért nem kell hangfájl, és mindig kicsit más (véletlenszerű magasság/ritmus).
// Az állatoknak saját hangjuk van (a cica dorombol, a kutya vakkant, a nyuszi csipog, a róka vihog).
// A hangok a közös hangmotor (js/audio.js) "animal" buszán szólnak, így nincs külön AudioContext.
import { unlock, bus } from './audio.js';
let actx = null;
export function unlockAudio() { actx = unlock(); return actx; }
const r = (a, b) => a + Math.random() * (b - a);
const BOOST = 2.0;   // az állathangok jól hallhatók legyenek; a közös kompresszor vigyáz, hogy ne torzítsanak

// Egy "hangszalag-szerű" hang: fűrészhullám + formáns szűrő + vibrato + burkoló
function voice(t, { f0, f1 = f0, dur = 0.12, vol = 0.18, form = 1800, q = 5, vib = 0, type = 'sawtooth' }) {
  const c = actx; if (!c) return;
  const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  bp.type = 'bandpass'; bp.frequency.value = form; bp.Q.value = q;
  vol *= BOOST; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.min(vol, 0.9), t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * 0.04; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
  o.connect(bp); bp.connect(g); g.connect(bus('animal')); o.start(t); o.stop(t + dur + 0.05);
}
function breath(t, dur = 0.08, vol = 0.05) {      // halk "lehelet" a kacagáshoz
  const c = actx; if (!c) return;
  const n = c.createBufferSource(), b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = b; vol *= BOOST; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; const g = c.createGain(); g.gain.value = vol;
  n.connect(hp); hp.connect(g); g.connect(bus('animal')); n.start(t);
}

function hiss(t, dur, freq, q, vol) {          // szűrt zaj-pöffenés (sün szuszogása)
  const c = actx; if (!c) return;
  const n = c.createBufferSource(), b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
  n.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q; const g = c.createGain(); g.gain.value = vol * BOOST;
  n.connect(bp); bp.connect(g); g.connect(bus('animal')); n.start(t);
}

const SOUNDS = {
  // "hi-hi-hi-hi": gyors, magas, lefelé-felfelé csúszó kuncogás
  giggle() { const t = actx.currentTime, n = 5 + (Math.random() * 3 | 0), base = r(520, 680); for (let i = 0; i < n; i++) { const tt = t + i * 0.095; voice(tt, { f0: base * (1 + (i % 2) * 0.18), f1: base * 1.3, dur: 0.075, vol: 0.16 - i * 0.012, form: 2300, q: 6 }); breath(tt, 0.05, 0.03); } },
  // "ha-ha-ha": mélyebb kacagás, lefelé lépcsőzik
  laugh() { const t = actx.currentTime, n = 3 + (Math.random() * 2 | 0), base = r(300, 380); for (let i = 0; i < n; i++) { const tt = t + i * 0.18; voice(tt, { f0: base * (1 - i * 0.07), f1: base * (0.85 - i * 0.07), dur: 0.14, vol: 0.2, form: 900, q: 3, vib: 7 }); breath(tt, 0.09, 0.05); } },
  // örömsikoly: magasba csúszó hang vibratóval
  squeal() { const t = actx.currentTime, a = r(500, 650); voice(t, { f0: a, f1: a * 2.3, dur: 0.28, vol: 0.17, form: 2000, q: 4, vib: 9 }); voice(t + 0.3, { f0: a * 2.3, f1: a * 2.0, dur: 0.25, vol: 0.12, form: 2200, q: 4, vib: 12 }); },
  // csicsergés (nyuszi / madár)
  chirp() { const t = actx.currentTime; for (let i = 0; i < 3; i++) voice(t + i * 0.11, { f0: 1500 + i * 120, f1: 2500 + i * 100, dur: 0.07, vol: 0.12, form: 3000, q: 8, type: 'triangle' }); },
  // dorombolás (cica): mély, hullámzó zümmögés
  purr() { const c = actx, t = c.currentTime, d = r(1.0, 1.5), o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), l = c.createOscillator(), lg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = r(62, 74); lp.type = 'lowpass'; lp.frequency.value = 380; g.gain.value = 0.0001; l.frequency.value = r(21, 27); lg.gain.value = 0.22; l.connect(lg); lg.connect(g.gain); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + d); o.connect(lp); lp.connect(g); g.connect(bus('animal')); o.start(t); l.start(t); o.stop(t + d + 0.05); l.stop(t + d + 0.05); },
  // vakkantás (kutya / róka): két rövid "vau"
  yip() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.22, { f0: 520, f1: 760, dur: 0.12, vol: 0.2, form: 1100, q: 3 }); },
  // --- az állatok saját hangja (a kertben és etetésnél): mindig ugyanaz a hang tartozik az állathoz ---
  // nyávogás (cica): felcsúszik, aztán hosszan le
  meow() { const t = actx.currentTime, a = r(520, 600); voice(t, { f0: a, f1: a * 1.5, dur: 0.16, vol: 0.2, form: 1500, q: 4 }); voice(t + 0.15, { f0: a * 1.5, f1: a * 0.85, dur: 0.34, vol: 0.2, form: 1300, q: 4, vib: 6 }); },
  // ugatás (kutya): két mély "vau"
  woof() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.26, { f0: r(300, 330), f1: 190, dur: 0.15, vol: 0.26, form: 750, q: 2.5 }); },
  // csaholás (róka): három rövid, magas vakkantás
  foxyip() { const t = actx.currentTime; for (let i = 0; i < 3; i++) voice(t + i * 0.15, { f0: 720 + i * 40, f1: 1050, dur: 0.09, vol: 0.18, form: 1700, q: 4 }); },
  // nyüszögés (nyuszi): két halk, magas "nyiff"
  squeak() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.16, { f0: 1250, f1: 1900, dur: 0.09, vol: 0.13, form: 2600, q: 7, type: 'triangle' }); },
  // brummogás (maci): mély, lassú "brumm-brumm"
  brumm() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.42, { f0: r(118, 128), f1: 88, dur: 0.36, vol: 0.3, form: 430, q: 2, vib: 5 }); },
  // mekegés (panda): remegő, bárányszerű hang
  bleat() { const t = actx.currentTime, a = r(400, 440); voice(t, { f0: a, f1: a * 0.9, dur: 0.5, vol: 0.2, form: 1150, q: 3, vib: 15 }); },
  // hápogás (kacsa): két orrhangú "háp"
  quack() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.2, { f0: r(330, 350), f1: 250, dur: 0.14, vol: 0.24, form: 1100, q: 2.5 }); },
  // brekegés (béka): "bre-ke-ke" – mély, pergő kuruttyolás
  ribbit() { const t = actx.currentTime; for (let g = 0; g < 3; g++) for (let i = 0; i < 2; i++) voice(t + g * 0.19 + i * 0.055, { f0: r(175, 190), f1: 150, dur: 0.05, vol: 0.26, form: 650, q: 4 }); },
  // szuszogás (sün): apró szippantások és egy halk cincogás
  snuffle() { const t = actx.currentTime; for (let i = 0; i < 4; i++) hiss(t + i * 0.09, 0.05, r(2200, 2800), 2, 0.12); voice(t + 0.38, { f0: 1500, f1: 1900, dur: 0.06, vol: 0.06, form: 2400, q: 6, type: 'triangle' }); },
  // kotkodácsolás (tyúk): "kot-kot-kotkodács"
  cluck() { const t = actx.currentTime; for (let i = 0; i < 3; i++) voice(t + i * 0.12, { f0: 520, f1: 470, dur: 0.06, vol: 0.18, form: 1200, q: 3 }); voice(t + 0.4, { f0: 600, f1: 950, dur: 0.24, vol: 0.18, form: 1500, q: 3 }); },
  // cserregés (mókus): gyors, magas pergés
  chitter() { const t = actx.currentTime; for (let i = 0; i < 7; i++) voice(t + i * 0.06, { f0: 2400, f1: 2900, dur: 0.035, vol: 0.11, form: 2800, q: 5, type: 'triangle' }); },
  // huhogás (bagoly): "hu-húú", puha, mély
  hoot() { const t = actx.currentTime; voice(t, { f0: 420, f1: 400, dur: 0.22, vol: 0.32, form: 420, q: 0.7, type: 'sine' }); voice(t + 0.32, { f0: 410, f1: 360, dur: 0.55, vol: 0.32, form: 400, q: 0.7, vib: 5, type: 'sine' }); },
  // cincogás (egér): három nagyon magas, rövid "cin"
  cincin() { const t = actx.currentTime; for (let i = 0; i < 3; i++) voice(t + i * 0.09, { f0: 3200, f1: 3800, dur: 0.05, vol: 0.1, form: 3500, q: 6, type: 'triangle' }); },
  // varázshang (unikornis): csilingelő, felfelé futó hangok és egy halk nyerítés
  magic() { const t = actx.currentTime; [1318.5, 1568, 1975.5, 2637, 3136].forEach((f, i) => voice(t + i * 0.07, { f0: f, f1: f, dur: 0.18, vol: 0.1, form: f * 1.2, q: 1, type: 'triangle' })); voice(t + 0.4, { f0: 900, f1: 700, dur: 0.35, vol: 0.1, form: 1500, q: 3, vib: 10 }); },
  // röfögés (malac): két mély, orrhangú "röf"
  oink() { const t = actx.currentTime; for (let i = 0; i < 2; i++) voice(t + i * 0.2, { f0: r(200, 215), f1: 150, dur: 0.14, vol: 0.27, form: 700, q: 3.5 }); },
  // bégetés (bárány): magas, remegő "bee-ee" (a panda mekegésénél magasabb és gyorsabban remeg)
  baa() { const t = actx.currentTime, a = r(600, 640); voice(t, { f0: a, f1: a * 0.92, dur: 0.32, vol: 0.2, form: 1400, q: 3, vib: 22 }); voice(t + 0.34, { f0: a * 0.95, f1: a * 0.85, dur: 0.4, vol: 0.17, form: 1300, q: 3, vib: 22 }); },
  // csobbanás (teknős): halk "plopp" – a teknős szinte néma állat
  plop() { const t = actx.currentTime; voice(t, { f0: 700, f1: 160, dur: 0.12, vol: 0.26, form: 400, q: 0.5, type: 'sine' }); voice(t + 0.18, { f0: 900, f1: 250, dur: 0.08, vol: 0.14, form: 500, q: 0.5, type: 'sine' }); },
  // nyerítés (póni): lefelé csúszó, remegő "nyihaha"
  neigh() { const t = actx.currentTime; voice(t, { f0: 880, f1: 520, dur: 0.7, vol: 0.2, form: 1500, q: 3, vib: 11 }); voice(t + 0.72, { f0: 520, f1: 600, dur: 0.12, vol: 0.14, form: 1300, q: 3 }); },
  // bőgés (tehén): mély, hosszú "múúú"
  moo() { const t = actx.currentTime; voice(t, { f0: 120, f1: 150, dur: 0.18, vol: 0.2, form: 380, q: 1.8 }); voice(t + 0.16, { f0: 150, f1: 128, dur: 1.0, vol: 0.32, form: 520, q: 1.8, vib: 4 }); },
  // rágcsálás: két rövid roppanás
  munch() { const c = actx, t = c.currentTime; for (let i = 0; i < 2; i++) { const d = 0.06, n = c.createBufferSource(), b = c.createBuffer(1, Math.ceil(c.sampleRate * d), c.sampleRate), ch = b.getChannelData(0); for (let k = 0; k < ch.length; k++) ch[k] = (Math.random() * 2 - 1) * (1 - k / ch.length); n.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = r(1100, 1700); bp.Q.value = 1.5; const g = c.createGain(); g.gain.value = 0.5; n.connect(bp); bp.connect(g); g.connect(bus('animal')); n.start(t + i * 0.11); } },
  // ujjongás: emelkedő hármashangzat (tapsoló csengés)
  yay() { const t = actx.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => voice(t + i * 0.09, { f0: f, f1: f, dur: 0.28, vol: 0.14, form: f * 2, q: 1.2, type: 'triangle' })); },
};
export const HAPPY = ['giggle', 'laugh', 'squeal', 'chirp', 'yay'];
const BY_ANIMAL = {
  '🐱': ['purr', 'squeal', 'giggle'], '🐰': ['chirp', 'giggle', 'squeal'], '🐶': ['yip', 'laugh', 'yay'], '🦊': ['yip', 'giggle', 'laugh'],
  '🐻': ['laugh', 'purr', 'yay'], '🐼': ['giggle', 'chirp', 'laugh'], '🐴': ['squeal', 'laugh', 'yay'], '🐵': ['giggle', 'laugh', 'chirp'],
  '🐭': ['chirp', 'giggle'], '🐔': ['chirp', 'yay'], '🐿️': ['chirp', 'giggle'], '🐮': ['laugh', 'yay'], '🦄': ['yay', 'giggle', 'squeal'],
};
let last = '';
// Boldog hang: pl. happy('🐱') – az állatnak megfelelő, mindig más, mint az előző
export function happy(animal) {
  if (!unlockAudio()) return;
  const pool = (BY_ANIMAL[animal] || HAPPY).filter(k => k !== last); const kind = pool[(Math.random() * pool.length) | 0] || 'yay'; last = kind;
  try { SOUNDS[kind](); } catch (e) {}
  return kind;
}
export function play(kind) { note(kind); if (!unlockAudio()) return; try { SOUNDS[kind]?.(); } catch (e) {} }

// Az állat saját hangja (a kert lakóinak azonosítójával): a cica nyávog, a kutya ugat, a róka csahol,
// a nyuszi nyüszög, a maci brummog, a panda mekeg, a kacsa hápog… Mindenkinek MÁS hangja van.
// happy: a cica utána dorombol is.
export const VOICE = { cat: 'meow', bunny: 'squeak', dog: 'woof', fox: 'foxyip', bear: 'brumm', panda: 'bleat',
  duck: 'quack', frog: 'ribbit', hedgehog: 'snuffle', hen: 'cluck', squirrel: 'chitter', owl: 'hoot', mouse: 'cincin',
  unicorn: 'magic', pig: 'oink', sheep: 'baa', turtle: 'plop', pony: 'neigh', cow: 'moo' };
export function animalVoice(id, { happy: glad = false, defer = setTimeout } = {}) {
  const kind = VOICE[id] || 'yay';
  play(kind);
  if (glad && id === 'cat') defer(() => play('purr'), 520);   // defer: a feladat saját időzítője (megszakítás után nem szól)
  return kind;
}
export const munch = () => play('munch');
// Napló a tesztekhez: mi szólalt meg utoljára (hang nélkül is rögzül)
export const soundLog = [];
// a napló az utolsó 40 hangot tartja meg; a sorszám (n) a tesztnek mutatja, mi szólt egy adott pillanat óta
let soundCount = 0;
export const soundMark = () => soundCount;
function note(kind) { soundLog.push({ kind, n: ++soundCount, at: typeof performance !== 'undefined' ? performance.now() : 0 }); if (soundLog.length > 40) soundLog.shift(); }
export const SOUND_KINDS = Object.keys(SOUNDS);
