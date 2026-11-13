// A kert barátai (saját tervezés, three.js alapformákból). Egy barát = "csontok" (fej, lábak, farok, mancs, szárny,
// szem, száj – üres Object3D-k, amelyeket a kert animációja mozgat) + alkatrészek listája: melyik csonton ül,
// milyen alapforma (gömb, kúp, henger, ív), hol, mekkora és milyen színű.
// A kert az összes barát összes alkatrészét alapformánként EGY példányosított hálóval rajzolja ki
// (createCharacterBatch), így 19 barát is csak néhány rajzolási hívás. A figurák előre (-z) néznek, a talpuk y = 0-n van.
import * as THREE from '../../vendor/three.module.js';
import { mat as lookMat } from './look.js';
import { resolveAvatar, mix, INK as INK_HEX } from '../avatar.js';

const BALL = 0, BEAD = 1, CONE = 2, PYR = 3, CYL = 4, ARC = 5, RING = 6, STAR = 7, HEART = 8;
// lapos, kihúzott forma (csillag, szív): az eleje a +z felé néz, a közepe az origóban, mérete kb. 2 × 2 × 0.3
function flatShape(pts) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -0.15); return g;
}
const starPts = () => Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.45 : 1, a = Math.PI / 2 + i * Math.PI / 5; return [Math.cos(a) * r, Math.sin(a) * r]; });
const heartPts = () => Array.from({ length: 24 }, (_, i) => { const t = (i / 24) * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return [x / 17, (y + 2) / 17]; });
const unitGeometries = () => [
  new THREE.SphereGeometry(1, 16, 12),             // nagy gömb (test, fej)
  new THREE.SphereGeometry(1, 8, 6),               // kis gömb (szem, orr, orca, gyapjúpamacs) – kevesebb háromszög
  new THREE.ConeGeometry(1, 1, 10),                // kúp (szarv, csőr, tüske)
  new THREE.ConeGeometry(1, 1, 4),                 // gúla (hegyes fül)
  new THREE.CylinderGeometry(1, 1, 1, 10),         // henger (láb, pata, ormány)
  new THREE.TorusGeometry(1, 0.17, 6, 14, Math.PI), // félkör (mosoly)
  new THREE.TorusGeometry(1, 0.3, 6, 16, Math.PI * 1.6), // kunkor (malacfarok, sörény-fürt, sál)
  flatShape(starPts()),                            // csillag (minta, varázssüveg)
  flatShape(heartPts()),                           // szív (minta, szívszem)
];

const INK = 0x3b2a63, CHEEK = 0xffb3d6, NOSE = 0xff6f9f, MOUTH = 0x7a2340, WHITE = 0xffffff;
const V = a => new THREE.Vector3(...a);

function kit(size = 1) {
  const root = new THREE.Group(), base = new THREE.Group(), inner = new THREE.Group();
  base.scale.setScalar(size); root.add(base); base.add(inner);
  const parts = [];
  const node = (parent, x = 0, y = 0, z = 0) => { const n = new THREE.Object3D(); n.position.set(x, y, z); parent.add(n); return n; };
  const put = (n, prim, color, pos, scale, rot) => {
    const q = rot instanceof THREE.Quaternion ? rot : new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0])));
    parts.push({ node: n, prim, color: new THREE.Color(color), m: new THREE.Matrix4().compose(V(pos), q, V(scale)) });
  };
  const ball = (n, color, r, pos, s = [1, 1, 1], rot) => put(n, r * Math.max(...s) >= 0.11 ? BALL : BEAD, color, pos, [r * s[0], r * s[1], r * s[2]], rot);
  const cone = (n, color, r, h, pos, rot, four = false) => put(n, four ? PYR : CONE, color, pos, [r, h, r], rot);
  const cyl = (n, color, r, h, pos, rot, s = [1, 1]) => put(n, CYL, color, pos, [r * s[0], h, r * s[1]], rot);
  const arc = (n, color, R, pos, rot = [0, 0, Math.PI]) => put(n, ARC, color, pos, [R, R, R], rot);
  const ring = (n, color, R, pos, rot) => put(n, RING, color, pos, [R, R, R], rot);
  return { root, base, inner, parts, node, put, ball, cone, cyl, arc, ring };
}

// Arc a fej elején: pislogó szemek (saját csonton), orca, orr, mosoly és az evéskor nyíló száj.
// A helyek a fej gömbjének felszínéből számolódnak (r), vagy kézzel megadhatók (…At: a jobb oldali elem helye).
function face(k, head, o = {}) {
  const { r = 0.3, eyeX = 0.12, eyeY = 0.06, eyeR = 0.05, iris = null, cheek = CHEEK, cheekX = 0.2, cheekY = -0.07,
    nose = NOSE, noseR = 0.045, smile = INK, smileR = 0.09 } = o;
  const surf = (x, y) => -Math.sqrt(Math.max(0.0001, r * r - x * x - y * y));
  const eyeAt = o.eyeAt || [eyeX, eyeY, surf(eyeX, eyeY) + eyeR * 0.3];
  const eyes = [-1, 1].map(sx => {
    const e = k.node(head, sx * eyeAt[0], eyeAt[1], eyeAt[2]);
    if (iris) { k.ball(e, iris, eyeR, [0, 0, 0], [1, 1, 0.7]); k.ball(e, INK, eyeR * 0.56, [0, 0, -eyeR * 0.5], [1, 1, 0.6]); }
    else k.ball(e, INK, eyeR, [0, 0, 0], [1, 1, 0.75]);
    k.ball(e, WHITE, eyeR * 0.34, [eyeR * 0.3, eyeR * 0.36, -eyeR * (iris ? 0.85 : 0.68)]);
    return e;
  });
  if (cheek != null) {
    const c = o.cheekAt || [cheekX, cheekY, surf(cheekX, cheekY) + 0.02];
    for (const sx of [-1, 1]) k.ball(head, cheek, 0.06, [sx * c[0], c[1], c[2]], [1, 0.8, 0.4]);
  }
  if (nose != null) k.ball(head, nose, noseR, o.noseAt || [0, -0.02, surf(0, -0.02) - noseR * 0.3]);
  const sp = o.smileAt || [0, -0.1, surf(0, -0.1) - 0.005];
  const smileN = k.node(head, sp[0], sp[1], sp[2]);
  if (smile != null) k.arc(smileN, smile, smileR, [0, 0, 0]);
  const mouth = k.node(head, sp[0], sp[1] - 0.02, sp[2]);
  k.ball(mouth, MOUTH, Math.max(0.04, smileR * 0.67), [0, 0, 0], [1.1, 1, 0.5]);
  mouth.visible = false;
  return { eyes, smile: smileN, mouth };
}

// Lábak: csípő-csont (forgáspont) + láb + talp; a talp alja pontosan a földön (y = 0) van
const FEET = { paw: [0.085, [1, 0.6, 1.25], -0.03], bird: [0.08, [1, 0.25, 1.5], -0.05], stub: [0.06, [1, 0.7, 1.2], -0.01] };
function legs(k, color, pts, hipY, { r = 0.065, foot = 'paw', footColor = color } = {}) {
  return pts.map(([x, z]) => {
    const hip = k.node(k.inner, x, hipY, z);
    const fh = foot === 'hoof' ? 0.05 : FEET[foot][0] * FEET[foot][1][1], L = hipY - fh;
    k.cyl(hip, color, r, L, [0, -L / 2, 0]);
    if (foot === 'hoof') k.cyl(hip, footColor, r * 1.12, 0.1, [0, -L, 0]);
    else { const [fr, fs, fz] = FEET[foot]; k.ball(hip, footColor, fr, [0, -L, fz], fs); }
    return hip;
  });
}
const QUAD = (x = 0.18, z = 0.3) => [[-x, -z], [x, -z], [-x, z], [x, z]];
function arm(k, color, x, y, z) { const a = k.node(k.inner, x, y, z); k.ball(a, color, 0.08, [0, 0.12, 0], [0.8, 2.2, 0.8]); return a; }
function wings(k, color, x, y, z, r = 0.2, s = [0.33, 0.68, 1.1]) {
  return [1, -1].map(sx => { const w = k.node(k.inner, sx * x, y, z); k.ball(w, color, r, [sx * r * s[0] * 0.2, -r * s[1] * 0.4, 0], s); return w; });
}
function done(k, u) {
  k.root.userData = { inner: k.inner, parts: k.parts, legs: [], wings: null, arm: null, tail: null, tailWag: 1, ...u, armY: u.arm ? u.arm.position.y : 0 };
  return k.root;
}

