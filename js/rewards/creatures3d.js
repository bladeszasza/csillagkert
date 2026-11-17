// A Varázsvilág varázslényei (M7/4): saját tervezésű, kerek, kedves figurák. Mindegyik egyetlen összeolvasztott,
// csúcsszínes test (egy rajzolási hívás). buildCreature(fajta) → geometria; a talpa az y = 0 síkon áll, előre (−z) néz.
import * as THREE from '../../vendor/three.module.js';
import { merge, part } from '../geo.js';

const S = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const EYE = 0x2a1f45, SHINE = 0xffffff, CHEEK = 0xffa8c8;
// két szem csillanással és pirospozsgás arc: a fej közepe (x, y, z), a fej sugara r
function face(p, y, z, r, cheeks = true) {
  for (const s of [-1, 1]) {
    p.push(part(S(r * 0.17, 8, 6), EYE, [s * r * 0.38, y + r * 0.12, z - r * 0.86]));
    p.push(part(S(r * 0.06, 6, 4), SHINE, [s * r * 0.38 + r * 0.05, y + r * 0.2, z - r * 0.99]));
    if (cheeks) p.push(part(S(r * 0.14, 8, 6), CHEEK, [s * r * 0.62, y - r * 0.12, z - r * 0.72], [0, 0, 0], [1, 0.6, 0.5]));
  }
}

