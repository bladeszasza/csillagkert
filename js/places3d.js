// A kert tereptárgyai: minden állomás egy HELY a kertben (saját tervezés, three.js alapformákból).
// Az összes tárgy és a háttér fái egyetlen hálóvá olvadnak (csúcsszínekkel): egyetlen rajzolási hívás.
// Minden tárgy a saját origójában épül (talp: y = 0), a néző felé (+z) néz; a helyét a js/friends.js PLACES táblája adja.
import * as THREE from '../vendor/three.module.js';
import { merge, part } from './geo.js';
import { PLACES } from './friends.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, n = 10) => new THREE.CylinderGeometry(rt, rb, h, n);
const ball = (r, a = 12, b = 9) => new THREE.SphereGeometry(r, a, b);
const cone = (r, h, n = 10) => new THREE.ConeGeometry(r, h, n);
const C = { yellow: 0xffcf3f, pink: 0xff8fc8, purple: 0x8e5be8, mint: 0x7fe0c0, red: 0xf2545b, blue: 0x4aa8ff, sky: 0x9ad8ff, green: 0x58b85c, leaf: 0x6fcf73,
  brown: 0x9a6a3a, wood: 0xe6bb82, cream: 0xfff3dc, grey: 0xc9d2e0, dark: 0x3b2a63, orange: 0xff9f43, white: 0xffffff, stone: 0xece4d2 };

function heart() {
  const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.95, 0.1, -0.5, 0.8, 0, 0.3); s.bezierCurveTo(0.5, 0.8, 0.95, 0.1, 0, -0.5);
  return new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 8 });
}