// --- a kerti barátok ---------------------------------------------------------------------------------------
const SP = {
  // 🐰 nyuszi: hosszú, belül rózsaszín fül, pamacsfarok
  bunny() {
    const k = kit(), W = 0xffffff, P = 0xffb3d6;
    const body = k.node(k.inner, 0, 0.58, 0); k.ball(body, W, 0.42, [0, 0, 0], [0.9, 0.8, 1.2]);
    const head = k.node(k.inner, 0, 1.03, -0.5); k.ball(head, W, 0.3, [0, 0, 0]);
    for (const sx of [-1, 1]) {
      k.ball(head, W, 0.09, [sx * 0.12, 0.5, 0], [0.7, 2.6, 0.5], [0, 0, -sx * 0.15]);
      k.ball(head, P, 0.05, [sx * 0.118, 0.48, -0.035], [0.6, 2.5, 0.3], [0, 0, -sx * 0.15]);
    }
    const f = face(k, head);
    const tail = k.node(k.inner, 0, 0.68, 0.6); k.ball(tail, 0xfff0f6, 0.15, [0, 0, 0]);
    return done(k, { body, head, ...f, tail, arm: arm(k, W, 0.38, 0.73, -0.2), legs: legs(k, W, QUAD(), 0.43, { footColor: P }) });
  },
  // 🐶 kutya: lógó fül, világos pofa, folt a szeme körül
  dog() {
    const k = kit(), B = 0xc8895a, A = 0x6b4226, M = 0xf3dcc0;
    const body = k.node(k.inner, 0, 0.58, 0); k.ball(body, B, 0.42, [0, 0, 0], [0.9, 0.8, 1.2]);
    const head = k.node(k.inner, 0, 1.03, -0.5); k.ball(head, B, 0.3, [0, 0, 0]);
    k.ball(head, M, 0.14, [0, -0.07, -0.24], [1.15, 0.85, 0.9]);
    k.ball(head, A, 0.085, [0.12, 0.08, -0.24], [1, 1, 0.3]);
    for (const sx of [-1, 1]) k.ball(head, A, 0.1, [sx * 0.3, 0.03, 0], [0.6, 1.6, 0.4], [0, 0, sx * 0.4]);
    const f = face(k, head, { eyeY: 0.08, cheekX: 0.22, cheekY: -0.03, nose: 0x3b2a2a, noseR: 0.05, noseAt: [0, -0.02, -0.365], smileAt: [0, -0.15, -0.345], smileR: 0.07 });
    const tail = k.node(k.inner, 0, 0.68, 0.6); k.ball(tail, B, 0.1, [0, 0.1, 0.06], [1, 1, 2.4], [-0.6, 0, 0]);
    return done(k, { body, head, ...f, tail, arm: arm(k, B, 0.38, 0.73, -0.2), legs: legs(k, B, QUAD(), 0.43, { footColor: A }) });
  },
  // 🦊 róka: hegyes fül sötét véggel, fehér pofa és mell, bozontos farok fehér véggel, sötét "zokni"
  fox() {
    const k = kit(), B = 0xff8a3d, W = 0xffffff, D = 0x4a2a1a;
    const body = k.node(k.inner, 0, 0.58, 0); k.ball(body, B, 0.42, [0, 0, 0], [0.9, 0.8, 1.2]);
    k.ball(body, W, 0.2, [0, 0.06, -0.43], [1, 1.1, 0.5]);
    const head = k.node(k.inner, 0, 1.03, -0.5); k.ball(head, B, 0.3, [0, 0, 0]);
    k.ball(head, W, 0.12, [0, -0.07, -0.26], [1, 0.8, 1.3]);
    for (const sx of [-1, 1]) {
      k.cone(head, B, 0.1, 0.24, [sx * 0.17, 0.3, 0], [0, 0, -sx * 0.2], true);
      k.cone(head, D, 0.045, 0.1, [sx * 0.184, 0.369, 0], [0, 0, -sx * 0.2], true);
    }
    const f = face(k, head, { nose: INK, noseR: 0.04, noseAt: [0, -0.03, -0.415], smileAt: [0, -0.13, -0.39], smileR: 0.06 });
    const tail = k.node(k.inner, 0, 0.66, 0.6);
    k.ball(tail, B, 0.16, [0, 0.06, 0.12], [1, 1, 1.9], [-0.5, 0, 0]); k.ball(tail, W, 0.12, [0, 0.2, 0.38]);
    return done(k, { body, head, ...f, tail, arm: arm(k, B, 0.38, 0.73, -0.2), legs: legs(k, D, QUAD(), 0.43) });
  },
  // 🐻 maci: kerek fül, világos pofa és pocak
  bear() {
    const k = kit(), B = 0xb9814f, A = 0xe2c49a, N = 0x3b2a2a;
    const body = k.node(k.inner, 0, 0.58, 0); k.ball(body, B, 0.42, [0, 0, 0], [0.9, 0.8, 1.2]);
    k.ball(body, A, 0.26, [0, -0.02, -0.41], [1, 1.1, 0.45]);
    const head = k.node(k.inner, 0, 1.03, -0.5); k.ball(head, B, 0.3, [0, 0, 0]);
    k.ball(head, A, 0.13, [0, -0.07, -0.25], [1.1, 0.85, 0.85]);
    for (const sx of [-1, 1]) { k.ball(head, B, 0.11, [sx * 0.24, 0.27, 0], [1, 1, 0.6]); k.ball(head, A, 0.06, [sx * 0.24, 0.27, -0.05], [1, 1, 0.4]); }
    const f = face(k, head, { eyeY: 0.08, nose: N, noseR: 0.05, noseAt: [0, -0.03, -0.36], smileAt: [0, -0.14, -0.345], smileR: 0.065 });
    const tail = k.node(k.inner, 0, 0.66, 0.6); k.ball(tail, A, 0.12, [0, 0, 0]);
    return done(k, { body, head, ...f, tail, arm: arm(k, B, 0.38, 0.73, -0.2), legs: legs(k, B, QUAD(), 0.43, { footColor: A }) });
  },
  // 🐼 panda: fekete fül, szemfolt, lábak és mancs
  panda() {
    const k = kit(), W = 0xffffff, K = 0x2b2b3a;
    const body = k.node(k.inner, 0, 0.58, 0); k.ball(body, W, 0.42, [0, 0, 0], [0.9, 0.8, 1.2]);
    const head = k.node(k.inner, 0, 1.03, -0.5); k.ball(head, W, 0.3, [0, 0, 0]);
    for (const sx of [-1, 1]) {
      k.ball(head, K, 0.085, [sx * 0.12, 0.045, -0.24], [0.95, 1.25, 0.35], [0, 0, sx * 0.45]);
      k.ball(head, K, 0.11, [sx * 0.24, 0.27, 0], [1, 1, 0.6]);
    }
    const f = face(k, head, { nose: K, smile: K });
    const tail = k.node(k.inner, 0, 0.66, 0.6); k.ball(tail, W, 0.12, [0, 0, 0]);
    return done(k, { body, head, ...f, tail, arm: arm(k, K, 0.38, 0.73, -0.2), legs: legs(k, K, QUAD(), 0.43) });
  },

  // 🦆 kacsa: fehér, narancs csőr és úszóhártyás láb, csapkodó szárny
  duck() {
    const k = kit(0.85), W = 0xffffff, O = 0xffa726, G = 0xe9ecf4;
    const body = k.node(k.inner, 0, 0.42, 0); k.ball(body, W, 0.36, [0, 0, 0], [1, 0.8, 1.3]);
    k.ball(k.inner, W, 0.15, [0, 0.72, -0.27], [1, 1.5, 1]);
    const head = k.node(k.inner, 0, 0.95, -0.3); k.ball(head, W, 0.24, [0, 0, 0]);
    k.ball(head, O, 0.12, [0, -0.06, -0.25], [1.15, 0.38, 1.35]);
    const f = face(k, head, { r: 0.24, eyeX: 0.1, eyeY: 0.07, eyeR: 0.042, cheekX: 0.15, cheekY: -0.03, nose: null, smile: null, smileAt: [0, -0.11, -0.3], smileR: 0.05 });
    const tail = k.node(k.inner, 0, 0.55, 0.42); k.cone(tail, W, 0.13, 0.28, [0, 0.06, 0.08], [1.1, 0, 0]);
    return done(k, { body, head, ...f, tail, wings: wings(k, G, 0.33, 0.52, 0.02), legs: legs(k, O, [[-0.12, 0.02], [0.12, 0.02]], 0.2, { r: 0.035, foot: 'bird' }) });
  },
  // 🐸 béka: széles száj, a fején ülő nagy szemek, ugrálva halad
  frog() {
    const k = kit(0.9), G = 0x7ccf5a, L = 0xd8f5b0, D = 0x5aa83a;
    const body = k.node(k.inner, 0, 0.3, 0);
    k.ball(body, G, 0.38, [0, 0, 0.05], [1.1, 0.72, 1.0]); k.ball(body, L, 0.27, [0, -0.06, -0.2], [1, 0.75, 0.55]);
    for (const sx of [-1, 1]) {
      k.ball(body, G, 0.15, [sx * 0.33, -0.15, 0.15], [0.75, 0.6, 1.3]); k.ball(body, D, 0.09, [sx * 0.38, -0.27, -0.02], [1.2, 0.3, 1.5]);
      k.cyl(body, G, 0.045, 0.2, [sx * 0.2, -0.18, -0.26]); k.ball(body, D, 0.06, [sx * 0.21, -0.28, -0.3], [1.3, 0.35, 1.2]);
    }
    const head = k.node(k.inner, 0, 0.46, -0.12);
    k.ball(head, G, 0.3, [0, 0, -0.05], [1.15, 0.7, 0.95]);
    for (const sx of [-1, 1]) { k.ball(head, G, 0.105, [sx * 0.15, 0.19, -0.07]); k.ball(head, D, 0.016, [sx * 0.05, 0.06, -0.318]); }
    const f = face(k, head, { eyeAt: [0.15, 0.2, -0.13], eyeR: 0.09, iris: WHITE, cheekAt: [0.22, -0.02, -0.255], nose: null, smileAt: [0, -0.06, -0.33], smileR: 0.16 });
    return done(k, { body, head, ...f, hopper: true });
  },
  // 🦔 sün: tüskés hát, krémszínű arc, hegyes orr
  hedgehog() {
    const k = kit(1), S = 0x8a5a3a, T = 0x5e3d26, C = 0xf2d8b0;
    const body = k.node(k.inner, 0, 0.36, 0); k.ball(body, S, 0.42, [0, 0, 0.04], [1, 0.78, 1.1]);
    const up = new THREE.Vector3(0, 1, 0), R = [0.42, 0.33, 0.46];
    for (let i = 0, n = 0; i < 90 && n < 26; i++) {                       // tüskék a hát felszínén, kifelé állva
      const y = 1 - (i + 0.5) / 45, rad = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
      const d = new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad);
      if (d.y < 0.05 || d.z < -0.3) continue;
      n++;
      k.cone(body, n % 2 ? S : T, 0.055, 0.24, [d.x * R[0], d.y * R[1], 0.04 + d.z * R[2]], new THREE.Quaternion().setFromUnitVectors(up, d));
    }
    const head = k.node(k.inner, 0, 0.32, -0.27);
    k.ball(head, C, 0.3, [0, 0, 0], [0.95, 0.85, 0.75]);
    k.cone(head, C, 0.1, 0.24, [0, -0.04, -0.27], [-Math.PI / 2, 0, 0]);
    for (const sx of [-1, 1]) k.ball(head, T, 0.05, [sx * 0.15, 0.19, -0.02], [1, 1, 0.5]);
    const f = face(k, head, { eyeAt: [0.11, 0.07, -0.19], eyeR: 0.045, cheekAt: [0.17, -0.06, -0.165], nose: INK, noseAt: [0, -0.04, -0.395], smileAt: [0, -0.14, -0.195], smileR: 0.05 });
    return done(k, { body, head, ...f, legs: legs(k, T, QUAD(0.17, 0.2), 0.13, { r: 0.05, foot: 'stub' }) });
  },
  // 🐔 tyúk: piros taréj és lebeny, sárga csőr, legyezős farok
  hen() {
    const k = kit(0.85), B = 0xd2894e, D = 0xa8622f, R = 0xf2545b, Y = 0xffc93c;
    const body = k.node(k.inner, 0, 0.45, 0); k.ball(body, B, 0.36, [0, 0, 0], [1, 0.88, 1.2]);
    k.ball(k.inner, B, 0.15, [0, 0.74, -0.22], [1, 1.35, 1]);
    const tail = k.node(k.inner, 0, 0.62, 0.36);
    for (const [rx, rz] of [[0.55, -0.45], [0.35, 0], [0.55, 0.45]]) k.cone(tail, D, 0.07, 0.34, [-rz * 0.25, 0.12, 0.08], [rx, 0, rz]);
    const head = k.node(k.inner, 0, 0.98, -0.26); k.ball(head, B, 0.21, [0, 0, 0]);
    k.ball(head, R, 0.065, [0, 0.2, -0.07]); k.ball(head, R, 0.075, [0, 0.235, 0.01]); k.ball(head, R, 0.06, [0, 0.2, 0.09]);
    k.ball(head, R, 0.05, [0, -0.15, -0.16], [0.8, 1.3, 0.8]);
    k.cone(head, Y, 0.05, 0.13, [0, -0.03, -0.25], [-Math.PI / 2, 0, 0]);
    const f = face(k, head, { r: 0.21, eyeX: 0.09, eyeY: 0.06, eyeR: 0.04, cheekX: 0.14, cheekY: -0.05, nose: null, smile: null, smileAt: [0, -0.09, -0.21], smileR: 0.045 });
    return done(k, { body, head, ...f, tail, tailWag: 0.4, wings: wings(k, D, 0.33, 0.55, 0.02, 0.2, [0.32, 0.65, 1.05]), legs: legs(k, Y, [[-0.11, 0.02], [0.11, 0.02]], 0.22, { r: 0.03, foot: 'bird' }) });
  },
  // 🐿️ mókus: bojtos fül, krémszínű pocak, nagy, felkunkorodó farok
  squirrel() {
    const k = kit(0.72), R = 0xd9773a, C = 0xffe7c4, D = 0xa04a1a;
    const body = k.node(k.inner, 0, 0.6, 0); k.ball(body, R, 0.38, [0, 0, 0], [0.9, 1, 1.05]); k.ball(body, C, 0.24, [0, -0.04, -0.3], [1, 1.2, 0.5]);
    const head = k.node(k.inner, 0, 1.1, -0.32); k.ball(head, R, 0.3, [0, 0, 0]);
    k.ball(head, C, 0.11, [0, -0.08, -0.24], [1.15, 0.85, 0.9]);
    for (const sx of [-1, 1]) { k.cone(head, R, 0.075, 0.2, [sx * 0.16, 0.3, 0.02], [0, 0, -sx * 0.15], true); k.cone(head, D, 0.03, 0.14, [sx * 0.175, 0.44, 0.02], [0, 0, -sx * 0.15]); }
    const f = face(k, head, { eyeY: 0.07, nose: INK, noseR: 0.035, noseAt: [0, -0.045, -0.345], smileAt: [0, -0.14, -0.33], smileR: 0.055 });
    const tail = k.node(k.inner, 0, 0.42, 0.4);
    k.ball(tail, R, 0.2, [0.04, 0.12, 0.14]); k.ball(tail, R, 0.23, [0.12, 0.43, 0.3]); k.ball(tail, R, 0.21, [0.17, 0.73, 0.32]); k.ball(tail, D, 0.15, [0.14, 0.96, 0.22]);
    return done(k, { body, head, ...f, tail, tailWag: 0.35, arm: arm(k, R, 0.34, 0.72, -0.18), legs: legs(k, R, QUAD(0.16, 0.26), 0.42, { footColor: D }) });
  },
  // 🦉 bagoly: nagy borostyán szemek arckorongban, fülpamacs, csőr, pöttyös pocak (nappal szundikál)
  owl() {
    const k = kit(0.8), B = 0xa0764e, D = 0x7a5536, C = 0xf5e3c3, L = 0xe8cfa8, A = 0xffb300;
    const body = k.node(k.inner, 0, 0.55, 0); k.ball(body, B, 0.4, [0, 0, 0], [1, 1.12, 0.95]); k.ball(body, L, 0.3, [0, -0.06, -0.24], [1, 1.15, 0.5]);
    for (const [x, y] of [[-0.1, 0.06], [0.1, 0.06], [0, -0.06], [-0.13, -0.18], [0.13, -0.18], [0, -0.28]]) k.ball(body, D, 0.03, [x, y - 0.04, -0.375], [1.2, 0.7, 0.5]);
    const head = k.node(k.inner, 0, 1.08, -0.04); k.ball(head, B, 0.33, [0, 0, 0], [1.05, 0.9, 0.95]);
    for (const sx of [-1, 1]) { k.ball(head, C, 0.15, [sx * 0.115, 0.01, -0.27], [1, 1, 0.38]); k.cone(head, D, 0.06, 0.18, [sx * 0.22, 0.27, 0], [0, 0, -sx * 0.35], true); }
    k.cone(head, 0xf0a030, 0.04, 0.11, [0, -0.08, -0.33], [-Math.PI / 2 - 0.5, 0, 0]);
    const f = face(k, head, { eyeAt: [0.115, 0.02, -0.325], eyeR: 0.085, iris: A, cheekAt: [0.23, -0.1, -0.24], nose: null, smile: null, smileAt: [0, -0.15, -0.3], smileR: 0.05 });
    for (const sx of [-1, 1]) k.ball(k.inner, A, 0.06, [sx * 0.12, 0.03, -0.18], [1.2, 0.5, 1.4]);
    return done(k, { body, head, ...f, wings: wings(k, D, 0.39, 0.74, 0.02, 0.22, [0.33, 0.9, 0.9]) });
  },
  // 🐭 egér: nagy kerek fül, bajusz, vékony rózsaszín farok
  mouse() {
    const k = kit(0.48), G = 0xbcb4cc, P = 0xffb3d6;
    const body = k.node(k.inner, 0, 0.55, 0); k.ball(body, G, 0.4, [0, 0, 0], [0.9, 0.8, 1.15]);
    const head = k.node(k.inner, 0, 1.0, -0.45); k.ball(head, G, 0.32, [0, 0, 0]);
    k.ball(head, G, 0.13, [0, -0.07, -0.25], [0.9, 0.8, 1.15]);
    for (const sx of [-1, 1]) {
      k.ball(head, G, 0.17, [sx * 0.23, 0.3, 0.02], [1, 1, 0.3]); k.ball(head, P, 0.115, [sx * 0.23, 0.3, -0.03], [1, 1, 0.3]);
      for (const dy of [-0.02, 0.03]) k.cyl(head, 0x8a80a0, 0.012, 0.3, [sx * 0.15, -0.06 + dy, -0.33], [0, 0, sx * (Math.PI / 2 - 0.12 + dy * 4)]);
    }
    const f = face(k, head, { r: 0.32, eyeX: 0.12, eyeY: 0.08, eyeR: 0.055, nose: P, noseR: 0.05, noseAt: [0, -0.05, -0.41], smileAt: [0, -0.15, -0.355], smileR: 0.06 });
    const tail = k.node(k.inner, 0, 0.5, 0.45);
    k.cyl(tail, P, 0.03, 0.5, [0, 0.12, 0.22], [1.15, 0, 0]); k.cyl(tail, P, 0.026, 0.34, [0, 0.42, 0.44], [0.35, 0, 0]);
    return done(k, { body, head, ...f, tail, arm: arm(k, G, 0.36, 0.7, -0.2), legs: legs(k, G, QUAD(), 0.42, { footColor: P }) });
  },
  // 🦄 a saját unikornis: az öltöztető leírása szerint (js/avatar.js), ruhástól; leírás nélkül az alap fehér unikornis
  unicorn(cfg) { const k = kit(1); return done(k, unicornAvatar(k, resolveAvatar(cfg || {}))); },
  // 🐷 malac: ormány, lekonyuló fül, kunkori farok
  pig() {
    const k = kit(0.85), P = 0xffb6c9, D = 0xff8fb0, H = 0x9a5a6a;
    const body = k.node(k.inner, 0, 0.56, 0); k.ball(body, P, 0.46, [0, 0, 0], [1, 0.85, 1.15]);
    const head = k.node(k.inner, 0, 0.98, -0.52); k.ball(head, P, 0.31, [0, 0, 0]);
    k.cyl(head, D, 0.12, 0.12, [0, -0.06, -0.3], [Math.PI / 2, 0, 0]);
    for (const sx of [-1, 1]) { k.ball(head, 0x8a4a5a, 0.025, [sx * 0.045, -0.06, -0.362], [1, 1.3, 0.5]); k.cone(head, D, 0.1, 0.2, [sx * 0.19, 0.26, -0.04], [-0.6, 0, -sx * 0.5], true); }
    const f = face(k, head, { r: 0.31, eyeX: 0.13, eyeY: 0.1, cheek: D, cheekX: 0.21, cheekY: -0.08, nose: null, smileAt: [0, -0.2, -0.24], smileR: 0.07 });
    const tail = k.node(k.inner, 0, 0.62, 0.55); k.ring(tail, D, 0.07, [0, 0, 0.02], [0, Math.PI / 2, 0]);
    return done(k, { body, head, ...f, tail, legs: legs(k, P, QUAD(0.2, 0.3), 0.38, { r: 0.075, foot: 'hoof', footColor: H }) });
  },
  // 🐑 bárány: gyapjúpamacsok, sötét arc, oldalra álló fül
  sheep() {
    const k = kit(0.95), W = 0xfbf8f2, F = 0x4a4060, Hf = 0x2b2440;
    const body = k.node(k.inner, 0, 0.66, 0); k.ball(body, W, 0.4, [0, 0, 0], [1, 0.85, 1.2]);
    for (const p of [[0, 0.3, -0.1], [0.25, 0.22, -0.25], [-0.25, 0.22, -0.25], [0.3, 0.2, 0.1], [-0.3, 0.2, 0.1], [0, 0.3, 0.3], [0.2, 0.25, 0.35], [-0.2, 0.25, 0.35],
      [0.34, -0.05, -0.1], [-0.34, -0.05, -0.1], [0.32, -0.05, 0.25], [-0.32, -0.05, 0.25], [0, 0.05, 0.48], [0, 0.12, -0.4]]) k.ball(body, W, 0.17, p);
    const head = k.node(k.inner, 0, 1.02, -0.5); k.ball(head, F, 0.24, [0, 0, 0], [0.9, 1, 1.05]);
    k.ball(head, W, 0.11, [-0.08, 0.2, 0.02]); k.ball(head, W, 0.11, [0.08, 0.2, 0.02]); k.ball(head, W, 0.12, [0, 0.24, 0.08]);
    for (const sx of [-1, 1]) k.ball(head, F, 0.08, [sx * 0.25, 0.05, 0.02], [1.8, 0.6, 0.6], [0, 0, -sx * 0.35]);
    const f = face(k, head, { r: 0.25, eyeX: 0.09, eyeY: 0.05, eyeR: 0.05, iris: WHITE, cheek: 0xd99ab8, cheekX: 0.15, cheekY: -0.06, nose: 0xffb3c6, noseR: 0.03, smile: 0xffc0d0, smileR: 0.06, smileAt: [0, -0.12, -0.23] });
    const tail = k.node(k.inner, 0, 0.72, 0.55); k.ball(tail, W, 0.12, [0, 0, 0]);
    return done(k, { body, head, ...f, tail, legs: legs(k, F, QUAD(0.18, 0.3), 0.4, { r: 0.055, foot: 'hoof', footColor: Hf }) });
  },
  // 🐢 teknős: domború páncél világos lapokkal, kidugott fej, tömzsi lábak
  turtle() {
    const k = kit(0.9), S = 0x5aa05a, L = 0x8acb6a, K = 0xb8d98a;
    const body = k.node(k.inner, 0, 0.3, 0);
    k.ball(body, S, 0.42, [0, 0, 0], [1, 0.62, 1.15]); k.cyl(body, L, 0.44, 0.07, [0, -0.1, 0], [0, 0, 0], [1, 1.15]);
    k.ball(body, L, 0.13, [0, 0.24, 0], [1, 0.3, 1]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.ball(body, L, 0.1, [sx * 0.2, 0.19, sz * 0.2], [1, 0.32, 1]);
    const head = k.node(k.inner, 0, 0.28, -0.52); k.ball(head, K, 0.16, [0, 0, 0], [1, 0.9, 1.1]);
    const f = face(k, head, { r: 0.175, eyeX: 0.07, eyeY: 0.05, eyeR: 0.032, cheekX: 0.1, cheekY: -0.03, nose: null, smileAt: [0, -0.05, -0.17], smileR: 0.045 });
    const tail = k.node(k.inner, 0, 0.2, 0.48); k.cone(tail, K, 0.05, 0.14, [0, 0, 0.04], [Math.PI / 2, 0, 0]);
    return done(k, { body, head, ...f, tail, legs: legs(k, K, QUAD(0.27, 0.27), 0.16, { r: 0.065, foot: 'stub' }) });
  },
  // 🐴 póni (a ló-alakból): gesztenyebarna, sötét sörény
  pony() { const k = kit(0.85); return done(k, horse(k, { body: 0xd6a06b, mane: 0x7a4a2a, hoof: 0x5a3a24 })); },
  // 🐮 tehén: fekete foltok, rózsaszín orr, kis szarv, bojtos farok
  cow() {
    const k = kit(1), W = 0xffffff, K = 0x2b2b3a, M = 0xffc2cf, H = 0xfff1c9;
    const body = k.node(k.inner, 0, 0.82, 0); k.ball(body, W, 0.5, [0, 0, 0], [1, 0.85, 1.25]);
    k.ball(body, K, 0.16, [0.45, 0.08, 0.1], [0.35, 1, 1.3]); k.ball(body, K, 0.13, [-0.45, -0.02, -0.15], [0.35, 1, 1.2]);
    k.ball(body, K, 0.14, [0.1, 0.41, 0.25], [1.2, 0.35, 1]); k.ball(body, K, 0.1, [-0.4, 0.1, 0.35], [0.35, 1, 1]);
    const head = k.node(k.inner, 0, 1.32, -0.62); k.ball(head, W, 0.3, [0, 0, 0], [1, 1, 1.05]);
    k.ball(head, K, 0.1, [0.13, 0.1, -0.23], [1, 1, 0.35]);
    k.ball(head, M, 0.17, [0, -0.12, -0.25], [1.2, 0.8, 0.8]);
    for (const sx of [-1, 1]) {
      k.ball(head, 0x8a4a5a, 0.025, [sx * 0.06, -0.1, -0.383], [1, 1.2, 0.5]);
      k.cone(head, H, 0.045, 0.17, [sx * 0.17, 0.29, -0.02], [0, 0, -sx * 0.7]);
      k.ball(head, W, 0.08, [sx * 0.32, 0.1, 0], [1.8, 0.6, 0.6], [0, 0, -sx * 0.2]); k.ball(head, M, 0.05, [sx * 0.33, 0.1, -0.03], [1.6, 0.5, 0.3], [0, 0, -sx * 0.2]);
    }
    const f = face(k, head, { eyeX: 0.13, eyeY: 0.1, cheekAt: [0.24, 0, -0.18], nose: null, smileAt: [0, -0.2, -0.37], smileR: 0.07 });
    const tail = k.node(k.inner, 0, 0.95, 0.62);
    k.cyl(tail, W, 0.025, 0.5, [0, -0.2, 0.06], [0.3, 0, 0]); k.ball(tail, K, 0.06, [0, -0.45, 0.13], [1, 1.4, 1]);
    return done(k, { body, head, ...f, tail, tailWag: 0.5, legs: legs(k, W, QUAD(0.24, 0.38), 0.6, { r: 0.08, foot: 'hoof', footColor: K }) });
  },

  // --- Ausztrália ---
  // 🦘 kenguru: felegyenesedve áll, nagy hátsó láb, vastag farok, a zsebéből kikandikál a kicsinye; ugrálva halad
  kangaroo() {
    const k = kit(0.95), B = 0xc98c5a, L = 0xf0d6ae, D = 0x7a4a2a, P = 0xffc2d6;
    const body = k.node(k.inner, 0, 0.78, 0); k.ball(body, B, 0.38, [0, 0, 0], [0.85, 1.22, 0.9]); k.ball(body, L, 0.26, [0, -0.06, -0.24], [1, 1.3, 0.5]);
    k.ball(body, L, 0.14, [0, -0.24, -0.33], [1.15, 0.55, 0.5]);                                    // a zseb pereme
    const joey = k.node(body, 0, -0.12, -0.36); k.ball(joey, B, 0.09, [0, 0, 0]);                      // a kicsinye a zsebben
    for (const sx of [-1, 1]) { k.cone(joey, B, 0.03, 0.09, [sx * 0.05, 0.1, 0.01], [0, 0, -sx * 0.25]); k.ball(joey, INK, 0.016, [sx * 0.035, 0.015, -0.08]); }
    k.ball(joey, 0x3b2a2a, 0.016, [0, -0.02, -0.09]);
    const head = k.node(k.inner, 0, 1.4, -0.1); k.ball(head, B, 0.26, [0, 0, 0], [0.9, 0.95, 1.05]);
    k.ball(head, L, 0.12, [0, -0.08, -0.22], [1, 0.85, 1.1]);
    for (const sx of [-1, 1]) { k.ball(head, B, 0.07, [sx * 0.12, 0.3, 0.03], [0.9, 2.6, 0.5], [0, 0, -sx * 0.22]); k.ball(head, P, 0.045, [sx * 0.118, 0.29, -0.005], [0.8, 2.4, 0.3], [0, 0, -sx * 0.22]); }
    const f = face(k, head, { r: 0.26, eyeX: 0.1, eyeY: 0.07, eyeR: 0.046, cheekX: 0.16, cheekY: -0.05, nose: 0x3b2a2a, noseR: 0.04, noseAt: [0, -0.05, -0.35], smileAt: [0, -0.14, -0.315], smileR: 0.055 });
    k.ball(body, B, 0.06, [-0.2, 0.14, -0.3], [0.8, 1.8, 0.8], [0.4, 0, 0.2]);                      // a másik mellső mancs
    const tail = k.node(k.inner, 0, 0.5, 0.3); k.cone(tail, B, 0.13, 0.8, [0, -0.2, 0.33], [2.05, 0, 0]);
    const lg = legs(k, B, [[-0.17, 0.08], [0.17, 0.08]], 0.36, { r: 0.09, footColor: D });
    for (const hip of lg) k.ball(hip, D, 0.08, [0, -0.32, -0.1], [1, 0.5, 2.2]);                      // hosszú talp
    return done(k, { body, head, ...f, tail, tailWag: 0.2, hopper: true, arm: arm(k, B, 0.22, 0.98, -0.28), legs: lg });
  },
  // 🐨 koala: kerek, szürke, nagy pamacsos fül, nagy sötét orr
  koala() {
    const k = kit(0.8), G = 0x9c9aa8, W = 0xf4f2f8, N = 0x3b3540, P = 0x6f6a78;
    const body = k.node(k.inner, 0, 0.5, 0); k.ball(body, G, 0.4, [0, 0, 0], [0.95, 1.0, 0.9]); k.ball(body, W, 0.27, [0, -0.06, -0.24], [1, 1.1, 0.5]);
    const head = k.node(k.inner, 0, 1.05, -0.15); k.ball(head, G, 0.33, [0, 0, 0], [1.1, 0.95, 0.95]);
    for (const sx of [-1, 1]) { k.ball(head, G, 0.17, [sx * 0.34, 0.17, 0.02], [1, 1, 0.5]); k.ball(head, W, 0.12, [sx * 0.345, 0.17, -0.04], [1, 1, 0.4]); }
    k.ball(head, N, 0.085, [0, -0.04, -0.31], [0.85, 1.15, 0.7]);
    const f = face(k, head, { r: 0.32, eyeX: 0.15, eyeY: 0.07, eyeR: 0.045, cheekX: 0.22, cheekY: -0.08, nose: null, smileAt: [0, -0.17, -0.27], smileR: 0.05 });
    return done(k, { body, head, ...f, arm: arm(k, G, 0.36, 0.72, -0.2), legs: legs(k, G, QUAD(0.17, 0.2), 0.3, { footColor: P }) });
  },
  // 🦜 kakadu: fehér, sárga bóbita, görbe szürke csőr
  cockatoo() {
    const k = kit(0.78), W = 0xffffff, Y = 0xffd84a, B = 0x55556a, F = 0xa89aa6;
    const body = k.node(k.inner, 0, 0.55, 0); k.ball(body, W, 0.33, [0, 0, 0], [0.95, 1.15, 0.95]);
    const head = k.node(k.inner, 0, 1.03, -0.1); k.ball(head, W, 0.24, [0, 0, 0]);
    const up = new THREE.Vector3(0, 1, 0);
    for (const [a, s, h] of [[0.15, 0, 0.36], [0.5, 0, 0.34], [0.3, 0.42, 0.28], [0.3, -0.42, 0.28], [0.85, 0, 0.26]]) {   // legyező: hátra és kicsit oldalra
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(a, 0, s)), d = up.clone().applyQuaternion(q);
      k.cone(head, Y, 0.055, h, [d.x * h / 2, 0.19 + d.y * h / 2, 0.02 + d.z * h / 2], q);
    }
    k.ball(head, B, 0.075, [0, -0.07, -0.22], [0.85, 1.15, 0.9]); k.cone(head, B, 0.035, 0.08, [0, -0.15, -0.25], [Math.PI, 0, 0]);
    const f = face(k, head, { r: 0.24, eyeX: 0.11, eyeY: 0.05, eyeR: 0.04, cheekX: 0.15, cheekY: -0.04, nose: null, smile: null, smileAt: [0, -0.13, -0.19], smileR: 0.035 });
    const tail = k.node(k.inner, 0, 0.36, 0.26); k.cone(tail, W, 0.1, 0.36, [0, -0.08, 0.12], [2.2, 0, 0]);
    return done(k, { body, head, ...f, tail, tailWag: 0.3, wings: wings(k, 0xf2f2f8, 0.3, 0.62, 0.02, 0.2, [0.33, 0.72, 1.05]), legs: legs(k, F, [[-0.1, 0.02], [0.1, 0.02]], 0.22, { r: 0.03, foot: 'bird' }) });
  },
  // 🟤 vombat: zömök, barna, széles orr, kis kerek fül
  wombat() {
    const k = kit(0.85), B = 0x8a7b70, D = 0x574a42, L = 0xb3a596;
    const body = k.node(k.inner, 0, 0.42, 0); k.ball(body, B, 0.42, [0, 0, 0], [1.0, 0.8, 1.2]);
    const head = k.node(k.inner, 0, 0.62, -0.46); k.ball(head, B, 0.28, [0, 0, 0], [1.1, 0.95, 1.0]);
    k.ball(head, L, 0.14, [0, -0.08, -0.2], [1.25, 0.8, 0.8]); k.ball(head, D, 0.09, [0, -0.02, -0.28], [1.35, 0.8, 0.7]);
    for (const sx of [-1, 1]) { k.ball(head, B, 0.075, [sx * 0.18, 0.23, 0.02], [1, 1.15, 0.5]); k.ball(head, D, 0.045, [sx * 0.18, 0.23, -0.015], [1, 1.1, 0.4]); }
    const f = face(k, head, { r: 0.28, eyeX: 0.13, eyeY: 0.08, eyeR: 0.04, cheekX: 0.2, cheekY: -0.06, nose: null, smileAt: [0, -0.17, -0.25], smileR: 0.05 });
    return done(k, { body, head, ...f, legs: legs(k, D, QUAD(0.22, 0.28), 0.2, { r: 0.075, foot: 'stub' }) });
  },
  // 🪶 emu: magas madár, bozontos barna tollak, hosszú kékes nyak, hosszú láb
  emu() {
    const k = kit(1), B = 0x7a5a42, D = 0x5a4030, N = 0x8fa8c8, F = 0x9a8a7a;
    const body = k.node(k.inner, 0, 1.05, 0.05); k.ball(body, B, 0.42, [0, 0, 0], [0.95, 0.85, 1.15]);
    for (const [x, y, z] of [[0, -0.18, 0.36], [0.24, -0.2, 0.18], [-0.24, -0.2, 0.18], [0, 0.18, 0.3]]) k.ball(body, D, 0.18, [x, y, z], [1.2, 0.8, 0.9]);
    k.cyl(k.inner, N, 0.075, 0.62, [0, 1.47, -0.33], [-0.25, 0, 0]);
    const head = k.node(k.inner, 0, 1.84, -0.42); k.ball(head, N, 0.17, [0, 0, 0], [1, 0.95, 1.1]); k.ball(head, D, 0.07, [0, 0.15, 0.03], [1.2, 0.7, 1.2]);
    k.ball(head, 0x4a4a55, 0.06, [0, -0.04, -0.19], [0.9, 0.55, 1.5]);
    const f = face(k, head, { r: 0.17, eyeX: 0.075, eyeY: 0.045, eyeR: 0.036, cheekX: 0.11, cheekY: -0.04, nose: null, smile: null, smileAt: [0, -0.08, -0.16], smileR: 0.035 });
    return done(k, { body, head, ...f, legs: legs(k, F, [[-0.13, 0.08], [0.13, 0.08]], 0.76, { r: 0.045, foot: 'bird' }) });
  },
  // 🦫 kacsacsőrű emlős: lapos test, kacsacsőr, lapát farok, úszóhártyás láb
  platypus() {
    const k = kit(0.82), B = 0x8a5a3a, D = 0x6b4226, S = 0x55556a;
    const body = k.node(k.inner, 0, 0.22, 0); k.ball(body, B, 0.36, [0, 0, 0], [0.85, 0.5, 1.25]);
    const head = k.node(k.inner, 0, 0.3, -0.42); k.ball(head, B, 0.2, [0, 0, 0], [1.05, 0.85, 1]);
    k.ball(head, S, 0.14, [0, -0.05, -0.25], [1.25, 0.33, 1.3]);
    const f = face(k, head, { r: 0.2, eyeX: 0.09, eyeY: 0.06, eyeR: 0.036, cheekX: 0.13, cheekY: -0.01, nose: null, smile: null, smileAt: [0, -0.09, -0.19], smileR: 0.04 });
    const tail = k.node(k.inner, 0, 0.18, 0.42); k.ball(tail, D, 0.18, [0, -0.02, 0.14], [1.1, 0.28, 1.4]);
    return done(k, { body, head, ...f, tail, tailWag: 0.3, legs: legs(k, D, QUAD(0.24, 0.24), 0.1, { r: 0.04, foot: 'bird' }) });
  },
  // 😊 kvokka: kis kerek barna erszényes, mindig mosolyog; ugrálva halad
  quokka() {
    const k = kit(0.7), B = 0xa98463, L = 0xdcc3a2, D = 0x5e4636, P = 0xffc2d6;
    const body = k.node(k.inner, 0, 0.55, 0); k.ball(body, B, 0.38, [0, 0, 0], [0.9, 1.05, 0.95]); k.ball(body, L, 0.25, [0, -0.05, -0.26], [1, 1.2, 0.5]);
    const head = k.node(k.inner, 0, 1.05, -0.18); k.ball(head, B, 0.3, [0, 0, 0]);
    k.ball(head, L, 0.12, [0, -0.08, -0.24], [1.1, 0.85, 0.9]);
    for (const sx of [-1, 1]) { k.ball(head, B, 0.095, [sx * 0.2, 0.25, 0.02], [1, 1, 0.5]); k.ball(head, P, 0.055, [sx * 0.2, 0.25, -0.02], [1, 1, 0.4]); }
    const f = face(k, head, { eyeY: 0.07, nose: 0x3b2a2a, noseR: 0.04, noseAt: [0, -0.04, -0.355], smileAt: [0, -0.14, -0.335], smileR: 0.065 });
    const tail = k.node(k.inner, 0, 0.35, 0.3); k.cone(tail, B, 0.06, 0.38, [0, -0.1, 0.16], [2.0, 0, 0]);
    const lg = legs(k, B, [[-0.15, 0.05], [0.15, 0.05]], 0.3, { r: 0.075, footColor: D });
    for (const hip of lg) k.ball(hip, D, 0.06, [0, -0.27, -0.07], [1, 0.5, 1.9]);
    return done(k, { body, head, ...f, tail, tailWag: 0.3, hopper: true, arm: arm(k, B, 0.3, 0.75, -0.25), legs: lg });
  },
  // 🦔 hangyászsün: sötét bunda, krémszínű, fekete hegyű tüskék, hosszú cső orr (nem sün!)
  echidna() {
    const k = kit(0.95), F = 0x4a3a30, S = 0xf2e2b8, T = 0x2b2420;
    const body = k.node(k.inner, 0, 0.33, 0); k.ball(body, F, 0.4, [0, 0, 0.04], [1, 0.72, 1.12]);
    const up = new THREE.Vector3(0, 1, 0), R = [0.4, 0.29, 0.45];
    for (let i = 0, n = 0; i < 80 && n < 20; i++) {                       // ritkább, hosszabb, kétszínű tüskék
      const y = 1 - (i + 0.5) / 40, rad = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
      const d = new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad);
      if (d.y < 0.1 || d.z < -0.25) continue;
      n++;
      const q = new THREE.Quaternion().setFromUnitVectors(up, d), at = [d.x * R[0], d.y * R[1], 0.04 + d.z * R[2]];
      k.cone(body, S, 0.04, 0.3, at, q); k.cone(body, T, 0.02, 0.09, [at[0] + d.x * 0.15, at[1] + d.y * 0.15, at[2] + d.z * 0.15], q);
    }
    const head = k.node(k.inner, 0, 0.32, -0.36); k.ball(head, F, 0.22, [0, 0, 0], [1, 0.9, 1]);
    k.cyl(head, F, 0.045, 0.36, [0, -0.146, -0.298], [-Math.PI / 2 - 0.5, 0, 0]); k.ball(head, T, 0.04, [0, -0.232, -0.456]);
    const f = face(k, head, { r: 0.22, eyeX: 0.09, eyeY: 0.05, eyeR: 0.036, cheekX: 0.14, cheekY: -0.05, nose: null, smileAt: [0, -0.11, -0.19], smileR: 0.04 });
    return done(k, { body, head, ...f, legs: legs(k, F, QUAD(0.17, 0.2), 0.13, { r: 0.05, foot: 'stub' }) });
  },

  // --- Afrika ---
  // 🐘 elefánt: nagy, kékesszürke, hatalmas legyező fül, lelógó, a végén kunkorodó ormány, kis agyar
  elephant() {
    const k = kit(1.08), G = 0x9ea6bc, D = 0x7d859c, P = 0xf2b8cc, W = 0xfffbef;
    const body = k.node(k.inner, 0, 0.88, 0.05); k.ball(body, G, 0.55, [0, 0, 0], [0.95, 0.85, 1.2]);
    const head = k.node(k.inner, 0, 1.25, -0.6); k.ball(head, G, 0.36, [0, 0, 0], [1, 0.95, 0.95]);
    for (const sx of [-1, 1]) {
      k.ball(head, G, 0.3, [sx * 0.4, 0.02, 0.1], [0.22, 1.05, 0.95], [0, sx * 0.35, 0]);            // legyező fül
      k.ball(head, P, 0.22, [sx * 0.4, 0.02, 0.07], [0.15, 1.0, 0.9], [0, sx * 0.35, 0]);
      k.cone(head, W, 0.035, 0.16, [sx * 0.13, -0.24, -0.27], [-2.3, 0, sx * 0.15]);                  // kis agyar
    }
    const trunk = [[0, -0.06, -0.33, 0.11], [0, -0.2, -0.4, 0.095], [0, -0.35, -0.43, 0.085], [0, -0.49, -0.43, 0.075], [0, -0.6, -0.39, 0.068], [0, -0.66, -0.31, 0.062]];
    for (const [x, y, z, r] of trunk) k.ball(head, G, r, [x, y, z]);
    k.ball(head, D, 0.05, [0, -0.66, -0.25], [1, 1, 0.5]);                                              // az ormány vége
    const f = face(k, head, { r: 0.36, eyeX: 0.15, eyeY: 0.08, eyeR: 0.05, cheekX: 0.22, cheekY: -0.08, nose: null, smile: null, smileAt: [0, -0.2, -0.3], smileR: 0.05 });
    const tail = k.node(k.inner, 0, 1.0, 0.68);
    k.cyl(tail, G, 0.025, 0.4, [0, -0.17, 0.05], [0.25, 0, 0]); k.ball(tail, D, 0.045, [0, -0.38, 0.1], [1, 1.5, 1]);
    return done(k, { body, head, ...f, tail, tailWag: 0.4, legs: legs(k, G, QUAD(0.27, 0.36), 0.6, { r: 0.13, foot: 'hoof', footColor: 0xe9e1d2 }) });
  },
  // 🦒 zsiráf: hosszú nyak és láb, barna foltok, két bütyök a fején, rövid sörény
  giraffe() {
    const k = kit(0.86), Y = 0xf4c463, S = 0xa8622e, L = 0xfff0c8, D = 0x6b3e1e;
    const body = k.node(k.inner, 0, 1.2, 0.05); k.ball(body, Y, 0.4, [0, 0, 0], [0.78, 0.75, 1.15]);
    const ER = [0.4 * 0.78, 0.4 * 0.75, 0.4 * 1.15];                                                    // a test ellipszoidjának sugarai
    for (const [ux, uy, uz, s] of [[0.9, 0.2, -0.45, 1], [0.85, 0.3, 0.4, 0.9], [0.95, -0.25, 0.05, 0.8], [-0.9, 0.25, -0.2, 1], [-0.85, 0.1, 0.45, 0.9], [-0.9, -0.3, -0.5, 0.75],
      [0.35, 0.9, -0.15, 0.9], [-0.3, 0.9, 0.3, 0.9], [0.1, 0.6, 0.8, 0.8], [0, 0.6, -0.8, 0.7]]) {
      const u = new THREE.Vector3(ux, uy, uz).normalize(), p = [ER[0] * u.x, ER[1] * u.y, ER[2] * u.z];
      k.ball(body, S, 0.1 * s, p, [1, 0.8, 0.22], qLook(new THREE.Vector3(u.x / ER[0], u.y / ER[1], u.z / ER[2])));
    }
    const nq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0, 0)), nd = new THREE.Vector3(0, 1, 0).applyQuaternion(nq);
    const n0 = new THREE.Vector3(0, 1.38, -0.3), NL = 1.0, NX = new THREE.Vector3(1, 0, 0), NB = new THREE.Vector3().crossVectors(NX, nd);   // NB: a nyak háta
    k.cyl(k.inner, Y, 0.1, NL, n0.clone().addScaledVector(nd, NL / 2).toArray(), nq);
    for (let i = 0; i < 4; i++) {                                                                       // foltok a nyakon és a sörény
      for (const [phi, dt] of [[Math.PI / 2, 0], [-Math.PI / 2, 0.11], [Math.PI / 2 - 1.0, 0.12], [-Math.PI / 2 + 1.0, 0.02]]) {
        const rad = NX.clone().multiplyScalar(Math.sin(phi)).addScaledVector(NB, Math.cos(phi) * -1), p = n0.clone().addScaledVector(nd, 0.14 + i * 0.22 + dt).addScaledVector(rad, 0.1);
        if (p.y < 2.25) k.ball(k.inner, S, 0.05, p.toArray(), [1, 1.2, 0.25], qLook(rad));
      }
      k.ball(k.inner, D, 0.045, n0.clone().addScaledVector(nd, 0.15 + i * 0.24).addScaledVector(NB, 0.09).toArray(), [0.6, 1.6, 0.8], nq);
    }
    const head = k.node(k.inner, 0, 2.43, -0.66); k.ball(head, Y, 0.19, [0, 0, 0], [0.9, 0.9, 1.15]);
    k.ball(head, L, 0.13, [0, -0.06, -0.17], [1, 0.85, 1.05]);
    for (const sx of [-1, 1]) {
      k.cyl(head, Y, 0.028, 0.14, [sx * 0.07, 0.2, 0.03], [0, 0, -sx * 0.15]); k.ball(head, D, 0.04, [sx * 0.082, 0.28, 0.03]);   // bütykök
      k.ball(head, Y, 0.06, [sx * 0.19, 0.07, 0.04], [1.9, 0.6, 0.6], [0, 0, -sx * 0.3]);                                          // fül
    }
    const f = face(k, head, { r: 0.19, eyeX: 0.085, eyeY: 0.05, eyeR: 0.038, cheekX: 0.12, cheekY: -0.04, nose: null, smileAt: [0, -0.12, -0.27], smileR: 0.045 });
    k.ball(head, D, 0.016, [0.04, -0.05, -0.3]); k.ball(head, D, 0.016, [-0.04, -0.05, -0.3]);          // orrlyuk
    const tail = k.node(k.inner, 0, 1.3, 0.5);
    k.cyl(tail, Y, 0.02, 0.45, [0, -0.2, 0.04], [0.2, 0, 0]); k.ball(tail, D, 0.04, [0, -0.43, 0.08], [1, 1.6, 1]);
    return done(k, { body, head, ...f, tail, tailWag: 0.5, legs: legs(k, Y, QUAD(0.17, 0.3), 1.08, { r: 0.055, foot: 'hoof', footColor: D }) });
  },
  // 🦓 zebra (a ló-alakból): fehér, fekete csíkok a testen, a nyakon és a lábon, csíkos sörény, szürke pofa
  zebra() {
    const k = kit(0.85), W = 0xfdfdff, K = 0x2b2b3a;
    const u = horse(k, { body: W, mane: K, maneAlt: W, hoof: K, snout: 0x8e8e9c, nose: 0x3b3b48 });
    for (const z of [-0.36, -0.18, 0, 0.18, 0.36]) {                                                   // széles csíkok a testen (körbeérő szalagok)
      const c = Math.sqrt(1 - (z / 0.625) ** 2) * 1.045;
      k.cyl(u.body, K, 0.5, 0.08, [0, 0, z], [Math.PI / 2, 0, 0], [0.75 * c, 0.65 * c]);
    }
    const nq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), nc = new THREE.Vector3(0, 1.3, -0.62);
    for (const t of [-0.17, 0, 0.17]) {                                                                 // csíkok a nyakon
      const c = Math.sqrt(1 - (t / 0.364) ** 2) * 1.06, p = nc.clone().add(new THREE.Vector3(0, t, 0).applyQuaternion(nq));
      k.cyl(k.inner, K, 0.28, 0.06, p.toArray(), nq, [0.8 * c, 0.9 * c]);
    }
    for (const x of [-0.1, 0.1]) k.ball(u.head, K, 0.035, [x, 0.14, -0.2], [0.6, 1.6, 0.5], [0.5, 0, x > 0 ? -0.4 : 0.4]);   // csík a homlokon
    for (const hip of u.legs) for (const y of [0.18, 0.34, 0.5]) k.cyl(hip, K, 0.075, 0.045, [0, -y, 0]);
    return done(k, u);
  },
  // 🦁 oroszlán: aranysárga, kerek, dús sörény, krémszínű pofa, bojtos farok
  lion() {
    const k = kit(0.95), B = 0xe6ae55, M = 0xb8642a, M2 = 0xcf7c34, L = 0xfbe5bc, D = 0x7a3c1c;
    const body = k.node(k.inner, 0, 0.6, 0); k.ball(body, B, 0.42, [0, 0, 0], [0.88, 0.8, 1.25]);
    const head = k.node(k.inner, 0, 1.06, -0.5);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; k.ball(head, i % 2 ? M : M2, 0.15, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.06], [1, 1, 0.8]); }
    k.ball(head, M, 0.3, [0, 0, 0.12], [1.05, 1.05, 0.7]);
    k.ball(head, B, 0.28, [0, 0, -0.02]);
    for (const sx of [-1, 1]) { k.ball(head, B, 0.075, [sx * 0.2, 0.25, -0.05], [1, 1, 0.6]); k.ball(head, D, 0.045, [sx * 0.2, 0.25, -0.085], [1, 1, 0.4]); }
    k.ball(head, L, 0.13, [0, -0.08, -0.22], [1.2, 0.85, 0.85]);
    const f = face(k, head, { r: 0.28, eyeX: 0.11, eyeY: 0.07, eyeR: 0.045, cheekX: 0.18, cheekY: -0.04, nose: 0x8a4a3a, noseR: 0.045, noseAt: [0, -0.03, -0.335], smileAt: [0, -0.15, -0.31], smileR: 0.055 });
    const tail = k.node(k.inner, 0, 0.7, 0.55);
    k.cyl(tail, B, 0.03, 0.5, [0, 0.05, 0.2], [1.1, 0, 0]); k.ball(tail, M, 0.08, [0, 0.16, 0.44], [1, 1, 1.3]);
    return done(k, { body, head, ...f, tail, arm: arm(k, B, 0.36, 0.72, -0.22), legs: legs(k, B, QUAD(0.21, 0.33), 0.44, { r: 0.085, footColor: L }) });
  },
  // 🦛 víziló: nagy, kerek, lilásszürke, széles pofa orrlyukakkal a tetején, apró fül, rövid láb
  hippo() {
    const k = kit(0.95), G = 0xa893b8, L = 0xd6bfd8, D = 0x6d5a7e, P = 0xffb8d0;
    const body = k.node(k.inner, 0, 0.55, 0.05); k.ball(body, G, 0.5, [0, 0, 0], [1, 0.8, 1.3]);
    k.ball(body, L, 0.36, [0, -0.13, -0.08], [1.05, 0.55, 1.2]);
    const head = k.node(k.inner, 0, 0.78, -0.62); k.ball(head, G, 0.3, [0, 0.04, 0.04], [1.05, 0.9, 1]);
    k.ball(head, L, 0.26, [0, -0.08, -0.2], [1.25, 0.78, 0.95]);
    for (const sx of [-1, 1]) {
      k.ball(head, D, 0.03, [sx * 0.09, 0.07, -0.42], [1, 0.7, 1]);                                     // orrlyuk
      k.ball(head, G, 0.06, [sx * 0.19, 0.31, 0.06], [1, 1, 0.6]); k.ball(head, P, 0.036, [sx * 0.19, 0.31, 0.03], [1, 1, 0.4]);   // apró fül
    }
    const f = face(k, head, { r: 0.3, eyeAt: [0.13, 0.2, -0.17], eyeR: 0.045, cheekAt: [0.25, -0.05, -0.25], nose: null, smileAt: [0, -0.13, -0.435], smileR: 0.07 });
    const tail = k.node(k.inner, 0, 0.62, 0.68); k.cone(tail, G, 0.04, 0.14, [0, -0.04, 0.05], [2.2, 0, 0]);
    return done(k, { body, head, ...f, tail, tailWag: 0.6, legs: legs(k, G, QUAD(0.28, 0.36), 0.3, { r: 0.12, foot: 'stub', footColor: D }) });
  },
  // 🟫 szurikáta: felegyenesedve őrködik, sötét szemfolt, hegyes orr, a mancsai a mellén, vékony farok
  meerkat() {
    const k = kit(0.62), B = 0xd9b98a, L = 0xf3e2c2, D = 0x5e4532;
    const body = k.node(k.inner, 0, 0.62, 0); k.ball(body, B, 0.3, [0, 0, 0], [0.78, 1.45, 0.78]); k.ball(body, L, 0.2, [0, -0.05, -0.15], [0.95, 1.6, 0.5]);
    const head = k.node(k.inner, 0, 1.22, -0.06); k.ball(head, B, 0.22, [0, 0, 0], [0.95, 0.95, 1]);
    k.ball(head, L, 0.12, [0, -0.05, -0.16], [0.9, 0.8, 1.1]); k.cone(head, L, 0.07, 0.14, [0, -0.06, -0.27], [-Math.PI / 2, 0, 0]);
    for (const sx of [-1, 1]) { k.ball(head, D, 0.065, [sx * 0.085, 0.04, -0.15], [1, 0.8, 0.5]); k.ball(head, D, 0.05, [sx * 0.2, 0.06, 0.02], [0.6, 1, 0.8]); }
    const f = face(k, head, { r: 0.22, eyeAt: [0.085, 0.04, -0.19], eyeR: 0.035, iris: null, cheekX: 0.13, cheekY: -0.07, nose: 0x3b2a2a, noseR: 0.03, noseAt: [0, -0.06, -0.335], smileAt: [0, -0.13, -0.2], smileR: 0.04 });
    for (const sx of [-1, 1]) k.ball(body, B, 0.05, [sx * 0.09, 0.2, -0.22], [0.9, 1.7, 0.9], [0.5, 0, 0]);   // a mancsai a mellén
    const tail = k.node(k.inner, 0, 0.32, 0.2); k.cone(tail, B, 0.05, 0.55, [0, -0.1, 0.2], [2.35, 0, 0]); k.ball(tail, D, 0.03, [0, -0.28, 0.39]);
    return done(k, { body, head, ...f, tail, tailWag: 0.2, arm: arm(k, B, 0.19, 0.85, -0.12), legs: legs(k, B, [[-0.12, 0.02], [0.12, 0.02]], 0.24, { r: 0.06, footColor: D }) });
  },
  // 🦩 flamingó: rózsaszín, hosszú vékony láb, S alakú nyak, lefelé hajló, fekete hegyű csőr
  flamingo() {
    const k = kit(0.9), P = 0xff9cc4, R = 0xff6f9f, W = 0xfff2f6, K = 0x2b2b3a;
    const body = k.node(k.inner, 0, 1.05, 0.05); k.ball(body, P, 0.3, [0, 0, 0], [0.82, 0.72, 1.22]);
    const neck = new THREE.CatmullRomCurve3([[1.12, -0.24], [1.27, -0.35], [1.43, -0.33], [1.57, -0.23], [1.74, -0.2]].map(([y, z]) => new THREE.Vector3(0, y, z)));
    for (let i = 0; i <= 12; i++) k.ball(k.inner, P, 0.058 - i * 0.0012, neck.getPoint(i / 12).toArray());
    const head = k.node(k.inner, 0, 1.86, -0.24); k.ball(head, P, 0.13, [0, 0, 0]);
    k.cone(head, W, 0.045, 0.13, [0, -0.03, -0.17], [-Math.PI / 2 - 0.3, 0, 0]); k.cone(head, K, 0.03, 0.08, [0, -0.08, -0.255], [-Math.PI / 2 - 1.3, 0, 0]);
    const f = face(k, head, { r: 0.13, eyeX: 0.06, eyeY: 0.04, eyeR: 0.028, cheekX: 0.08, cheekY: -0.03, nose: null, smile: null, smileAt: [0, -0.06, -0.12], smileR: 0.03 });
    const tail = k.node(k.inner, 0, 1.1, 0.35); k.cone(tail, R, 0.07, 0.2, [0, 0, 0.06], [1.9, 0, 0]);
    return done(k, { body, head, ...f, tail, tailWag: 0.3, wings: wings(k, R, 0.23, 1.12, 0.05, 0.18, [0.3, 0.6, 1.15]), legs: legs(k, R, [[-0.06, 0.05], [0.06, 0.05]], 0.98, { r: 0.022, foot: 'bird' }) });
  },
  // 🐒 majom: barna, világos szív alakú arc, nagy kerek fül, hosszú kunkorodó farok
  monkey() {
    const k = kit(0.78), B = 0x9a6a45, L = 0xf3d3b0, D = 0x6b4226;
    const body = k.node(k.inner, 0, 0.55, 0); k.ball(body, B, 0.32, [0, 0, 0], [0.95, 1.05, 0.9]); k.ball(body, L, 0.21, [0, -0.05, -0.2], [1, 1.2, 0.5]);
    const head = k.node(k.inner, 0, 1.04, -0.08); k.ball(head, B, 0.3, [0, 0, 0]);
    for (const sx of [-1, 1]) {
      k.ball(head, L, 0.12, [sx * 0.1, 0.06, -0.2], [1, 1.1, 0.6]);                                     // a szív alakú arc két fele
      k.ball(head, B, 0.11, [sx * 0.32, 0.03, 0.02], [0.6, 1, 1]); k.ball(head, L, 0.075, [sx * 0.34, 0.03, -0.01], [0.5, 1, 0.9]);   // kerek fül
    }
    k.ball(head, L, 0.15, [0, -0.1, -0.2], [1.15, 0.8, 0.8]);
    const f = face(k, head, { r: 0.3, eyeAt: [0.1, 0.06, -0.31], eyeR: 0.045, cheekAt: [0.17, -0.07, -0.29], nose: 0x6b4226, noseR: 0.025, noseAt: [0, -0.06, -0.33], smileAt: [0, -0.15, -0.31], smileR: 0.06 });
    const tail = k.node(k.inner, 0, 0.35, 0.25);
    k.cyl(tail, B, 0.035, 0.5, [0, 0.14, 0.18], [0.7, 0, 0]); k.ring(tail, B, 0.1, [0, 0.42, 0.36], [0, Math.PI / 2, 0]);
    return done(k, { body, head, ...f, tail, tailWag: 0.5, arm: arm(k, B, 0.3, 0.75, -0.08), legs: legs(k, B, [[-0.14, 0.02], [0.14, 0.02]], 0.26, { r: 0.07, footColor: D }) });
  },
};

