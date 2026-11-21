// Ajándékvirágok a kertben (js/gifts.js FLOWER_GIFTS): ha a gyerek a létra minden fokát megszerezte, minden ajándék egy
// virág. Négyféle, alakra is különböző: tulipán (kehely), harangvirág (lógó harangok), margaréta (sok fehér szirom),
// aranyvirág (két sor csillagos szirom, mélyarany szín, csillanással). Fajtánként egy példányosított háló (4 rajzolási hívás).
// Élettartam, mint a többi virágé: egyszerre legfeljebb GIFT_RING nyílik; a j. virág a j % GIFT_RING helyen, és ha ott
// már nyílik egy régebbi, az előbb elhervad. Nem az órához kötött (nem hervad el, amíg a gyerek nem játszik).
import * as THREE from '../vendor/three.module.js';
import { merge, part } from './geo.js';
import { giftSpot, GIFT_RING } from './friends.js';
import { FLOWER_GIFTS, flowerGiftAt } from './gifts.js';

const SIZE = 1.3;
const tilt = new THREE.Matrix4().makeRotationX(0.55);                   // a virág arca a néző felé dől (mint a kert virágainál)
const head = (y, m) => new THREE.Matrix4().makeTranslation(0, y, 0).multiply(tilt).multiply(m);
const stem = (h = 0.95) => [
  part(new THREE.CylinderGeometry(0.035, 0.05, h, 5, 1, true), 0x3f9a45, [0, h / 2, 0]),
  part(new THREE.SphereGeometry(0.12, 6, 4), 0x58b85c, [0.12, 0.32, 0], [0, 0, -0.7], [1.6, 0.45, 0.8]),
  part(new THREE.SphereGeometry(0.12, 6, 4), 0x58b85c, [-0.12, 0.45, 0], [0, 0, 0.7], [1.6, 0.45, 0.8]),
];

function build(id) {
  if (id === 'virag:tulipan') return merge([...stem(0.9),
    ...Array.from({ length: 3 }, (_, k) => { const a = k * 2.094; return part(new THREE.SphereGeometry(0.12, 8, 6), 0xf2445b, [Math.cos(a) * 0.07, 1.04, Math.sin(a) * 0.07], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25], [1, 2.1, 0.75]); }),
    part(new THREE.SphereGeometry(0.1, 8, 6), 0xd42a45, [0, 1.0, 0], [0, 0, 0], [1, 1.6, 1])]);
  if (id === 'virag:harang') return merge([...stem(1.0),
    part(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 5), 0x3f9a45, [0.16, 1.02, 0], [0, 0, -1.25]),
    ...[[0.34, 0.92], [0.12, 0.84], [-0.06, 0.92]].flatMap(([x, y]) => [
      part(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 4), 0x3f9a45, [x, y + 0.08, 0]),
      part(new THREE.ConeGeometry(0.17, 0.3, 9), 0x4f7dff, [x, y - 0.08, 0]),
      part(new THREE.SphereGeometry(0.06, 6, 4), 0xfff3a0, [x, y - 0.24, 0]),
    ])]);
  if (id === 'virag:margareta') return merge([...stem(0.95),
    ...Array.from({ length: 14 }, (_, k) => { const a = k * Math.PI * 2 / 14; return { geo: new THREE.SphereGeometry(0.1, 6, 4), color: 0xffffff, matrix: head(0.98, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0)), new THREE.Vector3(2.3, 0.3, 0.75))) }; }),
    { geo: new THREE.SphereGeometry(0.13, 8, 6), color: 0xffc21a, matrix: head(0.98, new THREE.Matrix4().makeScale(1, 0.55, 1)) }]);
  // aranyvirág: két sor hegyes szirom (lapított gúla), a középen világos szem
  return merge([...stem(1.0),
    ...[0, 1].flatMap(r => Array.from({ length: 6 }, (_, k) => {
      const a = (k + r * 0.5) * Math.PI / 3, R = r ? 0.2 : 0.3;
      const m = new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * R, r * 0.03, Math.sin(a) * R), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, -Math.PI / 2)), new THREE.Vector3(0.35, r ? 0.8 : 1, 1));   // lapítás a virág arca felé
      return { geo: new THREE.ConeGeometry(0.11, r ? 0.3 : 0.42, 4), color: r ? 0xffe680 : 0xffc21a, matrix: head(1.02, m) };
    })),
    { geo: new THREE.SphereGeometry(0.12, 8, 6), color: 0xfff3a0, matrix: head(1.02, new THREE.Matrix4().makeTranslation(0, 0.06, 0).multiply(new THREE.Matrix4().makeScale(1, 0.6, 1))) }]);
}