const BUILD = {
  // ✏️ Ceruzavár: ceruza alakú torony (radír, fémgyűrű, sárga test, kihegyezett hegy), ajtóval
  ceruza: () => [
    part(cyl(0.5, 0.5, 0.3), C.pink, [0, 0.15, 0]), part(cyl(0.52, 0.52, 0.14), C.grey, [0, 0.37, 0]),
    part(cyl(0.5, 0.5, 1.9, 8), C.yellow, [0, 1.39, 0]), part(cone(0.5, 0.6, 8), C.wood, [0, 2.64, 0]), part(cone(0.19, 0.24, 8), C.dark, [0, 2.96, 0]),
    part(box(0.36, 0.52, 0.08), C.purple, [0, 0.72, 0.46]),
  ],
  // 🔤 Hangok háza: kis ház piros tetővel és egy betűkockával
  hang: () => [
    part(box(1.5, 1.15, 1.2), C.cream, [0, 0.58, 0]), part(cone(1.2, 0.85, 4), C.red, [0, 1.57, 0], [0, Math.PI / 4, 0]),
    part(box(0.36, 0.6, 0.06), C.purple, [-0.3, 0.3, 0.61]), part(box(0.34, 0.34, 0.06), C.sky, [0.35, 0.7, 0.61]),
    part(box(0.42, 0.42, 0.42), C.mint, [0.62, 0.21, 0.95], [0, 0.4, 0]),
  ],
  // 🎵 Zenevár: pavilon három színes haranggal
  zene: () => [
    part(cyl(1.0, 1.05, 0.16, 16), C.wood, [0, 0.08, 0]), part(cyl(0.08, 0.08, 1.9), C.purple, [-0.75, 1.1, 0]), part(cyl(0.08, 0.08, 1.9), C.purple, [0.75, 1.1, 0]),
    part(box(1.8, 0.14, 0.14), C.purple, [0, 2.05, 0]),
    ...[[-0.45, C.red], [0, C.yellow], [0.45, C.blue]].flatMap(([x, c]) => [part(cyl(0.02, 0.02, 0.3), C.dark, [x, 1.85, 0]), part(ball(0.2), c, [x, 1.6, 0], [0, 0, 0], [1, 0.9, 1]), part(ball(0.06), C.dark, [x, 1.4, 0])]),
  ],
  // 🏺 Időutazás: régi oszlopsor
  ido: () => [
    part(box(1.8, 0.16, 0.8), C.stone, [0, 0.08, 0]),
    ...[-0.65, 0, 0.65].map(x => part(cyl(0.15, 0.17, 1.6), C.stone, [x, 0.96, 0])),
    part(box(1.8, 0.24, 0.6), C.stone, [0, 1.88, 0]), part(cone(0.95, 0.45, 4), C.cream, [0, 2.22, 0], [0, Math.PI / 4, 0], [1, 1, 0.42]),
  ],
  // 🌍 Világunk: földgömb állványon
  vilag: () => [
    part(cyl(0.5, 0.55, 0.14, 14), C.brown, [0, 0.07, 0]), part(cyl(0.07, 0.07, 0.75), C.brown, [0, 0.5, 0]),
    part(ball(0.78, 18, 14), C.blue, [0, 1.55, 0]),
    ...[[0.2, 0.25, 0.68, 0.34], [-0.35, -0.1, 0.66, 0.28], [0.5, -0.3, 0.5, 0.22], [-0.2, 0.55, 0.5, 0.2], [-0.62, 0.2, 0.38, 0.2]].map(([x, y, z, r]) => part(ball(r, 10, 8), C.green, [x, 1.55 + y, z], [0, 0, 0], [1, 1, 0.35])),
  ],
  // 🍎 Egészség: almafa
  egeszseg: () => [
    part(cyl(0.15, 0.2, 1.2), C.brown, [0, 0.6, 0]), part(ball(0.95, 14, 11), C.green, [0, 1.95, 0]), part(ball(0.6, 12, 9), C.leaf, [-0.55, 1.6, 0.2]), part(ball(0.6, 12, 9), C.leaf, [0.6, 1.7, 0.1]),
    ...[[-0.5, 2.1, 0.75], [0.1, 2.35, 0.85], [0.55, 1.95, 0.72], [-0.1, 1.65, 0.95], [-0.75, 1.55, 0.6], [0.75, 1.5, 0.55]].map(p => part(ball(0.14, 10, 8), C.red, p)),
  ],
  // 🤖 Robotpálya: kis robot
  algo: () => [
    part(box(0.26, 0.4, 0.3), C.grey, [-0.24, 0.2, 0]), part(box(0.26, 0.4, 0.3), C.grey, [0.24, 0.2, 0]),
    part(box(0.95, 0.9, 0.6), C.sky, [0, 0.85, 0]), part(box(0.2, 0.6, 0.24), C.grey, [-0.6, 0.9, 0]), part(box(0.2, 0.6, 0.24), C.grey, [0.6, 0.9, 0]),
    part(box(0.74, 0.54, 0.54), C.white, [0, 1.6, 0]), part(ball(0.09), C.dark, [-0.17, 1.64, 0.28]), part(ball(0.09), C.dark, [0.17, 1.64, 0.28]), part(box(0.3, 0.06, 0.04), C.pink, [0, 1.46, 0.28]),
    part(cyl(0.03, 0.03, 0.34), C.grey, [0, 2.04, 0]), part(ball(0.11), C.yellow, [0, 2.26, 0]), part(ball(0.12), C.yellow, [0, 0.9, 0.31], [0, 0, 0], [1, 1, 0.4]),
  ],
  // 🎨 Rajzasztal: festőállvány színes pacákkal
  rajz: () => [
    part(box(0.06, 0.95, 0.06), C.brown, [-0.3, 0.46, 0.05], [0.12, 0, 0.14]), part(box(0.06, 0.95, 0.06), C.brown, [0.3, 0.46, 0.05], [0.12, 0, -0.14]), part(box(0.06, 0.9, 0.06), C.brown, [0, 0.44, -0.28], [-0.3, 0, 0]),
    part(box(0.74, 0.56, 0.05), C.white, [0, 0.62, 0.1], [-0.12, 0, 0]),
    ...[[-0.2, 0.72, C.red], [0.06, 0.6, C.blue], [0.22, 0.76, C.yellow], [-0.08, 0.5, C.green]].map(([x, y, c]) => part(ball(0.1, 10, 8), c, [x, y, 0.14], [0, 0, 0], [1, 1, 0.3])),
  ],
  // 🔢 Számoló rét: számolókockák
  szamol: () => [
    part(box(0.36, 0.36, 0.36), C.pink, [-0.2, 0.18, 0]), part(box(0.36, 0.36, 0.36), C.mint, [0.2, 0.18, 0.02], [0, 0.2, 0]), part(box(0.36, 0.36, 0.36), C.yellow, [0, 0.54, 0], [0, -0.3, 0]),
    ...[[-0.2, 0.18], [0.14, 0.24], [0.26, 0.12], [-0.08, 0.6], [0.02, 0.5], [0.1, 0.62]].map(([x, y]) => part(ball(0.035, 8, 6), C.dark, [x, y, 0.2])),
  ],
  // 🔺 Formák és színek: kúp, kocka, gömb
  forma: () => [
    part(cone(0.24, 0.5, 14), C.red, [-0.3, 0.25, 0]), part(box(0.34, 0.34, 0.34), C.blue, [0.08, 0.17, 0.12], [0, 0.5, 0]), part(ball(0.2), C.yellow, [0.4, 0.2, -0.05]),
  ],
  // 🧩 Okoskodó: egymásba illő építőkockák
  okos: () => [
    part(box(0.3, 0.3, 0.3), C.purple, [-0.3, 0.15, 0]), part(box(0.3, 0.3, 0.3), C.orange, [0, 0.15, 0]), part(box(0.3, 0.3, 0.3), C.green, [0.3, 0.15, 0]),
    part(box(0.3, 0.3, 0.3), C.orange, [0, 0.45, 0]), part(box(0.3, 0.3, 0.3), C.blue, [0.3, 0.45, 0]), part(box(0.3, 0.3, 0.3), C.pink, [0.3, 0.75, 0]),
  ],
  // 🫀 Testünk csodái: nagy szív egy rúdon
  test: () => [
    part(cyl(0.2, 0.24, 0.08, 12), C.grey, [0, 0.04, 0]), part(cyl(0.04, 0.04, 0.4), C.grey, [0, 0.26, 0]), part(heart(), C.red, [0, 0.72, -0.06], [0, 0, 0], 0.55),
  ],
  // 🐰 Állatetetés: piknikpléd kosárral és répával (az etetőhely mellett)
  allat: () => [
    part(box(0.5, 0.03, 0.4), C.red, [-0.25, 0.02, -0.2]), part(box(0.5, 0.03, 0.4), C.white, [0.25, 0.02, -0.2]), part(box(0.5, 0.03, 0.4), C.white, [-0.25, 0.02, 0.2]), part(box(0.5, 0.03, 0.4), C.red, [0.25, 0.02, 0.2]),
    part(cyl(0.22, 0.17, 0.24, 12), C.brown, [-0.12, 0.15, -0.05]), part(cone(0.08, 0.32, 10), C.orange, [0.26, 0.1, 0.1], [0, 0, 1.9]), part(ball(0.07, 8, 6), C.green, [0.1, 0.12, 0.1]),
    part(ball(0.1, 10, 8), C.red, [-0.16, 0.3, -0.02]), part(ball(0.1, 10, 8), C.green, [-0.04, 0.3, -0.1]),
  ],
};

