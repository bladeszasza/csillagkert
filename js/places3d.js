// A kert tereptárgyai: minden állomás egy HELY a kertben (saját tervezés, three.js alapformákból).
// Az összes tárgy és a háttér fái egyetlen hálóvá olvadnak (csúcsszínekkel): egyetlen rajzolási hívás.
// Minden tárgy a saját origójában épül (talp: y = 0), a néző felé (+z) néz; a helyét a js/friends.js PLACES táblája adja.
import * as THREE from '../vendor/three.module.js';
import { merge, part } from './geo.js';
import { mat as lookMat } from './three/look.js';
import { PLACES, FRIENDS, FLORA, AREAS } from './friends.js';
import { DECOR } from './gifts.js';

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

// --- a kert két szélső része (a barátok zugait a js/friends.js adja) ---
// Tópart balra: tó tavirózsával és náddal, fák, gombák, avarkupac.  Tanya jobbra: kerítés, pajta, szénabála, itató, tyúkól, szivárvány.
const POND = { x: -17.6, z: -1.8, rx: 1.75, rz: 1.3 };
function pond() {
  const out = [part(cyl(1, 1, 0.04, 28), 0x7fd0ff, [0, 0.02, 0], [0, 0, 0], [POND.rx, 1, POND.rz])];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; out.push(part(ball(0.16, 8, 6), C.stone, [Math.cos(a) * (POND.rx + 0.08), 0.05, Math.sin(a) * (POND.rz + 0.08)], [0, 0, 0], [1.2, 0.55, 1])); }
  for (const [x, z, r] of [[0.9, 0.45, 0.24], [-1.0, 0.3, 0.2], [0.55, -0.7, 0.18]]) out.push(part(cyl(r, r, 0.02, 12), C.leaf, [x, 0.05, z]));
  out.push(part(ball(0.07, 8, 6), C.pink, [0.9, 0.1, 0.45]), part(ball(0.06, 8, 6), C.white, [-1.0, 0.09, 0.3]));
  for (const [x, z, h] of [[-1.5, -1.0, 0.9], [-1.25, -1.2, 1.1], [-1.75, -0.6, 0.8], [1.45, -1.05, 1.0], [1.7, -0.7, 0.85]]) out.push(part(cyl(0.025, 0.025, h, 5), C.green, [x, h / 2, z]), part(cyl(0.06, 0.06, 0.24, 8), C.brown, [x, h - 0.05, z]));
  return out;
}
const mushroom = (k = 1) => [part(cyl(0.07, 0.09, 0.22, 8), C.cream, [0, 0.11 * k, 0], [0, 0, 0], k), part(ball(0.18, 10, 6), C.red, [0, 0.24 * k, 0], [0, 0, 0], [k, 0.55 * k, k]),
  ...[[0.07, 0.04], [-0.06, 0.08], [0.0, -0.09]].map(([x, z]) => part(ball(0.03, 6, 4), C.white, [x * k, 0.31 * k, z * k]))];
