// Szabad futkározás: végtelen, procedurálisan generált világ (dombok, fák, virágok, sziklák, rönkök, tócsák).
// A világ a játékos körül, darabokban (chunk) készül, így addig futhat, ameddig csak akar – csak a talajon.
// Irányítás: rövid koppintás = oda fut, és ott megáll; tartott ujj (vagy Pencil) = arra fut, amerre mutat.
// Ugrás: a nagy gomb, de a kis akadályokat (kő, rönk) magától is átugorja, és a tetejükre is felérhet.
// Barátok: némelyik csatlakozik és veled fut (legfeljebb négy, V alakban), némelyik csak integet.
import { icon } from '../icons.js';
import * as THREE from '../../vendor/three.module.js';
import { mat as lookMat, addLights, createQuality } from '../three/look.js';
import { makeCharacter, animateCharacter, animateRunner, createCharacterBatch, CHARACTER_KINDS } from '../three/characters.js';
import { say } from '../voice.js';
import { play, animalVoice } from '../sounds.js';

const CHUNK = 30, GEN_R = 2, KEEP_R = 3;
const WALK = 7.5, JUMP_V = 8, GRAV = -14;          // csúcsmagasság ≈ 2,3, légi idő ≈ 1,1 mp: bőven elég idő
const PR = 0.45;                                    // a játékos sugara
const GAP = 1.2;                                    // két akadály között mindig ennyi szabad hely marad (> 2·PR): nincs beszorulás
const FOG_NEAR = 26, FOG_FAR = 54;                  // a köd vége a biztosan legyártott távolságon belül: nem látszik a világ széle
const TAP = 0.28;                                   // ennél rövidebb érintés koppintásnak számít (mp)
const PAL_IN = 46, PAL_OUT = 56;                    // a barát figurája ennyin belül készül el / ennyin túl elmegy (ha nem csatlakozott)
const KINDS = CHARACTER_KINDS.filter(k => k !== 'unicorn');
const SLOTS = [[-1.9, 1.8], [1.9, 1.8], [-3.2, 3.5], [3.2, 3.5]];   // a csatlakozott barátok helye: oldalra, hátra
export const MAX_FOLLOWERS = SLOTS.length;

// a legrövidebb forgás a-ból b-be (−π..π): így senki nem pördül körbe
export const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2; return d; };

// --- determinisztikus véletlen, zaj és terep (a világ magja alapján) ---
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smooth = t => t * t * (3 - 2 * t);
export function makeTerrain(seed) {
  const hash2 = (x, z, s = seed) => { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + s) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function noise(x, z) {
    const x0 = Math.floor(x), z0 = Math.floor(z), fx = smooth(x - x0), fz = smooth(z - z0);
    const a = hash2(x0, z0), b = hash2(x0 + 1, z0), c = hash2(x0, z0 + 1), d = hash2(x0 + 1, z0 + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }
  function heightAt(x, z) {
    const d = Math.hypot(x, z), flat = smooth(Math.min(1, d / 14));        // a kezdőpont körül sík
    return ((noise(x * 0.035, z * 0.035) - 0.5) * 6 + (noise(x * 0.1, z * 0.1) - 0.5) * 1.4) * flat;
  }
  return { hash2, noise, heightAt };
}

// A játékoshoz (px, pz) legközelebbi pont egy ütközőn: kör (fa, kő) vagy kapszula (rönk, a hossztengelye mentén)
export function separation(o, px, pz, out = {}) {
  let qx = o.x, qz = o.z;
  if (o.len) { const k = Math.max(-o.len, Math.min(o.len, (px - o.x) * o.ax + (pz - o.z) * o.az)); qx += o.ax * k; qz += o.az * k; }
  out.dx = px - qx; out.dz = pz - qz; out.d = Math.hypot(out.dx, out.dz); return out;
}

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5); s.bezierCurveTo(-0.15, -0.35, -0.5, -0.1, -0.5, 0.15); s.bezierCurveTo(-0.5, 0.42, -0.22, 0.55, 0, 0.3);
  s.bezierCurveTo(0.22, 0.55, 0.5, 0.42, 0.5, 0.15); s.bezierCurveTo(0.5, -0.1, 0.15, -0.35, 0, -0.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 8 });
  g.center(); return g;
}

const GREENS = [0x8fd98a, 0x9be08f, 0x86d082, 0xa6e59a];
const PASTEL = [0xff8fc8, 0xffcf3f, 0xffffff, 0x9bb8ff, 0xc9a0ff, 0xff9f43];
const CROWNS = [0x6fcf7f, 0x57c46f, 0xffa8d4, 0x8fe08f];