// Ló-alak (póni, unikornis): hosszú nyak, sörény, lófarok, pata; az unikornisnak szarva is van
function horse(k, { body, mane, maneAlt = mane, hoof, horn = null, snout = body, nose = 0xff8fc8 }) {
  const bodyN = k.node(k.inner, 0, 0.95, 0); k.ball(bodyN, body, 0.5, [0, 0, 0], [0.75, 0.65, 1.25]);
  k.ball(k.inner, body, 0.28, [0, 1.3, -0.62], [0.8, 1.3, 0.9], [-0.5, 0, 0]);
  const head = k.node(k.inner, 0, 1.55, -0.85);
  k.ball(head, body, 0.27, [0, 0, 0], [0.9, 0.9, 1.15]); k.ball(head, snout, 0.16, [0, -0.06, -0.26], [1, 0.9, 1.1]);
  k.ball(head, nose, 0.04, [0, -0.03, -0.43]);
  for (const sx of [-1, 1]) k.cone(head, body, 0.07, 0.2, [sx * 0.14, 0.3, 0.02], [0, 0, -sx * 0.25]);
  k.ball(head, mane, 0.1, [0, 0.25, -0.12], [1, 0.8, 1]);
  if (horn) k.cone(head, horn, 0.06, 0.38, [0, 0.46, -0.1], [-0.25, 0, 0]);
  for (let i = 0; i < 5; i++) k.ball(k.inner, i % 2 ? maneAlt : mane, 0.12, [0, 1.78 - i * 0.14, -0.62 + i * 0.16], [0.8, 1, 0.9]);
  const f = face(k, head, { r: 0.29, eyeX: 0.14, eyeY: 0.07, eyeR: 0.05, cheekX: 0.18, cheekY: -0.06, nose: null, smileAt: [0, -0.1, -0.43], smileR: 0.05 });
  const tail = k.node(k.inner, 0, 1.0, 0.62);
  for (let i = 0; i < 4; i++) k.ball(tail, i % 2 ? maneAlt : mane, 0.13 - i * 0.015, [0, -i * 0.13, 0.08 + i * 0.1]);
  return { body: bodyN, head, ...f, tail, tailWag: 0.6, legs: legs(k, body, QUAD(0.2, 0.38), 0.78, { r: 0.07, foot: 'hoof', footColor: hoof }) };   // a csípő a testben van: nincs rés
}

