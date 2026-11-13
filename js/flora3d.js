// A kertrészek saját növényei (js/friends.js FLORA tábla) – saját tervezés, three.js alapformákból.
// Mindegyik a saját origójában épül (talp: y = 0); egy növény = egy összeolvasztott háló (csúcsszínekkel), egy rajzolási hívás.
// A fák a barátok mögött, a hátsó sorban állnak, így senkit nem takarnak el.
import * as THREE from '../vendor/three.module.js';
import { merge, part } from './geo.js';

const cyl = (rt, rb, h, n = 10) => new THREE.CylinderGeometry(rt, rb, h, n);
const ball = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b);
const C = { trunk: 0x9a6a3a, green: 0x58b85c, leaf: 0x6fcf73, red: 0xf2545b, white: 0xffffff, pink: 0xffb3d6, rose: 0xff8fc8, blush: 0xffd6e8 };

// determinisztikus "véletlen", hogy a fa minden betöltéskor ugyanolyan legyen
const seq = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
// pontok egy gömbhéj felső részén (a lombkorona felszínén ülő virágokhoz, almákhoz)
function onCrown(n, r, [cx, cy, cz], seed, minY = -0.2) {
  const rnd = seq(seed), out = [];
  for (let i = 0; out.length < n && i < n * 20; i++) {
    const a = rnd() * Math.PI * 2, y = minY + rnd() * (1 - minY), q = Math.sqrt(1 - y * y);
    if (Math.sin(a) < -0.35) continue;                                  // a hátsó oldalra nem kell (nem látszik)
    out.push([cx + Math.cos(a) * q * r, cy + y * r, cz + Math.sin(a) * q * r]);
  }
  return out;
}
const trunk = (h, rt = 0.15, rb = 0.22, color = C.trunk) => part(cyl(rt, rb, h, 9), color, [0, h / 2, 0]);