// opts.seed: a világ magja (teszt); opts.manual: nincs saját képkocka-ciklus, a teszt lépteti (update/render)
export function run(container, opts = {}) {
  const seed = Number.isFinite(opts.seed) ? opts.seed | 0 : (Math.random() * 1e9) | 0, manual = !!opts.manual;
  const { hash2, noise, heightAt } = makeTerrain(seed);
  container.innerHTML = `<div class="ow"><canvas class="ow-gl"></canvas><div class="ow-load">🌍 Világ építése…</div>
    <div class="ow-hint">Koppints oda, ahová fusson az unikornis! ${icon('ui-point')}</div><button class="ow-jump round" aria-label="Ugrás">${icon('ui-jump')}</button></div>`;
  const root = container.querySelector('.ow'), canvas = root.querySelector('.ow-gl');
  const loadEl = root.querySelector('.ow-load'), hint = root.querySelector('.ow-hint'), jumpBtn = root.querySelector('.ow-jump');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const quality = createQuality(renderer, { max: 1.5 });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe9ff); scene.fog = new THREE.Fog(0xbfe9ff, FOG_NEAR, FOG_FAR);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, FOG_FAR + 15);
  const { sun } = addLights(scene, { ground: 0xb6e0a0, sunAt: [20, 40, 10] }); scene.add(sun.target);

  // közös geometriák / anyagok (minden chunk ezeket használja)
  const G = {
    trunk: new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7), cone: new THREE.ConeGeometry(1.1, 2.6, 8), round: new THREE.SphereGeometry(1.0, 10, 8),
    flower: new THREE.SphereGeometry(0.13, 5, 4), rock: new THREE.DodecahedronGeometry(1, 0), log: new THREE.CylinderGeometry(0.32, 0.32, 2.0, 8),
    puddle: new THREE.CircleGeometry(1, 16), heart: heartGeometry(),
  };
  const M = {
    ground: lookMat({ vertexColors: true }),
    trunk: lookMat({ color: 0x8a5a3c }), crown: lookMat({ color: 0xffffff }),
    flower: lookMat({ color: 0xffffff }), rock: lookMat({ color: 0xb8b0c8, flatShading: true }),
    log: lookMat({ color: 0x9b6b43 }), puddle: lookMat({ color: 0x8fd0ff, transparent: true, opacity: 0.7 }),
    heart: lookMat({ color: 0xff4f8f, emissive: 0x661030 }),
  };
  const tmp = new THREE.Object3D(), col = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0), dirV = new THREE.Vector3();
  function instanced(geo, mat, list, place, colors) {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.count = list.length;
    list.forEach((it, i) => { tmp.rotation.set(0, 0, 0); tmp.quaternion.identity(); tmp.scale.setScalar(1); place(tmp, it, i); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix); if (colors) m.setColorAt(i, col.setHex(colors(it, i))); });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; return m;
  }

  // --- barátok: egy közös, példányosított rajzolás (7 rajzolási hívás, akárhány barát) ---
  const batch = createCharacterBatch(scene);
  const pals = [];                                    // világ-szintű lista: a csatlakozott barát nem a chunkhoz tartozik, így nem tűnik el
  const hearts = new THREE.InstancedMesh(G.heart, M.heart, 8); hearts.count = 0; hearts.frustumCulled = false; scene.add(hearts);

  // --- világ: chunkok ---
  const chunks = new Map(), key = (cx, cz) => cx + ',' + cz;
  function makeChunk(cx, cz) {
    const rnd = mulberry(hash2(cx, cz, seed + 7) * 4294967296 | 0);
    const ox = cx * CHUNK, oz = cz * CHUNK, group = new THREE.Group(), k = key(cx, cz);
    const colliders = [], occ = [];
    // talaj
    const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, 15, 15); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const wx = ox + pos.getX(i), wz = oz + pos.getZ(i); pos.setY(i, heightAt(wx, wz));
      col.setHex(GREENS[(noise(wx * 0.2, wz * 0.2) * 4) | 0]).offsetHSL(0, 0, (noise(wx * 0.5, wz * 0.5) - 0.5) * 0.06); colors.set([col.r, col.g, col.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, M.ground); ground.position.set(ox, 0, oz); group.add(ground);
    // Elhelyezés ütközés-ellenőrzéssel: a chunk szélétől és minden mástól is marad GAP szabad hely,
    // így két akadály közé sosem szorulhat be az unikornis (a szomszéd chunk tárgyaitól is legalább GAP).
    const place = (r, ok) => {
      const m = r + GAP / 2;
      for (let n = 0; n < 16; n++) {
        const x = ox - CHUNK / 2 + m + rnd() * (CHUNK - 2 * m), z = oz - CHUNK / 2 + m + rnd() * (CHUNK - 2 * m);
        if (Math.hypot(x, z) < 6 + r) continue;                                  // a kezdőhely szabad
        if (occ.some(o => Math.hypot(o.x - x, o.z - z) < o.r + r + GAP)) continue;
        if (ok && !ok(x, z)) continue;
        occ.push({ x, z, r }); return [x, z];
      }
      return null;
    };
    const flatness = (x, z, r) => { let lo = Infinity, hi = -Infinity; for (const [a, b] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7]]) { const h = heightAt(x + a, z + b); lo = Math.min(lo, h); hi = Math.max(hi, h); } return { lo, hi }; };
    // fák: hegyes vagy kerek lombbal; az ütköző a törzs körül van (a lomb alá be lehet futni)
    const trees = [], nTrees = 6 + ((rnd() * 7) | 0);
    for (let i = 0; i < nTrees; i++) {
      const s = 0.8 + rnd() * 0.9, r = 0.5 * s + 0.25, p = place(r); if (!p) continue;
      const t = { x: p[0], z: p[1], s, r, gy: heightAt(p[0], p[1]), round: rnd() < 0.4, k: 1, idx: 0, color: CROWNS[(rnd() * 4) | 0] };
      trees.push(t); colliders.push({ x: t.x, z: t.z, r, h: 99, solid: true });
    }
    group.add(instanced(G.trunk, M.trunk, trees, (o, t) => { o.position.set(t.x, t.gy + 0.7 * t.s, t.z); o.scale.setScalar(t.s); }));
    const cones = trees.filter(t => !t.round), rounds = trees.filter(t => t.round);
    cones.forEach((t, i) => { t.idx = i; }); rounds.forEach((t, i) => { t.idx = i; });
    const crownMesh = { cone: instanced(G.cone, M.crown, cones, (o, t) => crownPose(o, t), t => t.color), round: instanced(G.round, M.crown, rounds, (o, t) => crownPose(o, t), t => t.color) };
    group.add(crownMesh.cone, crownMesh.round);
    // sziklák: átugorhatók, a tetejükre is fel lehet ugrani
    const rocks = [], nR = 2 + ((rnd() * 3) | 0);
    for (let i = 0; i < nR; i++) {
      const s = 0.45 + rnd() * 0.3, r = s + 0.2, p = place(r); if (!p) continue;
      rocks.push({ x: p[0], z: p[1], s, a: rnd() * 6.28 }); colliders.push({ x: p[0], z: p[1], r, h: s * 1.2, solid: false, rock: true });
    }
    group.add(instanced(G.rock, M.rock, rocks, (o, r) => { o.position.set(r.x, heightAt(r.x, r.z) + r.s * 0.4, r.z); o.scale.set(r.s, r.s * 0.8, r.s); o.rotation.set(0, r.a, 0); }));
    // rönkök: csak ott, ahol a talaj nagyjából sík; a lejtőhöz igazodnak, az ütközőjük kapszula a rönk mentén
    const logs = [], nL = 1 + ((rnd() * 2) | 0), LEN = 1.0, LR = 0.32;
    for (let i = 0; i < nL; i++) {
      const a = rnd() * Math.PI, ax = Math.cos(a), az = -Math.sin(a);
      const p = place(LEN + LR, (x, z) => {
        const h1 = heightAt(x - ax * LEN, z - az * LEN), h2 = heightAt(x + ax * LEN, z + az * LEN), hc = heightAt(x, z);
        const s1 = heightAt(x + az * 0.4, z - ax * 0.4), s2 = heightAt(x - az * 0.4, z + ax * 0.4);
        return Math.abs(h1 - h2) < 0.5 && Math.abs(hc - (h1 + h2) / 2) < 0.1 && Math.abs(s1 - s2) < 0.2;
      });
      if (!p) continue;
      const [x, z] = p, h1 = heightAt(x - ax * LEN, z - az * LEN), h2 = heightAt(x + ax * LEN, z + az * LEN);
      logs.push({ x, z, ax, az, h1, h2 }); colliders.push({ x, z, ax, az, len: LEN, r: LR, h: 2 * LR, solid: false, log: true });
    }
    group.add(instanced(G.log, M.log, logs, (o, l) => {
      o.position.set(l.x, (l.h1 + l.h2) / 2 + LR - 0.03, l.z);
      dirV.set(l.ax * 2 * LEN, l.h2 - l.h1, l.az * 2 * LEN).normalize(); o.quaternion.setFromUnitVectors(UP, dirV);
    }));
    // tócsák: csak sík helyen (különben a lapos korong lebegne vagy elsüllyedne)
    const puddles = [], nP = 1 + ((rnd() * 3) | 0);
    for (let i = 0; i < nP; i++) {
      const s = i % 2 ? 1.6 : 0.9, p = place(s, (x, z) => { const f = flatness(x, z, s); return f.hi - f.lo < 0.12; }); if (!p) continue;
      puddles.push({ x: p[0], z: p[1], s, y: flatness(p[0], p[1], s).hi + 0.03 });
    }
    group.add(instanced(G.puddle, M.puddle, puddles, (o, p) => { o.position.set(p.x, p.y, p.z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.setScalar(p.s); }));
    // virágok (dísz): nem nőnek bele a fákba és a kövekbe
    const flowers = [], nFl = 50 + ((rnd() * 40) | 0);
    for (let i = 0; i < nFl; i++) {
      const x = ox + (rnd() - 0.5) * CHUNK, z = oz + (rnd() - 0.5) * CHUNK;
      if (occ.some(o => Math.hypot(o.x - x, o.z - z) < o.r)) continue;
      flowers.push([x, z]);
    }
    group.add(instanced(G.flower, M.flower, flowers, (o, f, i) => { o.position.set(f[0], heightAt(f[0], f[1]) + 0.14, f[1]); o.scale.setScalar(0.8 + (i % 3) * 0.3); }, (f, i) => PASTEL[i % PASTEL.length]));
    scene.add(group);
    // barátságos állatok helye: együtt futnak, vagy csak mosolyognak és integetnek (a figura csak közelről készül el)
    const spawns = [];
    if (rnd() < 0.75) {
      const n = 1 + (rnd() < 0.3 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const kind = KINDS[(rnd() * KINDS.length) | 0], mode = rnd() < 0.5 ? 'follow' : 'wave', ang = rnd() * 6.28, p = place(0.6); if (!p) continue;
        spawns.push({ id: k + ':' + i, kind, x: p[0], z: p[1], mode, ang, pal: null });
      }
    }
    return { group, colliders, trees, crownMesh, spawns, cx, cz, key: k };
  }
  function crownPose(o, t) {
    if (t.round) { o.position.set(t.x, t.gy + 2.0 * t.s, t.z); o.scale.set(t.s * t.k, 0.9 * t.s * t.k, t.s * t.k); }
    else { o.position.set(t.x, t.gy + 2.3 * t.s, t.z); o.scale.setScalar(t.s * t.k); }
  }
  function disposeChunk(c) {
    scene.remove(c.group);
    c.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.isMesh) o.geometry.dispose(); });   // a közös geometriák és anyagok maradnak
    for (const s of c.spawns) if (s.pal && !s.pal.follow) dropPal(s);
  }
  // A barát figurája csak a játékos közelében él (így a rajzolt barátok száma kicsi marad); a csatlakozott barát
  // soha nem tűnik el, és a helyén sem bukkan fel még egyszer.
  const joinedSpawns = new Set();
  function dropPal(s) { batch.remove(s.pal.g); pals.splice(pals.indexOf(s.pal), 1); s.pal = null; }
  function spawnPals() {
    const cx = Math.floor((P.x + CHUNK / 2) / CHUNK), cz = Math.floor((P.z + CHUNK / 2) / CHUNK);
    for (const c of chunks.values()) {
      const near = Math.abs(c.cx - cx) <= GEN_R && Math.abs(c.cz - cz) <= GEN_R;
      for (const s of c.spawns) {
        if (s.pal?.follow) continue;
        const d = near ? Math.hypot(s.x - P.x, s.z - P.z) : Infinity;
        if (!s.pal && d < PAL_IN && !joinedSpawns.has(s.id)) s.pal = addPal(s);
        else if (s.pal && d > PAL_OUT) dropPal(s);
      }
    }
  }
  function ensure(px, pz, budget = 1) {                 // a játékos körül gyártjuk a világot (kevés darab / képkocka)
    const cx = Math.floor((px + CHUNK / 2) / CHUNK), cz = Math.floor((pz + CHUNK / 2) / CHUNK);
    const need = [];
    for (let dx = -GEN_R; dx <= GEN_R; dx++) for (let dz = -GEN_R; dz <= GEN_R; dz++) if (!chunks.has(key(cx + dx, cz + dz))) need.push([cx + dx, cz + dz, Math.hypot(dx, dz)]);
    need.sort((a, b) => a[2] - b[2]);
    let made = 0;
    for (const [x, z] of need) { if (made >= budget) break; chunks.set(key(x, z), makeChunk(x, z)); made++; }
    for (const [k, c] of chunks) if (Math.abs(c.cx - cx) > KEEP_R || Math.abs(c.cz - cz) > KEEP_R) { disposeChunk(c); chunks.delete(k); }
    return need.length - made;
  }
  // a környező 3×3 chunk ütközői
  function eachCollider(x, z, fn) {
    const cx = Math.floor((x + CHUNK / 2) / CHUNK), cz = Math.floor((z + CHUNK / 2) / CHUNK);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = chunks.get(key(cx + a, cz + b)); if (c) for (const o of c.colliders) fn(o); }
  }

  function addPal(s) {
    const g = makeCharacter(s.kind); g.position.set(s.x, heightAt(s.x, s.z), s.z); g.rotation.y = s.ang;
    batch.add(g);
    const p = { g, kind: s.kind, x: s.x, z: s.z, ang: s.ang, mode: s.mode, spawn: s, follow: false, slot: -1, greetT: -99, v: 0, seed: (s.x * 13.1 + s.z * 7.7) % 10 };
    pals.push(p); return p;
  }

  // --- játékos ---
  const unicorn = makeCharacter('unicorn', opts.avatar || {});   // a gyerek saját, felöltöztetett unikornisa
  unicorn.scale.setScalar(1.15);
  unicorn.rotation.order = 'YXZ';                     // előbb a fordulás, utána a bólintás: ugráskor nem dől oldalra
  scene.add(unicorn); batch.add(unicorn);
  const P = { x: 0, z: 0, y: 0, vy: 0, grounded: true, ang: 0, speed: 0, target: null, tap: false, best: Infinity, stall: 0, bump: 0, tilt: 0, avoid: null, avoidSide: 1, moved: 0 };
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2(), hit = new THREE.Vector3(), TGT = { x: 0, z: 0 };
  function aim(clientX, clientY) {
    const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    plane.constant = -heightAt(P.x, P.z); ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) { TGT.x = hit.x; TGT.z = hit.z; P.target = TGT; }
  }
  // Érintések: minden ujjat külön követünk. A legutóbb letett ujj irányít; ha felemeli, a még lent lévő másik veszi át.
  // A Pencil elsőbbséget kap: amíg lent van (vagy ha a tenyér előbb ért le), a tenyér nem irányít.
  const pointers = new Map();
  let steer = null;
  canvas.addEventListener('pointerdown', e => {
    const rec = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, t0: t, palm: false };
    if (e.pointerType === 'pen') { for (const p of pointers.values()) if (p.type === 'touch') p.palm = true; }
    else if (e.pointerType === 'touch' && [...pointers.values()].some(p => p.type === 'pen')) rec.palm = true;
    pointers.set(e.pointerId, rec);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (rec.palm) return;
    steer = rec; P.tap = false; aim(rec.x, rec.y); hint.style.opacity = 0;
  });
  canvas.addEventListener('pointermove', e => { const rec = pointers.get(e.pointerId); if (rec) { rec.x = e.clientX; rec.y = e.clientY; } });
  const release = e => {
    const rec = pointers.get(e.pointerId); pointers.delete(e.pointerId);
    if (!rec || rec !== steer) return;
    const other = [...pointers.values()].reverse().find(p => !p.palm);
    if (other) { steer = other; return; }
    steer = null;
    if (e.type === 'pointerup' && t - rec.t0 < TAP) { P.tap = true; P.best = Infinity; P.stall = 0; }   // koppintás: a cél megmarad, amíg oda nem ér
    else P.target = null;                                                                               // tartott ujj felengedve: megáll
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  function jump() { if (P.grounded) { P.vy = JUMP_V; P.grounded = false; play('boing'); } }
  jumpBtn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); jump(); });
  const keys = new Set();
  const kd = e => { keys.add(e.code); if (e.code === 'Space') { e.preventDefault(); jump(); } }, ku = e => keys.delete(e.code);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  const S = { dx: 0, dz: 0, d: 0 }, camGoal = new THREE.Vector3(), head = new THREE.Vector3();
  let t = 0, stepT = 0, bumpT = -9, voiceT = -9;
  function greet(p) { p.greetT = t; if (t - voiceT > 1.4) { voiceT = t; animalVoice(p.kind); } }

  function update(dt) {
    t += dt;
    if (steer) aim(steer.x, steer.y);                 // tartott ujj: minden képkockában újra célzunk (a kamera is mozog)
    // irány: a cél felé vagy nyilakkal
    let dx = 0, dz = 0;
    if (P.target) {
      dx = P.target.x - P.x; dz = P.target.z - P.z; const d = Math.hypot(dx, dz);
      if (d < 0.6) { if (!steer) P.target = null; dx = dz = 0; }
      else {
        dx /= d; dz /= d;
        if (P.tap) {                                   // nem jut közelebb (pl. egy fa közepére koppintott): szépen megáll
          if (d < P.best - 0.2) { P.best = d; P.stall = 0; } else if ((P.stall += dt) > 1.2) { P.target = null; P.tap = false; dx = dz = 0; }
        }
      }
    }
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1; if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dz -= 1; if (keys.has('ArrowDown') || keys.has('KeyS')) dz += 1;
    const m = Math.hypot(dx, dz);
    if (m > 0.01) {
      dx /= m; dz /= m;
      // fák kikerülése: ha fa áll az úton, oldalra lép (a fát mindig ugyanarról az oldalról kerüli meg, nem tétovázik)
      let near = null, nearAlong = 9, nearLat = 0;
      eachCollider(P.x, P.z, o => {
        if (!o.solid) return;
        const ox = o.x - P.x, oz = o.z - P.z, along = ox * dx + oz * dz;
        if (along <= 0 || along > o.r + 2.4) return;
        const lat = -ox * dz + oz * dx;
        if (Math.abs(lat) > o.r + PR + 0.1 || along >= nearAlong) return;
        near = o; nearAlong = along; nearLat = lat;
      });
      if (near) {
        if (near !== P.avoid) { P.avoid = near; P.avoidSide = nearLat > 0 ? -1 : 1; }
        const w = 1.8 * (1 - Math.abs(nearLat) / (near.r + PR + 0.1)) + 0.25, nx = -dz * P.avoidSide * w, nz = dx * P.avoidSide * w;
        dx += nx; dz += nz; const k = Math.hypot(dx, dz); dx /= k; dz /= k;
      } else P.avoid = null;
      // ugrás-segítő: ha kő vagy rönk jön, magától átugorja
      if (P.grounded && P.speed > 2.5) {
        let ahead = false;
        eachCollider(P.x, P.z, o => {
          if (ahead || o.solid || P.y >= o.h - 0.3) return;
          for (const L of [0.9, 1.7]) if (separation(o, P.x + dx * L, P.z + dz * L, S).d < o.r + PR) { ahead = true; return; }
        });
        if (ahead) jump();
      }
    }
    P.speed += ((m > 0.01 ? WALK : 0) - P.speed) * Math.min(1, dt * 7);
    const x0 = P.x, z0 = P.z;
    if (m > 0.01) {
      P.ang += angDiff(P.ang, Math.atan2(-dx, -dz)) * Math.min(1, dt * 9);
      P.x += dx * P.speed * dt; P.z += dz * P.speed * dt;
    }
    // ütközések: a fák kikerülendők; a kő és a rönk csak akkor állja útját, ha nem vagyunk fölötte
    eachCollider(P.x, P.z, o => {
      if (!o.solid && P.y >= o.h - 0.3) return;
      separation(o, P.x, P.z, S); const rr = o.r + PR;
      if (S.d >= rr) return;
      if (S.d < 1e-4) { S.dx = -dx || 1; S.dz = -dz; S.d = Math.hypot(S.dx, S.dz); }
      const k = (rr - S.d) / S.d; P.x += S.dx * k; P.z += S.dz * k;
      if (!o.solid && t - bumpT > 0.8 && P.speed > 3) { bumpT = t; P.bump = 0.25; play('bump'); }   // kis "bupp", nincs büntetés
    });
    P.moved += Math.hypot(P.x - x0, P.z - z0);
    // függőleges: ugrás, esés, kő vagy rönk tetején állás
    let floor = 0;
    eachCollider(P.x, P.z, o => { if (!o.solid && P.y >= o.h - 0.3 && separation(o, P.x, P.z, S).d < o.r + PR * 0.4) floor = Math.max(floor, o.h); });
    if (P.grounded && P.y > floor + 0.02) { P.grounded = false; P.vy = 0; }       // lelépett a kő tetejéről
    if (!P.grounded) {
      P.vy += GRAV * dt; P.y += P.vy * dt;
      if (P.y <= floor) { if (P.vy < -5) play('thud'); P.y = floor; P.vy = 0; P.grounded = true; }
    }
    P.bump = Math.max(0, P.bump - dt);
    const gy = heightAt(P.x, P.z);
    unicorn.position.set(P.x, gy + P.y + (P.bump > 0 ? Math.sin(P.bump * 30) * 0.05 : 0), P.z);
    unicorn.rotation.y = P.ang;
    P.tilt += ((P.grounded ? 0 : P.vy > 0 ? -0.25 : 0.12) - P.tilt) * Math.min(1, dt * 8);
    unicorn.rotation.x = P.tilt;
    animateRunner(unicorn, t, P.grounded ? Math.min(1, P.speed / WALK) : 0.6, !P.grounded);
    // lépések hangja (halk patakopogás)
    if (P.grounded && P.speed > 1.5) { if ((stepT -= dt) <= 0) { stepT = 0.3; play('step'); } } else stepT = 0.05;

    updatePals(dt);
    // kamera: követi az unikornist (az irány a képernyőn állandó, így "oda megy, ahová mutatsz")
    const landscape = root.clientWidth >= root.clientHeight;
    camGoal.set(P.x, gy + (landscape ? 10 : 13), P.z + (landscape ? 11 : 14));
    camera.position.lerp(camGoal, Math.min(1, dt * 4)); camera.lookAt(P.x, gy + 0.8, P.z - 2);
    sun.position.set(P.x + 20, 40, P.z + 10); sun.target.position.set(P.x, 0, P.z);
    shrinkCrowns(dt, gy);
    ensure(P.x, P.z, 1);
    spawnPals();
    batch.update();
  }

  function updatePals(dt) {
    const used = new Set(pals.filter(p => p.follow).map(p => p.slot));
    let hi = 0;
    const ca = Math.cos(P.ang), sa = Math.sin(P.ang);
    for (const p of pals) {
      const fx = P.x - p.x, fz = P.z - p.z, dist = Math.hypot(fx, fz);
      p.g.visible = dist < PAL_IN + 4;
      let v = 0;
      if (!p.follow && dist < 6) {
        if (p.mode === 'follow' && used.size < MAX_FOLLOWERS) {      // csatlakozik: szabad helyre áll a V alakzatban
          p.follow = true; joinedSpawns.add(p.spawn.id); for (let s = 0; s < MAX_FOLLOWERS; s++) if (!used.has(s)) { p.slot = s; used.add(s); break; }
          greet(p);
          opts.heart?.(); opts.gift?.();                      // új barát csatlakozik: barátság (szív); az első hozza az ajándékot
        } else if (t - p.greetT > 12) greet(p);
      }
      if (p.follow) {
        const [side, back] = SLOTS[p.slot];
        const tx = P.x + ca * side + sa * back, tz = P.z - sa * side + ca * back;
        const ddx = tx - p.x, ddz = tz - p.z, dd = Math.hypot(ddx, ddz);
        if (dd > 0.4) {
          v = Math.min(WALK * (dd > 8 ? 1.6 : 1.1), dd * 3.5);
          p.x += (ddx / dd) * v * dt; p.z += (ddz / dd) * v * dt;
          p.ang += angDiff(p.ang, Math.atan2(-ddx, -ddz)) * Math.min(1, dt * 8);
        } else p.ang += angDiff(p.ang, P.ang) * Math.min(1, dt * 4);
        if (dd < 8) eachCollider(p.x, p.z, o => {                    // közelről a barát is kikerüli a fát (messziről átvág, hogy utolérjen)
          if (!o.solid) return;
          separation(o, p.x, p.z, S); const rr = o.r + 0.4;
          if (S.d < rr && S.d > 1e-4) { const k = (rr - S.d) / S.d; p.x += S.dx * k; p.z += S.dz * k; }
        });
        const px = p.x - P.x, pz = p.z - P.z, pd = Math.hypot(px, pz);   // ne álljon bele az unikornisba
        if (pd < 1.0 && pd > 1e-4) { p.x = P.x + px / pd; p.z = P.z + pz / pd; }
      } else if (dist < 14) p.ang += angDiff(p.ang, Math.atan2(fx, fz)) * Math.min(1, dt * 4);   // feléd fordul és integet
      p.g.position.set(p.x, heightAt(p.x, p.z), p.z); p.g.rotation.y = p.ang;
      const greeting = t - p.greetT < 1.6;
      animateCharacter(p.g, t + p.seed, Math.min(1, v / WALK), greeting || (!p.follow && dist < 12));
      if (greeting && hi < hearts.instanceMatrix.count) {           // köszönéskor szív száll fel
        const a = t - p.greetT;
        tmp.position.set(p.x, p.g.position.y + 1.9 + a * 0.7, p.z); tmp.rotation.set(0, t * 3, 0); tmp.scale.setScalar(0.42 * Math.min(1, a * 5) * (a > 1.3 ? (1.6 - a) / 0.3 : 1));
        tmp.updateMatrix(); hearts.setMatrixAt(hi++, tmp.matrix);
      }
    }
    hearts.count = hi; hearts.instanceMatrix.needsUpdate = true;
  }

  // Ha egy fa lombja a kamera és az unikornis közé kerül, a lomb szépen összemegy (utána visszanő).
  function shrinkCrowns(dt, gy) {
    head.set(P.x, gy + P.y + 1.2, P.z);
    const C = camera.position, sx = head.x - C.x, sy = head.y - C.y, sz = head.z - C.z, L2 = sx * sx + sy * sy + sz * sz;
    const cx = Math.floor((P.x + CHUNK / 2) / CHUNK), cz = Math.floor((P.z + CHUNK / 2) / CHUNK);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const c = chunks.get(key(cx + a, cz + b)); if (!c) continue;
      for (const tr of c.trees) {
        let goal = 1;
        if (tr.z > P.z - 1.5 && tr.z < C.z + 2 && Math.abs(tr.x - P.x) < 4.5) {
          const ky = tr.gy + (tr.round ? 2.0 : 2.3) * tr.s, ux = tr.x - C.x, uy = ky - C.y, uz = tr.z - C.z;
          const u = Math.max(0, Math.min(1, (ux * sx + uy * sy + uz * sz) / L2));
          const d = Math.hypot(ux - sx * u, uy - sy * u, uz - sz * u);
          if (d < 1.15 * tr.s) goal = 0.25;
        }
        if (Math.abs(tr.k - goal) < 0.002) continue;
        tr.k += (goal - tr.k) * Math.min(1, dt * 6); if (Math.abs(tr.k - goal) < 0.002) tr.k = goal;
        const mesh = tr.round ? c.crownMesh.round : c.crownMesh.cone;
        tmp.rotation.set(0, 0, 0); tmp.quaternion.identity(); crownPose(tmp, tr); tmp.updateMatrix(); mesh.setMatrixAt(tr.idx, tmp.matrix); mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  function size() { const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(root);

  let raf = 0, last = performance.now(), ready = false, alive = true;
  camera.position.set(0, 10, 11); camera.lookAt(0, 0.8, -2);
  const render = () => renderer.render(scene, camera);
  function start() {
    ready = true; loadEl.style.display = 'none'; hint.style.opacity = 1; setTimeout(() => { if (alive) hint.style.opacity = 0; }, 8000);
    say('Szabad futás! Koppints oda, ahová fusson az unikornis. Köszönj a barátoknak!');
  }
  // kezdeti világ előre legenerálva (néhány darab képkockánként), csak utána indul a futás
  function preload() {
    if (!alive) return;
    const left = ensure(0, 0, 3);
    if (left > 0) { loadEl.textContent = `🌍 Világ építése… ${Math.round((1 - left / 25) * 100)}%`; setTimeout(preload, 16); }
    else { spawnPals(); start(); }
  }
  if (manual) { ensure(0, 0, 99); spawnPals(); start(); } else preload();
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (ready) { update(dt); quality.tick(); } render(); raf = requestAnimationFrame(frame); }
  if (!manual) raf = requestAnimationFrame(frame);

  // tesztekhez
  container.__ow = {
    P, chunks, seed, canvas, camera, update, render, jump, heightAt, isReady: () => ready, player: () => unicorn,
    pals: () => pals, followers: () => pals.filter(p => p.follow),
    colliders: () => [...chunks.values()].flatMap(c => c.colliders),
    trees: () => [...chunks.values()].flatMap(c => c.trees),
    setTarget: (x, z) => { TGT.x = x; TGT.z = z; P.target = TGT; P.tap = true; P.best = Infinity; P.stall = 0; },
    stats: () => ({ chunks: chunks.size, pals: pals.length, batch: batch.size - 1 /* a játékos unikornisa nélkül */, instances: batch.meshes.reduce((s, m) => s + m.count, 0), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
  };

  return () => {
    alive = false; cancelAnimationFrame(raf); ro?.disconnect();
    window.removeEventListener('resize', size); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    for (const c of chunks.values()) disposeChunk(c);
    chunks.clear(); pals.length = 0; batch.dispose(); hearts.dispose();
    Object.values(G).forEach(g => g.dispose()); Object.values(M).forEach(m => m.dispose());
    renderer.dispose(); renderer.forceContextLoss?.();
  };
}
