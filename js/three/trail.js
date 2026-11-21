// Varázsnyom (2. kör, az öltöztető "varázs" füle): a gyerek unikornisa után csillagok, szívek, szivárványpöttyök vagy
// buborékok szállnak. Egy példányosított háló (egyetlen rajzolási hívás), legfeljebb CAP darab egyszerre: a futó unikornis
// minden STEP egységnyi út után hagy egyet (álló helyzetben nem), és a darab felszáll, megpördül, majd összemegy.
// Nyugodt módban (kevesebb mozgás) ritkább és nem pörög. A Varázsvilág, a verseny és az öltöztető használja.
import * as THREE from '../../vendor/three.module.js';

const CAP = 48, LIFE = 1.15, STEP = 0.55;
const RB = [0xff5d5d, 0xffb020, 0xffe14d, 0x4cc38a, 0x4a7dff, 0x8e5be8];
const LOOK = {
  stars: { colors: [0xffcf3f, 0xffe680, 0xffb020], size: 0.24 },
  hearts: { colors: [0xff5d8f, 0xff8fc8, 0xff2f7a], size: 0.22 },
  rainbow: { colors: RB, size: 0.14 },
  bubbles: { colors: [0xdff6ff, 0xcfe8ff, 0xe6dcff], size: 0.18, opacity: 0.6 },
};
export const TRAILS = Object.keys(LOOK);

function flat(pts) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false, curveSegments: 3 }); g.translate(0, 0, -0.175); return g;
}
function geometry(kind) {
  if (kind === 'stars') return flat(Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.45 : 1, a = Math.PI / 2 + i * Math.PI / 5; return [Math.cos(a) * r, Math.sin(a) * r]; }));
  if (kind === 'hearts') return flat(Array.from({ length: 20 }, (_, i) => { const t = (i / 20) * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return [x / 17, (y + 2) / 17]; }));
  return new THREE.SphereGeometry(1, kind === 'bubbles' ? 12 : 8, kind === 'bubbles' ? 8 : 6);
}

// kind: 'stars' | 'hearts' | 'rainbow' | 'bubbles' (más: nincs nyom, null)
export function createTrail(scene, kind, { calm = () => false, scale = 1 } = {}) {
  const look = LOOK[kind]; if (!look) return null;
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: !!look.opacity, opacity: look.opacity ?? 1, depthWrite: !look.opacity, fog: false });
  const mesh = new THREE.InstancedMesh(geometry(kind), mat, CAP);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < CAP; i++) { mesh.setMatrixAt(i, zero); mesh.setColorAt(i, col.setHex(look.colors[i % look.colors.length])); }
  mesh.frustumCulled = false; scene.add(mesh);
  const P = Array.from({ length: CAP }, () => ({ t0: -1e9, x: 0, y: 0, z: 0, dx: 0, dz: 0, spin: 0 }));
  let next = 0, last = null, carry = 0, colorI = 0, live = 0;
  const emit = (x, y, z, now) => {
    const i = next, p = P[i]; next = (next + 1) % CAP;
    p.t0 = now; p.x = x + (Math.random() - 0.5) * 0.25 * scale; p.y = y; p.z = z + (Math.random() - 0.5) * 0.25 * scale;
    p.dx = (Math.random() - 0.5) * 0.3; p.dz = (Math.random() - 0.5) * 0.3; p.spin = Math.random() * Math.PI * 2;
    mesh.setColorAt(i, col.setHex(look.colors[colorI++ % look.colors.length])); mesh.instanceColor.needsUpdate = true;
  };
  return {
    kind, mesh,
    // a nyom forrása (az unikornis farka mögött), minden képkockában: megtett út szerint hagy nyomot
    follow(x, y, z, now) {
      if (last) {
        const d = Math.hypot(x - last.x, z - last.z);
        if (d > 3) carry = 0;                              // ugrás (pl. újrakezdés): nem húz csíkot a két hely közé
        else carry += d;
        const step = STEP * scale * (calm() ? 2.2 : 1);
        while (carry >= step) { carry -= step; emit(x, y, z, now); }
      }
      last = { x, z };
    },
    // egy kis csokor egy helyben (az öltöztetőben, amikor a gyerek kiválasztja)
    puff(x, y, z, now, n = 6) { for (let i = 0; i < n; i++) emit(x + (i - n / 2) * 0.12 * scale, y + Math.random() * 0.2, z, now + i * 70); },
    step(now) {
      live = 0;
      for (let i = 0; i < CAP; i++) {
        const p = P[i], a = (now - p.t0) / 1000 / LIFE;
        if (a < 0 || a >= 1) { mesh.setMatrixAt(i, zero); continue; }
        live++;
        const k = look.size * scale * (a < 0.15 ? a / 0.15 : 1 - Math.pow((a - 0.15) / 0.85, 2) * 0.95);
        v.set(p.x + p.dx * a, p.y + a * 0.55 * scale, p.z + p.dz * a);
        // a lapos csillag és szív a kamera felé dől (fentről-hátulról nézzük), és csak billeg, nem fordul élére
        q.setFromEuler(e.set(-0.7, calm() ? 0 : Math.sin(p.spin + a * 7) * 0.45, calm() ? 0 : Math.sin(p.spin) * 0.3)); s3.set(k, k, k);
        mesh.setMatrixAt(i, m4.compose(v, q, s3));
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    live: () => live,                                       // tesztekhez: hány darab látszik most
    dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); mesh.dispose(); },
  };
}