// --- „Az én unikornisom": a ló-alak, rajta minden, amit az öltöztetőben választott -------------------------------
// Minden ruhadarab valódi 3D alkatrész ugyanabból a néhány alapformából, így a kert egyetlen példányosított
// rajzolásába is belefér. A nagy felületek gömbök, az apró díszek kis gömbök (kevés háromszög).
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const qLook = n => new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), n.clone().normalize());   // a lapos forma eleje n felé
const qEuler = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
function unicornAvatar(k, a) {
  const B = a.body, M = i => a.mane[i % a.mane.length];
  const bead = (n, color, r, pos, s = [1, 1, 1], rot) => k.put(n, BEAD, color, pos, [r * s[0], r * s[1], r * s[2]], rot);
  // test (a minta a test felszínén ül) – a test sugarai: 0.375 × 0.325 × 0.625
  const bodyN = k.node(k.inner, 0, 0.95, 0); k.ball(bodyN, B, 0.5, [0, 0, 0], [0.75, 0.65, 1.25]);
  const R = [0.375, 0.325, 0.625];
  const onBody = (dx, dy, dz, prim, color, size) => {
    const d = V3(dx, dy, dz).normalize(), t = 1 / Math.hypot(d.x / R[0], d.y / R[1], d.z / R[2]), p = d.multiplyScalar(t);
    const n = V3(p.x / R[0] ** 2, p.y / R[1] ** 2, p.z / R[2] ** 2).normalize();
    k.put(bodyN, prim, color, p.add(n.clone().multiplyScalar(0.006)).toArray(), size, qLook(n));
  };
  const SIDE = [[1, 0.25, -0.45], [1, -0.15, 0.05], [1, 0.35, 0.5]], TOP = [[0.25, 1, -0.1], [-0.25, 1, 0.35]];
  const each = fn => { for (const sx of [-1, 1]) SIDE.forEach(([x, y, z]) => fn(sx * x, y, z)); TOP.forEach(([x, y, z]) => fn(x, y, z)); };
  if (a.pattern === 'spots') each((x, y, z) => onBody(x, y, z, BEAD, a.patternColor, [0.075, 0.075, 0.02]));
  if (a.pattern === 'stars') each((x, y, z) => onBody(x, y, z, STAR, '#ffcf3f', [0.075, 0.075, 0.08]));
  if (a.pattern === 'hearts') each((x, y, z) => onBody(x, y, z, HEART, '#ff5d8f', [0.075, 0.075, 0.08]));
  if (a.pattern === 'stripes') for (const sx of [-1, 1]) for (const z of [-0.42, -0.14, 0.14, 0.42]) onBody(sx, 0.2, z, BEAD, a.patternColor, [0.035, 0.17, 0.015]);

  // nyak, fej, arc
  k.ball(k.inner, B, 0.28, [0, 1.3, -0.62], [0.8, 1.3, 0.9], [-0.5, 0, 0]);
  const head = k.node(k.inner, 0, 1.55, -0.85);
  k.ball(head, B, 0.27, [0, 0, 0], [0.9, 0.9, 1.15]); k.ball(head, B, 0.16, [0, -0.06, -0.26], [1, 0.9, 1.1]);
  k.ball(head, 0xff8fc8, 0.04, [0, -0.03, -0.43]);
  for (const sx of [-1, 1]) k.cone(head, B, 0.07, 0.2, [sx * 0.14, 0.3, 0.02], [0, 0, -sx * 0.25]);
  const f = face(k, head, { r: 0.29, eyeX: 0.14, eyeY: 0.07, eyeR: 0.05, iris: a.dark ? '#ffffff' : null, smile: a.dark ? '#ffd6ea' : INK,
    cheekX: 0.18, cheekY: -0.06, nose: null, smileAt: [0, -0.1, -0.43], smileR: 0.05 });   // a mosoly az orr elején (nem lóg le alá)
  const eyeN = f.eyes.map(e => V3(e.position.x, e.position.y, e.position.z));
  const faceN = p => V3(p.x / 0.243 ** 2, p.y / 0.243 ** 2, p.z / 0.31 ** 2).normalize();       // a fej felszínének iránya
  if (a.eyes === 'hearts') {                       // szívszemek: a szem helyén (a saját csontján, így pislog is)
    for (let i = k.parts.length - 1; i >= 0; i--) if (f.eyes.includes(k.parts[i].node)) k.parts.splice(i, 1);
    f.eyes.forEach((e, i) => k.put(e, HEART, '#ff2f7a', [0, 0, 0], [0.065, 0.065, 0.06], qLook(faceN(eyeN[i]))));
  }
  if (a.eyes === 'glasses') {                      // napszemüveg: két sötét lencse és egy híd
    eyeN.forEach(p => { const n = faceN(p), c = p.clone().add(n.clone().multiplyScalar(0.035)); bead(head, '#3b2a63', 0.068, c.toArray(), [1, 0.85, 0.3], qLook(n)); bead(head, '#ffffff', 0.016, c.add(n.clone().multiplyScalar(0.02)).add(V3(0, 0.022, 0)).toArray()); });
    k.cyl(head, '#2b2440', 0.013, 0.16, [0, eyeN[0].y + 0.01, -0.3], [0, 0, Math.PI / 2]);
  }

  // szarv: a fej tetején, kicsit előre dőlve (a csont a szarv tövén ül)
  const hn = k.node(head, 0, 0.276, -0.053); hn.rotation.x = -0.25;
  if (a.horn.length > 1) {                         // szivárványszarv: egymásba ülő kúpok, mindegyik feljebb kezdődik
    a.horn.forEach((c, i) => { const y0 = i * 0.055, h = 0.38 - y0; k.cone(hn, c, 0.06 * h / 0.38 + i * 0.003, h, [0, y0 + h / 2, 0]); });
  } else k.cone(hn, a.horn[0], 0.06, 0.38, [0, 0.19, 0]);
  if (a.hornstyle === 'spiral') {                  // csavart szarv: ferde barázdák körben
    const g = a.horn.length > 1 ? '#ffffff' : mix(a.horn[0], INK_HEX, 0.35);
    for (const y of [0.08, 0.16, 0.24]) k.cyl(hn, g, 0.06 * (1 - y / 0.38) + 0.008, 0.016, [0, y, 0], [0, 0, 0.35]);
  }

  // sörény (a nyak tetején), homlokfürt és farok – négyféle frizura
  const tail = k.node(k.inner, 0, 1.0, 0.62);
  if (a.manestyle === 'braid') {
    for (let i = 0; i < 7; i++) bead(k.inner, M(i), 0.085, [(i % 2 ? 1 : -1) * 0.025, 1.8 - i * 0.1, -0.64 + i * 0.115], [0.85, 1.1, 0.9]);
    bead(head, M(0), 0.08, [0, 0.25, -0.12], [1, 0.8, 1]);
    for (let i = 0; i < 6; i++) bead(tail, M(i + 1), 0.075 - i * 0.004, [(i % 2 ? 1 : -1) * 0.02, -i * 0.1, 0.06 + i * 0.07]);
    bead(tail, '#ffffff', 0.04, [0, -0.62, 0.48], [1.4, 0.7, 1.4]);
  } else if (a.manestyle === 'wild') {
    for (let i = 0; i < 6; i++) k.cone(k.inner, M(i), 0.075, 0.28, [(i % 2 ? 1 : -1) * 0.03, 1.82 - i * 0.12, -0.6 + i * 0.14], [0.55 + i * 0.12, 0, (i % 2 ? -1 : 1) * 0.3]);
    for (const sx of [-1, 0, 1]) k.cone(head, M(sx + 1), 0.05, 0.18, [sx * 0.06, 0.3, -0.1], [-0.6, 0, -sx * 0.35]);
    for (let i = 0; i < 5; i++) k.cone(tail, M(i), 0.08, 0.36, [(i - 2) * 0.04, -0.12, 0.16], [2.1 + Math.abs(i - 2) * 0.12, 0, (i - 2) * 0.22]);
  } else if (a.manestyle === 'curl') {
    for (let i = 0; i < 5; i++) { const p = [0, 1.78 - i * 0.14, -0.62 + i * 0.16]; k.ring(k.inner, M(i), 0.09, p, [0, Math.PI / 2, i * 0.9]); bead(k.inner, M(i + 1), 0.06, p); }
    k.ring(head, M(0), 0.07, [0, 0.27, -0.12], [0, Math.PI / 2, 0]); bead(head, M(1), 0.05, [0, 0.27, -0.12]);
    for (let i = 0; i < 3; i++) { const p = [0, -i * 0.15, 0.1 + i * 0.1]; k.ring(tail, M(i), 0.1 - i * 0.015, p, [0, Math.PI / 2, i * 1.3]); bead(tail, M(i + 1), 0.065 - i * 0.01, p); }
  } else {                                         // hullámos (az alap)
    for (let i = 0; i < 5; i++) k.ball(k.inner, M(i), 0.12, [0, 1.78 - i * 0.14, -0.62 + i * 0.16], [0.8, 1, 0.9]);
    k.ball(head, M(0), 0.1, [0, 0.25, -0.12], [1, 0.8, 1]);
    for (let i = 0; i < 4; i++) k.ball(tail, M(i), 0.13 - i * 0.015, [0, -i * 0.13, 0.08 + i * 0.1]);
  }

  // szárny: két csont a háton (a kert integetéskor csapkod velük); a lapok hátra és kifelé állnak
  let wingN = null;
  if (a.wing !== 'none') {
    wingN = [-1, 1].map(sx => k.node(k.inner, sx * 0.2, 1.2, -0.05));
    wingN.forEach((w, i) => {
      const sx = i ? 1 : -1;
      const blade = (color, L, W, rx, rz, out = 0, prim = BEAD) => {
        const q = qEuler(rx, 0, -sx * rz), ax = V3(0, 1, 0).applyQuaternion(q);
        k.put(w, prim, color, ax.multiplyScalar(L * 0.85).add(V3(sx * out, 0, 0)).toArray(), [0.028, L, W], q);
      };
      if (a.wing === 'feather') { blade('#ffffff', 0.36, 0.08, 0.35, 0.55); blade('#f0e6ff', 0.3, 0.075, 0.8, 0.6, 0.01); blade('#ffffff', 0.24, 0.07, 1.25, 0.6, 0.02); }
      if (a.wing === 'butterfly') { blade('#ff8fc8', 0.3, 0.2, 0.3, 0.6); blade('#8e5be8', 0.2, 0.14, 1.45, 0.5, 0.01); bead(w, '#ffffff', 0.04, [sx * 0.2, 0.42, 0.14], [0.35, 1, 1]); }
      if (a.wing === 'fairy') { blade('#cfefff', 0.36, 0.12, 0.25, 0.55); blade('#e6f8ff', 0.25, 0.09, 1.2, 0.5, 0.01); blade('#9be6ff', 0.2, 0.03, 0.25, 0.55, 0.02); }
      if (a.wing === 'rainbow') ['#ff5d5d', '#ffb020', '#ffe14d', '#4cc38a', '#4a7dff'].forEach((c, j) => blade(c, 0.36 - j * 0.045, 0.2 - j * 0.03, 0.6, 0.55, j * 0.012));
    });
  }

  // fejdísz (a fej tetején; a szarv a közepén átér)
  const topY = (x, z) => 0.243 * Math.sqrt(Math.max(0, 1 - (x / 0.243) ** 2 - (z / 0.31) ** 2));
  if (a.head === 'crown') {
    k.cyl(head, '#ffd24d', 0.115, 0.07, [0, 0.255, -0.02]);
    for (let i = 0; i < 5; i++) { const t = i * Math.PI * 2 / 5; k.cone(head, '#ffd24d', 0.03, 0.09, [Math.sin(t) * 0.105, 0.33, -0.02 - Math.cos(t) * 0.105], null, true); }
    [['#ff5d8f', 0], ['#4aa8ff', -0.9], ['#4cc38a', 0.9]].forEach(([c, t]) => bead(head, c, 0.024, [Math.sin(t) * 0.118, 0.255, -0.02 - Math.cos(t) * 0.118], [1, 1, 0.6], qEuler(0, -t, 0)));
  }
  if (a.head === 'flowers') {
    const FL = ['#ff8fc8', '#ffcf3f', '#8e5be8', '#ff9f43'];
    for (let i = 0; i < 6; i++) { const t = 0.3 + i * Math.PI * 2 / 6, x = Math.sin(t) * 0.16, z = -Math.cos(t) * 0.17; const y = topY(x, z) + 0.01;
      bead(head, FL[i % 4], 0.065, [x, y, z], [1, 0.6, 1]); bead(head, '#ffffff', 0.026, [x, y + 0.035, z]); }
  }
  if (a.head === 'bow') {
    for (const sx of [-1, 1]) k.cone(head, '#ff5d8f', 0.06, 0.13, [sx * 0.07, 0.29, 0.12], [0, 0, sx * Math.PI / 2], true);
    bead(head, '#ff2f7a', 0.038, [0, 0.29, 0.12]);
  }
  if (a.head === 'wizard') {
    k.cyl(head, '#5a2fb0', 0.21, 0.025, [0, 0.255, 0.05], [0.25, 0, 0]);
    k.cone(head, '#6a3fc0', 0.15, 0.4, [0, 0.45, 0.1], [0.35, 0, 0]);
    k.put(head, STAR, '#ffe14d', [0, 0.42, 0.0], [0.05, 0.05, 0.06], qLook(V3(0, 0.35, -1)));
    k.put(head, STAR, '#ffe14d', [0.06, 0.55, 0.07], [0.03, 0.03, 0.05], qLook(V3(0.4, 0.3, -1)));
  }

  // nyakdísz: gyűrű a nyak tövén (a csont a nyak tengelyére merőleges), az eleje lefelé-előre néz
  const neckN = k.node(k.inner, 0, 1.124, -0.524); neckN.rotation.x = -0.5;
  const around = (phi, r = 0, y = 0) => [Math.sin(phi) * (0.205 + r), y, -Math.cos(phi) * (0.23 + r)];
  if (a.neck === 'necklace') {
    for (let i = 0; i < 9; i++) bead(neckN, '#ffcf3f', 0.022, around(-1.6 + i * 0.4, 0.01));
    for (const p of [-0.4, 0, 0.4]) bead(neckN, '#ff5d8f', 0.042, around(p, 0.03, -0.045));
  }
  if (a.neck === 'pearls') {
    for (let i = 0; i < 13; i++) bead(neckN, '#ffffff', 0.032, around(-2 + i * (4 / 12), 0.012));
    bead(neckN, '#ffd6ea', 0.048, around(0, 0.04, -0.065));
  }
  if (a.neck === 'scarf') {
    const g0 = -0.2 * Math.PI, phi = Math.atan2(Math.cos(g0), Math.sin(g0));
    k.ring(neckN, '#ff5d8f', 0.225, [0, 0, 0], new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), -phi).multiply(new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), Math.PI / 2)));
    bead(neckN, '#ff5d8f', 0.06, around(0.45, 0.05, -0.14), [0.8, 2.2, 0.45]); bead(neckN, '#ffffff', 0.03, around(0.45, 0.08, -0.2), [1.4, 0.5, 0.4]);
  }
  if (a.neck === 'cape') {
    k.ball(k.inner, '#c53b6e', 0.5, [0, 1.06, 0.05], [0.8, 0.5, 1.2]);
    bead(neckN, '#ffd24d', 0.045, around(0, 0.03)); for (const p of [-0.7, 0.7]) bead(neckN, '#ffd24d', 0.028, around(p, 0.02));
  }

  const legsN = legs(k, B, QUAD(0.2, 0.38), 0.78, { r: 0.07, foot: 'hoof', footColor: a.hoof });
  return { body: bodyN, head, ...f, tail, tailWag: 0.6, wings: wingN, legs: legsN, avatar: true };
}

