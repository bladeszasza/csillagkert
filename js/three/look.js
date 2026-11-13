// Közös 3D-megjelenés (M5/3): minden jelenet ugyanazt a fényt és anyagot használja (puha, pasztell „diorama"),
// és egy közös minőség-figyelő dönt a felbontásról. Kontúr nincs (megduplázná a háromszögeket), árnyéktérkép
// és utófeldolgozás sincs (iPad-barát). A figurák alatti puha foltárnyék a karakter-kötegben van (characters.js).
import * as THREE from '../../vendor/three.module.js';

// --- anyag: matt (Lambert), minden figurán és tereptárgyon ugyanaz ---
// A toon-árnyalást (háromlépcsős színátmenet) kipróbáltuk ugyanazokon a jeleneteken: a fehér és pasztell figurák
// szürkévé fakultak (a fehér unikornis bézs lett), ezért maradt a matt anyag. Ha később mégis kell, itt egy helyen cserélhető.
export const mat = (params = {}) => new THREE.MeshLambertMaterial(params);

// --- fény: égbolt + a föld felől visszavert szín + nap. A föld színe jelenetenként más (rét, felhő, lila pálya),
// az ég, a nap színe és az erősségek mindenhol azonosak. ---
export const SKY = 0xffffff, SUN = 0xfff2d0, HEMI = 1.5, SUN_I = 1.6;
export function addLights(scene, { ground = 0xcfe8b8, sunAt = [4, 8, 5] } = {}) {
  const hemi = new THREE.HemisphereLight(SKY, ground, HEMI);
  const sun = new THREE.DirectionalLight(SUN, SUN_I); sun.position.set(...sunAt);
  scene.add(hemi, sun);
  return { hemi, sun };
}

// --- automatikus minőség: ha a képkocka-idő tartósan 20 ms fölött van, a felbontás egy lépcsővel csökken ---
// Tiszta függvény (Node-teszt: tests/quality.test.mjs). A kiugró képkockákat (rejtett lap, szemétgyűjtés, a
// szoftveres rajzolás elakadása) nem veszi figyelembe; visszafelé nem lép (nem ugrál a felbontás).
// Minden lépcső után 2 mp-ig méri, segített-e: ha a képkocka nem lett legalább 15%-kal rövidebb (a lassúság oka nem a
// felbontás, hanem pl. a sok háromszög vagy egy 30 fps-es energiatakarékos mód), visszalép, és többé nem nyúl hozzá.
export const Q = { target: 20, spike: 250, hold: 3000, judge: 2000, gain: 0.85, step: 0.25, min: 1 };
export function stepQuality(s, dtMs, o = Q) {
  if (s.locked || !(dtMs > 0) || dtMs > o.spike) return s;
  const ema = s.ema == null ? dtMs : s.ema * 0.9 + dtMs * 0.1;
  if (s.trial) {                                         // az utolsó lépcső próbaideje: segített-e?
    const t = s.trial.t + dtMs;
    if (t < o.judge) return { ...s, ema, trial: { ...s.trial, t } };
    if (ema > s.trial.ema0 * o.gain) return { ...s, ratio: s.trial.from, ema: null, slowFor: 0, trial: null, locked: true };
    return { ...s, ema, slowFor: 0, trial: null };
  }
  if (s.ratio <= o.min) return s;
  const slowFor = ema > o.target ? s.slowFor + dtMs : 0;
  if (slowFor < o.hold) return { ...s, ema, slowFor };
  return { ...s, ratio: Math.max(o.min, Math.round((s.ratio - o.step) * 100) / 100), ema: null, slowFor: 0, drops: s.drops + 1, trial: { from: s.ratio, ema0: ema, t: 0 } };
}
export const startQuality = (dpr, max) => ({ ratio: Math.max(1, Math.min(dpr || 1, max)), ema: null, slowFor: 0, drops: 0, trial: null, locked: false });

// Egy renderelő felbontásának egyetlen gazdája: a jelenet csak tick()-et hív képkockánként (vagy a rajzoláskor).
export function createQuality(renderer, { max = 2 } = {}) {
  let s = startQuality(globalThis.devicePixelRatio, max), last = 0;
  renderer.setPixelRatio(s.ratio);
  return {
    tick(dtMs) {
      if (dtMs == null) { const now = performance.now(); dtMs = last ? now - last : 0; last = now; }
      const n = stepQuality(s, dtMs);
      if (n.ratio !== s.ratio) renderer.setPixelRatio(n.ratio);
      s = n;
    },
    state: () => s,
    ratio: () => renderer.getPixelRatio(),
  };
}