// A háttér fái (a tereptárgyak mögött és oldalt): gömb- és kúplombú fák felváltva
const TREES = [[-10.6, -8.2, 1.25], [-8.6, -10.4, 1.05], [-5.4, -11.2, 1.2], [-1.6, -11.6, 1.0], [2.4, -11.4, 1.25], [6.2, -10.8, 1.05], [9.2, -9.6, 1.2], [11, -7.2, 1.0], [-11.6, -4.4, 1.1], [11.8, -3.6, 1.15]];
function tree(k, i) {
  const round = i % 2 === 0;
  return [part(cyl(0.16, 0.22, 1.2), C.brown, [0, 0.6 * k, 0], [0, 0, 0], k),
    ...(round ? [part(ball(1.0, 12, 9), C.green, [0, 2.0 * k, 0], [0, 0, 0], k), part(ball(0.62, 10, 8), C.leaf, [0.55 * k, 1.55 * k, 0.3 * k], [0, 0, 0], k)]
      : [part(cone(0.95, 1.5, 10), C.green, [0, 1.75 * k, 0], [0, 0, 0], k), part(cone(0.7, 1.2, 10), C.leaf, [0, 2.55 * k, 0], [0, 0, 0], k)])];
}

export function buildPlaces() {
  const parts = [];
  const at = (x, z, list, k = 1) => { const m = new THREE.Matrix4().makeTranslation(x, 0, z).scale(new THREE.Vector3(k, k, k)); for (const q of list) { q.matrix.premultiply(m); parts.push(q); } };
  for (const p of PLACES) at(p.x, p.z, BUILD[p.id](), p.scale || 1);
  TREES.forEach(([x, z, k], i) => at(x, z, tree(k, i)));
  const mesh = new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.frustumCulled = false;
  return mesh;
}
