// Magyar felolvasás egyetlen helyen. A böngésző speechSynthesis API-ját használja.
// iPaden az első hangot felhasználói koppintásnak kell elindítania (lásd main.js: start-gomb).
// A hang "Rozi, a robot" szájából szól: a kissé gépies hangzás így a karakter része.
import { progress } from './progress.js';
import { getScope } from './scope.js';

let voice = null;
let enabled = true;
let muted = false;
let lastText = '';
let speakingNow = false;
let token = 0;                 // minden új mondat érvényteleníti az előzőt
let keepAlive = null;          // hivatkozás a futó felolvasásra (különben egyes böngészők idő előtt eldobják)
let repeatHandler = null;      // a futó feladat saját "mondd újra" művelete (pl. a zenénél a hangot is újrajátssza)
const listeners = new Set();
const moodListeners = new Set();
export function onMood(cb) { moodListeners.add(cb); return () => moodListeners.delete(cb); }

const isHu = v => (v.lang || '').toLowerCase().replace('_', '-').startsWith('hu');
// A jobb minőségű (prémium / továbbfejlesztett) hangot részesítjük előnyben
const quality = v => { const n = `${v.name || ''} ${v.voiceURI || ''}`; return (/premium|prémium/i.test(n) ? 4 : 0) + (/enhanced|továbbfejlesztett|javított/i.test(n) ? 2 : 0) + (v.localService ? 1 : 0) - (/compact/i.test(n) ? 1 : 0); };

export function listHuVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(isHu).sort((a, b) => quality(b) - quality(a));
}

function pickVoice() {
  const hu = listHuVoices();
  const saved = progress.device.get().voiceURI;       // a hangválasztás az eszközé, nem a gyereké
  voice = hu.find(v => v.voiceURI === saved) || hu[0] || null;
  return voice;
}

if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasHungarianVoice() { return !!(voice || pickVoice()); }
export function currentVoiceName() { return (voice || pickVoice())?.name || ''; }
export function chooseVoice(uri) { progress.device.set({ voiceURI: uri || '' }); pickVoice(); }
export function setVoiceEnabled(v) { enabled = v; }
// A robot szájmozgatásához: cb(true) beszéd indulásakor, cb(false) végén
export function onSpeaking(cb) { listeners.add(cb); return () => listeners.delete(cb); }
const emit = v => { speakingNow = v; listeners.forEach(cb => { try { cb(v); } catch (e) {} }); };

// Kiejtési korrekciók (csak ha egy hang tévesen ejt valamit). Szülői hangpróba: "csillag, tyúk, szék".
// A hangok eszközönként eltérnek, ezért csak keveset javítunk vakon; bővíthető: [minta, helyettesítés].
export const LEXICON = [
  [/csillag/gi, 'csil-lag'],   // a kettőzött l hallható legyen
];

// Szövegtisztítás beszédhez: emoji ki (különben "kör pirosan..."-ként olvassa), kiejtési szótár be
export function forSpeech(text) {
  let t = String(text).replace(/\p{Extended_Pictographic}|️|‍|[⃣]/gu, ' ').replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [re, rep] of LEXICON) t = t.replace(re, rep);
  return t;
}
// Hosszú szöveg mondatokra bontva megy (egyes hangok a hosszú szöveget levágják), kb. 140 betűs darabokban
export function chunks(text) {
  const parts = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text], out = [];
  for (const p of parts) { const s = p.trim(); if (!s) continue; if (out.length && (out[out.length - 1] + ' ' + s).length <= 140) out[out.length - 1] += ' ' + s; else out.push(s); }
  return out;
}

const SPEECH_VOL = [0.6, 0.8, 1.0];              // szülői beállítás: a beszéd hangereje
const speechVol = () => SPEECH_VOL[progress.device.get().speechVol ?? 1] ?? 0.8;
const hang = () => new Promise(() => {});

// Kimondja a szöveget. Ha nincs magyar hang, nem mond semmit (a feladatok képileg is megoldhatók).
// Megszakított feladatban (X) nem szólal meg, és az ígérete soha nem teljesül: a feladat ott megáll.
export function setMuted(v) { muted = !!v; }
export function say(text, { rate = 0.85, remember = true } = {}) {
  const scope = getScope();
  if (scope?.aborted) return hang();
  if (muted) return Promise.resolve();
  if (remember) lastText = text;
  moodListeners.forEach(cb => { try { cb(text); } catch (e) {} });
  if (!enabled || !('speechSynthesis' in window)) return Promise.resolve();
  if (!voice && !pickVoice()) return Promise.resolve();
  const parts = chunks(forSpeech(text));
  if (!parts.length) return Promise.resolve();
  const my = ++token;
  return new Promise(resolve => {
    let done = false, i = 0;
    const finish = () => { if (done) return; done = true; if (my === token) emit(false); if (!scope?.aborted) resolve(); };
    const synth = window.speechSynthesis;
    const next = () => {
      if (done) return;
      if (my !== token || scope?.aborted || muted || i >= parts.length) return finish();
      try {
        const u = new SpeechSynthesisUtterance(parts[i++]); keepAlive = u;
        u.voice = voice; u.lang = voice.lang || 'hu-HU'; u.rate = rate; u.pitch = 1.1; u.volume = speechVol();
        let ended = false;
        const end = () => { if (ended) return; ended = true; clearTimeout(guard); next(); };
        u.onstart = () => { if (my === token) emit(true); };
        u.onend = u.onerror = end;
        const guard = setTimeout(end, 2500 + u.text.length * 120);   // ha a vége-jelzés nem érkezik meg, ne ragadjon el
        synth.speak(u);
      } catch (e) { finish(); }
    };
    let busy = false;
    try { busy = synth.speaking || synth.pending; synth.cancel(); } catch (e) {}
    if (busy) setTimeout(next, 70); else next();    // megszakítás után rövid szünet: egyes rendszerek különben elnyelik az új mondatot
  });
}

// "Mondd újra": a feladat saját művelete, ha van; különben az utolsó mondat. Ha Rozi épp beszél, nem vág a szavába.
export function setRepeatHandler(fn) { repeatHandler = fn || null; }
export function repeatLast() {
  if (speakingNow) return Promise.resolve();
  if (repeatHandler) { try { return Promise.resolve(repeatHandler()); } catch (e) { return Promise.resolve(); } }
  return lastText ? say(lastText, { remember: false }) : Promise.resolve();
}

export function stopSpeaking() { token++; try { window.speechSynthesis?.cancel(); } catch (e) {} emit(false); }
