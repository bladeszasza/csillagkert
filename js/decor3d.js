// Kerti díszek (ajándékok, js/gifts.js) és a Barátság fája – saját tervezés, three.js alapformákból.
// Minden dísz a saját origójában épül (talp: y = 0), a néző felé (+z) néz; a helyét a gifts.js spot mezője adja.
// Egy dísz = egy összeolvasztott háló (csúcsszínekkel), így a 12 dísz legfeljebb 12 rajzolási hívás.
import * as THREE from '../vendor/three.module.js';
import { merge, part } from './geo.js';
import { mat as lookMat } from './three/look.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, n = 10) => new THREE.CylinderGeometry(rt, rb, h, n);
const ball = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b);
const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
const C = { yellow: 0xffcf3f, pink: 0xff8fc8, purple: 0x8e5be8, red: 0xf2545b, blue: 0x4aa8ff, sky: 0x9ad8ff, green: 0x58b85c, leaf: 0x6fcf73,
  brown: 0x9a6a3a, wood: 0xe6bb82, cream: 0xfff3dc, dark: 0x3b2a63, white: 0xffffff, stone: 0xece4d2, orange: 0xff9f43, sand: 0xffe3a3, lamp: 0xffe680 };

export function heartGeo(depth = 0.2, seg = 8) {
  const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.95, 0.1, -0.5, 0.8, 0, 0.3); s.bezierCurveTo(0.5, 0.8, 0.95, 0.1, 0, -0.5);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: seg }); g.translate(0, 0, -depth / 2);
  return g;
}

