// A Varázsvilág nevezetességei (M7): mindegyik egyetlen összeolvasztott, csúcsszínes test (egy rajzolási hívás),
// saját tervezésű. buildLandmark(fajta) → { geo, colliders }; a helyek a nevezetesség közepéhez képest értendők.
// Ütközők: solid = kikerülendő (mint a fa törzse); a nem solid alacsony kő, amire fel lehet ugrani.
import * as THREE from '../../vendor/three.module.js';
import { merge, part } from '../geo.js';

const STONE = 0xcfc6e0, WOOD = 0x8a5a3c, GOLD = 0xffd84a, WATER = 0x6fc8ff;
const LAMPS = [0xff8fc8, 0xffcf3f, 0x9bb8ff, 0xff9f43, 0x8fe08f, 0xffffff];
const RAINBOW = [0xff5d5d, 0xffa53d, 0xffe14d, 0x6fd36f, 0x5aa9ff];

const BUILD = {
  // Csillagkút: kőkáva, benne víz úszó csillagokkal, fölötte kis tető, a csúcsán csillag
  kut() {
    const p = [
      part(new THREE.CylinderGeometry(1.25, 1.35, 0.9, 12), STONE, [0, 0.45, 0]),
      part(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 12), WATER, [0, 0.9, 0]),
      part(new THREE.CylinderGeometry(0.09, 0.09, 1.9, 6), WOOD, [-1.15, 1.75, 0]),
      part(new THREE.CylinderGeometry(0.09, 0.09, 1.9, 6), WOOD, [1.15, 1.75, 0]),
      part(new THREE.ConeGeometry(1.75, 0.95, 4), 0xff8fc8, [0, 3.1, 0], [0, Math.PI / 4, 0]),
      part(new THREE.OctahedronGeometry(0.36), GOLD, [0, 3.85, 0]),
    ];
    for (const [x, z] of [[0.35, 0.2], [-0.4, 0.1], [0.05, -0.45]]) p.push(part(new THREE.OctahedronGeometry(0.15), GOLD, [x, 0.99, z], [0, x * 3, 0], [1, 0.45, 1]));
    return { geo: merge(p), colliders: [{ x: 0, z: 0, r: 1.4, h: 99, solid: true }] };
  },
  // Ősi kőkör: hat álló kő körben, középen lapos kő, rajta világító kristály
  kokor() {
    const p = [part(new THREE.CylinderGeometry(1.1, 1.2, 0.3, 8), STONE, [0, 0.15, 0]), part(new THREE.OctahedronGeometry(0.34), 0x9bf0ff, [0, 0.78, 0], [0, 0.4, 0], [1, 1.5, 1])];
    const colliders = [{ x: 0, z: 0, r: 1.2, h: 0.3, solid: false }];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + 0.3, x = Math.sin(a) * 4.2, z = Math.cos(a) * 4.2, h = 1.9 + (i % 3) * 0.35;
      p.push(part(new THREE.BoxGeometry(0.95, h, 0.6), i % 2 ? 0xb8b0c8 : 0xc6bed6, [x, h / 2, z], [0, a, 0]));
      colliders.push({ x, z, r: 0.62, h: 99, solid: true });
    }
    return { geo: merge(p), colliders };
  },
  // Varázsfa: vastag törzs, lila-rózsaszín lomb, az ágakon színes lámpások
  fa() {
    const p = [
      part(new THREE.CylinderGeometry(0.55, 0.8, 3.2, 9), WOOD, [0, 1.6, 0]),
      part(new THREE.SphereGeometry(2.0, 12, 9), 0xc9a0ff, [0, 4.3, 0], [0, 0, 0], [1, 0.85, 1]),
      part(new THREE.SphereGeometry(1.35, 10, 8), 0xff9fd0, [1.35, 3.75, 0.4]),
      part(new THREE.SphereGeometry(1.3, 10, 8), 0xb48cff, [-1.3, 3.85, -0.3]),
    ];
    LAMPS.forEach((c, i) => {
      const a = i * Math.PI / 3, x = Math.sin(a) * 1.9, z = Math.cos(a) * 1.9;
      p.push(part(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 4), WOOD, [x, 2.95, z]), part(new THREE.SphereGeometry(0.24, 8, 6), c, [x, 2.6, z]));
    });
    return { geo: merge(p), colliders: [{ x: 0, z: 0, r: 0.95, h: 99, solid: true }] };
  },
  // Szivárványkapu: öt színes ív két felhőn; alatta át lehet futni (észak–dél irányban)
  kapu() {
    const p = [];
    RAINBOW.forEach((c, i) => p.push(part(new THREE.TorusGeometry(5.0 - i * 0.45, 0.24, 6, 22, Math.PI), c)));
    for (const s of [-1, 1]) {
      p.push(part(new THREE.SphereGeometry(1.15, 10, 8), 0xffffff, [s * 4.1, 0.6, 0], [0, 0, 0], [1, 0.75, 1]),
        part(new THREE.SphereGeometry(0.8, 9, 7), 0xffffff, [s * 4.1 + 0.9, 0.45, 0.3]), part(new THREE.SphereGeometry(0.75, 9, 7), 0xffffff, [s * 4.1 - 0.85, 0.4, -0.25]));
    }
    return { geo: merge(p), colliders: [{ x: -4.1, z: 0, r: 1.3, h: 99, solid: true }, { x: 4.1, z: 0, r: 1.3, h: 99, solid: true }] };
  },
};

export const LANDMARK_KINDS = Object.keys(BUILD);
export function buildLandmark(type) {
  const b = (BUILD[type] || BUILD.kut)();
  for (const c of b.colliders) c.lm = true;                 // a nevezetesség saját ütközője (a tesztek így különböztetik meg)
  return b;
}
