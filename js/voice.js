// Magyar felolvasás egyetlen helyen. A böngésző speechSynthesis API-ját használja.
// iPaden az első hangot felhasználói koppintásnak kell elindítania (lásd main.js: start-gomb).
import { progress } from './progress.js';

let voice = null;
let enabled = true;
let lastText = '';

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
export function chooseVoice(uri) { progress.set({ voiceURI: uri || '' }); pickVoice(); }
export function setVoiceEnabled(v) { enabled = v; }

// Kimondja a szöveget. Ha nincs magyar hang, nem mond semmit (a feladatok képileg is megoldhatók).
export function say(text, { rate = 0.85, remember = true } = {}) {
  if (remember) lastText = text;
  if (!enabled || !('speechSynthesis' in window)) return Promise.resolve();
  if (!voice && !pickVoice()) return Promise.resolve();
  return new Promise(resolve => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang || 'hu-HU'; u.rate = rate; u.pitch = 1.1;
      u.onend = u.onerror = () => resolve();
      synth.speak(u);
      setTimeout(resolve, 8000); // ha az onend nem érkezik meg, ne ragadjon el
    } catch (e) { resolve(); }
  });
}

export function repeatLast() { return lastText ? say(lastText, { remember: false }) : Promise.resolve(); }