export const CHARACTER_KINDS = Object.keys(SP);

// Új barát a kertbe. Ismeretlen fajnál nyuszi (a kert ne álljon le egy elírás miatt).
// opts: az unikornisnál az öltöztető leírása (js/avatar.js) – így ő „az én unikornisom".
export function makeCharacter(kind, opts) {
  return (SP[kind] || SP.bunny)(opts);
}

// Vágtázás (szabad futás, verseny): ugyanaz a csontváz, gyorsabb lábmozgás; ugrás közben csapkod a szárnyával.
export function animateRunner(g, t, speed, airborne = false) {
  const u = g.userData, f = 3 + speed * 10, amp = 0.15 + speed * 0.7, s = speed > 0.02 ? 1 : 0;
  u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * f + (i === 0 || i === 3 ? 0 : Math.PI)) * amp * s; });
  u.inner.position.y = Math.abs(Math.sin(t * f)) * 0.08 * s * (0.5 + speed);
  u.inner.rotation.x = Math.sin(t * f) * 0.03 * s;
  if (u.tail) u.tail.rotation.x = 0.3 + Math.sin(t * f * 0.7) * 0.25 * (0.3 + speed);
  u.head.rotation.x = Math.sin(t * f * 0.5) * 0.05;
  if (u.wings) { const a = airborne ? 0.55 + Math.sin(t * 16) * 0.45 : 0.08 + Math.sin(t * 2) * 0.05; u.wings[0].rotation.z = a; u.wings[1].rotation.z = -a; }
}