// csillanás: négyágú fehér-arany csillag (a sprite mindig a kamera felé néz)
function glintTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,236,150,.9)'); g.addColorStop(1, 'rgba(255,200,40,0)');
  x.fillStyle = g; x.beginPath();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 7 : 31; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
  x.closePath(); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createGiftFlowers(group, { material, goldMaterial, calm = () => false }) {
  const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const meshes = new Map(FLOWER_GIFTS.map(g => {
    const mesh = new THREE.InstancedMesh(build(g.id), g.id === 'virag:arany' ? goldMaterial : material, GIFT_RING);
    for (let s = 0; s < GIFT_RING; s++) mesh.setMatrixAt(s, zero);
    mesh.count = GIFT_RING; mesh.frustumCulled = false; group.add(mesh);
    return [g.id, mesh];
  }));
  const shown = new Array(GIFT_RING).fill(-1), anims = [];
  let given = 0;
  const put = (j, k, sink = 0) => {
    const mesh = meshes.get(flowerGiftAt(j).id), slot = j % GIFT_RING, p = giftSpot(slot), s = SIZE * k;
    mesh.setMatrixAt(slot, k > 0 ? m4.makeScale(s, s, s).setPosition(p.x, -sink, p.z) : zero); mesh.instanceMatrix.needsUpdate = true;
  };
  // csillanások: néhány közös sprite, az aranyvirágokon néha felvillan egy, nyíláskor több
  const tex = glintTexture();
  const glints = Array.from({ length: 6 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.visible = false; group.add(s); return { s, t0: -1e9, len: 900 };
  });
  const glintAt = (j, now, len = 900, dx = 0) => {
    const g = glints.reduce((a, b) => (a.t0 < b.t0 ? a : b)), p = giftSpot(j % GIFT_RING);
    g.s.position.set(p.x + dx + (Math.random() - 0.5) * 0.25, SIZE * 1.12 + Math.random() * 0.2, p.z + 0.25); g.t0 = now; g.len = len; g.s.visible = true;
  };
  let nextGlint = 0;
  return {
    // n: eddig kapott ajándékvirágok száma; animate: az új virág kinyílik (a régi előbb elhervad a helyén)
    set(n, animate = false) {
      n = Math.max(0, n | 0);
      const now = performance.now();
      for (let j = Math.max(given, n - GIFT_RING); j < n; j++) {
        const slot = j % GIFT_RING, old = shown[slot];
        if (animate) anims.push({ j, old: old >= 0 ? old : undefined, born: now + 600 });
        else { if (old >= 0) put(old, 0); put(j, 1); }
        shown[slot] = j;
      }
      given = Math.max(given, n);
    },
    step(now) {
      for (let k = anims.length - 1; k >= 0; k--) {
        const a = anims[k]; if (now < a.born) continue;
        if (a.old !== undefined) {                                       // a régi elhervad: lekonyul és eltűnik
          const w = (now - a.born) / 900;
          if (w < 1) { put(a.old, Math.max(0.01, 1 - w * w), w * 0.35); continue; }
          put(a.old, 0); delete a.old; a.born = now;
        }
        const age = (now - a.born) / 800;
        if (age >= 1) { put(a.j, 1); anims.splice(k, 1); if (!calm()) for (let q = 0; q < 3; q++) glintAt(a.j, now + q * 180, 900, (q - 1) * 0.3); }
        else put(a.j, Math.max(0.01, 1 - Math.pow(1 - age, 3)) * (1 + Math.sin(age * Math.PI) * 0.3));
      }
      // az aranyvirágok néha megcsillannak (nyugodt módban nem)
      if (!calm() && now > nextGlint) {
        const golds = shown.filter(j => j >= 0 && flowerGiftAt(j).id === 'virag:arany' && !anims.some(a => a.j === j));
        if (golds.length) glintAt(golds[Math.floor(Math.random() * golds.length)], now, 1000);
        nextGlint = now + 1400 + Math.random() * 1200;
      }
      for (const g of glints) {
        if (!g.s.visible) continue;
        const t = (now - g.t0) / g.len;
        if (t < 0) { g.s.scale.setScalar(0.001); continue; }
        if (t >= 1) { g.s.visible = false; continue; }
        const s = Math.sin(t * Math.PI) * 0.55; g.s.scale.set(s, s, 1); g.s.material.rotation = t * 1.2;
      }
    },
    // tesztekhez: helyenként a most nyíló virág fajtája (vagy null)
    debug: () => shown.map(j => (j >= 0 ? flowerGiftAt(j).id : null)),
    count: () => shown.filter(j => j >= 0).length,
  };
}
