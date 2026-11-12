// Közös hangmotor: EGYETLEN AudioContext az egész játéknak. Minden hang buszon megy át:
//   busz (music / sfx / animal / ui) → master hangerő → kompresszor → erősítés → limiter → kimenet.
// Így a zene, az állathangok és a csengések egymáshoz mérve szólnak, és semmi nem torzít.
// A felolvasás (speechSynthesis) NEM megy át ezen: azt a böngésző külön kezeli (lásd voice.js).
import { getScope } from './scope.js';

let ctx = null, master = null, silentEl = null, analyser = null;
const buses = {};
const BUS_GAIN = { music: 1.0, sfx: 0.9, animal: 1.0, ui: 0.7 };
const LEVELS = [0.5, 0.8, 1.0];                 // szülői hangerő: halk / közepes / hangos
let level = 2;
try { const v = +localStorage.getItem('csillagkert_volume'); if (v >= 0 && v <= 2 && localStorage.getItem('csillagkert_volume') !== null) level = v; } catch (e) {}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// A lánc felépítése egy adott (élő vagy offline) kontextusra. Tesztben OfflineAudioContext-tel is használható.
export function buildChain(c) {
  const out = c.createGain(); out.gain.value = LEVELS[level];
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.22;
  const makeup = c.createGain(); makeup.gain.value = 1.7;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.1;
  // Végső biztosíték: puha vágás. 0,75 alatt érintetlen a jel, fölötte lágyan simul 1,0 alá, így sosem torzít durván.
  const soft = c.createWaveShaper(), N = 2048, curve = new Float32Array(N);
  for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * 4 - 2, a = Math.abs(x); curve[i] = Math.sign(x) * (a < 0.75 ? a : 0.75 + 0.24 * Math.tanh((a - 0.75) / 0.24)); }
  soft.curve = curve;
  const pre = c.createGain(); pre.gain.value = 0.5; const post = c.createGain(); post.gain.value = 1;   // a görbe −2..2 tartományra készült
  // (a WaveShaper a bemenetet −1..1 közé várja: felezzük előtte, és a görbe a kétszeres értékkel számol)
  out.connect(comp); comp.connect(makeup); makeup.connect(limiter); limiter.connect(pre); pre.connect(soft); soft.connect(post); post.connect(c.destination);
  const b = {};
  for (const k of Object.keys(BUS_GAIN)) { b[k] = c.createGain(); b[k].gain.value = BUS_GAIN[k]; b[k].connect(out); }
  return { out, buses: b, tail: post };
}

// A kontextus (ha kell, létrehozza). Null, ha a böngésző nem tud hangot adni.
export function audio() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const chain = buildChain(ctx); master = chain.out; Object.assign(buses, chain.buses);
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; chain.tail.connect(analyser);
    ctx.addEventListener?.('statechange', () => { if (ctx.state !== 'running' && document.visibilityState === 'visible') ctx.resume().catch(() => {}); });
  } catch (e) { ctx = null; }
  return ctx;
}

