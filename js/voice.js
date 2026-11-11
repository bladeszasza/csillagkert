// Magyar felolvasás egyetlen helyen. A böngésző speechSynthesis API-ját használja.
// iPaden az első hangot felhasználói koppintásnak kell elindítania (lásd main.js: start-gomb).

let voice = null;
let enabled = true;
let lastText = '';

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const all = window.speechSynthesis.getVoices();
  const hu = all.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith('hu'));
  voice = hu[0] || null;
  return voice;
}

if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasHungarianVoice() { return !!(voice || pickVoice()); }
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