// Mozgás: séta (a lábak felváltva lépnek), ugrálva haladó barát (béka), farokcsóválás, integetés vagy szárnycsapkodás.
export function animateCharacter(g, t, speed, waving) {
  const u = g.userData, s = speed > 0.02 ? 1 : 0, f = 4 + speed * 9, amp = 0.2 + speed * 0.6;
  u.legs.forEach((l, i) => { const ph = (u.legs.length === 2 ? i : (i === 0 || i === 3 ? 0 : 1)) * Math.PI; l.rotation.x = Math.sin(t * f + ph) * amp * s; });
  u.inner.position.y = u.hopper ? Math.abs(Math.sin(t * f * 0.5)) * 0.22 * s : Math.abs(Math.sin(t * f)) * 0.07 * s;
  if (u.tail) u.tail.rotation.y = Math.sin(t * 6) * 0.4 * u.tailWag;
  if (u.arm) { u.arm.rotation.z = waving ? -0.6 + Math.sin(t * 9) * 0.45 : Math.PI + 0.3; u.arm.position.y = u.armY + (waving ? 0.1 : 0); }   // nyugalomban lóg, köszönéskor felemeli és integet
  if (u.wings) { const a = waving ? 0.55 + Math.sin(t * 16) * 0.45 : 0.04 + Math.sin(t * 1.7) * 0.03; u.wings[0].rotation.z = a; u.wings[1].rotation.z = -a; }
}