// Felhasználói koppintásból kell hívni (iOS): elindítja a hangot, és beállítja, hogy a néma kapcsoló mellett is szóljon.
export function unlock() {
  const c = audio(); if (!c) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  // Régebbi iOS (nincs audioSession): egy hangtalan, ismétlődő <audio> elem "lejátszás" módba teszi az oldalt.
  if (!navigator.audioSession && isIOS() && !silentEl) {
    try {
      silentEl = document.createElement('audio'); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); silentEl.src = silentWavUrl();
      silentEl.play().catch(() => {});
    } catch (e) { silentEl = null; }
  }
  return c;
}
function silentWavUrl() {             // 0,5 mp csend, 8 kHz, 8 bit mono WAV
  const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
// Bármely érintés és a lapra visszatérés újraéleszti a hangot (iOS "interrupted" állapot, háttérből visszatérés)
if (typeof document !== 'undefined') {
  const wake = () => { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); };
  document.addEventListener('pointerdown', wake, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
}

export const bus = (name = 'sfx') => (audio(), buses[name] || buses.sfx || null);
export const now = () => (ctx ? ctx.currentTime : 0);
export const getLevel = () => level;
export function setLevel(i) { level = Math.max(0, Math.min(2, i | 0)); try { localStorage.setItem('csillagkert_volume', String(level)); } catch (e) {} if (master && ctx) master.gain.setTargetAtTime(LEVELS[level], ctx.currentTime, 0.05); }
export const isRunning = () => !!ctx && ctx.state === 'running';
// A kimenet pillanatnyi szintje (0..1 RMS) – a szülői hangpróbához és a tesztekhez
export function outputLevel() {
  if (!analyser) return 0;
  const d = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(d);
  let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
  return Math.sqrt(s / d.length);
}

// ---------- hangszerek ----------
// A kis hangszóró a mély, tiszta hangot alig adja vissza, ezért minden hang felharmonikusokból épül,
// és a mélyebb hangok arányosan több erősítést kapnak.
const loudnessFor = f => Math.max(1, Math.min(3, Math.pow(800 / f, 0.75)));
const INSTRUMENTS = {
  // zongora-szerű: gazdag felhangok, kitartott hang
  piano: { partials: [[1, 1], [2, 0.6], [3, 0.38], [4, 0.24], [5, 0.14], [6, 0.08]], attack: 0.008, hold: 0.7, type: 'sine', click: 0.25 },
  // harangjáték: csengő, nem egész számú felhangok
  bell: { partials: [[1, 1], [2.76, 0.5], [5.4, 0.28], [8.93, 0.12]], attack: 0.004, hold: 0.45, type: 'sine', click: 0.35 },
  // marimba: fás, rövid
  marimba: { partials: [[1, 1], [4, 0.35], [10, 0.1]], attack: 0.004, hold: 0.3, type: 'sine', click: 0.5 },
  // furulya: lágy, lassabb felfutás, kis vibrato
  flute: { partials: [[1, 1], [2, 0.32], [3, 0.12]], attack: 0.06, hold: 0.85, type: 'sine', click: 0, vib: 5 },
};

// Egy hang beütemezése tetszőleges kontextusra (élő vagy offline). vol: 0..1 (1 = hangos), dur: mp.
export function scheduleNote(c, dest, freq, { dur = 1, vol = 0.8, inst = 'piano', when = 0 } = {}) {
  const I = INSTRUMENTS[inst] || INSTRUMENTS.piano, t = c.currentTime + when;
  const peak = 0.32 * vol * loudnessFor(freq);
  const env = c.createGain();
  const rel = Math.min(0.28, dur * 0.3), susEnd = Math.max(t + I.attack + 0.02, t + dur - rel);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(peak, t + I.attack);
  env.gain.setTargetAtTime(peak * I.hold, t + I.attack, Math.max(0.05, dur * 0.18));   // lassan a kitartott szintre
  env.gain.setTargetAtTime(0.0001, susEnd, rel / 4);                                     // lecsengés
  env.connect(dest);
  const sum = I.partials.reduce((s, p) => s + p[1], 0);
  for (const [ratio, g] of I.partials) {
    const f = freq * ratio; if (f > 9000) continue;
    const o = c.createOscillator(), og = c.createGain();
    o.type = I.type; o.frequency.value = f; og.gain.value = g / sum * 1.6;
    if (I.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = I.vib; lg.gain.value = f * 0.006; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.4); }
    o.connect(og); og.connect(env); o.start(t); o.stop(t + dur + 0.4);
  }
  if (I.click) {                                    // rövid "kalapács" koppanás: ettől ütős és jól hallható a hang eleje
    const n = c.createBufferSource(), len = Math.ceil(c.sampleRate * 0.012), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(6000, freq * 4); bp.Q.value = 0.8;
    const ng = c.createGain(); ng.gain.value = peak * I.click;
    n.buffer = b; n.connect(bp); bp.connect(ng); ng.connect(dest); n.start(t);
  }
  return dur;
}

const hang = () => new Promise(() => {});
// Hang megszólaltatása az élő motoron. A visszaadott ígéret a hang végén teljesül (megszakított feladatnál soha).
export function playNote(freq, opts = {}) {
  const scope = getScope(); if (scope?.aborted) return hang();
  const c = audio(), dur = opts.dur ?? 1;
  if (c) { try { scheduleNote(c, bus(opts.bus || 'music'), freq, opts); } catch (e) {} }
  return new Promise(r => setTimeout(() => { if (!scope?.aborted) r(); }, (dur + (opts.when || 0)) * 1000));
}
// Rövid csengés (jelzőhang): háromszög + felhang, gyors lecsengés
export function ding(freq = 660, { dur = 0.25, vol = 0.6, bus: b = 'sfx', when = 0, glide = 0 } = {}) {
  const c = audio(); if (!c) return;
  try {
    const t = c.currentTime + when, g = c.createGain(), peak = 0.3 * vol * loudnessFor(freq);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.006); g.gain.setTargetAtTime(0.0001, t + dur * 0.35, dur * 0.22);
    g.connect(bus(b));
    for (const [ratio, a, type] of [[1, 1, 'triangle'], [2, 0.35, 'sine'], [3, 0.15, 'sine']]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; og.gain.value = a;
      if (glide) { o.frequency.setValueAtTime(freq * ratio * glide, t); o.frequency.exponentialRampToValueAtTime(freq * ratio, t + 0.06); } else o.frequency.value = freq * ratio;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.3);
    }
  } catch (e) {}
}
// Taps hangja (szűrt zaj-löket)
export function clap({ vol = 0.8, when = 0 } = {}) {
  const c = audio(); if (!c) return;
  try {
    const t = c.currentTime + when, len = Math.ceil(c.sampleRate * 0.09), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) { const k = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.2) * (k < 0.12 || (k > 0.18 && k < 0.3) || k > 0.36 ? 1 : 0.2); }
    const n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7; g.gain.value = 0.9 * vol;
    n.buffer = b; n.connect(bp); bp.connect(g); g.connect(bus('sfx')); n.start(t);
  } catch (e) {}
}