const BUILD = {
  // 🌸 virágzó cseresznyefa (a kert közepén, hátul)
  cseresznye: () => {
    const out = [trunk(1.5), part(cyl(0.07, 0.1, 0.9, 6), C.trunk, [0.32, 1.55, 0], [0, 0, -0.7]), part(cyl(0.07, 0.1, 0.8, 6), C.trunk, [-0.3, 1.5, 0.05], [0, 0, 0.75])];
    for (const [x, y, z, r, c] of [[0, 2.35, 0, 0.85, C.pink], [0.7, 2.05, 0.1, 0.62, C.rose], [-0.72, 2.0, 0.05, 0.6, C.blush], [0.25, 2.85, -0.1, 0.55, C.blush], [-0.3, 2.7, 0.25, 0.5, C.rose]])
      out.push(part(ball(r, 12, 9), c, [x, y, z]));
    for (const p of onCrown(16, 0.9, [0, 2.35, 0], 7)) out.push(part(ball(0.075, 6, 4), C.white, p));
    for (const [x, z] of [[0.6, 0.7], [-0.5, 0.9], [0.1, 1.2], [-0.9, 0.4]]) out.push(part(cyl(0.07, 0.07, 0.01, 6), C.pink, [x, 0.01, z]));   // lehullott szirmok
    return out;
  },
  // 🍎 almafa (tanya)
  almafa: () => {
    const out = [trunk(1.35, 0.16, 0.24)];
    for (const [x, y, z, r, c] of [[0, 2.2, 0, 0.95, C.green], [0.75, 1.9, 0.1, 0.65, C.leaf], [-0.75, 1.95, 0, 0.65, C.leaf], [0.1, 2.75, 0.1, 0.6, C.leaf]])
      out.push(part(ball(r, 12, 9), c, [x, y, z]));
    for (const p of onCrown(10, 1.0, [0, 2.2, 0], 11)) out.push(part(ball(0.11, 8, 6), C.red, p));
    out.push(part(ball(0.11, 8, 6), C.red, [0.5, 0.1, 0.8]), part(ball(0.11, 8, 6), C.red, [-0.35, 0.1, 1.0]));
    return out;
  },
  // 🌳 szomorúfűz: kupolás korona, lelógó ágak (tópart)
  fuzfa: () => {
    const out = [trunk(1.7, 0.18, 0.3), part(ball(1.0, 14, 9), 0x9fd68a, [0, 2.35, 0], [0, 0, 0], [1.25, 0.72, 1.2])];
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2; if (Math.sin(a) < -0.6) continue;
      const r = 1.12 + (i % 2) * 0.12, len = 1.1 + (i % 3) * 0.25;
      out.push(part(ball(0.13, 6, 6), i % 2 ? 0x8cc97a : 0xaee39a, [Math.cos(a) * r, 2.25 - len * 0.5, Math.sin(a) * r * 0.95], [0, 0, 0], [1, len / 0.26, 1]));
    }
    return out;
  },
  // 🌿 eukaliptuszfa: magas, világos törzs, kékeszöld lomb (Ausztrália)
  eukaliptusz: () => {
    const out = [trunk(2.7, 0.12, 0.2, 0xe8dcc8), part(cyl(0.05, 0.08, 1.0, 6), 0xe8dcc8, [0.35, 2.4, 0], [0, 0, -0.6]), part(cyl(0.05, 0.08, 0.9, 6), 0xe8dcc8, [-0.3, 2.2, 0], [0, 0, 0.6])];
    for (const [x, y] of [[0.3, 1.0], [-0.1, 1.7]]) out.push(part(ball(0.07, 6, 4), 0xb9ab95, [x * 0.4, y, 0.17], [0, 0, 0], [1.4, 1, 0.4]));   // foltok a kérgen
    for (const [x, y, z, r, c] of [[0.7, 2.9, 0, 0.55, 0x86b8a0], [-0.65, 2.65, 0.1, 0.5, 0x9cc8b0], [0, 3.35, 0, 0.6, 0x86b8a0], [0.15, 2.5, 0.35, 0.4, 0x9cc8b0]])
      out.push(part(ball(r, 10, 8), c, [x, y, z], [0, 0, 0], [1.2, 0.75, 1]));
    return out;
  },
  // 🍶 palackfa: hasas, palack alakú törzs, kis lombpamacsok (Ausztrália)
  palackfa: () => {
    const T = 0xc9a27a, out = [part(ball(0.62, 14, 10), T, [0, 0.95, 0], [0, 0, 0], [1, 1.45, 1]), part(cyl(0.2, 0.32, 0.7, 10), T, [0, 2.0, 0])];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.3, dx = Math.cos(a), dz = Math.sin(a);
      out.push(part(cyl(0.05, 0.08, 0.7, 6), T, [dx * 0.25, 2.45, dz * 0.25], [dz * 0.7, 0, -dx * 0.7]));
      out.push(part(ball(0.28, 8, 6), i % 2 ? C.green : C.leaf, [dx * 0.5, 2.8, dz * 0.5]));
    }
    return out;
  },
  // 🌳 majomkenyérfa (baobab): vastag törzs, felül szétálló ágak apró lombbal (Afrika)
  majomkenyerfa: () => {
    const T = 0xb89a7a, out = [part(cyl(0.48, 0.62, 2.3, 14), T, [0, 1.15, 0])];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
      out.push(part(cyl(0.08, 0.15, 0.9, 6), T, [dx * 0.45, 2.55, dz * 0.45], [dz * 0.9, 0, -dx * 0.9]));
      out.push(part(ball(0.32, 8, 6), i % 2 ? 0x7fae4a : 0x93c25a, [dx * 0.85, 2.95, dz * 0.85], [0, 0, 0], [1, 0.6, 1]));
    }
    return out;
  },
  // 🌳 ernyőakác: vékony, elágazó törzs, lapos, széles lomb (Afrika)
  ernyoakac: () => {
    const T = 0x7a5532;
    return [
      part(cyl(0.08, 0.13, 1.5, 7), T, [0, 0.75, 0]), part(cyl(0.05, 0.08, 1.1, 6), T, [0.3, 1.85, 0], [0, 0, -0.5]), part(cyl(0.05, 0.08, 1.1, 6), T, [-0.3, 1.85, 0], [0, 0, 0.5]),
      part(ball(1, 16, 8), 0x7fae4a, [0, 2.45, 0], [0, 0, 0], [1.9, 0.28, 1.4]), part(ball(1, 14, 8), 0x93c25a, [0.1, 2.68, 0], [0, 0, 0], [1.4, 0.22, 1.05]),
    ];
  },
  // 🌴 pálmafa: enyhén ívelt, gyűrűs törzs, hosszú levelek, kókuszdiók (Afrika)
  palma: () => {
    const out = [];
    let x = 0, y = 0;
    for (let i = 0; i < 7; i++) {
      const h = 0.4, t = 0.06 * i, sx = Math.sin(t) * h, sy = Math.cos(t) * h;
      out.push(part(cyl(0.12, 0.15, h, 8), i % 2 ? 0xc8a070 : 0xb48a5a, [x + sx / 2, y + sy / 2, 0], [0, 0, -t])); x += sx; y += sy;
    }
    for (let i = 0; i < 7; i++) {                                     // a levél hossza a saját x tengelye: előbb lekonyul (z), aztán körbefordul (y)
      const a = i / 7 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
      out.push(part(ball(0.25, 8, 4), i % 2 ? C.green : C.leaf, [x + dx * 0.68, y - 0.15, dz * 0.68], [0, -a, -0.38], [3.0, 0.14, 0.75]));
    }
    for (const [dx, dz] of [[0.12, 0.1], [-0.1, 0.12], [0, -0.12]]) out.push(part(ball(0.1, 8, 6), 0x6b4226, [x + dx, y - 0.12, dz]));
    return out;
  },
};
export const FLORA_IDS = Object.keys(BUILD);

// Egy növény összeolvasztott hálója (talp: y = 0); a hívó helyezi el, forgatja és méretezi
export function buildFloraGeo(id) {
  const b = BUILD[id];
  return b ? merge(b()) : null;
}