const BUILD = {
  // 🏮 lámpás oszlopon
  'garden:lampas': () => [
    part(box(0.4, 0.08, 0.4), C.dark, [0, 0.04, 0]), part(cyl(0.05, 0.07, 1.5, 8), C.dark, [0, 0.8, 0]),
    part(box(0.34, 0.4, 0.34), C.lamp, [0, 1.72, 0]), part(cone(0.32, 0.22, 4), C.dark, [0, 2.03, 0], [0, Math.PI / 4, 0]),
    part(box(0.38, 0.04, 0.38), C.dark, [0, 1.51, 0]), part(ball(0.06, 6, 4), C.dark, [0, 2.17, 0]),
  ],
  // 🪑 kerti pad háttámlával
  'garden:pad': () => [
    part(box(1.5, 0.08, 0.42), C.wood, [0, 0.46, 0]), part(box(1.5, 0.12, 0.05), C.wood, [0, 0.72, -0.19]), part(box(1.5, 0.12, 0.05), C.wood, [0, 0.9, -0.19]),
    ...[[-0.65, 0.16], [0.65, 0.16], [-0.65, -0.16], [0.65, -0.16]].map(([x, z]) => part(box(0.08, 0.46, 0.08), C.brown, [x, 0.23, z])),
    part(box(0.08, 0.5, 0.06), C.brown, [-0.65, 0.72, -0.2]), part(box(0.08, 0.5, 0.06), C.brown, [0.65, 0.72, -0.2]),
  ],
  // 🎠 hinta: két A-láb, gerenda, kötél, rózsaszín ülés
  'garden:hinta': () => {
    const out = [];
    for (const x of [-0.95, 0.95]) for (const s of [-1, 1]) out.push(part(cyl(0.05, 0.06, 1.95, 6), C.brown, [x, 0.92, s * 0.32], [s * 0.34, 0, 0]));
    out.push(part(cyl(0.06, 0.06, 2.0, 8), C.brown, [0, 1.84, 0], [0, 0, Math.PI / 2]));
    for (const x of [-0.3, 0.3]) out.push(part(cyl(0.015, 0.015, 1.3, 4), C.dark, [x, 1.18, 0]));
    out.push(part(box(0.75, 0.06, 0.28), C.pink, [0, 0.52, 0]));
    return out;
  },
  // 🐦 madárodú rúdon
  'garden:odu': () => [
    part(cyl(0.05, 0.06, 1.5, 8), C.brown, [0, 0.75, 0]), part(box(0.44, 0.46, 0.4), C.wood, [0, 1.72, 0]),
    part(cone(0.42, 0.3, 4), C.red, [0, 2.1, 0], [0, Math.PI / 4, 0]), part(cyl(0.08, 0.08, 0.03, 10), C.dark, [0, 1.78, 0.2], [Math.PI / 2, 0, 0]),
    part(cyl(0.015, 0.015, 0.16, 4), C.brown, [0, 1.62, 0.26], [Math.PI / 2, 0, 0]), part(ball(0.09, 8, 6), C.yellow, [0.14, 2.3, 0.05]),
  ],
  // 🌸 virágkapu: zöld ív virágokkal
  'garden:kapu': () => {
    const out = [part(cyl(0.06, 0.06, 0.9, 6), C.green, [-0.95, 0.45, 0]), part(cyl(0.06, 0.06, 0.9, 6), C.green, [0.95, 0.45, 0]),
      part(new THREE.TorusGeometry(0.95, 0.06, 6, 20, Math.PI), C.green, [0, 0.9, 0])];
    const cols = [C.pink, C.yellow, C.purple, C.white];
    for (let i = 0; i < 11; i++) { const a = (i / 10) * Math.PI; out.push(part(ball(0.12, 8, 6), cols[i % 4], [Math.cos(a) * 0.95, 0.9 + Math.sin(a) * 0.95, 0.04])); }
    for (const y of [0.2, 0.5, 0.75]) for (const x of [-0.95, 0.95]) out.push(part(ball(0.1, 6, 4), C.leaf, [x + (y === 0.5 ? 0.05 : -0.05), y, 0.05]));
    return out;
  },
  // 🌬️ szélforgó pálcán
  'garden:szelforgo': () => {
    const out = [part(cyl(0.035, 0.035, 1.5, 6), C.brown, [0, 0.75, 0])], cols = [C.red, C.blue, C.yellow, C.green];
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; out.push(part(cone(0.2, 0.42, 3), cols[i], [Math.cos(a) * 0.2, 1.55 + Math.sin(a) * 0.2, 0.05], [0, 0, a - Math.PI / 2], [1, 1, 0.25])); }
    out.push(part(ball(0.06, 8, 6), C.white, [0, 1.55, 0.1]));
    return out;
  },
  // ⛲ szökőkút
  'garden:kut': () => [
    part(cyl(0.72, 0.78, 0.32, 16), C.stone, [0, 0.16, 0]), part(cyl(0.62, 0.62, 0.04, 16), C.sky, [0, 0.31, 0]),
    part(cyl(0.11, 0.14, 0.6, 8), C.stone, [0, 0.6, 0]), part(cyl(0.32, 0.2, 0.14, 12), C.stone, [0, 0.95, 0]),
    part(cyl(0.27, 0.27, 0.03, 12), C.sky, [0, 1.02, 0]), part(cone(0.07, 0.36, 6), C.sky, [0, 1.2, 0]),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return part(ball(0.05, 6, 4), C.sky, [Math.cos(a) * 0.36, 0.5, Math.sin(a) * 0.36]); }),
  ],
  // 🍄 gombaház
  'garden:gombahaz': () => [
    part(cyl(0.42, 0.5, 0.95, 12), C.cream, [0, 0.48, 0]), part(ball(0.82, 14, 8), C.red, [0, 1.05, 0], [0, 0, 0], [1, 0.62, 1]),
    ...[[0.35, 1.38, 0.45], [-0.4, 1.3, 0.4], [0.05, 1.55, 0.2], [0.6, 1.15, -0.1], [-0.6, 1.18, -0.05]].map(p => part(ball(0.11, 8, 6), C.white, p, [0, 0, 0], [1, 0.6, 1])),
    part(box(0.26, 0.42, 0.06), C.brown, [0, 0.21, 0.47]), part(cyl(0.11, 0.11, 0.04, 10), C.sky, [0.24, 0.62, 0.44], [Math.PI / 2, 0, 0.2]),
  ],
  // 🐝 méhkas állványon, két méhecskével
  'garden:mehkas': () => [
    part(box(0.7, 0.08, 0.6), C.wood, [0, 0.42, 0]), ...[[-0.28, -0.22], [0.28, -0.22], [-0.28, 0.22], [0.28, 0.22]].map(([x, z]) => part(box(0.06, 0.42, 0.06), C.brown, [x, 0.21, z])),
    part(cyl(0.34, 0.38, 0.18, 12), C.yellow, [0, 0.55, 0]), part(cyl(0.3, 0.34, 0.18, 12), 0xf2c94c, [0, 0.72, 0]), part(cyl(0.24, 0.3, 0.16, 12), C.yellow, [0, 0.88, 0]),
    part(ball(0.24, 12, 6), 0xf2c94c, [0, 0.96, 0], [0, 0, 0], [1, 0.7, 1]), part(box(0.14, 0.09, 0.04), C.dark, [0, 0.5, 0.36]),
    ...[[0.45, 1.15], [-0.4, 1.3]].flatMap(([x, y]) => [part(ball(0.06, 6, 4), C.yellow, [x, y, 0.1], [0, 0, 0], [1.3, 1, 1]), part(ball(0.04, 6, 4), C.white, [x, y + 0.06, 0.08])]),
  ],
  // 🌻 három napraforgó
  'garden:napraforgo': () => {
    const out = [];
    for (const [x, h, z] of [[-0.45, 1.5, 0], [0.1, 1.85, -0.2], [0.55, 1.3, 0.1]]) {
      out.push(part(cyl(0.035, 0.045, h, 6), C.green, [x, h / 2, z]), part(ball(0.16, 6, 4), C.leaf, [x + 0.14, h * 0.45, z], [0, 0, 0], [1, 0.35, 0.7]));
      out.push(part(cyl(0.2, 0.2, 0.06, 12), C.brown, [x, h, z + 0.04], [Math.PI / 2 - 0.25, 0, 0]));
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; out.push(part(ball(0.1, 6, 4), C.yellow, [x + Math.cos(a) * 0.28, h + Math.sin(a) * 0.27, z + 0.02], [0, 0, a], [1.4, 0.6, 0.4])); }
    }
    return out;
  },
  // 📮 postaláda zászlóval
  'garden:posta': () => [
    part(cyl(0.05, 0.06, 1.0, 8), C.brown, [0, 0.5, 0]), part(box(0.34, 0.26, 0.55), C.blue, [0, 1.12, 0]),
    part(cyl(0.17, 0.17, 0.55, 12, 1), C.blue, [0, 1.25, 0], [Math.PI / 2, 0, 0], [1, 1, 1]), part(box(0.3, 0.3, 0.04), 0x2a6ab0, [0, 1.15, 0.28]),
    part(box(0.03, 0.34, 0.03), C.red, [0.2, 1.3, -0.05]), part(box(0.03, 0.12, 0.16), C.red, [0.2, 1.42, 0.02]),
  ],
  // 🏖️ homokozó vödörrel és lapáttal
  'garden:homokozo': () => [
    part(box(1.5, 0.1, 1.1), C.sand, [0, 0.1, 0]),
    part(box(1.6, 0.22, 0.08), C.wood, [0, 0.11, 0.59]), part(box(1.6, 0.22, 0.08), C.wood, [0, 0.11, -0.59]),
    part(box(0.08, 0.22, 1.1), C.wood, [0.79, 0.11, 0]), part(box(0.08, 0.22, 1.1), C.wood, [-0.79, 0.11, 0]),
    part(ball(0.22, 10, 6), C.sand, [-0.3, 0.16, -0.1], [0, 0, 0], [1, 0.5, 1]),
    part(cyl(0.13, 0.1, 0.22, 10), C.pink, [0.35, 0.26, 0.1]), part(new THREE.TorusGeometry(0.11, 0.012, 4, 10, Math.PI), C.dark, [0.35, 0.37, 0.1]),
    part(box(0.05, 0.03, 0.34), C.blue, [-0.05, 0.2, 0.25], [0, 0.6, 0]), part(box(0.14, 0.03, 0.12), C.blue, [0.06, 0.2, 0.42], [0, 0.6, 0]),
  ],
};
export const DECOR_IDS = Object.keys(BUILD);