const fence = (len) => {
  const out = [];
  for (let x = 0; x <= len + 0.01; x += 1) out.push(part(box(0.1, 0.75, 0.1), C.wood, [x, 0.375, 0]));
  out.push(part(box(len, 0.08, 0.05), C.wood, [len / 2, 0.55, 0.05]), part(box(len, 0.08, 0.05), C.wood, [len / 2, 0.28, 0.05]));
  return out;
};
const barn = () => [
  part(box(2.2, 1.5, 1.7), C.red, [0, 0.75, 0]), part(cone(1.65, 0.9, 4), 0x8a3a3a, [0, 1.95, 0], [0, Math.PI / 4, 0], [1, 1, 0.78]),
  part(box(0.8, 1.0, 0.06), C.white, [0, 0.5, 0.86]), part(box(0.68, 0.88, 0.07), 0xb04848, [0, 0.47, 0.87]),
  part(box(0.08, 0.86, 0.08), C.white, [0, 0.47, 0.9], [0, 0, 0.9]), part(box(0.08, 0.86, 0.08), C.white, [0, 0.47, 0.9], [0, 0, -0.9]),
];
const hay = () => [part(cyl(0.42, 0.42, 0.8, 14), C.yellow, [0, 0.42, 0], [0, 0, Math.PI / 2]), part(cyl(0.43, 0.43, 0.06, 14), 0xe0b030, [-0.2, 0.42, 0], [0, 0, Math.PI / 2]), part(cyl(0.43, 0.43, 0.06, 14), 0xe0b030, [0.2, 0.42, 0], [0, 0, Math.PI / 2])];
const trough = () => [part(box(1.0, 0.35, 0.45), C.wood, [0, 0.2, 0]), part(box(0.88, 0.04, 0.33), C.sky, [0, 0.36, 0])];
const henhouse = () => [part(box(0.8, 0.6, 0.7), C.wood, [0, 0.5, 0]), part(cone(0.7, 0.45, 4), C.red, [0, 1.02, 0], [0, Math.PI / 4, 0]),
  ...[[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].map(([x, z]) => part(box(0.07, 0.2, 0.07), C.brown, [x, 0.1, z])), part(ball(0.12, 10, 8), C.dark, [0, 0.5, 0.36], [0, 0, 0], [1, 1, 0.2]),
  part(box(0.16, 0.03, 0.6), C.brown, [0, 0.12, 0.6], [0.35, 0, 0])];
const rainbow = () => [C.red, C.orange, C.yellow, C.green, C.blue, C.purple].map((c, i) => part(new THREE.TorusGeometry(1.75 - i * 0.13, 0.07, 6, 28, Math.PI), c, [0, 0, 0]));
function bush(k = 1) { return [part(ball(0.5, 10, 8), C.green, [0, 0.35 * k, 0], [0, 0, 0], k), part(ball(0.38, 10, 8), C.leaf, [0.4 * k, 0.28 * k, 0.1 * k], [0, 0, 0], k), part(ball(0.35, 10, 8), C.leaf, [-0.4 * k, 0.25 * k, 0.1 * k], [0, 0, 0], k)]; }
// apró vadvirágok a kertrészekben (a nagy, példányosított virágok a kert közepén nőnek a csillagokkal)
function wildflowers(cx, keep) {
  const out = [], cols = [C.pink, C.yellow, C.purple, C.white, C.orange];
  let s = Math.abs(cx) * 7 + 3, n = 0;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 400 && n < 26; i++) {
    const x = cx + (rnd() - 0.5) * 12, z = -4.2 + rnd() * 8.4;
    if (keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r)) continue;
    n++;
    out.push(part(cyl(0.025, 0.025, 0.4, 5), C.green, [x, 0.2, z]), part(ball(0.12, 8, 6), cols[n % cols.length], [x, 0.42, z], [0, 0, 0], [1, 0.6, 1]), part(ball(0.05, 6, 4), C.yellow, [x, 0.47, z + 0.04]));
  }
  return out;
}
function buildAreas(at) {
  at(POND.x, POND.z, pond());
  [[-14.4, -4.8, 1.0], [-21.9, -4.7, 1.15], [-23.8, -0.8, 1.0], [-15.2, -7.6, 1.2], [-19.6, -8.2, 1.05], [-11.4, -7.4, 1.1], [-24.5, -6.0, 1.2]].forEach(([x, z, k], i) => at(x, z, tree(k, i + 1)));
  at(-21.1, 0.4, mushroom(1.1)); at(-21.5, 0.9, mushroom(0.75)); at(-12.6, 3.2, mushroom(0.8));
  at(-12.4, 0.6, bush(0.9)); at(-22.8, 2.6, bush(1));
  at(12.2, -4.6, fence(10)); at(21.8, -6.8, barn()); at(14.3, -5.6, rainbow(), 1.4);
  at(19.9, 0.3, hay()); at(20.6, 3.0, trough()); at(13.0, 3.4, henhouse());
  [[23.8, -2.2, 1.1], [11.4, -6.6, 1.0], [16.4, -8.4, 1.2], [24.6, -6.4, 1.05], [23.0, 2.6, 0.9]].forEach(([x, z, k], i) => at(x, z, tree(k, i)));
  at(11.9, 0.9, bush(0.8));
  const keep = [...FRIENDS.filter(f => f.area).map(f => [f.home[0], f.home[1], 1.3]), [POND.x, POND.z, 2.3], [21.8, -6.8, 2], [19.9, 0.3, 1], [20.6, 3.0, 1], [13.0, 3.4, 1.1],
    [-21.1, 0.6, 0.8], [-14.4, -4.8, 1.2], [-12.4, 0.6, 0.9], [11.9, 0.9, 0.8], [-12.6, 3.2, 0.5], [-22.8, 2.6, 1],
    ...DECOR.map(d => [d.spot[1], d.spot[2], 1.0]), ...FLORA.map(f => [f.spot[0], f.spot[1], 1.2])];   // a díszek és a fák helye is szabadon marad
  for (const cx of [-17, 17]) at(0, 0, wildflowers(cx, keep));
}