// A barát mérete (a csontok mostani állásában): magasság és szélesség – tesztekhez és a kamera beállításához
const BOX = [[1, 1, 1], [1, 1, 1], [1, 0.5, 1], [1, 0.5, 1], [1, 0.5, 1], [1.17, 1.17, 0.17], [1.3, 1.3, 0.3], [1, 1, 0.15], [1, 1, 0.15]];
export function measureCharacter(g) {
  g.updateMatrixWorld(true);
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity), m = new THREE.Matrix4(), v = new THREE.Vector3();
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  for (const p of g.userData.parts) {
    if (!p.node.visible) continue;
    m.multiplyMatrices(inv, p.node.matrixWorld).multiply(p.m);
    const [bx, by, bz] = BOX[p.prim];
    for (let c = 0; c < 8; c++) { v.set(c & 1 ? bx : -bx, c & 2 ? by : -by, c & 4 ? bz : -bz).applyMatrix4(m); lo.min(v); hi.max(v); }
  }
  return { height: hi.y, bottom: lo.y, width: hi.x - lo.x, depth: hi.z - lo.z };
}

// Példányosított rajzolás: alapformánként egy háló, a barátok alkatrészei a hálók egy-egy példányai.
// update(): minden képkockában a csontok világ-mátrixából számolja az alkatrészek helyét (a rejtett csont alkatrésze eltűnik).
// Puha foltárnyék textúrája (számolt, nincs rajzvászon): középen sötétebb tinta-lila, a széle felé elhalványul
let blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const N = 32, d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r = Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2) / (N / 2), t = Math.min(1, Math.max(0, (r - 0.3) / 0.7));
    d.set([59, 42, 99, Math.round((1 - t * t * (3 - 2 * t)) * 0.42 * 255)], (y * N + x) * 4);
  }
  blobTex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); blobTex.magFilter = blobTex.minFilter = THREE.LinearFilter; blobTex.needsUpdate = true;
  return blobTex;
}