const BUILD = {
  // Felhőbárány: bodros, fehér felhő-test, sötét kis arc, rövid lábak, a fején kis felhőpamacs
  barany() {
    const p = [], W = 0xffffff;
    for (const [x, y, z, r] of [[0, 0.75, 0, 0.55], [0.38, 0.8, 0.15, 0.4], [-0.38, 0.8, 0.15, 0.4], [0, 0.95, 0.35, 0.42], [0.3, 0.7, -0.25, 0.38], [-0.3, 0.7, -0.25, 0.38], [0, 1.15, 0, 0.36]]) p.push(part(S(r), W, [x, y, z]));
    for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.3], [0.25, 0.3]]) p.push(part(new THREE.CylinderGeometry(0.08, 0.09, 0.4, 6), 0x5a4a6a, [x, 0.2, z]));
    p.push(part(S(0.3), 0x6a5a7a, [0, 0.95, -0.55], [0, 0, 0], [1, 0.95, 0.9]));
    for (const s of [-1, 1]) p.push(part(S(0.1, 6, 5), 0x6a5a7a, [s * 0.32, 1.02, -0.5], [0, 0, s * 0.6], [1.6, 0.6, 0.8]));
    face(p, 0.95, -0.55, 0.3, false);
    p.push(part(S(0.15), 0xd8ecff, [0.05, 1.3, -0.45]), part(S(0.12), 0xd8ecff, [-0.13, 1.28, -0.42]));
    return merge(p);
  },
  // Gombatündér: kis barack színű tündér, a fején piros-fehér pöttyös gombakalap, áttetsző kék szárnyakkal
  tunder() {
    const p = [];
    p.push(part(new THREE.CylinderGeometry(0.2, 0.32, 0.55, 10), 0x8fe0c0, [0, 0.42, 0]));
    p.push(part(S(0.3), 0xffd9b8, [0, 0.92, 0]));
    face(p, 0.9, 0, 0.3);
    p.push(part(S(0.46, 12, 8), 0xf2545b, [0, 1.22, 0.04], [0, 0, 0], [1, 0.5, 1]));
    for (const [x, z] of [[0.25, -0.3], [-0.3, -0.15], [0.05, 0.38], [-0.12, -0.42], [0.36, 0.12]]) p.push(part(S(0.08, 6, 4), 0xffffff, [x, 1.4, z]));
    for (const s of [-1, 1]) p.push(part(S(0.32, 8, 6), 0xbff0ff, [s * 0.35, 0.65, 0.18], [0, s * 0.5, s * 0.35], [1, 1.3, 0.12]));
    for (const s of [-1, 1]) p.push(part(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 6), 0xffd9b8, [s * 0.11, 0.08, 0]));
    return merge(p);
  },
  // Csillagszarvas: világosbarna kis szarvas, fehér pöttyökkel, arany agancs, az ágain kis csillagok
  szarvas() {
    const p = [], B = 0xd9a46a, D = 0x9a6a3a, GOLD = 0xffd84a;
    p.push(part(S(0.42), B, [0, 0.95, 0.05], [0, 0, 0], [0.9, 0.85, 1.35]));
    for (const [x, z] of [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.45], [0.2, 0.45]]) p.push(part(new THREE.CylinderGeometry(0.06, 0.07, 0.75, 6), D, [x, 0.38, z]));
    p.push(part(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 8), B, [0, 1.3, -0.42], [0.5, 0, 0]));
    p.push(part(S(0.27), B, [0, 1.58, -0.58]));
    p.push(part(S(0.12, 8, 6), 0xf0d0b0, [0, 1.5, -0.82], [0, 0, 0], [1, 0.8, 1]));
    face(p, 1.6, -0.6, 0.27);
    for (const s of [-1, 1]) {
      p.push(part(S(0.1, 6, 5), B, [s * 0.27, 1.72, -0.52], [0, 0, s * 0.6], [1.6, 0.6, 0.6]));
      p.push(part(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 5), GOLD, [s * 0.14, 1.98, -0.55], [0, 0, -s * 0.35]));
      p.push(part(new THREE.CylinderGeometry(0.025, 0.03, 0.25, 5), GOLD, [s * 0.28, 2.0, -0.55], [0, 0, -s * 1.0]));
      p.push(part(new THREE.OctahedronGeometry(0.09), 0xfff3a0, [s * 0.24, 2.24, -0.55]), part(new THREE.OctahedronGeometry(0.07), 0xfff3a0, [s * 0.4, 2.08, -0.55]));
    }
    for (const [x, z] of [[0.2, 0.0], [-0.22, 0.2], [0.12, 0.45], [-0.1, -0.2]]) p.push(part(S(0.05, 6, 4), 0xffffff, [x, 1.25, z]));
    p.push(part(S(0.1, 6, 5), 0xffffff, [0, 1.05, 0.62]));
    return merge(p);
  },
  // Kristálypillangó: nagy, jégkék és rózsaszín szárnyú pillangó, lila testtel, csápokkal
  pillango() {
    const p = [];
    p.push(part(new THREE.CylinderGeometry(0.09, 0.07, 0.8, 8), 0x7a5ac8, [0, 1.0, 0], [Math.PI / 2, 0, 0]));
    p.push(part(S(0.17), 0x8e6ad8, [0, 1.05, -0.45]));
    face(p, 1.06, -0.45, 0.17, false);
    for (const s of [-1, 1]) {
      p.push(part(S(0.5, 10, 6), 0x9bf0ff, [s * 0.45, 1.3, -0.12], [0, 0, s * 0.7], [1, 0.12, 0.8]));
      p.push(part(S(0.36, 10, 6), 0xffc0e8, [s * 0.38, 1.15, 0.3], [0, 0, s * 0.6], [1, 0.12, 0.8]));
      p.push(part(S(0.1, 6, 4), 0xffffff, [s * 0.58, 1.45, -0.2], [0, 0, s * 0.7], [1, 0.3, 1]));
      p.push(part(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), 0x3b2a63, [s * 0.08, 1.3, -0.55], [-0.5, 0, -s * 0.4]));
      p.push(part(S(0.04, 6, 4), 0xffd84a, [s * 0.15, 1.45, -0.64]));
    }
    return merge(p);
  },
  // Parázs, a kis sárkány: kerek, narancsvörös kis sárkány sárga pocakkal, kis szárnyakkal, szarvacskákkal, farokkal
  sarkany() {
    const p = [], R = 0xff7a4a, Y = 0xffd27a;
    p.push(part(S(0.45), R, [0, 0.62, 0.05], [0, 0, 0], [1, 0.95, 1.1]));
    p.push(part(S(0.32), Y, [0, 0.55, -0.22], [0, 0, 0], [1, 1.1, 0.6]));
    p.push(part(S(0.34), R, [0, 1.15, -0.2]));
    face(p, 1.17, -0.2, 0.34);
    p.push(part(S(0.14, 8, 6), 0xffa070, [0, 1.06, -0.5], [0, 0, 0], [1.3, 0.8, 1]));
    for (const s of [-1, 1]) {
      p.push(part(new THREE.ConeGeometry(0.07, 0.24, 6), Y, [s * 0.16, 1.48, -0.14], [0, 0, -s * 0.3]));
      p.push(part(new THREE.ConeGeometry(0.28, 0.5, 4), 0xffb07a, [s * 0.45, 0.95, 0.2], [0, 0, -s * 1.2], [1, 1, 0.25]));
      p.push(part(S(0.13, 8, 6), R, [s * 0.22, 0.18, -0.05]));
    }
    p.push(part(new THREE.ConeGeometry(0.17, 0.75, 8), R, [0, 0.45, 0.62], [-1.2, 0, 0]));
    p.push(part(new THREE.OctahedronGeometry(0.1), Y, [0, 0.3, 0.98]));
    return merge(p);
  },
};

export const CREATURE_KINDS = Object.keys(BUILD);
const cache = new Map();
// A geometria fajtánként egyszer készül (a lények osztoznak rajta); disposeCreatureGeos() a játék végén felszabadítja.
export function creatureGeo(kind) {
  if (!cache.has(kind)) cache.set(kind, (BUILD[kind] || BUILD.barany)());
  return cache.get(kind);
}
export function disposeCreatureGeos() { for (const g of cache.values()) g.dispose(); cache.clear(); }