// --- távoli földek: a tájelemeik saját hálóban, a földdel együtt rejthetők (js/garden.js) ---
// 🇦🇺 Ausztrália (a tóparton túl, balra): vörös sziklahegy hátul, billabong (kis tavacska) a kacsacsőrű emlősnek,
// termeszvár, tüskés spinifex-fűcsomók, vörös kövek, szürkészöld sóbokrok, piros sivatagi virágok.
const AU = { rock: 0xd0663a, groove: 0xa9492a, ochre: 0xc4733e, spin: 0xc9b458, salt: 0x9bb08a, salt2: 0xb6c6a2, water: 0x7fc8e8, red: 0xb85a34, pea: 0xe8323c };
const BILLABONG = { x: -36.9, z: 2.2, rx: 1.2, rz: 0.72 };
const uluru = () => {
  const out = [part(ball(1, 24, 12), AU.rock, [0, -0.3, 0], [0, 0, 0], [3.6, 2.4, 1.7]), part(ball(1, 16, 10), AU.rock, [2.7, -0.25, 0.25], [0, 0, 0], [1.5, 1.5, 1.2])];
  for (const x of [-2.3, -1.1, 0.2, 1.4]) {                              // függőleges barázdák az elején
    const y = 0.9, zs = 1.7 * Math.sqrt(Math.max(0.05, 1 - (x / 3.6) ** 2 - ((y + 0.3) / 2.4) ** 2));
    out.push(part(ball(1, 8, 6), AU.groove, [x, y, zs - 0.05], [0, 0, 0], [0.09, 0.95, 0.1]));
  }
  return out;
};
const mound = (c = AU.ochre) => [part(cone(0.6, 1.9, 9), c, [0, 0.95, 0]), part(ball(0.5, 10, 8), c, [0, 0.25, 0], [0, 0, 0], [1.25, 0.7, 1.25]),
  part(cone(0.28, 0.95, 7), c, [0.42, 0.45, 0.08], [0, 0, -0.2]), part(cone(0.22, 0.7, 7), c, [-0.38, 0.35, 0.14], [0, 0, 0.25])];
function billabong() {
  const { rx, rz } = BILLABONG, out = [part(cyl(1, 1, 0.04, 28), AU.water, [0, 0.02, 0], [0, 0, 0], [rx, 1, rz])];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; out.push(part(ball(0.14, 8, 6), 0xc98a5a, [Math.cos(a) * (rx + 0.07), 0.04, Math.sin(a) * (rz + 0.07)], [0, 0, 0], [1.2, 0.5, 1])); }
  for (const [x, z, h] of [[-1.15, -0.4, 0.7], [-0.95, -0.58, 0.85], [-1.28, -0.12, 0.6]]) out.push(part(cyl(0.022, 0.022, h, 5), C.green, [x, h / 2, z]), part(cyl(0.05, 0.05, 0.2, 8), C.brown, [x, h - 0.05, z]));
  out.push(part(cyl(0.2, 0.2, 0.02, 12), C.leaf, [0.55, 0.05, 0.3]));
  return out;
}
const spinifex = (k = 1) => {
  const out = [part(ball(0.28, 8, 6), AU.spin, [0, 0.06, 0], [0, 0, 0], [1, 0.45, 1])];
  for (let i = 0; i < 9; i++) { const a = i * 0.7, t = 0.45 + (i % 3) * 0.2; out.push(part(cone(0.035, 0.55, 4), AU.spin, [Math.sin(a) * 0.12, 0.24, Math.cos(a) * 0.12], [Math.cos(a) * t, 0, -Math.sin(a) * t])); }
  return out.map(q => (q.matrix.premultiply(new THREE.Matrix4().makeScale(k, k, k)), q));
};
const rock = (k = 1, r = 0) => [part(ball(0.3, 8, 6), AU.red, [0, 0.07 * k, 0], [0, r, 0], [1.3 * k, 0.7 * k, k])];
const saltbush = (k = 1) => [part(ball(0.42, 10, 8), AU.salt, [0, 0.3 * k, 0], [0, 0, 0], k), part(ball(0.3, 8, 6), AU.salt2, [0.32 * k, 0.22 * k, 0.08 * k], [0, 0, 0], k), part(ball(0.28, 8, 6), AU.salt2, [-0.3 * k, 0.2 * k, 0.1 * k], [0, 0, 0], k)];
const desertPea = () => [part(cyl(0.02, 0.02, 0.3, 4), C.green, [0, 0.15, 0]), part(ball(0.09, 8, 6), AU.pea, [-0.07, 0.31, 0], [0, 0, 0.6], [1.5, 0.7, 0.8]),
  part(ball(0.09, 8, 6), AU.pea, [0.07, 0.31, 0], [0, 0, -0.6], [1.5, 0.7, 0.8]), part(ball(0.05, 6, 4), 0x2a1a1a, [0, 0.36, 0.05])];
