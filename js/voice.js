// Magyar felolvasás egyetlen helyen. A böngésző speechSynthesis API-ját használja.
// iPaden az első hangot felhasználói koppintásnak kell elindítania (lásd main.js: start-gomb).
// A hang "Rozi, a robot" szájából szól: a kissé gépies hangzás így a karakter része.
import { progress } from './progress.js';

let voice = null;
let enabled = true;
let muted = false;
let lastText = '';
const listeners = new Set();
const moodListeners = new Set();
export function onMood(cb) { moodListeners.add(cb); return () => moodListeners.delete(cb); }

const isHu = v => (v.lang || '').toLowerCase().replace('_', '-').startsWith('hu');

export function listHuVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(isHu);
}

function pickVoice() {
  const hu = listHuVoices();
  const saved = progress.get().voiceURI;
  voice = hu.find(v => v.voiceURI === saved) || hu[0] || null;
  return voice;
}

if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasHungarianVoice() { return !!(voice || pickVoice()); }
export function currentVoiceName() { return (voice || pickVoice())?.name || ''; }
export function chooseVoice(uri) { progress.set({ voiceURI: uri || '' }); pickVoice(); }
export function setVoiceEnabled(v) { enabled = v; }
// A robot szájmozgatásához: cb(true) beszéd indulásakor, cb(false) végén
export function onSpeaking(cb) { listeners.add(cb); return () => listeners.delete(cb); }
const emit = v => listeners.forEach(cb => { try { cb(v); } catch (e) {} });

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

// Kimondja a szöveget. Ha nincs magyar hang, nem mond semmit (a feladatok képileg is megoldhatók).
export function setMuted(v) { muted = !!v; }
export function say(text, { rate = 0.85, remember = true } = {}) {
  if (muted) return Promise.resolve();
  if (remember) lastText = text;
  moodListeners.forEach(cb => { try { cb(text); } catch (e) {} });
  if (!enabled || !('speechSynthesis' in window)) return Promise.resolve();
  if (!voice && !pickVoice()) return Promise.resolve();
  const spoken = forSpeech(text);
  if (!spoken) return Promise.resolve();
  return new Promise(resolve => {
    let ended = false;
    const finish = () => { if (ended) return; ended = true; emit(false); resolve(); };
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.voice = voice; u.lang = voice.lang || 'hu-HU'; u.rate = rate; u.pitch = 1.25;
      u.onstart = () => emit(true);
      u.onend = u.onerror = finish;
      synth.speak(u);
      setTimeout(finish, 9000); // ha az onend nem érkezik meg, ne ragadjon el
    } catch (e) { finish(); }
  });
}

export function repeatLast() { return lastText ? say(lastText, { remember: false }) : Promise.resolve(); }

export function stopSpeaking() { try { window.speechSynthesis?.cancel(); } catch (e) {} emit(false); }
