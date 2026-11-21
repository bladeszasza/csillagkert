// Tűzijáték a kert fölött (2. kör: a tarisznya meglepetése). Néhány rakéta száll fel a kert egén, és színes szikrákra
// pattan szét; a szikrák lassan hullanak és összemennek. Egyetlen példányosított háló (egy rajzolási hívás), és csak akkor
// dolgozik, amikor éppen tűzijáték van. Nyugodt módban kevesebb és lassabb.
import * as THREE from '../vendor/three.module.js';
import { ding } from './audio.js';

const CAP = 260, SPARKS = 40, R = 0.15;
const COLORS = [0xff5d8f, 0xffcf3f, 0x4aa8ff, 0x4cc38a, 0xc9a3ff, 0xff9f43, 0xffffff];

export function createFireworks(scene, { calm = () => false } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), mat, CAP);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < CAP; i++) { mesh.setMatrixAt(i, zero); mesh.setColorAt(i, col.setHex(0xffffff)); }
  mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
  const P = Array.from({ length: CAP }, () => ({ on: false }));
  const rockets = [];
  let next = 0, until = 0;
  const take = () => { const i = next; next = (next + 1) % CAP; return i; };
  function burst(x, y, z, now, c) {
    for (let k = 0; k < SPARKS; k++) {
      const i = take(), a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u), v = 3.2 + Math.random() * 1.0;
      Object.assign(P[i], { on: true, t0: now, life: 1.5 + Math.random() * 0.5, x, y, z, vx: Math.cos(a) * s * v, vy: u * v, vz: Math.sin(a) * s * v * 0.5, r: R });
      mesh.setColorAt(i, col.setHex(k % 5 === 0 ? 0xffffff : c));
    }
    mesh.instanceColor.needsUpdate = true;
    ding(520 + Math.random() * 260, { dur: 0.5, vol: 0.45, glide: 0.6 });
  }
  return {
    // center: a kép közepének x-e a kertben (a kamera ott néz); a rakéták e körül szállnak fel
    launch(center = 0, now = performance.now()) {
      const n = calm() ? 3 : 6;
      for (let k = 0; k < n; k++) {
        const t = now + k * (calm() ? 700 : 420);
        rockets.push({ t0: t, x: center + (Math.random() - 0.5) * 8, z: -3.5 - Math.random() * 2.5, h: 3.4 + Math.random() * 1.2, c: COLORS[(k + Math.floor(Math.random() * 7)) % COLORS.length], i: take() });
        until = Math.max(until, t + 2800);
      }
      mesh.visible = true;
    },
    step(now) {
      if (!mesh.visible) return;
      for (let k = rockets.length - 1; k >= 0; k--) {
        const r = rockets[k], a = (now - r.t0) / 700;
        if (a < 0) continue;
        if (a >= 1) { mesh.setMatrixAt(r.i, zero); burst(r.x, r.h, r.z, now, r.c); rockets.splice(k, 1); continue; }
        mesh.setMatrixAt(r.i, m4.makeScale(0.13, 0.3, 0.13).setPosition(r.x, 0.5 + (r.h - 0.5) * (1 - (1 - a) ** 2), r.z));
        mesh.setColorAt(r.i, col.setHex(0xfff3b0)); mesh.instanceColor.needsUpdate = true;
      }
      for (let i = 0; i < CAP; i++) {
        const p = P[i]; if (!p.on) continue;
        const s = (now - p.t0) / 1000, a = s / p.life;
        if (a >= 1) { p.on = false; mesh.setMatrixAt(i, zero); continue; }
        const drag = 1 - Math.exp(-s * 2.2);                                // gyorsan lassul, aztán lassan hullik
        const x = p.x + p.vx * drag / 2.2, y = p.y + p.vy * drag / 2.2 - 0.9 * s * s, z = p.z + p.vz * drag / 2.2, k = p.r * (1 - a * a);
        mesh.setMatrixAt(i, m4.makeScale(k, k, k).setPosition(x, y, z));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (now > until && !rockets.length) { mesh.visible = false; for (let i = 0; i < CAP; i++) { P[i].on = false; mesh.setMatrixAt(i, zero); } }
    },
    busy: () => mesh.visible,
    dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); mesh.dispose(); },
  };
}