// 🌍 Afrika (a tanyán túl, jobbra): gránit sziklacsoport hátul, itatótó a vízilónak és a flamingónak, termeszvár,
// aranysárga szavannafű-csomók, kövek, zöld bokrok, sárga virágok.
const AF = { rock: 0xbaa78f, rock2: 0xa59078, mound: 0xb5683e, grass: 0xd9be5c, grass2: 0xc4a646, stone: 0x9a8a78, bush: 0x6f9a4a, bush2: 0x87ad5c, water: 0x7fc8e8, mud: 0x9a7a52, flower: 0xffcc33 };
const WATERHOLE = { x: 36.0, z: 2.5, rx: 1.7, rz: 0.75 };
const kopje = () => [part(ball(1, 16, 10), AF.rock, [0, 0.1, 0], [0, 0, 0], [2.0, 1.5, 1.4]), part(ball(1, 14, 9), AF.rock2, [-1.9, -0.1, 0.3], [0, 0.4, 0], [1.4, 1.1, 1.1]),
  part(ball(1, 14, 9), AF.rock2, [1.8, -0.2, 0.2], [0, -0.3, 0], [1.3, 0.95, 1.1]), part(ball(1, 12, 8), AF.rock, [0.4, 1.55, 0.1], [0, 0, 0.2], [0.9, 0.6, 0.8])];
function waterhole() {
  const { rx, rz } = WATERHOLE, out = [part(cyl(1, 1, 0.04, 28), AF.water, [0, 0.02, 0], [0, 0, 0], [rx, 1, rz])];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; out.push(part(ball(0.15, 8, 6), AF.mud, [Math.cos(a) * (rx + 0.07), 0.04, Math.sin(a) * (rz + 0.07)], [0, 0, 0], [1.3, 0.45, 1])); }
  for (const [x, z, h] of [[0.1, -0.72, 0.75], [0.35, -0.64, 0.9], [0.6, -0.74, 0.65]]) out.push(part(cyl(0.022, 0.022, h, 5), C.green, [x, h / 2, z]), part(cyl(0.05, 0.05, 0.2, 8), C.brown, [x, h - 0.05, z]));   // nád hátul, középen (a vízilót és a flamingót nem takarja)
  out.push(part(cyl(0.2, 0.2, 0.02, 12), C.leaf, [-0.3, 0.05, 0.3]), part(cyl(0.15, 0.15, 0.02, 12), C.leaf, [0.45, 0.05, 0.2]));
  return out;
}
const tuft = (k = 1) => {
  const out = [];
  for (let i = 0; i < 8; i++) { const a = i * 0.8, t = 0.12 + (i % 3) * 0.1; out.push(part(cone(0.04, 0.7 - (i % 3) * 0.12, 4), i % 2 ? AF.grass : AF.grass2, [Math.sin(a) * 0.08, 0.3, Math.cos(a) * 0.08], [Math.cos(a) * t, 0, -Math.sin(a) * t])); }
  return out.map(q => (q.matrix.premultiply(new THREE.Matrix4().makeScale(k, k, k)), q));
};
const stone = (k = 1, r = 0) => [part(ball(0.3, 8, 6), AF.stone, [0, 0.07 * k, 0], [0, r, 0], [1.3 * k, 0.7 * k, k])];
const savBush = (k = 1) => [part(cyl(0.04, 0.05, 0.3, 5), C.brown, [0, 0.12 * k, 0], [0, 0, 0], k), part(ball(0.4, 10, 8), AF.bush, [0, 0.36 * k, 0], [0, 0, 0], [1.2 * k, 0.7 * k, k]),
  part(ball(0.28, 8, 6), AF.bush2, [0.3 * k, 0.44 * k, 0.1 * k], [0, 0, 0], k)];