// shadows: puha foltárnyék minden figura alatt (egyetlen példányosított korong, +1 rajzolási hívás). A talajon (groundY)
// marad, és ha a figura a talaj fölé emelkedik, kisebb lesz. Sík talajú jelenetnek való (a kert); a hullámos terepen nincs.
export function createCharacterBatch(scene, { shadows = false, groundY = 0 } = {}) {
  const geos = unitGeometries(), mat = lookMat({ color: 0xffffff }), white = new THREE.Color(0xffffff);
  let shadowMesh = null; const shaded = [];
  const makeShadows = cap => {
    const m = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }), cap);
    m.count = 0; m.frustumCulled = false; m.renderOrder = -1; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m;
  };
  if (shadows) shadowMesh = makeShadows(32);
  // árnyék egy figurához (a köteg figuráié magától jön; a saját modellű cicának ezzel kérhető). rx, rz: fél-szélesség, fél-mélység
  function shadow(g, rx, rz) {
    if (!shadowMesh || shaded.some(s => s.g === g)) return;
    if (rx == null) { const b = measureCharacter(g); rx = b.width * 0.58; rz = b.depth * 0.5; }
    if (shaded.length >= shadowMesh.instanceMatrix.count) { const old = shadowMesh; shadowMesh = makeShadows(old.instanceMatrix.count * 2); scene.remove(old); old.geometry.dispose(); old.material.dispose(); old.dispose(); }
    shaded.push({ g, rx, rz }); shadowMesh.count = shaded.length;
  }
  const unshadow = g => { const i = shaded.findIndex(s => s.g === g); if (i >= 0) { shaded.splice(i, 1); if (shadowMesh) shadowMesh.count = shaded.length; } };
  const make = (geo, cap) => {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.count = 0; m.visible = false; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, white);
    scene.add(m); return m;
  };
  const meshes = geos.map(g => make(g, 32));
  function ensure(i, need) {
    const old = meshes[i]; let cap = old.instanceMatrix.count; if (need <= cap) return;
    while (cap < need) cap *= 2;
    const m = make(old.geometry, cap); m.count = old.count; m.visible = old.count > 0;
    m.instanceMatrix.array.set(old.instanceMatrix.array); m.instanceColor.array.set(old.instanceColor.array);
    scene.remove(old); old.dispose(); meshes[i] = m;
  }
  const chars = [], owners = geos.map(() => []);      // owners[forma][hely] = az a rész, amelyik azt a példányt rajzolja
  function add(g) {
    const parts = g.userData.parts, need = meshes.map(() => 0);
    for (const p of parts) need[p.prim]++;
    need.forEach((n, i) => { if (n) ensure(i, meshes[i].count + n); });
    for (const p of parts) { const m = meshes[p.prim]; p.slot = m.count++; owners[p.prim][p.slot] = p; m.setColorAt(p.slot, p.color); }
    meshes.forEach(m => { m.instanceColor.needsUpdate = true; m.visible = m.count > 0; });
    chars.push(g); shadow(g);
  }
  // Barát eltávolítása (a végtelen világban jönnek-mennek): a helyére a háló utolsó példánya költözik, így nincs lyuk
  // és a példányszám nem nő a végtelenségig.
  function remove(g) {
    const i = chars.indexOf(g); if (i < 0) return false;
    chars.splice(i, 1); unshadow(g);
    for (const p of g.userData.parts) {
      const m = meshes[p.prim], own = owners[p.prim], last = --m.count;
      if (p.slot !== last) { const q = own[last]; q.slot = p.slot; own[p.slot] = q; m.setColorAt(p.slot, q.color); }
      own.length = last; p.slot = -1;
    }
    meshes.forEach(m => { m.instanceColor.needsUpdate = true; m.visible = m.count > 0; });
    return true;
  }
  const M = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const shown = (n, root) => { for (let o = n; o; o = o.parent) { if (!o.visible) return false; if (o === root) return true; } return true; };
  function update() {
    for (const g of chars) {
      const parts = g.userData.parts;
      if (!g.visible) { for (const p of parts) meshes[p.prim].setMatrixAt(p.slot, ZERO); continue; }   // rejtett barát: nincs csont-számolás
      g.updateMatrixWorld(true);
      for (const p of parts) meshes[p.prim].setMatrixAt(p.slot, shown(p.node, g) ? M.multiplyMatrices(p.node.matrixWorld, p.m) : ZERO);
    }
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    if (shadowMesh) {
      shaded.forEach((s, i) => {
        const g = s.g; if (!g.visible || !g.parent) { shadowMesh.setMatrixAt(i, ZERO); return; }
        g.updateMatrixWorld(); const e = g.matrixWorld.elements, sc = Math.hypot(e[0], e[1], e[2]);
        const lift = Math.max(0, e[13] - groundY), k = Math.max(0.35, 1 - lift * 0.5) * sc;
        Q.setFromAxisAngle(UP, Math.atan2(e[8], e[10])); P.set(e[12], groundY + 0.015, e[14]); S.set(s.rx * k, 1, s.rz * k);
        shadowMesh.setMatrixAt(i, M.compose(P, Q, S));
      });
      shadowMesh.instanceMatrix.needsUpdate = true;
    }
  }
  function dispose() {
    for (const m of meshes) { scene.remove(m); m.dispose(); } geos.forEach(g => g.dispose()); mat.dispose(); chars.length = 0;
    if (shadowMesh) { scene.remove(shadowMesh); shadowMesh.geometry.dispose(); shadowMesh.material.dispose(); shadowMesh.dispose(); shaded.length = 0; }
  }
  return { add, remove, update, dispose, shadow, get meshes() { return meshes; }, get size() { return chars.length; }, get shadows() { return shaded.length; } };
}