// Egy dísz összeolvasztott hálója (talp: y = 0); a hívó helyezi el és forgatja
export function buildDecorGeo(id) {
  const b = BUILD[id];
  return b ? merge(b()) : null;
}

// --- a Barátság fája: a szívekből nő (kiáltvány: kedvesség, törődés) ---
// A kert közepén, a cica mögött áll: a lombja a cica feje fölött látszik. A szívek a lombon nyílnak (egy példányosított háló).
export const FRIEND_TREE = { x: 0, z: -10.2 };
export const TREE_HEARTS = 40;                         // ennyi szív látszik a lombon (a többi a fa méretében látszik)
export const treeScale = hearts => 0.6 + 0.4 * Math.min(1, hearts / 40);     // saját beállítás: 40 szívnél éri el a teljes méretét

export function createFriendTree(scene) {
  const g = new THREE.Group(); g.position.set(FRIEND_TREE.x, 0, FRIEND_TREE.z);
  const body = new THREE.Mesh(merge([
    part(cyl(0.26, 0.4, 2.3, 10), C.brown, [0, 1.15, 0]), part(cyl(0.1, 0.16, 1.0, 8), C.brown, [-0.42, 2.25, 0.05], [0, 0, 0.75]), part(cyl(0.1, 0.16, 1.0, 8), C.brown, [0.45, 2.3, 0.05], [0, 0, -0.7]),
    part(ball(1.35, 14, 10), 0x7fd88a, [0, 3.35, 0]), part(ball(0.95, 12, 9), 0x96e39c, [-1.05, 2.95, 0.25]), part(ball(0.95, 12, 9), 0x96e39c, [1.1, 3.0, 0.2]), part(ball(0.85, 12, 8), 0xa9ecae, [0, 4.25, 0.1]),
    part(ball(0.5, 10, 6), C.green, [0, 0.12, 0], [0, 0, 0], [1.6, 0.3, 1.6]),
  ]), lookMat({ vertexColors: true }));
  g.add(body);
  // a szívek helye: a lomb elülső, a néző felé eső felén, determinisztikusan szórva
  const spots = [], blobs = [[0, 3.35, 0, 1.35], [-1.05, 2.95, 0.25, 0.95], [1.1, 3.0, 0.2, 0.95], [0, 4.25, 0.1, 0.85]];
  for (let i = 0; spots.length < TREE_HEARTS && i < 400; i++) {
    const b = blobs[i % 4], u = (i * 0.618034) % 1, v = (i * 0.754877) % 1;
    const th = (u - 0.5) * Math.PI * 1.15, ph = (v - 0.35) * Math.PI * 0.9;
    const nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(ph), nz = Math.cos(th) * Math.cos(ph);
    const p = new THREE.Vector3(b[0] + nx * b[3], b[1] + ny * b[3], b[2] + nz * b[3]);
    if (spots.some(q => q.distanceTo(p) < 0.42)) continue;
    spots.push(p);
  }
  const hearts = new THREE.InstancedMesh(heartGeo(0.12, 5), lookMat({ color: 0xff5d8f }), TREE_HEARTS);
  hearts.count = 0; hearts.frustumCulled = false; g.add(hearts);
  scene.add(g);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  let shown = 0, born = [];
  function pose(i, k) {
    const p = spots[i]; e.set(-0.15, (p.x - 0) * 0.25, ((i * 37) % 7 - 3) * 0.08); q.setFromEuler(e);
    const s = 0.34 * k; sc.set(s, s, s); m4.compose(p, q, sc); hearts.setMatrixAt(i, m4); hearts.instanceMatrix.needsUpdate = true;
  }
  return {
    group: g,
    spots: () => spots.length,
    count: () => shown,
    // n szív: a fa mérete és a lombon nyíló szívek; animate: az újak kipattannak
    setHearts(n, animate = false) {
      g.scale.setScalar(treeScale(n));
      const want = Math.min(TREE_HEARTS, Math.max(0, n | 0));
      for (let i = shown; i < want; i++) { pose(i, animate ? 0.01 : 1); if (animate) born.push({ i, t0: performance.now() + (i - shown) * 180 }); }
      if (want < shown) born = born.filter(b => b.i < want);
      shown = want; hearts.count = want;
    },
    update(now) {
      for (let k = born.length - 1; k >= 0; k--) {
        const b = born[k], a = (now - b.t0) / 650;
        if (a < 0) continue;
        if (a >= 1) { pose(b.i, 1); born.splice(k, 1); } else pose(b.i, Math.max(0.01, Math.sin(a * Math.PI / 2) * (1 + Math.sin(a * Math.PI) * 0.35)));
      }
    },
  };
}