const goldFlower = () => [part(cyl(0.018, 0.018, 0.28, 4), C.green, [0, 0.14, 0]), part(ball(0.08, 8, 6), AF.flower, [0, 0.3, 0], [0, 0, 0], [1, 0.45, 1]), part(ball(0.035, 6, 4), 0x8a4a1a, [0, 0.33, 0])];
// apróságok szétszórva (determinisztikusan): a lakók zuga, a tó, a termeszvár és a fák helye szabadon marad.
// x0: a szórás bal széle (15,4 egység széles); elöl, a kamera előtt nem nőnek nagy dolgok. pad: a nagyobb tárgy (bokor)
// ennyivel messzebb marad a lakóktól és a többi tárgytól, hogy senkit ne takarjon
function scatter(at, keep, seed, x0, items) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (const [n, make, pad = 0] of items) {
    for (let i = 0, got = 0; i < 300 && got < n; i++) {
      const x = x0 + rnd() * 15.4, z = -7 + rnd() * 10;
      if (keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r + pad)) continue;
      keep.push([x, z, 0.7]); got++;
      at(x, z, make(rnd));
    }
  }
}
const keepOf = (area, extra) => [...FRIENDS.filter(f => f.area === area.id).map(f => [f.home[0], f.home[1], 1.25]), ...extra,
  ...FLORA.filter(f => f.area === area.id).map(f => [f.spot[0], f.spot[1], 1.5])];
const LANDS = {
  ausztralia(at, area) {
    at(-36.0, -10.6, uluru());                     // a tópartról nézve már nem lóg be a kép szélére (így ott nem kell rajzolni)
    at(BILLABONG.x, BILLABONG.z, billabong());
    at(-28.4, -4.4, mound());
    scatter(at, keepOf(area, [[BILLABONG.x, BILLABONG.z, 1.9], [-28.4, -4.4, 1.1]]), 4242, -44,
      [[11, r => spinifex(0.8 + r() * 0.4)], [7, r => rock(0.6 + r() * 0.4, r() * 3)], [5, r => saltbush(0.8 + r() * 0.4)], [9, () => desertPea()]]);
  },
  afrika(at, area) {
    at(36.0, -10.6, kopje());                      // a tanyáról nézve nem lóg be a kép szélére
    at(WATERHOLE.x, WATERHOLE.z, waterhole());
    at(28.6, -4.4, mound(AF.mound));
    scatter(at, keepOf(area, [[WATERHOLE.x, WATERHOLE.z, 2.0], [28.6, -4.4, 1.1]]), 2424, 28.6,
      [[14, r => tuft(0.8 + r() * 0.4)], [6, r => stone(0.6 + r() * 0.4, r() * 3)], [5, r => savBush(0.8 + r() * 0.4), 0.8], [8, () => goldFlower()]]);
  },
};
// { mesh, boxes: [[minX, minY, minZ, maxX, maxY, maxZ], …] } – a dobozok a tájelemek befoglalói (a föld alatti rész nélkül):
// a kert ezekkel dönti el, látja-e a kamera a földet
export function buildLand(id) {
  const area = AREAS.find(a => a.id === id), fill = LANDS[id]; if (!area || !fill) return null;
  const parts = [], boxes = [], box = new THREE.Box3(), b = new THREE.Box3();
  const at = (x, z, list) => {
    const m = new THREE.Matrix4().makeTranslation(x, 0, z); box.makeEmpty();
    for (const q of list) { q.matrix.premultiply(m); parts.push(q); if (!q.geo.boundingBox) q.geo.computeBoundingBox(); box.union(b.copy(q.geo.boundingBox).applyMatrix4(q.matrix)); }
    boxes.push([box.min.x, Math.max(0, box.min.y), box.min.z, box.max.x, Math.max(0.05, box.max.y), box.max.z]);
  };
  fill(at, area);
  const mesh = new THREE.Mesh(merge(parts), lookMat({ vertexColors: true }));
  mesh.frustumCulled = false;
  return { mesh, boxes };
}

export function buildPlaces() {
  const parts = [];
  const at = (x, z, list, k = 1) => { const m = new THREE.Matrix4().makeTranslation(x, 0, z).scale(new THREE.Vector3(k, k, k)); for (const q of list) { q.matrix.premultiply(m); parts.push(q); } };
  for (const p of PLACES) at(p.x, p.z, BUILD[p.id](), p.scale || 1);
  TREES.forEach(([x, z, k], i) => at(x, z, tree(k, i)));
  buildAreas(at);
  // a távoli földek talaja (mindig látszik, a fő rét alatt egy hajszállal, így az átfedésben a rét zöldje marad felül)
  for (const a of AREAS.filter(r => r.land)) { const [cx, cz, r, sx] = a.ground; parts.push(part(cyl(r, r, 0.6, 48), a.soil, [cx, -0.32, cz], [0, 0, 0], [sx, 1, 1])); }
  const mesh = new THREE.Mesh(merge(parts), lookMat({ vertexColors: true }));
  mesh.frustumCulled = false;
  return mesh;
}
